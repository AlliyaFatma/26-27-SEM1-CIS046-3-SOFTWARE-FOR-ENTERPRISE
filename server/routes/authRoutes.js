const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/signup', registerUser); // Alias so /api/auth/signup also works
router.post('/login', loginUser);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;

