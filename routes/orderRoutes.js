const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth } = require('../middleware/auth');
const permissions = require('../middleware/permissions');

// 建立訂單
router.post('/', auth, orderController.createOrder);

// 訪客查詢訂單 - 修改為 post 或確保 getGuestOrder 方法存在
router.get('/guest-order', orderController.getGuestOrder);

// 取得使用者的所有訂單
router.get('/my-orders', auth, permissions.isVerifiedOrGuest, orderController.getUserOrders);

// 取得單一訂單詳情
router.get('/:orderId', auth, permissions.canAccessOrder, orderController.getOrderById);

// 更新訂單狀態
router.patch('/:orderId/status', 
    [auth, permissions.canAccessOrder, permissions.canUpdateOrderStatus], 
    orderController.updateOrderStatus
);

module.exports = router;