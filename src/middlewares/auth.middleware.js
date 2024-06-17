const ApiError = require('../utils/ApiError');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');

const checkAuth = async (req, res, next) => {
    try {
        // console.log("Check auth called")
        const accessToken = req.cookies.accessToken
        if (!accessToken) {
            throw new ApiError(401, 'Unauthorized Request');
        }
        const decodedToken = await jwt.verify(accessToken, process.env.JWT_SECRET_KEY);
        const { user_id } = decodedToken;
        const isTokenValid = await pool.query(`SELECT * FROM Users WHERE user_id=$1`, [user_id]);
        if (isTokenValid.rows.length === 0) {
            throw new ApiError(401, 'Invalid Token');
        }
        req.user = decodedToken;
        next();

    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message,
            success: false,
        });
    }
}
module.exports = checkAuth;