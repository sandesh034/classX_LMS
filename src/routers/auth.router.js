const router = require('express').Router()
const upload = require('../utils/multer')
const { registerUser, loginUser, logOutUser, refreshAccessToken } = require('../controllers/auth.controller')
const { getAllInstructors } = require('../controllers/user.controller')
const checkAuth = require('../middlewares/auth.middleware')

router.post('/register', upload.single('image'), registerUser)
router.post('/login', loginUser)
router.post('/logout', checkAuth, logOutUser)
router.post('/refresh', refreshAccessToken)
router.get('/list/instructors', getAllInstructors)

module.exports = router