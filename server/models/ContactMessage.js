import mongoose from "mongoose";

const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },

    subject: {
      type: String,
      required: [true, "Subject is required"],
      enum: [
        "Job Opportunity",
        "Freelance Project",
        "Collaboration",
        "General Inquiry",
        "Other",
      ],
    },

    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: 10,
      maxlength: 5000,
    },

    consent: {
      type: Boolean,
      required: [true, "Consent is required"],
      validate: {
        validator(value) {
          return value === true;
        },
        message: "Consent must be accepted",
      },
    },

    consentAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["unread", "read", "replied", "archived"],
      default: "unread",
    },
  },
  {
    timestamps: true,
  },
);

contactMessageSchema.index({ status: 1, createdAt: -1 });

const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);

export default ContactMessage;
