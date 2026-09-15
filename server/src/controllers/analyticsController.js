import Alert from "../models/alert.js";
import IncidentReport from "../models/incidentReport.js";

const severityWeight = { low: 1, medium: 2, high: 4, critical: 7 };

const getStartDate = (days) => {
  const value = Math.min(Math.max(Number(days) || 30, 7), 3650);
  const start = new Date();
  start.setDate(start.getDate() - value);
  start.setHours(0, 0, 0, 0);
  return { start, days: value };
};

const buildHotspots = (alerts, reports) => {
  const cells = new Map();
  const cellSize = 0.05;

  const addPoint = (longitude, latitude, severity, disasterType, source) => {
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return;
    const key = `${Math.floor(longitude / cellSize)}:${Math.floor(latitude / cellSize)}`;
    const cell = cells.get(key) || {
      count: 0,
      severityScore: 0,
      longitudeTotal: 0,
      latitudeTotal: 0,
      types: {},
      sources: {},
    };
    cell.count += 1;
    cell.severityScore += severityWeight[severity] || 1;
    cell.longitudeTotal += longitude;
    cell.latitudeTotal += latitude;
    cell.types[disasterType || "other"] = (cell.types[disasterType || "other"] || 0) + 1;
    cell.sources[source || "unknown"] = (cell.sources[source || "unknown"] || 0) + 1;
    cells.set(key, cell);
  };

  alerts.forEach((alert) => {
    const coordinates = alert.coordinates?.coordinates;
    if (coordinates?.length === 2) addPoint(coordinates[0], coordinates[1], alert.severity, alert.disasterType, "alert");
  });

  reports.forEach((report) => {
    const coordinates = report.coordinates?.coordinates;
    if (coordinates?.length === 2) addPoint(coordinates[0], coordinates[1], report.priority, report.disasterType, "citizen_report");
  });

  return [...cells.values()]
    .filter((cell) => cell.count >= 2)
    .map((cell) => {
      const dominantType = Object.entries(cell.types).sort((a, b) => b[1] - a[1])[0]?.[0] || "other";
      const avgSeverity = cell.severityScore / cell.count;
      const level = avgSeverity >= 6 ? "critical" : avgSeverity >= 3.5 ? "high" : avgSeverity >= 2 ? "medium" : "low";
      return {
        count: cell.count,
        level,
        dominantType,
        sources: cell.sources,
        coordinates: {
          longitude: Number((cell.longitudeTotal / cell.count).toFixed(5)),
          latitude: Number((cell.latitudeTotal / cell.count).toFixed(5)),
        },
      };
    })
    .sort((a, b) => (b.count * severityWeight[b.level]) - (a.count * severityWeight[a.level]))
    .slice(0, 20);
};

export const getAnalyticsOverview = async (req, res) => {
  try {
    const { start, days } = getStartDate(req.query.days);
    const dateFilter = { createdAt: { $gte: start } };

    const [alerts, reports, byDisasterType, bySeverity, trend] = await Promise.all([
      Alert.find(dateFilter).select("disasterType severity status coordinates risk actualOutcome createdAt").lean(),
      IncidentReport.find(dateFilter).select("disasterType priority status coordinates createdAt").lean(),
      Alert.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$disasterType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Alert.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$severity", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Alert.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            alerts: { $sum: 1 },
            critical: { $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] } },
            high: { $sum: { $cond: [{ $eq: ["$severity", "high"] }, 1, 0] } },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

    const statusCounts = alerts.reduce((acc, alert) => {
      acc[alert.status] = (acc[alert.status] || 0) + 1;
      return acc;
    }, {});

    const outcomeAlerts = alerts.filter((alert) => alert.risk?.level && alert.actualOutcome?.severity);
    const matchedOutcomes = outcomeAlerts.filter((alert) => alert.risk.level === alert.actualOutcome.severity);
    const predictionAccuracy = outcomeAlerts.length ? Number(((matchedOutcomes.length / outcomeAlerts.length) * 100).toFixed(1)) : null;

    const averageConfidenceValues = alerts.map((alert) => alert.risk?.confidence).filter((value) => Number.isFinite(value));
    const averageConfidence = averageConfidenceValues.length
      ? Number((averageConfidenceValues.reduce((sum, value) => sum + value, 0) / averageConfidenceValues.length * 100).toFixed(1))
      : null;

    const hotspots = buildHotspots(alerts, reports);

    res.json({
      period: { days, start, end: new Date() },
      totals: {
        alerts: alerts.length,
        activeAlerts: alerts.filter((alert) => ["active", "escalated"].includes(alert.status)).length,
        resolvedAlerts: alerts.filter((alert) => ["resolved", "archived"].includes(alert.status)).length,
        citizenReports: reports.length,
        verifiedReports: reports.filter((report) => report.status === "verified").length,
      },
      statusCounts,
      byDisasterType: byDisasterType.map((item) => ({ disasterType: item._id, count: item.count })),
      bySeverity: bySeverity.map((item) => ({ severity: item._id, count: item.count })),
      trend: trend.map((item) => ({
        year: item._id.year,
        month: item._id.month,
        alerts: item.alerts,
        high: item.high,
        critical: item.critical,
      })),
      predictionEvaluation: {
        evaluatedAlerts: outcomeAlerts.length,
        matchedSeverity: matchedOutcomes.length,
        accuracy: predictionAccuracy,
        averageRiskConfidence: averageConfidence,
      },
      hotspots,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to generate analytics" });
  }
};
