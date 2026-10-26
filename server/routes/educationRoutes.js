import express from "express";
import mongoose from "mongoose";
import Education from "../models/Education.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const allowedFields = [
  "degree",
  "institution",
  "institutionLogoUrl",
  "institutionLogoFileId",
  "boardOrUniversity",
  "fieldOfStudy",
  "startYear",
  "endYear",
  "gradeType",
  "grade",
  "marks",
  "maxMarks",
  "percentage",
  "division",
  "cgpa",
  "cgpaScale",
  "cgpaConversionFactor",
  "description",
  "isCurrentlyStudying",
  "isVisible",
  "order",
];

const stringFields = [
  "institution",
  "boardOrUniversity",
  "fieldOfStudy",
  "grade",
  "division",
  "description",
];

const numericFields = [
  "startYear",
  "endYear",
  "marks",
  "maxMarks",
  "percentage",
  "cgpa",
  "cgpaScale",
  "cgpaConversionFactor",
  "order",
];

function cleanOptionalString(value) {
  return typeof value === "string" ? value.trim() : value;
}

function normalizeNumericFields(data) {
  const normalized = { ...data };

  for (const field of numericFields) {
    if (!Object.hasOwn(normalized, field)) continue;

    const value = normalized[field];

    if (value === "" || value === null) {
      normalized[field] = null;
      continue;
    }

    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
      return {
        error: `${field} must be a valid number`,
      };
    }

    normalized[field] = numberValue;
  }

  if (normalized.marks != null && normalized.marks < 0) {
    return { error: "Marks cannot be negative" };
  }

  if (normalized.maxMarks != null && normalized.maxMarks < 0) {
    return { error: "Maximum marks cannot be negative" };
  }

  if (
    normalized.marks != null &&
    normalized.maxMarks != null &&
    normalized.marks > normalized.maxMarks
  ) {
    return {
      error: "Marks cannot exceed maximum marks",
    };
  }

  if (
    normalized.percentage != null &&
    (normalized.percentage < 0 || normalized.percentage > 100)
  ) {
    return {
      error: "Percentage must be between 0 and 100",
    };
  }

  if (normalized.cgpa != null && normalized.cgpa < 0) {
    return { error: "CGPA cannot be negative" };
  }

  if (normalized.cgpaScale != null && normalized.cgpaScale <= 0) {
    return { error: "CGPA scale must be greater than 0" };
  }

  if (
    normalized.cgpaConversionFactor != null &&
    normalized.cgpaConversionFactor <= 0
  ) {
    return {
      error: "CGPA conversion factor must be greater than 0",
    };
  }

  return { data: normalized };
}

function normalizeLogoFields(body) {
  const logoUrl =
    typeof body.institutionLogoUrl === "string"
      ? body.institutionLogoUrl.trim()
      : "";

  const logoFileId =
    typeof body.institutionLogoFileId === "string"
      ? body.institutionLogoFileId.trim()
      : "";

  if (logoUrl.length > 1000) {
    return {
      error: "Institution logo URL cannot exceed 1000 characters",
    };
  }

  if (logoUrl && !/^https?:\/\//i.test(logoUrl)) {
    return {
      error: "Institution logo URL must start with http:// or https://",
    };
  }

  if (logoFileId && !/^[a-f\d]{24}$/i.test(logoFileId)) {
    return {
      error: "Institution logo file ID must be a valid GridFS ObjectId",
    };
  }

  return {
    institutionLogoUrl: logoUrl,
    institutionLogoFileId: logoUrl ? "" : logoFileId,
  };
}

function pickAllowedFields(body) {
  const result = {};

  for (const field of allowedFields) {
    if (Object.hasOwn(body, field)) {
      result[field] = body[field];
    }
  }

  return result;
}

function normalizeEducationPayload(body) {
  const data = pickAllowedFields(body);

  for (const field of stringFields) {
    if (Object.hasOwn(data, field)) {
      data[field] = cleanOptionalString(data[field]);
    }
  }

  const numericResult = normalizeNumericFields(data);

  if (numericResult.error) {
    return numericResult;
  }

  return { data: numericResult.data };
}

// GET /api/education — Public visible education records
router.get("/", async (req, res) => {
  try {
    const education = await Education.find({ isVisible: true })
      .sort({ order: 1, endYear: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: education.length,
      data: education,
    });
  } catch (error) {
    console.error("Get education error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch education records",
    });
  }
});

// GET /api/education/admin — Admin sees all records
router.get("/admin", authMiddleware, async (req, res) => {
  try {
    const education = await Education.find()
      .sort({ order: 1, endYear: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: education.length,
      data: education,
    });
  } catch (error) {
    console.error("Admin get education error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch education records",
    });
  }
});

// POST /api/education — Create education record
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { degree, institution } = req.body;

    if (
      typeof degree !== "string" ||
      !degree.trim() ||
      typeof institution !== "string" ||
      !institution.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Degree and institution are required",
      });
    }

    const logoFields = normalizeLogoFields(req.body);

    if (logoFields.error) {
      return res.status(400).json({
        success: false,
        message: logoFields.error,
      });
    }

    const payloadResult = normalizeEducationPayload(req.body);

    if (payloadResult.error) {
      return res.status(400).json({
        success: false,
        message: payloadResult.error,
      });
    }

    const payload = {
      ...payloadResult.data,
      ...logoFields,
      degree: degree.trim(),
      institution: institution.trim(),
    };

    const education = await Education.create(payload);

    return res.status(201).json({
      success: true,
      message: "Education record created successfully",
      data: education,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create education error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create education record",
    });
  }
});

// PUT /api/education/:id — Update education record
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid education ID",
      });
    }

    const payloadResult = normalizeEducationPayload(req.body);

    if (payloadResult.error) {
      return res.status(400).json({
        success: false,
        message: payloadResult.error,
      });
    }

    const updates = payloadResult.data;

    const logoFieldsProvided =
      Object.hasOwn(req.body, "institutionLogoUrl") ||
      Object.hasOwn(req.body, "institutionLogoFileId");

    if (logoFieldsProvided) {
      const logoFields = normalizeLogoFields({
        institutionLogoUrl: Object.hasOwn(req.body, "institutionLogoUrl")
          ? req.body.institutionLogoUrl
          : "",
        institutionLogoFileId: Object.hasOwn(req.body, "institutionLogoFileId")
          ? req.body.institutionLogoFileId
          : "",
      });

      if (logoFields.error) {
        return res.status(400).json({
          success: false,
          message: logoFields.error,
        });
      }

      updates.institutionLogoUrl = logoFields.institutionLogoUrl;
      updates.institutionLogoFileId = logoFields.institutionLogoFileId;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const education = await Education.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!education) {
      return res.status(404).json({
        success: false,
        message: "Education record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Education record updated successfully",
      data: education,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update education error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update education record",
    });
  }
});

// DELETE /api/education/:id — Delete education record
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid education ID",
      });
    }

    const education = await Education.findByIdAndDelete(req.params.id);

    if (!education) {
      return res.status(404).json({
        success: false,
        message: "Education record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Education record deleted successfully",
    });
  } catch (error) {
    console.error("Delete education error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete education record",
    });
  }
});

export default router;
