# 💬 ChatApp — Real-Time Chat Backend

A production-grade real-time chat application built with Node.js, Socket.IO, MongoDB, and Redis. Fully deployed on Railway.

**Live Demo:** https://chat-backend-production-7c18.up.railway.app

---

## Architecture

```
Client (Browser)
    │
    ▼
[Express REST API]          ← /auth, /rooms, /users
    │
[Socket.IO Server]          ← ws:// namespace /chat
    │
[Event Router]
    ├── join_room
    ├── send_message
    ├── typing_indicator
    └── disconnect
    │
[Redis]                     ← Online presence, pub/sub
    │
[MongoDB]                   ← Message persistence, room metadata, user data
```

---

## Tech Stack

| Layer       | Choice      | Why                                               |
|-------------|-------------|---------------------------------------------------|
| Runtime     | Node.js     | Non-blocking I/O, native fit for WebSocket        |
| Framework   | Express     | REST endpoints for auth + hybrid WS               |
| Real-time   | Socket.IO   | Rooms, namespaces, reconnection built-in          |
| Database    | MongoDB     | Flexible message schema, TTL indexes              |
| Auth        | JWT         | Stateless, access + refresh token pattern         |
| Cache       | Redis       | Presence tracking, rate limiting                  |
| Deployment  | Railway     | Auto-deploy from GitHub, managed DB services      |

---

## Features

- **JWT Auth Handshake over WebSocket** — tokens validated before socket connection is established
- **Room-Based Messaging** — group channels and 1:1 DMs via private socket rooms
- **Message Persistence + Pagination** — MongoDB with compound index on `(roomId, timestamp)`
- **Message Delivery Receipts** — `sent → delivered → read` via Socket.IO acknowledgements
- **Typing Indicators** — debounced events broadcast to room participants
- **Online Presence** — Redis TTL keys with heartbeat refresh every 20s
- **Rate Limiting** — per-user sliding window counter via Redis (10 msg / 10s)
- **Graceful Reconnection** — missed messages replayed since `lastSeenAt` timestamp
- **Instant DM Notifications** — recipient sees new DM in sidebar without page refresh
- **Room Info Panel** — view Room ID, copy it, see all members
- **Add Members** — search by username and add to any group room
- **Browse & Join Rooms** — discover all public rooms and join with one click
- **Auto Token Refresh** — access token silently refreshed every 12 minutes

---

## Folder Structure

```
chat-backend/
├── public/
│   └── index.html           ← Frontend UI (served by Express)
├── src/
│   ├── config/
│   │   ├── db.js            ← MongoDB connection
│   │   └── redis.js         ← Redis client (ioredis)
│   ├── middleware/
│   │   ├── auth.js          ← JWT verify middleware
│   │   └── rateLimiter.js   ← Redis sliding window rate limiter
│   ├── models/
│   │   ├── User.js          ← Mongoose user schema
│   │   ├── Room.js          ← Mongoose room schema (group + DM)
│   │   └── Message.js       ← Mongoose message schema
│   ├── routes/
│   │   ├── auth.js          ← POST /auth/register, /login, /refresh
│   │   ├── rooms.js         ← GET/POST /rooms, /rooms/:id/messages
│   │   └── users.js         ← GET /users/me, /presence, /search
│   ├── services/
│   │   ├── MessageService.js  ← save, paginate, markRead, getMissed
│   │   └── PresenceService.js ← Redis online/offline tracking
│   ├── socket/
│   │   ├── index.js           ← Socket.IO init + namespace setup
│   │   ├── ioInstance.js      ← Shared io reference for routes
│   │   ├── handlers/
│   │   │   ├── joinRoom.js    ← join_room + missed message replay
│   │   │   ├── message.js     ← send_message + delivery receipts
│   │   │   ├── typing.js      ← typing_start / typing_stop
│   │   │   └── disconnect.js  ← presence cleanup on disconnect
│   │   └── middleware/
│   │       └── socketAuth.js  ← JWT validation at handshake layer
│   ├── utils/
│   │   ├── tokens.js          ← sign/verify JWT helpers
│   │   └── pagination.js      ← parse page/limit query params
│   ├── app.js                 ← Express app setup
│   └── server.js              ← HTTP server + startup
├── tests/
│   └── auth.test.js           ← Integration tests (Jest + Supertest)
├── docker-compose.yml         ← Local MongoDB + Redis
├── .env.example               ← Environment variable template
└── package.json
```

