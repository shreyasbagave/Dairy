const mongoose = require('mongoose');

const FarmerSchema = new mongoose.Schema({
  farmer_id: { type: String, required: true },
  admin_id: { type: String, required: true }, // Track which admin created this farmer
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  bank_details: {
    account_no: { type: String, required: true },
    ifsc: { type: String, required: true },
  },
});

// Compound index to ensure farmer_id is unique per admin
FarmerSchema.index({ farmer_id: 1, admin_id: 1 }, { unique: true });

module.exports = mongoose.model('Farmer', FarmerSchema); 