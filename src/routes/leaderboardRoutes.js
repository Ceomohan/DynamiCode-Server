const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getTop, getMe } = require('../controllers/leaderboard.controller');

router.get('/top', protect, getTop);
router.get('/me', protect, getMe);

module.exports = router;

