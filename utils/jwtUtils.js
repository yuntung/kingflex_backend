// server/utils/jwtUtils.js
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user._id,
            email: user.email,
            role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid Token');
    }
};

module.exports = {
    generateToken,
    verifyToken
};