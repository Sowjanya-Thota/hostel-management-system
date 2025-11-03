const express = require('express');
const router = express.Router();
const Suggestion = require('../models/Suggestion');
const Student = require('../models/Student');
const Warden = require('../models/Warden');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Get all suggestions
// Access: Admin, Warden
router.get('/', auth, roleAuth(['admin', 'warden']), async (req, res) => {
  try {
    const suggestions = await Suggestion.find()
      .populate('student', 'name')
      .sort({ createdAt: -1 });
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get suggestions by student
// Access: Student (own suggestions)
router.get('/my-suggestions', auth, roleAuth('student'), async (req, res) => {
  try {
    const suggestions = await Suggestion.find({ student: req.user.id })
      .sort({ createdAt: -1 });
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get suggestion by ID
// Access: Admin, Warden, Student (if own suggestion)
router.get('/:id', auth, async (req, res) => {
  try {
    const suggestion = await Suggestion.findById(req.params.id)
      .populate('student', 'name')
      .populate('comments.user', 'name');
    
    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }
    
    // Check if user is admin, warden, or the student who submitted the suggestion
    if (req.user.role !== 'admin' && req.user.role !== 'warden' && 
        suggestion.student._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(suggestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create suggestion
// Access: Student
router.post('/', auth, roleAuth('student'), async (req, res) => {
  try {
    const { title, description, category } = req.body;
    
    const suggestion = new Suggestion({
      title,
      description,
      category,
      student: req.user.id
    });
    
    await suggestion.save();
    res.status(201).json(suggestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete suggestion
// Access: Student (own suggestion only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const suggestion = await Suggestion.findById(req.params.id);
    
    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }
    
    // Check if user is the student who submitted the suggestion
    if (req.user.role === 'student' && suggestion.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this suggestion' });
    }
    
    await Suggestion.findByIdAndDelete(req.params.id);
    res.json({ message: 'Suggestion deleted successfully' });
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update suggestion status
// Access: Admin, Warden
router.put('/:id/status', auth, roleAuth(['admin', 'warden']), async (req, res) => {
  try {
    const { status } = req.body;
    
    const suggestion = await Suggestion.findById(req.params.id);
    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }
    
    suggestion.status = status;
    suggestion.updatedAt = Date.now();
    
    await suggestion.save();
    res.json(suggestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add comment to suggestion
// Access: Admin, Warden, Student (if own suggestion)
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    const suggestion = await Suggestion.findById(req.params.id);
    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }
    
    // Check if user is admin, warden, or the student who submitted the suggestion
    if (req.user.role !== 'admin' && req.user.role !== 'warden' && 
        suggestion.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    suggestion.comments.push({
      text,
      user: req.user.id
    });
    
    suggestion.updatedAt = Date.now();
    await suggestion.save();
    
    const updatedSuggestion = await Suggestion.findById(req.params.id)
      .populate('student', 'name')
      .populate('comments.user', 'name');
    
    res.json(updatedSuggestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin response to suggestion
// Access: Admin, Warden
router.post('/:id/respond', auth, roleAuth(['admin', 'warden']), async (req, res) => {
  try {
    const { response } = req.body;
    
    const suggestion = await Suggestion.findById(req.params.id);
    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }
    
    suggestion.adminResponse = response;
    suggestion.respondedAt = Date.now();
    suggestion.respondedBy = req.user.id;
    
    await suggestion.save();
    res.json(suggestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get suggestions for warden
// Access: Warden
router.get('/warden', auth, roleAuth('warden'), async (req, res) => {
  try {
    // Find warden's hostel block
    const warden = await Warden.findOne({ user: req.user.id });
    if (!warden) {
      return res.status(404).json({ message: 'Warden profile not found' });
    }
    
    // Get suggestions for this hostel block
    const suggestions = await Suggestion.find({ 
      hostelBlock: warden.hostelBlock,
      status: { $in: ['pending', 'in-progress'] }
    })
    .populate('student', 'rollNumber roomNumber')
    .populate({
      path: 'student',
      populate: {
        path: 'user',
        select: 'name'
      }
    })
    .sort({ createdAt: -1 });
    
    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching warden suggestions:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get count of pending suggestions for warden's hostel block
// Access: Warden
router.get('/count', auth, roleAuth('warden'), async (req, res) => {
  try {
    // Get warden details
    const warden = await Warden.findOne({ user: req.user.id });
    if (!warden) {
      return res.status(404).json({ message: 'Warden profile not found' });
    }
    
    // Get students in warden's hostel block
    const students = await Student.find({ hostelBlock: warden.hostelBlock });
    
    // Extract student IDs (not user IDs)
    const studentIds = students.map(student => student._id);
    
    // Count pending suggestions from students in warden's hostel block
    const count = await Suggestion.countDocuments({
      student: { $in: studentIds },
      status: { $in: ['Pending', 'Under Review'] } // Match the status values in your schema
    });
    
    console.log(`Found ${count} pending suggestions for hostel block ${warden.hostelBlock}`);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching suggestions count:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;