import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer to upload straight to Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine target resource_type based on MIME type
    // Cloudinary treats PDFs and ZIPs as "raw", and PNG/JPG as "image" or "auto"
    const isImage = file.mimetype.startsWith("image/");

    return {
      folder: "file-uploader-v2", // Cloudinary folder name
      resource_type: isImage ? "image" : "raw",
      public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    };
  },
});

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

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
});

export { cloudinary };
