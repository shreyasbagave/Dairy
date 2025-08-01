const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'farmer'], required: true },
  linked_farmer_id: { type: String }, // Only for farmers
});

module.exports = mongoose.model('User', UserSchema); 