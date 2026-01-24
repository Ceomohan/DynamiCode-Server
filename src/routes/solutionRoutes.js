const express = require('express');
const router = express.Router();
const solutionController = require('../controllers/solutionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', protect, solutionController.generateSolution);

module.exports = router;
