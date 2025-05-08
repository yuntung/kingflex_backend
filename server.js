require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose'); // 只引入一次
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
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
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

// 引入產品模型 (移到這裡，在資料庫連接之前)
const Product = require('./models/Product');

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

// 初始化產品資料的函數
const initializeProducts = async () => {
  try {
    // 檢查產品數量
    const productCount = await Product.countDocuments();
    
    // 如果已經有產品，則不執行初始化
    if (productCount > 0) {
      console.log('產品資料已存在，跳過初始化');
      return;
    }
    
    console.log('開始初始化產品資料...');
    
    // 獲取一個管理員 ID (從 users 集合中查詢)
    // 務必確保使用正確的 ID
    const adminId = '681ae6e93d86c420949adb46'; // 使用實際管理員 ID
    
    // 定義產品資料
    const products = [
      // 12.7mm 產品 (normal)
      {
        name: 'PC Strand',
        detail: '12.7mm Standard',
        unit: 'Ton',
        type: 'normal',
        createdBy: adminId
      },
      {
        name: 'Flat Duct',
        detail: '70 x 20 FLAT DUCTING',
        unit: 'Rack',
        type: 'normal',
        createdBy: adminId
      },
      {
        name: 'Anchors Block',
        detail: '12.7mm',
        unit: 'Box',
        type: 'normal',
        createdBy: adminId
      },
      {
        name: 'Jack Wedge',
        detail: '12.7mm',
        unit: 'Set',
        type: 'normal',
        createdBy: adminId
      },
      {
        name: 'Wedge',
        detail: '12.7mm',
        unit: 'Bucket',
        type: 'normal',
        createdBy: adminId
      },
      
      // 15.2mm 產品
      {
        name: 'PC Strand',
        detail: '15.2mm Standard',
        unit: 'Ton',
        type: '152mm',
        createdBy: adminId
      },
      {
        name: 'Flat Duct',
        detail: '90 x 20 FLAT DUCTING',
        unit: 'Ton',
        type: '152mm',
        createdBy: adminId
      },
      {
        name: 'Anchors Block',
        detail: '15.2mm',
        unit: 'Box',
        type: '152mm',
        createdBy: adminId
      },
      {
        name: 'Jack Wedge',
        detail: '15.2mm',
        unit: 'Box',
        type: '152mm',
        createdBy: adminId
      },
      {
        name: 'Wedge',
        detail: '15.2mm',
        unit: 'Bucket',
        type: '152mm',
        createdBy: adminId
      },
      
      
      // 共用產品
      {
        name: 'Grout Tube',
        detail: 'Clear & Grey',
        unit: 'Roll',
        type: 'shared',
        createdBy: adminId
      },
      {
        name: 'Able Flex',
        detail: 'N/A',
        unit: 'Roll',
        type: 'shared',
        createdBy: adminId
      },
      {
        name: 'Duct Tape',
        detail: 'N/A',
        unit: 'Box',
        type: 'shared',
        createdBy: adminId
      },
      {
        name: 'Strand Cap',
        detail: 'N/A',
        unit: 'Box',
        type: 'shared',
        createdBy: adminId
      },
      {
        name: 'Strand Sleeves',
        detail: 'N/A',
        unit: 'Box',
        type: 'shared',
        createdBy: adminId
      },
      {
        name: 'Plastic Pans',
        detail: 'N/A',
        unit: 'Crate',
        type: 'shared',
        createdBy: adminId
      },
      {
        name: 'Hand Gloves',
        detail: 'Size: S/M/L/XL',
        unit: 'Box',
        type: 'shared',
        createdBy: adminId
      },
    ];
    
    // 插入產品資料
    await Product.insertMany(products);
    console.log(`已成功初始化 ${products.length} 個產品`);
  } catch (error) {
    console.error('初始化產品資料失敗:', error);
  }
};

// 在資料庫連接成功後初始化產品資料
mongoose.connection.once('open', () => {
  console.log('已成功連接到 MongoDB');
  initializeProducts().catch(err => console.error('初始化產品錯誤:', err));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`伺服器運行在 port ${PORT}`);
});