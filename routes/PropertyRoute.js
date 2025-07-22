const express = require("express");
const router = express.Router();
const propertyController  = require("../controllers/PropertyController");
const { protect } = require("../middlewares/AuthMiddleware");
const { upload } = require("../utils/s3Service");
// Create a new user
router.post("/addProperty",protect, upload.single('image'), propertyController.addProperty)
router.get("/getProperties",protect, propertyController.getProperties)
module.exports = router;
