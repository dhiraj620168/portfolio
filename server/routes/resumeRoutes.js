import express from "express";
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import multer from "multer";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
const BUCKET_NAME = "portfolioResumes";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF resumes are allowed"));
    }
    cb(null, true);
  },
});

function hasPdfSignature(buffer) {
  return Buffer.isBuffer(buffer) && buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-";
}

function getBucket() {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB database is not connected");
  }

  return new GridFSBucket(db, { bucketName: BUCKET_NAME });
}

// Upload resume — Admin only
router.post(
  "/upload",
  authMiddleware,
  (req, res, next) => {
    upload.single("resume")(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please select a PDF resume",
        });
      }

      if (!hasPdfSignature(req.file.buffer)) {
        return res.status(400).json({
          success: false,
          message: "The uploaded file does not appear to be a PDF",
        });
      }

      const bucket = getBucket();
      const stream = bucket.openUploadStream("portfolio-resume.pdf", {
        contentType: "application/pdf",
        metadata: {
          contentType: "application/pdf",
          originalName: req.file.originalname,
        },
      });

      stream.on("error", (error) => {
        console.error("Resume upload error:", error.message);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Failed to upload resume",
          });
        }
      });

      stream.on("finish", () => {
        const resumeId = stream.id.toString();

        res.status(201).json({
          success: true,
          message: "Resume uploaded successfully",
          resumeId,
          resumeUrl: `/api/resumes/${resumeId}`,
        });
      });

      stream.end(req.file.buffer);
    } catch (error) {
      console.error("Resume upload error:", error.message);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Failed to upload resume",
        });
      }
    }
  },
);

// View/download resume — Public
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const mode = req.query.mode === "download" ? "attachment" : "inline";

    if (!/^[a-f\d]{24}$/i.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resume ID",
      });
    }

    const bucket = getBucket();
    const resumeId = new ObjectId(id);
    const files = await bucket.find({ _id: resumeId }).toArray();
    const file = files[0];

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    const contentType = file.metadata?.contentType || file.contentType;

    if (contentType !== "application/pdf") {
      return res.status(415).json({
        success: false,
        message: "Stored file is not a PDF",
      });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `${mode}; filename="resume.pdf"`);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-cache");

    const downloadStream = bucket.openDownloadStream(resumeId);

    downloadStream.on("error", (error) => {
      console.error("Resume download error:", error.message);
      if (!res.headersSent) res.status(500).end();
      else res.destroy(error);
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error("Get resume error:", error.message);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to load resume",
      });
    }
  }
});

export default router;
