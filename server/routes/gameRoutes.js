const express = require('express');
const router = express.Router();
const { 
  getPuzzle, 
  recordGame, 
  getStats, 
  getLeaderboard, 
  resetStats 
} = require('../controllers/gameController');
const { protect } = require('../middleware/authMiddleware');

// Public route to get a new puzzle
router.get('/puzzle', getPuzzle);

// Leaderboard can be viewed by all
router.get('/leaderboard', getLeaderboard);

// Protected routes (require valid JWT login)
router.post('/record', protect, recordGame);
router.get('/stats', protect, getStats);
router.post('/reset', protect, resetStats);

module.exports = router;

