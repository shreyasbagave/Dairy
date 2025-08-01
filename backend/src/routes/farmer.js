const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const milkLogController = require('../controllers/milkLogController');

router.use(authMiddleware, roleMiddleware('farmer'));

// Get milk logs for the authenticated farmer
router.get('/milk-logs', milkLogController.getFarmerMilkLogs);

// Filter farmer's milk logs
router.get('/filter-milk-logs', milkLogController.filterFarmerMilkLogs);

module.exports = router; 