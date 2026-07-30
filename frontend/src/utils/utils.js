// Helper to format raw byte sizes into human readable strings
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Helper to sanitize filenames for safe UI display
export const sanitizeFilename = (name) => {
  return name
    .replace(/[^a-zA-Z0-9.\-_]/g, "_") // Replace dangerous chars with "_"
    .substring(0, 80); // Cap max length to 80 chars
};

// Helper to sanitize folder names
export const sanitizeFolderName = (name) => {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9.\-_ ]/g, "_") // Replace dangerous special chars with "_"
    .substring(0, 50); // Cap at 50 chars
};
