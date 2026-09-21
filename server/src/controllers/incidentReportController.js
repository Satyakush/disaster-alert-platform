import IncidentReport from "../models/incidentReport.js";
import Alert from "../models/alert.js";

const priorityToSeverity = {
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
};

const emitAlertEvent = (req, event, payload) => {
  const io = req.app.get("io");
  if (io) io.to("alerts").emit(event, payload);
};

const emitUserReportEvent = (req, userId, event, payload) => {
  const io = req.app.get("io");
  if (io && userId) io.to(`user:${userId}`).emit(event, payload);
};

const emitAdminReportEvent = (req, event, payload) => {
  const io = req.app.get("io");
  if (io) io.to("admins").emit(event, payload);
};

export const createIncidentReport = async (req, res) => {
  try {
    const {
      title,
      description,
      disasterType,
      location,
      coordinates,
      priority,
      mediaUrl,
    } = req.body;

    if (!title || !description || !disasterType || !location || !coordinates) {
      return res.status(400).json({
        message: "Title, description, disaster type, location, and coordinates are required",
      });
    }

    const report = await IncidentReport.create({
      title,
      description,
      disasterType,
      location,
      coordinates,
      priority,
      mediaUrl,
      createdBy: req.user.id,
    });

    await report.populate("createdBy", "name email role");

    emitAdminReportEvent(req, "incident:created", {
      _id: report._id,
      title: report.title,
      disasterType: report.disasterType,
      priority: report.priority,
      status: report.status,
      createdAt: report.createdAt,
      createdBy: report.createdBy,
    });

    return res.status(201).json({
      message: "Incident report submitted successfully",
      report,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }

    console.error(error);
    return res.status(500).json({ message: "Failed to submit incident report" });
  }
};

export const getIncidentReports = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.disasterType) filter.disasterType = req.query.disasterType;
    if (req.query.priority) filter.priority = req.query.priority;

    const reports = await IncidentReport.find(filter)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email role")
      .populate("verifiedBy", "name email role")
      .populate("linkedAlert", "title severity status");

    return res.status(200).json({ count: reports.length, reports });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch incident reports" });
  }
};

export const getMyIncidentReports = async (req, res) => {
  try {
    const reports = await IncidentReport.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .populate("verifiedBy", "name email role")
      .populate("linkedAlert", "title severity status");

    return res.status(200).json({ count: reports.length, reports });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch your incident reports" });
  }
};

export const updateIncidentReportStatus = async (req, res) => {
  try {
    const { status, verificationNote } = req.body;
    const allowedStatuses = ["pending", "verified", "rejected"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid report status" });
    }

    const update = {
      status,
      verificationNote: verificationNote || undefined,
    };

    if (status === "verified" || status === "rejected") {
      update.verifiedBy = req.user.id;
      update.verifiedAt = new Date();
    } else {
      update.verifiedBy = null;
      update.verifiedAt = null;
    }

    const report = await IncidentReport.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    })
      .populate("createdBy", "name email role")
      .populate("verifiedBy", "name email role")
      .populate("linkedAlert", "title severity status");

    if (!report) {
      return res.status(404).json({ message: "Incident report not found" });
    }

    if (status === "verified" || status === "rejected") {
      emitUserReportEvent(req, report.createdBy?._id, "incident:status-updated", {
        _id: report._id,
        title: report.title,
        status: report.status,
        priority: report.priority,
        verificationNote: report.verificationNote || "",
        verifiedAt: report.verifiedAt,
        verifiedBy: report.verifiedBy,
      });
    }

    return res.status(200).json({
      message: "Incident report status updated successfully",
      report,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }

    console.error(error);
    return res.status(500).json({ message: "Failed to update incident report" });
  }
};

export const convertIncidentReportToAlert = async (req, res) => {
  try {
    const report = await IncidentReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Incident report not found" });
    }

    if (report.status !== "verified") {
      return res.status(400).json({ message: "Only verified reports can become alerts" });
    }

    if (report.linkedAlert) {
      return res.status(409).json({ message: "This report is already linked to an alert" });
    }

    const alert = await Alert.create({
      title: report.title,
      description: report.description,
      disasterType: report.disasterType,
      severity: priorityToSeverity[report.priority],
      status: "active",
      location: report.location,
      coordinates: report.coordinates,
      source: "citizen",
      urgency: report.priority === "critical" ? "immediate" : "expected",
      certainty: "observed",
      effectiveAt: new Date(),
      instructions: [],
      createdBy: req.user.id,
    });

    report.linkedAlert = alert._id;
    await report.save();

    await alert.populate("createdBy", "name email role");
    await report.populate("createdBy", "name email role");
    await report.populate("verifiedBy", "name email role");
    await report.populate("linkedAlert", "title severity status");

    emitAlertEvent(req, "alert:created", alert);

    emitUserReportEvent(req, report.createdBy?._id, "incident:converted", {
      _id: report._id,
      title: report.title,
      status: report.status,
      priority: report.priority,
      linkedAlert: report.linkedAlert,
    });

    return res.status(201).json({
      message: "Verified incident converted to alert successfully",
      alert,
      report,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }

    console.error(error);
    return res.status(500).json({ message: "Failed to convert incident report" });
  }
};
