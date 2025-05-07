const User = require('../models/User');
const { generateToken, generateTemporaryToken } = require('../utils/jwtUtils');
const { sendEmail } = require('../utils/emailUtils');
const crypto = require('crypto');

const authController = {
    //註冊
    async register(req, res) {
        try {
            const { username, email, password, companyName } = req.body;
    
            // 檢查是否已存在
            const existingUser = await User.findOne({ 
                $or: [{ email }, { username }] 
            });
            
            if (existingUser) {
                return res.status(400).json({ 
                    message: 'Username or Email has been used' 
                });
            }
    
            // 生成驗證碼
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
            // 創建新用戶
            const user = new User({
                username,
                email,
                password,
                companyName,
                isVerified: false,
                verificationCode,
                verificationCodeExpires: Date.now() + 3600000 // 1小時後過期
            });
    
            await user.save();
    
            // 發送驗證郵件
            await sendEmail(user.email, 'verifyEmail', verificationCode);
    
            res.status(201).json({
                message: 'Registration Successful. Please check your email to verify your account.',
                requireVerification: true,
                email: user.email
            });
        } catch (error) {
            res.status(500).json({ 
                message: 'Registration failed', 
                error: error.message 
            });
        }
    },

    // 登入
    async login(req, res) {
        try {
            const { email, password } = req.body;
    
            // 查找用戶
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ 
                    message: 'Wrong email or password' 
                });
            }
    
            // 檢查是否已驗證
            if (!user.isVerified) {
                // 生成新的驗證碼
                const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
                user.verificationCode = verificationCode;
                user.verificationCodeExpires = Date.now() + 3600000;
                await user.save();
    
                // 發送新的驗證郵件
                await sendEmail(user.email, 'verifyEmail', verificationCode);
    
                return res.status(401).json({
                    message: 'Please verify your email before logging in',
                    requireVerification: true,
                    email: user.email
                });
            }
    
            // 驗證密碼
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({ 
                    message: 'Wrong email or password' 
                });
            }
    
            // 生成 Token
            const token = generateToken(user);
    
            // 設置 Cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000 // 24小時
            });
    
            res.json({
                message: 'Login successfully',
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    companyName: user.companyName,
                    role: user.role
                }
            });
        } catch (error) {
            res.status(500).json({ 
                message: 'Login failed', 
                error: error.message 
            });
        }
    },

    // 登出
    async logout(req, res) {
        res.clearCookie('token');
        res.json({ message: 'Successfully logged out' });
    },

    // 取得當前用戶資訊
    async getCurrentUser(req, res) {
        try {
            const user = await User.findById(req.user.id).select('-password');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        } catch (error) {
            res.status(500).json({ 
                message: 'Failed to obtain user information', 
                error: error.message 
            });
        }
    },

        // 發送驗證郵件
        async sendVerificationEmail(req, res) {
            try {
                const { email } = req.body;  // 改為從請求體獲取 email
                const user = await User.findOne({ email });  // 改為用 email 查找用戶
                
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }
        
                if (user.isVerified) {
                    return res.status(400).json({ message: 'User already verified' });
                }
        
                // 生成新的驗證碼
                const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
                user.verificationCode = verificationCode;
                user.verificationCodeExpires = Date.now() + 3600000; // 1小時後過期
                await user.save();
        
                // 發送驗證郵件
                await sendEmail(user.email, 'verifyEmail', verificationCode);
        
                res.json({ 
                    message: 'Verification email sent',
                    requireVerification: true,
                    email: user.email
                });
            } catch (error) {
                res.status(500).json({ 
                    message: 'Failed to send verification email', 
                    error: error.message 
                });
            }
        },
    
        // 驗證郵件
        async verifyEmail(req, res) {
            try {
                const { email, verificationCode } = req.body;  // 改為從請求體獲取驗證碼和郵箱
                
                const user = await User.findOne({ 
                    email,
                    verificationCode,
                    verificationCodeExpires: { $gt: Date.now() }
                });
        
                if (!user) {
                    return res.status(400).json({ message: 'Invalid or expired verification code' });
                }
        
                user.isVerified = true;
                user.verificationCode = undefined;
                user.verificationCodeExpires = undefined;
                await user.save();
        
                // 生成 Token
                const token = generateToken(user);
        
                // 設置 Cookie
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 24 * 60 * 60 * 1000 // 24小時
                });
        
                res.json({ 
                    message: 'Email verification successful',
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        role: user.role
                    }
                });
            } catch (error) {
                res.status(500).json({ 
                    message: 'Email verification failed', 
                    error: error.message 
                });
            }
        },
    
        // 請求重設密碼
        async requestPasswordReset(req, res) {
            try {
                const { email } = req.body;
                const user = await User.findOne({ email });
        
                if (!user) {
                    return res.status(404).json({ 
                        message: 'This email address cannot be found' 
                    });
                }
        
                // 生成6位數驗證碼
                const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
                
                // 儲存驗證碼和過期時間（1小時後過期）
                user.resetPasswordToken = resetCode;  // 這裡儲存的是驗證碼
                user.resetPasswordExpires = Date.now() + 3600000; // 1小時
                await user.save();
        
                // 發送含有驗證碼的郵件 - 這裡直接傳入 resetCode
                await sendEmail(user.email, 'resetPassword', resetCode);  // 確保這裡傳入的是 resetCode
        
                res.json({ 
                    message: 'Password reset code has been sent to your email',
                    email: user.email
                });
            } catch (error) {
                res.status(500).json({ 
                    message: 'Failed to send reset code', 
                    error: error.message 
                });
            }
        },
    
        // 重設密碼
        async resetPassword(req, res) {
            try {
                const { email, resetCode, newPassword } = req.body;
                
                const user = await User.findOne({
                    email,
                    resetPasswordToken: resetCode,
                    resetPasswordExpires: { $gt: Date.now() }
                });
        
                if (!user) {
                    return res.status(400).json({ message: 'Invalid or expired reset code' });
                }
        
                // 更新密碼
                user.password = newPassword;
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;
                await user.save();
        
                res.json({ message: 'Password reset successful' });
            } catch (error) {
                res.status(500).json({ 
                    message: 'Password reset failed', 
                    error: error.message 
                });
            }
        },

        // 驗證重置碼
    async verifyResetCode(req, res) {
        try {
            const { email, resetCode } = req.body;
            const user = await User.findOne({
                email,
                resetPasswordToken: resetCode,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({ 
                    message: 'Invalid or expired reset code' 
                });
            }

            res.json({ message: 'Reset code verified successfully' });
        } catch (error) {
            res.status(500).json({ 
                message: 'Verification failed', 
                error: error.message 
            });
        }
    },
    async verifyCode(req, res) {
        try {
            const { email, verificationCode } = req.body;
            const user = await User.findOne({
                email,
                verificationCode,
                verificationCodeExpires: { $gt: Date.now() }
            });
    
            if (!user) {
                return res.status(400).json({ message: 'Invalid or expired verification code' });
            }
    
            user.isVerified = true;
            user.verificationCode = undefined;
            user.verificationCodeExpires = undefined;
            await user.save();
    
            // 生成 Token
            const token = generateToken(user);
    
            // 設置 Cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000
            });
    
            // 確保回傳完整的使用者資料
            const userData = {
                id: user._id,
                username: user.username,
                email: user.email,
                companyName: user.companyName,
                role: user.role
            };
    
            res.json({
                message: 'Email verified successfully',
                user: userData
            });
        } catch (error) {
            res.status(500).json({ 
                message: 'Verification failed', 
                error: error.message 
            });
        }
    },
        // 檢查驗證碼是否過期
