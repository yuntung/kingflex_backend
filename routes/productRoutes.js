const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const adminAuth = require('../middleware/adminAuth');

// 公開路由 - 不需要權限
router.get('/', productController.getProducts);

// 需要管理員權限的路由
router.post('/', adminAuth, productController.addProduct);
router.put('/:id', adminAuth, productController.updateProduct);
router.delete('/:id', adminAuth, productController.deleteProduct);

module.exports = router;