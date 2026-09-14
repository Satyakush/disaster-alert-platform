import mongoose from "mongoose";

const incidentReportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    disasterType: {
      type: String,
      required: true,
      enum: [
        "flood",
        "cyclone",
        "earthquake",
        "wildfire",
        "heatwave",
        "storm",
        "landslide",
        "tsunami",
        "industrial",
        "other",
      ],
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
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    mediaUrl: {
      type: String,
      trim: true,
    },
    verificationNote: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: {
      type: Date,
    },
    linkedAlert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alert",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

incidentReportSchema.index({ coordinates: "2dsphere" });
incidentReportSchema.index({ status: 1, createdAt: -1 });
incidentReportSchema.index({ disasterType: 1, status: 1 });

const IncidentReport = mongoose.model("IncidentReport", incidentReportSchema);

export default IncidentReport;
