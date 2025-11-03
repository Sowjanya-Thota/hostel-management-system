const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register a new user
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user with plain password (hashing is handled in the User model)
    user = new User({
      name,
      email,
      password, // Pass the plain password
      role
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found with email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if the role matches
    if (role && user.role !== role) {
      console.log(`Role mismatch: User is ${user.role}, but tried to login as ${role}`);
      // Instead of returning an error, we'll provide a helpful message
      return res.status(400).json({ 
        message: `Invalid credentials for ${role} role`,
        actualRole: user.role,
        suggestedAction: `Try logging in as ${user.role} instead`
      });
    }

    // Compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password does not match for user:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Add a new route to verify the token and get the current user
const auth = require('../middleware/auth'); // Make sure to import the auth middleware

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    // The auth middleware adds the user id to the request
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error in /auth/me endpoint:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;