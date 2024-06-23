const router = require('express').Router()

const { checkInstructorEnrollment, checkEnrollment, checkStudentEnrollment } = require('../middlewares/enrollment.middleware')
const { checkInstructor } = require('../middlewares/role.middleware')
const checkAuth = require('../middlewares/auth.middleware')
const upload = require('../utils/multer')
const { createCourse, getAllCourses, getCourseById, searchCourse, getAllStudentsInCourse } = require('../controllers/course.controller')
const { postAssignment, submitAssignment, gradeAssignment, obtainSubmittedAssignment } = require('../controllers/assignment.controller')
const { uploadResource } = require('../controllers/resource.controller')


router.post('/create', createCourse)
router.get('/list', getAllCourses)
router.get('/list/:course_id', getCourseById)
router.get('/search', searchCourse)
router.get('/students/:course_id', getAllStudentsInCourse)
router.post('/assignment/post/:course_id', checkAuth, checkInstructor, checkInstructorEnrollment, upload.single('attachment'), postAssignment)
//provide assignment_id as query parameter for these 2 URLS
router.post('/assignment/submit/:course_id/', checkAuth, checkStudentEnrollment, upload.single('attachment'), submitAssignment)
router.get('/assignment/getSubmittion/:course_id', checkAuth, checkInstructor, checkInstructorEnrollment, obtainSubmittedAssignment)
//provide assignment_submit_id as query parameter for this URL
router.put('/assignment/grade/:course_id', checkAuth, checkInstructor, checkInstructorEnrollment, gradeAssignment)

router.post('/resource/:course_id', checkAuth, checkEnrollment, upload.single('attachment'), uploadResource)
module.exports = router