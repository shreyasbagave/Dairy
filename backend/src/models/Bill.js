const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema(
  {
    bill_id: { type: String, required: true, unique: true },
    admin_id: { type: String, required: true },
    farmer_id: { type: String, required: true, index: true },
    period_start: { type: Date, required: true },
    period_end: { type: Date, required: true },
    milk_total_liters: { type: Number, required: true },
    milk_total_amount: { type: Number, required: true },
    feed_deducted_this_cycle: { type: Number, required: true },
    remaining_feed_balance_after: { type: Number, required: true },
    net_payable: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    // New fields for carry-forward balance system
    previous_carry_forward: { type: Number, default: 0 },
    actual_paid_amount: { type: Number, default: 0 },
    adjustment: { type: Number, default: 0 },
    new_carry_forward_balance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bill', BillSchema);


