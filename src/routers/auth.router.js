const router = require('express').Router()
const upload = require('../utils/multer')
const { registerUser, loginUser, logOutUser, refreshAccessToken } = require('../controllers/auth.controller')
const { getAllInstructors, updateProfile, getAllInstructionsInCourse } = require('../controllers/user.controller')
const checkAuth = require('../middlewares/auth.middleware')

router.post('/register', upload.single('image'), registerUser)
router.post('/login', loginUser)
router.post('/logout', checkAuth, logOutUser)
router.post('/refresh', refreshAccessToken)
router.put('/update', checkAuth, upload.single('image'), updateProfile)
router.get('/list/instructors', getAllInstructors)
router.get('/instructors/:course_id', getAllInstructionsInCourse)


module.exports = router