const { verifyToken } = require('../utils/jwtUtils');

const adminAuth = async (req, res, next) => {
    try {
        console.log('adminAuth中間件開始檢查...');
        console.log('cookies:', req.cookies);
        
        // 從 cookie 中獲取 token
        const token = req.cookies.token;
        
        if (!token) {
            console.log('adminAuth: 未提供token');
            return res.status(401).json({ message: 'Authentication required' });
        }

        try {
            // 驗證 token
            const decoded = verifyToken(token);
            
            console.log('adminAuth: token解碼成功，用戶角色:', decoded.role);
            
            // 檢查用戶是否為管理員
            if (decoded.role !== 'admin') {
                console.log('adminAuth: 用戶非管理員，角色為:', decoded.role);
                return res.status(403).json({ message: 'Admin access required' });
            }

            req.user = decoded;
            console.log('adminAuth: 驗證成功，允許訪問');
            next();
        } catch (tokenError) {
            console.error('adminAuth: token驗證錯誤:', tokenError);
            return res.status(401).json({ message: 'Invalid token' });
        }
    } catch (error) {
        console.error('adminAuth: 中間件錯誤:', error);
        res.status(401).json({ message: 'Authentication failed' });
    }
};

module.exports = adminAuth;