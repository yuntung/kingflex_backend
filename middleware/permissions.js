// middleware/permissions.js
const Order = require('../models/Order');

const permissions = {

    // 檢查是否為已驗證用戶或訪客訂單
    isVerifiedOrGuest: async (req, res, next) => {
        try {
            // 如果是訪客訂單，直接通過
            if (req.body.isGuestOrder) {
                return next();
            }

            // 如果是登入用戶，檢查驗證狀態
            if (req.user) {
                const user = await User.findById(req.user.id);
                if (!user.isVerified) {
                    return res.status(403).json({ message: 'Please verify your email first' });
                }
            }
            next();
        } catch (error) {
            res.status(500).json({ message: 'Verification check failed', error: error.message });
        }
    },

    // 檢查是否為已驗證用戶
    // isVerified: async (req, res, next) => {
    //     try {
    //         const user = await User.findById(req.user.id);
    //         if (!user.isVerified) {
    //             return res.status(403).json({ message: 'Please verify your email first' });
    //         }
    //         next();
    //     } catch (error) {
    //         res.status(500).json({ message: 'Verification of user status failed', error: error.message });
    //     }
    // },

    // 檢查訂單權限
    canAccessOrder: async (req, res, next) => {
        try {
            const order = await Order.findById(req.params.orderId);
            if (!order) {
                return res.status(404).json({ message: 'Order cannot be found' });
            }

            if (req.user?.role === 'admin') {
                return next();
            }

            if (order.createdBy?.toString() !== req.user?.id) {
                return res.status(403).json({ message: 'No access to this order' });
            }

            next();
        } catch (error) {
            res.status(500).json({ message: 'Checking order permissions failed', error: error.message });
        }
    },

    // 檢查訂單狀態更新權限
    canUpdateOrderStatus: async (req, res, next) => {
        try {
            const order = await Order.findById(req.params.orderId);
            if (!order) {
                return res.status(404).json({ message: 'Order cannot be found' });
            }

            // 只有管理員可以更新已完成或取消的訂單
            if (['completed', 'cancelled'].includes(order.status) && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Unable to update completed or canceled orders' });
            }

            next();
        } catch (error) {
            res.status(500).json({ message: 'Check for update permissions failed', error: error.message });
        }
    },

    // 限制用戶訂單數量
    checkOrderLimit: async (req, res, next) => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const orderCount = await Order.countDocuments({
                createdBy: req.user.id,
                createdAt: { $gte: today }
            });

            if (orderCount >= 5 && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Today’s order limit has been reached' });
            }

            next();
        } catch (error) {
            res.status(500).json({ message: 'Checking order limits failed', error: error.message });
        }
    }
};

module.exports = permissions;