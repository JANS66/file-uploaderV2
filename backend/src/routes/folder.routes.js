import { Router } from "express";
import { prisma } from "../db/db.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  createFolderSchema,
  updateFolderSchema,
  contentsQuerySchema,
} from "../schemas/folder.schema.js";
import { idParamSchema } from "../schemas/file.schema.js";
import { getAllSubfolderIds } from "../utils/subfolder.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";

const router = Router();

// POST /api/folders - Creates a new folder
router.post("/folders", authenticateToken, async (req, res) => {
  try {
    const parseResult = createFolderSchema.safeParse(req.body);

    if (!parseResult.success) {
      const firstErrorMessage =
        parseResult.error.issues[0]?.message || "Invalid input";
      return res.status(400).json({ message: firstErrorMessage });
    }

    const { name, folderId } = parseResult.data;
    const userId = req.user.id;

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
router.get("/contents", authenticateToken, async (req, res) => {
  try {
    // Validate query parameters
    const parseResult = contentsQuerySchema.safeParse(req.query);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues[0]?.message || "Invalid ID";
      return res.status(400).json({ message: errorMessage });
    }

    // targetFolderId is guaranteed to be null OR a valid UUID string
    const { folderId: targetFolderId } = parseResult.data;
    const userId = req.user.id;

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

router.put("/folders/:id", authenticateToken, async (req, res) => {
  try {
    // Validate route parameter
    const paramResult = idParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      return res
        .status(400)
        .json({ message: paramResult.error.issues[0].message || "Invalid ID" });
    }

    // Validate and sanitize body payload
    const bodyResult = updateFolderSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        message: bodyResult.error.issues[0].message || "Invalid input",
      });
    }

    const { id } = paramResult.data;
    const { name } = bodyResult.data;
    const userId = req.user.id;

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

router.delete("/folders/:id", authenticateToken, async (req, res) => {
  try {
    const paramResult = idParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      return res
        .status(400)
        .json({ message: paramResult.error.issues[0].message || "Invalid ID" });
    }

    const { id } = paramResult.data;
    const userId = req.user.id;

    // Verify target folder exists and belongs to user
    const folder = await prisma.folder.findFirst({
      where: { id, userId },
    });

    if (!folder) {
      return res.status(404).json({ message: "Folder not found." });
    }

    // Get target folder ID + all nested child folder IDs
    const allFolderIds = await getAllSubfolderIds(id, userId);

    // Select storedName (public_id) and mimeType for all nested files
    const filesToDelete = await prisma.file.findMany({
      where: {
        userId,
        folderId: { in: allFolderIds },
      },
      select: { storedName: true, mimeType: true },
    });

    // Delete the parent folder from DB
    // (Prisma onDelete: Cascade automatically deletes nested subfolder and file records)
    await prisma.folder.delete({
      where: { id },
    });

    // Clean up physical assets from Cloudinary in parallel
    await Promise.allSettled(
      filesToDelete.map((file) =>
        deleteFromCloudinary(file.storedName, file.mimeType),
      ),
    );

    return res
      .status(200)
      .json({ message: "Folder and all contents deleted successfully." });
  } catch (error) {
    console.error("Folder deletion error:", error);
    return res.status(500).json({ message: "Failed to delete folder." });
  }
});

export default router;
