const Classroom = require('../models/Classroom');
const ClassroomSubmission = require('../models/ClassroomSubmission');

// Helper to generate a friendly unique classroom code
const generateUniqueCode = async () => {
  const prefixes = ['MATH', 'BANANA', 'PUZZLE', 'BRAIN', 'SOLVE'];
  let uniqueCode = '';
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 10) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(1000 + Math.random() * 9000);
    uniqueCode = `${prefix}-${number}`;
    const found = await Classroom.findOne({ code: uniqueCode });
    if (!found) {
      exists = false;
    }
    attempts++;
  }

  return uniqueCode || `MATH-${Date.now().toString().slice(-4)}`;
};

// @desc    Teacher creates a new classroom with a code
// @route   POST /api/classroom/create
// @access  Private (Teacher)
const createClassroom = async (req, res) => {
  try {
    let { title, code, description, puzzlesCount = 10 } = req.body;

    if (!title || !title.trim()) {
      title = '10 Math Puzzle Challenge';
    }

    let finalCode = (code || '').trim().toUpperCase();

    if (!finalCode) {
      finalCode = await generateUniqueCode();
    } else {
      // Sanitize: allow alphanumeric and dashes only
      finalCode = finalCode.replace(/[^A-Z0-9-]/g, '');
      if (finalCode.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Classroom code must be at least 3 characters long (letters, numbers, hyphens).'
        });
      }

      // Check if code already taken
      const existing = await Classroom.findOne({ code: finalCode });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Classroom code "${finalCode}" is already in use. Please pick a different code or leave blank to auto-generate.`
        });
      }
    }

    const classroom = await Classroom.create({
      code: finalCode,
      title: title.trim(),
      description: (description || 'Solve 10 Banana Math Puzzles and climb the classroom leaderboard!').trim(),
      teacher: req.user._id,
      teacherEmail: req.user.email,
      teacherName: req.user.name || req.user.email.split('@')[0],
      puzzlesCount: Number(puzzlesCount) || 10,
      isActive: true
    });

    return res.status(201).json({
      success: true,
      message: `Classroom "${classroom.title}" created with code: ${classroom.code}`,
      classroom
    });
  } catch (error) {
    console.error('Error creating classroom:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating classroom'
    });
  }
};

// @desc    Get all classrooms created by the current teacher
// @route   GET /api/classroom/my-classrooms
// @access  Private (Teacher)
const getTeacherClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find({ teacher: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    // Attach submission stats for each classroom
    const classroomListWithStats = await Promise.all(
      classrooms.map(async (cls) => {
        const submissions = await ClassroomSubmission.find({ classroomCode: cls.code });
        const studentCount = submissions.length;
        const avgScore = studentCount > 0
          ? Math.round(submissions.reduce((acc, curr) => acc + (curr.score || 0), 0) / studentCount)
          : 0;
        const topScore = studentCount > 0
          ? Math.max(...submissions.map(s => s.score || 0))
          : 0;

        return {
          ...cls,
          studentCount,
          avgScore,
          topScore
        };
      })
    );

    return res.status(200).json({
      success: true,
      classrooms: classroomListWithStats
    });
  } catch (error) {
    console.error('Error fetching teacher classrooms:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching classrooms'
    });
  }
};

// @desc    Validate a classroom code before student joins
// @route   GET /api/classroom/validate/:code
// @access  Public
const validateClassroomCode = async (req, res) => {
  try {
    const code = (req.params.code || '').trim().toUpperCase();
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a classroom code'
      });
    }

    const classroom = await Classroom.findOne({ code, isActive: true });
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: `Classroom code "${code}" was not found. Please verify the code with your teacher.`
      });
    }

    return res.status(200).json({
      success: true,
      classroom: {
        code: classroom.code,
        title: classroom.title,
        description: classroom.description,
        teacherName: classroom.teacherName,
        puzzlesCount: classroom.puzzlesCount || 10
      }
    });
  } catch (error) {
    console.error('Error validating classroom code:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error validating classroom code'
    });
  }
};

// @desc    Student submits completed 10-puzzle challenge results
// @route   POST /api/classroom/submit
// @access  Public
const submitChallengeResult = async (req, res) => {
  try {
    const {
      classroomCode,
      studentUsername,
      score = 0,
      correctCount = 0,
      totalPuzzles = 10,
      totalTimeSec = 0,
      puzzles = []
    } = req.body;

    const code = (classroomCode || '').trim().toUpperCase();
    const username = (studentUsername || '').trim();

    if (!code || !username) {
      return res.status(400).json({
        success: false,
        message: 'Classroom code and student username are required.'
      });
    }

    const classroom = await Classroom.findOne({ code, isActive: true });
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: `Classroom "${code}" does not exist or has ended.`
      });
    }

    // Check if student already submitted for this classroom
    let submission = await ClassroomSubmission.findOne({
      classroomCode: code,
      studentUsername: { $regex: new RegExp(`^${username}$`, 'i') }
    });

    if (submission) {
      // Update with best attempt or latest attempt
      const newScore = Number(score) || 0;
      const isBetter = newScore > submission.score || (newScore === submission.score && totalTimeSec < submission.totalTimeSec);
      
      submission.score = isBetter ? newScore : submission.score;
      submission.correctCount = isBetter ? Number(correctCount) || 0 : submission.correctCount;
      submission.totalTimeSec = isBetter ? Number(totalTimeSec) || 0 : submission.totalTimeSec;
      submission.totalPuzzles = Number(totalPuzzles) || 10;
      submission.puzzles = puzzles;
      submission.completed = true;
      submission.completedAt = new Date();
      await submission.save();
    } else {
      submission = await ClassroomSubmission.create({
        classroomCode: code,
        classroomId: classroom._id,
        studentUsername: username,
        score: Number(score) || 0,
        correctCount: Number(correctCount) || 0,
        totalPuzzles: Number(totalPuzzles) || 10,
        totalTimeSec: Number(totalTimeSec) || 0,
        puzzles: puzzles || [],
        completed: true,
        completedAt: new Date()
      });
    }

    // Determine student's current rank in this classroom
    const higherCount = await ClassroomSubmission.countDocuments({
      classroomCode: code,
      $or: [
        { score: { $gt: submission.score } },
        { score: submission.score, totalTimeSec: { $lt: submission.totalTimeSec } }
      ]
    });

    const rank = higherCount + 1;

    return res.status(200).json({
      success: true,
      message: 'Challenge submitted successfully!',
      rank,
      submission: {
        id: submission._id,
        studentUsername: submission.studentUsername,
        classroomCode: submission.classroomCode,
        score: submission.score,
        correctCount: submission.correctCount,
        totalPuzzles: submission.totalPuzzles,
        totalTimeSec: submission.totalTimeSec,
        completedAt: submission.completedAt
      }
    });
  } catch (error) {
    console.error('Error submitting challenge result:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error submitting challenge result'
    });
  }
};

// @desc    Get Classroom Leaderboard for a specific classroom code
// @route   GET /api/classroom/:code/leaderboard
// @access  Public
const getClassroomLeaderboard = async (req, res) => {
  try {
    const code = (req.params.code || '').trim().toUpperCase();
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Classroom code is required'
      });
    }

    const classroom = await Classroom.findOne({ code });
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: `Classroom "${code}" not found.`
      });
    }

    // Rank submissions by score DESC, then totalTimeSec ASC
    const submissions = await ClassroomSubmission.find({ classroomCode: code })
      .sort({ score: -1, correctCount: -1, totalTimeSec: 1 })
      .lean();

    const leaderboard = submissions.map((sub, index) => ({
      rank: index + 1,
      id: sub._id,
      studentUsername: sub.studentUsername,
      score: sub.score || 0,
      correctCount: sub.correctCount || 0,
      totalPuzzles: sub.totalPuzzles || 10,
      accuracy: Math.round(((sub.correctCount || 0) / (sub.totalPuzzles || 10)) * 100),
      totalTimeSec: sub.totalTimeSec || 0,
      completedAt: sub.completedAt || sub.createdAt,
      puzzles: sub.puzzles || []
    }));

    // Calculate class statistics
    const totalStudents = leaderboard.length;
    const avgScore = totalStudents > 0
      ? Math.round(leaderboard.reduce((acc, s) => acc + s.score, 0) / totalStudents)
      : 0;
    const perfectScoresCount = leaderboard.filter(s => s.correctCount === 10).length;

    return res.status(200).json({
      success: true,
      classroom: {
        code: classroom.code,
        title: classroom.title,
        description: classroom.description,
        teacherName: classroom.teacherName,
        teacherEmail: classroom.teacherEmail,
        puzzlesCount: classroom.puzzlesCount,
        isActive: classroom.isActive,
        createdAt: classroom.createdAt
      },
      stats: {
        totalStudents,
        avgScore,
        perfectScoresCount
      },
      leaderboard
    });
  } catch (error) {
    console.error('Error fetching classroom leaderboard:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching classroom leaderboard'
    });
  }
};

// @desc    Teacher deletes a classroom and its submissions
// @route   DELETE /api/classroom/:id
// @access  Private (Teacher)
const deleteClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findOne({
      _id: req.params.id,
      teacher: req.user._id
    });

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found or you are not authorized to delete it.'
      });
    }

    // Delete all submissions for this classroom code
    await ClassroomSubmission.deleteMany({ classroomCode: classroom.code });
    await Classroom.findByIdAndDelete(classroom._id);

    return res.status(200).json({
      success: true,
      message: `Classroom "${classroom.title}" (${classroom.code}) deleted successfully.`
    });
  } catch (error) {
    console.error('Error deleting classroom:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting classroom'
    });
  }
};

module.exports = {
  createClassroom,
  getTeacherClassrooms,
  validateClassroomCode,
  submitChallengeResult,
  getClassroomLeaderboard,
  deleteClassroom
};

