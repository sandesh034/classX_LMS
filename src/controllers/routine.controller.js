const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const pool = require("../db/connection");
const isValidUUID = require("../utils/uuid")
const { StreamClient } = require("@stream-io/node-sdk");

const scheduleClass = async (req, res) => {
    try {
        const { course_id } = req.params;
        const instructor_id = req.user.user_id;

        if (!isValidUUID(course_id)) {
            throw new ApiError(400, "The course id is not valid UUID");
        }
        if (!isValidUUID(instructor_id)) {
            throw new ApiError(400, "The instructor id is not valid UUID");
        }
        const { date, time, duration, title } = req.body;

        if ([date, time, duration].some((field) => {
            return field == undefined || field == null || field === "";
        })) {
            throw new ApiError(400, "All fields are required");
        }
        const scheduleStartPeriod = new Date(`${date}T${time}`);
        const scheduleEndPeriod = new Date(scheduleStartPeriod.getTime() + duration * 60000);

        if (scheduleStartPeriod < new Date()) {
            throw new ApiError(400, "Cannot schedule the class. The class is scheduled in the past");
        }

        const overlappableCourses = await pool.query(`SELECT * FROM Classes WHERE course_id=$1 AND date=$2`, [course_id, date]);
        if (overlappableCourses.rows.length > 0) {
            overlappableCourses.rows.forEach((course) => {
                const startingDate = new Date(course.date).toISOString().split('T')[0];
                const startingTime = course.time;
                const startingDateTime = new Date(`${startingDate}T${startingTime}`);
                const endingDateTime = new Date(startingDateTime.getTime() + course.duration * 60000);

                console.log("existing class start:", startingDateTime);
                console.log("existing class end:", endingDateTime);

                if (scheduleStartPeriod < endingDateTime && scheduleEndPeriod > startingDateTime) {
                    throw new ApiError(400, "Cannot schedule the class. The class is overlapped with another class");
                }
            });
        }

        const newClass = await pool.query(`INSERT INTO Classes(course_id, instructor_id, title,date, time, duration) VALUES($1, $2, $3, $4, $5,$6) RETURNING *`, [course_id, instructor_id, title, date, time, duration]);

        if (newClass.rows.length === 0) {
            throw new ApiError(500, "Failed to schedule class");
        }
        res.status(201).json(
            new ApiResponse(201, "Class scheduled successfully", newClass.rows[0])
        )

    } catch (error) {
        //console.log("Error in scheduling class", error);
        res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error",
            success: false,
        });
    }
}


const getClasses = async (req, res) => {
    try {
        const { course_id } = req.params;
        const classes = await pool.query(`SELECT Classes.*,Users.name as instructor_name FROM Classes 
            INNER JOIN Users ON Classes.instructor_id=Users.user_id
            WHERE course_id=$1`, [course_id]);

        if (classes.rows.length === 0) {
            throw new ApiError(404, "No classes found for the course");
        }
        const formattedClasses = classes.rows.map((course) => {
            const date = new Date(course.date);
            const timeParts = course.time.split(':');
            const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), timeParts[0], timeParts[1], timeParts[2]);
            const end = new Date(start.getTime() + course.duration * 60000);

            return {
                start: start.toISOString(),
                end: end.toISOString(),
                title: `${course.title}(${course.instructor_name})`,
            };
        });

        res.status(200).json(
            new ApiResponse(200, "Classes fetched successfully", formattedClasses)
        )
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error",
            success: false,
        });
    }
}

module.exports = {
    scheduleClass,
    getClasses
}