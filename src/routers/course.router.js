const router = require('express').Router()

const { checkInstructorEnrollment } = require('../middlewares/enrollment.middleware')
const { checkInstructor } = require('../middlewares/role.middleware')
const checkAuth = require('../middlewares/auth.middleware')
const upload = require('../utils/multer')
const { createCourse, getAllCourses, getCourseById, searchCourse, getAllStudentsInCourse } = require('../controllers/course.controller')
const { postAssignment } = require('../controllers/assignment.controller')


router.post('/create', createCourse)
router.get('/list', getAllCourses)
router.get('/list/:course_id', getCourseById)
router.get('/search', searchCourse)
router.get('/students/:course_id', getAllStudentsInCourse)
router.post('/assignment/:course_id', checkAuth, checkInstructor, checkInstructorEnrollment, upload.single('attachment'), postAssignment)
module.exports = router