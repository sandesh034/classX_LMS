const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const pool = require("../db/connection");
const isValidUUID = require("../utils/uuid")

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
        const { date, time, duration } = req.body;
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
        const newClass = await pool.query(`INSERT INTO Classes(course_id, instructor_id, date, time, duration) VALUES($1, $2, $3, $4, $5) RETURNING *`, [course_id, instructor_id, date, time, duration]);

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
module.exports = {
    scheduleClass
}