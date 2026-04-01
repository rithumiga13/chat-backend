const router  = require('express').Router();
const User    = require('../models/User');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/tokens');

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: 'username, email, password required' });

    const user = await User.create({ username, email, password });
    const accessToken  = signAccessToken({ id: user._id, username: user.username });
    const refreshToken = signRefreshToken({ id: user._id });
    res.status(201).json({ user: user.toPublic(), accessToken, refreshToken });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Username or email already taken' });
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken  = signAccessToken({ id: user._id, username: user.username });
    const refreshToken = signRefreshToken({ id: user._id });
    res.json({ user: user.toPublic(), accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/refresh
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
  try {
    const payload      = verifyRefreshToken(refreshToken);
    const accessToken  = signAccessToken({ id: payload.id, username: payload.username });
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

module.exports = router;
