import { z } from "zod";

export const createFolderSchema = z.object({
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

export const updateFolderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Folder name cannot be empty.")
    .max(255, "Folder name is too long."),
});

export const contentsQuerySchema = z.object({
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
