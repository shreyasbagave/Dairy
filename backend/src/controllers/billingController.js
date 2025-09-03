const { v4: uuidv4 } = require('uuid');
const Bill = require('../models/Bill');
const MilkLog = require('../models/MilkLog');
const FeedPurchase = require('../models/FeedPurchase');
const Farmer = require('../models/Farmer');

// Test endpoint to check if billing system is working
exports.testBilling = async (req, res) => {
  try {
    console.log('Billing system test endpoint called');
    res.json({ 
      success: true, 
      message: 'Billing system is working',
      timestamp: new Date().toISOString(),
      models: {
        Bill: !!Bill,
        MilkLog: !!MilkLog,
        FeedPurchase: !!FeedPurchase,
        Farmer: !!Farmer
      }
    });
  } catch (err) {
    console.error('testBilling error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Helper to validate farmer exists
async function validateFarmer(farmerId) {
  try {
    const farmer = await Farmer.findOne({ farmer_id: farmerId });
    if (!farmer) {
      throw new Error(`Farmer with ID ${farmerId} not found`);
    }
    return farmer;
  } catch (error) {
    console.error('Farmer validation error:', error);
    throw error;
  }
}

// Helper to compute milk totals in a period
async function computeMilkTotals(adminId, farmerId, startDate, endDate) {
  const logs = await MilkLog.find({
    admin_id: adminId,
    farmer_id: farmerId,
    date: { $gte: startDate, $lte: endDate },
  });
  
  // Calculate session-wise totals
  const morningLogs = logs.filter(log => log.session === 'Morning');
  const eveningLogs = logs.filter(log => log.session === 'Evening');
  
  const morning_milk_liters = morningLogs.reduce((sum, l) => sum + (l.quantity_liters || 0), 0);
  const morning_milk_amount = morningLogs.reduce((sum, l) => sum + (l.total_cost || 0), 0);
  const evening_milk_liters = eveningLogs.reduce((sum, l) => sum + (l.quantity_liters || 0), 0);
  const evening_milk_amount = eveningLogs.reduce((sum, l) => sum + (l.total_cost || 0), 0);
  
  // Calculate totals
  const milk_total_liters = morning_milk_liters + evening_milk_liters;
  const milk_total_amount = morning_milk_amount + evening_milk_amount;
  
  return { 
    morning_milk_liters, 
    morning_milk_amount, 
    evening_milk_liters, 
    evening_milk_amount,
    milk_total_liters, 
    milk_total_amount 
  };
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

// Helper to get the latest carry-forward balance for a farmer
async function getLatestCarryForwardBalance(farmerId) {
  const latestBill = await Bill.findOne({ farmer_id: farmerId })
    .sort({ createdAt: -1 });
  return latestBill?.new_carry_forward_balance || 0;
}

exports.previewBill = async (req, res) => {
  try {
    const admin_id = req.user.userId;
    const { farmer_id, period_start, period_end } = req.body;
    const start = new Date(period_start);
    const end = new Date(period_end);
    const milk = await computeMilkTotals(admin_id, farmer_id, start, end);
    const feedBalance = await computeFeedBalance(farmer_id);
    const previousCarryForward = await getLatestCarryForwardBalance(farmer_id);
    
    // Calculate net payable including carry-forward
    const net_payable = milk.milk_total_amount + previousCarryForward;
    
    res.json({ 
      success: true, 
      milk: {
        morning: {
          liters: milk.morning_milk_liters,
          amount: milk.morning_milk_amount
        },
        evening: {
          liters: milk.evening_milk_liters,
          amount: milk.evening_milk_amount
        },
        total: {
          liters: milk.milk_total_liters,
          amount: milk.milk_total_amount
        }
      },
      feedBalance,
      previousCarryForward,
      net_payable
    });
  } catch (err) {
    console.error('previewBill error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.generateBill = async (req, res) => {
  try {
    const admin_id = req.user.userId;
    const { farmer_id, period_start, period_end, feed_deduction, actual_paid_amount, status } = req.body;
    const start = new Date(period_start);
    const end = new Date(period_end);

    const milk = await computeMilkTotals(admin_id, farmer_id, start, end);
    const feedBalanceBefore = await computeFeedBalance(farmer_id);
    const deduction = Math.max(0, Math.min(Number(feed_deduction || 0), feedBalanceBefore.remaining));
    const previousCarryForward = await getLatestCarryForwardBalance(farmer_id);

    // Calculate net payable including carry-forward
    const net_payable = milk.milk_total_amount - deduction + previousCarryForward;
    const remaining_after = feedBalanceBefore.remaining - deduction;

    // Calculate adjustment and new carry-forward balance
    const actualPaid = Number(actual_paid_amount || 0);

    // Enforce round-off rule: if bill has decimals, payment must be a whole rupee amount
    const hasPaise = Math.abs(net_payable - Math.round(net_payable)) > 1e-9;
    const isWholeRupee = Math.abs(actualPaid - Math.round(actualPaid)) <= 1e-9;
    if (hasPaise && !isWholeRupee) {
      const floorSuggestion = Math.floor(net_payable);
      const ceilSuggestion = Math.ceil(net_payable);
      return res.status(400).json({
        success: false,
        message: `Round-off required: enter a whole rupee amount (e.g., ₹${floorSuggestion} or ₹${ceilSuggestion}).`,
      });
    }
    const adjustment = actualPaid - net_payable;
    const newCarryForwardBalance = previousCarryForward + adjustment;

    const bill = new Bill({
      bill_id: uuidv4(),
      admin_id,
      farmer_id,
      period_start: start,
      period_end: end,
      
      // Session-wise breakdown
      morning_milk_liters: milk.morning_milk_liters,
      morning_milk_amount: milk.morning_milk_amount,
      evening_milk_liters: milk.evening_milk_liters,
      evening_milk_amount: milk.evening_milk_amount,
      
      // Total milk (calculated from session breakdowns)
      milk_total_liters: milk.milk_total_liters,
      milk_total_amount: milk.milk_total_amount,
      
      feed_deducted_this_cycle: deduction,
      remaining_feed_balance_after: remaining_after,
      net_payable,
      status: 'paid', // Bill is automatically marked as paid since we have the payment amount
      previous_carry_forward: previousCarryForward,
      actual_paid_amount: actualPaid,
      adjustment: adjustment,
      new_carry_forward_balance: newCarryForwardBalance,
    });
    await bill.save();
    res.status(201).json({ 
      success: true, 
      bill,
      adjustment,
      newCarryForwardBalance
    });
  } catch (err) {
    console.error('generateBill error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// New function to update payment amount and calculate adjustments
exports.updatePayment = async (req, res) => {
  try {
    const { billId } = req.params;
    const { actual_paid_amount } = req.body;
    
    const bill = await Bill.findOne({ bill_id: billId });
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    const actualPaid = Number(actual_paid_amount || 0);

    // Enforce round-off rule on update as well
    const hasPaise = Math.abs(bill.net_payable - Math.round(bill.net_payable)) > 1e-9;
    const isWholeRupee = Math.abs(actualPaid - Math.round(actualPaid)) <= 1e-9;
    if (hasPaise && !isWholeRupee) {
      const floorSuggestion = Math.floor(bill.net_payable);
      const ceilSuggestion = Math.ceil(bill.net_payable);
      return res.status(400).json({
        success: false,
        message: `Round-off required: enter a whole rupee amount (e.g., ₹${floorSuggestion} or ₹${ceilSuggestion}).`,
      });
    }
    const adjustment = actualPaid - bill.net_payable;
    const newCarryForwardBalance = bill.previous_carry_forward + adjustment;

    // Update the bill with payment details
    bill.actual_paid_amount = actualPaid;
    bill.adjustment = adjustment;
    bill.new_carry_forward_balance = newCarryForwardBalance;
    bill.status = 'paid';
    
    await bill.save();

    res.json({ 
      success: true, 
      bill,
      adjustment,
      newCarryForwardBalance
    });
  } catch (err) {
    console.error('updatePayment error', err);
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

exports.deleteBill = async (req, res) => {
  try {
    const { billId } = req.params;
    const deleted = await Bill.findOneAndDelete({ bill_id: billId });
    if (!deleted) return res.status(404).json({ success: false, message: 'Bill not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('deleteBill error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


