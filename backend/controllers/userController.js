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

export const getUserData=async (req, res) => {
  try {
    const user = req.user; // user is already attached from middleware
    if(user){
      
      const userDetails=await userModel.findById(user.id)
      // console.log(userDetails)
    res.json({ success: true, userData: userDetails });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
export const getUser=async(req,res)=>{
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
export const getAllUsers=async(req,res)=>{
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
export const getKartStatus=async(req,res)=>{
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

    res.status(200).json({ success: true, message: 'Order placed successfully.', email: user.email,user:user });
  } catch (error) {
    console.error('❌ Error placing order:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteUserOrder=async(req,res)=>{
  console.log('Incoming request to delete order');
  
  const { id: orderId } = req.params;
  const { email, cancellationReason } = req.body;
  // console.log('id',orderId,email,cancellationReason)
  // console.log('reason',cancellationReason)
  try {
    const user = await userModel.findOne({ email });
  console.log(user)
    if (user) {
      const orderIndex = user.orders.findIndex(order => order.orderId.toString() === orderId);
      const details=user.orders[orderIndex]
      if (orderIndex !== -1) {
        user.address.splice(orderIndex, 1);
        user.phone.splice(orderIndex, 1);
        user.orders.splice(orderIndex, 1);
        const { item, price, quantity, date,status } = details;

        // Convert the date to a readable format (Month Day, Time)
        const formattedDate = new Date(date).toLocaleString('en-US', {
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true, // 12-hour format with AM/PM
        });
        
        await user.save();
        
        const subject = 'Order Cancellation Confirmation';
        const confirmationMessage = `Your order with Details:\n 
        Item type: ${item} \n 
        Quantity: ${quantity} \n 
        Price: ${price} \n 
        Status:${status}\n
        Ordered Date: ${formattedDate} has been successfully cancelled.`;
        
       
    //     const orderDetails = user.orders[orderIndex];

    // console.log('✅ Order Details:', orderDetails);

    // Extract order details (before deletion)

        // sendVerificationEmail(email, subject, confirmationMessage);
        const mailOptions={
          from:process.env.SMTP_EMAIL ||'vinaybuttala@gmail.com',
          to:email,
          subject:subject,
          text:confirmationMessage
         }
         await transporter.sendMail(mailOptions)
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
}
export const sendOrderOtp = async (req, res) => {
  const { oid, orderOtp } = req.body; // ✅ Get orderId from request body
  console.log(req.body);

  if (!oid || !orderOtp) {
    return res.json({ success: false, message: 'Order ID or OTP is missing' });
  }

  try {
    const user = req.user; // ✅ Ensure user is authenticated
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    const userDetails = await userModel.findById(user.id);
    if (!userDetails) {
      return res.json({ success: false, message: 'User details not found' });
    }

    // ✅ Find the specific order in the user's orders array
    const order = userDetails.orders.find(o => o.orderId === oid);
    
    if (!order) {
      return res.json({ success: false, message: 'Order not found' });
    }

    // ✅ Set the OTP for the found order
    order.otp = orderOtp;

    // ✅ Save the updated user document
    await userDetails.save();

    // ✅ Send OTP email
    const email = userDetails.email;
    const msg = 'ORDER DETAILS';
    await sendEmail(email, msg, `Your Order OTP is: ${orderOtp}`);

    console.log(`OTP for Order ${oid}:`, order.otp);
    res.json({ success: true, message: 'Order OTP set successfully' });

  } catch (error) {
    console.error('Error sending order OTP:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const verifyOrder = async (req, res) => {
  try {
    const { email, number, orderId } = req.body;
    const user = await userModel.findOne({ email });
    console.log(req.body,user.orders)
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
   
    // Find the specific order by orderId
    const order = user.orders.find(order => order.orderId === orderId);
    console.log('get',orderId,order.orderId)
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.otp === number) {
      order.status = 'delivered';
      await user.save();
      return res.status(200).json({ message: 'OTP verified and order status updated.' });
    } else {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


export const quantity=async(req,res)=>{
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

export const sendNotification=async(req,res)=>{
    const{subject,message}=req.body;
    try {
      const users = await userModel.find({}, 'email'); 
      if (users && users.length > 0) {
        for (const user of users) {
          const email = user.email;
          const sub = subject;
          const msg= message;
          const mailOptions={
            from:process.env.SMTP_EMAIL ||'vinaybuttala@gmail.com',
            to:email,
            subject:sub,
            text:msg
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

export const closeOrder=async(req,res)=>{
    try {
        const { subject} = req.body;
        const users = await userModel.find({});
       
        if (users.length > 0) {
          let pendingOrdersFound = false;
    
          // Iterate through each user
          for (const user of users) {
            const email=user.email
            // Iterate over each order in the user's orders
            user.orders.forEach(order => {
              // Update only orders with status 'pending' to 'expired'
              if (order.status === 'pending') {
               
                const message=`Sorry for canceling your order, you can make a new order for tomorrow freshly..!`
                pendingOrdersFound = true; // Set flag to true if pending order is found
                console.log('hi', user);
                order.status = 'expired';  // Update the order status
                const mailOptions={
                    from:process.env.SMTP_EMAIL ||'vinaybuttala@gmail.com',
                    to:email,
                    subject:subject,
                    text:message
                   }
              transporter.sendMail(mailOptions)}
            });
            await user.save();  // Save the user with updated orders
          }
    
          if (pendingOrdersFound) {
            // If any pending orders were found and updated
            res.status(200).json({ message: 'All pending orders have been set to expired.' });
          } else {
            // If no pending orders were found
            res.status(201).json({ message: 'No pending orders found.' });
          }
        } else {
          // If no users are found, respond with a 404 status
          res.status(201).json({ message: 'No users found.' });
        }
      } catch (error) {
        console.error('Error closing orders:', error);
        res.status(500).json({ message: 'Server error' });
      }
}

export const limitUpdate=async(req,res)=>{
    const { hlimit } = req.body;
    console.log('limit',hlimit);
  
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

export const getReviews=async(req,res)=>{
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

export const isUserReviews=async(req,res)=>{
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

export const addReviews=async(req,res)=>{
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

export const updateReview=async(req,res)=>{
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

export const deleteReview=async(req,res)=>{
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

export const replyReview=async(req,res)=>{
    const {email,sub,msg}=req.body;
    // console.log('body',req.body)
    try{
        const mailOptions={
            from:process.env.SMTP_EMAIL ||'vinaybuttala@gmail.com',
            to:email,
            subject:sub,
            text:msg
           }
           await transporter.sendMail(mailOptions)
      res.status(200).json({msg:'sent successfully'})
    }
    catch{
       res.status(500).json('error')
    }
}