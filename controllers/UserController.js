// const generateOTP = require("../utils/generateOTP"); // You'll need an OTP generator utility
const User = require("../models/UserModal");
const OTP = require("../models/OTPModal");
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const SALT_WORK_FACTOR = 10; // Encryption strength

exports.registerNewUser = async (req, res, next) => {
  res.send({ test: true });
};

// Signup controller
// controllers/authController.js
// const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
const generateOTP = "1234";
exports.sendOTP = async (req, res, next) => {
  console.log(req.body)
  try {
    const { mobileNo } = req.body;

    if (!mobileNo) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required"
      });
    }

    // Format mobile number (add country code)
    const formattedMobileNo = `+91${mobileNo.replace(/\D/g, "")}`;

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Create or update OTP record
    await OTP.findOneAndUpdate(
      { phoneNo: formattedMobileNo },
      { 
        otp,
        expiresAt: otpExpiry,
        verified: false 
      },
      { upsert: true, new: true }
    );

    // In production, send OTP via SMS service
    console.log(`OTP for ${formattedMobileNo}: ${otp}`); // For development only

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: {
        mobileNo: formattedMobileNo,
        // Only send OTP in development for testing
        otp: process.env.NODE_ENV === "development" ? otp : undefined
      }
    });

  } catch (error) {
    console.error("OTP generation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};


exports.registerUser = async (req, res) => {
  try {
    const { mobileNo, otp, name, password, email, dateOfBirth, city, userType } = req.body;

    // Validate required fields
    if (!mobileNo || !otp || !name || !password) {
      return res.status(400).json({
        success: false,
        message: "Mobile number, OTP, name and password are required"
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    const formattedMobileNo = `+91${mobileNo.replace(/\D/g, "")}`;

    // Verify OTP
    const otpRecord = await OTP.findOne({
      phoneNo: formattedMobileNo,
      otp,
      // expiresAt: { $gt: new Date() },
      verified: false
    });

    if (!otpRecord) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ mobileNo: formattedMobileNo });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already registered"
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      name,
      mobileNo: formattedMobileNo,
      password: hashedPassword,
      email: email || undefined,
      dateOfBirth: dateOfBirth || undefined,
      city: city || undefined,
      userType: userType
    });

    if (dateOfBirth) {
      newUser.age = newUser.calculatedAge;
    }

    // Mark OTP as verified and save user
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      otpRecord.verified = true;
      await otpRecord.save({ session });
      await newUser.save({ session });
      await session.commitTransaction();
      session.endSession();

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: newUser._id,
          mobileNo: newUser.mobileNo
        },
        process.env.JWT_SECRET,
        { expiresIn: '60d' } // 2 months expiry (60 days)
      );

      // Remove sensitive data before sending response
      const userResponse = {
        userId: newUser._id,
        name: newUser.name,
        mobileNo: newUser.mobileNo,
        email: newUser.email,
        token, // Include the JWT token in response
        tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
      };

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: userResponse
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { mobileNo, password } = req.body;

    // Validate required fields
    if (!mobileNo || !password) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and password are required"
      });
    }

    const formattedMobileNo = `+91${mobileNo.replace(/\D/g, "")}`;

    // Find user by mobile number
    const user = await User.findOne({ mobileNo: formattedMobileNo }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Check if JWT_SECRET is available
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      throw new Error('Server configuration error');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        mobileNo: user.mobileNo,
        userType: user.userType
      },
      process.env.JWT_SECRET,
      { expiresIn: '60d' }
    );

    // Remove password from user object
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        ...userWithoutPassword,
        token,
        tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    
    // More specific error messages
    let errorMessage = "Login failed";
    if (error.message.includes('JWT_SECRET')) {
      errorMessage = "Server configuration error";
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};