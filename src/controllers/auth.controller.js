const ApiResponse = require('../utils/ApiResponse')
const ApiError = require('../utils/ApiError')
const pool = require('../db/connection')
const uploadImageToCloudinary = require('../utils/cloudinary')
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt')
const bcrypt = require('bcrypt')


const registerUser = async (req, res) => {
    try {
        const { name, email, phone, password, user_type } = req.body
        const image = req.file;
        // console.log(name, email, phone, password, user_type, image)
        if ([name, email, phone, password, user_type].some((field) => {
            return field === undefined || field.trim() === '' || field === null

        })) {
            throw new ApiError(400, 'All fields are required')
        }
        const isUserAlreadyExists = await pool.query(`SELECT * FROM Users WHERE email=$1`, [email])
        if (isUserAlreadyExists.rows.length > 0) {
            throw new ApiError(409, 'User already exists')
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        const imageUrlFromCloudinary = await uploadImageToCloudinary(image.path)
        //console.log(imageUrl)
        if (!imageUrlFromCloudinary) {
            throw new ApiError(500, 'Error uploading image to cloudinary')
        }
        const newUser = await pool.query(`INSERT INTO Users (name, email, phone, password, user_type, image) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id, name, email, phone, user_type, image, created_at, updated_at`,
            [name, email, phone, hashedPassword, user_type, imageUrlFromCloudinary.secure_url])

        if (!newUser.rows[0]) {
            throw new ApiError(500, 'Error in registering user')
        }
        res.status(201).json(
            new ApiResponse(201, 'User registered successfully', newUser.rows[0])
        )
    } catch (error) {
        console.log(error.code)
        res.status(500).json({
            message: error.message,
            success: false,
        });
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        // console.log(email, password)
        if ([email, password].some((field) => {
            return field === undefined || field.trim() === '' || field === null
        })) {
            throw new ApiError(400, 'All fields are required')
        }
        const user = await pool.query(`SELECT * FROM Users WHERE email=$1`, [email])
        if (user.rows.length === 0) {
            throw new ApiError(404, 'Email does not exist')
        }
        const isPasswordValid = await bcrypt.compare(password, user.rows[0].password)
        if (!isPasswordValid) {
            throw new ApiError(401, 'Invalid credentials')
        }

        const accessToken = generateAccessToken(user.rows[0])
        const refreshToken = generateRefreshToken(user.rows[0])

        const saveRefreshToken = await pool.query(`UPDATE Users SET refresh_token=$1 WHERE email=$2 
            RETURNING user_id, name, email, phone, user_type, image, created_at, updated_at`, [refreshToken, email])

        if (saveRefreshToken.rows.length === 0) {
            throw new ApiError(500, 'Error in saving refresh token')
        }

        res.status(200)
            .cookie('accessToken', accessToken, { httpOnly: true, secure: true })
            .cookie('refreshToken', refreshToken, { httpOnly: true, secure: true })
            .json(
                new ApiResponse(200, 'User logged in successfully', {
                    user: saveRefreshToken.rows[0],
                    accessToken,
                    refreshToken

                })
            )
    } catch (error) {
        res.status(500).json({
            message: error.message,
            success: false
        })
    }

}

const logOutUser = async (req, res) => {
    try {
        const { user_id } = req.user;

        const removeRefreshToken = await pool.query(
            `UPDATE Users SET refresh_token=$1 WHERE user_id=$2 
            RETURNING user_id, name, email, phone, user_type, image, created_at, updated_at`,
            [null, user_id]
        );

        if (removeRefreshToken.rows.length === 0) {
            throw new ApiError(500, 'Error in logging out user');
        }

        res.status(200)
            .clearCookie('accessToken', { httpOnly: true, secure: true })
            .clearCookie('refreshToken', { httpOnly: true, secure: true })
            .json(new ApiResponse(200, "User logged out successfully", {}));
    } catch (error) {
        console.error('Error in logOutUser function:', error);
        res.status(error.statusCode || 500).json({
            message: error.message || 'Internal Server Error',
            success: false,
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    logOutUser
} 