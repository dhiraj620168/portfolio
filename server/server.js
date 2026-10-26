import helmet from "helmet";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import experienceRoutes from "./routes/experienceRoutes.js";
import skillRoutes from "./routes/skillRoutes.js";
import educationRoutes from "./routes/educationRoutes.js";
import certificationRoutes from "./routes/certificationRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import projectsPageSettingsRoutes from "./routes/projectsPageSettingsRoutes.js";
import certificationFileRoutes from "./routes/certificationFileRoutes.js";
import mediaRoutes from "./routes/mediaRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  }),
);

// Limit incoming JSON request size
app.use(
  express.json({
    limit: "100kb",
    strict: true,
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/experiences", experienceRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/certifications", certificationRoutes);
app.use("/api/certification-files", certificationFileRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/projects-page-settings", projectsPageSettingsRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/settings", settingsRoutes);

// Health check API
app.get("/api/health", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  return res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    message: databaseConnected
      ? "Portfolio API is running"
      : "Portfolio API is running but the database is unavailable",
    database: databaseConnected ? "connected" : "disconnected",
  });
});

// Start server only after MongoDB connects.
async function startServer() {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters long");
    }

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from the .env file");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully");

    console.log("Automatic bulk cleanup is disabled.");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

app.use((err, req, res, next) => {
  console.error("Unhandled request error:", {
    message: err.message,
    path: req.path,
    method: req.method,
  });

  if (res.headersSent) {
    return next(err);
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body is too large",
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

startServer();
