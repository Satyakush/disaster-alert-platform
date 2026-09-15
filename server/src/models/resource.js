import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "ambulance",
        "fire_truck",
        "rescue_team",
        "police_unit",
        "medical_team",
        "boat",
        "helicopter",
        "food_supply",
        "water_supply",
        "shelter_capacity",
        "other",
      ],
    },
    status: {
      type: String,
      enum: ["available", "deployed", "maintenance", "unavailable"],
      default: "available",
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    location: {
      type: String,
      trim: true,
    },
    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: undefined,
      },
    },
    assignedResponder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedAlert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alert",
    },
    contact: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

resourceSchema.index({ coordinates: "2dsphere" });
resourceSchema.index({ type: 1, status: 1 });
resourceSchema.index({ assignedResponder: 1, status: 1 });

const Resource = mongoose.model("Resource", resourceSchema);

export default Resource;
