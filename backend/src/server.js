import express from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "./db.js";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";

const app = express();

// Middleware
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true, // MUST be true for cookies to transfer across ports
  }),
);
app.use(express.json()); // Parses incoming JSON request bodies

// Define the Validation and Sanitization Schema
const signupSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(50, "Name is too long"),

  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email address format"),

  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password is too long"),
});

app.post("/api/signup", async (req, res) => {
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
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // Set token in secure httpOnly Cookie
    res.cookie("token", token, {
      httpOnly: true, // Prevents JavaScript (XSS) from reading the token
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "lax", // Protects against CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
