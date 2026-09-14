import mongoose from "mongoose";

const responseTaskSchema = new mongoose.Schema(
  {
    alert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alert",
      required: true,
      index: true,
    },
    responder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["assigned", "acknowledged", "in_progress", "completed", "cancelled"],
      default: "assigned",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    completedAt: {
      type: Date,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

responseTaskSchema.index({ responder: 1, status: 1, createdAt: -1 });
responseTaskSchema.index({ alert: 1, responder: 1 }, { unique: true });

const ResponseTask = mongoose.model("ResponseTask", responseTaskSchema);

export default ResponseTask;
