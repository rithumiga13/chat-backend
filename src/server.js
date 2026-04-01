require('dotenv').config();
const http      = require('http');
const app       = require('./app');
const connectDB = require('./config/db');
const { getRedis } = require('./config/redis');
const initSocket = require('./socket');

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();
  await getRedis().connect().catch(() => {}); // ioredis auto-connects; this ensures early error logging

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Socket.IO namespace: ws://localhost:${PORT}/chat`);
  });
}

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
