
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { Order } from '../models/orderSchema.js'; // Import the Order model
dotenv.config(); // Load environment variables
import mongoose from 'mongoose';
import transporter from "../config/nodeMailer.js";
import User from '../models/userModel.js';
console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
console.log("RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET);

// Initialize Razorpay with your keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create an order
// export const createOrder = async (req, res) => {
//   try {
//     const { amount, currency = 'INR', productName, description } = req.body;

//     // Input validation
//     if (!amount || amount <= 0) {
//       return res.status(400).json({ error: 'Invalid amount' });
//     }

//     // Create order using Razorpay API
//     const options = {
//       amount,
//       currency,
//       receipt: 'receipt_' + Math.random().toString(36).substring(2, 15),
//       notes: {
//         productName,
//         description,
//       },
//     };

//     const order = await razorpay.orders.create(options);

//     res.status(200).json({
//       id: order.id,
//       amount: order.amount,
//       currency: order.currency,
//     });
//   } catch (error) {
//     console.error('Error creating Razorpay order:', error);
//     res.status(500).json({ error: 'Payment initiation failed' });
//   }
// };

export const createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', productName, description, address, phone, items, paymentMethod, finalAmount, orderId } = req.body;
    const user = req.user; // Assuming user is attached by your authentication middleware

    // Input validation
    if (!amount || amount <= 0 || !address || !phone || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid required fields' });
    }

    // Check if user is available
    console.log('user',user,user._id)
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    // Create a Razorpay order
    const options = {
      amount: finalAmount * 100, // Use finalAmount in paise
      currency,
      receipt: orderId, // Use your system's order ID as the receipt
      notes: {
        productName,
        description,
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Save the order in your database
    const newOrder = new Order({
      orderId, // Your system's order ID
      razorpayOrderId: razorpayOrder.id, // Razorpay's order ID
      user: user.id, // Associate the order with the logged-in user
      items: items.map((item) => ({
        itemType: item.itemType,
        itemName: item.itemName,
        quantity: item.quantity,
        price: item.price,
        imagePath: item.imagePath,
      })),
      finalAmount,
      paymentMethod,
      paymentStatus: 'Pending',
      shippingAddress: {
        street: address,
        phoneNumber: phone,
      },
      status: 'Pending',
      date: new Date(),
    });

    await newOrder.save();

    // Return Razorpay order details to the client
    res.status(200).json({
      id: razorpayOrder.id, // Razorpay's order ID
      orderId, // Your system's order ID
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Payment initiation failed' });
  }
};

// Verify payment


export const verifyPayment = async (req, res) => {
  try {
    const { orderCreationId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    // Input validation
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: 'Missing payment verification parameters' });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    // Compare signatures
    if (generatedSignature === razorpaySignature) {
      console.log('Signature verified successfully');
      console.log('Searching for order with orderCreationId:', orderCreationId);

      // Payment is legitimate - update your database, mark order as paid, etc.
      const order = await Order.findOne({ orderId: orderCreationId }); // Use orderCreationId to find the order
      if (!order) {
        console.log('Order not found in database');
        return res.status(404).json({ error: 'Order not found' });
      }

      console.log('Order found:', order);

      // Update order status to 'Completed'
      order.paymentStatus = 'Completed'; // Update based on your schema's enum values
      order.paymentId = razorpayPaymentId; // Store Razorpay payment ID
      await order.save();

      console.log('Order updated successfully:', order);

      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        orderId: order.orderId,
        paymentStatus: order.paymentStatus,
      });
    } else {
      console.log('Signature verification failed');
      return res.status(400).json({
        success: false,
        error: 'Payment verification failed',
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Payment verification failed' });
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
    console.log('amount',refundAmount,totalAmount,remainingAmount)
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

      const confirmationMessage = `<!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .logo { max-height: 60px; }
          .content { padding: 20px 0; }
          .amount { font-size: 24px; font-weight: bold; text-align: center; padding: 15px; margin: 20px 0; background-color: #f8f8f8; border-radius: 5px; }
          .details { background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #666; padding: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Refund Confirmation</h2>
          </div>
          <div class="content">
            <p>Dear ${customerName},</p>
            ${cancellationReason === 'customer' ? 
              `<p>Your order #${orderNumber} has been successfully canceled as per your request, and a partial refund has been issued.</p>` : 
              `<p>Your order #${orderNumber} was automatically canceled as it was not collected/delivered within the scheduled timeframe. A partial refund has been processed.</p>`
            }
            <div class="amount">${(refundAmount / 100).toFixed(2)} ${currency}</div>
            <div class="details">
              <h3>Refund Details</h3>
              <p><strong>Order Number:</strong> #${orderNumber}</p>
              <p><strong>Refund Amount:</strong> ${(refundAmount / 100).toFixed(2)} ${currency}</p>
              <p><strong>Refund ID:</strong> ${refund.id}</p>
              <p><strong>Refund Date:</strong> ${formattedDate}</p>
            </div>
            <p>Thank you for choosing us. We hope to serve you again soon.</p>
          </div>
          <div class="footer">
            <p>If you have any questions, please contact our customer support.</p>
          </div>
        </div>
      </body>
      </html>`;

      const subject = cancellationReason === 'customer' 
        ? `Your Order #${orderNumber} Has Been Cancelled - Partial Refund Processed`
        : `Order #${orderNumber} Cancellation Due to Timeout - Partial Refund Processed`;

      const mailOptions = {
        from: process.env.SMTP_EMAIL || 'your-email@example.com',
        to: email,
        subject: subject,
        html: confirmationMessage,
      };

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

    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid orders data',
      });
    }

    const results = [];
    for (const order of orders) {
      const { paymentId, amount, orderId, email, name } = order;

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
            error: `Refund amount exceeds the remaining amount of ${(remainingAmount / 100).toFixed(2)} INR`,
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

        // Send confirmation email (optional)
        const formattedDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const confirmationMessage = `<!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; }
            .logo { max-height: 60px; }
            .content { padding: 20px 0; }
            .amount { font-size: 24px; font-weight: bold; text-align: center; padding: 15px; margin: 20px 0; background-color: #f8f8f8; border-radius: 5px; }
            .details { background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; font-size: 12px; color: #666; padding: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Refund Confirmation</h2>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              <p>Your order #${orderId} has been successfully refunded.</p>
              <div class="amount">${(refundAmount / 100).toFixed(2)} INR</div>
              <div class="details">
                <h3>Refund Details</h3>
                <p><strong>Order Number:</strong> #${orderId}</p>
                <p><strong>Refund Amount:</strong> ${(refundAmount / 100).toFixed(2)} INR</p>
                <p><strong>Refund ID:</strong> ${refund.id}</p>
                <p><strong>Refund Date:</strong> ${formattedDate}</p>
              </div>
              <p>Thank you for choosing us. We hope to serve you again soon.</p>
            </div>
            <div class="footer">
              <p>If you have any questions, please contact our customer support.</p>
            </div>
          </div>
        </body>
        </html>`;

        const mailOptions = {
          from: process.env.SMTP_EMAIL || 'your-email@example.com',
          to: email,
          subject: `Your Order #${orderId} Has Been Refunded`,
          html: confirmationMessage,
        };

        await transporter.sendMail(mailOptions);

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