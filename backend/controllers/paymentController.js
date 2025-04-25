import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Order } from '../models/orderSchema.js';
import mongoose from 'mongoose';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, runTransaction, get, set } from "firebase/database";
import Joi from 'joi'; // Added for input validation
import rateLimit from 'express-rate-limit'; // Added for rate limiting
// Configurations
dotenv.config();
const RAZORPAY_IPS = ['54.209.155.0/24', '54.208.86.0/24'];
// Constants
const INVENTORY_USER_ID = process.env.FIREBASE_COLLECTION || 'AmIewDOW747kvqkfhNE2';
const INVENTORY_PATH = `users/${INVENTORY_USER_ID}`;
const DEFAULT_INVENTORY = {
  limit: 1000,
  stock: 0,
  reserved: 0,
  lastUpdated: Date.now()
};

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  databaseURL: process.env.FIREBASE_DATABASE_URL
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
// Rate limiter for payment endpoints
export const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many payment attempts, please try again later'
});

const calculateActualQuantity = (item) => {
  if (item.itemType && item.itemType.toLowerCase() === 'dozen') {
    return item.quantity * 12;
  }
  return item.quantity;
};

const inventoryService = {
  getInventory: async () => {
    const inventoryRef = ref(database, INVENTORY_PATH);
    const snapshot = await get(inventoryRef);

    if (!snapshot.exists()) {
      console.log('Initializing default inventory');
      await set(inventoryRef, DEFAULT_INVENTORY);
      return DEFAULT_INVENTORY;
    }
    return snapshot.val();
  },

  updateInventory: async (quantity, action, orderId) => {
    const inventoryRef = ref(database, INVENTORY_PATH);

    try {
      const result = await runTransaction(inventoryRef, (currentData) => {
        if (!currentData) {
          return DEFAULT_INVENTORY;
        }

        console.log(`Processing ${action} for order ${orderId}`, {
          currentState: currentData,
          quantity
        });

        const updated = { ...currentData };

        switch (action) {
          case 'reserve':
            const available = currentData.limit - currentData.stock - currentData.reserved;
            if (available < quantity) {
              throw new Error('OUT_OF_STOCK');
            }
            updated.reserved += quantity;
            break;

          case 'confirm':
            if (currentData.reserved < quantity) {
              console.error('Reservation mismatch!', {
                tryingToConfirm: quantity,
                actuallyReserved: currentData.reserved
              });
              throw new Error('RESERVATION_MISMATCH');
            }
            updated.reserved -= quantity;
            updated.stock += quantity;
            break;

          case 'release':
            updated.reserved = Math.max(0, currentData.reserved - quantity);
            break;
        }

        updated.lastUpdated = Date.now();
        return updated;
      });

      console.log(`${action} successful for order ${orderId}`, {
        newState: result.snapshot.val()
      });

      return result.snapshot.val();

    } catch (error) {
      console.error(`Inventory ${action} failed for order ${orderId}:`, error);
      throw error;
    }
  }
};

