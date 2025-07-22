const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const multer = require('multer');

// Validate environment variables on startup
const requiredEnvVars = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const storage = multer.memoryStorage();

exports.upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

function generateUploadKey(originalname) {
  const randomString = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  // Sanitize filename and ensure it has an extension
  const sanitizedName = originalname.replace(/[^a-zA-Z0-9.]/g, '-');
  return `properties/${timestamp}-${randomString}-${sanitizedName}`;
}

exports.uploadToS3 = async (file) => {
  try {
    if (!file || !file.buffer) {
      throw new Error('Invalid file object');
    }

    const key = generateUploadKey(file.originalname || 'property-image');
    
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype || 'image/jpeg', // default content type
    };

    console.log('Uploading to S3 with params:', { 
      Bucket: params.Bucket,
      Key: params.Key,
      ContentType: params.ContentType,
      Body: `Buffer (${file.buffer.length} bytes)`
    });

    const command = new PutObjectCommand(params);
    await s3.send(command);
    
    console.log('Successfully uploaded to S3:', key);
    return key;
  } catch (error) {
    console.error('Detailed S3 upload error:', {
      message: error.message,
      stack: error.stack,
      fileInfo: {
        originalname: file?.originalname,
        size: file?.buffer?.length,
        mimetype: file?.mimetype
      }
    });
    throw new Error('Failed to upload image to S3');
  }
};