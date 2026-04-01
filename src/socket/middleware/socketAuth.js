const { verifyAccessToken } = require('../../utils/tokens');

/**
 * Validates JWT from socket.handshake.auth.token before connection is established.
 * Unauthorized sockets are rejected immediately.
 */
function socketAuth(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication token missing'));

  try {
    const payload = verifyAccessToken(token);
    socket.user = payload; // { id, username }
    next();
  } catch {
    next(new Error('Authentication token invalid or expired'));
  }
}

module.exports = socketAuth;
