import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import transporter from '../config/nodeMailer.js';
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();
// Helper function to send emails
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET);
const sendEmail = async (to, subject, content, isHtml = false) => {
  const mailOptions = {
    from: process.env.SMTP_EMAIL || 'vinaybuttala@gmail.com',
    to: to,
    subject: subject,
    ...(isHtml ? { html: content } : { text: content })
  };

  await transporter.sendMail(mailOptions);
};

export const refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate a new access token
    const accessToken = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '15m' });

    // Set the new access token in an HTTP-only cookie
    res.cookie('token', accessToken, {
      httpOnly: true,  // ✅ Prevents JavaScript access (secure)
      secure: true,  // ✅ Ensures it only works in HTTPS
      sameSite: 'None',  // ✅ Required for cross-origin request
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Send the new access token in the response
    return res.status(200).json({ success: true, accessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(403).json({ success: false, message: 'Invalid refresh token' });
  }
};

export const googleSignIn = async (req, res) => {
  const { credential } = req.body;

  try {
    // Verify the Google ID token
    const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    const { email, name, sub: googleId } = response.data;

    // Check if the user already exists in your database
    let user = await userModel.findOne({ email });
    const password = String(Math.floor(100000 + Math.random() * 900000));
    if (!user) {
      // Create a new user if they don't exist
      user = new userModel({
        name,
        email,
        password,
        googleId,
        provider: 'google', // Track the authentication provider
        isAccountVerified: true, // Mark account as verified
        emailVerified: true, // Mark email as verified
        isAdmin:false
      });
      await user.save();
    } else {
      // If the user exists but signed up with email/password, update their record with Google details
      if (!user.googleId) {
        user.googleId = googleId;
        user.provider = 'google';
        user.isAccountVerified = true;
        user.emailVerified = true;
        await user.save();
      }
    }

    // Generate a JWT token for the user
    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    const refreshToken = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    // Set tokens in HTTP-only cookies
    res.cookie('token', token, {
      httpOnly: true,  // ✅ Prevents JavaScript access (secure)
      secure: true,  // ✅ Ensures it only works in HTTPS
      sameSite: 'None',  // ✅ Required for cross-origin request
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,  // ✅ Prevents JavaScript access (secure)
      secure: true,  // ✅ Ensures it only works in HTTPS
      sameSite: 'None',  // ✅ Required for cross-origin request
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    // Return the user and token
    res.status(200).json({
      success: true,
      name: user.name,
      isAdmin: user.isAdmin
    });
  } catch (error) {
    console.error('Error during Google Sign-In:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
// export const googleCallback=async(req,res)=>{
//   const { code, state } = req.query;
//   const frontendOrigin = decodeURIComponent(state || 'http://localhost:3000'); // Default fallback

//   try {
//     // Exchange authorization code for tokens
//     const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
//       code,
//       client_id: process.env.GOOGLE_CLIENT_ID,
//       client_secret: process.env.GOOGLE_CLIENT_SECRET,
//       redirect_uri: 'http://localhost:4000/api/user/google/callback', // Must match frontend
//       grant_type: 'authorization_code'
//     });

//     // Get user info with the access token
//     const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
//       headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
//     });

//     const { name, email, sub: uid } = userInfoResponse.data;

//     // Check if the user already exists
//     let user = await userModel.findOne({ email });

//     if (!user) {
//       // Create a new user if they don't exist
//       user = new userModel({
//         name,
//         email,
//         uid,
//         provider: 'google',
//         isAccountVerified: true,
//         emailVerified: true,
//       });
//       await user.save();
//     }

//     // Generate JWT tokens
//     const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
//       expiresIn: '1h',
//     });
//     const refreshToken = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_REFRESH_SECRET, { 
//       expiresIn: '7d' 
//     });

//     // Set tokens in HTTP-only cookies
//     res.cookie('token', token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
//       maxAge: 15 * 60 * 1000, // 15 minutes
//     });

//     res.cookie('refreshToken', refreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
//       maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//     });

//     // Redirect back to the frontend with success parameter
//     res.redirect(`${frontendOrigin}/auth?login_success=true&name=${encodeURIComponent(user.name)}&isAdmin=${user.isAdmin}`);

//   } catch (error) {
//     console.error('Google OAuth error:', error);
//     res.redirect(`${frontendOrigin}/auth?error=google_auth_failed`);
//   }
// }
// export const googleSetPassword = async (req, res) => {
//   const { email, newPassword } = req.body;

//   try {
//     // Find the user by email
//     const user = await userModel.findOne({ email });

//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }
//     // Hash password
//     const hashPassword = await bcrypt.hash(password, 10);

//     // Update the user's password
//     user.password = hashPassword;
//     await user.save();

//     res.status(200).json({ success: true, message: 'Password set successfully' });
//   } catch (error) {
//     console.error('Error setting password:', error);
//     res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// }
// Register a new user
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Missing data' });
  }

  try {
    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser && existingUser.isAccountVerified) {
      return res.status(409).json({ success: false, message: 'User already exists' });
    }

    // Hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new userModel({ name, email, password: hashPassword });
    await user.save();

    // Generate tokens
    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    // Set tokens in HTTP-only cookies
    res.cookie('token', token, {
      httpOnly: true,  // ✅ Prevents JavaScript access (secure)
      secure: true,  // ✅ Ensures it only works in HTTPS
      sameSite: 'None',  // ✅ Required for cross-origin request
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,  // ✅ Prevents JavaScript access (secure)
      secure: true,  // ✅ Ensures it only works in HTTPS
      sameSite: 'None',  // ✅ Required for cross-origin request
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(201).json({ success: true, message: 'Registration successful', name: user.name, userdetails: user });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Missing email or password' });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate tokens
    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    // Set tokens in HTTP-only cookies
    res.cookie('token', token, {
      httpOnly: true,  // ✅ Prevents JavaScript access (secure)
      secure: true,  // ✅ Ensures it only works in HTTPS
      sameSite: 'None',  // ✅ Required for cross-origin request
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,  // ✅ Prevents JavaScript access (secure)
      secure: true,  // ✅ Ensures it only works in HTTPS
      sameSite: 'None',  // ✅ Required for cross-origin request
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    // Set cookies


    if (user.isAdmin) {
      return res.json({ success: true, message: 'Admin login successful', isAdmin: true, name: user.name });
    }

    return res.json({ success: true, message: 'User login successful', isAdmin: user.isAdmin, name: user.name });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


// Logout user
export const logout = async (req, res) => {
  try {
    // Clear both token and refreshToken cookies
    res.clearCookie('token', {
      httpOnly: true,  // ✅ Prevents JavaScript access (secure)
      secure: true,  // ✅ Ensures it only works in HTTPS
      sameSite: 'None',  // ✅ Required for cross-origin request
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,  // ✅ Prevents JavaScript access (secure)
      secure: true,  // ✅ Ensures it only works in HTTPS
      sameSite: 'None',  // ✅ Required for cross-origin request
    });

    return res.json({ success: true, message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


// Send OTP for email verification
// For email verification (sendVerifyOtp function)
export const sendVerifyOtp = async (req, res) => {
  const { email, msg } = req.body;

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    await user.save();

    // Create email template
    const emailTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              padding: 30px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 22px;
              font-weight: bold;
              color: #1a73e8;
            }
            .otp-box {
              background-color: #f2f6ff;
              border-radius: 6px;
              padding: 15px;
              text-align: center;
              margin: 20px 0;
            }
            .otp-code {
              font-size: 24px;
              font-weight: bold;
              color: #1a73e8;
              letter-spacing: 3px;
            }
            .expiry-note {
              font-size: 12px;
              color: #666;
              text-align: center;
              margin-top: 5px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">PalmyraKart</div>
              <h2>Verify Your Email</h2>
            </div>
            
            <p>Hello,</p>
            <p>Thank you for registering with PalmyraKart. Please use the following OTP to verify your email address.</p>
            
            <div class="otp-box">
              <p>Your Verification Code:</p>
              <div class="otp-code">${otp}</div>
              <p class="expiry-note">This code will expire in 10 minutes</p>
            </div>
            
            <p>If you didn't request this verification, please ignore this email.</p>
            
            <div class="footer">
              <p>&copy; 2025 PalmyraKart. All rights reserved.</p>
              <p>If you need any assistance, please contact our support team.</p>
            </div>
          </div>
        </body>
        </html>
        `;

    // Send OTP via email with HTML template
    await sendEmail(email, msg || 'Email Verification', emailTemplate, true); // Add a parameter to indicate HTML content

    return res.json({ success: true, message: 'OTP sent successfully', email: user.email });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


// Verify email using OTP
export const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Missing details' });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.verifyOtp || String(user.verifyOtp) !== String(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (user.verifyOtpExpireAt < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    // Mark account as verified and remove OTP
    user.isAccountVerified = true;
    user.verifyOtp = null;
    user.verifyOtpExpireAt = null;
    await user.save();

    return res.json({ success: true, message: 'Email verified successfully', name: user.name });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


// Send OTP for password reset
// Send OTP for password reset
export const sendResetOtp = async (req, res) => {
  const { email } = req.body;

  // Validate input
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Create email template
    const resetEmailTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              padding: 30px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 22px;
              font-weight: bold;
              color: #1a73e8;
            }
            .otp-box {
              background-color: #fff4e5;
              border-radius: 6px;
              border-left: 4px solid #fb8c00;
              padding: 15px;
              text-align: center;
              margin: 20px 0;
            }
            .otp-code {
              font-size: 24px;
              font-weight: bold;
              color: #fb8c00;
              letter-spacing: 3px;
            }
            .expiry-note {
              font-size: 12px;
              color: #666;
              text-align: center;
              margin-top: 5px;
            }
            .warning {
              font-size: 14px;
              color: #d32f2f;
              margin-top: 20px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">PalmyraKart</div>
              <h2>Password Reset Request</h2>
            </div>
            
            <p>Hello,</p>
            <p>We received a request to reset your password. Use the following code to complete the password reset process:</p>
            
            <div class="otp-box">
              <p>Your Password Reset Code:</p>
              <div class="otp-code">${otp}</div>
              <p class="expiry-note">This code will expire in 24 hours</p>
            </div>
            
            <p>If you didn't request a password reset, you can ignore this email or contact our support team if you have concerns.</p>
            
            <p class="warning">Never share this code with anyone. Our team will never ask for your code or password.</p>
            
            <div class="footer">
              <p>&copy; 2025 PalmyraKart. All rights reserved.</p>
              <p>If you need any assistance, please contact our support team.</p>
            </div>
          </div>
        </body>
        </html>
        `;

    // Send OTP via email with HTML template
    await sendEmail(user.email, 'Password Reset OTP', resetEmailTemplate, true);

    return res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send reset OTP error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Reset password using OTP
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.resetOtp || String(user.resetOtp) !== String(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (user.resetOtpExpireAt < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = null;
    user.resetOtpExpireAt = null;
    await user.save();

    return res.json({ success: true, message: 'Password reset successfully', username: user.name });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
