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

const assignInstructorToCourse = async (req, res) => {
    try {
        const { course_id, instructor_id } = req.body;
        console.log(course_id, instructor_id);
        if (!isValidUUID(course_id) || !isValidUUID(instructor_id)) {
            throw new ApiError(400, "The course id or instructor id is not valid UUID");
        }
        if ([course_id, instructor_id].some((field) => {
            return field == undefined || field == null || field === "";
        })) {
            throw new ApiError(400, "All fields are required");
        }
        const course = await pool.query(`SELECT * FROM Courses WHERE course_id=$1`, [course_id]);
        if (course.rows.length == 0) {
            throw new ApiError(404, "Course not found");

        }
        const instructor = await pool.query(`SELECT * FROM Users WHERE user_id=$1 AND user_type='instructor'`, [instructor_id]);
        if (instructor.rows.length == 0) {
            throw new ApiError(404, "Instructor not found");
        }
        const assignment = await pool.query(`INSERT INTO InstructorAssignments (course_id, instructor_id) VALUES ($1, $2) RETURNING *`, [course_id, instructor_id]);
        if (assignment.rows.length == 0) {
            throw new ApiError(500, "Error in assigning instructor to course");
        }
        res.status(201).json(
            new ApiResponse(201, "Instructor assigned to course successfully", assignment.rows[0])
        )
    } catch (error) {
        //console.log("Error in assigning instructor to course", error);
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

const getAllStudentsInCourse = async (req, res) => {
    try {
        const { course_id } = req.params;
        if (!isValidUUID(course_id)) {
            throw new ApiError(400, "The course id is not valid UUID");
        }
        const course = await pool.query(`SELECT * FROM Courses WHERE course_id=$1`, [course_id]);
        if (course.rows.length == 0) {
            throw new ApiError(404, "Course not found");
        }
        const students = await pool.query(`SELECT Enrollments.enrollment_id,Enrollments.enrollment_date,
            Users.user_id,Users.name,Users.email,Users.phone,Users.image
            FROM Enrollments 
            INNER JOIN Users ON Enrollments.student_id=Users.user_id
            WHERE course_id=$1`, [course_id]);
        if (students.rows.length == 0) {
            throw new ApiError(404, "No students found in this course");
        }
        res.status(200).json(
            new ApiResponse(200, "Students fetched successfully", { course: course.rows[0], students: students.rows })
        )
    } catch (error) {
        //console.log("Error in fetching students", error);
        res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error",
            success: false,
        });
    }
}

const getCourseByLoggedInUserId = async (req, res) => {
    try {
        const { user_id, user_type } = req.user;
        if (!isValidUUID(user_id)) {
            throw new ApiError(400, "The user id is not valid UUID");
        }

        if (user_type === 'student') {
            const courses = await pool.query(`SELECT Courses.course_id,Courses.name,Courses.description
            FROM Enrollments 
            INNER JOIN Courses ON Enrollments.course_id=Courses.course_id
            WHERE student_id=$1`, [user_id]);
            if (courses.rows.length == 0) {
                throw new ApiError(404, "No courses found");
            }
            res.status(200).json(
                new ApiResponse(200, "Courses fetched successfully", courses.rows)
            )
        }
        else if (user_type === 'instructor') {
            const courses = await pool.query(`SELECT Courses.course_id,Courses.name,Courses.description
            FROM InstructorAssignments 
            INNER JOIN Courses ON InstructorAssignments.course_id=Courses.course_id
            WHERE instructor_id=$1`, [user_id]);
            if (courses.rows.length == 0) {
                throw new ApiError(404, "No courses found");
            }
            res.status(200).json(
                new ApiResponse(200, "Courses fetched successfully", courses.rows)
            )
        }

        else {
            const courses = await pool.query(`SELECT * FROM Courses`);
            if (courses.rows.length == 0) {
                throw new ApiError(404, "No courses found");
            }
            res.status(200).json(
                new ApiResponse(200, "Courses fetched successfully", courses.rows)
            )
        }

    } catch (error) {
        //console.log("Error in fetching course", error);
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
    searchCourse,
    getAllStudentsInCourse,
    assignInstructorToCourse,
    getCourseByLoggedInUserId
}