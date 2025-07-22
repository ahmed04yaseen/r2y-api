const { uploadToS3 } = require('../utils/s3Service');
const Property = require("../models/PropertyModal")
exports.addProperty = async (req, res) => {
  try {
    const { name, type, address, area, floors } = req.body;
    const userId = req.user._id;
    
    if (!name || !type || !address || !floors) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const existingProperty = await Property.findOne({ name, user: userId });
    if (existingProperty) {
      return res.status(400).json({
        success: false,
        message: 'You already have a property with this name'
      });
    }

    let imageKey;
    if (req.file) {
      try {
        imageKey = await uploadToS3(req.file);
      } catch (uploadError) {
        console.error('S3 Upload Error:', uploadError);
        // Use placeholder if upload fails
        imageKey = 'properties/placeholder-property.jpg';
      }
    } else {
      // Use placeholder when no image is provided
      imageKey = 'properties/placeholder-property.jpg';
    }

    const property = await Property.create({
      name,
      type,
      address,
      area: area || undefined,
      floors: parseInt(floors),
      image: imageKey,
      user: userId
    });

    res.status(201).json({
      success: true,
      data: property,
      message: 'Property created successfully'
    });

  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error occurred while creating property'
    });
  }
};

exports.getProperties = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const properties = await Property.find({ user: userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: properties,
      count: properties.length
    });

  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error occurred while fetching properties'
    });
  }
};