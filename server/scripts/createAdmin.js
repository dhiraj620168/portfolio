import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

dotenv.config();

async function createAdmin() {
  try {
    const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error(
        "Set MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD in server/.env",
      );
    }

    if (ADMIN_PASSWORD.length < 12) {
      throw new Error("ADMIN_PASSWORD must be at least 12 characters long");
    }

    await mongoose.connect(MONGODB_URI);

    const email = ADMIN_EMAIL.trim().toLowerCase();
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log("Admin already exists. No changes were made.");
      return;
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    await Admin.create({
      email,
      passwordHash,
      role: "admin",
    });

    console.log("Admin account created successfully.");
  } catch (error) {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

createAdmin();
