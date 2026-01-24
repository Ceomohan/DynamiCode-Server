const express = require('express');
const router = express.Router();
const { recordAttempt, getNextRecommendation } = require('../controllers/adaptive.controller');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.post('/record', protect, recordAttempt);
router.get('/next', protect, getNextRecommendation);

module.exports = router;
