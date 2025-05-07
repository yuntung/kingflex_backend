const { verifyToken } = require('../utils/jwtUtils');

const adminAuth = async (req, res, next) => {
    try {
        // 從 cookie 中獲取 token
        const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
        
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
        console.error('Admin auth error:', error);
        return res.status(401).json({ message: 'Authentication failed' });
    }
};

module.exports = adminAuth;