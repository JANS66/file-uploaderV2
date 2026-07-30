import jwt from "jsonwebtoken";
import { prisma } from "../db/db.js";

// Middleware to authenticate JWT from httpOnly cookie
export const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify the user actually exists in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true },
    });

    if (!user) {
      // Clear invalid cookie if user no longer exists in DB
      res.clearCookie("token");
      return res
        .status(401)
        .json({ message: "User account no longer exists." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT Error:", error.name, "-", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
