const { saveMessage, markDelivered } = require('../../services/MessageService');
const { checkMessageRate }           = require('../../middleware/rateLimiter');

/**
 * send_message — client sends { roomId, content }
 * Uses Socket.IO acknowledgement callback to confirm delivery.
 */
async function handleMessage(socket, io, { roomId, content } = {}, ack) {
  try {
    if (!roomId || !content) {
      return ack?.({ error: 'roomId and content required' });
    }

    // rate limiting: sliding window via Redis
    const allowed = await checkMessageRate(socket.user.id);
    if (!allowed) {
      return ack?.({ error: 'Rate limit exceeded. Slow down.' });
    }

    const message = await saveMessage({
      roomId,
      senderId: socket.user.id,
      content: content.trim(),
    });

    const payload = {
      id:        message._id,
      roomId,
      senderId:  socket.user.id,
      username:  socket.user.username,
      content:   message.content,
      status:    'sent',
      createdAt: message.createdAt,
    };

    // broadcast to room (including sender for consistency)
    io.to(roomId).emit('new_message', payload);

    // ack to sender: message saved
    ack?.({ ok: true, messageId: message._id });

    // mark as delivered for all sockets in the room except sender
    const sockets = await io.in(roomId).fetchSockets();
    const recipients = sockets.filter((s) => s.user.id !== socket.user.id);
    if (recipients.length > 0) {
      await markDelivered(message._id);
      io.to(roomId).emit('message_status', { messageId: message._id, status: 'delivered' });
    }
  } catch (err) {
    ack?.({ error: err.message });
  }
}

module.exports = handleMessage;
