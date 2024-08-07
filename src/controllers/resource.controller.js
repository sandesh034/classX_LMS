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

const getAllResourcesInCourse = async (req, res) => {
    try {
        const { course_id } = req.params;
        if (!isValidUUID(course_id)) {
            throw new ApiError(400, "The course id is not valid UUID");
        }

        const allResources = await pool.query(`SELECT Users.name as user_name, Users.image as user_image,
            Resources.description, Resources.title, Resources.attachment, Resources.created_at
            FROM Resources 
            INNER JOIN users ON Resources.uploaded_by = users.user_id
            WHERE course_id = $1`, [course_id]);
        if (allResources.rows.length === 0) {
            throw new ApiError(404, "No resources found in the course");
        }
        res.status(200).json(
            new ApiResponse(200, "All resources in the course", allResources.rows)
        )
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error",
            success: false,
        });
    }
}
module.exports = {
    uploadResource,
    getAllResourcesInCourse
}