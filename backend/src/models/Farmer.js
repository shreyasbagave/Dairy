const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  // Login credentials for farmer
  password_hash: { type: String, required: false }, // Not required for first-time login
  is_active: { type: Boolean, default: true }, // To enable/disable farmer login
  is_first_login: { type: Boolean, default: true }, // Track if farmer has set password
});

// Compound index to ensure farmer_id is unique per admin
FarmerSchema.index({ farmer_id: 1, admin_id: 1 }, { unique: true });

// Method to set password
FarmerSchema.methods.setPassword = async function(password) {
  this.password_hash = await bcrypt.hash(password, 10);
};

// Method to check password
FarmerSchema.methods.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

module.exports = mongoose.model('Farmer', FarmerSchema); 