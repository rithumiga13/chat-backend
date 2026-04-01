const Room    = require('../../models/Room');
const User    = require('../../models/User');
const { getMissedMessages, markRead } = require('../../services/MessageService');

/**
 * join_room — client sends { roomId, lastSeenAt? }
 * Server validates membership, joins socket room, replays missed messages.
 */
async function handleJoinRoom(socket, { roomId, lastSeenAt } = {}) {
  try {
    if (!roomId) return socket.emit('error', { message: 'roomId required' });

    const room = await Room.findOne({ _id: roomId, members: socket.user.id });
    if (!room) return socket.emit('error', { message: 'Room not found or access denied' });

    await socket.join(roomId);

    // mark messages as read
    await markRead(roomId, socket.user.id);

    // update lastSeenAt
    await User.findByIdAndUpdate(socket.user.id, { lastSeenAt: new Date() });

    socket.emit('room_joined', { roomId });

    // replay missed messages on reconnect
    if (lastSeenAt) {
      const missed = await getMissedMessages(roomId, lastSeenAt);
      if (missed.length) {
        socket.emit('missed_messages', { roomId, messages: missed });
      }
    }
  } catch (err) {
    socket.emit('error', { message: err.message });
  }
}

module.exports = handleJoinRoom;
