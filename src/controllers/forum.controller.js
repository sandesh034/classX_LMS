const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const pool = require('../db/connection');
const isValidUUID = require('../utils/uuid');

const createForumPost = async (req, res) => {
    try {
        const { course_id } = req.params;
        const posted_by = req.user.user_id;
        // console.log("Posted by:", posted_by);

        if (!isValidUUID(course_id)) {
            throw new ApiError(400, "The course id is not valid UUID");
        }
        if (!isValidUUID(posted_by)) {
            throw new ApiError(400, "The user id is not valid UUID");
        }

        const { title, description } = req.body;
        if ([title, description].some((field) => {
            return field == undefined || field == null || field === "";
        })) {
            throw new ApiError(400, "All fields are required");
        }

        const newPost = await pool.query(`INSERT INTO Forum_Posts 
             (course_id, posted_by, title, description)
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [course_id, posted_by, title, description]
        );

        if (newPost.rows.length === 0) {
            throw new ApiError(500, "Error in posting forum post");
        }

        res.status(201).json(
            new ApiResponse(201, "Forum post created successfully", newPost.rows[0])
        )

    } catch (error) {
        //console.log("Error in posting forum post", error);
        res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error",
            success: false,
        });

    }
}

const replyInForumPost = async (req, res) => {
    try {
        const { course_id } = req.params;
        const { forum_id } = req.query;
        const replied_by = req.user.user_id;
        if (!isValidUUID(course_id)) {
            throw new ApiError(400, "The course id is not valid UUID");
        }
        if (!isValidUUID(forum_id)) {
            throw new ApiError(400, "The forum id is not valid UUID");
        }
        if (!isValidUUID(replied_by)) {
            throw new ApiError(400, "The user id is not valid UUID");
        }
        const { reply_text } = req.body;
        if (reply_text == undefined || reply_text == null || reply_text.trim() === "") {
            throw new ApiError(400, "Reply text is required");
        }
        const newReply = await pool.query(`INSERT INTO Forum_Replies 
             (forum_id, replied_by, reply_text)
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [forum_id, replied_by, reply_text]
        );
        if (newReply.rows.length === 0) {
            throw new ApiError(500, "Error in replying forum post");
        }
        res.status(201).json(
            new ApiResponse(201, "Replied successfully", newReply.rows[0])
        )
    } catch (error) {
        //console.log("Error in replying forum post", error);
        res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error",
            success: false,
        });
    }

}

const getForumPostsWithRepliesById = async (req, res) => {
    try {
        const { course_id } = req.params;
        const { forum_id } = req.query;
        if (!isValidUUID(course_id)) {
            throw new ApiError(400, "The course id is not valid UUID");
        }
        if (!isValidUUID(forum_id)) {
            throw new ApiError(400, "The forum id is not valid UUID");
        }
        const forumPost = await pool.query(`SELECT * FROM Forum_Posts WHERE forum_id = $1`, [forum_id]);
        if (forumPost.rows.length === 0) {
            throw new ApiError(404, "Forum post not found");
        }
        const replies = await pool.query(`SELECT * FROM Forum_Replies WHERE forum_id = $1`, [forum_id]);
        if (replies.rows.length === 0) {
            throw new ApiError(404, "No replies found for this forum post");
        }
        res.status(200).json(
            new ApiResponse(200, "Forum post with replies", {
                forumPost: forumPost.rows[0],
                replies: replies.rows
            })
        )

    } catch (error) {
        //console.log("Error in fetching forum post", error);
        res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error",
            success: false,
        });
    }
}

const getAllForumPostsInCourse = async (req, res) => {
    try {
        const { course_id } = req.params;
        if (!isValidUUID(course_id)) {
            throw new ApiError(400, "The course id is not valid UUID");
        }
        const forumPosts = await pool.query(`
    SELECT 
        Forum_Posts.forum_id,
        Forum_Posts.title,
        Forum_Posts.description,
        Forum_Posts.posted_at,
        Users.name AS posted_by,
        (SELECT COUNT(*) FROM Forum_Replies WHERE Forum_Replies.forum_id = Forum_Posts.forum_id) AS reply_count
    FROM 
        Forum_Posts
    INNER JOIN 
        Users ON Forum_Posts.posted_by = Users.user_id
    LEFT JOIN 
        Forum_Replies ON Forum_Posts.forum_id = Forum_Replies.forum_id
    WHERE 
        Forum_Posts.course_id = $1
    GROUP BY 
        Forum_Posts.forum_id, Users.name
    ORDER BY
        FORUM_POSTS.posted_at DESC;
`, [course_id]);

        const forumReplies = await pool.query(`
    SELECT 
        Forum_Replies.forum_id,
        Users.name AS replied_by,
        Forum_Replies.reply_text
    FROM 
        Forum_Replies
    INNER JOIN 
        Users ON Forum_Replies.replied_by = Users.user_id
    WHERE 
        Forum_Replies.forum_id IN (SELECT forum_id FROM Forum_Posts WHERE course_id = $1);
`, [course_id]);

        const forumPostsMap = forumPosts.rows.reduce((acc, post) => {
            acc[post.forum_id] = { ...post, replies: [] };
            return acc;
        }, {});

        // console.log(forumPostsMap);

        forumReplies.rows.forEach(reply => {
            if (forumPostsMap[reply.forum_id]) {
                forumPostsMap[reply.forum_id].replies.push(reply);
            }
        });

        const finalResult = Object.values(forumPostsMap);
        res.status(200).json(
            new ApiResponse(200, "All forum posts with replies", finalResult)
        )

    } catch (error) {
        //console.log("Error in fetching forum post", error);
        res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error",
            success: false,
        });

    }
}

module.exports = {
    createForumPost,
    replyInForumPost,
    getAllForumPostsInCourse,
    getForumPostsWithRepliesById
}
