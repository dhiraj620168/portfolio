import mongoose from "mongoose";

const projectsPageSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "projects-page",
      unique: true,
      required: true,
    },
    badgeText: {
      type: String,
      default: "Ideas turned into applications",
    },
    headingText: {
      type: String,
      default: "My",
    },
    highlightedText: {
      type: String,
      default: "Project",
    },
    description: {
      type: String,
      default:
        "Each project represents a step in learning, experimenting and building practical solutions.",
    },
    focusLabel: {
      type: String,
      default: "Full Stack & AI",
    },
  },
  { timestamps: true },
);

export default mongoose.model(
  "ProjectsPageSettings",
  projectsPageSettingsSchema,
);
