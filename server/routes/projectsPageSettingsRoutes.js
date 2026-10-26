import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import ProjectsPageSettings from "../models/ProjectsPageSettings.js";

const router = express.Router();

// GET PROJECTS PAGE SETTINGS — Public
router.get("/", async (req, res) => {
  try {
    let settings = await ProjectsPageSettings.findOne({
      key: "projects-page",
    });

    if (!settings) {
      settings = await ProjectsPageSettings.create({
        key: "projects-page",
      });
    }

    return res.status(200).json(settings);
  } catch (error) {
    console.error("Get projects page settings error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to load projects page settings",
    });
  }
});

// UPDATE PROJECTS PAGE SETTINGS — Admin only
router.put("/", authMiddleware, async (req, res) => {
  try {
    const allowedFields = [
      "badgeText",
      "headingText",
      "highlightedText",
      "description",
      "focusLabel",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] !== "string") {
          return res.status(400).json({
            success: false,
            message: `${field} must be a string`,
          });
        }

        updates[field] = req.body[field].trim();
      }
    }

    const settings = await ProjectsPageSettings.findOneAndUpdate(
      { key: "projects-page" },
      {
        $set: updates,
        $setOnInsert: { key: "projects-page" },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Projects page settings saved successfully",
      settings,
    });
  } catch (error) {
    console.error("Update projects page settings error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to save projects page settings",
    });
  }
});

export default router;
