const Order = require('../models/Order');
const { 
    generateOrderPDF, 
    sendCustomerOrderEmail, 
    sendSalesTeamEmail, 
    cleanupPDF 
} = require('../utils/pdfGenerator');
const { generateOrderNumber } = require('../utils/orderUtils');

const orderController = {
    async createOrder(req, res) {
        let pdfPath = null;

        try {
            console.log('Received order data:', req.body);
            const {
                companyName,
                contactName,
                phone,
                email,
                deliveryAddress,
                deliveryDate,
                deliveryTime,
                craneTruck,
                items,
                note,
                isGuestOrder
            } = req.body;
            
            // 生成訂單編號，而不是從 req.body 取得
            const orderNumber = await generateOrderNumber();

            // 建立新訂單，直接使用請求中的所有必要欄位
            const order = new Order({
                orderNumber,
                companyName,
                contactName,
                phone,
                email,
                deliveryAddress,
                deliveryDate,
                deliveryTime,
                craneTruck,
                items,
                note,
                createdBy: req.user ? req.user.id : null,
                isGuestOrder: isGuestOrder || false,
                status: 'pending'
            });

            await order.save();

          try {
                // 生成 PDF
                pdfPath = await generateOrderPDF(order);
                
                // 並行發送郵件
                await Promise.all([
                    sendCustomerOrderEmail(order, pdfPath),
                    sendSalesTeamEmail(order, pdfPath)
                ]);
            } catch (emailError) {
                console.error('Email or PDF error:', emailError);
                // 繼續執行，不中斷流程
            } finally {
                // 清理 PDF，即使發生錯誤也要執行
                if (pdfPath) {
                    await cleanupPDF(pdfPath);
                }
            }

          res.status(201).json({
              message: 'Order created successfully',
              order: {
                ...order.toObject(),
                createdBy: undefined
            }
          });
      } catch (error) {
        console.error('Detailed error:', error);

        // 確保在出錯時也清理 PDF
        if (pdfPath) {
            try {
                await cleanupPDF(pdfPath);
            } catch (cleanupError) {
                console.error('PDF cleanup error:', cleanupError);
            }
        }
        
          res.status(500).json({
              message: 'Order creation failed',
              error: error.message
          });
      }
    },

    async getGuestOrder(req, res) {
        try {
            const { orderNumber, email } = req.query;
            
            if (!orderNumber || !email) {
                return res.status(400).json({
                    message: 'Order number and email are required'
                });
            }

            const order = await Order.findOne({
                orderNumber,
                email,
                isGuestOrder: true
            });

            if (!order) {
                return res.status(404).json({
                    message: 'Order not found'
                });
            }

            res.json({
                success: true,
                order
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve order',
                error: error.message
            });
        }
    },

    // 取得使用者的所有訂單
    async getUserOrders(req, res) {
        try {
            const orders = await Order.find({ createdBy: req.user.id })
                .sort({ createdAt: -1 });
            
            res.json({
                success: true,
                orders
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                message: 'Failed to obtain order',
                error: error.message 
            });
        }
    },

    // 取得單一訂單詳情
    async getOrderById(req, res) {
        try {
            const order = await Order.findOne({
                _id: req.params.orderId,
                createdBy: req.user.id
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'This order cannot be found'
                });
            }

            res.json({
                success: true,
                order
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to get order details',
                error: error.message
            });
        }
    },

    // 更新訂單狀態
    async updateOrderStatus(req, res) {
        try {
            const { status } = req.body;
            const order = await Order.findOneAndUpdate(
                {
                    _id: req.params.orderId,
                    createdBy: req.user.id
                },
                { status },
                { new: true }
            );

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'This order cannot be found'
                });
            }

            res.json({
                success: true,
                message: 'Order status updated successfully',
                order
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to update order status',
                error: error.message
            });
        }
    }
};

module.exports = orderController;