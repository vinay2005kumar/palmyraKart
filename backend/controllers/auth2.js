import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import transporter from '../config/nodeMailer.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Helper function to send emails
const sendEmail = async (to, subject, text) => {
    const mailOptions = {
        from: process.env.SMTP_EMAIL || 'admin@example.com',
        to,
        subject,
        text,
    };
    await transporter.sendMail(mailOptions);
};

// Generate JWT tokens
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user._id, isadmin: user.isadmin },
        JWT_SECRET,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { id: user._id },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
};

// Register a new user
export const register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Missing data' });
    }

    try {
        let user = await userModel.findOne({ email });

        if (user && user.isAccountVerified) {
            return res.status(409).json({ success: false, message: 'User already exists' });
        }

        const hashPassword = await bcrypt.hash(password, 12);
        user = new userModel({ name, email, password: hashPassword });

        await user.save();
        await sendEmail(email, 'Welcome', `Your account has been created.`);

        return res.status(201).json({ success: true, message: 'Registration successful' });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Login
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
        const { accessToken, refreshToken } = generateTokens(user);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'None',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({
            success: true,
            message: 'Login successful',
            accessToken,
            user: {
                name: user.name,
                isadmin: user.isadmin,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Refresh token endpoint
export const refreshToken = async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: 'No refresh token provided' });

    try {
        const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }

        const { accessToken, refreshToken } = generateTokens(user);
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'None',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({ success: true, accessToken });
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Invalid refresh token' });
    }
};

// Logout user
export const logout = (req, res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'None',
    });

    return res.json({ success: true, message: 'Logout successful' });
};

// Send OTP
export const sendVerifyOtp = async (req, res) => {
    const { email, msg } = req.body;

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.verifyOtp = bcrypt.hashSync(otp, 10);
        user.verifyOtpExpireAt = Date.now() + 10 * 60 * 1000;
        await user.save();

        await sendEmail(email, msg, `Your OTP is: ${otp}`);
        return res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Verify Email
export const verifyEmail = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await userModel.findOne({ email });
        if (!user || !user.verifyOtp) {
            return res.status(404).json({ success: false, message: 'Invalid OTP' });
        }

        if (!bcrypt.compareSync(otp, user.verifyOtp) || user.verifyOtpExpireAt < Date.now()) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        user.isAccountVerified = true;
        user.verifyOtp = null;
        user.verifyOtpExpireAt = null;
        await user.save();

        return res.json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
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
