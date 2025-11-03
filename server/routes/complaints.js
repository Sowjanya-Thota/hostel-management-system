const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const Student = require('../models/Student');
const Warden = require('../models/Warden');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Get all complaints for admin
router.get('/', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { status, category } = req.query;
    
    // Build filter object
    const filter = {};
    if (status && status !== 'All') filter.status = status;
    if (category && category !== 'All') filter.category = category;
    
    // Remove the populate for assignedTo or modify it to match your schema
    const complaints = await Complaint.find(filter)
      .populate('student', 'name email room')
      // .populate('assignedTo', 'name email') // Comment this line out if field doesn't exist
      .sort({ createdAt: -1 });
    
    res.json(complaints);
  } catch (err) {
    console.error('Error fetching complaints:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student's own complaints
router.get('/my-complaints', auth, roleAuth('student'), async (req, res) => {
  try {
    const complaints = await Complaint.find({ student: req.user.id })
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    console.error('Error fetching student complaints:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create a new complaint
router.post('/', auth, roleAuth('student'), async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const complaint = new Complaint({
      title,
      description,
      category,
      student: req.user.id
    });
    await complaint.save();
    res.status(201).json(complaint);
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a complaint
router.delete('/:id', auth, roleAuth('student'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid complaint ID' });
    }
    
    // Find the complaint first
    const complaint = await Complaint.findOne({ 
      _id: req.params.id, 
      student: req.user.id 
    });
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found or not authorized to delete' });
    }
    
    // Check if the complaint can be deleted (pending status only)
    if (complaint.status && complaint.status !== 'Pending') {
      return res.status(400).json({ 
        message: 'Cannot delete a complaint that is already being processed' 
      });
    }
    
    // Use deleteOne instead of remove (which is deprecated)
    await complaint.deleteOne();
    
    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get complaints for warden
// Access: Warden
router.get('/warden', auth, roleAuth('warden'), async (req, res) => {
  try {
    const { status, category, priority } = req.query;
    let query = {};

    // If warden, only show complaints in their hostel block
    const warden = await Warden.findOne({ user: req.user.id });
    if (!warden) {
      return res.status(404).json({ message: 'Warden profile not found' });
    }

    // Find students in this hostel block
    const students = await Student.find({ hostelBlock: warden.hostelBlock });
    const studentIds = students.map(student => student.user._id);

    // Add student filter to query
    query.student = { $in: studentIds };

    // Add other filters
    if (status && status !== 'All') query.status = status;
    if (category && category !== 'All') query.category = category;
    if (priority && priority !== 'All') query.priority = priority;

    const complaints = await Complaint.find(query)
      .populate({
        path: 'student',
        select: 'rollNumber roomNumber',
        populate: {
          path: 'user',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });

    // Format for frontend
    const formattedComplaints = complaints.map(complaint => ({
      _id: complaint._id,
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      status: complaint.status || 'Pending',
      priority: complaint.priority || 'Medium',
      createdAt: complaint.createdAt,
      student: complaint.student ? {
        id: complaint.student._id,
        name: complaint.student.user ? complaint.student.user.name : 'Unknown',
        rollNumber: complaint.student.rollNumber,
        room: complaint.student.roomNumber
      } : null
    }));

    res.json(formattedComplaints);
  } catch (error) {
    console.error('Error fetching warden complaints:', error);
    res.status(500).json({ message: error.message });
  }
});

// Resolve complaint
// Access: Warden, Admin
router.put('/:id/resolve', auth, roleAuth(['warden', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, resolvedBy } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Update complaint
    complaint.status = 'Resolved';
    complaint.resolution = resolution;
    complaint.resolvedBy = resolvedBy || req.user.id;
    complaint.resolvedAt = new Date();

    await complaint.save();

    res.json(complaint);
  } catch (error) {
    console.error('Error resolving complaint:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update complaint status
// Access: Warden, Admin
router.put('/:id/status', auth, roleAuth(['warden', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Update status
    complaint.status = status;
    
    // If status is "In Progress", set assignedTo if not already set
    if (status === 'In Progress' && !complaint.assignedTo) {
      complaint.assignedTo = req.user.id;
    }

    await complaint.save();

    res.json(complaint);
  } catch (error) {
    console.error('Error updating complaint status:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;