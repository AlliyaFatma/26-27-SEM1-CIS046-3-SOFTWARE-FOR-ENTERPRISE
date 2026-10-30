const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createClassroom,
  getTeacherClassrooms,
  validateClassroomCode,
  submitChallengeResult,
  getClassroomLeaderboard,
  deleteClassroom
} = require('../controllers/classroomController');

// Teacher routes (Protected)
router.post('/create', protect, createClassroom);
router.get('/my-classrooms', protect, getTeacherClassrooms);
router.delete('/:id', protect, deleteClassroom);

// Student & Public routes
router.get('/validate/:code', validateClassroomCode);
router.post('/submit', submitChallengeResult);
router.get('/:code/leaderboard', getClassroomLeaderboard);

module.exports = router;
