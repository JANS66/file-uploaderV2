import { z } from "zod";

export const shareFolderSchema = z.object({
  expiresIn: z.enum(["1h", "24h", "7d", "30d", "never"]),
});

export const shareParamsSchema = z.object({
  token: z.string().trim().min(1, "Share token is required."),
});

export const shareQuerySchema = z.object({
  folderId: z.string().uuid("Invalid folder ID format.").optional(),
});

export const shareFileDownloadParamsSchema = z.object({
  token: z.string().trim().min(1, "Share token is required."),
  fileId: z.string().uuid("Invalid file ID format."),
});
