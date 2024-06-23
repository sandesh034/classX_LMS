const router = require('express').Router()

const { createForumPost, replyInForumPost, getForumPostsWithRepliesById } = require('../controllers/forum.controller')
const checkAuth = require('../middlewares/auth.middleware')
const { checkEnrollment } = require('../middlewares/enrollment.middleware')

router.post('/post/:course_id', checkAuth, checkEnrollment, createForumPost)

//provide the forum_id as query parameter for follwoing routes
router.post('/reply/:course_id', checkAuth, checkEnrollment, replyInForumPost)
router.get('/list/:course_id', checkAuth, checkEnrollment, getForumPostsWithRepliesById)
module.exports = router