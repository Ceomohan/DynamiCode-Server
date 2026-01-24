const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  sendRequest,
  acceptRequest,
  getFriends,
  getRequests,
} = require('../controllers/social.controller');

router.post('/send-request', protect, sendRequest);
router.post('/accept-request', protect, acceptRequest);
router.get('/friends', protect, getFriends);
router.get('/requests', protect, getRequests);

module.exports = router;

