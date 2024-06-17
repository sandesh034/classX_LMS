const router = require('express').Router()

const { createCourse, getAllCourses, getCourseById, searchCourse } = require('../controllers/course.controller')

router.post('/create', createCourse)
router.get('/list', getAllCourses)
router.get('/list/:course_id', getCourseById)
router.get('/search', searchCourse)
module.exports = router