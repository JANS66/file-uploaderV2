import { cloudinary } from "../config/cloudinary.js";

// Helper function to delete a single file from Cloudinary
export async function deleteFromCloudinary(storedName, mimeType) {
  if (!storedName) return;

  // Cloudinary treats images as 'image' and PDFs/ZIPs ad 'raw'
  const isImage = mimeType && mimeType.startsWith("image/");
  const resourceType = isImage ? "image" : "raw";

  try {
    const result = await cloudinary.uploader.destroy(storedName, {
      resource_type: resourceType,
    });
    return result;
  } catch (err) {
    console.warn(
      `Failed to delete Cloudinary asset ${storedName}:`,
      err.message,
    );
  }
}
