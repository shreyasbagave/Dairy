const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { addFeedPurchase, getAllFeedPurchases, getFarmerFeedPurchases, updateFeedPurchase, deleteFeedPurchase } = require('../controllers/feedController');

// Protect all routes
router.use(authenticate);

// Admin-only
router.get('/purchases', roleMiddleware('admin'), getAllFeedPurchases);
router.get('/purchases/farmer/:farmerId', roleMiddleware('admin'), getFarmerFeedPurchases);
router.post('/purchases/:farmerId', roleMiddleware('admin'), addFeedPurchase);
router.put('/purchases/:purchaseId', roleMiddleware('admin'), updateFeedPurchase);
router.delete('/purchases/:purchaseId', roleMiddleware('admin'), deleteFeedPurchase);

module.exports = router;


