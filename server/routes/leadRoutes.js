const express = require('express');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const leadController = require('../controllers/leadController');
const { protect, validatePublicApiKey } = require('../middleware/auth');

const router = express.Router();

const submitLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => `ip:${ipKeyGenerator(req, res)}`,
  message: { success: false, error: 'Too many submissions, please wait a few minutes' }
});

// Public (rate-limited + API-key gated)
router.post('/', submitLimiter, validatePublicApiKey, leadController.create);

// Staff
router.get('/', protect, leadController.list);
router.patch('/:id', protect, leadController.update);

module.exports = router;
