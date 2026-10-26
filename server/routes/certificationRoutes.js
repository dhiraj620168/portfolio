import express from "express";
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";
import Certification from "../models/Certification.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const BUCKET_NAME = "certificationFiles";
const FILE_URL_PREFIX = "/api/certification-files/";
const CLEANUP_GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000;

const allowedFields = [
  "title",
  "issuer",
  "issueDate",
  "expiryDate",
  "credentialId",
  "credentialUrl",
  "skills",
  "imageUrl",
  "certificateFileUrl",
  "certificateFileType",
  "description",
  "isVisible",
  "order",
];

function getBucket() {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB database is not connected");
  }

  return new GridFSBucket(db, { bucketName: BUCKET_NAME });
}

function getCertificationFileId(url) {
  if (typeof url !== "string") return null;

  // Accept our own relative URL or an absolute URL pointing to this endpoint.
  const match = url.match(
    /\/api\/certification-files\/([a-f\d]{24})(?:\?.*)?$/i,
  );

  return match ? match[1].toLowerCase() : null;
}

async function isFileReferenced(fileId) {
  const pattern = new RegExp(
    `/api/certification-files/${fileId}(?:\\?.*)?$`,
    "i",
  );

  return Boolean(
    await Certification.exists({
      certificateFileUrl: { $regex: pattern },
    }),
  );
}

// Delete one file only when no certification references it.
// This helper is safe to call after a successful record update/delete.
async function deleteIfUnreferenced(fileId) {
  if (!/^[a-f\d]{24}$/i.test(fileId || "")) return false;

  if (await isFileReferenced(fileId)) {
    return false;
  }

  const bucket = getBucket();

  try {
    await bucket.delete(new mongoose.Types.ObjectId(fileId));
    console.info(`Deleted unreferenced certification file: ${fileId}`);
    return true;
  } catch (error) {
    // Already missing is harmless; other errors should be logged.
    if (error.code !== "ENOENT") {
      console.error(
        `Could not delete certification file ${fileId}:`,
        error.message,
      );
    }
    return false;
  }
}

// Periodically delete old GridFS files that no certification references.
// A 24-hour grace period protects uploads that have not yet been saved.
async function cleanupOrphanCertificationFiles() {
  if (!mongoose.connection.db) return;

  const bucket = getBucket();
  const cutoff = new Date(Date.now() - CLEANUP_GRACE_PERIOD_MS);

  for await (const file of bucket.find({
    uploadDate: { $lt: cutoff },
  })) {
    const fileId = file._id.toString();

    try {
      // Recheck each file immediately before deleting it.
      if (!(await isFileReferenced(fileId))) {
        await bucket.delete(file._id);
        console.info(`Cleaned orphan certification file: ${fileId}`);
      }
    } catch (error) {
      console.error(`Orphan cleanup failed for ${fileId}:`, error.message);
    }
  }
}

// Run periodically; unref lets Node exit normally when no work remains.
const cleanupTimer = setInterval(() => {
  cleanupOrphanCertificationFiles().catch((error) => {
    console.error("Certification orphan cleanup failed:", error.message);
  });
}, CLEANUP_INTERVAL_MS);

cleanupTimer.unref?.();

// GET /api/certifications — Public visible certificates
router.get("/", async (req, res) => {
  try {
    const certifications = await Certification.find({ isVisible: true })
      .sort({ order: 1, issueDate: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: certifications.length,
      data: certifications,
    });
  } catch (error) {
    console.error("Get certifications error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch certifications",
    });
  }
});

// GET /api/certifications/admin — Admin sees all certificates
router.get("/admin", authMiddleware, async (req, res) => {
  try {
    const certifications = await Certification.find()
      .sort({ order: 1, issueDate: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: certifications.length,
      data: certifications,
    });
  } catch (error) {
    console.error("Admin get certifications error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch certifications",
    });
  }
});

// POST /api/certifications — Admin creates a certificate
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      issuer,
      issueDate,
      expiryDate,
      credentialId,
      credentialUrl,
      skills,
      imageUrl,
      certificateFileUrl,
      certificateFileType,
      description,
      isVisible,
      order,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof issuer !== "string" ||
      !issuer.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Certificate title and issuer are required",
      });
    }

    const certification = await Certification.create({
      title: title.trim(),
      issuer: issuer.trim(),
      issueDate,
      expiryDate,
      credentialId,
      credentialUrl,
      skills,
      imageUrl,
      certificateFileUrl,
      certificateFileType,
      description,
      isVisible,
      order,
    });

    return res.status(201).json({
      success: true,
      message: "Certification created successfully",
      data: certification,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create certification error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create certification",
    });
  }
});

// PUT /api/certifications/:id — Admin updates a certificate
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid certification ID",
      });
    }

    const updates = {};

    for (const field of allowedFields) {
      if (Object.hasOwn(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    for (const field of ["title", "issuer"]) {
      if (
        Object.hasOwn(updates, field) &&
        (typeof updates[field] !== "string" || !updates[field].trim())
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} cannot be empty`,
        });
      }

      if (typeof updates[field] === "string") {
        updates[field] = updates[field].trim();
      }
    }

    // Capture the previous URL before changing the record.
    const previous = await Certification.findById(req.params.id).lean();

    if (!previous) {
      return res.status(404).json({
        success: false,
        message: "Certification not found",
      });
    }

    const certification = await Certification.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!certification) {
      return res.status(404).json({
        success: false,
        message: "Certification not found",
      });
    }

    const oldFileId = getCertificationFileId(previous.certificateFileUrl);
    const newFileId = getCertificationFileId(certification.certificateFileUrl);

    // Delete only after the database update succeeds.
    if (oldFileId && oldFileId !== newFileId) {
      await deleteIfUnreferenced(oldFileId);
    }

    return res.status(200).json({
      success: true,
      message: "Certification updated successfully",
      data: certification,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update certification error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update certification",
    });
  }
});

// DELETE /api/certifications/:id — Admin deletes a certificate
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid certification ID",
      });
    }

    const certification = await Certification.findByIdAndDelete(req.params.id);

    if (!certification) {
      return res.status(404).json({
        success: false,
        message: "Certification not found",
      });
    }

    const fileId = getCertificationFileId(certification.certificateFileUrl);

    if (fileId) {
      await deleteIfUnreferenced(fileId);
    }

    return res.status(200).json({
      success: true,
      message: "Certification deleted successfully",
    });
  } catch (error) {
    console.error("Delete certification error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete certification",
    });
  }
});

export default router;
