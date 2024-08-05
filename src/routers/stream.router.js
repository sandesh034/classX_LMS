const router = require('express').Router();
const { generateStreamToken, scheduleClass } = require('../controllers/stream.controller');
const checkAuth = require('../middlewares/auth.middleware');

router.get('/generate-token', checkAuth, generateStreamToken);
router.get('/schedule-class', checkAuth, scheduleClass);

module.exports = router;