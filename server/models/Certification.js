import mongoose from "mongoose";

const certificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Certificate title is required"],
      trim: true,
      maxlength: 200,
    },

    issuer: {
      type: String,
      required: [true, "Issuing organization is required"],
      trim: true,
      maxlength: 150,
    },

    issueDate: {
      type: Date,
      default: null,
    },

    expiryDate: {
      type: Date,
      default: null,
    },

    credentialId: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    credentialUrl: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    skills: {
      type: [String],
      default: [],
      validate: {
        validator(value) {
          return (
            value.length <= 30 &&
            value.every(
              (skill) => typeof skill === "string" && skill.trim().length > 0,
            )
          );
        },
        message: "Skills must contain up to 30 non-empty strings",
      },
    },

    imageUrl: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    certificateFileUrl: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    certificateFileType: {
      type: String,
      enum: ["image", "pdf", ""],
      default: "",
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1500,
      default: "",
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
  {
    timestamps: true,
  },
);

certificationSchema.index({ isVisible: 1, order: 1 });

const Certification = mongoose.model("Certification", certificationSchema);

export default Certification;
