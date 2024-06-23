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

const submitAssignment = async (req, res) => {
    try {
        const { assignment_id } = req.query;
        const student_id = req.user.user_id;

        if (!isValidUUID(assignment_id)) {
            throw new ApiError(400, "The assignment id is not valid UUID");
        }
        if (!isValidUUID(student_id)) {
            throw new ApiError(400, "The student id is not valid UUID");
        }

        const getDeadLine = await pool.query(`SELECT deadline_date,deadline_time FROM Assignment_Posts WHERE assignment_id=$1`, [assignment_id]);

        if (getDeadLine.rows.length === 0) {
            throw new ApiError(404, "Assignment not found");
        }
        const date = new Date(getDeadLine.rows[0].deadline_date).toISOString().split('T')[0];
        const time = getDeadLine.rows[0].deadline_time;
        const deadLine = new Date(`${date}T${time}`);

        if (deadLine < new Date()) {
            throw new ApiError(400, "You cannot submit assignment after deadline");
        }

        const checkSubmission = await pool.query(`SELECT * FROM Assignment_Submissions WHERE assignment_id=$1 AND submitted_by=$2`, [assignment_id, student_id]);
        if (checkSubmission.rows.length > 0) {
            throw new ApiError(400, "You have already submitted this assignment");
        }
        const { description } = req.body;
        const attachment = req.file;
        if (!attachment) {
            throw new ApiError(400, "Please attach the assignment file");
        }
        const attachmentUrl = await uploadAttachmentToCloudinary(attachment.path);
        if (!attachmentUrl) {
            throw new ApiError(500, "Error in uploading attachment");
        }

        const submitAssignment = await pool.query(`INSERT INTO Assignment_Submissions(assignment_id,submitted_by,description,attachment) VALUES($1,$2,$3,$4) RETURNING *`, [assignment_id, student_id, description, attachmentUrl.secure_url]);

        if (submitAssignment.rows.length === 0) {
            throw new ApiError(500, "Error in submitting assignment");
        }
        res.json(new ApiResponse(200, "Assignment submitted successfully", submitAssignment.rows[0]));

    } catch (error) {
        //console.log("Error in submitting assignment", error);
        res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error",
            success: false,
        });
    }
}

const gradeAssignment = async (req, res) => {
    try {
        const graded_by = req.user.user_id;
        const { assignment_submit_id } = req.query;
        // console.log(assignment_submit_id)

        if (!isValidUUID(graded_by)) {
            throw new ApiError(400, "The instructor id is not valid UUID");
        }
        if (!isValidUUID(assignment_submit_id)) {
            throw new ApiError(400, "The assignment submit id is not valid UUID");
        }

        const { obtained_marks, comment } = req.body;

        if ([obtained_marks].some((field) => {
            return field == undefined || field == null || field === "";
        })) {
            throw new ApiError(400, "All fields are required");
        }

        const checkAssignment = await pool.query(`SELECT * FROM Assignment_Submissions WHERE assignment_submit_id=$1`, [assignment_submit_id]);
        if (checkAssignment.rows.length === 0) {
            throw new ApiError(404, "Assignment submission not found");
        }

        const getFullAndPassMarks = await pool.query(`SELECT full_marks,pass_marks FROM Assignment_Posts WHERE assignment_id=$1`, [checkAssignment.rows[0].assignment_id]);

        const full_marks = getFullAndPassMarks.rows[0].full_marks;
        const pass_marks = getFullAndPassMarks.rows[0].pass_marks;

        if (obtained_marks > full_marks || obtained_marks < 0) {
            throw new ApiError(400, `Obtained marks should be between 0 and ${full_marks}`);
        }

        const gradeAssignment = await pool.query(`UPDATE Assignment_Submissions SET obtained_marks=$1,comment=$2,graded_by=$3 WHERE assignment_submit_id=$4 RETURNING *`, [obtained_marks, comment, graded_by, assignment_submit_id]);
        if (gradeAssignment.rows.length === 0) {
            throw new ApiError(500, "Error in grading assignment");
        }
        res.json(new ApiResponse(200, "Assignment graded successfully", gradeAssignment.rows[0]));

    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error",
            success: false,
        });
    }

}

const obtainSubmittedAssignment = async (req, res) => {
    try {
        const { assignment_id } = req.query;

        if (!isValidUUID(assignment_id)) {
            throw new ApiError(400, "The assignment id is not valid UUID");
        }

        const getAssignment = await pool.query(`SELECT * FROM Assignment_Posts WHERE assignment_id=$1`, [assignment_id]);

        if (getAssignment.rows.length === 0) {
            throw new ApiError(404, "Assignment not found");
        }
        // console.log(getAssignment.rows[0]);

        const getSubmittedAssignment = await pool.query(`SELECT * FROM Assignment_Submissions WHERE assignment_id=$1`, [assignment_id]);
        if (getSubmittedAssignment.rows.length === 0) {
            throw new ApiError(404, "No submission found for this assignment");
        }
        res.json(new ApiResponse(200, "Submitted assignment obtained successfully", { assignment: getAssignment.rows[0], submission: getSubmittedAssignment.rows }));

    } catch (error) {
        //console.log("Error in obtaining submitted assignment", error);
        res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error",
            success: false,
        });
    }
}

module.exports = {
    postAssignment,
    submitAssignment,
    gradeAssignment,
    obtainSubmittedAssignment
}