import express from "express";
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import multer from "multer";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const BUCKET_NAME = "certificationFiles";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(
        new Error("Only JPG, PNG, WEBP, GIF images and PDF files are allowed"),
      );
    }

    cb(null, true);
  },
});

function getBucket() {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB database is not connected");
  }

  return new GridFSBucket(db, { bucketName: BUCKET_NAME });
}

function detectFileType(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;

  // PDF signature
  if (
    buffer.length >= 5 &&
    buffer.subarray(0, 5).toString("ascii") === "%PDF-"
  ) {
    return "application/pdf";
  }

  // JPEG signature
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  // PNG signature
  if (
    buffer.length >= 8 &&
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "image/png";
  }

  // GIF signature
  if (
    buffer.length >= 6 &&
    ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"))
  ) {
    return "image/gif";
  }

  // WEBP signature: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

// Upload certificate image or PDF — Admin only
router.post(
  "/upload",
  authMiddleware,
  (req, res, next) => {
    upload.single("file")(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          success: false,
          message:
            error instanceof multer.MulterError &&
            error.code === "LIMIT_FILE_SIZE"
              ? "File size must not exceed 5 MB"
              : error.message,
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
          message: "Please select an image or PDF file",
        });
      }

      const detectedType = detectFileType(req.file.buffer);

      // Verify actual file content, not just its extension or MIME type.
      if (!detectedType || detectedType !== req.file.mimetype) {
        return res.status(400).json({
          success: false,
          message: "The file content does not match its declared file type",
        });
      }

      const fileType = detectedType.startsWith("image/") ? "image" : "pdf";
      const extension =
        detectedType === "application/pdf" ? "pdf" : detectedType.split("/")[1];

      const bucket = getBucket();

      const stream = bucket.openUploadStream(
        `certification-${new Date().toISOString()}.${extension}`,
        {
          contentType: detectedType,
          metadata: {
            contentType: detectedType,
            fileType,
          },
        },
      );

      stream.on("error", (error) => {
        console.error("Certification upload error:", error.message);

        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Failed to upload certification file",
          });
        }
      });

      stream.on("finish", () => {
        const fileId = stream.id.toString();

        res.status(201).json({
          success: true,
          message: "Certification file uploaded successfully",
          certificateFileUrl: `/api/certification-files/${fileId}`,
          certificateFileType: fileType,
        });
      });

      stream.end(req.file.buffer);
    } catch (error) {
      console.error("Certification upload error:", error.message);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Failed to upload certification file",
        });
      }
    }
  },
);

// View certificate image or PDF — Public
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[a-f\d]{24}$/i.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid certification file ID",
      });
    }

    const bucket = getBucket();
    const fileId = new ObjectId(id);
    const files = await bucket.find({ _id: fileId }).toArray();
    const file = files[0];

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "Certification file not found",
      });
    }

    const contentType = file.metadata?.contentType || file.contentType;

    if (!ALLOWED_TYPES.includes(contentType)) {
      return res.status(415).json({
        success: false,
        message: "Unsupported certification file type",
      });
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("X-Content-Type-Options", "nosniff");
    // res.setHeader("Content-Disposition", "inline");
    const mode = req.query.mode === "download" ? "attachment" : "inline";

    const extension =
      contentType === "application/pdf" ? "pdf" : contentType.split("/")[1];

    res.setHeader(
      "Content-Disposition",
      `${mode}; filename="certificate.${extension}"`,
    );
    res.setHeader("Cache-Control", "public, max-age=86400");

    const downloadStream = bucket.openDownloadStream(fileId);

    downloadStream.on("error", (error) => {
      console.error("Certification file read error:", error.message);

      if (!res.headersSent) {
        res.status(500).end();
      } else {
        res.destroy(error);
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error("Get certification file error:", error.message);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to load certification file",
      });
    }
  }
});

export default router;
