// routes/authRouter.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');  // Make sure this path is correct
const { verifyToken } = require('../middleware/verifyToken');  // Make sure this path is correct

// Route for rendering the login page
router.get('/login', authController.getLogin);  // Ensure this method exists in authController

// Route for handling admin login
router.post('/login', authController.login);

// Route for rendering the change credentials page
router.get('/change-credentials', verifyToken, authController.getChangeCredentials);

// Route for handling the change of username and password
router.post('/change-credentials', verifyToken, authController.changeCredentials);

module.exports = router;
