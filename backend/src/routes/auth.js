const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/signup-admin', authController.signupAdmin);
router.post('/signup-farmer', authController.signupFarmer);
router.post('/login', authController.login);

// Password reset routes
router.post('/request-password-reset', authController.requestPasswordReset);
router.get('/verify-reset-token/:token', authController.verifyResetToken);
router.post('/reset-password', authController.resetPassword);

module.exports = router; 