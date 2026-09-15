import User from "../models/user.js";
import ResponseTask from "../models/responseTask.js";
import Resource from "../models/resource.js";

const publicUserFields = "name email role createdAt";

export const getResponseTeam = async (req, res) => {
  try {
    const members = await User.find({ role: { $in: ["responder", "admin"] } })
      .select(publicUserFields)
      .sort({ role: 1, name: 1 });

    res.json({ members });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load response team" });
  }
};

export const getAssignableUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" })
      .select(publicUserFields)
      .sort({ name: 1 });

    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load eligible users" });
  }
};

export const assignResponderRole = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Admin role cannot be changed here" });
    }

    if (user.role === "responder") {
      return res.status(400).json({ message: "User is already a responder" });
    }

    user.role = "responder";
    await user.save();

    res.json({
      message: "Responder role assigned",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to assign responder role" });
  }
};

export const revokeResponderRole = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "responder") {
      return res.status(400).json({ message: "User is not a responder" });
    }

    const [activeTasks, assignedResources] = await Promise.all([
      ResponseTask.countDocuments({ responder: id, status: { $in: ["assigned", "acknowledged", "in_progress"] } }),
      Resource.countDocuments({ assignedResponder: id, status: { $in: ["available", "deployed"] } }),
    ]);

    if (activeTasks || assignedResources) {
      return res.status(409).json({ message: "Cannot revoke responder role while active tasks or resources are assigned" });
    }

    user.role = "user";
    await user.save();

    res.json({
      message: "Responder role revoked",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to revoke responder role" });
  }
};
