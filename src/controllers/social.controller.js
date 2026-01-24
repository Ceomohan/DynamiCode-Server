const socialService = require('../services/social.service');

/**
 * POST /api/social/send-request
 * body: { receiver } (email or userId)
 */
const sendRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { receiver } = req.body;
    if (!receiver) {
      return res.status(400).json({ message: 'Please provide receiver (email or userId)' });
    }

    const request = await socialService.sendRequest(userId, receiver);
    res.status(201).json({ request });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to send request' });
  }
};

/**
 * POST /api/social/accept-request
 * body: { requestId }
 */
const acceptRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({ message: 'Please provide requestId' });
    }

    const request = await socialService.acceptRequest(userId, requestId);
    res.status(200).json({ request });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to accept request' });
  }
};

/**
 * GET /api/social/friends
 */
const getFriends = async (req, res) => {
  try {
    const userId = req.user._id;
    const friends = await socialService.listFriends(userId);
    res.status(200).json({ friends });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load friends' });
  }
};

/**
 * GET /api/social/requests
 */
const getRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const requests = await socialService.listRequests(userId);
    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load requests' });
  }
};

module.exports = {
  sendRequest,
  acceptRequest,
  getFriends,
  getRequests,
};

