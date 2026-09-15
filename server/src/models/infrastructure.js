import mongoose from "mongoose";

const infrastructureSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    type: { type: String, required: true, enum: ["hospital", "school", "police_station", "fire_station", "power_station", "water_facility", "telecom", "government", "bridge", "other"] },
    status: { type: String, enum: ["operational", "limited", "damaged", "closed"], default: "operational" },
    location: { type: String, required: true, trim: true },
    coordinates: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    capacity: { type: Number, min: 0, default: 0 },
    contact: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 2000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

infrastructureSchema.index({ coordinates: "2dsphere" });
infrastructureSchema.index({ type: 1, status: 1 });

const Infrastructure = mongoose.model("Infrastructure", infrastructureSchema);
export default Infrastructure;
