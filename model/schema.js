const mongoose= require("mongoose");
const donationSchema = new mongoose.Schema({
    receiptNumber: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true
    },
    address: String,
    amount: {
      type: Number,
      required: true,
      min: 1
    },
    date: {
      type: Date,
      default: Date.now
    },
    transactionId: {
      type: String,
      required: true
    },
    razorpayOrderId: {
      type: String,
      required: true
    },
    razorpayPaymentId: {
      type: String,
      required: true
    },
    panNumber: String,
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  });
  
  // Create Donation model
  const Donation = mongoose.model('Donation', donationSchema);
  
  // Counter schema for receipt numbers
  const counterSchema = new mongoose.Schema({
    _id: String,
    seq: {
      type: Number,
      default: 0
    }
  });
  
  const Counter = mongoose.model('Counter', counterSchema);
  
module.exports = { Donation, Counter };
