const Order = require('../models/Order');

const generateOrderNumber = async () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // 所有訂單統一使用 PO 前綴
    const prefix = 'PO';
    
    // 找出今天的最後一個訂單號
    const today = new Date(date.setHours(0, 0, 0, 0));
    const latestOrder = await Order.findOne({
        createdAt: { $gte: today }
    }).sort({ orderNumber: -1 });

    let sequence = '001';
    if (latestOrder) {
        const lastSequence = parseInt(latestOrder.orderNumber.slice(-3));
        sequence = String(lastSequence + 1).padStart(3, '0');
    }

    return `${prefix}${year}${month}${day}-${sequence}`;
};

module.exports = { generateOrderNumber };
