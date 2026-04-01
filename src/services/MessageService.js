const Message = require('../models/Message');
const { parsePagination } = require('../utils/pagination');

async function saveMessage({ roomId, senderId, content }) {
  const msg = await Message.create({ roomId, senderId, content, status: 'sent' });
  return msg;
}

async function getMessages(roomId, query) {
  const { limit, skip, page } = parsePagination(query);
  const [messages, total] = await Promise.all([
    Message.find({ roomId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'username avatar'),
    Message.countDocuments({ roomId }),
  ]);
  return {
    messages: messages.reverse(),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

async function getMissedMessages(roomId, since) {
  return Message.find({ roomId, createdAt: { $gt: new Date(since) } })
    .sort({ createdAt: 1 })
    .populate('senderId', 'username avatar');
}

async function markDelivered(messageId) {
  return Message.findByIdAndUpdate(messageId, { status: 'delivered' }, { new: true });
}

async function markRead(roomId, userId) {
  await Message.updateMany(
    { roomId, status: { $ne: 'read' }, senderId: { $ne: userId } },
    { $set: { status: 'read' }, $addToSet: { readBy: userId } }
  );
}

module.exports = { saveMessage, getMessages, getMissedMessages, markDelivered, markRead };
