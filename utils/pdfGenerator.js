const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs'); 
const path = require('path');

// 建立 email 傳輸器
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN
    }
});

// 確保臨時目錄存在
// const ensureTempDir = () => {
//     const tempDir = path.resolve(__dirname, '../temp');
//     if (!fs.existsSync(tempDir)) {
//         fs.mkdirSync(tempDir, { recursive: true, mode: 0o755 });
//     }
//     return tempDir;
// };

const ensureTempDir = () => {
    // 在雲環境中，使用 /tmp 目錄可能更可靠
    const tempDir = process.env.NODE_ENV === 'production' 
      ? path.resolve('/tmp') 
      : path.resolve(__dirname, '../temp');
      
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true, mode: 0o755 });
    }
    return tempDir;
  };

// 生成訂單 PDF
const generateOrderPDF = (order) => {
    return new Promise((resolve, reject) => {
        try {
            // 確保目錄存在
            const tempDir = ensureTempDir();
            const filePath = path.resolve(tempDir, `${order.orderNumber}.pdf`);
            
            // 創建 PDF 文件
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filePath);

            // 錯誤追蹤
            let hasError = false;

            // 處理寫入流錯誤
            stream.on('error', (error) => {
                hasError = true;
                console.error('Write stream error:', error);
                reject(error);
            });

            // 當 PDF 完成時
            stream.on('finish', () => {
                if (!hasError) {
                    resolve(filePath);
                }
            });

            // 將 PDF 導向寫入流
            doc.pipe(stream);

            // 設置字體和標題
            doc.fontSize(24).text('Purchase Order', { align: 'center' });
            doc.moveDown();

            // 訂單基本資訊
            doc.fontSize(12);
            doc.text(`Date: ${new Date().toLocaleDateString()}`);
            doc.text(`Order Number: ${order.orderNumber}`);
            doc.text(`Company Name: ${order.companyName}`);
            doc.text(`Site Contact Name: ${order.contactName}`);
            doc.text(`Phone Number: ${order.phone}`);
            doc.text(`Delivery Address: ${order.deliveryAddress}`);
            doc.text(`Delivery Date: ${new Date(order.deliveryDate).toLocaleDateString()}`);
            doc.text(`Delivery Time: ${order.deliveryTime}`);
            doc.text(`Crane Truck: ${order.craneTruck}`);
            doc.moveDown();

            // 商品表格標題
            doc.text('Items:', { underline: true });
            doc.moveDown();

            // 表格表頭
            const tableTop = doc.y;
            const colWidth = {
                item: 150,
                detail: 150,
                quantity: 100,
                uom: 100
            };

            doc.text('Item', 50, tableTop);
            doc.text('Detail', 200, tableTop);
            doc.text('Quantity', 350, tableTop);
            doc.text('UOM', 450, tableTop);

            // 分隔線
            doc.moveDown();
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();

            // 商品列表
            order.items.forEach((item, index) => {
                if (doc.y > 700) { // 檢查是否需要新頁
                    doc.addPage();
                }

                const y = doc.y;
                doc.text(item.name || '', 50, y);
                doc.text(item.detail || 'N/A', 200, y);
                doc.text(item.quantity.toString(), 350, y);
                doc.text(item.uom || '', 450, y);
                doc.moveDown();
            });

            // 備註
            if (order.note) {
                if (doc.y > 700) { // 如果空間不夠，新增一頁
                    doc.addPage();
                }
                doc.moveDown();
                doc.text('Note:', { underline: true });
                doc.text(order.note);
            }

            // 完成 PDF
            doc.end();

        } catch (error) {
            console.error('PDF generation error:', error);
            reject(error);
        }
    });
};

// 發送客戶訂單確認郵件
const sendCustomerOrderEmail = async (order, pdfPath) => {
    if (!fs.existsSync(pdfPath)) {
        throw new Error('PDF file not found');
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: order.email,
        subject: `Order Confirmation #${order.orderNumber}`,
        html: `
            <div style="font-family: Arial, sans-serif;">
                <h2>Order Confirmation</h2>
                <p>Dear ${order.companyName},</p>
                <p>Thank you for your order. Your order number is ${order.orderNumber}.</p>
                <h3>Order Details:</h3>
                <p>
                    Delivery Date: ${new Date(order.deliveryDate).toLocaleDateString()}<br>
                    Delivery Time: ${order.deliveryTime}<br>
                    Delivery Address: ${order.deliveryAddress}<br>
                    Crane Truck Required: ${order.craneTruck}
                </p>
                <p>Please find your order details in the attached PDF.</p>
                <p>If you have any questions, please contact our customer service team.</p>
                <p>Best regards,<br>KingFlex</p>
            </div>
        `,
        attachments: [{
            filename: `Order-${order.orderNumber}.pdf`,
            path: pdfPath
        }]
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Customer email error:', error);
        throw new Error('Failed to send customer email');
    }
};

// 發送銷售團隊通知郵件
const sendSalesTeamEmail = async (order, pdfPath) => {
    if (!fs.existsSync(pdfPath)) {
        throw new Error('PDF file not found');
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.SALES_EMAIL,
        subject: `New Order #${order.orderNumber}`,
        html: `
            <div style="font-family: Arial, sans-serif;">
                <h2>New Order Notification</h2>
                <p>Order Number: ${order.orderNumber}</p>
                <h3>Customer Information:</h3>
                <p>
                    Company: ${order.companyName}<br>
                    Contact: ${order.contactName}<br>
                    Phone: ${order.phone}<br>
                    Email: ${order.email}
                </p>
                <h3>Delivery Information:</h3>
                <p>
                    Date: ${new Date(order.deliveryDate).toLocaleDateString()}<br>
                    Time: ${order.deliveryTime}<br>
                    Address: ${order.deliveryAddress}<br>
                    Crane Truck: ${order.craneTruck}
                </p>
                <p>Please check the attached PDF for complete order details.</p>
            </div>
        `,
        attachments: [{
            filename: `Order-${order.orderNumber}.pdf`,
            path: pdfPath
        }]
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Sales team email error:', error);
        throw new Error('Failed to send sales team email');
    }
};

// 清理臨時 PDF 文件
const cleanupPDF = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error('PDF cleanup error:', error);
    }
};

module.exports = {
    generateOrderPDF,
    sendCustomerOrderEmail,
    sendSalesTeamEmail,
    cleanupPDF
};