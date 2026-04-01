const { setOffline } = require('../../services/PresenceService');
const User           = require('../../models/User');

async function handleDisconnect(socket) {
  try {
    await setOffline(socket.user.id);
    await User.findByIdAndUpdate(socket.user.id, { lastSeenAt: new Date() });
    console.log(`[socket] disconnected: ${socket.user.username} (${socket.id})`);
  } catch (err) {
    console.error('[disconnect handler]', err.message);
  }
}

module.exports = handleDisconnect;
