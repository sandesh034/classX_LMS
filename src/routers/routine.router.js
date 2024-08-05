const router = require('express').Router();

const { scheduleClass, getClasses } = require('../controllers/routine.controller');
const checkAuth = require('../middlewares/auth.middleware');
const { checkInstructor } = require('../middlewares/role.middleware');
const { checkInstructorEnrollment } = require('../middlewares/enrollment.middleware');

router.post('/schedule/:course_id', checkAuth, checkInstructor, checkInstructorEnrollment, scheduleClass);
router.get('/:course_id', checkAuth, getClasses);
module.exports = router;