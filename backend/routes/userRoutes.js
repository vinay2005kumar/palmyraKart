import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { getUserData, getKartStatus, updateKartStatus, sendNotification, closeOrder, limitUpdate, getReviews, isUserReviews, addReviews, updateReview, deleteReview, replyReview, getUser, verifyOrder, quantity, getAllUsers, sendOrderOtp, deleteOrder, orderCancel, removeOrder, cancelSelectedOrders } from '../controllers/userController2.js';
import { createOrder, refundAll, refundPayment, releaseInventory, verifyPayment,paymentRateLimiter } from '../controllers/paymentController.js';

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
userRouter.post('/create-order', userAuth, createOrder);
userRouter.post('/verify-payment', userAuth, verifyPayment);
userRouter.post('/refund', userAuth, paymentRateLimiter, refundPayment);
userRouter.post('/refund-all', userAuth, paymentRateLimiter, refundAll);               // ✅ FIXED
userRouter.post('/release-inventory',userAuth,releaseInventory)
userRouter.post('/verifyOrder', verifyOrder);
userRouter.post('/send-orderOtp', userAuth, sendOrderOtp);
userRouter.get('/quantity', quantity);
userRouter.delete('/order/:id', orderCancel);
userRouter.delete('/removeOrder/:orderId',removeOrder)
userRouter.post('/cancel-selected-orders',cancelSelectedOrders)
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
