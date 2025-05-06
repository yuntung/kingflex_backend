// productController.js
const Product = require('../models/Product');

const productController = {
    async getProducts(req, res) {
        try {
            const { type } = req.query;

            if (!['normal', '152mm', 'shared'].includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product type'
                });
            }

            const products = await Product.find({ type }).lean();

            const formattedProducts = products.map(product => ({
                id: product._id.toString(),
                name: product.name,
                detail: product.detail || '',
                unit: product.unit,
                type: product.type
            }));

            res.json(formattedProducts);
        } catch (error) {
            console.error('Product fetch error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch products',
                error: error.message
            });
        }
    },

    async addProduct(req, res) {
        try {
            const { name, detail, unit, type } = req.body;

            if (!name || !unit || !type) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, unit, and type are required'
                });
            }

            const newProduct = new Product({
                name,
                detail: detail || '',
                unit,
                type,
                createdBy: req.user.id
            });

            await newProduct.save();

            res.status(201).json({
                id: newProduct._id.toString(),
                name: newProduct.name,
                detail: newProduct.detail,
                unit: newProduct.unit,
                type: newProduct.type
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to add product',
                error: error.message
            });
        }
    },

    async updateProduct(req, res) {
        try {
            const { name, detail, unit } = req.body;

            if (!name || !unit) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and unit are required'
                });
            }

            const updatedProduct = await Product.findByIdAndUpdate(
                req.params.id,
                { name, detail: detail || '', unit },
                { new: true, runValidators: true }
            );

            if (!updatedProduct) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            res.json({
                id: updatedProduct._id.toString(),
                name: updatedProduct.name,
                detail: updatedProduct.detail,
                unit: updatedProduct.unit,
                type: updatedProduct.type
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to update product',
                error: error.message
            });
        }
    },

    async deleteProduct(req, res) {
        try {
            const deletedProduct = await Product.findByIdAndDelete(req.params.id);
            
            if (!deletedProduct) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            res.json({
                success: true,
                message: 'Product deleted successfully',
                id: deletedProduct._id.toString()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete product',
                error: error.message
            });
        }
    }
};

module.exports = productController;