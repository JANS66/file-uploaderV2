import express from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "./db.js";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const app = express();

// Middleware
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true, // MUST be true for cookies to transfer across ports
  }),
);
app.use(express.json()); // Parses incoming JSON request bodies

// Define the Validation and Sanitization Schema
const signupSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(50, "Name is too long"),

  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email address format"),

  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password is too long"),
});

// Login Validation and Sanitization Schema
const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email address format"),

  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});

const createFolderSchema = z.object({
  name: z
    .string({ required_error: "Folder name is required." })
    .trim()
    .min(2, "Folder name must be at least 2 characters long.")
    .max(50, "Folder name cannot exceed 50 characters.")
    .regex(
      /^[^/\\?%*:|"<>]+$/,
      'Folder name cannot contain special characters like / \\ ? * : | " < >',
    )
    .transform((val) => val.replace(/[^a-zA-Z0-9.\-_ ]/g, "_")), // Automatic sanitization
  folderId: z.string().uuid().nullable().optional(),
});

const contentsQuerySchema = z.object({
  folderId: z
    .string()
    .trim()
    .optional()
    .transform((val) =>
      !val || val === "null" || val === "undefined" ? null : val,
    )
    .refine((val) => val === null || z.string().uuid().safeParse(val).success, {
      message: "Invalid folderId format. Must be a valid UUID or null.",
    }),
});

const updateFolderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Folder name cannot be empty.")
    .max(255, "Folder name is too long."),
});

const idParamSchema = z.object({
  id: z.string().uuid("Invalid ID format."),
});

// Middleware to authenticate JWT from httpOnly cookie
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

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

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
});

// Helper function to recursively collect all nested subfolder IDs
async function getAllSubfolderIds(folderId, userId) {
  let ids = [folderId];

  // Find children
  const children = await prisma.folder.findMany({
    where: { folderId, userId },
    select: { id: true },
  });

  // Recursively fetch nested children
  for (const child of children) {
    const nestedIds = await getAllSubfolderIds(child.id, userId);
    ids = ids.concat(nestedIds);
  }

  return ids;
}

