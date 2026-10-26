import express from "express";
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";

import authMiddleware from "../middleware/authMiddleware.js";
import Project from "../models/Project.js";
import Certification from "../models/Certification.js";
import Profile from "../models/Profile.js";

const router = express.Router();

const BUCKETS = {
  projectImages: {
    label: "Project Images",
    urlPrefix: "/api/images/",
  },
  portfolioResumes: {
    label: "Resume PDFs",
    urlPrefix: "/api/resumes/",
  },
  certificationFiles: {
    label: "Certification Files",
    urlPrefix: "/api/certification-files/",
  },
};

function getDb() {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB connection is not ready");
  }

  return db;
}

function getBucket(bucketName) {
  return new GridFSBucket(getDb(), { bucketName });
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getFileType(file) {
  const contentType = (
    file.contentType ||
    file.metadata?.contentType ||
    ""
  ).toLowerCase();

  if (contentType.startsWith("image/")) return "image";
  if (contentType === "application/pdf") return "pdf";

  return "other";
}

// Match URLs that contain the GridFS ID, whether relative or absolute.
function idPattern(id) {
  return new RegExp(escapeRegex(id));
}

// Find what the uploaded file is actually being used for.
async function getMediaUsage(fileId, bucketName) {
  const pattern = idPattern(fileId.toString());
  const usages = [];

  if (bucketName === "projectImages") {
    const [profile, project, certification] = await Promise.all([
      Profile.findOne({ profileImageUrl: pattern }).lean(),
      Project.findOne({ imageUrl: pattern }).lean(),
      Certification.findOne({ imageUrl: pattern }).lean(),
    ]);

    if (profile) usages.push("Profile Image");
    if (project) usages.push("Project Image");
    if (certification) usages.push("Certification Image");
  }

  if (bucketName === "portfolioResumes") {
    const profile = await Profile.findOne({
      resumeUrl: pattern,
    }).lean();

    if (profile) usages.push("Resume");
  }

  if (bucketName === "certificationFiles") {
    const certification = await Certification.findOne({
      certificateFileUrl: pattern,
    }).lean();

    if (certification) usages.push("Certification File");
  }

  return usages.length ? usages : ["Unassigned Media"];
}

function toMediaItem(file, bucketName) {
  const bucket = BUCKETS[bucketName];

  return {
    id: file._id.toString(),
    name: file.metadata?.originalName || file.filename || "Untitled file",
    filename: file.filename,
    bucket: bucketName,
    bucketLabel: bucket.label,
    type: getFileType(file),
    contentType:
      file.contentType ||
      file.metadata?.contentType ||
      "application/octet-stream",
    size: file.length,
    uploadedAt: file.uploadDate,
    uploadDate: file.uploadDate,
    url: `${bucket.urlPrefix}${file._id.toString()}`,
    usage: [],
    category: bucket.label,
  };
}

// GET /api/media
// Optional: ?search=logo&type=image&bucket=projectImages
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { search, type, bucket } = req.query;

    const bucketNames = bucket ? [String(bucket)] : Object.keys(BUCKETS);

    for (const bucketName of bucketNames) {
      if (!BUCKETS[bucketName]) {
        return res.status(400).json({
          success: false,
          message: `Invalid media bucket: ${bucketName}`,
        });
      }
    }

    const allGroups = await Promise.all(
      bucketNames.map(async (bucketName) => {
        const collection = getDb().collection(`${bucketName}.files`);
        const query = {};

        if (search) {
          const pattern = new RegExp(escapeRegex(search), "i");

          query.$or = [
            { filename: pattern },
            { "metadata.originalName": pattern },
          ];
        }

        const files = await collection
          .find(query)
          .sort({ uploadDate: -1 })
          .limit(500)
          .toArray();

        return Promise.all(
          files.map(async (file) => {
            const item = toMediaItem(file, bucketName);

            item.usage = await getMediaUsage(file._id, bucketName);
            item.category = item.usage.join(", ");

            return item;
          }),
        );
      }),
    );

    let media = allGroups.flat();

    if (type && type !== "all") {
      media = media.filter((item) => item.type === type);
    }

    media.sort(
      (a, b) =>
        new Date(b.uploadedAt || 0).getTime() -
        new Date(a.uploadedAt || 0).getTime(),
    );

    return res.json({
      success: true,
      total: media.length,
      media,
    });
  } catch (error) {
    console.error("Media library list error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load media library",
    });
  }
});

// DELETE /api/media/:bucket/:id
router.delete("/:bucket/:id", authMiddleware, async (req, res) => {
  try {
    const { bucket, id } = req.params;

    if (!BUCKETS[bucket]) {
      return res.status(400).json({
        success: false,
        message: "Invalid media bucket",
      });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid media file ID",
      });
    }

    const fileId = new ObjectId(id);
    const filesCollection = getDb().collection(`${bucket}.files`);

    const file = await filesCollection.findOne({ _id: fileId });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "Media file not found",
      });
    }

    const pattern = idPattern(id);
    const references = [];

    if (bucket === "projectImages") {
      references.push(
        Project.exists({ imageUrl: pattern }),
        Profile.exists({ profileImageUrl: pattern }),
        Certification.exists({ imageUrl: pattern }),
      );
    }

    if (bucket === "portfolioResumes") {
      references.push(Profile.exists({ resumeUrl: pattern }));
    }

    if (bucket === "certificationFiles") {
      references.push(Certification.exists({ certificateFileUrl: pattern }));
    }

    const results = await Promise.all(references);

    if (results.some(Boolean)) {
      return res.status(409).json({
        success: false,
        message:
          "This file is currently in use. Remove its reference before deleting it.",
      });
    }

    await getBucket(bucket).delete(fileId);

    return res.json({
      success: true,
      message: "Media file deleted successfully",
      id,
    });
  } catch (error) {
    console.error("Media library delete error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete media file",
    });
  }
});

export default router;
