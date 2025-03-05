import express from 'express';
import userAuth from '../middleware/userAuth.js';
import {getUserData,getKartStatus,updateKartStatus,order,deleteUserOrder,sendNotification,closeOrder,limitUpdate,getReviews,isUserReviews,addReviews,updateReview,deleteReview,replyReview, getUser, verifyOrder, quantity, getAllUsers, sendOrderOtp
} from '../controllers/userController.js';

const userRouter = express.Router();

// User data route
userRouter.get('/data', userAuth, getUserData);
userRouter.get('/get',getUser)
userRouter.get('/getAllUsers', getAllUsers)
// Kart status routes
userRouter.get('/kart-status', getKartStatus);
userRouter.put('/kart-status', updateKartStatus);

// Order routes
userRouter.post('/order', userAuth,order);
userRouter.post('/verifyOrder', verifyOrder);
userRouter.post('/send-orderOtp', userAuth,sendOrderOtp)
userRouter.get('/quantity', quantity);
userRouter.delete('/order/:id', deleteUserOrder);

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
