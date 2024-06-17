const router = require('express').Router()
const { enrollInCourse } = require('../controllers/student.controller')
const checkAuth = require('../middlewares/auth.middleware')


router.post('/enroll/:course_id', checkAuth, enrollInCourse)
module.exports = router