import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema(
  {
    experienceType: {
      type: String,
      enum: [
        "working-professional",
        "internship",
        "industrial-training",
        "freelance",
        "contract",
      ],
      required: true,
    },

    company: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    // Institute or company logo URL
    institutionLogoUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    role: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    employmentType: {
      type: String,
      default: "",
      trim: true,
      maxlength: 50,
    },

    location: {
      type: String,
      default: "",
      trim: true,
      maxlength: 150,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      default: null,
    },

    currentlyWorking: {
      type: Boolean,
      default: false,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },

    tech: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 50,
        },
      ],
      default: [],
      validate: {
        validator: (items) => items.length <= 30,
        message: "Maximum 30 technologies are allowed",
      },
    },

    companyUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

experienceSchema.pre("validate", function () {
  if (this.currentlyWorking) {
    this.endDate = null;
  }

  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate("endDate", "End date cannot be before start date");
  }

  if (this.experienceType === "working-professional" && !this.employmentType) {
    this.invalidate("employmentType", "Employment type is required");
  }
});

export default mongoose.model("Experience", experienceSchema);
