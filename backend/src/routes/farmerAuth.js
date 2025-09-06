const express = require('express');
const router = express.Router();
const farmerAuthController = require('../controllers/farmerAuthController');
const authMiddleware = require('../middleware/authMiddleware');

// Farmer signup route (no auth required)
router.post('/signup', farmerAuthController.farmerSignup);

// Farmer login route
router.post('/login', farmerAuthController.farmerLogin);

// Set initial password for first-time login
router.post('/set-initial-password', authMiddleware, farmerAuthController.setInitialPassword);

// Set farmer password (admin function)
router.post('/set-password', authMiddleware, farmerAuthController.setFarmerPassword);

// Change farmer password (farmer function)
router.post('/change-password', authMiddleware, farmerAuthController.changeFarmerPassword);

// Get farmer profile
router.get('/profile', authMiddleware, farmerAuthController.getFarmerProfile);

module.exports = router;
