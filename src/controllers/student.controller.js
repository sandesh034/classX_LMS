const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const pool = require('../db/connection');
const isValidUUID = require('../utils/uuid');

const enrollInCourse = async (req, res) => {
    try {
        const { course_id } = req.params;
        const student_id = req.user.user_id;
        // console.log(course_id, student_id);

        if (!isValidUUID(course_id)) {
            throw new ApiError(400, "The course id is not valid UUID");
        }
        if (!isValidUUID(student_id)) {
            throw new ApiError(400, "The student id is not valid UUID");
        }

        const course = await pool.query(`SELECT * FROM Courses WHERE course_id=$1`, [course_id]);
        if (course.rows.length == 0) {
            throw new ApiError(404, "Selected course not found");
        }
        const isAlreadyEnrolled = await pool.query(`SELECT * FROM Enrollments WHERE course_id=$1 AND student_id=$2`, [course_id, student_id]);

        if (isAlreadyEnrolled.rows.length > 0) {
            throw new ApiError(400, "You are already enrolled in this course");
        }

        const newEnrollment = await pool.query(`INSERT INTO Enrollments (course_id, student_id) VALUES ($1, $2) RETURNING *`, [course_id, student_id]);

        if (newEnrollment.rows.length == 0) {
            throw new ApiError(500, "Error in enrolling in course");
        }
        res.status(201).json(
            new ApiResponse(201, "Enrolled in course successfully.Enjoy The quality content", newEnrollment.rows[0])
        )
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error",
            success: false,
        });
    }
}

module.exports = {
    enrollInCourse
}