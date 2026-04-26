const express = require('express');
const router = express.Router();
const { recordAttempt, getNextRecommendation, getRecommendations } = require('../controllers/adaptive.controller');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.post('/record', protect, recordAttempt);
router.get('/next', protect, getNextRecommendation);
router.get('/recommendations', protect, getRecommendations);

module.exports = router;
