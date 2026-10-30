const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Classroom code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, 'Classroom code must be at least 3 characters'],
      maxlength: [20, 'Classroom code cannot exceed 20 characters']
    },
    title: {
      type: String,
      required: [true, 'Classroom title is required'],
      trim: true,
      maxlength: [80, 'Classroom title cannot exceed 80 characters'],
      default: 'Math Puzzle Challenge'
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: 'Solve 10 Banana Math Puzzles and climb the classroom leaderboard!'
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    teacherEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    teacherName: {
      type: String,
      trim: true,
      default: 'Teacher'
    },
    puzzlesCount: {
      type: Number,
      default: 10
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Classroom', classroomSchema);