export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      items,
      orderId,
      finalAmount,
      user
    } = req.body;

    if (!user?.id || !orderId || !items?.length) {
      throw new Error('MISSING_REQUIRED_FIELDS');
    }

    // Check inventory availability first
    const currentInventory = await inventoryService.getInventory();
    const orderQuantity = items.reduce((sum, item) => {
      return sum + calculateActualQuantity(item);
    }, 0);

    if (currentInventory.limit - currentInventory.stock - currentInventory.reserved < orderQuantity) {
      throw new Error('OUT_OF_STOCK');
    }

    // Reserve inventory
    await inventoryService.updateInventory(orderQuantity, 'reserve', orderId);

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: finalAmount * 100,
      currency: 'INR',
      receipt: orderId,
      notes: {
        items: JSON.stringify(items),
        userId: user.id
      }
    });

    // Create order document
    const newOrder = new Order({
      orderId,
      razorpayOrderId: razorpayOrder.id,
      user: user.id,
      items: items.map(item => ({
        itemType: item.itemType,
        itemName: item.itemName || 'Palmyra Fruit',
        quantity: item.quantity,
        price: item.price,
        imagePath: item.imagePath || ''
      })),
      totalAmount: req.body.totalAmount,
      tax: req.body.tax || 0,
      shippingCost: req.body.shippingCost || 0,
      discount: req.body.discount || 0,
      finalAmount,
      paymentMethod: req.body.paymentMethod || 'Credit Card',
      shippingAddress: req.body.shippingAddress || {},
      paymentStatus: 'reserved',
      status: 'Pending',
      date: req.body.date || new Date().toISOString(),
      otp: req.body.otp,
      productName: req.body.productName,
      description: req.body.description
    });

    await newOrder.save({ session });

    // Set timeout to release inventory if payment not completed
    const releaseTimeout = setTimeout(async () => {
      try {
        const order = await Order.findOne({ orderId });
        if (order?.paymentStatus === 'reserved') {
          const orderQuantity = order.items.reduce((sum, item) =>
            sum + calculateActualQuantity(item), 0);
          await inventoryService.updateInventory(orderQuantity, 'release', orderId);
          order.paymentStatus = 'Failed';
          await order.save();
          console.log(`Released inventory for expired order ${orderId}`);
        }
      } catch (error) {
        console.error('Failed to release inventory:', error);
      }
    }, 2 * 60 * 1000); // 2 minutes

    // Clear timeout if order completes successfully
    req.on('close', () => {
      if (res.headersSent) {
        clearTimeout(releaseTimeout);
      }
    });

    await session.commitTransaction();

    res.json({
      success: true,
      orderId,
      razorpayOrderId: razorpayOrder.id,
      amount: finalAmount * 100,
      finalAmount,
      items
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Order creation failed:', error);

    res.status(400).json({
      success: false,
      error: error.message,
      code: error.message === 'OUT_OF_STOCK' ? 'OUT_OF_STOCK' : 'ORDER_CREATION_FAILED'
    });
  } finally {
    session.endSession();
  }
};

export const verifyPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      orderCreationId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amount,
      items
    } = req.body;

    // Check if payment already processed
    const existingOrder = await Order.findOne({
      orderId: orderCreationId,
      paymentStatus: 'Completed',
      paymentId: razorpayPaymentId
    });

    if (existingOrder) {
      return res.json({
        success: true,
        orderId: orderCreationId,
        paymentId: razorpayPaymentId,
        message: 'Payment already verified and completed'
      });
    }

    // Verify payment signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      throw new Error('INVALID_SIGNATURE');
    }

    // Validate order exists
    const order = await Order.findOne({
      orderId: orderCreationId,
      razorpayOrderId: razorpayOrderId,
      paymentStatus: 'reserved'
    }).session(session);

    if (!order) {
      throw new Error('INVALID_ORDER_STATE');
    }

    // Verify payment with Razorpay
    const payment = await razorpay.payments.fetch(razorpayPaymentId);
    if (payment.status !== 'captured' || payment.amount !== Number(amount)) {
      throw new Error('PAYMENT_VALIDATION_FAILED');
    }

    // Confirm inventory reservation
    const orderQuantity = items.reduce((sum, item) => {
      return sum + calculateActualQuantity(item);
    }, 0);
    await inventoryService.updateInventory(orderQuantity, 'confirm', orderCreationId);

    // Update order status
    order.paymentStatus = 'Completed';
    order.paymentId = razorpayPaymentId;
    order.status = 'Pending';
    await order.save({ session });

    await session.commitTransaction();

    res.json({
      success: true,
      orderId: orderCreationId,
      paymentId: razorpayPaymentId,
      message: 'Payment successfully verified and completed'
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Payment verification failed:', error);

    // Release inventory if payment verification fails
    try {
      if (req.body.orderCreationId) {
        const order = await Order.findOne({ orderId: req.body.orderCreationId });
        if (order && order.paymentStatus === 'reserved') {
          const orderQuantity = order.items.reduce((sum, item) =>
            sum + calculateActualQuantity(item), 0);
          await inventoryService.updateInventory(orderQuantity, 'release', req.body.orderCreationId);
        }
      }
    } catch (releaseError) {
      console.error('Failed to release inventory after payment failure:', releaseError);
    }

    res.status(400).json({
      success: false,
      error: error.message,
      code: error.message === 'RESERVATION_MISMATCH' ? 'INVENTORY_CONFIRM_FAILED' : 'VERIFICATION_FAILED'
    });
  } finally {
    session.endSession();
  }
};

