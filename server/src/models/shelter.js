import mongoose from "mongoose";

const shelterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    location: {
      type: String,
      required: true,
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
        required: true,
        validate: {
          validator: (value) =>
            Array.isArray(value) &&
            value.length === 2 &&
            value[0] >= -180 &&
            value[0] <= 180 &&
            value[1] >= -90 &&
            value[1] <= 90,
          message: "Coordinates must be [longitude, latitude]",
        },
      },
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    availableCapacity: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["open", "limited", "full", "closed"],
      default: "open",
    },
    facilities: {
      type: [String],
      default: [],
    },
    contact: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

shelterSchema.index({ coordinates: "2dsphere" });
shelterSchema.index({ status: 1 });

const Shelter = mongoose.model("Shelter", shelterSchema);

export default Shelter;
