import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const defaultSettings = {
  siteTitle: "My Portfolio",
  siteDescription: "",
  siteUrl: "",
  contactEmail: "",
  maintenanceMode: false,
  showAvailability: true,
  emailNotifications: true,
  publicProfile: true,
  themePreference: "system",
};

// Temporary storage: resets when the server restarts.
let settings = { ...defaultSettings };

// GET /api/settings
router.get("/", authMiddleware, (req, res) => {
  res.json({
    success: true,
    settings,
  });
});

// PUT /api/settings
router.put("/", authMiddleware, (req, res) => {
  const allowedFields = Object.keys(defaultSettings);
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  settings = { ...settings, ...updates };

  res.json({
    success: true,
    message: "Settings updated successfully",
    settings,
  });
});

export default router;
