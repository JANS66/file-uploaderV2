import { prisma } from "../db/db.js";

// Helper function to recursively collect all nested subfolder IDs
export async function getAllSubfolderIds(folderId, userId) {
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
