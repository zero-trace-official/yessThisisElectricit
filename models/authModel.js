const mongoose = require('mongoose');

// Define the schema for Auth (Admin User)
const authSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true,
    unique: true, // Ensure username uniqueness
    trim: true,
  },
  password: { 
    type: String, 
    required: true 
  },
}, { timestamps: true });  // Automatically handle createdAt and updatedAt

const Auth = mongoose.models.Auth || mongoose.model('Auth', authSchema);

module.exports = Auth;
