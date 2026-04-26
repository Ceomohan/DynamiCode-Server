const express = require('express');
const router = express.Router();
const { getTopics, getTopicProblems } = require('../controllers/topicController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getTopics);
router.get('/:slug/problems', protect, getTopicProblems);

module.exports = router;