export const releaseInventory = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId, quantity } = req.body;

    const order = await Order.findOne({ orderId }).session(session);
    if (!order || order.paymentStatus !== 'reserved') {
      await session.commitTransaction();
      return res.json({ success: true, message: 'Order not in reserved state' });
    }

    await inventoryService.updateInventory(quantity, 'release', orderId);

    order.paymentStatus = 'Cancelled';
    await order.save({ session });

    await session.commitTransaction();

    res.json({ success: true });
  } catch (error) {
    await session.abortTransaction();
    console.error('Inventory release failed:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    session.endSession();
  }
};

export const initializeInventory = async () => {
  try {
    const inventory = await inventoryService.getInventory();
    console.log('✅ Inventory system ready', {
      limit: inventory.limit,
      stock: inventory.stock,
      reserved: inventory.reserved,
      available: inventory.limit - inventory.stock - inventory.reserved
    });
    return inventory;
  } catch (error) {
    console.error('❌ Failed to initialize inventory:', error);
    throw error;
  }
};

export const getInventoryStatus = async (req, res) => {
  try {
    const inventory = await inventoryService.getInventory();
    res.json({
      success: true,
      limit: inventory.limit,
      sold: inventory.stock,
      reserved: inventory.reserved,
      available: inventory.limit - inventory.stock - inventory.reserved
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get inventory status'
    });
  }
};

