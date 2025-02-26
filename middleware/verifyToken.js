// middleware/verifyToken.js
const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const token = req.cookies.authToken;

  if (!token) {
    console.log('No token provided.');
    return res.status(401).send('Access Denied. No Token Provided.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = decoded.adminId;
    console.log('Admin ID from token:', req.adminId);
    next();
  } catch (err) {
    console.log('Invalid Token:', err.message);
    return res.status(400).send('Invalid Token.');
  }
};
