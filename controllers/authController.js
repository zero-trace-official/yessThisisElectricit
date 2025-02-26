const Auth = require('../models/authModel');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// controllers/authController.js
exports.getLogin = (req, res) => {
  res.render('index');  // Render login page (adjust if needed)
};

exports.login = async (req, res) => {
  const { username, password } = req.body; 

  try {
    const admin = await Auth.findOne({ username });

    if (!admin) {
      return res.status(400).render('index', { errorMessage: 'Admin not found!' });
    }

    if (password !== admin.password) {
      return res.status(400).render('index', { errorMessage: 'Invalid credentials!' });
    }

    const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.redirect('/api/device/dashboard');
  } catch (err) {
    res.status(500).render('index', { errorMessage: 'Server error. Please try again!' });
  }
};

exports.getChangeCredentials = (req, res) => {
  res.render('change', { message: '' });
};
// Handle Admin Change Password or Username (POST request)
exports.changeCredentials = async (req, res) => {
  const { oldPassword, newUsername, newPassword } = req.body;
  const adminId = req.adminId;  // Get adminId from token (middleware)

  try {
    // Find the admin by adminId
    const admin = await Auth.findById(adminId); // Use adminId to query the admin

    if (!admin) {
      return res.status(400).send('Admin not found!');
    }

    // Directly compare plain text passwords
    if (oldPassword !== admin.password) {
      return res.render('change', { message: 'Old password is incorrect' });
    }

    // Update the password if a new password is provided
    if (newPassword) {
      admin.password = newPassword;
    }

    // Update the username if a new username is provided
    if (newUsername) {
      admin.username = newUsername;
    }

    // Save the updated admin record
    await admin.save();

    res.render('change', { message: 'Credentials updated successfully' });
  } catch (err) {
    res.render('change', { message: 'Server error, please try again later' });
  }
};
exports.createAdmin = async () => {
  try {
    const existingAdmin = await Auth.findOne({});
    if (existingAdmin) {
      console.log('Admin already exists with ID:', existingAdmin._id);
      return;
    }

    const admin = new Auth({
      username: 'admin',
      password: 'adminPass', 
    });

    await admin.save();
    console.log('Admin user created with ID:', admin._id);
  } catch (err) {
    console.error('Error creating admin:', err);
  }
};

exports.initializeAdmin = async () => {
  await this.createAdmin();

  try {
    const admins = await Auth.find({}, '_id username');

    if (admins.length > 0) {
      console.log('Existing Admins:', admins.map(admin => `ID: ${admin._id}, Username: ${admin.username}`));
    } else {
      console.log('No admins found in the database.');
    }
  } catch (err) {
    console.error('Error fetching admin IDs:', err);
  }
};
