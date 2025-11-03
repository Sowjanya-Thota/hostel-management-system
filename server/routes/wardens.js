const express = require('express');
const router = express.Router();
const Warden = require('../models/Warden');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const bcrypt = require('bcryptjs');

// Get all wardens
// Access: Admin
router.get('/', auth, roleAuth('admin'), async (req, res) => {
  try {
    const wardens = await Warden.find()
      .populate('user', 'name email status')
      .sort({ createdAt: -1 });
    
    // Format response
    const formattedWardens = wardens.map(warden => ({
      id: warden._id,
      userId: warden.user._id,
      name: warden.user.name,
      email: warden.user.email,
      phone: warden.contactNumber,
      hostel: warden.hostelBlock,
      status: warden.user.status
    }));
    
    res.json(formattedWardens);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get warden by ID
// Access: Admin, Warden (own profile)
router.get('/:id', auth, async (req, res) => {
  try {
    const warden = await Warden.findById(req.params.id)
      .populate('user', 'name email status');
    
    if (!warden) {
      return res.status(404).json({ message: 'Warden not found' });
    }
    
    // Check if user is authorized to view this warden
    if (req.user.role === 'warden' && warden.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json({
      id: warden._id,
      userId: warden.user._id,
      name: warden.user.name,
      email: warden.user.email,
      phone: warden.contactNumber,
      hostel: warden.hostelBlock,
      status: warden.user.status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create warden (with user account)
// Access: Admin
router.post('/', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { name, email, password, contactNumber, hostelBlock } = req.body;
    
    // Check if email already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Create user
    user = new User({
      name,
      email,
      password,
      role: 'warden'
    });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    await user.save();
    
    // Create warden profile
    const warden = new Warden({
      user: user._id,
      contactNumber,
      hostelBlock
    });
    
    await warden.save();
    
    res.status(201).json({
      id: warden._id,
      userId: user._id,
      name: user.name,
      email: user.email,
      phone: warden.contactNumber,
      hostel: warden.hostelBlock,
      status: user.status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update warden
// Access: Admin
router.put('/:id', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { name, email, contactNumber, hostelBlock, status } = req.body;
    
    // Find warden
    const warden = await Warden.findById(req.params.id);
    if (!warden) {
      return res.status(404).json({ message: 'Warden not found' });
    }
    
    // Update warden profile
    if (contactNumber) warden.contactNumber = contactNumber;
    if (hostelBlock) warden.hostelBlock = hostelBlock;
    
    await warden.save();
    
    // Update user details
    const user = await User.findById(warden.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (name) user.name = name;
    if (email) user.email = email;
    if (status) user.status = status;
    
    await user.save();
    
    res.json({
      id: warden._id,
      userId: user._id,
      name: user.name,
      email: user.email,
      phone: warden.contactNumber,
      hostel: warden.hostelBlock,
      status: user.status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete warden
// Access: Admin
router.delete('/:id', auth, roleAuth('admin'), async (req, res) => {
  try {
    // Find warden
    const warden = await Warden.findById(req.params.id);
    if (!warden) {
      return res.status(404).json({ message: 'Warden not found' });
    }
    
    // Delete user account
    await User.findByIdAndDelete(warden.user);
    
    // Delete warden profile
    await Warden.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Warden deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;