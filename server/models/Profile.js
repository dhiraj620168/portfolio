import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    careerType: {
      type: String,
      enum: ["fresher", "experienced"],
      default: "fresher",
      trim: true,
    },

    experienceCategory: {
      type: String,
      enum: [
        "working-professional",
        "internship",
        "industrial-training",
        "freelance",
        "contract",
      ],
      default: "",
      trim: true,
    },

    professionalTitle: {
      type: String,
      default: "Full Stack Developer · AI Enthusiast",
    },

    introduction: {
      type: String,
      default: "",
    },
    about: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    education: {
      type: String,
      default: "",
    },
    careerGoal: {
      type: String,
      default: "",
    },
    skills: {
      type: [String],
      default: [],
    },
    highlights: {
      type: [
        {
          title: {
            type: String,
            required: true,
            trim: true,
          },
          description: {
            type: String,
            default: "",
            trim: true,
          },
          icon: {
            type: String,
            default: "Code2",
          },
          order: {
            type: Number,
            default: 0,
          },
          isVisible: {
            type: Boolean,
            default: true,
          },
        },
      ],
      default: [],
    },
    resumeUrl: {
      type: String,
      default: "/resume.pdf",
    },
    profileImageUrl: {
      type: String,
      default: "/profile.jpg",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Profile", profileSchema);