export const scheduleInventoryValidation = () => {
  const VALIDATION_INTERVAL = 30 * 60 * 1000; // 30 minutes

  const validateInventoryState = async () => {
    try {
      const activeReservations = await Order.aggregate([
        { $match: { paymentStatus: 'reserved' } },
        { $unwind: '$items' },
        { $group: { _id: null, total: { $sum: '$items.quantity' } } }
      ]);

      const mongoReserved = activeReservations[0]?.total || 0;
      const inventory = await inventoryService.getInventory();

      if (mongoReserved !== inventory.reserved) {
        console.warn('⚠️ Inventory inconsistency detected', {
          firebaseReserved: inventory.reserved,
          mongoReserved: mongoReserved,
          difference: inventory.reserved - mongoReserved
        });

        const inventoryRef = ref(database, INVENTORY_PATH);
        await runTransaction(inventoryRef, (currentData) => {
          return {
            ...currentData,
            reserved: mongoReserved,
            lastUpdated: Date.now()
          };
        });

        console.log('✅ Inventory inconsistency fixed');
      }
    } catch (error) {
      console.error('❌ Inventory validation failed:', error);
    }

    setTimeout(validateInventoryState, VALIDATION_INTERVAL);
  };

  setTimeout(validateInventoryState, VALIDATION_INTERVAL);
  console.log(`Scheduled inventory validation to run every ${VALIDATION_INTERVAL / 60000} minutes`);
};
export const refundPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      paymentId,
      orderId: orderNumber,
      email,
      name: customerName,
      currency = "INR",
      cancellationReason = "customer"
    } = req.body;

    console.log('Refund request received:', { orderNumber, paymentId });

    // Input validation
    if (!paymentId) {
      throw new Error('PAYMENT_ID_REQUIRED');
    }

    // Fetch payment details from Razorpay
    let payment;
    try {
      payment = await razorpay.payments.fetch(paymentId);
      console.log('Payment details:', {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        refunded: payment.amount_refunded
      });
    } catch (razorpayError) {
      console.error('Razorpay payment fetch error:', razorpayError);
      throw new Error('PAYMENT_FETCH_FAILED');
    }

    // Check payment status
    if (payment.status === 'Refunded') {
      console.log('Payment already Refunded');
      return res.json({
        success: false,
        error: 'PAYMENT_ALREADY_REFUNDED',
        code: 'ALREADY_REFUNDED'
      });
    }

    const refundedAmount = payment.amount_refunded || 0;
    const totalAmount = payment.amount;
    const refundAmount = Math.floor(totalAmount * 0.9);
    const remainingAmount = totalAmount - refundedAmount;

    console.log('Amount details:', {
      total: totalAmount,
      refunded: refundedAmount,
      attempting: refundAmount,
      remaining: remainingAmount
    });

    // Validate refund amount
    if (refundAmount > remainingAmount) {
      throw new Error(`REFUND_AMOUNT_EXCEEDS_REMAINING: ${remainingAmount}`);
    }

    // Process refund with Razorpay
    let refund;
    try {
      refund = await razorpay.payments.refund(paymentId, {
        amount: refundAmount,
        speed: 'normal',
        notes: {
          reason: cancellationReason === 'customer'
            ? 'Customer requested refund'
            : 'Order timeout refund',
          orderNumber
        }
      });
      console.log('Refund processed:', refund.id);
    } catch (refundError) {
      console.error('Razorpay refund error:', refundError);
      throw new Error('RAZORPAY_REFUND_FAILED');
    }

    // Update order status
    try {
      const order = await Order.findOne({ orderId: orderNumber });
      
      if (!order) {
        console.log('Order not found:', orderNumber);
        throw new Error('ORDER_NOT_FOUND');
      }
      if (order.status === 'RefundInitiated' || order.status === 'RefundProcessing' || order.status === 'Refunded') {
        return res.json({
          success: false,
          error: 'REFUND_ALREADY_INITIATED',
          code: 'ALREADY_INITIATED'
        });
      }
      order.status = 'RefundInitiated';
      order.refundId = refund.id;
      await order.save();
      console.log('Order status updated to Refunded:', orderNumber);
    } catch (dbError) {
      console.error('Order update error:', dbError);
      throw new Error('ORDER_UPDATE_FAILED');
    }

    // Send confirmation email
    try {
      const formattedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const mailOptions = {
        from: process.env.SMTP_EMAIL || 'no-reply@example.com',
        to: email,
        subject: cancellationReason === 'customer'
          ? `Your Order #${orderNumber} Has Been Cancelled - Partial Refund Processed`
          : `Order #${orderNumber} Cancellation Due to Timeout - Partial Refund Processed`,
        html: `  <!DOCTYPE html>
// <html>
// <head>
//   <meta charset="utf-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <title>Refund Confirmation</title>
//   <style>
//     /* Base styles */
//     body {
//       font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//       line-height: 1.6;
//       color: #333;
//       background-color: #f9f9f9;
//       margin: 0;
//       padding: 0;
//     }
    
//     .container {
//       max-width: 600px;
//       margin: 0 auto;
//       background-color: #ffffff;
//       border-radius: 8px;
//       overflow: hidden;
//       box-shadow: 0 4px 10px rgba(0,0,0,0.05);
//     }
    
//     /* Header styles */
//     .header {
//       background-color: #4CAF50;
//       color: white;
//       text-align: center;
//       padding: 30px 20px;
//     }
    
//     .header h1 {
//       margin: 0;
//       font-size: 28px;
//       font-weight: 600;
//     }
    
//     /* Content styles */
//     .content {
//       padding: 30px;
//     }
    
//     .greeting {
//       font-size: 18px;
//       font-weight: 500;
//       margin-bottom: 20px;
//     }
    
//     /* Amount box styles */
//     .amount-box {
//       background-color: #f8f8f8;
//       border-left: 4px solid #4CAF50;
//       padding: 20px;
//       margin: 25px 0;
//       text-align: center;
//       border-radius: 4px;
//     }
    
//     .amount-label {
//       font-size: 14px;
//       color: #666;
//       margin-bottom: 5px;
//     }
    
//     .amount {
//       font-size: 32px;
//       font-weight: bold;
//       color: #4CAF50;
//     }
    
//     /* Details styles */
//     .details {
//       background-color: #f8f8f8;
//       border-radius: 4px;
//       padding: 20px;
//       margin: 25px 0;
//     }
    
//     .details h3 {
//       margin-top: 0;
//       font-size: 18px;
//       color: #333;
//       border-bottom: 1px solid #ddd;
//       padding-bottom: 10px;
//     }
    
//     .detail-row {
//       display: flex;
//       justify-content: space-between;
//       padding: 8px 0;
//     }
    
//     .detail-label {
//       font-weight: 500;
//       color: #555;
//     }
    
//     .detail-value {
//       color: #333;
//     }
    
//     /* Message styles */
//     .message {
//       line-height: 1.7;
//       margin-bottom: 25px;
//     }
    
//     /* Footer styles */
//     .footer {
//       text-align: center;
//       padding: 20px;
//       background-color: #f1f1f1;
//       color: #666;
//       font-size: 13px;
//     }
    
//     .contact-support {
//       margin-top: 20px;
//       padding: 15px;
//       background-color: #f8f8f8;
//       border-radius: 4px;
//       text-align: center;
//     }
    
//     .support-button {
//       display: inline-block;
//       background-color: #4CAF50;
//       color: white;
//       text-decoration: none;
//       padding: 10px 20px;
//       border-radius: 4px;
//       font-weight: 500;
//       margin-top: 10px;
//     }
    
//     /* Responsive styles */
//     @media only screen and (max-width: 600px) {
//       .container {
//         width: 100%;
//         border-radius: 0;
//       }
      
//       .content {
//         padding: 20px;
//       }
      
//       .header {
//         padding: 20px 15px;
//       }
//     }
//   </style>
// </head>
// <body>
//   <div class="container">
//     <div class="header">
//       <h1>Refund Confirmation</h1>
//     </div>
//     <div class="content">
//       <p class="greeting">Dear ${customerName || 'Valued Customer'},</p>
      
//       <div class="message">
//         <p>Your order #${orderNumber} was automatically canceled as it was not collected/delivered within the scheduled timeframe. A partial refund has been processed.</p>
//       </div>
      
//       <div class="amount-box">
//         <div class="amount-label">REFUND AMOUNT</div>
//         <div class="amount">${(refundAmount / 100).toFixed(2)} ${currency}</div>
//       </div>
      
//       <div class="details">
//         <h3>Refund Details</h3>
//         <div class="detail-row">
//           <span class="detail-label">Order Number:</span>
//           <span class="detail-value">#${orderNumber}</span>
//         </div>
//         <div class="detail-row">
//           <span class="detail-label">Refund Amount:</span>
//           <span class="detail-value">${(refundAmount / 100).toFixed(2)} ${currency}</span>
//         </div>
//         <div class="detail-row">
//           <span class="detail-label">Refund ID:</span>
//           <span class="detail-value">${refund.id}</span>
//         </div>
//         <div class="detail-row">
//           <span class="detail-label">Refund Date:</span>
//           <span class="detail-value">${formattedDate}</span>
//         </div>
//       </div>
      
//       <p>We value your business and appreciate your understanding in this matter.</p>
//       <p>Thank you for choosing us. We hope to serve you again soon.</p>
      
//       <div class="contact-support">
//         <p>Need help with anything else?</p>
//         <a href="mailto:support@yourcompany.com" class="support-button">Contact Support</a>
//       </div>
//     </div>
//     <div class="footer">
//       <p>This is an automated message. Please do not reply to this email.</p>
//       <p>© ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
//     </div>
//   </div>
// </body>
// </html> ` // Your existing email template
      };

      await transporter.sendMail(mailOptions);
      console.log('Refund confirmation email sent to:', email);
    } catch (emailError) {
      console.error('Email send error:', emailError);
      // Continue despite email failure
    }

    await session.commitTransaction();

    return res.json({
      success: true,
      refundId: refund.id,
      status: refund.status,
      message: 'Partial refund initiated successfully',
      amount: refundAmount / 100,
      currency,
      orderNumber
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Refund processing error:', {
      error: error.message,
      paymentId: req.body.paymentId,
      orderId: req.body.orderNumber,
      timestamp: new Date()
    });

    const errorResponse = {
      success: false,
      error: error.message,
      code: error.message.startsWith('PAYMENT_') ? error.message : 'REFUND_FAILED'
    };

    return res.status(
      error.message.includes('NOT_FOUND') ? 404 :
        error.message.includes('ALREADY') ? 400 : 500
    ).json(errorResponse);
  } finally {
    session.endSession();
  }
};

