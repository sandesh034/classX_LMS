const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse')
const pool = require('../db/connection')
const isValidUUID = require('../utils/uuid')
const { uploadAttachmentToCloudinary } = require('../utils/cloudinary')

const postAssignment = async (req, res) => {
    try {
        const { course_id } = req.params;
        const instructor_id = req.user.user_id;

        if (!isValidUUID(course_id)) {
            throw new ApiError(400, "The course id is not valid UUID");
        }

        if (!isValidUUID(instructor_id)) {
            throw new ApiError(400, "The instructor id is not valid UUID");
        }

        const { title, description, deadline_date, deadline_time, full_marks, pass_marks } = req.body;
        const attachment = req.file;
        if ([title, description, deadline_date, deadline_time, full_marks, pass_marks].some((field) => {
            return field == undefined || field == null || field === "";
        })) {
            throw new ApiError(400, "All fields are required");
        }

        const attachmentUrl = await uploadAttachmentToCloudinary(attachment.path);
        if (!attachmentUrl) {
            throw new ApiError(500, "Error in uploading attachment");
        }
        // console.log(attachmentUrl);

        const insertNewAssignment = await pool.query(`INSERT INTO Assignment_Posts 
             (course_id, assigned_by, title, description, deadline_date, deadline_time, full_marks, pass_marks, attachment)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             RETURNING *`,
            [course_id, instructor_id, title, description, deadline_date, deadline_time, full_marks, pass_marks, attachmentUrl.secure_url]
        );


        if (insertNewAssignment.rows.length === 0) {
            throw new ApiError(500, "Error in posting assignment");
        }

        res.status(201).json(
            new ApiResponse(201, "Assignment posted successfully", insertNewAssignment.rows[0])
        )

    } catch (error) {
        //console.log("Error in posting assignment", error);
        res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error",
            success: false,
        });

    }
}

module.exports = {
    postAssignment
}