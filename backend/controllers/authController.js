import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import transporter from '../config/nodeMailer.js';

// Helper function to send emails
const sendEmail = async (to, subject, text) => {
    const mailOptions = {
        from: process.env.SMTP_EMAIL || 'vinaybuttala@gmail.com',
        to,
        subject,
        text,
    };
    await transporter.sendMail(mailOptions);
};

// Register a new user
export const register = async (req, res) => {
    const { name, email, password } = req.body;
    console.log('hi')
    // Validate input
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Missing data' });
    }

    try {
        // Check if user already exists
        const existingUser = await userModel.findOne({ email });
        // console.log(existingUser.isAccountVerified)
        if (existingUser ) {
            if(existingUser.isAccountVerified)
            return res.status(409).json({ success: false, message: 'User already exists' });
        }

        // Hash password
        const hashPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new userModel({ name, email, password: hashPassword });
        await user.save();
        
        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Set token in HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Ensures it works in HTTPS
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-site cookies
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        
          

        // Send welcome email
        await sendEmail(email, 'Welcome To My Website', `Welcome to my website! Your account has been created with email id: ${email}`);

        return res.status(201).json({ success: true, message: 'Registration successful',name:user.name,userdetails:user });
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

        const token = jwt.sign({ id: user._id, isadmin: user.isadmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Ensures it works in HTTPS
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-site cookies
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
      
        if (user.isadmin) {
            return res.json({ success: true, message: 'Admin login successful', isadmin: true, name: user.name });
        }

        return res.json({ success: true, message: 'User login successful', isadmin: user.isadmin, name: user.name });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};



// Logout user
export const logout = async (req, res) => {
    try {
        // Clear the token cookie
        res.clearCookie('token',token,{
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        });
        return res.json({ success: true, message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Send OTP for email verification
export const sendVerifyOtp = async (req, res) => {
    const { email,msg } = req.body;

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

        // Send OTP via email
        await sendEmail(email,msg, `Your OTP is: ${otp}`);

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

        if(!user.verifyOtp || String(user.verifyOtp) !== String(otp)) {
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

        // Send OTP via email
        await sendEmail(user.email, 'Password Reset OTP', `Your OTP is: ${otp}. Use this OTP to reset your password.`);

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

        if (!user.resetOtp || user.resetOtp !== otp) {
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

        return res.json({ success: true, message: 'Password reset successfully',username:user.name });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
