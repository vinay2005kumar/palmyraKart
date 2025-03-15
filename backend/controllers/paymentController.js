
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { Order } from '../models/orderSchema.js'; // Import the Order model
dotenv.config(); // Load environment variables
import mongoose from 'mongoose';
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
      amount, 
      orderNumber, 
      customerName, 
      email, 
      currency = "INR",
      cancellationReason = "customer" // "customer" or "timeout"
    } = req.body;

    // Input validation
    if (!paymentId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid payment ID or amount' });
    }

    // Issue refund using Razorpay API
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount, // Amount to refund (in paise)
      speed: 'normal', // Refund speed (normal or opt)
    });
    // Update order status to 'Refunded'
    const order = await Order.findOne({ orderId: orderNumber });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.paymentStatus = 'Refunded';
    order.refundId = refund.id;
    await order.save();
    // Company information
    const companyName = "Your Company Name";
    const companyAddress = "Your Company Address";
    const supportEmail = "support@yourcompany.com";
    const supportPhone = "123-456-7890";
    const websiteUrl = "https://yourwebsite.com";
    const refundId = refund.id;
    
    // Create the email HTML with the template (replace variables)
    const confirmationMessage = `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 1px solid #eeeeee;
    }
    .logo {
      max-width: 150px;
      height: auto;
    }
    .content {
      padding: 20px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #777777;
      padding: 20px;
      border-top: 1px solid #eeeeee;
    }
    .details {
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
      border-left: 4px solid #cccccc;
    }
    .amount {
      font-size: 24px;
      font-weight: bold;
      color: #333333;
      text-align: center;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background-color: #4CAF50;
      color: white;
      padding: 12px 25px;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin-top: 15px;
    }
    .divider {
      height: 1px;
      background-color: #eeeeee;
      margin: 25px 0;
    }
    .contact-box {
      text-align: center;
      padding: 15px;
      background-color: #f9f9f9;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="[YOUR_LOGO_URL]" alt="Company Logo" class="logo">
      <h2>Refund Confirmation</h2>
    </div>
    
    <div class="content">
      <p>Dear ${customerName},</p>
      
      ${cancellationReason === 'customer' ? 
        `<p>Your order #${orderNumber} has been successfully canceled as per your request, and a refund has been issued.</p>` : 
        `<p>Your order #${orderNumber} was automatically canceled as it was not collected/delivered within the scheduled timeframe. A full refund has been processed.</p>`
      }
      
      <div class="amount">
        ${amount/100} ${currency}
      </div>
      
      <div class="details">
        <h3>Refund Details</h3>
        <p><strong>Order Number:</strong> #${orderNumber}</p>
        <p><strong>Refund Amount:</strong> ${amount/100} ${currency}</p>
        <p><strong>Refund ID:</strong> ${refundId}</p>
        <p><strong>Refund Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Payment Method:</strong> Original payment method</p>
        <p><strong>Expected Processing Time:</strong> 5-7 business days</p>
      </div>
      
      <p>${cancellationReason === 'customer' ? 
        `If you canceled due to any issues, we’d love your feedback to help improve our service.` : 
        `We understand this may be disappointing. If you faced any difficulties, please let us know so we can enhance our service.`
      }</p>
      
      <div class="divider"></div>
      
      <p>Looking to place a new order? Visit our website or mobile app.</p>
      
      <center><a href="${websiteUrl}" class="button">Visit Our Store</a></center>
      
      <div class="contact-box">
        <p>Need help with your refund?</p>
        <p>Contact our support team at:<br>
        Email: ${supportEmail}<br>
        Phone: ${supportPhone}</p>
      </div>
      
      <p>Thank you for choosing ${companyName}. We hope to serve you again soon.</p>
      
      <p>Best regards,<br>
      The ${companyName} Team</p>
    </div>
    
    <div class="footer">
      <p>${companyName} | ${companyAddress}</p>
      <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

    const subject = cancellationReason === 'customer' 
      ? `Your Order #${orderNumber} Has Been Cancelled - Refund Processed`
      : `Order #${orderNumber} Cancellation Due to Timeout - Refund Processed`;

    const mailOptions = {
      from: process.env.SMTP_EMAIL || 'vinaybuttala@gmail.com',
      to: email,
      subject: subject,
      html: confirmationMessage,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({
      success: true,
      refundId: refund.id,
      status: refund.status,
      message: 'Refund initiated successfully and confirmation email sent'
    });
     
  } catch (error) {
    console.error('Error issuing refund:', error);
    res.status(500).json({ error: 'Refund initiation failed' });
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