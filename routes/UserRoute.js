const express = require("express");
const router = express.Router();
const userController  = require("../controllers/UserController")
// Create a new user
router.get("/registerNewUser", userController.registerNewUser)
router.post("/sendOTP", userController.sendOTP)
router.post("/registerUser", userController.registerUser)
router.post("/loginUser", userController.loginUser)
module.exports = router;
