import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db/db.js";
import { authenticateToken } from "../middleware/auth.js";
import { signupSchema, loginSchema } from "../schemas/auth.schema.js";

const router = Router();

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

router.post("/signup", async (req, res) => {
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
    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Set token in secure httpOnly Cookie
    res.cookie("token", token, cookieOptions);

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

router.post("/login", async (req, res) => {
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
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Set httpOnly cookie
    res.cookie("token", token, cookieOptions);

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
router.get("/status", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
  return res.json({ message: "Logged out successfully" });
});

export default router;
