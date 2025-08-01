const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const farmerController = require('../controllers/farmerController');
const milkLogController = require('../controllers/milkLogController');
const authController = require('../controllers/authController');

router.use(authMiddleware, roleMiddleware('admin'));

router.post('/admin/add-farmer', farmerController.addFarmer);
router.put('/admin/edit-farmer/:id', farmerController.editFarmer);
router.delete('/admin/delete-farmer/:id', farmerController.deleteFarmer);
router.get('/admin/farmers', farmerController.getAllFarmers);
router.post('/admin/add-milk-log', milkLogController.addMilkLog);
router.delete('/admin/delete-milk-log/:log_id', milkLogController.deleteMilkLog);
router.get('/admin/milk-logs', milkLogController.getAllMilkLogs);
router.get('/admin/filter-milk-logs', milkLogController.filterMilkLogs);
router.post('/admin/change-password', authController.changePassword);

module.exports = router; 