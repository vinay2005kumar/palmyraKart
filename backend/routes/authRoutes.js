import express from 'express'
import { login,logout,register,verifyEmail,sendVerifyOtp,sendResetOtp,resetPassword, refreshToken, googleSignIn, googleSetPassword } from '../controllers/authController.js'
import userAuth from '../middleware/userAuth.js'



const authRouter=express.Router()

authRouter.post('/register',register)
authRouter.post('/login',login)
authRouter.post('/logout',logout)
authRouter.post('/send-verify-otp',sendVerifyOtp)  //here both route and controller function placed
authRouter.post('/verify-account',verifyEmail)
authRouter.post('/send-reset-otp',sendResetOtp)
authRouter.post('/reset-password',resetPassword)
authRouter.post('/refresh-token',refreshToken)
authRouter.post('/google-login',googleSignIn)
authRouter.post('/set-password',googleSetPassword)



export default authRouter