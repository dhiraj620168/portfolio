import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, "Project title cannot be empty"],
      maxlength: [150, "Project title cannot exceed 150 characters"],
    },

    category: {
      type: String,
      default: "Software Development",
      trim: true,
      maxlength: [100, "Category cannot exceed 100 characters"],
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, "Project description cannot be empty"],
      maxlength: [10000, "Project description cannot exceed 10000 characters"],
    },

    tech: {
      type: [
        {
          type: String,
          trim: true,
          required: true,
          maxlength: [60, "Technology name cannot exceed 60 characters"],
        },
      ],
      default: [],
      validate: {
        validator: (items) => items.length <= 30,
        message: "A project cannot have more than 30 technologies",
      },
    },

    status: {
      type: String,
      default: "In Progress",
      trim: true,
      maxlength: [50, "Status cannot exceed 50 characters"],
    },

    imageUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: [2048, "Image URL is too long"],
    },

    githubUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: [2048, "GitHub URL is too long"],
    },

    liveUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: [2048, "Live URL is too long"],
    },
  },
  {
    timestamps: true,
    strict: "throw",
  },
);

export default mongoose.model("Project", projectSchema);
