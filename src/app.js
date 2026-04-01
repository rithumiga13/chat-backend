require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const authRoutes  = require('./routes/auth');
const roomRoutes  = require('./routes/rooms');
const userRoutes  = require('./routes/users');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

app.use('/auth',  authRoutes);
app.use('/rooms', roomRoutes);
app.use('/users', userRoutes);

// 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

module.exports = app;
