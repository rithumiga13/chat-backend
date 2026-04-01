const router  = require('express').Router();
const Room    = require('../models/Room');
const { requireAuth } = require('../middleware/auth');
const { getMessages } = require('../services/MessageService');

// all routes require auth
router.use(requireAuth);

// POST /rooms — create a group room
router.post('/', async (req, res) => {
  try {
    const { name, description, members } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const room = await Room.create({
      name,
      description,
      type: 'group',
      createdBy: req.user.id,
      members: [...new Set([req.user.id, ...(members || [])])],
    });
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /rooms/dm — get or create DM room
router.post('/dm', async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'targetUserId required' });
    const room = await Room.findOrCreateDM(req.user.id, targetUserId);
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /rooms — list rooms user is a member of
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.user.id }).sort({ updatedAt: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /rooms/:id/messages — paginated message history
router.get('/:id/messages', async (req, res) => {
  try {
    const room = await Room.findOne({ _id: req.params.id, members: req.user.id });
    if (!room) return res.status(404).json({ error: 'Room not found or access denied' });
    const result = await getMessages(req.params.id, req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
