import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import folderRoutes from "./routes/folder.routes.js";
import fileRoutes from "./routes/file.routes.js";
import shareRoutes from "./routes/share.routes.js";

const app = express();

// Middlewares
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true, // MUST be true for cookies to transfer across ports
  }),
);
app.use(express.json()); // Parses incoming JSON request bodies

// Routes
app.use("/api", authRoutes);
app.use("/api", folderRoutes);
app.use("/api", fileRoutes);
app.use("/api", shareRoutes);

// Multer Error Handling Middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File size exceeds 10MB limit." });
    }
    return res
      .status(400)
      .json({ message: `Multer upload error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

export default app;
