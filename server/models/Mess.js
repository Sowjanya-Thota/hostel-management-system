const mongoose = require('mongoose');

// Menu schema
const MessMenuSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  breakfast: {
    type: String,
    required: true
  },
  lunch: {
    type: String,
    required: true
  },
  dinner: {
    type: String,
    required: true
  },
  specialMenu: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Feedback schema
const MessFeedbackSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const MessMenu = mongoose.model('MessMenu', MessMenuSchema);
const MessFeedback = mongoose.model('MessFeedback', MessFeedbackSchema);

module.exports = { MessMenu, MessFeedback };