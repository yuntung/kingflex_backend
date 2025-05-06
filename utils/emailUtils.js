const nodemailer = require('nodemailer');

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

const emailTemplates = {
    verifyEmail: (verificationCode) => ({
        subject: 'Please verify your email',
        html: `
            <h1>Email verification</h1>
            <p>Your verification code is:</p>
            <h2 style="color: #4A90E2; font-size: 24px; text-align: center; padding: 10px; background: #f5f5f5; border-radius: 5px;">
                ${verificationCode}
            </h2>
            <p>This code will expire in 1 hour.</p>
            <p>If you did not request this verification, please ignore this email.</p>
        `
    }),
    
    resetPassword: (resetCode) => ({
        subject: 'Password Reset Code',
        html: `
            <h1>Password Reset Code</h1>
            <p>You have requested to reset your password.</p>
            <p>Your password reset code is:</p>
            <h2 style="color: #4A90E2; font-size: 24px; text-align: center; padding: 10px; background: #f5f5f5; border-radius: 5px;">
                ${resetCode}
            </h2>
            <p>This code will expire in 1 hour.</p>
            <p>If you did not request this reset, please ignore this email.</p>
        `
    }),

    orderConfirmation: (order) => ({
        subject: `Order confirmation #${order.orderNumber}`,
        html: `
            <h1>Order confirmation</h1>
            <p>Dear ${order.contactName}：</p>
            <p>Your order has been successfully created.</p>
            <h2>Order details：</h2>
            <ul>
                <li>Order Number：${order.orderNumber}</li>
                <li>Delivery Address：${order.deliveryAddress}</li>
                <li>Delivery Date：${new Date(order.deliveryDate).toLocaleDateString()}</li>
                <li>Deliver Time：${order.deliveryTime}</li>
            </ul>
            ${order.isGuestOrder ? `
            <h2>Track Your Order：</h2>
            <p>To check your order status, please use:</p>
            <ul>
                <li>Order Number: ${order.orderNumber}</li>
                <li>Email: ${order.email}</li>
            </ul>
            <p>Visit our order tracking page at: ${process.env.FRONTEND_URL}/track-order</p>
            ` : ''}
            <p>If you have any questions, please contact our customer service team.</p>
        `
    }),

    orderStatusUpdate: (order) => ({
        subject: `Order status update #${order.orderNumber}`,
        html: `
            <h1>Order status updated</h1>
            <p>Dear ${order.contactName}：</p>
            <p>Your order status has been updated to：${order.status}</p>
            <p>Order number：${order.orderNumber}</p>
            <p>If you have any questions, please contact our customer service team.</p>
        `
    })
};

const sendEmail = async (to, template, data = {}) => {
    try {
        const emailContent = emailTemplates[template](data);
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject: emailContent.subject,
            html: emailContent.html
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        throw new Error('Failed to send email');
    }
};

module.exports = { sendEmail };