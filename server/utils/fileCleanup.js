import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import Profile from "../models/Profile.js";
import Project from "../models/Project.js";

const IMAGE_BUCKET = "projectImages";
const RESUME_BUCKET = "portfolioResumes";

function extractFileId(url, type) {
  if (typeof url !== "string") return null;

  const route = type === "image" ? "api/images" : "api/resumes";

  const pattern = new RegExp(`/${route}/([a-f\\d]{24})(?:[/?#]|$)`, "i");

  const match = url.match(pattern);

  return match ? match[1].toLowerCase() : null;
}

function getBucket(bucketName) {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB is not connected");
  }

  return new GridFSBucket(db, { bucketName });
}

async function deleteIfUnreferenced(url, type) {
  const fileId = extractFileId(url, type);

  // Only delete files managed by our GridFS endpoints.
  if (!fileId) {
    return {
      deleted: false,
      reason: "Not a GridFS URL",
    };
  }

  try {
    // If reference checks fail, execution stops before deletion.
    const profiles = await Profile.find()
      .select("profileImageUrl resumeUrl")
      .lean();

    let referenced = false;

    if (type === "image") {
      const projects = await Project.find().select("imageUrl").lean();

      referenced =
        profiles.some(
          (profile) =>
            extractFileId(profile.profileImageUrl, "image") === fileId,
        ) ||
        projects.some(
          (project) => extractFileId(project.imageUrl, "image") === fileId,
        );
    } else {
      referenced = profiles.some(
        (profile) => extractFileId(profile.resumeUrl, "resume") === fileId,
      );
    }

    if (referenced) {
      console.log(`Cleanup skipped: ${type} is still referenced: ${fileId}`);

      return {
        deleted: false,
        reason: "File is still referenced",
      };
    }

    const bucket = getBucket(type === "image" ? IMAGE_BUCKET : RESUME_BUCKET);

    // Confirm that the file exists before attempting deletion.
    const objectId = new ObjectId(fileId);
    const fileExists = await bucket.find({ _id: objectId }).hasNext();

    if (!fileExists) {
      return {
        deleted: false,
        reason: "File already missing",
      };
    }

    await bucket.delete(objectId);

    console.log(`Unused ${type} deleted: ${fileId}`);

    return {
      deleted: true,
    };
  } catch (error) {
    // Fail safely: a cleanup error must never trigger a broader deletion.
    console.error(`Cleanup skipped for ${type} ${fileId}:`, error.message);

    return {
      deleted: false,
      reason: error.message,
    };
  }
}

export async function cleanupUnusedImage(url) {
  return deleteIfUnreferenced(url, "image");
}

export async function cleanupUnusedResume(url) {
  return deleteIfUnreferenced(url, "resume");
}

// Remove only unreferenced files that have been sitting for 24+ hours.
export async function cleanupOrphanedFiles() {
  if (mongoose.connection.readyState !== 1) return;

  const olderThan = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (const [type, bucketName] of [
    ["image", IMAGE_BUCKET],
    ["resume", RESUME_BUCKET],
  ]) {
    try {
      const bucket = getBucket(bucketName);
      const files = await bucket
        .find({ uploadDate: { $lt: olderThan } })
        .toArray();

      for (const file of files) {
        const url = `/api/${type === "image" ? "images" : "resumes"}/${file._id}`;

        await deleteIfUnreferenced(url, type);
      }
    } catch (error) {
      console.error(`Orphan ${type} cleanup failed:`, error.message);
    }
  }
}
