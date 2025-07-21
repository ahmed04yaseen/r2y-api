const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  mobileNo: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  email: {
    type: String,
    unique: false,
    trim: true,
    sparse: true, // allows multiple docs without email
  },
  password: {
    type: String,
    required: true,
    minlength: 6, // Minimum password length requirement
    select: false // Excludes password from query results by default
  },
  dateOfBirth: {
    type: Date,
    optional: true
  },
  age: {
    type: Number,
    optional: true,
  },
  profileImageURL: {
    type: String,
    optional: true,
    trim: true
  },
  city: {
    type: String,
    optional: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  userType: {
    type: String,
    
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for age calculation from dateOfBirth
userSchema.virtual('calculatedAge').get(function() {
  if (!this.dateOfBirth) return undefined;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Ensure virtuals are included when converting to JSON
userSchema.set('toJSON', { virtuals: true });

const User = mongoose.model("users", userSchema);

module.exports = User;