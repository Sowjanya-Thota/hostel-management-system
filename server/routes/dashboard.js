const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Warden = require('../models/Warden');
const Complaint = require('../models/Complaint');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Suggestion = require('../models/Suggestion'); // Add Suggestion model
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Get admin dashboard stats
// Access: Admin
router.get('/admin/stats', auth, roleAuth('admin'), async (req, res) => {
  try {
    // Get total students count
    const totalStudents = await Student.countDocuments().catch(err => {
      console.error('Error counting students:', err);
      return 0;
    });
    
    // Get total staff (wardens) count
    const totalStaff = await Warden.countDocuments().catch(err => {
      console.error('Error counting wardens:', err);
      return 0;
    });
    
    // Get pending complaints count
    const pendingRequests = await Complaint.countDocuments({ status: 'Pending' }).catch(err => {
      console.error('Error counting pending complaints:', err);
      return 0;
    });
    
    // Get suggestions count
    const suggestionsCount = await Suggestion.countDocuments().catch(err => {
      console.error('Error counting suggestions:', err);
      return 0;
    });
    
    // Get recent activities with error handling
    let recentActivities = [];
    try {
      // Get recent complaints
      const recentComplaints = await Complaint.find()
        .populate('student', 'name')
        .sort({ createdAt: -1 })
        .limit(3);
        
      // Get recent suggestions
      const recentSuggestions = await Suggestion.find()
        .populate('student', 'name')
        .sort({ createdAt: -1 })
        .limit(3);
      
      // Format recent activities
      recentActivities = [
        ...recentComplaints.map(complaint => ({
          id: complaint._id,
          action: `New complaint: ${complaint.title || 'Untitled'}`,
          time: complaint.createdAt,
          user: complaint.student?.name || 'Unknown'
        })),
        ...recentSuggestions.map(suggestion => ({
          id: suggestion._id,
          action: `New suggestion: ${suggestion.title || 'Untitled'}`,
          time: suggestion.createdAt,
          user: suggestion.student?.name || 'Unknown'
        }))
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);
    } catch (err) {
      console.error('Error getting recent activities:', err);
    }
    
    res.json({
      stats: {
        totalStudents,
        totalStaff,
        pendingRequests,
        suggestionsCount
      },
      recentActivities
    });
  } catch (error) {
    console.error('Error in admin dashboard stats:', error);
    res.status(500).json({ 
      message: 'Failed to fetch dashboard data',
      error: error.message 
    });
  }
});

// Get warden dashboard stats
// Access: Warden
router.get('/warden/stats', auth, roleAuth('warden'), async (req, res) => {
  try {
    // Get warden details
    const warden = await Warden.findOne({ user: req.user.id });
    if (!warden) {
      return res.status(404).json({ message: 'Warden profile not found' });
    }
    
    // Get students in warden's hostel block
    const totalStudents = await Student.countDocuments({ hostelBlock: warden.hostelBlock });
    
    // Get pending complaints from warden's hostel block
    const students = await Student.find({ hostelBlock: warden.hostelBlock });
    const studentIds = students.map(student => student.user);
    
    // The issue is here - using submittedBy instead of student
    const pendingComplaints = await Complaint.countDocuments({
      student: { $in: studentIds }, // Changed from submittedBy to student
      status: 'Pending'
    });
    
    // Get recent activities
    const recentComplaints = await Complaint.find({
      student: { $in: studentIds } // Changed from submittedBy to student
    })
      .populate('student', 'name') // Changed from submittedBy to student
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Format recent activities
    const recentActivities = recentComplaints.map(complaint => ({
      id: complaint._id,
      action: `New complaint: ${complaint.title}`,
      time: complaint.createdAt,
      user: complaint.student ? complaint.student.name : 'Unknown' // Changed from submittedBy to student
    }));
    
    res.json({
      stats: {
        totalStudents,
        pendingComplaints,
        hostelBlock: warden.hostelBlock
      },
      recentActivities
    });
  } catch (error) {
    console.error('Error in warden stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get student dashboard stats
// Access: Student
router.get('/student/stats', auth, roleAuth('student'), async (req, res) => {
  try {
    // Get student details
    const student = await Student.findOne({ user: req.user.id }).populate('user', 'name');
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    
    // Get pending complaints
    const pendingComplaints = await Complaint.countDocuments({
      submittedBy: req.user.id,
      status: 'Pending'
    });
    
    // Get pending invoices
    const pendingInvoices = await Invoice.countDocuments({
      student: student._id,
      status: 'Pending'
    });
    
    // Get recent activities
    const recentComplaints = await Complaint.find({
      submittedBy: req.user.id
    })
      .sort({ createdAt: -1 })
      .limit(3);
    
    const recentInvoices = await Invoice.find({
      student: student._id
    })
      .sort({ createdAt: -1 })
      .limit(3);
    
    // Format recent activities
    const recentActivities = [
      ...recentComplaints.map(complaint => ({
        id: complaint._id,
        action: `Complaint status: ${complaint.title} - ${complaint.status}`,
        time: complaint.updatedAt || complaint.createdAt
      })),
      ...recentInvoices.map(invoice => ({
        id: invoice._id,
        action: `Invoice ${invoice.invoiceNumber}: ${invoice.status}`,
        time: invoice.createdAt
      }))
    ].sort((a, b) => b.time - a.time).slice(0, 5);
    
    res.json({
      stats: {
        studentName: student.user.name,
        rollNumber: student.rollNumber,
        roomNumber: student.roomNumber,
        hostelBlock: student.hostelBlock,
        pendingComplaints,
        pendingInvoices
      },
      recentActivities
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;