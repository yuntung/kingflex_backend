// middleware/adminAuth.js
const { verifyToken } = require('../utils/jwtUtils');

const adminAuth = async (req, res, next) => {
    try {
        // 從 cookie 中獲取 token
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // 驗證 token
        const decoded = verifyToken(token);
        
        if (!decoded) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        // 檢查用戶是否為管理員
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Authentication failed' });
    }
};

module.exports = adminAuth;