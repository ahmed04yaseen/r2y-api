const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/UserModal');

const protect = asyncHandler(async (req, res, next) => {
  let token;
console.log(req.headers.authorization)
  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
console.log(decoded)
      // Get user from token and attach to request
      req.user = await User.findById(decoded.userId).select('-password');

      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized - user not found');
      }

      next();
    } catch (error) {
      console.error('Error in protect middleware:', error);
      res.status(401);
      throw new Error('Not authorized - invalid token');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized - no token');
  }
});

module.exports = { protect };