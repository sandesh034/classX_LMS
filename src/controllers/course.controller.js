const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const pool = require("../db/connection");
const isValidUUID = require("../utils/uuid");


const createCourse = async (req, res) => {
    try {
        const { name, description, price, start_date, duration } = req.body;
        console.log(name, description, price, start_date, duration)


        if ([name, description, price, start_date, duration].some((field) => {
            return field == undefined || field == null || field === "";
        })) {
            throw new ApiError(400, "All fields are required");
        }
        const newCourse = await pool.query(`INSERT INTO Courses (name, description, price, start_date, duration)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, description, price, start_date, duration]);

        if (newCourse.rows.length == 0) {
            throw new ApiError(500, "Error in creating course");
        }
        res.status(201).json(
            new ApiResponse(201, "Course created successfully", newCourse.rows[0])
        )

    } catch (error) {
        //console.log("Error in creating course", error);
        res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error",
            success: false,
        });
    }
}

const getAllCourses = async (req, res) => {
    try {
        const courses = await pool.query(`SELECT * FROM Courses`);
        if (courses.rows.length == 0) {
            throw new ApiError(404, "No courses found");
        }
        res.status(200).json(
            new ApiResponse(200, "Courses fetched successfully", courses.rows)
        )
    } catch (error) {
        // console.log("Error in fetching courses", error);
        res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error",
            success: false,
        });
    }
}

const getCourseById = async (req, res) => {
    try {
        const { course_id } = req.params;
        if (!isValidUUID(course_id)) {
            throw new ApiError(400, "The course id is not valid UUID");
        }

        const course = await pool.query(`SELECT * FROM Courses WHERE course_id=$1`, [course_id]);
        if (course.rows.length == 0) {
            throw new ApiError(404, "Course not found");
        }
        res.status(200).json(
            new ApiResponse(200, "Course fetched successfully", course.rows[0])
        )
    } catch (error) {
        //console.log("Error in searching course", error);
        res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error",
            success: false,
        });
    }
}

const searchCourse = async (req, res) => {
    try {
        const { name } = req.query;
        if (name == undefined || name == null || name === "") {
            throw new ApiError(400, "Name is required");
        }
        const courses = await pool.query(`SELECT * FROM Courses WHERE name ILIKE $1`, [`%${name}%`]);
        if (courses.rows.length == 0) {
            throw new ApiError(404, "No courses found");
        }
        res.status(200).json(
            new ApiResponse(200, "Courses fetched successfully", courses.rows)
        )
    } catch (error) {
        //console.log("Error in fetching courses", error);
        res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error",
            success: false,
        });
    }
}

module.exports = {
    createCourse,
    getAllCourses,
    getCourseById,
    searchCourse
}