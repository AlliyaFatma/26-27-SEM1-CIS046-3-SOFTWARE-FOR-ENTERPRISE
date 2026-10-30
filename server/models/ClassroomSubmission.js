const mongoose = require('mongoose');

const classroomSubmissionSchema = new mongoose.Schema(
  {
    classroomCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },
    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom'
    },
    studentUsername: {
      type: String,
      required: [true, 'Student username is required'],
      trim: true,
      minlength: [2, 'Username must be at least 2 characters'],
      maxlength: [40, 'Username cannot exceed 40 characters']
    },
    score: {
      type: Number,
      default: 0
    },
    correctCount: {
      type: Number,
      default: 0
    },
    totalPuzzles: {
      type: Number,
      default: 10
    },
    totalTimeSec: {
      type: Number,
      default: 0
    },
    completed: {
      type: Boolean,
      default: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    puzzles: [
      {
        puzzleIndex: { type: Number },
        question: { type: String },
        userGuess: { type: Number },
        solution: { type: Number },
        isCorrect: { type: Boolean },
        timeTakenSec: { type: Number, default: 0 }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Compound index to help query rankings quickly
classroomSubmissionSchema.index({ classroomCode: 1, score: -1, correctCount: -1, totalTimeSec: 1 });

module.exports = mongoose.model('ClassroomSubmission', classroomSubmissionSchema);

