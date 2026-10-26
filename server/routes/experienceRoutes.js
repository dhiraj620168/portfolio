import { Router } from "express";
import mongoose from "mongoose";
import Experience from "../models/Experience.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();
const editableFields = [
  "company",
  "institutionLogoUrl",
  "role",
  "experienceType",
  "employmentType",
  "location",
  "startDate",
  "endDate",
  "currentlyWorking",
  "description",
  "tech",
  "companyUrl",
  "isVisible",
  "details",
];

function validateExperienceInput(body, { partial = false } = {}) {
  const errors = [];
  const validExperienceTypes = [
    "working-professional",
    "internship",
    "industrial-training",
    "freelance",
    "contract",
  ];

  if (
    body.experienceType !== undefined &&
    !validExperienceTypes.includes(body.experienceType)
  ) {
    errors.push("Invalid experience type");
  }

  if (body.isVisible !== undefined && typeof body.isVisible !== "boolean") {
    errors.push("isVisible must be a boolean");
  }
  const requiredStrings = ["company", "role", "description"];
  const optionalStrings = [
    "institutionLogoUrl",
    "employmentType",
    "location",
    "companyUrl",
  ];

  for (const field of requiredStrings) {
    if (
      (!partial || body[field] !== undefined) &&
      (typeof body[field] !== "string" || !body[field].trim())
    ) {
      errors.push(`${field} is required and must be a non-empty string`);
    }
  }

  for (const field of optionalStrings) {
    if (body[field] !== undefined && typeof body[field] !== "string") {
      errors.push(`${field} must be a string`);
    }
  }

  for (const field of ["startDate", "endDate"]) {
    if (
      body[field] !== undefined &&
      body[field] !== null &&
      Number.isNaN(Date.parse(body[field]))
    ) {
      errors.push(`${field} must be a valid date`);
    }
  }

  if ((!partial || body.startDate !== undefined) && !body.startDate) {
    errors.push("startDate is required");
  }

  if (
    body.currentlyWorking !== undefined &&
    typeof body.currentlyWorking !== "boolean"
  ) {
    errors.push("currentlyWorking must be a boolean");
  }

  if (
    body.tech !== undefined &&
    (!Array.isArray(body.tech) ||
      !body.tech.every((item) => typeof item === "string"))
  ) {
    errors.push("tech must be an array of strings");
  }
  if (
    body.details !== undefined &&
    (body.details === null ||
      typeof body.details !== "object" ||
      Array.isArray(body.details))
  ) {
    errors.push("details must be an object");
  }

  return errors;
}

function pickFields(body) {
  const result = {};
  for (const field of editableFields) {
    if (body[field] !== undefined) result[field] = body[field];
  }
  for (const field of [
    "company",
    "role",
    "institutionLogoUrl",
    "employmentType",
    "location",
    "description",
    "companyUrl",
  ]) {
    if (typeof result[field] === "string") result[field] = result[field].trim();
  }
  if (Array.isArray(result.tech))
    result.tech = result.tech.map((item) => item.trim()).filter(Boolean);
  return result;
}

// Public portfolio: list experience entries, newest first.
router.get("/", async (req, res) => {
  try {
    const experiences = await Experience.find({
      $or: [{ isVisible: true }, { isVisible: { $exists: false } }],
    })
      .sort({ startDate: -1, createdAt: -1 })
      .lean();
    return res.status(200).json(experiences);
  } catch (error) {
    console.error("Fetch experiences failed:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch experiences" });
  }
});

router.get("/admin", authMiddleware, async (req, res) => {
  try {
    const experiences = await Experience.find()
      .sort({ startDate: -1, createdAt: -1 })
      .lean();

    return res.status(200).json(experiences);
  } catch (error) {
    console.error("Fetch admin experiences failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch experiences",
    });
  }
});

// Admin: create an experience entry.
router.post("/", authMiddleware, async (req, res) => {
  try {
    const errors = validateExperienceInput(req.body ?? {});
    if (errors.length)
      return res
        .status(400)
        .json({ success: false, message: errors[0], errors });

    const experience = await Experience.create(pickFields(req.body));
    return res.status(201).json({
      success: true,
      message: "Experience created successfully",
      experience,
    });
  } catch (error) {
    console.error("Create experience failed:", error.message);
    return res
      .status(
        error.name === "ValidationError" || error.name === "CastError"
          ? 400
          : 500,
      )
      .json({
        success: false,
        message:
          error.name === "ValidationError" || error.name === "CastError"
            ? error.message
            : "Failed to create experience",
      });
  }
});

// Admin: update an experience entry.
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid experience ID" });

    const updates = pickFields(req.body ?? {});
    if (!Object.keys(updates).length)
      return res.status(400).json({
        success: false,
        message: "No valid fields supplied for update",
      });
    const errors = validateExperienceInput(updates, { partial: true });
    if (errors.length)
      return res
        .status(400)
        .json({ success: false, message: errors[0], errors });

    const experience = await Experience.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!experience)
      return res
        .status(404)
        .json({ success: false, message: "Experience not found" });
    return res.status(200).json({
      success: true,
      message: "Experience updated successfully",
      experience,
    });
  } catch (error) {
    console.error("Update experience failed:", error.message);
    return res
      .status(
        error.name === "ValidationError" || error.name === "CastError"
          ? 400
          : 500,
      )
      .json({
        success: false,
        message:
          error.name === "ValidationError" || error.name === "CastError"
            ? error.message
            : "Failed to update experience",
      });
  }
});

// Admin: delete an experience entry.
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid experience ID" });

    const experience = await Experience.findByIdAndDelete(id);
    if (!experience)
      return res
        .status(404)
        .json({ success: false, message: "Experience not found" });
    return res
      .status(200)
      .json({ success: true, message: "Experience deleted successfully" });
  } catch (error) {
    console.error("Delete experience failed:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete experience" });
  }
});

export default router;
