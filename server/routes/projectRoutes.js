import express from "express";
import mongoose from "mongoose";
import Project from "../models/Project.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { cleanupUnusedImage } from "../utils/fileCleanup.js";

const router = express.Router();

function isOptionalString(value) {
  return value === undefined || typeof value === "string";
}

function validationMessage(error) {
  if (error?.name === "ValidationError" || error?.name === "CastError") {
    return error.message;
  }

  return null;
}

async function runCleanupSafely(cleanupFn, url) {
  if (!url) return;

  try {
    const result = await cleanupFn(url);

    if (!result.deleted) {
      console.log("File cleanup skipped:", result.reason);
    }
  } catch (error) {
    console.error("File cleanup failed:", error.message);
  }
}

// GET ALL PROJECTS — Public
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    return res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
    });
  }
});

// CREATE PROJECT — Admin only
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      tech,
      status,
      imageUrl,
      githubUrl,
      liveUrl,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const optionalStrings = {
      category,
      status,
      imageUrl,
      githubUrl,
      liveUrl,
    };

    for (const [field, value] of Object.entries(optionalStrings)) {
      if (!isOptionalString(value)) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a string`,
        });
      }
    }

    if (
      tech !== undefined &&
      (!Array.isArray(tech) || !tech.every((item) => typeof item === "string"))
    ) {
      return res.status(400).json({
        success: false,
        message: "tech must be an array of strings",
      });
    }

    const project = await Project.create({
      title: title.trim(),
      category: typeof category === "string" ? category.trim() : category,
      description: description.trim(),
      tech: Array.isArray(tech)
        ? tech.map((item) => item.trim()).filter(Boolean)
        : tech,
      status: typeof status === "string" ? status.trim() : status,
      imageUrl: typeof imageUrl === "string" ? imageUrl.trim() : imageUrl,
      githubUrl: typeof githubUrl === "string" ? githubUrl.trim() : githubUrl,
      liveUrl: typeof liveUrl === "string" ? liveUrl.trim() : liveUrl,
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error.message);
    const message = validationMessage(error);

    return res.status(message ? 400 : 500).json({
      success: false,
      message: message || "Failed to create project",
    });
  }
});

// UPDATE PROJECT — Admin only
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const allowedFields = [
      "title",
      "category",
      "description",
      "tech",
      "status",
      "githubUrl",
      "liveUrl",
      "imageUrl",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    for (const field of [
      "category",
      "status",
      "githubUrl",
      "liveUrl",
      "imageUrl",
    ]) {
      if (field in updates && typeof updates[field] !== "string") {
        return res.status(400).json({
          success: false,
          message: `${field} must be a string`,
        });
      }
    }

    if (
      "tech" in updates &&
      (!Array.isArray(updates.tech) ||
        !updates.tech.every((item) => typeof item === "string"))
    ) {
      return res.status(400).json({
        success: false,
        message: "tech must be an array of strings",
      });
    }

    if (typeof updates.category === "string")
      updates.category = updates.category.trim();
    if (typeof updates.status === "string")
      updates.status = updates.status.trim();
    if (typeof updates.imageUrl === "string")
      updates.imageUrl = updates.imageUrl.trim();
    if (typeof updates.githubUrl === "string")
      updates.githubUrl = updates.githubUrl.trim();
    if (typeof updates.liveUrl === "string")
      updates.liveUrl = updates.liveUrl.trim();

    if (Array.isArray(updates.tech)) {
      updates.tech = updates.tech.map((item) => item.trim()).filter(Boolean);
    }

    if (
      ("title" in updates &&
        (typeof updates.title !== "string" || !updates.title.trim())) ||
      ("description" in updates &&
        (typeof updates.description !== "string" ||
          !updates.description.trim()))
    ) {
      return res.status(400).json({
        success: false,
        message: "Title and description must not be empty",
      });
    }

    if (typeof updates.title === "string") {
      updates.title = updates.title.trim();
    }

    if (typeof updates.description === "string") {
      updates.description = updates.description.trim();
    }

    const previousProject = await Project.findById(id);

    if (!previousProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const oldImageUrl = previousProject.imageUrl;

    const project = await Project.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (oldImageUrl && oldImageUrl !== project.imageUrl) {
      await runCleanupSafely(cleanupUnusedImage, oldImageUrl);
    }

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error("Update project error:", error.message);
    const message = validationMessage(error);

    return res.status(message ? 400 : 500).json({
      success: false,
      message: message || "Failed to update project",
    });
  }
});

// DELETE PROJECT — Admin only
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const oldImageUrl = project.imageUrl;

    await Project.findByIdAndDelete(id);

    if (oldImageUrl) {
      await runCleanupSafely(cleanupUnusedImage, oldImageUrl);
    }

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete project",
    });
  }
});

export default router;
