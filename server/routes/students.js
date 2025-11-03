const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const bcrypt = require('bcryptjs');
const Warden = require('../models/Warden');

// Get all students
// Access: Admin, Warden
router.get('/', auth, roleAuth(['admin', 'warden']), async (req, res) => {
  try {
    const { hostelBlock } = req.query;
    let query = {};
    
    // If warden, only show students in their hostel block
    if (req.user.role === 'warden') {
      const warden = await Warden.findOne({ user: req.user.id });
      if (warden) {
        query.hostelBlock = warden.hostelBlock;
      }
    } else if (hostelBlock) {
      // If admin and hostelBlock filter is provided
      query.hostelBlock = hostelBlock;
    }
    
    const students = await Student.find(query)
      .populate('user', 'name email status')
      .sort({ createdAt: -1 });
    
    // Format response
    const formattedStudents = students.map(student => ({
      id: student._id,
      userId: student.user._id,
      name: student.user.name,
      email: student.user.email,
      rollNumber: student.rollNumber,
      room: student.roomNumber,
      hostelBlock: student.hostelBlock,
      phone: student.contactNumber,
      status: student.user.status
    }));
    
    res.json(formattedStudents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add this new endpoint for the students list
// Access: Admin, Warden
router.get('/list', auth, roleAuth(['admin', 'warden']), async (req, res) => {
  try {
    const { hostelBlock } = req.query;
    let query = {};
    
    // If warden, only show students in their hostel block
    if (req.user.role === 'warden') {
      const warden = await Warden.findOne({ user: req.user.id });
      if (warden) {
        query.hostelBlock = warden.hostelBlock;
      }
    } else if (hostelBlock) {
      // If admin and hostelBlock filter is provided
      query.hostelBlock = hostelBlock;
    }
    
    const students = await Student.find(query)
      .populate('user', 'name email status')
      .sort({ createdAt: -1 });
    
    // Format response for the frontend
    const formattedStudents = students.map(student => ({
      id: student._id,
      name: student.user.name,
      email: student.user.email,
      rollNumber: student.rollNumber,
      room: student.roomNumber,
      block: student.hostelBlock, // Note: frontend expects 'block' not 'hostelBlock'
      phone: student.contactNumber,
      status: student.user.status
    }));
    
    res.json(formattedStudents);
  } catch (error) {
    console.error('Error fetching students list:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get student by ID
// Access: Admin, Warden, Student (own profile)
router.get('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'name email status');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if user is authorized to view this student
    if (req.user.role === 'student' && student.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // If warden, check if student is in their hostel block
    if (req.user.role === 'warden') {
      const warden = await Warden.findOne({ user: req.user.id });
      if (warden && student.hostelBlock !== warden.hostelBlock) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }
    
    res.json({
      id: student._id,
      userId: student.user._id,
      name: student.user.name,
      email: student.user.email,
      rollNumber: student.rollNumber,
      room: student.roomNumber,
      hostelBlock: student.hostelBlock,
      phone: student.contactNumber,
      status: student.user.status,
      address: student.address,
      parentName: student.parentName,
      parentContact: student.parentContact
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create student (with user account)
// Access: Admin
router.post('/', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { 
      name, email, password, rollNumber, roomNumber, 
      hostelBlock, contactNumber, address, parentName, parentContact 
    } = req.body;
    
    // Check if email already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Check if roll number already exists
    let existingStudent = await Student.findOne({ rollNumber });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student with this roll number already exists' });
    }
    
    // Create user
    user = new User({
      name,
      email,
      password,
      role: 'student'
    });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    await user.save();
    
    // Create student profile
    const student = new Student({
      user: user._id,
      rollNumber,
      roomNumber,
      hostelBlock,
      contactNumber,
      address,
      parentName,
      parentContact
    });
    
    await student.save();
    
    res.status(201).json({
      id: student._id,
      userId: user._id,
      name: user.name,
      email: user.email,
      rollNumber: student.rollNumber,
      room: student.roomNumber,
      hostelBlock: student.hostelBlock,
      phone: student.contactNumber,
      status: user.status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update student
// Access: Admin
router.put('/:id', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { 
      name, email, rollNumber, roomNumber, hostelBlock, 
      contactNumber, status, address, parentName, parentContact 
    } = req.body;
    
    // Find student
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Update student profile
    if (rollNumber) student.rollNumber = rollNumber;
    if (roomNumber) student.roomNumber = roomNumber;
    if (hostelBlock) student.hostelBlock = hostelBlock;
    if (contactNumber) student.contactNumber = contactNumber;
    if (address) student.address = address;
    if (parentName) student.parentName = parentName;
    if (parentContact) student.parentContact = parentContact;
    
    await student.save();
    
    // Update user details
    const user = await User.findById(student.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (name) user.name = name;
    if (email) user.email = email;
    if (status) user.status = status;
    
    await user.save();
    
    res.json({
      id: student._id,
      userId: user._id,
      name: user.name,
      email: user.email,
      rollNumber: student.rollNumber,
      room: student.roomNumber,
      hostelBlock: student.hostelBlock,
      phone: student.contactNumber,
      status: user.status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete student
// Access: Admin
router.delete('/:id', auth, roleAuth('admin'), async (req, res) => {
  try {
    // Find student
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Delete user account
    await User.findByIdAndDelete(student.user);
    
    // Delete student profile
    await Student.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;