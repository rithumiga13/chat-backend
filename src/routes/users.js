const router  = require('express').Router();
const User    = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { bulkPresence } = require('../services/PresenceService');

router.use(requireAuth);

// GET /users/me
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toPublic());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/presence?ids=id1,id2,...
router.get('/presence', async (req, res) => {
  try {
    const ids = (req.query.ids || '').split(',').filter(Boolean);
    if (!ids.length) return res.status(400).json({ error: 'ids query param required' });
    const presence = await bulkPresence(ids);
    res.json(presence);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/search?q=...
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: 'q query param required' });
    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      _id: { $ne: req.user.id },
    }).select('username email avatar').limit(20);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
