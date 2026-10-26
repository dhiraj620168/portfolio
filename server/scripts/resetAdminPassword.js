import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

dotenv.config();

async function resetAdminPassword() {
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
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const admin = await Admin.findOneAndUpdate(
      { email },
      { $set: { passwordHash } },
      { new: true, runValidators: true },
    );

    if (!admin) {
      throw new Error("Admin not found. Check ADMIN_EMAIL in server/.env");
    }

    console.log("Admin password reset successfully.");
  } catch (error) {
    console.error("Password reset failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

resetAdminPassword();
