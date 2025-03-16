import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { getUserData, getKartStatus, updateKartStatus, sendNotification, closeOrder, limitUpdate, getReviews, isUserReviews, addReviews, updateReview, deleteReview, replyReview, getUser, verifyOrder, quantity, getAllUsers, sendOrderOtp, deleteOrder, orderCancel, removeOrder } from '../controllers/userController2.js';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';

const userRouter = express.Router();

// User data routes
userRouter.get('/data', userAuth, getUserData);
userRouter.get('/get', getUser);
userRouter.get('/getAllUsers',userAuth, getAllUsers);

// Kart status routes
userRouter.get('/kart-status', getKartStatus);
userRouter.put('/kart-status', updateKartStatus);

// Order routes
// userRouter.post('/order', userAuth, order);
userRouter.post('/create-order', userAuth, createOrder);  // ✅ FIXED
userRouter.post('/verify', verifyPayment);                // ✅ FIXED
userRouter.post('/verifyOrder', verifyOrder);
userRouter.post('/send-orderOtp', userAuth, sendOrderOtp);
userRouter.get('/quantity', quantity);
userRouter.delete('/order/:id', orderCancel);
userRouter.delete('/removeOrder/:orderId',removeOrder)
userRouter.delete('/deleteOrder/:orderId',deleteOrder)
// Notification routes
userRouter.post('/send-notification', sendNotification);
userRouter.post('/close-orders', closeOrder);

// Limit update route
userRouter.put('/update-limit', limitUpdate);

// Reviews routes
userRouter.get('/reviews', getReviews);
userRouter.get('/reviews/user', isUserReviews);
userRouter.post('/add-reviews', addReviews);
userRouter.put('/reviews/:reviewId', updateReview);
userRouter.delete('/reviews/:reviewId', deleteReview);
userRouter.post('/reviews/reply', replyReview);

export default userRouter;
