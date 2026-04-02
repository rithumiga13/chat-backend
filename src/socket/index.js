const { Server }     = require('socket.io');
const socketAuth     = require('./middleware/socketAuth');
const handleJoinRoom = require('./handlers/joinRoom');
const handleMessage  = require('./handlers/message');
const { handleTypingStart, handleTypingStop } = require('./handlers/typing');
const handleDisconnect = require('./handlers/disconnect');
const { setOnline }  = require('../services/PresenceService');
const { setIO }      = require('./ioInstance');

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    pingInterval: 20000,
    pingTimeout:  10000,
  });

  // expose io globally so routes can emit events
  setIO(io);

  // namespace: /chat
  const chat = io.of('/chat');

  // JWT auth at handshake — unauthorized sockets are rejected before connection
  chat.use(socketAuth);

  chat.on('connection', async (socket) => {
    console.log(`[socket] connected: ${socket.user.username} (${socket.id})`);

    // each user joins a personal room so we can push events to them directly
    socket.join(`user:${socket.user.id}`);

    // mark online in Redis; heartbeat refreshes TTL every 20 s (matching ping interval)
    await setOnline(socket.user.id);

    socket.on('join_room',    (data)       => handleJoinRoom(socket, data));
    socket.on('send_message', (data, ack)  => handleMessage(socket, chat, data, ack));
    socket.on('typing_start', (data)       => handleTypingStart(socket, data));
    socket.on('typing_stop',  (data)       => handleTypingStop(socket, data));
    socket.on('heartbeat',    ()           => setOnline(socket.user.id));
    socket.on('mark_read',    ({ roomId }) => {
      if (roomId) {
        const { markRead } = require('../services/MessageService');
        markRead(roomId, socket.user.id).then(() => {
          socket.to(roomId).emit('messages_read', { userId: socket.user.id, roomId });
        });
      }
    });
    socket.on('disconnect', () => handleDisconnect(socket));
  });

  return io;
}

module.exports = initSocket;
