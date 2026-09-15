import Resource from "../models/resource.js";
import User from "../models/user.js";
import Alert from "../models/alert.js";

const responseRoles = ["admin", "responder"];

const loadResource = (id) => Resource.findById(id)
  .populate("assignedResponder", "name email role")
  .populate("assignedAlert", "title disasterType severity status location")
  .populate("createdBy", "name email role");

export const getResources = async (req, res) => {
  try {
    if (!responseRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Responder or admin access required" });
    }

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    if (req.user.role === "responder") {
      filter.$or = [{ assignedResponder: req.user.id }, { status: { $in: ["available", "deployed"] } }];
    }

    const resources = await Resource.find(filter)
      .populate("assignedResponder", "name email role")
      .populate("assignedAlert", "title disasterType severity status location")
      .populate("createdBy", "name email role")
      .sort({ status: 1, type: 1, name: 1 });

    res.json({ resources });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load resources" });
  }
};

export const createResource = async (req, res) => {
  try {
    if (!responseRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Responder or admin access required" });
    }

    const {
      name,
      type,
      status,
      quantity,
      availableQuantity,
      location,
      coordinates,
      assignedResponder,
      assignedAlert,
      contact,
      notes,
    } = req.body;

    if (!name || !type || quantity === undefined || availableQuantity === undefined) {
      return res.status(400).json({ message: "Name, type, quantity, and available quantity are required" });
    }

    if (Number(availableQuantity) > Number(quantity)) {
      return res.status(400).json({ message: "Available quantity cannot exceed total quantity" });
    }

    if (assignedResponder) {
      const responder = await User.findOne({ _id: assignedResponder, role: "responder" });
      if (!responder) return res.status(400).json({ message: "Assigned user must be a responder" });
    }

    if (assignedAlert) {
      const alert = await Alert.findById(assignedAlert);
      if (!alert) return res.status(400).json({ message: "Assigned alert not found" });
    }

    if (req.user.role === "responder" && assignedResponder && assignedResponder !== req.user.id) {
      return res.status(403).json({ message: "You can only assign resources to yourself" });
    }

    const resource = await Resource.create({
      name,
      type,
      status,
      quantity,
      availableQuantity,
      location,
      coordinates,
      assignedResponder: assignedResponder || (req.user.role === "responder" ? req.user.id : undefined),
      assignedAlert,
      contact,
      notes,
      createdBy: req.user.id,
    });

    const populatedResource = await loadResource(resource._id);
    req.app.get("io")?.to("alerts").emit("resource:created", populatedResource);

    res.status(201).json({ message: "Resource created successfully", resource: populatedResource });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to create resource" });
  }
};

export const updateResource = async (req, res) => {
  try {
    if (!responseRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Responder or admin access required" });
    }

    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    if (req.user.role === "responder" && resource.assignedResponder?.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only update resources assigned to you" });
    }

    const allowedFields = [
      "name",
      "type",
      "status",
      "quantity",
      "availableQuantity",
      "location",
      "coordinates",
      "assignedResponder",
      "assignedAlert",
      "contact",
      "notes",
    ];

    const updates = Object.fromEntries(
      allowedFields
        .filter((field) => Object.prototype.hasOwnProperty.call(req.body, field))
        .map((field) => [field, req.body[field]])
    );

    const quantity = updates.quantity ?? resource.quantity;
    const availableQuantity = updates.availableQuantity ?? resource.availableQuantity;

    if (Number(availableQuantity) > Number(quantity)) {
      return res.status(400).json({ message: "Available quantity cannot exceed total quantity" });
    }

    if (Object.prototype.hasOwnProperty.call(updates, "assignedResponder")) {
      if (updates.assignedResponder) {
        const responder = await User.findOne({ _id: updates.assignedResponder, role: "responder" });
        if (!responder) return res.status(400).json({ message: "Assigned user must be a responder" });
      }
      if (req.user.role === "responder" && updates.assignedResponder && updates.assignedResponder !== req.user.id) {
        return res.status(403).json({ message: "You can only assign resources to yourself" });
      }
    }

    if (updates.assignedAlert) {
      const alert = await Alert.findById(updates.assignedAlert);
      if (!alert) return res.status(400).json({ message: "Assigned alert not found" });
    }

    Object.assign(resource, updates);
    await resource.save();

    const populatedResource = await loadResource(resource._id);
    req.app.get("io")?.to("alerts").emit("resource:updated", populatedResource);

    res.json({ message: "Resource updated successfully", resource: populatedResource });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to update resource" });
  }
};

export const deleteResource = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    req.app.get("io")?.to("alerts").emit("resource:deleted", { id: resource._id });
    res.json({ message: "Resource deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete resource" });
  }
};
