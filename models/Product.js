const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    detail: {
        type: String,
        trim: true
    },
    unit: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['normal', '152mm', 'shared'],
        default: 'normal'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// 建立索引來優化查詢效能
productSchema.index({ type: 1 });
productSchema.index({ createdBy: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;