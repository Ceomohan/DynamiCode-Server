const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const {
  listUsers,
  deleteUser,
  banUser,
  listProblems,
  deleteProblem,
  platformStats,
  updateAiSettings,
} = require('../controllers/admin.controller');

// All admin routes: JWT + admin role
router.use(protect, requireAdmin);

// Users
router.get('/users', listUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/ban', banUser);

// Problems
router.get('/problems', listProblems);
router.delete('/problems/:id', deleteProblem);

// Analytics
router.get('/stats', platformStats);

// AI controls
router.put('/ai-settings', updateAiSettings);

module.exports = router;

