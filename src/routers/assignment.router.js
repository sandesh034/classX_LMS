const router = require('express').Router()

const { checkInstructorEnrollment, checkEnrollment, checkStudentEnrollment } = require('../middlewares/enrollment.middleware')
const { checkInstructor } = require('../middlewares/role.middleware')
const checkAuth = require('../middlewares/auth.middleware')
const upload = require('../utils/multer')
const { postAssignment, submitAssignment, gradeAssignment, obtainSubmittedAssignment } = require('../controllers/assignment.controller')

router.post('/post/:course_id', checkAuth, checkInstructor, checkInstructorEnrollment, upload.single('attachment'), postAssignment)
//provide assignment_id as query parameter for these 2 URLS
router.post('/submit/:course_id/', checkAuth, checkStudentEnrollment, upload.single('attachment'), submitAssignment)
router.get('/getSubmittion/:course_id', checkAuth, checkInstructor, checkInstructorEnrollment, obtainSubmittedAssignment)
//provide assignment_submit_id as query parameter for this URL
router.put('/grade/:course_id', checkAuth, checkInstructor, checkInstructorEnrollment, gradeAssignment)


module.exports = router
