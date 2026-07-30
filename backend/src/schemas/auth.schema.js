import { z } from "zod";

// Define the Validation and Sanitization Schema
export const signupSchema = z.object({
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

// Login Validation and Sanitization Schema
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email address format"),

  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});
