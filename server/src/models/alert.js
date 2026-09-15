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
      trim: true,
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
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
    status: {
      type: String,
      enum: ["draft", "active", "escalated", "resolved", "archived"],
      default: "active",
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
        default: undefined,
      },
    },
    radius: {
      type: Number,
      min: 0,
    },
    affectedArea: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: ["admin", "system", "citizen", "external"],
      default: "admin",
    },
    urgency: {
      type: String,
      enum: ["immediate", "expected", "future", "past"],
      default: "expected",
    },
    certainty: {
      type: String,
      enum: ["observed", "likely", "possible", "unknown"],
      default: "likely",
    },
    effectiveAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    instructions: {
      type: [String],
      default: [],
    },
    risk: {
      score: {
        type: Number,
        min: 0,
        max: 100,
      },
      level: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
      },
      factors: {
        type: [
          {
            name: String,
            value: Number,
            weight: Number,
          },
        ],
        default: [],
      },
    },
    actualOutcome: {
      severity: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
      },
      impact: {
        type: String,
        enum: ["none", "limited", "moderate", "severe", "catastrophic"],
      },
      recordedAt: {
        type: Date,
      },
      recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

alertSchema.index({ coordinates: "2dsphere" });
alertSchema.index({ disasterType: 1, status: 1 });
alertSchema.index({ severity: 1, status: 1 });
alertSchema.index({ createdAt: -1 });

const Alert = mongoose.model("Alert", alertSchema);
export default Alert;
