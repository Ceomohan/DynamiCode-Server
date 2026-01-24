const express = require('express');
const router = express.Router();
const { generateProblem } = require('../controllers/problemController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', protect, generateProblem);

module.exports = router;
