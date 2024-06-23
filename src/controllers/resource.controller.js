const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const pool = require('../db/connection');
const isValidUUID = require('../utils/uuid');
const { uploadAttachmentToCloudinary } = require('../utils/cloudinary');

const uploadResource = async (req, res) => {
    try {
        const { course_id } = req.params;
        const uploader_id = req.user.user_id;

        if (!isValidUUID(course_id)) {
            throw new ApiError(400, "The course id is not valid UUID");
        }

        if (!isValidUUID(uploader_id)) {
            throw new ApiError(400, "The uploader id is not valid UUID");
        }

        const { title, description } = req.body;
        const attachment = req.file;
        if (!attachment) {
            throw new ApiError(400, "Attachment is required");
        }

        const attachmentUrl = await uploadAttachmentToCloudinary(attachment.path);
        if (!attachmentUrl) {
            throw new ApiError(500, "Error in uploading attachment");
        }

        const insertNewResource = await pool.query(`INSERT INTO Resources 
             (course_id, uploaded_by, title, description, attachment)
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [course_id, uploader_id, title, description, attachmentUrl.secure_url]
        );
        if (insertNewResource.rows.length === 0) {
            throw new ApiError(500, "Error in posting resource");
        }
        res.status(201).json(
            new ApiResponse(201, "Resource posted successfully", insertNewResource.rows[0])
        )

    }
    catch (error) {
        //console.log("Error in posting assignment", error);
        res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error",
            success: false,
        });

    }
}
module.exports = {
    uploadResource
}