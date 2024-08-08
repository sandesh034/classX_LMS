const ApiError = require('../utils/ApiError');
const pool = require('../db/connection');
const isValidUUID = require('../utils/uuid');

const checkStudentEnrollment = async (req, res, next) => {
    try {
        const { course_id } = req.params;
        const student_id = req.user.user_id;
        if (!isValidUUID(course_id)) {
            throw new ApiError(400, "The course id is not valid UUID");
        }
        if (!isValidUUID(student_id)) {
            throw new ApiError(400, "The student id is not valid UUID");
        }
        const isEnrolled = await pool.query(`SELECT * FROM Enrollments WHERE course_id=$1 AND student_id=$2`, [course_id, student_id]);
        if (isEnrolled.rows.length === 0) {
            throw new ApiError(403, "You are not enrolled in this course");
        }
        next();
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message,
            success: false
        });
    }
}

const checkInstructorEnrollment = async (req, res, next) => {
    try {
        const { course_id } = req.params;
        const instructor_id = req.user.user_id;
        if (!isValidUUID(course_id)) {
            throw new ApiError(400, "The course id is not valid UUID");
        }
        if (!isValidUUID(instructor_id)) {
            throw new ApiError(400, "The instructor id is not valid UUID");
        }
        const isEnrolled = await pool.query(`SELECT * FROM InstructorAssignments WHERE course_id=$1 AND instructor_id=$2`, [course_id, instructor_id]);
        if (isEnrolled.rows.length === 0) {
            throw new ApiError(403, "You are not assigned to this course as an instructor");
        }
        next();
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message,
            success: false
        });
    }
}

const checkEnrollment = async (req, res, next) => {
    try {
        const { course_id } = req.params;
        const { user_id, user_type } = req.user;
        if (user_type === 'admin') {
            next();
            return;
        }
        if (!isValidUUID(course_id)) {
            throw new ApiError(400, "The course id is not valid UUID");
        }
        if (!isValidUUID(user_id)) {
            throw new ApiError(400, "The user id is not valid UUID");
        }
        const isEnrolled = await pool.query(`SELECT * FROM Enrollments WHERE course_id=$1 AND student_id=$2`, [course_id, user_id]);
        const isInstructor = await pool.query(`SELECT * FROM InstructorAssignments WHERE course_id=$1 AND instructor_id=$2`, [course_id, user_id]);
        if (isEnrolled.rows.length === 0 && isInstructor.rows.length === 0) {
            throw new ApiError(403, "You are not enrolled in this course or assigned as instructor");
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
    checkStudentEnrollment,
    checkInstructorEnrollment,
    checkEnrollment
}