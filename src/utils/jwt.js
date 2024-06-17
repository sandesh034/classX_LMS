const jwt = require('jsonwebtoken');

const generateAccessToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
}

const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY });
}
module.exports = { generateAccessToken, generateRefreshToken };