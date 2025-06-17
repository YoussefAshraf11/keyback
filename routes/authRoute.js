const express = require('express');
const router = express.Router();
const authController = require("../controllers/authController.js");


// Authentication routes
router.post("/signup", authController.signup);
router.post('/login', authController.login);
router.post('/validateUserAndSendOtp', authController.validateUserAndSendOtp);
router.post('/validate-otp', authController.validateOtp);
router.post('/reset-password-otp', authController.resetPasswordWithOtp);
router.get('/get-logged-in-user', authController.protect, authController.getLoggedInUser);
router.put('/update-logged-in-user', authController.protect, authController.updateLoggedInUser);
module.exports = router;

//
 