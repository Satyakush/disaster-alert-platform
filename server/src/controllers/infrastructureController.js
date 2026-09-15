import Infrastructure from "../models/infrastructure.js";

const fields = "name type status location coordinates capacity contact notes createdBy";

export const getInfrastructure = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    const items = await Infrastructure.find(filter).select(fields).populate("createdBy", "name role").sort({ type: 1, name: 1 });
    res.json({ infrastructure: items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load infrastructure" });
  }
};

export const createInfrastructure = async (req, res) => {
  try {
    const { name, type, status, location, coordinates, capacity, contact, notes } = req.body;
    if (!name || !type || !location || !coordinates?.coordinates || coordinates.coordinates.length !== 2) return res.status(400).json({ message: "Name, type, location, and coordinates are required" });
    const item = await Infrastructure.create({ name, type, status, location, coordinates, capacity, contact, notes, createdBy: req.user.id });
    await item.populate("createdBy", "name role");
    req.app.get("io")?.to("alerts").emit("infrastructure:created", item);
    res.status(201).json({ message: "Infrastructure created successfully", infrastructure: item });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") return res.status(400).json({ message: error.message });
    console.error(error);
    res.status(500).json({ message: "Failed to create infrastructure" });
  }
};

export const updateInfrastructure = async (req, res) => {
  try {
    const item = await Infrastructure.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Infrastructure not found" });
    const allowed = ["name", "type", "status", "location", "coordinates", "capacity", "contact", "notes"];
    allowed.forEach((field) => { if (Object.prototype.hasOwnProperty.call(req.body, field)) item[field] = req.body[field]; });
    await item.save();
    await item.populate("createdBy", "name role");
    req.app.get("io")?.to("alerts").emit("infrastructure:updated", item);
    res.json({ message: "Infrastructure updated successfully", infrastructure: item });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") return res.status(400).json({ message: error.message });
    console.error(error);
    res.status(500).json({ message: "Failed to update infrastructure" });
  }
};

export const deleteInfrastructure = async (req, res) => {
  try {
    const item = await Infrastructure.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Infrastructure not found" });
    req.app.get("io")?.to("alerts").emit("infrastructure:deleted", { id: item._id });
    res.json({ message: "Infrastructure deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete infrastructure" });
  }
};
