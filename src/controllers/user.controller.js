const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const pool = require('../db/connection');
const { uploadImageToCloudinary } = require('../utils/cloudinary');


const updateProfile = async (req, res) => {
    try {
        const { user_id, } = req.user;
        const image = req.file
        const { name, email, phone, user_type } = req.body;
        // console.log(name, email, phone, user_type, image);

        if ([name, email, phone, user_type].some((field) => {
            return field == undefined || field == null || field == "";
        })) {
            throw new ApiError(400, "All fields are required. Image is optional");
        }
        let imageUrl = req.user.image;
        if (image) {
            const imageUrlFromCloudinary = await uploadImageToCloudinary(image.path);
            if (!imageUrlFromCloudinary) {
                return res.status(500).json({ message: 'Error uploading image to Cloudinary', success: false });
            }
            imageUrl = imageUrlFromCloudinary.secure_url;
        }
        // console.log(imageUrl);

        const updatedUser = await pool.query(`UPDATE Users SET name=$1, email=$2, phone=$3, user_type=$4, image=$5 WHERE user_id=$6 RETURNING user_id,name,email,phone,image,user_type`, [name, email, phone, user_type, imageUrl, user_id]);
        if (updatedUser.rows.length == 0) {
            throw new ApiError(500, "Error in updating user profile");
        }
        res.status(200).json(
            new ApiResponse(200, "Profile updated successfully", {
                user: updatedUser.rows[0]
            })
        )
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error",
            success: false,
        });
    }
}

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

const getAllInstructionsInCourse = async (req, res) => {
    try {
        const { course_id } = req.params;
        const instructors = await pool.query(`
            SELECT Users.* 
            FROM InstructorAssignments
            INNER JOIN Users ON InstructorAssignments.instructor_id = Users.user_id
            WHERE course_id = $1
        `, [course_id]);
        if (instructors.rows.length == 0) {
            throw new ApiError(404, "No instructors found for this course");
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
    updateProfile,
    getAllInstructors,
    getAllInstructionsInCourse
}