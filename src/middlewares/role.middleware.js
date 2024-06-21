const ApiError = require('../utils/ApiError');
const pool = require('../db/connection');

const checkInstructor = async (req, res, next) => {
    try {
        const { user_id } = req.user;
        const instructor = await pool.query(`SELECT * FROM Users WHERE user_id=$1 AND user_type='instructor'`, [user_id]);
        if (instructor.rows.length === 0) {
            throw new ApiError(403, 'You are not authorized to perform this action');
        }
        next();
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message,
            success: false
        });
    }
}


module.exports = {
    checkInstructor,
}