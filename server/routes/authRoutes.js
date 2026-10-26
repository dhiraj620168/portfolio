import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const admin = await Admin.findOne({
      email: email.trim().toLowerCase(),
    }).select("+passwordHash");

    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
      subject: admin._id.toString(),
      expiresIn: "1h",
    });

    return res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Admin login failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to log in",
    });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("email role");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin account not found",
      });
    }

    return res.json({
      success: true,
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin verification failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify admin",
    });
  }
});

export default router;
