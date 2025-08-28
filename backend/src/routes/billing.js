const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const billingController = require('../controllers/billingController');

// Admin-only billing routes
router.use(authMiddleware, roleMiddleware('admin'));

router.post('/preview', billingController.previewBill);
router.post('/generate', billingController.generateBill);
router.get('/balance/:farmerId', billingController.getBalance);
router.get('/history/:farmerId', billingController.getHistory);
router.post('/mark-paid/:billId', billingController.markPaid);

module.exports = router;


