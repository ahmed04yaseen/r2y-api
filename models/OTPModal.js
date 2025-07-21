const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  phoneNo: {
    type: String,
    required: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: '5m' } // Auto-delete after 5 minutes
  },
  verified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const OTP = mongoose.model("otps", otpSchema);

module.exports = OTP;