const typingTimers = new Map(); // userId:roomId => timeout

/**
 * typing_start — broadcast to room (excluding sender)
 * Auto-stops after 3 s of no update (server-side safety net).
 */
function handleTypingStart(socket, { roomId } = {}) {
  if (!roomId) return;
  socket.to(roomId).emit('user_typing', { userId: socket.user.id, username: socket.user.username, roomId });

  const key = `${socket.user.id}:${roomId}`;
  clearTimeout(typingTimers.get(key));
  typingTimers.set(
    key,
    setTimeout(() => {
      socket.to(roomId).emit('user_stopped_typing', { userId: socket.user.id, roomId });
      typingTimers.delete(key);
    }, 3000)
  );
}

/**
 * typing_stop — explicit stop broadcast
 */
function handleTypingStop(socket, { roomId } = {}) {
  if (!roomId) return;
  const key = `${socket.user.id}:${roomId}`;
  clearTimeout(typingTimers.get(key));
  typingTimers.delete(key);
  socket.to(roomId).emit('user_stopped_typing', { userId: socket.user.id, roomId });
}

module.exports = { handleTypingStart, handleTypingStop };
