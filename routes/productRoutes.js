const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const adminAuth = require('../middleware/adminAuth');

// 調試中間件
const debugRequest = (req, res, next) => {
    console.log('產品API請求:', {
        method: req.method,
        path: req.path,
        query: req.query,
        cookies: req.cookies,
        hasToken: !!req.cookies.token
    });
    next();
};

// 公開路由 - 不需要權限
router.get('/', debugRequest, productController.getProducts);

// 需要管理員權限的路由
router.post('/', [debugRequest, adminAuth], productController.addProduct);
router.put('/:id', [debugRequest, adminAuth], productController.updateProduct);
router.delete('/:id', [debugRequest, adminAuth], productController.deleteProduct);

module.exports = router;