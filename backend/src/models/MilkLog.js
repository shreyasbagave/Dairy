const mongoose = require('mongoose');

const MilkLogSchema = new mongoose.Schema({
  log_id: { type: String, required: true, unique: true },
  admin_id: { type: String, required: true }, // Track which admin created this entry
  farmer_id: { type: String, required: true },
  date: { type: Date, required: true },
  session: { type: String, enum: ['Morning', 'Evening'], required: true },
  quantity_liters: { type: Number, required: true },
  fat_percent: { type: Number, required: true },
  rate_per_liter: { type: Number, required: true },
  total_cost: { type: Number, required: true },
});

module.exports = mongoose.model('MilkLog', MilkLogSchema); 