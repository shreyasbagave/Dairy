const mongoose = require('mongoose');

const FeedPurchaseSchema = new mongoose.Schema(
  {
    farmer_id: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FeedPurchase', FeedPurchaseSchema);


