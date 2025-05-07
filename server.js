require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

// 初始化 Express app
const app = express();

// 引入路由
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');

// 中間件設定
app.use(helmet());  // 安全性表頭
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

// 確保臨時目錄存在並設置靜態文件服務
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true, mode: 0o755 });
}
app.use('/temp', express.static(tempDir));

// Routes setting
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);

// 資料庫連接
mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000, // 增加到 30 秒
    socketTimeoutMS: 45000, // 增加到 45 秒
    connectTimeoutMS: 30000, // 增加到 30 秒
  })
  .then(() => console.log('成功連接到 MongoDB'))
  .catch((err) => console.error('MongoDB 連接失敗:', err));

// 基本路由測試
app.get('/api/test', (req, res) => {
    res.json({ message: '後端伺服器正常運作' });
});

// 全域錯誤處理
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: '伺服器內部錯誤',
        error: process.env.NODE_ENV === 'development' ? err.message : '發生錯誤'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`伺服器運行在 port ${PORT}`);
});