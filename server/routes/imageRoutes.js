import express from "express";
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import multer from "multer";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, WEBP and GIF images are allowed"));
    }

    cb(null, true);
  },
});

function matchesImageSignature(buffer, mimeType) {
  if (!Buffer.isBuffer(buffer)) return false;
  if (mimeType === "image/jpeg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png") return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/gif") return buffer.length >= 6 && ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"));
  if (mimeType === "image/webp") return buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

function getBucket() {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB database is not connected");
  }

  return new GridFSBucket(db, {
    bucketName: "projectImages",
  });
}

// UPLOAD IMAGE — Admin only
router.post(
  "/upload",
  authMiddleware,
  (req, res, next) => {
    upload.single("image")(req, res, (error) => {
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
          message: "Please select an image",
        });
      }

      if (!matchesImageSignature(req.file.buffer, req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "The uploaded file content does not match a supported image type",
        });
      }

      const bucket = getBucket();

      const uploadStream = bucket.openUploadStream("portfolio-image", {
        contentType: req.file.mimetype,
        metadata: {
          contentType: req.file.mimetype,
          originalName: req.file.originalname,
        },
      });

      uploadStream.on("error", (error) => {
        console.error("GridFS upload error:", error.message);

        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Failed to upload image",
          });
        }
      });

      uploadStream.on("finish", () => {
        const imageId = uploadStream.id.toString();

        return res.status(201).json({
          success: true,
          message: "Image uploaded successfully",
          imageId,
          imageUrl: `/api/images/${imageId}`,
        });
      });

      uploadStream.end(req.file.buffer);
    } catch (error) {
      console.error("Image upload error:", error.message);

      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: "Failed to upload image",
        });
      }
    }
  },
);

// DISPLAY IMAGE — Public
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[a-f\d]{24}$/i.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image ID",
      });
    }

    const bucket = getBucket();
    const imageId = new ObjectId(id);

    const files = await bucket.find({ _id: imageId }).toArray();
    const file = files[0];

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    const contentType =
      file.metadata?.contentType ||
      file.contentType ||
      "application/octet-stream";

    if (!allowedTypes.includes(contentType)) {
      return res.status(415).json({
        success: false,
        message:
          "Stored image has no supported content type. Please upload it again.",
      });
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "public, max-age=86400");

    const downloadStream = bucket.openDownloadStream(imageId);

    downloadStream.on("error", (error) => {
      console.error("Image download error:", error.message);

      if (!res.headersSent) {
        res.status(500).end();
      } else {
        res.destroy(error);
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error("Get image error:", error.message);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to load image",
      });
    }
  }
});

export default router;
