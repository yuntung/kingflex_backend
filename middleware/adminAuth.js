const { verifyToken } = require('../utils/jwtUtils');

const adminAuth = async (req, res, next) => {
    try {
        // 從 cookie 或 header 中獲取 token
        const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            console.log('未提供認證token');
            return res.status(401).json({ message: 'Authentication required' });
        }

        try {
            // 驗證 token
            const decoded = verifyToken(token);
            console.log('管理員權限檢查, 用戶角色:', decoded.role);
            
            // 檢查用戶是否為管理員
            if (decoded.role !== 'admin') {
                console.log('非管理員嘗試訪問:', decoded);
                return res.status(403).json({ message: 'Admin access required' });
            }

            req.user = decoded;
            next();
        } catch (tokenError) {
            console.error('Token驗證錯誤:', tokenError);
            return res.status(401).json({ message: 'Invalid token', error: tokenError.message });
        }
    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(401).json({ message: 'Authentication failed', error: error.message });
    }
};

module.exports = adminAuth;