app.post("/api/signup", async (req, res) => {
  try {
    // Validate and Sanitize Input Data
    const parseResult = signupSchema.safeParse(req.body);

    // If validation fails, return Zods clear error message back to the UI
    if (!parseResult.success) {
      const firstErrorMessage = parseResult.error.errors[0].message;
      return res.status(400).json({ message: firstErrorMessage });
    }

    // Extract the sanitized values
    const { name, email, password } = parseResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email." });
    }

    // Hash the password (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user to DB
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Generate a JWT Token
    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Set token in secure httpOnly Cookie
    res.cookie("token", token, {
      httpOnly: true, // Prevents JavaScript (XSS) from reading the token
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "lax", // Protects against CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    return res.status(201).json({
      message: "User created successfully!",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    // Validate and Sanitize Input Data
    const parseResult = loginSchema.safeParse(req.body);

    if (!parseResult.success) {
      const firstErrorMessage = parseResult.error.errors[0].message;
      return res.status(400).json({ message: firstErrorMessage });
    }

    const { email, password } = parseResult.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Set httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// GET /api/status - Returns currently logged in user profile
app.get("/api/status", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    console.error("Fetch status error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/logout - Clears authentication cookie
app.post("/api/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return res.json({ message: "Logged out successfully" });
});

// POST /api/files/upload - Accepts up to 5 files at once
app.post(
  "/api/files/upload",
  authenticateToken,
  upload.array("files", 5),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded." });
      }

      const userId = req.user.userId;
      const rawFolderId = req.body.folderId;
      const targetFolderId =
        rawFolderId && rawFolderId !== "null" ? rawFolderId : null;

      // Prepare file records for batch database insert
      const fileData = req.files.map((file) => ({
        originalName: file.originalname,
        storedName: file.filename, // Cloudinary public_id
        mimeType: file.mimetype,
        size: file.size,
        url: file.path, // Cloudinary URL
        userId: userId,
        folderId: targetFolderId,
      }));

      // Create records in DB and return saved instances
      const createdFiles = await prisma.file.createManyAndReturn({
        data: fileData,
      });

      return res.status(201).json({
        message: "Files uploaded and saved to database successfully!",
        files: createdFiles,
      });
    } catch (error) {
      console.error("Upload error:", error);
      return res.status(500).json({ message: "File upload failed." });
    }
  },
);

// POST /api/folders - Creates a new folder
app.post("/api/folders", authenticateToken, async (req, res) => {
  try {
    const parseResult = createFolderSchema.safeParse(req.body);

    if (!parseResult.success) {
      const firstErrorMessage = parseResult.error.errors[0].message;
      return res.status(400).json({ message: firstErrorMessage });
    }

    const { name, folderId } = parseResult.data;
    const userId = req.user.userId;

    // Persist folder in PostgreSQL and store the returned record
    const createdFolder = await prisma.folder.create({
      data: {
        name,
        userId,
        folderId: folderId || null, // Connects to parent folder if provided, else null for root
      },
    });

    return res.status(201).json({
      message: "Folder created successfully",
      folder: createdFolder,
    });
  } catch (error) {
    // Handle Prisma unique constraint violation (duplicate folder name for same user)
    if (error.code === "P2002") {
      return res.status(400).json({
        message: "A folder with this name already exists.",
      });
    }

    console.error("Folder creation error:", error);
    return res.status(500).json({ message: "Failed to create folder." });
  }
});

// GET /api/contents?folderId=...
app.get("/api/contents", authenticateToken, async (req, res) => {
  try {
    // Validate query parameters
    const parseResult = contentsQuerySchema.safeParse(req.query);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors[0].message;
      return res.status(400).json({ message: errorMessage });
    }

    // targetFolderId is guaranteed to be null OR a valid UUID string
    const { folderId: targetFolderId } = parseResult.data;
    const userId = req.user.userId;

    const [folders, files] = await Promise.all([
      // Fetch folders where folderId === targetFolderId
      prisma.folder.findMany({
        where: { userId, folderId: targetFolderId },
        orderBy: { name: "asc" },
      }),
      // Fetch files where folderId === targetFolderId
      prisma.file.findMany({
        where: { userId, folderId: targetFolderId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return res.json({
      folders,
      files,
    });
  } catch (error) {
    console.error("Error fetching contents:", error);
    return res.status(500).json({ message: "Failed to fetch contents." });
  }
});

app.put("/api/folders/:id", authenticateToken, async (req, res) => {
  try {
    // Validate route parameter
    const paramResult = idParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      return res
        .status(400)
        .json({ message: paramResult.error.errors[0].message });
    }

    // Validate and sanitize body payload
    const bodyResult = updateFolderSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res
        .status(400)
        .json({ message: bodyResult.error.errors[0].message });
    }

    const { id } = paramResult.data;
    const { name } = bodyResult.data;
    const userId = req.user.userId;

    // Ensure the folder exists and belongs to the authenticated user
    const existingFolder = await prisma.folder.findFirst({
      where: { id, userId },
    });

    if (!existingFolder) {
      return res.status(404).json({ message: "Folder not found." });
    }

    // Update the folder record
    const updatedFolder = await prisma.folder.update({
      where: { id },
      data: { name },
    });

    return res.status(200).json({
      message: "Folder renamed successfully.",
      folder: updatedFolder,
    });
  } catch (error) {
    if (Error.code === "P2002") {
      return res.status(400).json({
        message: "A folder with this name already exists.",
      });
    }

    console.error("Folder update error:", error);
    return res.status(500).json({ message: "Failed to update folder." });
  }
});

app.delete("/api/files/:id", authenticateToken, async (req, res) => {
  try {
    const paramResult = idParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      return res
        .status(400)
        .json({ message: paramResult.error.errors[0].message });
    }

    const { id } = paramResult.data;
    const userId = req.user.userId;

    const file = await prisma.file.findFirst({
      where: { id, userId },
    });

    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    // Remove record from database
    await prisma.file.delete({
      where: { id },
    });

    // Remove physical file from disk
    if (file.path) {
      try {
        fs.unlinkSync(file.path);
      } catch (fsErr) {
        console.warn(
          `Physical file not found on disk at ${file.path}:`,
          fsErr.message,
        );
      }
    }

    return res.status(200).json({ message: "File deleted successfully." });
  } catch (error) {
    console.error("File deletion error:", error);
    return res.status(500).json({ message: "Failed to delete file." });
  }
});

app.delete("/api/folders/:id", authenticateToken, async (req, res) => {
  try {
    const paramResult = idParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      return res
        .status(400)
        .json({ message: paramResult.error.errors[0].message });
    }

    const { id } = paramResult.data;
    const userId = req.user.userId;

    // Verify target folder exists and belongs to user
    const folder = await prisma.folder.findFirst({
      where: { id, userId },
    });

    if (!folder) {
      return res.status(404).json({ message: "Folder not found." });
    }

    // Get target folder ID + all nested child folder IDs
    const allFolderIds = await getAllSubfolderIds(id, userId);

    // Find all physical file paths stored in any of these folders
    const filesToDelete = await prisma.file.findMany({
      where: {
        userId,
        folderId: { in: allFolderIds },
      },
      select: { path: true },
    });

    // Delete the parent folder from DB
    await prisma.folder.delete({
      where: { id },
    });

    // Clean up physical files from disk asynchronously
    await Promise.allSettled(
      filesToDelete.map(async (file) => {
        if (file.path) {
          try {
            fs.unlinkSync(file.path);
          } catch (err) {
            console.warn(`Could not remove file at ${file.path}:`, err.message);
          }
        }
      }),
    );

    return res
      .status(200)
      .json({ message: "Folder and all contents deleted successfully." });
  } catch (error) {
    console.error("Folder deletion error:", error);
    return res.status(500).json({ message: "Failed to delete folder." });
  }
});

app.get("/api/files/:id/download", authenticateToken, async (req, res) => {
  try {
    const paramResult = idParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      return res
        .status(400)
        .json({ message: paramResult.error.errors[0].message });
    }

    const { id } = paramResult.data;
    const userId = req.user.userId;

    // Fetch file and verify user ownership
    const file = await prisma.file.findFirst({
      where: { id, userId },
    });

    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    // Trigger native file download with original filename
    // res.download(path, filename) sets 'Content-Disposition: attachment; filename="originalName.ext"'
    return res.download(file.path, file.originalName, (err) => {
      if (err && !res.headersSent) {
        console.error("Error sending file:", err);
        return res.status(500).json({ message: "Could not download file." });
      }
    });
  } catch (error) {
    console.error("Download error:", error);
    return res.status(500).json({ message: "Failed to process download." });
  }
});

// Multer Error Handling Middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File size exceeds 10MB limit." });
    }
    return res
      .status(400)
      .json({ message: `Multer upload error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
