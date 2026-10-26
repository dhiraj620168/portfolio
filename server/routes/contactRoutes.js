import express from "express";
import ContactMessage from "../models/ContactMessage.js";
import authMiddleware from "../middleware/authMiddleware.js";

import mongoose from "mongoose";
import contactRateLimit from "../middleware/contactRateLimit.js";

const router = express.Router();

const allowedSubjects = [
  "Job Opportunity",
  "Freelance Project",
  "Collaboration",
  "General Inquiry",
  "Other",
];

// POST /api/contact — Public contact form
router.post("/", contactRateLimit, async (req, res) => {
  try {
    const { name, email, subject, message, consent, website } = req.body;

    // Honeypot: bots may fill this hidden field.
    // Return a generic success response without saving.
    if (typeof website === "string" && website.trim()) {
      return res.status(201).json({
        success: true,
        message: "Your message has been submitted successfully",
      });
    }

    // Validate required fields
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof subject !== "string" ||
      typeof message !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, subject and message are required",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMessage = message.trim();

    if (cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 100 characters",
      });
    }

    if (
      cleanEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    if (!allowedSubjects.includes(subject)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject",
      });
    }

    if (cleanMessage.length < 10 || cleanMessage.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Message must be between 10 and 5000 characters",
      });
    }

    if (consent !== true) {
      return res.status(400).json({
        success: false,
        message: "Consent is required to submit the message",
      });
    }

    const contactMessage = await ContactMessage.create({
      name: cleanName,
      email: cleanEmail,
      subject,
      message: cleanMessage,
      consent: true,
      consentAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Your message has been submitted successfully",
      data: {
        id: contactMessage._id,
        status: contactMessage.status,
        createdAt: contactMessage.createdAt,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Please check the submitted contact details",
      });
    }

    console.error("Contact submission error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to submit your message right now",
    });
  }
});

// GET /api/contact/admin — Admin message list
router.get("/admin", authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
    );

    const filter = {};

    if (req.query.status) {
      const allowedStatuses = ["unread", "read", "replied", "archived"];

      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid message status",
        });
      }

      filter.status = req.query.status;
    }

    if (typeof req.query.search === "string" && req.query.search.trim()) {
      const search = req.query.search.trim().slice(0, 100);
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } },
        { subject: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    const [messages, total] = await Promise.all([
      ContactMessage.find(filter)
        .select("name email subject status createdAt updatedAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ContactMessage.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin list messages error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
});

// GET /api/contact/admin/:id — Get one message's details
router.get("/admin/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    const contactMessage = await ContactMessage.findById(id).lean();

    if (!contactMessage) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: contactMessage,
    });
  } catch (error) {
    console.error("Get contact message error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch contact message",
    });
  }
});

/* PATCH /api/contact/admin/:id/status — Update message status */
router.patch("/admin/:id/status", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    const allowedStatuses = ["unread", "read", "replied", "archived"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message status",
      });
    }

    const contactMessage = await ContactMessage.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true },
    );

    if (!contactMessage) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message status updated successfully",
      data: {
        id: contactMessage._id,
        status: contactMessage.status,
        updatedAt: contactMessage.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update message status error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update message status",
    });
  }
});

/* DELETE /api/contact/admin/bulk — Delete all contact messages */
router.delete("/admin/bulk", authMiddleware, async (req, res) => {
  try {
    const result = await ContactMessage.deleteMany({});

    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} contact message(s)`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Bulk delete contact messages error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete contact messages",
    });
  }
});

/* DELETE /api/contact/admin/:id — Delete a message */
router.delete("/admin/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    const deletedMessage = await ContactMessage.findByIdAndDelete(id);

    if (!deletedMessage) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact message deleted successfully",
      data: {
        id: deletedMessage._id,
      },
    });
  } catch (error) {
    console.error("Delete contact message error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete contact message",
    });
  }
});

export default router;
