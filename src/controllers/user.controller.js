const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const pool = require('../db/connection');


const getAllInstructors = async (req, res) => {
    try {
        const instructors = await pool.query(`SELECT * FROM USers WHERE user_type = 'instructor'`);
        if (instructors.rows.length == 0) {
            throw new ApiError(404, "No instructors found");
        }
        res.status(200).json(
            new ApiResponse(200, "Instructors fetched successfully", instructors.rows)
        )
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error",
            success: false,
        });
    }
}

module.exports = {
    getAllInstructors
}