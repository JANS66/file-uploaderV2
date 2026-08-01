import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use Multer Memory Storage (Holds file in RAM temporarily as Buffer)
const storage = multer.memoryStorage();

// Security and Validation Filters
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, PDF, and ZIP files are allowed.",
      ),
      false,
    );
  }
};

// standard Multer middleware
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Helper function: Stream memory buffer straight to Cloudinary
export const uploadToCloudinary = (fileBuffer, mimetype) => {
  return new Promise((resolve, reject) => {
    const isImage = mimetype.startsWith("image/");

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "file-uploader-v2",
        resource_type: isImage ? "image" : "raw",
        public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    // Write buffer to stream and end
    uploadStream.end(fileBuffer);
  });
};

export { cloudinary };
