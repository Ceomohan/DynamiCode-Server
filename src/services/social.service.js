const Friend = require('../models/Friend');
const User = require('../models/User');

const sendRequest = async (requesterId, receiverEmailOrId) => {
  if (String(requesterId) === String(receiverEmailOrId)) {
    throw new Error('You cannot send a friend request to yourself');
  }

  // Allow sending by userId or email (simple UX)
  let receiver = null;
  if (String(receiverEmailOrId).includes('@')) {
    receiver = await User.findOne({ email: receiverEmailOrId }).select('_id name email');
  } else {
    receiver = await User.findById(receiverEmailOrId).select('_id name email');
  }

  if (!receiver) throw new Error('Receiver not found');
  if (String(requesterId) === String(receiver._id)) throw new Error('You cannot add yourself');

  // Check if relationship already exists in either direction
  const existing = await Friend.findOne({
    $or: [
      { requester: requesterId, receiver: receiver._id },
      { requester: receiver._id, receiver: requesterId },
    ],
  });

  if (existing) {
    if (existing.status === 'accepted') {
      throw new Error('You are already friends');
    }
    // Pending exists: if current user already requested, don't create duplicate
    throw new Error('Friend request already pending');
  }

  const req = await Friend.create({
    requester: requesterId,
    receiver: receiver._id,
    status: 'pending',
  });

  return req;
};

const acceptRequest = async (receiverId, requestId) => {
  const req = await Friend.findOne({ _id: requestId, receiver: receiverId, status: 'pending' });
  if (!req) throw new Error('Friend request not found');

  req.status = 'accepted';
  await req.save();
  return req;
};

const listFriends = async (userId) => {
  const rows = await Friend.find({
    status: 'accepted',
    $or: [{ requester: userId }, { receiver: userId }],
  })
    .sort({ updatedAt: -1 })
    .populate('requester', 'name email')
    .populate('receiver', 'name email');

  return rows.map((r) => {
    const isRequester = String(r.requester._id) === String(userId);
    const other = isRequester ? r.receiver : r.requester;
    return {
      friendshipId: r._id,
      userId: other._id,
      name: other.name,
      email: other.email,
      since: r.updatedAt,
    };
  });
};

const listRequests = async (userId) => {
  const incoming = await Friend.find({ receiver: userId, status: 'pending' })
    .sort({ createdAt: -1 })
    .populate('requester', 'name email');

  const outgoing = await Friend.find({ requester: userId, status: 'pending' })
    .sort({ createdAt: -1 })
    .populate('receiver', 'name email');

  return {
    incoming: incoming.map((r) => ({
      requestId: r._id,
      from: { userId: r.requester._id, name: r.requester.name, email: r.requester.email },
      createdAt: r.createdAt,
    })),
    outgoing: outgoing.map((r) => ({
      requestId: r._id,
      to: { userId: r.receiver._id, name: r.receiver.name, email: r.receiver.email },
      createdAt: r.createdAt,
    })),
  };
};

module.exports = {
  sendRequest,
  acceptRequest,
  listFriends,
  listRequests,
};

