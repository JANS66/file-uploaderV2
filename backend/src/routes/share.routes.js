import { Router } from "express";
import crypto from "crypto";
import path from "path";
import { prisma } from "../db/db.js";
import { cloudinary } from "../config/cloudinary.js";
import { authenticateToken } from "../middleware/auth.js";
import { idParamSchema } from "../schemas/file.schema.js";
import {
  shareFolderSchema,
  shareParamsSchema,
  shareQuerySchema,
  shareFileDownloadParamsSchema,
} from "../schemas/share.schema.js";
import { calculateExpiration } from "../utils/expiration.js";
import { getAllSubfolderIds } from "../utils/subfolder.js";

const router = Router();

router.post("/folders/:id/share", authenticateToken, async (req, res) => {
  try {
    // Validate req.params.id
    const paramResult = idParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      return res
        .status(400)
        .json({ message: paramResult.error.errors[0].message });
    }
    const { id: folderId } = paramResult.data;

    // Validate req.body.expiresIn
    const bodyResult = shareFolderSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res
        .status(400)
        .json({ message: "Invalid expiration duration selected." });
    }
    const { expiresIn } = bodyResult.data;

    // Verify user owns the folder
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId: req.user.id,
      },
    });

    if (!folder) {
      return res
        .status(404)
        .json({ message: "Folder not found or unauthorized access." });
    }

    // Calculate expiration timestamp and generate share token
    const expiresAt = calculateExpiration(expiresIn);
    const shareToken = crypto.randomBytes(32).toString("hex");

    // Store share record in DB
    const shareRecord = await prisma.folderShare.create({
      data: {
        token: shareToken,
        folderId: folder.id,
        expiresAt: expiresAt,
      },
    });

    // Return shareTOken to client
    return res.status(201).json({
      message: "Share link generated successfully",
      shareToken: shareRecord.token,
      expiresAt: shareRecord.expiresAt,
    });
  } catch (error) {
    console.error("Error creating folder share:", error);
    return res.status(500).json({ message: "Failed to generate share link." });
  }
});

router.get("/shares/:token", async (req, res) => {
  try {
    // Sanitize and validate req.params
    const paramsResult = shareParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      return res
        .status(400)
        .json({ message: paramsResult.error.errors[0].message });
    }
    const { token } = paramsResult.data;

    // Sanitize and validate req.query
    const queryResult = shareQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res
        .status(400)
        .json({ message: queryResult.error.errors[0].message });
    }
    const requestedFolderId = queryResult.data.folderId || null;

    // Look up the share record
    const share = await prisma.folderShare.findUnique({
      where: { token },
      include: {
        folder: true,
      },
    });

    if (!share) {
      return res
        .status(404)
        .json({ message: "Share link is invalid or does not exist." });
    }

    // Check expiration
    if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
      return res.status(410).json({ message: "This share link has expired." });
    }

    let activeFolderId = share.folderId;

    // Validate subfolder scope
    if (requestedFolderId && requestedFolderId !== share.folderId) {
      const allowedFolderIds = await getAllSubfolderIds(
        share.folderId,
        share.folder.userId,
      );

      if (!allowedFolderIds.includes(requestedFolderId)) {
        return res
          .status(403)
          .json({ message: "Access denied: Folder is outside shared scope." });
      }

      activeFolderId = requestedFolderId;
    }

    // Fetch contents
    const [folders, files] = await Promise.all([
      prisma.folder.findMany({
        where: { folderId: activeFolderId },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.file.findMany({
        where: { folderId: activeFolderId },
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          size: true,
          createdAt: true,
        },
      }),
    ]);

    return res.status(200).json({
      folderName: share.folder.name,
      folders,
      files,
    });
  } catch (error) {
    console.error("Error feteching shared contents:", error);
    return res.status(500).json({ message: "Failed to load shared contents." });
  }
});

router.get("/shares/:token/files/:fileId/download", async (req, res) => {
  try {
    // Sanitize and validate params
    const paramsResult = shareFileDownloadParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      return res
        .status(400)
        .json({ message: paramsResult.error.errors[0].message });
    }

    const { token, fileId } = paramsResult.data;

    // Find share record and owner
    const share = await prisma.folderShare.findUnique({
      where: { token },
      include: {
        folder: true,
      },
    });

    if (!share) {
      return res
        .status(404)
        .json({ message: "Share link is invalid or does not exist." });
    }

    // Check expiration
    if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
      return res.status(410).json({ message: "This share link has expired." });
    }

    // Find requested file record
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    // Ensure file belongs to the shared folder hierarchy
    const allowedFolderIds = await getAllSubfolderIds(
      share.folderId,
      share.folder.userId,
    );

    if (!file.folderId || !allowedFolderIds.includes(file.folderId)) {
      return res
        .status(403)
        .json({ message: "Access denied: File is outside shared scope." });
    }

    // Extract base filename without extension to avoid double extensions
    const parsedPath = path.parse(file.originalName);
    const fileNameWithoutExt = parsedPath.name;

    // Determine Cloudinary resource_type
    const isImage = file.mimeType && file.mimeType.startsWith("image/");
    const resourceType = isImage ? "image" : "raw";

    // Generate Cloudinary URL with attachment flag
    const downloadUrl = cloudinary.url(file.storedName, {
      resource_type: resourceType,
      flags: `attachment:${fileNameWithoutExt}`,
      secure: true,
    });

    // Redirect directly to Cloudinary CDN
    return res.redirect(downloadUrl);
  } catch (error) {
    console.error("Shared download error:", error);
    return res.status(500).json({ message: "Failed to process download." });
  }
});

export default router;
