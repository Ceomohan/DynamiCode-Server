const express = require('express');
const router = express.Router();
const { executeCode } = require('../controllers/executionController');
const { protect } = require('../middleware/authMiddleware');

// Protect the execution endpoint
router.post('/execute', protect, executeCode);

module.exports = router;
