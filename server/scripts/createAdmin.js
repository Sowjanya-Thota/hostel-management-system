const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config({ path: __dirname + '/../.env' });


async function createAdmin() {
  try {
    // Connect to MongoDB using the MONGO_URI from .env
    const mongoURI = process.env.MONGO_URI;
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'monika_pallaprolu@srmap.edu.in', role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      await mongoose.disconnect();
      return;
    }

    // Create admin user - no need to hash password as the model will do it
    const admin = new User({
      name: 'Monika Pallaprolu',
      email: 'monika_pallaprolu@srmap.edu.in',
      password: 'monika', // Will be hashed by the pre-save hook in the User model
      role: 'admin',
      status: 'Active'
      // createdAt and timestamps will be handled by the schema
    });

    await admin.save();
    console.log('Admin user created successfully');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdmin();