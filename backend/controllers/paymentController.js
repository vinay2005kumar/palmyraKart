import dotenv from 'dotenv';
dotenv.config();
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Order } from '../models/orderSchema.js'; // Import the Order model
import mongoose from 'mongoose';
import transporter from "../config/nodeMailer.js";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, runTransaction, get } from "firebase/database";
import User from '../models/userModel.js';

// Initialize Razorpay with your keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      amount,
      currency = 'INR',
      productName,
      description,
      address,
      phone,
      items,
      paymentMethod,
      finalAmount,
      orderId,
    } = req.body;

    const user = req.user;

    // Input validation
    if (
      !amount || amount <= 0 ||
      !finalAmount || finalAmount <= 0 ||
      !orderId || !address || !phone ||
      !items || !Array.isArray(items) || items.length === 0
    ) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Missing or invalid required fields' });
    }

    // Check if user is authenticated
    if (!user || !user.id) {
      await session.abortTransaction();
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    // Create a Razorpay order
    const options = {
      amount: finalAmount * 100,
      currency,
      receipt: orderId,
      notes: {
        productName,
        description,
      },
    };

    const razorpayOrder = await new Promise((resolve, reject) => {
      razorpay.orders.create(options, (err, order) => {
        if (err) {
          reject(err);
        } else {
          resolve(order);
        }
      });
    });

    // Save the order in your database with status "Pending"
    const newOrder = new Order({
      orderId,
      razorpayOrderId: razorpayOrder.id,
      user: user.id,
      items: items.map((item) => ({
        itemType: item.itemType,
        itemName: item.itemName,
        quantity: item.quantity,
        price: item.price,
        imagePath: item.imagePath,
      })),
      finalAmount,
      paymentMethod,
      paymentStatus: 'Pending', // Set initial status as "Pending"
      shippingAddress: {
        street: address,
        phoneNumber: phone,
      },
      status: 'Pending',
      date: new Date(),
    });
   
    await newOrder.save({ session });
     console.log('date',newOrder.date)
    // Commit the transaction
    await session.commitTransaction();

    // Return Razorpay order details to the client
    res.status(200).json({
      success:true,
      id: razorpayOrder.id,
      orderId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error) {
    // Abort the transaction on error
    await session.abortTransaction();
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({  success:false, error: 'Payment initiation failed', details: error.message });
  } finally {
    // End the session
    session.endSession();
  }
};
// Verify payment


export const verifyPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderCreationId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    // Input validation
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      await session.abortTransaction();
      return res.status(400).json({  success:false, error: 'Missing payment verification parameters' });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    // Compare signatures
    if (generatedSignature !== razorpaySignature) {
      await session.abortTransaction();
      return res.status(400).json({  success:false, error: 'Invalid payment signature' });
    }

    // Fetch the order from the database
    const order = await Order.findOne({ orderId: orderCreationId }).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({  success:false, error: 'Order not found' });
    }
    console.log('orderdate',order.date)
    // Calculate total quantity in the order
    const orderQuantity = order.items.reduce((total, item) => total + item.quantity, 0);

    // Create Firebase reference
    const url = process.env.FIREBASE_URL.trim();
    const collection = process.env.FIREBASE_COLLECTION.trim();
    const inventoryRef = ref(database, `${url}/${collection}`);

    // Fetch current inventory data
    const snapshot = await get(inventoryRef);
    if (!snapshot.exists()) {
      await session.abortTransaction();
      return res.status(400).json({  success:false, error: 'Inventory data not found in Firebase' });
    }

    const { limit: fetchedLimit, stock: fetchedStock } = snapshot.val();

    // Perform inventory check and update atomically
    try {
      await runTransaction(inventoryRef, (inventory) => {
        // If inventory is null, use the values fetched earlier
        if (!inventory) {
          console.log("Inventory is null. Using fetched values.");
          inventory = {
            limit: fetchedLimit,
            stock: fetchedStock,
          };
        }

        const { limit, stock } = inventory;
        console.log(`Current stock: ${stock}, Order quantity: ${orderQuantity}, Limit: ${limit}`);

        // Check if the order exceeds the daily limit
        if (stock + orderQuantity > limit) {
          throw new Error('INVENTORY_LIMIT_EXCEEDED');
        }

        // Update the stock
        inventory.stock = stock + orderQuantity;
        return inventory;
      });
    } catch (error) {
      console.error('Firebase transaction failed:', error.message);
      if (error.message === 'INVENTORY_LIMIT_EXCEEDED') {
        await session.abortTransaction();
        return res.status(400).json({ 
          success:false,
          error: 'Inventory limit exceeded', 
          details: 'Not enough items in stock to fulfill this order' 
        });
      }
      await session.abortTransaction();
      return res.status(500).json({success:false, error: 'Firebase transaction failed', details: error.message });
    }

    // Update the order status to "Paid"
    order.paymentStatus = 'Completed';
    order.status = 'Pending';
    order.paymentId = razorpayPaymentId; // Store Razorpay payment ID
    await order.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    console.log('success')
    // Return success response
    res.status(200).json({success:true,message: 'Payment confirmed and stock updated successfully' });
  } catch (error) {
    // Abort the transaction on error
    await session.abortTransaction();
    console.log('Error confirming payment:', error);
    res.status(500).json({ error: 'Payment confirmation failed', details: error.message });
  } finally {
    // End the session
    session.endSession();
  }
};
export const refundPayment = async (req, res) => {
  try {
    const {
      paymentId,
      orderId: orderNumber,
      email,
      name: customerName,
      currency = "INR",
      cancellationReason = "customer" // "customer" or "timeout"
    } = req.body;

    console.log('Refund request received:', req.body);

    // Input validation
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment ID'
      });
    }

    // Fetch payment details from Razorpay
    let payment;
    try {
      payment = await razorpay.payments.fetch(paymentId);
      console.log('Payment details:', payment);
    } catch (razorpayError) {
      console.error('Error fetching payment from Razorpay:', razorpayError);
      return res.status(400).json({
        success: false,
        error: 'Invalid payment ID or payment not found'
      });
    }

    // Check if payment is already refunded
    if (payment.status === 'refunded') {
      console.log('Payment already refunded');
      return res.status(400).json({
        success: false,
        error: 'The payment has already been refunded'
      });
    }

    const refundedAmount = payment.amount_refunded || 0; // Total amount already refunded
    const totalAmount = payment.amount; // Original payment amount

    // Check if the payment has already been fully refunded
    if (refundedAmount >= totalAmount) {
      console.log('Payment already fully refunded');
      return res.status(400).json({
        success: false,
        error: 'The payment has already been fully refunded'
      });
    }

    // Calculate 90% of the payment amount
    const refundAmount = Math.floor(totalAmount * 0.9); // 90% of the total amount in paise

    // Check if the remaining amount is sufficient for the refund
    const remainingAmount = totalAmount - refundedAmount;
    console.log('amount', refundAmount, totalAmount, remainingAmount)
    if (refundAmount > remainingAmount) {
      console.log('Refund amount exceeds remaining amount');
      return res.status(400).json({
        success: false,
        error: `Refund amount exceeds the remaining amount of ${(remainingAmount / 100).toFixed(2)} ${currency}`
      });
    }

    // Issue refund using Razorpay API
    let refund;
    try {
      refund = await razorpay.payments.refund(paymentId, {
        amount: refundAmount, // 90% of the total amount
        speed: 'normal', // Refund speed (normal or opt)
        notes: {
          reason: cancellationReason === 'customer' ? 'Customer requested refund' : 'Order timeout refund',
          orderNumber: orderNumber
        }
      });
      console.log('Refund processed:', refund);
    } catch (refundError) {
      console.error('Error processing refund with Razorpay:', refundError);
      return res.status(500).json({
        success: false,
        error: 'Failed to process refund with payment gateway'
      });
    }

    // Update order status to 'Partially Refunded'
    try {
      const order = await Order.findOne({ orderId: orderNumber });
      if (!order) {
        console.log('Order not found:', orderNumber);
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      order.status = 'Refunded';
      order.refundId = refund.id;
      await order.save();
      console.log('Order status updated to Partially Refunded:', order.orderId);
    } catch (dbError) {
      console.error('Database error updating order:', dbError);
      // Note: We don't return an error here since the refund was already processed
      // Instead, we'll continue with the email and return success with a warning
    }

    // Send confirmation email
    try {
      const formattedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const confirmationMessage =
        `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Refund Confirmation</title>
  <style>
    /* Base styles */
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }
    
    /* Header styles */
    .header {
      background-color: #4CAF50;
      color: white;
      text-align: center;
      padding: 30px 20px;
    }
    
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    
    /* Content styles */
    .content {
      padding: 30px;
    }
    
    .greeting {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 20px;
    }
    
    /* Amount box styles */
    .amount-box {
      background-color: #f8f8f8;
      border-left: 4px solid #4CAF50;
      padding: 20px;
      margin: 25px 0;
      text-align: center;
      border-radius: 4px;
    }
    
    .amount-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    
    .amount {
      font-size: 32px;
      font-weight: bold;
      color: #4CAF50;
    }
    
    /* Details styles */
    .details {
      background-color: #f8f8f8;
      border-radius: 4px;
      padding: 20px;
      margin: 25px 0;
    }
    
    .details h3 {
      margin-top: 0;
      font-size: 18px;
      color: #333;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
    }
    
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    
    .detail-label {
      font-weight: 500;
      color: #555;
    }
    
    .detail-value {
      color: #333;
    }
    
    /* Message styles */
    .message {
      line-height: 1.7;
      margin-bottom: 25px;
    }
    
    /* Footer styles */
    .footer {
      text-align: center;
      padding: 20px;
      background-color: #f1f1f1;
      color: #666;
      font-size: 13px;
    }
    
    .contact-support {
      margin-top: 20px;
      padding: 15px;
      background-color: #f8f8f8;
      border-radius: 4px;
      text-align: center;
    }
    
    .support-button {
      display: inline-block;
      background-color: #4CAF50;
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 4px;
      font-weight: 500;
      margin-top: 10px;
    }
    
    /* Responsive styles */
    @media only screen and (max-width: 600px) {
      .container {
        width: 100%;
        border-radius: 0;
      }
      
      .content {
        padding: 20px;
      }
      
      .header {
        padding: 20px 15px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Refund Confirmation</h1>
    </div>
    <div class="content">
      <p class="greeting">Dear ${customerName},</p>
      
      <div class="message">
        ${cancellationReason === 'customer' ?
          `<p>Your order #${orderNumber} has been successfully canceled as per your request, and a partial refund has been issued.</p>` :
          `<p>Your order #${orderNumber} was automatically canceled as it was not collected/delivered within the scheduled timeframe. A partial refund has been processed.</p>`
        }
      </div>
      
      <div class="amount-box">
        <div class="amount-label">REFUND AMOUNT</div>
        <div class="amount">${(refundAmount / 100).toFixed(2)} ${currency}</div>
      </div>
      
      <div class="details">
        <h3>Refund Details</h3>
        <div class="detail-row">
          <span class="detail-label">Order Number:</span>
          <span class="detail-value">#${orderNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Refund Amount:</span>
          <span class="detail-value">${(refundAmount / 100).toFixed(2)} ${currency}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Refund ID:</span>
          <span class="detail-value">${refund.id}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Refund Date:</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
      </div>
      
      <p>We value your business and appreciate your understanding in this matter.</p>
      <p>Thank you for choosing us. We hope to serve you again soon.</p>
      
      <div class="contact-support">
        <p>Need help with anything else?</p>
        <a href="mailto:support@yourcompany.com" class="support-button">Contact Support</a>
      </div>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
      <p>© ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`

      const subject = cancellationReason === 'customer'
        ? `Your Order #${orderNumber} Has Been Cancelled - Partial Refund Processed`
        : `Order #${orderNumber} Cancellation Due to Timeout - Partial Refund Processed
        `;

      const mailOptions = {
        from: process.env.SMTP_EMAIL || 'vinaybuttala@gmail.com',
        to: email,
        subject: subject,
        html: confirmationMessage,
      };
      console.log(mailOptions)
      await transporter.sendMail(mailOptions);
      console.log('Refund confirmation email sent to:', email);
    } catch (emailError) {
      console.error('Error sending refund confirmation email:', emailError);
      // Note: We don't return an error here since the refund was already processed
      // Instead, we'll continue and return success with a warning
    }

    res.status(200).json({
      success: true,
      refundId: refund.id,
      status: refund.status,
      message: 'Partial refund initiated successfully and confirmation email sent',
      amount: refundAmount / 100, // Convert back to rupees
      currency: currency,
      orderNumber: orderNumber
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      error: 'Refund processing failed. Please try again or contact support.'
    });
  }
};
export const handleRefundWebhook = async (req, res) => {
  try {
    const body = req.body;
    const signature = req.headers['x-razorpay-signature'];

    // Verify the webhook signature
    const isValid = razorpay.webhooks.validateWebhookSignature(
      JSON.stringify(body),
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    // Handle the refund event
    switch (body.event) {
      case 'refund.processed':
        console.log('Refund processed:', body.payload.refund);
        // Update your database or notify the customer
        break;
      default:
        console.log('Unhandled event:', body.event);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling refund webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

export const refundAll = async (req, res) => {
  try {
    const { orders } = req.body;

    // Import necessary modules at the top of your file (if not already imported)
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST,
    //   port: process.env.SMTP_PORT,
    //   secure: process.env.SMTP_SECURE === 'true',
    //   auth: {
    //     user: process.env.SMTP_EMAIL,
    //     pass: process.env.SMTP_PASSWORD
    //   }
    // });

    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid orders data',
      });
    }

    const results = [];
    for (const order of orders) {
      const {
        paymentId,
        orderId,
        email,
        name: customerName,
        currency = "INR"  // Default to INR if not provided
      } = order;

      try {
        // Fetch payment details from Razorpay
        const payment = await razorpay.payments.fetch(paymentId);

        // Check if payment is already refunded
        if (payment.status === 'refunded') {
          results.push({
            orderId,
            success: false,
            error: 'The payment has already been refunded',
          });
          continue;
        }

        // Check if the payment has already been fully refunded
        const refundedAmount = payment.amount_refunded || 0;
        const totalAmount = payment.amount;
        if (refundedAmount >= totalAmount) {
          results.push({
            orderId,
            success: false,
            error: 'The payment has already been fully refunded',
          });
          continue;
        }

        // Calculate 90% of the payment amount
        const refundAmount = Math.floor(totalAmount * 0.9);

        // Check if the remaining amount is sufficient for the refund
        const remainingAmount = totalAmount - refundedAmount;
        if (refundAmount > remainingAmount) {
          results.push({
            orderId,
            success: false,
            error: `Refund amount exceeds the remaining amount of ${(remainingAmount / 100).toFixed(2)} ${currency}`,
          });
          continue;
        }

        // Issue refund using Razorpay API
        const refund = await razorpay.payments.refund(paymentId, {
          amount: refundAmount,
          speed: 'normal',
          notes: {
            reason: 'Bulk refund for expired orders',
            orderNumber: orderId,
          },
        });

        // Update order status to 'Refunded'
        const updatedOrder = await Order.findOneAndUpdate(
          { orderId },
          { status: 'Refunded', refundId: refund.id },
          { new: true }
        );

        if (!updatedOrder) {
          results.push({
            orderId,
            success: false,
            error: 'Order not found',
          });
          continue;
        }

        // Send confirmation email
        try {
          const formattedDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

          // Define cancellationReason and orderNumber for the email template
          const cancellationReason = 'timeout'; // Default reason for bulk refunds
          const orderNumber = orderId; // Using orderId as orderNumber for email template

          const confirmationMessage = ` 
          <!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Refund Confirmation</title>
  <style>
    /* Base styles */
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }
    
    /* Header styles */
    .header {
      background-color: #4CAF50;
      color: white;
      text-align: center;
      padding: 30px 20px;
    }
    
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    
    /* Content styles */
    .content {
      padding: 30px;
    }
    
    .greeting {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 20px;
    }
    
    /* Amount box styles */
    .amount-box {
      background-color: #f8f8f8;
      border-left: 4px solid #4CAF50;
      padding: 20px;
      margin: 25px 0;
      text-align: center;
      border-radius: 4px;
    }
    
    .amount-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    
    .amount {
      font-size: 32px;
      font-weight: bold;
      color: #4CAF50;
    }
    
    /* Details styles */
    .details {
      background-color: #f8f8f8;
      border-radius: 4px;
      padding: 20px;
      margin: 25px 0;
    }
    
    .details h3 {
      margin-top: 0;
      font-size: 18px;
      color: #333;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
    }
    
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    
    .detail-label {
      font-weight: 500;
      color: #555;
    }
    
    .detail-value {
      color: #333;
    }
    
    /* Message styles */
    .message {
      line-height: 1.7;
      margin-bottom: 25px;
    }
    
    /* Footer styles */
    .footer {
      text-align: center;
      padding: 20px;
      background-color: #f1f1f1;
      color: #666;
      font-size: 13px;
    }
    
    .contact-support {
      margin-top: 20px;
      padding: 15px;
      background-color: #f8f8f8;
      border-radius: 4px;
      text-align: center;
    }
    
    .support-button {
      display: inline-block;
      background-color: #4CAF50;
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 4px;
      font-weight: 500;
      margin-top: 10px;
    }
    
    /* Responsive styles */
    @media only screen and (max-width: 600px) {
      .container {
        width: 100%;
        border-radius: 0;
      }
      
      .content {
        padding: 20px;
      }
      
      .header {
        padding: 20px 15px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Refund Confirmation</h1>
    </div>
    <div class="content">
      <p class="greeting">Dear ${customerName || 'Valued Customer'},</p>
      
      <div class="message">
        <p>Your order #${orderNumber} was automatically canceled as it was not collected/delivered within the scheduled timeframe. A partial refund has been processed.</p>
      </div>
      
      <div class="amount-box">
        <div class="amount-label">REFUND AMOUNT</div>
        <div class="amount">${(refundAmount / 100).toFixed(2)} ${currency}</div>
      </div>
      
      <div class="details">
        <h3>Refund Details</h3>
        <div class="detail-row">
          <span class="detail-label">Order Number:</span>
          <span class="detail-value">#${orderNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Refund Amount:</span>
          <span class="detail-value">${(refundAmount / 100).toFixed(2)} ${currency}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Refund ID:</span>
          <span class="detail-value">${refund.id}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Refund Date:</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
      </div>
      
      <p>We value your business and appreciate your understanding in this matter.</p>
      <p>Thank you for choosing us. We hope to serve you again soon.</p>
      
      <div class="contact-support">
        <p>Need help with anything else?</p>
        <a href="mailto:support@yourcompany.com" class="support-button">Contact Support</a>
      </div>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
      <p>© ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
    </div>
  </div>
</body>
</html> `;

          const mailOptions = {
            from: process.env.SMTP_EMAIL || 'vinaybuttala@gmail.com',
            to: email,
            subject: `Your Order #${orderId} Has Been Refunded`,
            html: confirmationMessage,
          };

          console.log('Attempting to send email for order:', orderId);
          await transporter.sendMail(mailOptions);
          console.log('Email sent successfully for order:', orderId);
        } catch (emailError) {
          console.error(`Error sending email for order ${orderId}:`, emailError);
          // Continue processing despite email error
        }

        results.push({
          orderId,
          success: true,
          refundId: refund.id,
          status: refund.status,
          amount: refundAmount / 100,
        });
      } catch (error) {
        console.error(`Error processing refund for order ${orderId}:`, error);
        results.push({
          orderId,
          success: false,
          error: error.message || 'Failed to process refund',
        });
      }
    }

    res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error processing bulk refunds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process bulk refunds. Please try again or contact support.',
    });
  }
};