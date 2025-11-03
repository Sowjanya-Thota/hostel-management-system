const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rollNumber: {
    type: String,
    required: false, // Changed to false
    unique: true
  },
  course: {
    type: String,
    required: false // Changed to false
  },
  year: {
    type: Number,
    required: false // Changed to false
  },
  hostelBlock: {
    type: String,
    required: false // Changed to false
  },
  roomNumber: {
    type: String,
    required: false // Changed to false
  },
  contactNumber: {
    type: String,
    required: false // Changed to false
  },
  parentName: {
    type: String,
    required: false // Changed to false
  },
  parentContact: {
    type: String,
    required: false // Changed to false
  },
  address: {
    type: String,
    required: false // Changed to false
  },
  dateOfBirth: {
    type: Date,
    required: false // Changed to false
  },
  bloodGroup: {
    type: String
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', StudentSchema);