---

## API Reference

### Auth
| Method | Endpoint         | Body                          | Description        |
|--------|-----------------|-------------------------------|--------------------|
| POST   | /auth/register  | `{username, email, password}` | Register new user  |
| POST   | /auth/login     | `{email, password}`           | Login, get tokens  |
| POST   | /auth/refresh   | `{refreshToken}`              | Refresh access token |

### Rooms
| Method | Endpoint                   | Description                        |
|--------|----------------------------|------------------------------------|
| POST   | /rooms                     | Create a group room                |
| POST   | /rooms/dm                  | Get or create a DM room            |
| GET    | /rooms                     | List rooms user is a member of     |
| GET    | /rooms/discover            | Browse public rooms to join        |
| GET    | /rooms/:id                 | Room detail with members populated |
| GET    | /rooms/:id/messages        | Paginated message history          |
| POST   | /rooms/:id/join            | Join a public room                 |
| POST   | /rooms/:id/members         | Add a member by userId             |

### Users
| Method | Endpoint           | Description                    |
|--------|--------------------|--------------------------------|
| GET    | /users/me          | Get current user profile       |
| GET    | /users/presence    | Bulk presence check by user IDs |
| GET    | /users/search?q=   | Search users by username       |

### Socket.IO Events (`/chat` namespace)

**Client → Server**
| Event          | Payload                          | Description                  |
|----------------|----------------------------------|------------------------------|
| join_room      | `{roomId, lastSeenAt?}`          | Join room, replay missed msgs |
| send_message   | `{roomId, content}` + ack cb     | Send a message               |
| typing_start   | `{roomId}`                       | Start typing indicator       |
| typing_stop    | `{roomId}`                       | Stop typing indicator        |
| mark_read      | `{roomId}`                       | Mark messages as read        |
| heartbeat      | —                                | Refresh online presence TTL  |

**Server → Client**
| Event               | Payload                          | Description                  |
|---------------------|----------------------------------|------------------------------|
| new_message         | message object                   | Incoming message             |
| message_status      | `{messageId, status}`            | Delivery/read receipt update |
| user_typing         | `{userId, username, roomId}`     | Someone started typing       |
| user_stopped_typing | `{userId, roomId}`               | Someone stopped typing       |
| missed_messages     | `{roomId, messages[]}`           | Replayed messages on reconnect |
| messages_read       | `{userId, roomId}`               | Room messages marked as read |
| new_dm              | `{room, from}`                   | Incoming DM notification     |
| added_to_room       | `{room}`                         | Added to a group room        |

---

## Local Development

### Prerequisites
- Node.js 18+
- Docker Desktop

### Setup

```bash
# Clone the repo
git clone https://github.com/rithumiga13/chat-backend.git
cd chat-backend

# Install dependencies
npm install

# Copy env template
cp .env.example .env

# Start MongoDB + Redis
npm run docker:up

# Start dev server (with hot reload)
npm run dev
```

Open http://localhost:3000

### Environment Variables

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/chatapp
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
RATE_LIMIT_MAX_MESSAGES=10
RATE_LIMIT_WINDOW_SECONDS=10
```

### Run Tests

```bash
npm test
```

---

## Deployment

Deployed on **Railway** with:
- MongoDB service (managed)
- Redis service (managed)
- Auto-deploy on every push to `main`

---

## Resume Bullets

- Enforced JWT authentication at the WebSocket handshake layer, rejecting unauthorized connections before socket establishment
- Designed room-based architecture supporting both group channels and 1:1 DMs via private socket rooms
- Implemented paginated message history via REST API backed by MongoDB with compound index on `(roomId, timestamp)`
- Built message delivery receipts (sent/delivered/read) using Socket.IO acknowledgements and event callbacks
- Added debounced typing indicators broadcast to room participants, preventing event flooding
- Tracked real-time user presence using Redis TTL keys with heartbeat refresh, avoiding stale online states
- Implemented per-user rate limiting on message events using a Redis sliding window counter
- Handled client reconnection by replaying missed messages since last seen timestamp, ensuring no message loss
