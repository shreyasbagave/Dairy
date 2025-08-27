const FeedPurchase = require('../models/FeedPurchase');

// Add a new feed purchase
exports.addFeedPurchase = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { date, quantity, price } = req.body;

    if (!date || quantity == null || price == null) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const purchase = await FeedPurchase.create({
      farmer_id: farmerId,
      date: new Date(date),
      quantity: Number(quantity),
      price: Number(price),
    });

    return res.status(201).json({ success: true, purchase });
  } catch (error) {
    console.error('Error adding feed purchase:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get all feed purchases
exports.getAllFeedPurchases = async (_req, res) => {
  try {
    const purchases = await FeedPurchase.find().sort({ date: -1, createdAt: -1 });
    return res.json({ success: true, purchases });
  } catch (error) {
    console.error('Error fetching feed purchases:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get purchases for a specific farmer
exports.getFarmerFeedPurchases = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const purchases = await FeedPurchase.find({ farmer_id: farmerId }).sort({ date: -1, createdAt: -1 });
    return res.json({ success: true, purchases });
  } catch (error) {
    console.error('Error fetching farmer feed purchases:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


