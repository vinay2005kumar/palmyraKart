import jwt from 'jsonwebtoken';

const userAuth = (req, res, next) => {
    const token = req.cookies.token;

    console.log('🍪 Cookies received:', req.cookies); // Debug: See if token is received
    // console.log('🔑 Extracted Token:', token); // Debug: See if token is extracted

    if (!token) {
        console.log('❌ No token found in cookies!');
        return res.status(401).json({ message: 'Unauthorized: No token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // console.log('✅ Decoded Token:', decoded); // Debug: See decoded data
        req.user = decoded; // Set req.user
        next();
    } catch (error) {
        console.log('❌ Token verification failed:', error.message);
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};

export default userAuth;
