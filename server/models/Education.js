

import mongoose from "mongoose";

const educationSchema = new mongoose.Schema(
  {
    degree: {
      type: String,
      required: [true, "Qualification is required"],
      enum: [
        "10th",
        "12th",
        "Diploma",
        "Graduation",
        "Post-Graduation",
        "PhD",
        "Other",
      ],
    },

    institution: {
      type: String,
      required: [true, "School or college name is required"],
      trim: true,
      maxlength: 200,
    },

    institutionLogoUrl: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    institutionLogoFileId: {
      type: String,
      trim: true,
      maxlength: 24,
      default: "",
    },

    boardOrUniversity: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    fieldOfStudy: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    startYear: {
      type: Number,
      min: 1950,
      max: 2100,
      default: null,
    },

    endYear: {
      type: Number,
      required: [true, "Completion year is required"],
      min: 1950,
      max: 2100,
    },

    // Legacy field: keep it for existing records.
    gradeType: {
      type: String,
      enum: ["Percentage", "CGPA", "Marks", "Grade", "Other"],
      default: "Percentage",
    },

    grade: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },

    // Secondary education results
    marks: {
      type: Number,
      min: 0,
      default: null,
    },

    maxMarks: {
      type: Number,
      min: 0,
      default: null,
    },

    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    division: {
      type: String,
      enum: [
        "First Division",
        "Second Division",
        "Third Division",
        "Other",
        "",
      ],
      default: "",
    },

    // Graduation and higher education results
    cgpa: {
      type: Number,
      min: 0,
      default: null,
    },

    cgpaScale: {
      type: Number,
      min: 0.1,
      default: 10,
    },

    // Set only when the university's official conversion factor is known.
    cgpaConversionFactor: {
      type: Number,
      min: 0.1,
      default: null,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1500,
      default: "",
    },

    isCurrentlyStudying: {
      type: Boolean,
      default: false,
    },

    isVisible: {
      type: Boolean,
      default: true,
    },

    order: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

educationSchema.index({ isVisible: 1, order: 1 });

const Education = mongoose.model("Education", educationSchema);

export default Education;