async checkVerificationStatus(req, res) {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.json({ verified: true });
        }

        // 檢查驗證碼是否過期
        const isExpired = !user.verificationCodeExpires || 
                         user.verificationCodeExpires < Date.now();

        res.json({
            verified: false,
            expired: isExpired
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Failed to check verification status', 
            error: error.message 
        });
    }
},
async registerAdmin(req, res) {
    try {
        const { username, email, password, adminCode, companyName } = req.body;

        // Validate admin registration code
        if (!adminCode || adminCode !== process.env.ADMIN_REGISTRATION_CODE) {
            return res.status(403).json({ 
                success: false,
                message: 'Invalid admin registration code' 
            });
        }

        // 檢查是否已存在
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'Username or Email has been used' 
            });
        }

        // Password validation
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        // Create admin user
        const admin = new User({
            username,
            email,
            password,
            companyName,
            role: 'admin',
            isVerified: true
        });

        await admin.save();

        // 生成 Token
        const token = generateToken({
            id: admin._id,
            username: admin.username,
            role: 'admin'
        });

        // 設置 Cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: true, // 確保在 HTTPS 下運行
            sameSite: 'none', // 允許跨域請求
            maxAge: 24 * 60 * 60 * 1000 // 24小時
        });

        res.status(201).json({
            success: true,
            message: 'Admin registration successful',
            user: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                companyName: admin.companyName,
                role: 'admin'
            }
        });
    } catch (error) {
        console.error('Admin registration error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Admin registration failed', 
            error: error.message 
        });
    }
},
};


module.exports = authController;