export const refundAll = async (req, res) => {
  const { orders } = req.body;

  if (!orders || !Array.isArray(orders)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_ORDERS_DATA'
    });
  }

  const results = [];
  const batchSize = 5; // Process 5 at a time to avoid rate limiting

  for (let i = 0; i < orders.length; i += batchSize) {
    const batch = orders.slice(i, i + batchSize);

    await Promise.all(batch.map(async (order) => {
      const { paymentId, orderId, email, name, currency = "INR" } = order;
      const result = { orderId };

      try {
        // Fetch payment details
        const payment = await razorpay.payments.fetch(paymentId);
        const orderDetails = await Order.findOne({ orderId });
        if (orderDetails && ['RefundInitiated', 'RefundProcessing', 'Refunded'].includes(orderDetails.status)) {
          result.success = false;
          result.error = 'REFUND_ALREADY_INITIATED';
          results.push(result);
          return;
        }
        // Check if already refunded
        if (payment.status === 'Refunded') {
          result.success = false;
          result.error = 'PAYMENT_ALREADY_REFUNDED';
          results.push(result);
          return;
        }

        // Calculate refund amount
        const refundAmount = Math.floor(payment.amount * 0.9);
        const remainingAmount = payment.amount - (payment.amount_refunded || 0);

        if (refundAmount > remainingAmount) {
          result.success = false;
          result.error = 'REFUND_AMOUNT_EXCEEDS_REMAINING';
          results.push(result);
          return;
        }

        // Process refund
        const refund = await razorpay.payments.refund(paymentId, {
          amount: refundAmount,
          speed: 'normal',
          notes: {
            reason: 'Bulk refund for expired orders',
            orderNumber: orderId,
          },
        });

        // Update order
        await Order.findOneAndUpdate(
          { orderId },
          { status: 'RefundInitiated', refundId: refund.id }
        );

        // Send email (optional)
        try {
          await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to: email,
            subject: `Your Order #${orderId} Has Been Refunded`,
            html: `  <!DOCTYPE html>
// <html>
// <head>
//   <meta charset="utf-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <title>Refund Confirmation</title>
//   <style>
//     /* Base styles */
//     body {
//       font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//       line-height: 1.6;
//       color: #333;
//       background-color: #f9f9f9;
//       margin: 0;
//       padding: 0;
//     }
    
//     .container {
//       max-width: 600px;
//       margin: 0 auto;
//       background-color: #ffffff;
//       border-radius: 8px;
//       overflow: hidden;
//       box-shadow: 0 4px 10px rgba(0,0,0,0.05);
//     }
    
//     /* Header styles */
//     .header {
//       background-color: #4CAF50;
//       color: white;
//       text-align: center;
//       padding: 30px 20px;
//     }
    
//     .header h1 {
//       margin: 0;
//       font-size: 28px;
//       font-weight: 600;
//     }
    
//     /* Content styles */
//     .content {
//       padding: 30px;
//     }
    
//     .greeting {
//       font-size: 18px;
//       font-weight: 500;
//       margin-bottom: 20px;
//     }
    
//     /* Amount box styles */
//     .amount-box {
//       background-color: #f8f8f8;
//       border-left: 4px solid #4CAF50;
//       padding: 20px;
//       margin: 25px 0;
//       text-align: center;
//       border-radius: 4px;
//     }
    
//     .amount-label {
//       font-size: 14px;
//       color: #666;
//       margin-bottom: 5px;
//     }
    
//     .amount {
//       font-size: 32px;
//       font-weight: bold;
//       color: #4CAF50;
//     }
    
//     /* Details styles */
//     .details {
//       background-color: #f8f8f8;
//       border-radius: 4px;
//       padding: 20px;
//       margin: 25px 0;
//     }
    
//     .details h3 {
//       margin-top: 0;
//       font-size: 18px;
//       color: #333;
//       border-bottom: 1px solid #ddd;
//       padding-bottom: 10px;
//     }
    
//     .detail-row {
//       display: flex;
//       justify-content: space-between;
//       padding: 8px 0;
//     }
    
//     .detail-label {
//       font-weight: 500;
//       color: #555;
//     }
    
//     .detail-value {
//       color: #333;
//     }
    
//     /* Message styles */
//     .message {
//       line-height: 1.7;
//       margin-bottom: 25px;
//     }
    
//     /* Footer styles */
//     .footer {
//       text-align: center;
//       padding: 20px;
//       background-color: #f1f1f1;
//       color: #666;
//       font-size: 13px;
//     }
    
//     .contact-support {
//       margin-top: 20px;
//       padding: 15px;
//       background-color: #f8f8f8;
//       border-radius: 4px;
//       text-align: center;
//     }
    
//     .support-button {
//       display: inline-block;
//       background-color: #4CAF50;
//       color: white;
//       text-decoration: none;
//       padding: 10px 20px;
//       border-radius: 4px;
//       font-weight: 500;
//       margin-top: 10px;
//     }
    
//     /* Responsive styles */
//     @media only screen and (max-width: 600px) {
//       .container {
//         width: 100%;
//         border-radius: 0;
//       }
      
//       .content {
//         padding: 20px;
//       }
      
//       .header {
//         padding: 20px 15px;
//       }
//     }
//   </style>
// </head>
// <body>
//   <div class="container">
//     <div class="header">
//       <h1>Refund Confirmation</h1>
//     </div>
//     <div class="content">
//       <p class="greeting">Dear ${customerName || 'Valued Customer'},</p>
      
//       <div class="message">
//         <p>Your order #${orderNumber} was automatically canceled as it was not collected/delivered within the scheduled timeframe. A partial refund has been processed.</p>
//       </div>
      
//       <div class="amount-box">
//         <div class="amount-label">REFUND AMOUNT</div>
//         <div class="amount">${(refundAmount / 100).toFixed(2)} ${currency}</div>
//       </div>
      
//       <div class="details">
//         <h3>Refund Details</h3>
//         <div class="detail-row">
//           <span class="detail-label">Order Number:</span>
//           <span class="detail-value">#${orderNumber}</span>
//         </div>
//         <div class="detail-row">
//           <span class="detail-label">Refund Amount:</span>
//           <span class="detail-value">${(refundAmount / 100).toFixed(2)} ${currency}</span>
//         </div>
//         <div class="detail-row">
//           <span class="detail-label">Refund ID:</span>
//           <span class="detail-value">${refund.id}</span>
//         </div>
//         <div class="detail-row">
//           <span class="detail-label">Refund Date:</span>
//           <span class="detail-value">${formattedDate}</span>
//         </div>
//       </div>
      
//       <p>We value your business and appreciate your understanding in this matter.</p>
//       <p>Thank you for choosing us. We hope to serve you again soon.</p>
      
//       <div class="contact-support">
//         <p>Need help with anything else?</p>
//         <a href="mailto:support@yourcompany.com" class="support-button">Contact Support</a>
//       </div>
//     </div>
//     <div class="footer">
//       <p>This is an automated message. Please do not reply to this email.</p>
//       <p>© ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
//     </div>
//   </div>
// </body>
// </html> ` // Your email template
          });
        } catch (emailError) {
          console.error(`Email failed for order ${orderId}:`, emailError);
        }

        result.success = true;
        result.refundId = refund.id;
        result.amount = refundAmount / 100;

      } catch (error) {
        console.error(`Refund failed for order ${orderId}:`, error);
        result.success = false;
        result.error = error.message || 'REFUND_PROCESSING_FAILED';
      }

      results.push(result);
    }));
  }

  return res.json({
    success: true,
    processed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  });
};

