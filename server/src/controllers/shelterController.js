import Shelter from "../models/shelter.js";

export const getShelters = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const shelters = await Shelter.find(filter)
      .sort({ status: 1, name: 1 })
      .populate("createdBy", "name email role");

    return res.status(200).json({ count: shelters.length, shelters });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch shelters" });
  }
};

export const createShelter = async (req, res) => {
  try {
    const {
      name,
      location,
      coordinates,
      capacity,
      availableCapacity,
      status,
      facilities,
      contact,
    } = req.body;

    if (!name || !location || !coordinates || capacity === undefined || availableCapacity === undefined) {
      return res.status(400).json({
        message: "Name, location, coordinates, capacity, and available capacity are required",
      });
    }

    if (Number(availableCapacity) > Number(capacity)) {
      return res.status(400).json({ message: "Available capacity cannot exceed total capacity" });
    }

    const shelter = await Shelter.create({
      name,
      location,
      coordinates,
      capacity,
      availableCapacity,
      status,
      facilities,
      contact,
      createdBy: req.user.id,
    });

    await shelter.populate("createdBy", "name email role");
    const io = req.app.get("io");
    if (io) io.to("alerts").emit("shelter:created", shelter);

    return res.status(201).json({ message: "Shelter created successfully", shelter });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: "Failed to create shelter" });
  }
};

export const updateShelter = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "location",
      "coordinates",
      "capacity",
      "availableCapacity",
      "status",
      "facilities",
      "contact",
    ];
    const updates = Object.fromEntries(
      allowedFields
        .filter((field) => Object.prototype.hasOwnProperty.call(req.body, field))
        .map((field) => [field, req.body[field]])
    );

    const current = await Shelter.findById(req.params.id);
    if (!current) return res.status(404).json({ message: "Shelter not found" });

    const capacity = updates.capacity ?? current.capacity;
    const availableCapacity = updates.availableCapacity ?? current.availableCapacity;

    if (Number(availableCapacity) > Number(capacity)) {
      return res.status(400).json({ message: "Available capacity cannot exceed total capacity" });
    }

    const shelter = await Shelter.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "name email role");

    const io = req.app.get("io");
    if (io) io.to("alerts").emit("shelter:updated", shelter);

    return res.status(200).json({ message: "Shelter updated successfully", shelter });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: "Failed to update shelter" });
  }
};

export const deleteShelter = async (req, res) => {
  try {
    const shelter = await Shelter.findByIdAndDelete(req.params.id);
    if (!shelter) return res.status(404).json({ message: "Shelter not found" });

    const io = req.app.get("io");
    if (io) io.to("alerts").emit("shelter:deleted", { id: shelter._id });

    return res.status(200).json({ message: "Shelter deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete shelter" });
  }
};
