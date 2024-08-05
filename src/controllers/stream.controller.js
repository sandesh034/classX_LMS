const ApiError = require('../utils/ApiError');
const isValidUUID = require('../utils/uuid');
const ApiResponse = require('../utils/ApiResponse');
const pool = require('../db/connection');

const { StreamClient, StreamVideoClient } = require("@stream-io/node-sdk");

const apiKey = process.env.STREAM_API_KEY;
const secret = process.env.STREAM_API_SECRET;
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTRhNzgzMWEtNDg4YS00NmNlLWEwYTAtZjkzY2FkYTVjODNhIiwiZXhwIjoxNzIyNjUxNzM4LCJpYXQiOjE3MjI2NDgwNzh9.vcpSdVP23EyETCbVZG2Jxcph2__xpB7mFNJUyBa15ms"

const generateStreamToken = (req, res) => {
    try {
        const { user_id, user_type } = req.user;
        if (!apiKey || !secret) {
            throw new ApiError(500, "Stream API key or secret is not provided");
        }
        if (!isValidUUID(user_id)) {
            throw new ApiError(400, "The user id is not valid UUID");
        }
        if (user_type !== 'instructor') {
            throw new ApiError(403, "You are not authorized to generate stream token");
        }

        const client = new StreamClient(apiKey, secret, { timeout: 3000 });
        const exp = Math.round(new Date().getTime() / 1000) + 3600;
        const issued = Math.floor(Date.now() / 1000) - 60;
        const token = client.createToken(user_id, exp, issued);
        res.status(200).json(
            new ApiResponse(200, "Stream token generated successfully", { token })
        );

    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error",
            success: false,
        });
    }
}

const scheduleClass = async (req, res) => {
    try {
        const { user_id, name, image } = req.user;
        if (!apiKey || !secret) {
            throw new ApiError(500, "Stream API key or secret is not provided");
        }
        if (!isValidUUID(user_id)) {
            throw new ApiError(400, "The user id is not valid UUID");
        }

        const { date, time, duration, course_id } = req.body;
        // if (!date || !time || !duration || !course_id) {
        //     throw new ApiError(400, "Some required fields are missing");
        // }

        const user = {
            id: user_id,
            name: name,
            image: image
        }

        const callId = `class-${user_id}-${Date.now()}`;
        const callType = 'default';
        const client = new StreamClient({ apiKey, user, token });
        const call = client.call(callType, callId);
        await call.getOrCreate();

        const classURL = call;

        // const query = `
        //     INSERT INTO Classes (class_id, date, time, duration, instructor_id, course_id, class_url)
        //     VALUES ($1, $2, $3, $4, $5, $6, $7)
        // `;
        // const values = [callId, date, time, duration, user_id, course_id, classURL];

        // await pool.query(query, values);

        res.status(201).json(
            new ApiResponse(201, "Class scheduled successfully", { classURL })
        );

    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error",
            success: false,
        });
    }
}

module.exports = {
    generateStreamToken,
    scheduleClass
}
