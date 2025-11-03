const express = require('express');
const router = express.Router();
const { MessMenu, MessFeedback } = require('../models/Mess');
const Student = require('../models/Student');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Get mess menu
// Access: All authenticated users
router.get('/menu', auth, async (req, res) => {
  try {
    const menu = await MessMenu.find().sort({ day: 1 });
    
    // If no menu exists, create a default one
    if (menu.length === 0) {
      const defaultMenu = [
        { day: 'Monday', breakfast: 'Poha, Tea', lunch: 'Rice, Dal, Sabzi, Salad', dinner: 'Roti, Paneer Masala, Curd' },
        { day: 'Tuesday', breakfast: 'Sandwich, Milk, Fruits', lunch: 'Khichdi, Kadhi, Papad', dinner: 'Paratha, Butter, Pickle, Yogurt' },
        { day: 'Wednesday', breakfast: 'Idli, Sambar, Chutney', lunch: 'Jeera Rice, Rajma, Raita', dinner: 'Chole Bhature, Salad' },
        { day: 'Thursday', breakfast: 'Cornflakes, Milk, Toast', lunch: 'Fried Rice, Manchurian', dinner: 'Dal Tadka, Rice, Papad' },
        { day: 'Friday', breakfast: 'Paratha, Curd, Pickle', lunch: 'Biryani, Raita', dinner: 'Roti, Mix Veg, Dal' },
        { day: 'Saturday', breakfast: 'Dosa, Chutney, Sambar', lunch: 'Pulao, Chana Masala', dinner: 'Pav Bhaji, Buttermilk' },
        { day: 'Sunday', breakfast: 'Pancakes, Honey, Fruits', lunch: 'Thali (Roti, Rice, 3 Sabzis, Dessert)', dinner: 'Sandwich, Soup' }
      ];
      
      await MessMenu.insertMany(defaultMenu);
      return res.json(defaultMenu);
    }
    
    res.json(menu);
  } catch (error) {
    console.error('Error fetching mess menu:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update mess menu
// Access: Admin, Warden
router.put('/menu/:day', auth, roleAuth(['admin', 'warden']), async (req, res) => {
  try {
    const { day } = req.params;
    const { breakfast, lunch, dinner, notes, specialMenu } = req.body;
    
    let menu = await MessMenu.findOne({ day });
    
    if (menu) {
      // Update existing menu
      menu.breakfast = breakfast;
      menu.lunch = lunch;
      menu.dinner = dinner;
      if (notes !== undefined) menu.notes = notes;
      if (specialMenu !== undefined) menu.specialMenu = specialMenu;
    } else {
      // Create new menu
      menu = new MessMenu({
        day,
        breakfast,
        lunch,
        dinner,
        notes,
        specialMenu
      });
    }
    
    await menu.save();
    res.json(menu);
  } catch (error) {
    console.error('Error updating mess menu:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update entire mess menu (all days)
// Access: Admin, Warden
router.put('/menu', auth, roleAuth(['admin', 'warden']), async (req, res) => {
  try {
    const menuItems = req.body;
    
    if (!Array.isArray(menuItems)) {
      return res.status(400).json({ message: 'Menu data should be an array' });
    }
    
    const results = [];
    
    for (const item of menuItems) {
      const { day, breakfast, lunch, dinner, notes, specialMenu } = item;
      
      if (!day || !breakfast || !lunch || !dinner) {
        return res.status(400).json({ message: 'Day, breakfast, lunch, and dinner are required for each menu item' });
      }
      
      let menu = await MessMenu.findOne({ day });
      
      if (menu) {
        menu.breakfast = breakfast;
        menu.lunch = lunch;
        menu.dinner = dinner;
        if (notes !== undefined) menu.notes = notes;
        if (specialMenu !== undefined) menu.specialMenu = specialMenu;
      } else {
        menu = new MessMenu({
          day,
          breakfast,
          lunch,
          dinner,
          notes,
          specialMenu
        });
      }
      
      await menu.save();
      results.push(menu);
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error updating mess menu:', error);
    res.status(500).json({ message: error.message });
  }
});

// Submit mess feedback
// Access: Student
router.post('/feedback', auth, roleAuth('student'), async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    
    if (!feedback) {
      return res.status(400).json({ message: 'Feedback is required' });
    }
    
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    
    const messFeedback = new MessFeedback({
      student: student._id,
      rating,
      feedback
    });
    
    await messFeedback.save();
    res.status(201).json(messFeedback);
  } catch (error) {
    console.error('Error submitting mess feedback:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get mess feedback
// Access: Admin, Warden
router.get('/feedback', auth, roleAuth(['admin', 'warden']), async (req, res) => {
  try {
    const feedback = await MessFeedback.find()
      .populate({
        path: 'student',
        select: 'rollNumber',
        populate: {
          path: 'user',
          select: 'name'
        }
      })
      .sort({ date: -1 });
    
    res.json(feedback);
  } catch (error) {
    console.error('Error fetching mess feedback:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;