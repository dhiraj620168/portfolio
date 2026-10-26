import mongoose from "mongoose";

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Skill name is required"],
      trim: true,
      maxlength: 60,
    },

    category: {
      type: String,
      required: [true, "Skill category is required"],
      trim: true,
      maxlength: 50,
    },

    proficiency: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 70,
    },

    experience: {
      type: Number,
      min: 0,
      default: 0,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    icon: {
      type: String,
      trim: true,
      default: "",
    },

    isFeatured: {
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
    },
  },
  {
    timestamps: true,
  },
);

skillSchema.index({ category: 1, order: 1 });

const Skill = mongoose.model("Skill", skillSchema);

export default Skill;
