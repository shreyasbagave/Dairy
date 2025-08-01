const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const farmerController = require('../controllers/farmerController');
const milkLogController = require('../controllers/milkLogController');
const authController = require('../controllers/authController');

router.use(authMiddleware, roleMiddleware('admin'));

router.post('/add-farmer', farmerController.addFarmer);
router.put('/edit-farmer/:id', farmerController.editFarmer);
router.delete('/delete-farmer/:id', farmerController.deleteFarmer);
router.get('/farmers', farmerController.getAllFarmers);
router.post('/add-milk-log', milkLogController.addMilkLog);
router.delete('/delete-milk-log/:log_id', milkLogController.deleteMilkLog);
router.get('/milk-logs', milkLogController.getAllMilkLogs);
router.get('/filter-milk-logs', milkLogController.filterMilkLogs);
router.post('/change-password', authController.changePassword);

module.exports = router; 
