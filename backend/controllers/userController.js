import userModel from "../models/userModel.js";
import transporter from "../config/nodeMailer.js";
const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: process.env.SMTP_EMAIL || 'vinaybuttala@gmail.com',
    to,
    subject,
    text,
  };
  await transporter.sendMail(mailOptions);
};

export const getUserData = async (req, res) => {
  try {
    const user = req.user; // user is already attached from middleware
    if (user) {

      const userDetails = await userModel.findById(user.id)
      // console.log(userDetails)
      res.json({ success: true, userData: userDetails });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
export const getUser = async (req, res) => {
  try {
    const user = await userModel.findOne();

    if (user) {
      res.status(200).json({ user });
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (error) {
    // console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
export const getAllUsers = async (req, res) => {
  try {
    const user = await userModel.find({});

    if (user) {
      res.status(200).json({ user });
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (error) {
    // console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
export const getKartStatus = async (req, res) => {
  try {
    const user = await userModel.findOne();
    res.json(user.isKart);
  } catch (error) {
    res.status(500).json({ error: "Failed to get kart status" });
  }
}
export const updateKartStatus = async (req, res) => {
  const { value } = req.body;
  // console.log('value', value);
  try {
    const users = await userModel.find({});
    if (!users.length) {
      return res.status(404).json({ error: "No users found" });
    }

    // Update all users' isKart status
    await Promise.all(users.map(async (user) => {
      user.isKart = value;
      await user.save();
    }));

    // Emit event (ensure `io` is available)
    if (typeof io !== "undefined") {
      io.emit("kart-status-updated", value);
    }

    // console.log('Updated isKart value:', value);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating kart status:', error);
    res.status(500).json({ error: "Failed to update kart status" });
  }
};

export const order = async (req, res) => {
  try {
    // if (!req.user) {
    //   console.log('❌ Unauthorized access: No user found in req.user');
    //   return res.status(401).json({ message: 'Unauthorized: Please log in to place an order.' });
    // }

    // console.log('📩 Order received from:', req.user.id);
    // console.log('📦 Order details:', req.body.orders);

    const { address, phone, orders } = req.body;
    if (!orders || orders.length === 0) {
      console.log('❌ No orders provided');
      return res.status(400).json({ message: 'No orders provided' });
    }

    // 🔍 Fetch the user from MongoDB
    const user = await userModel.findById(req.user.id);
    if (!user) {
      console.log('❌ User not found in DB');
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure fields exist before pushing
    if (!user.phone) user.phone = [];
    if (!user.address) user.address = [];
    if (!user.orders) user.orders = [];

    user.phone.push(phone);
    user.address.push(address);
    user.orders.push(...orders);

    await user.save();

    // console.log('✅ Order successfully saved for', user.email);

    res.status(200).json({ success: true, message: 'Order placed successfully.', email: user.email, user: user });
  } catch (error) {
    console.error('❌ Error placing order:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteUserOrder = async (req, res) => {
  console.log('Incoming request to delete order');

  const { id: orderId } = req.params;
  const { email, cancellationReason } = req.body;

  try {
    const user = await userModel.findOne({ email });

    if (user) {
      const orderIndex = user.orders.findIndex(order => order.orderId.toString() === orderId);

      if (orderIndex !== -1) {
        const details = user.orders[orderIndex];
        const { item, price, quantity, date, status } = details;

        // Only send email if the order status is "pending"
        if (status === 'pending') {
          const formattedDate = new Date(date).toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true, // 12-hour format with AM/PM
          });

          const subject = 'Order Cancellation Confirmation';
          const confirmationMessage = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background-color: #f7f7f7;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
      padding: 30px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px 25px;
    }
    h2 {
      color: #d32f2f;
      font-size: 22px;
      margin-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 10px;
    }
    .order-details, .feedback-section {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #d32f2f;
    }
    .footer {
      text-align: center;
      padding: 20px;
      background: #f5f5f5;
      color: #666;
      font-size: 14px;
      border-top: 1px solid #eeeeee;
    }
    .btn {
      background: #ffb300;
      color: white;
      padding: 12px 20px;
      text-decoration: none;
      border-radius: 4px;
      display: inline-block;
      font-weight: 500;
      text-align: center;
      margin: 10px 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>We’re Sorry! Your Order Was Cancelled</h1>
      <p>We sincerely apologize for any inconvenience caused.</p>
    </div>
    
    <div class="content">
      <h2>We Value Your Feedback!</h2>
      <p>We're sorry if we made any mistakes that led to your cancellation. Your feedback is important to us, and we'd love to hear your reason.</p>
      
      <div class="order-details">
        <h3>🛍️ Order Details</h3>
        <p><strong>Item Type:</strong> ${item}</p>
        <p><strong>Quantity:</strong> ${quantity}</p>
        <p><strong>Total Price:</strong> ₹${price}</p>
        <p><strong>Order Purchasing Date:</strong> ${formattedDate}</p>
        <p><strong>Status:</strong> <span style="color: #d32f2f; font-weight: bold;">Cancelled</span></p>
      </div>
      
      <div class="feedback-section">
        <h3>💬 Tell Us Why</h3>
        <p>Your feedback helps us improve. Please take a moment to share your reason for cancellation.</p>
        <div style="text-align: center;">
          <a href="https://palmyrakart.onrender.com/reviews" class="btn">Give Feedback</a>
        </div>
      </div>
      
      <p style="text-align: center;">We hope to serve you again soon. Thank you for choosing <strong>PalmyraKart</strong>! 💚</p>
    </div>

    <div class="footer">
      <p><strong>PalmyraKart</strong> - Fresh & Quality Products</p>
      <p>&copy; 2025 PalmyraKart. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

          const mailOptions = {
            from: process.env.SMTP_EMAIL || 'vinaybuttala@gmail.com',
            to: email,
            subject: subject,
            html: confirmationMessage, // Use 'html' instead of 'text' for proper email formatting
          };

          await transporter.sendMail(mailOptions);
        }

        // Remove order details from user
        user.address.splice(orderIndex, 1);
        user.phone.splice(orderIndex, 1);
        user.orders.splice(orderIndex, 1);

        await user.save();
        res.status(200).json({ message: 'Order deleted successfully' });

      } else {
        res.status(404).json({ message: 'Order not found' });
      }
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const sendOrderOtp = async (req, res) => {
  const { oid, orderOtp } = req.body;
  console.log(req.body);

  if (!oid || !orderOtp) {
    return res.json({ success: false, message: 'Order ID or OTP is missing' });
  }

  try {
    const user = req.user;
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    const userDetails = await userModel.findById(user.id);
    if (!userDetails) {
      return res.json({ success: false, message: 'User details not found' });
    }

    const order = userDetails.orders.find(o => o.orderId === oid);

    if (!order) {
      return res.json({ success: false, message: 'Order not found' });
    }

    order.otp = orderOtp;
    await userDetails.save();

    const item = order.item;
    const quantity = order.quantity;
    const price = order.price;
    const status = order.status;
    const date = order.date;
    const formattedDate = new Date(date).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    // Calculate the next day's date and day
    const pickupDeadline = new Date();
    pickupDeadline.setDate(pickupDeadline.getDate() + 1);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedPickupDeadline = pickupDeadline.toLocaleDateString('en-US', options);

    const email = userDetails.email;
    const subject = `Order Confirmation`;

    // Fixed template string - removed backslashes before $ signs
    const confirmationMessage = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Base Styles */
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background-color: #f7f7f7;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    /* Header */
    .header {
      background: linear-gradient(135deg, #34a853 0%, #1a73e8 100%);
      padding: 30px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0;
      opacity: 0.9;
    }
    /* Content */
    .content {
      padding: 30px 25px;
    }
    h2 {
      color: #1a73e8;
      font-size: 22px;
      margin-top: 0;
      margin-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 10px;
    }
    .highlight {
      color: #d32f2f;
      font-weight: 600;
    }
    /* Order Details */
    .order-details {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #1a73e8;
    }
    .order-details h3 {
      margin-top: 0;
      color: #1a73e8;
    }
    .order-details p {
      margin: 8px 0;
    }
    /* OTP Section */
    .otp-container {
      background: #e8f0fe;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 25px 0;
    }
    .otp {
      font-size: 28px;
      font-weight: bold;
      color: #1a73e8;
      letter-spacing: 2px;
      background: white;
      display: inline-block;
      padding: 10px 30px;
      border-radius: 6px;
      border: 1px dashed #1a73e8;
    }
    /* Collection Info */
    .collection-info {
      background: #fafafa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #34a853;
    }
    .collection-info h3 {
      margin-top: 0;
      color: #34a853;
    }
    .collection-info ul {
      padding-left: 20px;
    }
    .collection-info li {
      margin-bottom: 10px;
    }
    /* Help Section */
    .help-section {
      background: #fff4e5;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #fb8c00;
    }
    .help-section h3 {
      margin-top: 0;
      color: #fb8c00;
    }
    /* Footer */
    .footer {
      text-align: center;
      padding: 20px;
      background: #f5f5f5;
      color: #666;
      font-size: 14px;
      border-top: 1px solid #eeeeee;
    }
    /* Buttons */
    .btn {
      background: #1a73e8;
      color: white;
      padding: 12px 20px;
      text-decoration: none;
      border-radius: 4px;
      display: inline-block;
      font-weight: 500;
      text-align: center;
      margin: 10px 0;
    }
    .btn:hover {
      background: #1555ad;
    }
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .container {
        width: 100%;
        border-radius: 0;
      }
      .content {
        padding: 20px 15px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmation</h1>
      <p>Your order is ready for collection!</p>
    </div>
    
    <div class="content">
      <h2>🎉 Thank you for shopping with PalmyraKart!</h2>
      <p>Your order has been successfully placed and is now <span class="highlight">ready for collection.</span> We're excited to serve you!</p>

      <div class="order-details">
        <h3>🛍️ Order Details</h3>
        <p><strong>Item:</strong> ${item}</p>
        <p><strong>Quantity:</strong> ${quantity}</p>
        <p><strong>Total Price:</strong> <span class="highlight">₹${price}</span></p>
        <p><strong>Status:</strong> ${status}</p>
        <p><strong>Ordered Date:</strong> ${formattedDate}</p>
      </div>

      <div class="otp-container">
        <h3>🔒 Order Verification OTP</h3>
        <p>Present this code when collecting your order</p>
        <div class="otp">${order.otp}</div>
      </div>

      <div class="collection-info">
        <h3>📍 Collection Information</h3>
        <ul>
          <li><strong>Ready for Collection:</strong> <span class="highlight">After 10:00 AM</span></li>
          <li><strong>Collection Deadline:</strong> <span class="highlight">5:00 PM on ${formattedPickupDeadline}</span></li>
          <li>If you're unable to collect your order, <span class="highlight">don't worry!</span> A refund may be available as per our Terms & Conditions.</li>
          <li>You can also <span class="highlight">place a fresh order for tomorrow.</span> We'd love to serve you again!</li>
        </ul>
      </div>

      <div class="help-section">
        <h3>🛠️ Need Help?</h3>
        <p>If you have any questions about your order or need assistance, don't hesitate to contact our customer support team.</p>
        <a href="mailto:vinaybuttala@gmail.com" class="btn">Contact Support</a>
      </div>
      
      <p><strong>📌 Important:</strong> Before collecting, kindly review our 
        <a href="https://palmyrakart.onrender.com" style="color: #1a73e8; text-decoration: underline;">Terms & Conditions</a> 
        for more details on refunds and policies.</p>
    </div>

    <div class="footer">
      <p>Thank you for choosing <strong>PalmyraKart</strong>! We look forward to serving you again. 💙</p>
      <p>&copy; 2025 PalmyraKart. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

    // Make sure transporter is properly defined elsewhere in your code
    // If not defined, here's how you should define it:
    /*
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      }
    });
    */

    const mailOptions = {
      from: process.env.SMTP_EMAIL || 'vinaybuttala@gmail.com',
      to: email,
      subject: 'Order Confirmation..!',
      html: confirmationMessage // Send as HTML
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.json({ success: false, message: 'Failed to send OTP', error: error.message });
  }
};
export const verifyOrder = async (req, res) => {
  try {
    const { email, number, orderId } = req.body;
    const user = await userModel.findOne({ email });
    console.log(req.body, user.orders);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Find the specific order by orderId
    const order = user.orders.find(order => order.orderId === orderId);
    console.log('get', orderId, order.orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.otp === number) {
      order.status = 'delivered';
      await user.save();

      const item = order.item;
      const quantity = order.quantity;
      const price = order.price;
      const status = order.status;
      const date = order.date;
      const formattedDate = new Date(date).toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const confirmationMessage = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Base Styles */
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background-color: #f7f7f7;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    /* Header - Green for success */
    .header {
      background: linear-gradient(135deg, #34a853 0%, #2e7d32 100%);
      padding: 30px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0;
      opacity: 0.9;
    }
    /* Content */
    .content {
      padding: 30px 25px;
    }
    h2 {
      color: #2e7d32;
      font-size: 22px;
      margin-top: 0;
      margin-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 10px;
    }
    .highlight {
      color: #2e7d32;
      font-weight: 600;
    }
    /* Success Icon */
    .success-icon {
      text-align: center;
      margin: 20px 0;
    }
    .success-icon .circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background-color: #34a853;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 40px;
      font-weight: bold;
      line-height: 1;
    }
    /* Order Details */
    .order-details {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #34a853;
    }
    .order-details h3 {
      margin-top: 0;
      color: #2e7d32;
    }
    .order-details p {
      margin: 8px 0;
    }
    /* Feedback Section */
    .feedback-section {
      background: #e8f5e9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
    }
    .feedback-section h3 {
      margin-top: 0;
      color: #2e7d32;
    }
    /* Next Order Section */
    .next-order {
      background: #fff8e1;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #ffb300;
    }
    .next-order h3 {
      margin-top: 0;
      color: #ffb300;
    }
    /* Footer */
    .footer {
      text-align: center;
      padding: 20px;
      background: #f5f5f5;
      color: #666;
      font-size: 14px;
      border-top: 1px solid #eeeeee;
    }
    /* Buttons */
    .btn {
      background: #34a853;
      color: white;
      padding: 12px 20px;
      text-decoration: none;
      border-radius: 4px;
      display: inline-block;
      font-weight: 500;
      text-align: center;
      margin: 10px 5px;
    }
    .btn-secondary {
      background: #ffb300;
    }
    .btn:hover {
      opacity: 0.9;
    }
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .container {
        width: 100%;
        border-radius: 0;
      }
      .content {
        padding: 20px 15px;
      }
    }
    /* Social Icons */
    .social-links {
      margin-top: 15px;
    }
    .social-icon {
      display: inline-block;
      width: 36px;
      height: 36px;
      background-color: #f5f5f5;
      border-radius: 50%;
      margin: 0 5px;
      text-align: center;
      line-height: 36px;
      color: #666;
      text-decoration: none;
      font-size: 18px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Delivered!</h1>
      <p>Your order has been successfully collected</p>
    </div>
    
    <div class="content">
      <div class="success-icon">
        <div class="circle">✓</div>
      </div>
      
      <h2>🎉 Thank you for shopping with PalmyraKart!</h2>
      <p>We're happy to confirm that your order has been <span class="highlight">successfully delivered</span> to you. We hope you enjoy your purchase!</p>

      <div class="order-details">
        <h3>🛍️ Order Details</h3>
        <p><strong>Item:</strong> ${item}</p>
        <p><strong>Quantity:</strong> ${quantity}</p>
        <p><strong>Total Price:</strong> ₹${price}</p>
        <p><strong>Status:</strong> <span class="highlight">Delivered</span></p>
         <p><strong>Order Purchasing Date:</strong> ₹${formattedDate}</p>
        <p><strong>Delivery Date:</strong> ${new Date().toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })}</p>
      </div>

      <div class="feedback-section">
        <h3>💭 How was your experience?</h3>
        <p>We value your feedback! Please take a moment to let us know how we did.</p>
        <a href="https://palmyrakart.onrender.com/reviews" class="btn">Rate Your Experience</a>
      </div>

      <div class="next-order">
        <h3>🛒 Ready for your next order?</h3>
        <p>Browse our collection and discover more products you'll love!</p>
        <div style="text-align: center;">
          <a href="https://palmyrakart.onrender.com" class="btn btn-secondary">Shop Now</a>
        </div>
      </div>
      
      <p style="text-align: center;">Thank you for choosing <strong>PalmyraKart</strong>. We look forward to serving you again! 💚</p>
    </div>

    <div class="footer">
      <p><strong>PalmyraKart</strong> - Fresh & Quality Products</p>
      <div class="social-links">
        <a href="#" class="social-icon">f</a>
        <a href="#" class="social-icon">t</a>
        <a href="#" class="social-icon">in</a>
      </div>
      <p>&copy; 2025 PalmyraKart. All rights reserved.</p>
      <p>
        <small>
          <a href="https://palmyrakart.onrender.com/privacy" style="color: #666; margin: 0 10px;">Privacy Policy</a> | 
          <a href="https://palmyrakart.onrender.com/terms" style="color: #666; margin: 0 10px;">Terms & Conditions</a>
        </small>
      </p>
    </div>
  </div>
</body>
</html>

`;

      const mailOptions = {
        from: process.env.SMTP_EMAIL || 'vinaybuttala@gmail.com',
        to: email,
        subject: 'Order Delivered Successfully!',
        html: confirmationMessage
      };

      // Actually send the email - this line was missing!
      await transporter.sendMail(mailOptions);

      return res.status(200).json({ message: 'OTP verified and order status updated.' });
    } else {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


export const quantity = async (req, res) => {
  try {
    const users = await userModel.find({});
    let totalPieces = 0;
    let totalSum = 0;
    users.forEach(user => {
      user.orders.forEach(order => {
        // Only consider orders that are 'pending'
        if (order.status === 'pending') {
          const pieces = (order.item === 'dozen') ? order.quantity * 12 : order.quantity;
          totalPieces += pieces;
          totalSum += order.price * order.quantity;
        }
      });
    });

    res.status(200).json({ totalPieces, totalSum });
  } catch (error) {
    console.error('Error fetching total pieces and sum:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export const sendNotification = async (req, res) => {
  const { subject, message } = req.body;
  try {
    const users = await userModel.find({}, 'email');
    if (users && users.length > 0) {
      for (const user of users) {
        const email = user.email;
        const sub = subject;
        const msg = message;
        const mailOptions = {
          from: process.env.SMTP_EMAIL || 'vinaybuttala@gmail.com',
          to: email,
          subject: sub,
          text: msg
        }
        await transporter.sendMail(mailOptions)
      }

      res.status(200).json({ message: 'Emails sent to all users successfully.' });
    } else {
      res.status(404).json({ message: 'No users found.' });
    }
  } catch (error) {
    console.error('Error sending notification emails:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export const closeOrder = async (req, res) => {
  try {
    const { subject } = req.body;
    const users = await userModel.find({});

    if (users.length > 0) {
      let pendingOrdersFound = false;

      for (const user of users) {
        const email = user.email;
        user.orders.forEach(order => {
          if (order.status === 'pending') {
            const item = order.item;
            const quantity = order.quantity;
            const price = order.price;

            const formattedDate = new Date(order.date).toLocaleString('en-US', {
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });

            pendingOrdersFound = true;
            order.status = 'expired';

            const htmlMessage = `
                      
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Base Styles */
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background-color: #f7f7f7;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    /* Header - Red for cancellation */
    .header {
      background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
      padding: 30px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0;
      opacity: 0.9;
    }
    /* Content */
    .content {
      padding: 30px 25px;
    }
    h2 {
      color: #d32f2f;
      font-size: 22px;
      margin-top: 0;
      margin-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 10px;
    }
    .highlight {
      color: #d32f2f;
      font-weight: 600;
    }
    /* Cancellation Icon */
    .cancel-icon {
      text-align: center;
      margin: 20px 0;
    }
    .cancel-icon .circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background-color: #d32f2f;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 40px;
    }
    /* Order Details */
    .order-details {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #d32f2f;
    }
    .order-details h3 {
      margin-top: 0;
      color: #d32f2f;
    }
    .order-details p {
      margin: 8px 0;
    }
    /* Next Order Section */
    .next-order {
      background: #fff8e1;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #ffb300;
    }
    .next-order h3 {
      margin-top: 0;
      color: #ffb300;
    }
    /* Footer */
    .footer {
      text-align: center;
      padding: 20px;
      background: #f5f5f5;
      color: #666;
      font-size: 14px;
      border-top: 1px solid #eeeeee;
    }
    /* Buttons */
    .btn {
      background: #ffb300;
      color: white;
      padding: 12px 20px;
      text-decoration: none;
      border-radius: 4px;
      display: inline-block;
      font-weight: 500;
      text-align: center;
      margin: 10px 5px;
    }
    .btn:hover {
      opacity: 0.9;
    }
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .container {
        width: 100%;
        border-radius: 0;
      }
      .content {
        padding: 20px 15px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Cancelled</h1>
      <p>We regret to inform you that your order has been cancelled</p>
    </div>
    
    <div class="content">
      <div class="cancel-icon">
        <div class="circle">✖</div>
      </div>
      
      <h2>We're sorry! Your order has been cancelled.</h2>
  <p>Unfortunately, you were unable to collect your order before <span class="highlight">5:00 PM on ${new Date().toLocaleString('en-US', {
    month: 'long',
    day: 'numeric'
  })}</span>, and our session has now closed.</p>
<p>Don't worry! You can place a fresh order for tomorrow at your convenience. We’d love to serve you again!</p>
<p>Your refund will be credited soon. Please allow some time for processing.</p>
<p>For more details, kindly review our <a href="https://palmyrakart.onrender.com" style="color: #2e7d32; text-decoration: none; font-weight: 600;">Terms & Conditions</a>.</p>


      <div class="order-details">
        <h3>🛍️ Order Details</h3>
        <p><strong>Item Type:</strong> ${item}</p>
        <p><strong>Quantity:</strong> ${quantity}</p>
        <p><strong>Total Price:</strong> ₹${price}</p>
        <p><strong>Status:</strong> <span class="highlight">Cancelled</span></p>
        <p><strong>Order Purchasing Date:</strong> ${formattedDate}</p>
        <p><strong>Cancellation Time:</strong> ${new Date().toLocaleString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}</p>
      </div>

      <div class="next-order">
        <h3>🛒 Ready to reorder?</h3>
        <p>You can place a new order for tomorrow. We’d love to serve you with fresh and quality products!</p>
        <div style="text-align: center;">
          <a href="https://palmyrakart.onrender.com" class="btn">Place a New Order</a>
        </div>
      </div>
      
      <p style="text-align: center;">Thank you for choosing <strong>PalmyraKart</strong>. We hope to see you again soon! 💚</p>
    </div>

    <div class="footer">
      <p><strong>PalmyraKart</strong> - Fresh & Quality Products</p>
      <p>&copy; 2025 PalmyraKart. All rights reserved.</p>
      <p>
        <small>
          <a href="https://palmyrakart.onrender.com/privacy" style="color: #666; margin: 0 10px;">Privacy Policy</a> | 
          <a href="https://palmyrakart.onrender.com/terms" style="color: #666; margin: 0 10px;">Terms & Conditions</a>
        </small>
      </p>
    </div>
  </div>
</body>
</html>


                      `;

            const mailOptions = {
              from: process.env.SMTP_EMAIL || 'vinaybuttala@gmail.com',
              to: email,
              subject: subject,
              html: htmlMessage,
            };

            transporter.sendMail(mailOptions);
          }
        });
        await user.save();
      }

      if (pendingOrdersFound) {
        res.status(200).json({ message: 'All pending orders have been set to expired.' });
      } else {
        res.status(201).json({ message: 'No pending orders found.' });
      }
    } else {
      res.status(201).json({ message: 'No users found.' });
    }
  } catch (error) {
    console.error('Error closing orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const limitUpdate = async (req, res) => {
  const { hlimit } = req.body;
  console.log('limit', hlimit);

  try {
    // Find all users
    const users = await userModel.find({});

    // Update the limit for each user
    users.forEach(async (user) => {
      user.limit = hlimit;
      await user.save(); // Save the updated user
    });
    //  io.emit("limit-status-updated",hlimit)
    res.status(200).json('Limit updated for all users');
  } catch (error) {
    console.error('Error updating limit:', error);
    res.status(500).json('Error updating limit');
  }
}

export const getReviews = async (req, res) => {
  try {
    const users = await userModel.find({});

    // Collect all reviews from all users
    const allReviews = users.flatMap(user => user.reviews);
    res.json({ reviews: allReviews });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
}

export const isUserReviews = async (req, res) => {
  try {
    const userEmail = req.query.email;  // Assuming email is passed as query parameter
    const user = await userModel.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ reviews: user.reviews });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
}
export const addReviews = async (req, res) => {
  const { email, rating, highlight, comment } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const newReview = {
      user: {
        email,
        name: user.name,  // Assuming user's name is available
      },
      rating,
      highlight,
      comment,
      date: new Date(),
    };

    // Add the review to the user's reviews array
    user.reviews.push(newReview);
    await user.save();

    res.status(201).json({ review: newReview });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
}

export const updateReview = async (req, res) => {
  const { comment, rating, highlight } = req.body;
  console.log(req.body)
  const reviewId = req.params.reviewId;

  try {
    const user = await userModel.findOne({ 'reviews._id': reviewId });

    if (!user) {
      return res.status(404).json({ message: 'User not found or Review not found' });
    }

    // Find the review to update
    const review = user.reviews.id(reviewId);
    review.comment = comment;
    review.rating = rating;
    review.highlight = highlight;

    await user.save();

    res.json({ review });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
}

export const deleteReview = async (req, res) => {
  const reviewId = req.params.reviewId;

  try {
    const user = await userModel.findOne({ 'reviews._id': reviewId });

    if (!user) {
      return res.status(404).json({ message: 'User not found or Review not found' });
    }

    // Remove the review from the user's reviews array
    user.reviews.pull(reviewId);
    await user.save();

    res.status(200).send('Review deleted');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
}
export const replyReview = async (req, res) => {
  const { email, sub, msg } = req.body;
  // console.log('body',req.body)
  try {
    const mailOptions = {
      from: process.env.SMTP_EMAIL || 'vinaybuttala@gmail.com',
      to: email,
      subject: sub,
      text: msg
    }
    await transporter.sendMail(mailOptions)
    res.status(200).json({ msg: 'sent successfully' })
  }
  catch {
    res.status(500).json('error')
  }
}