const express = require('express');
const router = express.Router();
const { generateProblem, getProblemById } = require('../controllers/problemController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', protect, generateProblem);
router.post('/generate-problem', protect, generateProblem); // Alias for user request
router.get('/:id', protect, getProblemById);

module.exports = router;
