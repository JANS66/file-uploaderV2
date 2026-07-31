import { Router } from "express";
import path from "path";
import { prisma } from "../db/db.js";
import { upload, cloudinary } from "../config/cloudinary.js";
import { authenticateToken } from "../middleware/auth.js";
import { idParamSchema } from "../schemas/file.schema.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";

const router = Router();

// POST /api/files/upload - Accepts up to 5 files at once
router.post(
  "/files/upload",
  authenticateToken,
  upload.array("files", 5),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded." });
      }

      const userId = req.user.id;
      const folderId = req.body.folderId || null;

      // Prepare file records for batch database insert
      const fileData = req.files.map((file) => ({
        originalName: file.originalname,
        storedName: file.filename, // Cloudinary public_id
        mimeType: file.mimetype,
        size: file.size,
        url: file.path, // Cloudinary URL
        userId: userId,
        folderId: folderId,
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

router.delete("/files/:id", authenticateToken, async (req, res) => {
  try {
    const paramResult = idParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      return res.status(400).json({
        message: paramResult.error.issues[0]?.message || "Invalid ID",
      });
    }

    const { id } = paramResult.data;
    const userId = req.user.id;

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

    // Remove file asset from Cloudinary
    await deleteFromCloudinary(file.storedName, file.mimeType);

    return res.status(200).json({ message: "File deleted successfully." });
  } catch (error) {
    console.error("File deletion error:", error);
    return res.status(500).json({ message: "Failed to delete file." });
  }
});

router.get("/files/:id/download", authenticateToken, async (req, res) => {
  try {
    const paramResult = idParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      return res
        .status(400)
        .json({ message: paramResult.error.issues[0].message || "Invalid ID" });
    }

    const { id } = paramResult.data;
    const userId = req.user.id;

    // Fetch file and verify user ownership
    const file = await prisma.file.findFirst({
      where: { id, userId },
    });

    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    // EXtract base filename without extension to avoid "filename.jpg.jpg"
    const parsedPath = path.parse(file.originalName);
    const fileNameWithoutExt = parsedPath.name; // e.g. "my-vacation-photo"

    // Determine resource_type ("image" or "raw")
    const isImage = file.mimeType && file.mimeType.startsWith("image/");
    const resourceType = isImage ? "image" : "raw";

    // Generate Cloudinary URL with custom attachment name
    const downloadUrl = cloudinary.url(file.storedName, {
      resource_type: resourceType,
      flags: `attachment:${fileNameWithoutExt}`, // Forces browser download with custom name
      secure: true,
    });

    // Redirect browser directly to Cloudinary CDN
    return res.redirect(downloadUrl);
  } catch (error) {
    console.error("Download error:", error);
    return res.status(500).json({ message: "Failed to process download." });
  }
});

export default router;
