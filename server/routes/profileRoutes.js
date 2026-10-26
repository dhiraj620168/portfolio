import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import Profile from "../models/Profile.js";
import {
  cleanupUnusedImage,
  cleanupUnusedResume,
} from "../utils/fileCleanup.js";

const router = express.Router();

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

// GET PROFILE — Public
router.get("/", async (req, res) => {
  try {
    let profile = await Profile.findOne().lean();

    if (!profile) {
      profile = {
        name: "Dhiraj Kumar",
        careerType: "fresher",
        experienceCategory: "",
        professionalTitle: "Full Stack Developer · AI Enthusiast",
        introduction: "",
        about: "",
        location: "",
        education: "",
        careerGoal: "",
        skills: [],
        highlights: [],
        resumeUrl: "/resume.pdf",
        profileImageUrl: "/profile.jpg",
      };
    }

    profile.careerType ||= "fresher";
    profile.highlights = (profile.highlights || [])
      .filter((card) => card.isVisible !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    res.set("Cache-Control", "no-store");
    return res.status(200).json(profile);
  } catch (error) {
    console.error("Get profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to load profile",
    });
  }
});

// GET FULL PROFILE — Admin only
router.get("/admin", authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne().lean();

    if (!profile) {
      return res.status(200).json({
        name: "Dhiraj Kumar",
        careerType: "fresher",
        experienceCategory: "",
        professionalTitle: "Full Stack Developer · AI Enthusiast",
        introduction: "",
        about: "",
        location: "",
        education: "",
        careerGoal: "",
        skills: [],
        highlights: [],
        resumeUrl: "/resume.pdf",
        profileImageUrl: "/profile.jpg",
      });
    }

    profile.careerType ||= "fresher";
    return res.status(200).json(profile);
  } catch (error) {
    console.error("Get admin profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to load admin profile",
    });
  }
});

// UPDATE PROFILE — Admin only
router.put("/", authMiddleware, async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "professionalTitle",
      "careerType",
      "experienceCategory",
      "introduction",
      "about",
      "location",
      "education",
      "careerGoal",
      "skills",
      "highlights",
      "resumeUrl",
      "profileImageUrl",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const textFields = [
      "name",
      "professionalTitle",
      "introduction",
      "about",
      "location",
      "education",
      "careerGoal",
      "resumeUrl",
      "profileImageUrl",
    ];

    for (const field of textFields) {
      if (field in updates && typeof updates[field] !== "string") {
        return res.status(400).json({
          success: false,
          message: `${field} must be a string`,
        });
      }

      if (typeof updates[field] === "string") {
        updates[field] = updates[field].trim();
      }
    }

    if (
      "highlights" in updates &&
      (!Array.isArray(updates.highlights) ||
        !updates.highlights.every(
          (card) =>
            card &&
            typeof card === "object" &&
            !Array.isArray(card) &&
            typeof card.title === "string" &&
            card.title.trim() &&
            (card.description === undefined ||
              typeof card.description === "string") &&
            (card.icon === undefined || typeof card.icon === "string") &&
            (card.order === undefined ||
              (Number.isInteger(card.order) && card.order >= 0)) &&
            (card.isVisible === undefined ||
              typeof card.isVisible === "boolean"),
        ))
    ) {
      return res.status(400).json({
        success: false,
        message: "Highlights must be an array of valid cards with a title",
      });
    }

    if ("highlights" in updates) {
      updates.highlights = updates.highlights.map((card, index) => ({
        title: card.title.trim(),
        description: (card.description || "").trim(),
        icon: card.icon || "Code2",
        order: card.order ?? index,
        isVisible: card.isVisible ?? true,
      }));
    }

    if (
      "careerType" in updates &&
      !["fresher", "experienced"].includes(updates.careerType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Career type must be fresher or experienced",
      });
    }
    const validExperienceCategories = [
      "working-professional",
      "internship",
      "industrial-training",
      "freelance",
      "contract",
    ];

    if (
      "experienceCategory" in updates &&
      !validExperienceCategories.includes(updates.experienceCategory)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid experience category",
      });
    }
    if (
      "name" in updates &&
      (typeof updates.name !== "string" || !updates.name.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (typeof updates.name === "string") {
      updates.name = updates.name.trim();
    }

    if (
      "skills" in updates &&
      (!Array.isArray(updates.skills) ||
        !updates.skills.every((skill) => typeof skill === "string"))
    ) {
      return res.status(400).json({
        success: false,
        message: "Skills must be an array of strings",
      });
    }

    if (Array.isArray(updates.skills)) {
      updates.skills = updates.skills
        .map((skill) => skill.trim())
        .filter(Boolean);
    }

    const previousProfile = await Profile.findOne();
    const oldResumeUrl = previousProfile?.resumeUrl;
    const oldProfileImageUrl = previousProfile?.profileImageUrl;

    let profile = previousProfile;

    if (profile) {
      Object.assign(profile, updates);
      await profile.save();
    } else {
      profile = await Profile.create({
        name: "Dhiraj Kumar",
        ...updates,
      });
    }

    if (oldProfileImageUrl && oldProfileImageUrl !== profile.profileImageUrl) {
      await runCleanupSafely(cleanupUnusedImage, oldProfileImageUrl);
    }

    if (oldResumeUrl && oldResumeUrl !== profile.resumeUrl) {
      await runCleanupSafely(cleanupUnusedResume, oldResumeUrl);
    }

    return res.status(200).json({
      success: true,
      message: "Profile saved successfully",
      profile,
    });
  } catch (error) {
    console.error("Save profile error:", error.message);
    const message = validationMessage(error);

    return res.status(message ? 400 : 500).json({
      success: false,
      message: message || "Failed to save profile",
    });
  }
});

export default router;
