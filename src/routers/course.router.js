const router = require('express').Router()

const { checkInstructorEnrollment, checkEnrollment, checkStudentEnrollment } = require('../middlewares/enrollment.middleware')
const checkAuth = require('../middlewares/auth.middleware')
const upload = require('../utils/multer')
const { createCourse, getAllCourses, getCourseById, searchCourse, getAllStudentsInCourse } = require('../controllers/course.controller')
const { uploadResource } = require('../controllers/resource.controller')


router.post('/create', createCourse)
router.get('/list', getAllCourses)
router.get('/list/:course_id', getCourseById)
router.get('/search', searchCourse)
router.get('/students/:course_id', getAllStudentsInCourse)
router.post('/resource/:course_id', checkAuth, checkEnrollment, upload.single('attachment'), uploadResource)
module.exports = router