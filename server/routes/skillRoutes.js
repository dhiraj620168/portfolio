import express from "express";
import mongoose from "mongoose";
import Skill from "../models/Skill.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// GET: Public — visible skills
router.get("/", async (req, res) => {
  try {
    const skills = await Skill.find({ isVisible: true })
      .sort({ category: 1, order: 1, name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: skills.length,
      data: skills,
    });
  } catch (error) {
    console.error("Get skills error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch skills",
    });
  }
});

// GET: Admin — all skills, including hidden ones
router.get("/admin", authMiddleware, async (req, res) => {
  try {
    const skills = await Skill.find()
      .sort({ category: 1, order: 1, name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: skills.length,
      data: skills,
    });
  } catch (error) {
    console.error("Admin get skills error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch skills",
    });
  }
});

// POST: Admin — create skill
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      category,
      proficiency,
      experience,
      description,
      icon,
      isFeatured,
      isVisible,
      order,
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof category !== "string" ||
      !category.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Skill name and category are required",
      });
    }

    const skill = await Skill.create({
      name: name.trim(),
      category: category.trim(),
      proficiency,
      experience,
      description,
      icon,
      isFeatured,
      isVisible,
      order,
    });

    return res.status(201).json({
      success: true,
      message: "Skill created successfully",
      data: skill,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create skill error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create skill",
    });
  }
});

// PUT: Admin — update skill
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid skill ID",
      });
    }

    const allowedFields = [
      "name",
      "category",
      "proficiency",
      "experience",
      "description",
      "icon",
      "isFeatured",
      "isVisible",
      "order",
    ];

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

    if (
      Object.hasOwn(updates, "name") &&
      (typeof updates.name !== "string" || !updates.name.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Skill name cannot be empty",
      });
    }

    if (
      Object.hasOwn(updates, "category") &&
      (typeof updates.category !== "string" || !updates.category.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Skill category cannot be empty",
      });
    }

    if (typeof updates.name === "string") {
      updates.name = updates.name.trim();
    }

    if (typeof updates.category === "string") {
      updates.category = updates.category.trim();
    }

    const skill = await Skill.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Skill not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Skill updated successfully",
      data: skill,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update skill error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update skill",
    });
  }
});

// DELETE: Admin — delete skill
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid skill ID",
      });
    }

    const skill = await Skill.findByIdAndDelete(req.params.id);

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Skill not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Skill deleted successfully",
    });
  } catch (error) {
    console.error("Delete skill error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete skill",
    });
  }
});

export default router;
