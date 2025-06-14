const express = require('express');
const router = express.Router();
const { protect } = require('../controllers/authController');
const { getStatus } = require('../controllers/statusController');

// @desc    Get system status and statistics
// @route   GET /api/status
// @access  Private
router.route('/')
  .get( getStatus);

module.exports = router;
