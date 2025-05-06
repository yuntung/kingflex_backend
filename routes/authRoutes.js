const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// 註冊路由
router.post('/register', authController.register);

// 登入路由
router.post('/login', authController.login);

// 登出路由
router.post('/logout', authController.logout);

// 取得當前用戶資訊
router.get('/me', auth, authController.getCurrentUser);


router.post('/verify-email/send', authController.sendVerificationEmail);  // 移除 auth 中間件
router.post('/verify-email/verify', authController.verifyEmail);  // 改為 POST 方法，接收 email 和驗證碼
router.post('/verify-email/status', authController.checkVerificationStatus);
router.post('/reset-password/request', authController.requestPasswordReset);
router.post('/reset-password/reset', authController.resetPassword);

// 密碼重置相關路由
router.post('/reset-password/request', authController.requestPasswordReset);
router.post('/reset-password/verify-code', authController.verifyResetCode);
router.post('/reset-password/reset', authController.resetPassword);

router.post('/register-admin', authController.registerAdmin);

module.exports = router;