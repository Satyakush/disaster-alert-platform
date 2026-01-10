import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    disasterType: {
      type: String,
      required: true,
      enum: ["flood", "earthquake", "fire", "cyclone", "other"],
    },

    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },

    location: {
      type: String,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Alert = mongoose.model("Alert", alertSchema);
export default Alert;
