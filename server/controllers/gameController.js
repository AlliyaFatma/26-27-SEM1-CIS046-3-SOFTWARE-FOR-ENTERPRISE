const User = require('../models/User');

// @desc    Fetch a fresh puzzle from Marc Conrad's Banana API
// @route   GET /api/game/puzzle
// @access  Public
const getPuzzle = async (req, res) => {
  try {
    const apiUrl = 'https://marcconrad.com/uob/banana/api.php?out=json';
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Banana API responded with status ${response.status}`);
    }

    const data = await response.json();
    
    // Ensure data has question and solution
    if (!data.question || data.solution === undefined) {
      throw new Error('Invalid puzzle payload received from Banana API');
    }

    return res.status(200).json({
      success: true,
      question: data.question,
      solution: Number(data.solution)
    });
  } catch (error) {
    console.error('Error fetching puzzle from Banana API:', error.message);
    return res.status(502).json({
      success: false,
      message: 'Failed to fetch puzzle from Banana Game service. Please check connection.',
      error: error.message
    });
  }
};

// @desc    Record game outcome and update user progress in MongoDB
// @route   POST /api/game/record
// @access  Private (Protected)
const recordGame = async (req, res) => {
  try {
    const { question, userGuess, solution, timeTakenSec = 0 } = req.body;

    if (userGuess === undefined || solution === undefined) {
      return res.status(400).json({
        success: false,
        message: 'userGuess and solution are required'
      });
    }

    const numericGuess = Number(userGuess);
    const numericSolution = Number(solution);
    const isCorrect = numericGuess === numericSolution;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.gamesPlayed = (user.gamesPlayed || 0) + 1;

    let pointsEarned = 0;
    if (isCorrect) {
      user.gamesWon = (user.gamesWon || 0) + 1;
      user.currentStreak = (user.currentStreak || 0) + 1;
      user.bestStreak = Math.max(user.bestStreak || 0, user.currentStreak);

      // 10 base points + streak bonus (+3 for every 3 in a row)
      const streakBonus = Math.floor(user.currentStreak / 3) * 3;
      pointsEarned = 10 + streakBonus;
      user.score = (user.score || 0) + pointsEarned;
    } else {
      user.currentStreak = 0;
      pointsEarned = 0;
    }

    // Append to game history (keep up to 30 recent records)
    if (!user.history) {
      user.history = [];
    }
    user.history.unshift({
      question: question || '',
      userGuess: numericGuess,
      solution: numericSolution,
      isCorrect,
      pointsEarned,
      timeTakenSec: Number(timeTakenSec) || 0,
      playedAt: new Date()
    });

    if (user.history.length > 30) {
      user.history = user.history.slice(0, 30);
    }

    await user.save();

    const winRate = user.gamesPlayed > 0 
      ? Math.round((user.gamesWon / user.gamesPlayed) * 100) 
      : 0;

    return res.status(200).json({
      success: true,
      message: isCorrect ? 'Puzzle solved correctly!' : 'Incorrect guess.',
      isCorrect,
      solution: numericSolution,
      pointsEarned,
      stats: {
        score: user.score,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
        currentStreak: user.currentStreak,
        bestStreak: user.bestStreak,
        winRate
      },
      history: user.history.slice(0, 10)
    });
  } catch (error) {
    console.error('Error recording game result:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error recording game result'
    });
  }
};

// @desc    Get current user's game stats and history
// @route   GET /api/game/stats
// @access  Private (Protected)
const getStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('score gamesPlayed gamesWon currentStreak bestStreak history');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const winRate = user.gamesPlayed > 0 
      ? Math.round((user.gamesWon / user.gamesPlayed) * 100) 
      : 0;

    return res.status(200).json({
      success: true,
      stats: {
        score: user.score || 0,
        gamesPlayed: user.gamesPlayed || 0,
        gamesWon: user.gamesWon || 0,
        currentStreak: user.currentStreak || 0,
        bestStreak: user.bestStreak || 0,
        winRate
      },
      history: (user.history || []).slice(0, 15)
    });
  } catch (error) {
    console.error('Error fetching game stats:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching game stats'
    });
  }
};

// @desc    Get top classroom leaderboard
// @route   GET /api/game/leaderboard
// @access  Public
const getLeaderboard = async (req, res) => {
  try {
    const topUsers = await User.find({})
      .sort({ score: -1, gamesWon: -1 })
      .limit(10)
      .select('name email score gamesPlayed gamesWon currentStreak bestStreak');

    const leaderboard = topUsers.map((u, index) => {
      // Mask email for student privacy: e.g. "ni***@gmail.com"
      const [localPart, domain] = (u.email || '').split('@');
      const maskedEmail = localPart.length > 2 
        ? `${localPart.substring(0, 2)}***@${domain || 'domain.com'}`
        : `${localPart}***`;

      const winRate = u.gamesPlayed > 0 
        ? Math.round((u.gamesWon / u.gamesPlayed) * 100) 
        : 0;

      return {
        rank: index + 1,
        id: u._id,
        name: u.name || maskedEmail,
        maskedEmail,
        score: u.score || 0,
        gamesPlayed: u.gamesPlayed || 0,
        gamesWon: u.gamesWon || 0,
        currentStreak: u.currentStreak || 0,
        bestStreak: u.bestStreak || 0,
        winRate
      };
    });

    return res.status(200).json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching leaderboard'
    });
  }
};

// @desc    Reset user's game stats
// @route   POST /api/game/reset
// @access  Private (Protected)
const resetStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.score = 0;
    user.gamesPlayed = 0;
    user.gamesWon = 0;
    user.currentStreak = 0;
    user.bestStreak = 0;
    user.history = [];

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Game statistics have been reset successfully.',
      stats: {
        score: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        bestStreak: 0,
        winRate: 0
      },
      history: []
    });
  } catch (error) {
    console.error('Error resetting game stats:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error resetting game stats'
    });
  }
};

module.exports = {
  getPuzzle,
  recordGame,
  getStats,
  getLeaderboard,
  resetStats
};

