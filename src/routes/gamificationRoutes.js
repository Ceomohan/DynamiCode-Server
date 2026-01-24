const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  updateGamification,
  getGamificationStats,
} = require('../controllers/gamification.controller');

router.post('/update', protect, updateGamification);
router.get('/stats', protect, getGamificationStats);

module.exports = router;

