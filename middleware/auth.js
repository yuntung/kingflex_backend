const { verifyToken } = require('../utils/jwtUtils');

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            // 如果是訪客訂單，允許繼續
            if (req.body.isGuestOrder) {
                req.isGuest = true;
                return next();
            }
            return res.status(401).json({ message: 'Please login first' });
        }

        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        // 如果是訪客訂單，允許繼續
        if (req.body.isGuestOrder) {
            req.isGuest = true;
            return next();
        }
        res.status(401).json({ message: 'Authentication failed' });
    }
};

module.exports = { auth };