export const handleRefundWebhook = async (req, res) => {
  const RAZORPAY_IPS = ['54.209.155.0/24', '54.208.86.0/24'];
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // IP Whitelisting
  if (!RAZORPAY_IPS.some(ip => clientIp.startsWith(ip))) {
    console.warn(`Unauthorized webhook access from IP: ${clientIp}`);
    return res.status(403).send('Forbidden');
  }

  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;

    // Validate signature
    const isValid = razorpay.webhooks.validateWebhookSignature(
      JSON.stringify(body),
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ success: false, error: 'INVALID_SIGNATURE' });
    }

    console.log('Received valid webhook:', body.event);

    // Handle different webhook events
    // In the handleRefundWebhook function, locate this part
    switch (body.event) {
      case 'refund.created':
        console.log('Refund initiated:', body.payload.refund.id);
        // ADD THIS CODE:
        await Order.findOneAndUpdate(
          { refundId: body.payload.refund.id },
          { status: 'RefundProcessing' }
        );
        break;

      case 'refund.processed':
        await handleProcessedRefund(body.payload.refund);
        break;

      case 'refund.failed':
        console.error('Refund failed:', body.payload.refund.error);
        // ADD THIS CODE:
        await Order.findOneAndUpdate(
          { refundId: body.payload.refund.id },
          { status: 'RefundFailed' }
        );
        break;

      default:
        console.log('Unhandled webhook event:', body.event);
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({
      success: false,
      error: 'WEBHOOK_PROCESSING_FAILED'
    });
  }
};

async function handleProcessedRefund(refund) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findOneAndUpdate(
      { refundId: refund.id },
      {
        paymentStatus: 'Refunded',
        status:'Refunded',
        $push: {
          statusHistory: {
            status: 'refund_processed',
            metadata: refund,
            timestamp: new Date()
          }
        }
      },
      { session, new: true }
    );

    if (!order) {
      console.warn('No order found for refund:', refund.id);
      throw new Error('ORDER_NOT_FOUND');
    }

    // Release inventory
    const orderQuantity = order.items.reduce((sum, item) =>
      sum + calculateActualQuantity(item), 0);
    await inventoryService.updateInventory(orderQuantity, 'release', order.orderId);

    await session.commitTransaction();
    console.log('Successfully processed refund:', refund.id);

  } catch (error) {
    await session.abortTransaction();
    console.error('Failed to process refund:', error);
    throw error;
  } finally {
    session.endSession();
  }
}
