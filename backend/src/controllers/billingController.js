const { v4: uuidv4 } = require('uuid');
const Bill = require('../models/Bill');
const MilkLog = require('../models/MilkLog');
const FeedPurchase = require('../models/FeedPurchase');

// Helper to compute milk totals in a period
async function computeMilkTotals(adminId, farmerId, startDate, endDate) {
  const logs = await MilkLog.find({
    admin_id: adminId,
    farmer_id: farmerId,
    date: { $gte: startDate, $lte: endDate },
  });
  const milk_total_liters = logs.reduce((sum, l) => sum + (l.quantity_liters || 0), 0);
  const milk_total_amount = logs.reduce((sum, l) => sum + (l.total_cost || 0), 0);
  return { milk_total_liters, milk_total_amount };
}

// Helper to compute current feed balance (purchases - deductions)
async function computeFeedBalance(farmerId) {
  const purchases = await FeedPurchase.find({ farmer_id: farmerId });
  const totalPurchased = purchases.reduce((sum, p) => sum + (p.price || 0), 0);
  const bills = await Bill.find({ farmer_id: farmerId });
  const totalDeducted = bills.reduce((sum, b) => sum + (b.feed_deducted_this_cycle || 0), 0);
  const remaining = totalPurchased - totalDeducted;
  return { totalPurchased, totalDeducted, remaining: Math.max(remaining, 0) };
}

exports.previewBill = async (req, res) => {
  try {
    const admin_id = req.user.userId;
    const { farmer_id, period_start, period_end } = req.body;
    const start = new Date(period_start);
    const end = new Date(period_end);
    const milk = await computeMilkTotals(admin_id, farmer_id, start, end);
    const feedBalance = await computeFeedBalance(farmer_id);
    res.json({ success: true, milk, feedBalance });
  } catch (err) {
    console.error('previewBill error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.generateBill = async (req, res) => {
  try {
    const admin_id = req.user.userId;
    const { farmer_id, period_start, period_end, feed_deduction, status } = req.body;
    const start = new Date(period_start);
    const end = new Date(period_end);

    const milk = await computeMilkTotals(admin_id, farmer_id, start, end);
    const feedBalanceBefore = await computeFeedBalance(farmer_id);
    const deduction = Math.max(0, Math.min(Number(feed_deduction || 0), feedBalanceBefore.remaining));

    const net_payable = milk.milk_total_amount - deduction;
    const remaining_after = feedBalanceBefore.remaining - deduction;

    const bill = new Bill({
      bill_id: uuidv4(),
      admin_id,
      farmer_id,
      period_start: start,
      period_end: end,
      milk_total_liters: milk.milk_total_liters,
      milk_total_amount: milk.milk_total_amount,
      feed_deducted_this_cycle: deduction,
      remaining_feed_balance_after: remaining_after,
      net_payable,
      status: status === 'paid' ? 'paid' : 'pending',
    });
    await bill.save();
    res.status(201).json({ success: true, bill });
  } catch (err) {
    console.error('generateBill error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getBalance = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const balance = await computeFeedBalance(farmerId);
    res.json({ success: true, balance });
  } catch (err) {
    console.error('getBalance error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const bills = await Bill.find({ farmer_id: farmerId }).sort({ createdAt: -1 });
    res.json({ success: true, bills });
  } catch (err) {
    console.error('getHistory error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.markPaid = async (req, res) => {
  try {
    const { billId } = req.params;
    const updated = await Bill.findOneAndUpdate(
      { bill_id: billId },
      { $set: { status: 'paid' } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Bill not found' });
    res.json({ success: true, bill: updated });
  } catch (err) {
    console.error('markPaid error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


