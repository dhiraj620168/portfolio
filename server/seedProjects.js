import dotenv from "dotenv";
import mongoose from "mongoose";
import Project from "./models/Project.js";

dotenv.config();

const projects = [
  {
    title: "InterviewIQ",
    category: "AI & Full Stack Development",
    description:
      "An AI-based mock interview platform built with React, Node.js, and Tailwind CSS. It includes interview practice and resume-analysis features. The project is in progress, with some features still pending.",
    tech: ["React", "Node.js", "Tailwind CSS", "AI APIs"],
    status: "In Progress",
    githubUrl: "",
  },
  {
    title: "Python Calculator",
    category: "Python Development",
    description:
      "A Python calculator supporting arithmetic operations and JSON-based calculation history.",
    tech: ["Python", "JSON", "Git"],
    status: "Completed",
    githubUrl: "",
  },
  {
    title: "Profile Management",
    category: "Python Development",
    description:
      "An object-oriented Python application for managing profiles, with JSON storage and planned SQLite database and REST API integration.",
    tech: ["Python", "OOP", "JSON", "SQLite"],
    status: "In Progress",
    githubUrl: "",
  },
];

async function seedProjects() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully");

    for (const project of projects) {
      await Project.updateOne(
        { title: project.title },
        { $set: project },
        { upsert: true, runValidators: true },
      );
    }

    console.log("Projects inserted or updated successfully:");
    projects.forEach((project) => console.log(`- ${project.title}`));
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedProjects();
