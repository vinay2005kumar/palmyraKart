import  User  from '../models/userModel.js'; // Import the User model
import { Order } from '../models/orderSchema.js'; // Import the Order model
import transporter from "../config/nodeMailer.js";
import { Review } from '../models/reviewShema.js'; // Import the Review model
import mongoose from 'mongoose';
export const getUserData = async (req, res) => {
  try {
    const user = req.user;
    // user is already attached from middleware
    
    if (!user || !user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
    }

    // Fetch user details
    const userDetails = await User.findById(user.id);
    if (!userDetails) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Fetch orders for the user - using the ID directly instead of creating a new ObjectId
    const orderDetails = await Order.find({ user:user.id });
    
    // If the above doesn't work, try this alternative:
    // const orderDetails = await Order.find({ 
    //   user: mongoose.Types.ObjectId.isValid(user.id) ? user.id : null 
    // });

    const reviewDetails = await Review.find({ user: user.id });

    // Debug logging
    console.log('User ID:', user.id);
    console.log('Order count:', orderDetails.length);
    console.log('Review count:', reviewDetails.length);

    res.json({
      success: true,
      userData: userDetails,
      orderData: orderDetails,
      reviewData: reviewDetails,
    });
  } catch (error) {
    console.error("Error in getUserData:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
  export const getUser = async (req, res) => {
    try {
      const user = await User.findOne();
  
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
      // Extract user ID from req.user
      const userId = req.user.id;
      console.log(userId,req.user)
      // Fetch the user from the database
      const user = await User.findById(userId);
  
      // Check if the user exists and is an admin
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: 'Forbidden: Only admins can access this data.' });
      }
  
      // Fetch all users, orders, and reviews
      const users = await User.find({});
      const orders = await Order.find({});
      const reviews = await Review.find({});
  
      // console.log('data', users, orders, reviews);
  
      // Return the data
      res.status(200).json({ users, orders, reviews });
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };


export const getKartStatus = async (req, res) => {
  try {
    const user = await User.findOne();
    res.json(user.isKart);
  } catch (error) {
    res.status(500).json({ error: "Failed to get kart status" });
  }
}
export const updateKartStatus = async (req, res) => {
  const { value } = req.body;
  // console.log('value', value);
  try {
    const users = await User.find({});
    if (!users.length) {
      return res.status(404).json({ error: "No users found" });
    }

    // Update all users' isKart status
    await Promise.all(users.map(async (user) => {
      user.isKart = value;
      await user.save();
    }));

    // console.log('Updated isKart value:', value);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating kart status:', error);
    res.status(500).json({ error: "Failed to update kart status" });
  }
};


// export const order = async (req, res) => {
//   try {
//     // Extract required fields from req.body
//     const { address, phone, orders } = req.body;

//     // Validate orders
//     if (!orders || orders.length === 0) {
//       console.log('❌ No orders provided');
//       return res.status(400).json({ message: 'No orders provided' });
//     }

//     // Fetch the user from MongoDB (assuming req.user._id is available)
//     const user = await User.findById(req.user.id);
//     if (!user) {
//       console.log('❌ User not found in DB');
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Create a new order
//     const newOrder = new Order({
//       orderId: orders[0].orderId || `ORD${Date.now()}`, // Use provided orderId or generate one
//       user: user.id, // Reference to the user
//       items: orders.map(order => ({
//         itemType: order.itemType || 'General', // Default to 'General' if not provided
//         itemName: order.item || 'Unnamed Item', // Use 'item' from orderDetails
//         quantity: order.quantity || 1, // Default to 1 if not provided
//         price: order.price || 0, // Default to 0 if not provided
//         imagePath: order.imagePath || '' // Default to empty string if not provided
//       })),
//       totalAmount: orders.reduce((total, order) => total + (order.price || 0) * (order.quantity || 1), 0), // Calculate total amount
//       tax: 0, // Default tax
//       shippingCost: 0, // Default shipping cost
//       discount: 0, // Default discount
//       finalAmount: orders.reduce((total, order) => total + (order.price || 0) * (order.quantity || 1), 0), // Same as totalAmount for now
//       paymentMethod: 'Cash on Delivery', // Default payment method
//       paymentStatus: 'Pending', // Default status
//       shippingAddress: {
//         street: address.street || 'Address not provided', // Default to 'Address not provided'
//         city: address.city || '',
//         state: address.state || '',
//         country: address.country || '',
//         zipCode: address.zipCode || '',
//         phoneNumber: phone || '' // Use the phone from req.body
//       },
//       status: orders[0].status || 'Pending', // Use provided status or default to 'Pending'
//       date: orders[0].date || Date.now(), // Use provided date or default to current timestamp
//       paymentId: orders[0].paymentId || '', // Use provided paymentId or default to empty string
//       notes: '' // Default notes (empty)
//     });

//     // Save the order to the database
//     await newOrder.save();

//     // Add the order ID to the user's orders array
//     user.orders.push(newOrder._id);
//     await user.save();

//     console.log('✅ Order successfully saved for', user.email);

//     res.status(200).json({
//       success: true,
//       message: 'Order placed successfully.',
//       email: user.email,
//       order: newOrder
//     });
//   } catch (error) {
//     console.error('❌ Error placing order:', error.message);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

export const orderCancel = async (req, res) => {
  console.log('Incoming request to delete order',req.params,req.body);

  const { id: orderId } = req.params;
  const { email, cancellationReason } = req.body;


  try {
    // Find the user by email
    const user = await User.findOne({ email });
    
    if (user) {
      // Find the order in the Order collection
      const order = await Order.findOne({ orderId: orderId, user: user._id });

      if (order) {
        const { items, finalAmount, date, status } = order;

        // Only send email if the order status is "pending"
        if (status === 'Pending') {
          const formattedDate = new Date(date).toLocaleString('en-US', {
            timeZone: 'Asia/Kolkata',
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
        <p><strong>Item Type:</strong> ${items[0].itemType}</p>
        <p><strong>Item Name:</strong> ${items[0].itemName}</p>
        <p><strong>Quantity:</strong> ${items[0].quantity}</p>
        <p><strong>Total Price:</strong> ₹${finalAmount}</p>
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

        // Update the order status to "Cancelled"
        order.status = 'Cancelled';
        order.cancellationReason = cancellationReason || 'No reason provided';
        order.cancelledBy = 'Customer'; // Assuming the customer initiated the cancellation
        await order.save();

        // Remove the order reference from the user's orders array
        user.orders.pull(order._id);
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const cancelSelectedOrders = async (req, res) => {
  const { orderIds } = req.body; // Array of order IDs to cancel

  if (!orderIds || !Array.isArray(orderIds)) {
    return res.status(400).json({ message: 'Invalid order IDs provided' });
  }

  try {
    // Step 1: Find the orders with the provided order IDs
    const orders = await Order.find({ orderId: { $in: orderIds } });

    if (orders.length === 0) {
      return res.status(404).json({ message: 'No orders found to cancel' });
    }

    // Step 2: Loop through each order and fetch the associated user
    for (const order of orders) {
      const { items, finalAmount, date, status, user: userId } = order;
      const item=items[0].itemName
      const quantity=items[0].quantity
      // Fetch the user associated with the order
      const user = await User.findById(userId);

      if (!user) {
        console.warn(`User not found for order ID: ${order.orderId}`);
        continue; // Skip this order if the user is not found
      }

      // Only send email if the order status is "pending"
      if (status === 'Pending') {
        const formattedDate = new Date(date).toLocaleString('en-US', {
          timeZone: 'Asia/Kolkata',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true, // 12-hour format with AM/PM
        });

        const subject = 'Order Cancellation Confirmation';
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
                <p><strong>Total Price:</strong> ₹${finalAmount}</p>
                <p><strong>Status:</strong> <span class="highlight">Cancelled</span></p>
                <p><strong>Order Purchasing Date:</strong> ${date}</p>
                <p><strong>Cancellation Time:</strong> ${new Date().toLocaleString('en-US', {
                      timeZone: 'Asia/Kolkata',
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
                  <a href="https://palmyrakart.onrender.com" style="color: #666; margin: 0 10px;">Privacy Policy</a> | 
                  <a href="https://palmyrakart.onrender.com" style="color: #666; margin: 0 10px;">Terms & Conditions</a>
                </small>
              </p>
            </div>
          </div>
        </body>
        </html>
        `;

        const mailOptions = {
          from: process.env.SMTP_EMAIL || 'vinaybuttala@gmail.com',
          to: user.email,
          subject: subject,
          html: htmlMessage,
        };

        await transporter.sendMail(mailOptions);
      }

      // Update the order status to "Cancelled" and mark it as cancelled by the admin
      order.status = 'Cancelled';
      order.cancellationReason = 'Cancelled by Admin';
      order.cancelledBy = 'Admin';
      await order.save();

    }

    res.status(200).json({ message: 'Selected orders cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling selected orders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  const { orderId } = req.params; // Get orderId from query parameters
  console.log('Deleting order with ID:', orderId);

  try {
    // Find the order by orderId
    const order = await Order.findOne({ orderId });

    if (!order) {
      console.log('Order not found');
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Delete the order
    await Order.deleteOne({ orderId });

    console.log('Order deleted successfully');
    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ success: false, message: 'Failed to delete order' });
  }
};

export const removeOrder=async(req,res)=>{
  const { orderId } = req.params; // Get orderId from query parameters
  console.log('Deleting order with ID:', orderId);

  try {
    // Find the order by orderId
    const order = await Order.findOne({ orderId });
    const newstatus=order.status
    if (!order) {
      console.log('Order not found');
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status=`${newstatus}*`
   
    await order.save()

    console.log('Order deleted successfully',order.status);
    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ success: false, message: 'Failed to delete order' });
  }
};


export const sendOrderOtp = async (req, res) => {
  const { oid, orderOtp } = req.body;

  if (!oid || !orderOtp) {
    return res.json({ success: false, message: 'Order ID or OTP is missing' });
  }

  try {
    const user = req.user;
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    // Fetch the user details
    const userDetails = await User.findById(user.id);
    if (!userDetails) {
      return res.json({ success: false, message: 'User details not found' });
    }

    // Find the order in the Order collection
    const order = await Order.findOne({ orderId: oid, user: user.id });
    if (!order) {
      console.log('not order found')
      return res.json({ success: false, message: 'Order not found' });
    }
    console.log('saved')
    // Update the order with the OTP and current date

    const istDate= new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata', // Set the time zone to IST
      month: 'long', // Full month name (e.g., "October")
      day: 'numeric', // Day of the month (e.g., "25")
      hour: '2-digit', // Hour in 12-hour format (e.g., "02" or "11")
      minute: '2-digit', // Minutes (e.g., "30")
      second: '2-digit', // Seconds (e.g., "45")
      hour12: true, // Use 12-hour format (e.g., "2:30 PM")
    });
    order.otp = orderOtp;
    await order.save();
    console.log(order.date)

    // Prepare email content
    const item = order.items[0].itemName; // Use the first item in the order
    const quantity = order.items[0].quantity;
    const price = order.finalAmount;
    const status = order.status;
    const date = order.date;

    const formattedDate = new Date(date).toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    // Calculate the next day's date and day
    const orderTime = new Date(); // Current order time
    const pickupDeadline = new Date(orderTime); // Initialize with order time

    // Check if order is placed before 10:00 AM
    if (orderTime.getHours() < 10) {
      // Pickup deadline remains the same day
    } else {
      // Pickup deadline moves to the next day
      pickupDeadline.setDate(pickupDeadline.getDate() + 1);
    }

    // Formatting pickup deadline as "Month Day" (e.g., "March 13")
    const formattedDeadline = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata', // Adjust to your local timezone
      month: 'long',
      day: 'numeric',
    });

    const email = userDetails.email;
    const subject = `Order Confirmation`;

    // Email template
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
    .order-details, .payment-details, .customer-details {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #1a73e8;
    }
    .order-details h3, .payment-details h3, .customer-details h3 {
      margin-top: 0;
      color: #1a73e8;
    }
    .order-details p, .payment-details p, .customer-details p {
      margin: 8px 0;
    }
    /* Different colors for different sections */
    .payment-details {
      border-left: 4px solid #9c27b0;
    }
    .payment-details h3 {
      color: #9c27b0;
    }
    .customer-details {
      border-left: 4px solid #00bcd4;
    }
    .customer-details h3 {
      color: #00bcd4;
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
    /* Tracking Button */
    .tracking-btn {
      background: #34a853;
    }
    .tracking-btn:hover {
      background: #2e7d32;
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
        <p><strong>Order ID:</strong> ${order.orderId}</p>
        <p><strong>Item:</strong> ${item}</p>
        <p><strong>Quantity:</strong> ${quantity}</p>
        <p><strong>Total Price:</strong> <span class="highlight">₹${price}</span></p>
        <p><strong>Status:</strong> ${status}</p>
        <p><strong>Ordered Date:</strong> ${order.date}</p>
      </div>

      <div class="payment-details">
        <h3>💳 Payment Information</h3>
        <p><strong>Payment ID:</strong> ${order.paymentId}</p>
        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
        <p><strong>Payment Date:</strong> ${order.date}</p>
        <p><strong>Payment Status:</strong> <span class="highlight">Successful</span></p>
      </div>

      <div class="customer-details">
        <h3>👤 Customer Information</h3>
        <p><strong>Name:</strong> ${userDetails.name || 'Not provided'}</p>
        <p><strong>Email:</strong> ${userDetails.email}</p>
        <p><strong>Phone:</strong> ${order.shippingAddress.phoneNumber || userDetails.phone || 'Not provided'}</p>
        <p><strong>Collection Address:</strong> ${order.shippingAddress.street || 'Not provided'}</p>
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
          <li><strong>Collection Deadline:</strong> <span class="highlight">5:00 PM on ${pickupDeadline}</span></li>
          <li><strong>Collection Point:</strong> <span class="highlight">PalmyraKart Store, Main Street</span></li>
          <li>If you're unable to collect your order, <span class="highlight">don't worry!</span> A refund may be available as per our Terms & Conditions.</li>
          <li>You can also <span class="highlight">place a fresh order for tomorrow.</span> We'd love to serve you again!</li>
        </ul>
      </div>

      <div class="help-section">
        <h3>🛠️ Need Help?</h3>
        <p>If you have any questions about your order or need assistance, don't hesitate to contact our customer support team.</p>
        <p><strong>Contact:</strong> +91 1234567890</p>
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

    // Send email
    const mailOptions = {
      from: process.env.SMTP_EMAIL || 'vinaybuttala@gmail.com',
      to: email,
      subject: subject,
      html: confirmationMessage,
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
    const { email, number, orderId,otp } = req.body;
     console.log(req.body)
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Find the order in the Order collection
    const order = await Order.findOne({ orderId: orderId, user: user._id });
    if (!order) {
      console.log('ord not')
      return res.status(404).json({ message: 'Order not found.' });
    }
     console.log(order.otp)
    // Verify the OTP
    if (String(order.otp) === String(otp)) {
      // Update the order status to "Delivered"
      order.status = 'Delivered';
      await order.save();

      // Prepare email content
      const item = order.items[0].itemName; // Use the first item in the order
      const quantity = order.items[0].quantity;
      const price = order.finalAmount;
      const date = order.date;

      const formattedDate = new Date(date).toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
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
        <p><strong>Order Purchasing Date:</strong> ${order.date}</p>
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

      // Send email
      const mailOptions = {
        from: process.env.SMTP_EMAIL || 'vinaybuttala@gmail.com',
        to: email,
        subject: 'Order Delivered Successfully!',
        html: confirmationMessage,
      };

      await transporter.sendMail(mailOptions);

      return res.status(200).json({ message: 'OTP verified and order status updated.' });
    } else {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};


export const quantity = async (req, res) => {
  try {
    // Fetch all orders with status 'Pending'
    const orders = await Order.find({ status: 'Pending' });

    let totalPieces = 0;
    let totalSum = 0;

    // Calculate total pieces and total sum
    orders.forEach(order => {
      order.items.forEach(item => {
        const pieces = (item.itemType === 'dozen') ? item.quantity * 12 : item.quantity;
        totalPieces += pieces;
        totalSum += item.price * item.quantity;
      });
    });

    res.status(200).json({ totalPieces, totalSum });
  } catch (error) {
    console.error('Error fetching total pieces and sum:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


export const sendNotification = async (req, res) => {
    const { subject, message } = req.body;
  
    try {
      // Fetch all users with their email addresses
      const users = await User.find({}, 'email');
      if (users && users.length > 0) {
        // Send email to each user
        for (const user of users) {
          const email = user.email;
          const msg=
         `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Special Offer on Palmyra Fruits</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f9f7f2;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #2e7d32;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .logo {
            max-width: 150px;
            margin-bottom: 10px;
        }
        .banner {
            width: 100%;
            height: auto;
            display: block;
        }
        .content {
            padding: 30px;
            color: #333333;
        }
        .title {
            color: #2e7d32;
            font-size: 24px;
            margin-bottom: 20px;
            text-align: center;
        }
        .message {
            line-height: 1.6;
            margin-bottom: 25px;
        }
        .product-container {
            display: flex;
            margin: 20px 0;
            background-color: #f4f9f4;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .product-image {
            width: 120px;
            height: 120px;
            border-radius: 8px;
            object-fit: cover;
            margin-right: 15px;
        }
        .product-info {
            flex: 1;
        }
        .product-name {
            font-weight: bold;
            font-size: 18px;
            color: #2e7d32;
            margin-top: 0;
            margin-bottom: 10px;
        }
        .product-description {
            font-size: 14px;
            margin-bottom: 10px;
        }
        .product-price {
            font-weight: bold;
            color: #e65100;
        }
        .cta-button {
            display: block;
            background-color: #e65100;
            color: white;
            text-decoration: none;
            padding: 12px 25px;
            text-align: center;
            border-radius: 5px;
            font-weight: bold;
            margin: 25px auto;
            width: 200px;
            transition: background-color 0.3s;
        }
        .cta-button:hover {
            background-color: #d84315;
        }
        .footer {
            background-color: #f4f4f4;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666666;
        }
        .social-icons {
            margin: 15px 0;
        }
        .social-icon {
            display: inline-block;
            width: 30px;
            height: 30px;
            background-color: #2e7d32;
            border-radius: 50%;
            margin: 0 5px;
            text-align: center;
            line-height: 30px;
            color: white;
            text-decoration: none;
        }
        .promotion {
            background-color: #fff8e1;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .promotion-title {
            color: #e65100;
            margin-top: 0;
            margin-bottom: 10px;
        }
        .unsubscribe {
            color: #999999;
            text-decoration: underline;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade {
            animation: fadeIn 1s ease-in;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://via.placeholder.com/150x50" alt="Palmyra Fruits" class="logo">
            <h1>Fresh Palmyra Fruits</h1>
        </div>
        <img src="https://via.placeholder.com/600x300" alt="Fresh Palmyra Fruits" class="banner">
        <div class="content">
            <h2 class="title animate-fade">Special Season Offer!</h2>
            <p class="message">
                Dear Valued Customer,
            </p>
            <p class="message">
                We're excited to announce that our fresh Palmyra fruit season has begun! This tropical delicacy is now available in our store.
            </p>
              <p class="message">
               ${message}
            </p>
            <div class="promotion">
                <h3 class="promotion-title">Limited Time Fruits</h3>
                <p><a href='https://palmyrakart.onrender.com'>Visit Link</a> To Make Fresh Fruits Quickly</p>
            </div>
            <h3>Featured Products:</h3>
            <div class="product-container animate-fade">
                <img src="https://via.placeholder.com/120" alt="Fresh Palmyra Fruit" class="product-image">
                <div class="product-info">
                    <h4 class="product-name">Fresh Palmyra Fruit</h4>
                    <p class="product-description">Handpicked from organic farms, our Palmyra fruits are rich in vitamins and minerals.</p>
                    <p class="product-price">$5.99 per kg</p>
                </div>
            </div>
            <div class="product-container animate-fade">
                <img src="https://via.placeholder.com/120" alt="Palmyra Fruit Juice" class="product-image">
                <div class="product-info">
                    <h4 class="product-name">Palmyra Fruit Juice</h4>
                    <p class="product-description">Pure, refreshing, and naturally sweet juice made from fresh Palmyra fruits.</p>
                    <p class="product-price">$3.99 per bottle</p>
                </div>
            </div>
            <a href="https://palmyrakart.onrender.com" class="cta-button">SHOP NOW</a>
            <p class="message">
                Thank you for choosing our store for your Palmyra fruit needs. We look forward to serving you with the freshest and best quality fruits.
            </p>
            <p class="message">
                Best regards,<br>
                The Palmyra Fruits Team
            </p>
        </div>
        <div class="footer">
            <div class="social-icons">
                <a href="https://facebook.com/palmyrafruits" class="social-icon">f</a>
                <a href="https://instagram.com/palmyrafruits" class="social-icon">i</a>
                <a href="https://twitter.com/palmyrafruits" class="social-icon">t</a>
            </div>
            <p>© 2025 Palmyra Fruits. All rights reserved.</p>
            <p>123 Fruit Street, Tropical City, TC 12345</p>
            <p>
                <a href="https://yourwebsite.com/unsubscribe" class="unsubscribe">Unsubscribe</a> from our mailing list
            </p>
        </div>
    </div>
</body>
</html>`
          const mailOptions = {
            from: process.env.SMTP_EMAIL || 'vinaybuttala@gmail.com',
            to: email,
            subject: subject,
            html: msg, // Use personalized HTML
          };
  
          await transporter.sendMail(mailOptions);
        }
  
        res.status(200).json({ message: 'Emails sent to all users successfully.' });
      } else {
        res.status(404).json({ message: 'No users found.' });
      }
    } catch (error) {
      console.error('Error sending notification emails:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };


export const closeOrder = async (req, res) => {
  try {
    const { subject } = req.body;

    // Fetch all users
    const users = await User.find({});
    if (users.length > 0) {
      let pendingOrdersFound = false;

      for (const user of users) {
        const email = user.email;

        // Find all pending orders for the user
        const pendingOrders = await Order.find({status: 'Pending' });

        if (pendingOrders.length > 0) {
          pendingOrdersFound = true;

          for (const order of pendingOrders) {
            // Update the order status to 'Expired'
            order.status = 'Cancelled';
            await order.save();

            // Prepare email content
            const item = order.items[0].itemName; // Use the first item in the order
            const quantity = order.items[0].quantity;
            const price = order.finalAmount;

            const formattedDate = new Date(order.date).toLocaleString('en-US', {
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });

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
        <p><strong>Order Purchasing Date:</strong> ${order.date}</p>
        <p><strong>Cancellation Time:</strong> ${new Date().toLocaleString('en-US', {
              timeZone: 'Asia/Kolkata',
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
          <a href="https://palmyrakart.onrender.com" style="color: #666; margin: 0 10px;">Privacy Policy</a> | 
          <a href="https://palmyrakart.onrender.com" style="color: #666; margin: 0 10px;">Terms & Conditions</a>
        </small>
      </p>
    </div>
  </div>
</body>
</html>
`;

            // Send email
            const mailOptions = {
              from: process.env.SMTP_EMAIL || 'vinaybuttala@gmail.com',
              to: email,
              subject: subject,
              html: htmlMessage,
            };

            await transporter.sendMail(mailOptions);
          }
        }
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


export const limitUpdate = async (req, res) => {
    const { hlimit } = req.body;
    console.log('New limit:', hlimit);
  
    try {
      // Use updateMany to update the limit for all users in a single query
      const result = await User.updateMany({}, { $set: { limit: hlimit } });
  
      // Emit an event to notify clients (if using Socket.IO)
      // io.emit("limit-status-updated", hlimit);
  
      res.status(200).json({ 
        message: 'Limit updated for all users',
        updatedCount: result.modifiedCount // Number of documents updated
      });
    } catch (error) {
      console.error('Error updating limit:', error);
      res.status(500).json({ message: 'Error updating limit', error: error.message });
    }
  };

  export const getReviews = async (req, res) => {
    try {
      // Fetch all reviews directly from the Review collection
      const reviews = await Review.find({});
  
      res.status(200).json({ reviews });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

  export const isUserReviews = async (req, res) => {
    try {
      const userEmail = req.query.email; // Assuming email is passed as a query parameter
  
      // Find the user by email to get their ID
      const user = await User.findOne({ email: userEmail }, '_id');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Fetch reviews for the user directly from the Review collection
      const reviews = await Review.find({ user: user._id });
  
      res.status(200).json({ reviews });
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

  export const addReviews = async (req, res) => {
    const { email, rating, highlight, comment } = req.body;
  
    try {
      // Find the user by email
      const user = await User.findOne({ email });
      const name=user.name
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Create a new review in the Review collection
      const newReview = new Review({
        user: user._id, // Reference to the user
        rating,
        name,
        email,
        highlight,
        comment,
        date: new Date(),
      });
  
      // Save the review to the Review collection
      await newReview.save();
  
      // Add the review ID to the user's reviews array (optional, if you want to maintain a reference)
      user.reviews.push(newReview._id);
      await user.save();
  
      res.status(201).json({ review: newReview });
    } catch (error) {
      console.error('Error adding review:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

  
export const updateReview = async (req, res) => {
    const { comment, rating, highlight } = req.body;
    const reviewId = req.params.reviewId;
  
    try {
      // Find the review in the Review collection
      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }
  
      // Update the review fields
      review.comment = comment;
      review.rating = rating;
      review.highlight = highlight;
  
      // Save the updated review
      await review.save();
  
      res.status(200).json({ review });
    } catch (error) {
      console.error('Error updating review:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

  export const deleteReview = async (req, res) => {
    const reviewId = req.params.reviewId;
  
    try {
      // Find the review in the Review collection
      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }
  
      // Find the user who owns the review
      const user = await User.findById(review.user);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Remove the review ID from the user's reviews array
      user.reviews.pull(reviewId);
      await user.save();
  
      // Delete the review from the Review collection
      await Review.findByIdAndDelete(reviewId);
  
      res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
      console.error('Error deleting review:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };


  export const replyReview = async (req, res) => {
    const { email, sub, msg } = req.body;
  
    try {
      const mailOptions = {
        from: process.env.SMTP_EMAIL || 'vinaybuttala@gmail.com',
        to: email,
        subject: sub,
        text: msg,
      };
  
      // Send the email
      await transporter.sendMail(mailOptions);
  
      res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ message: 'Error sending email', error: error.message });
    }
  };


  