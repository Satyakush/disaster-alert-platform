import Alert from "../models/alert.js";

const getRoutingServiceUrl = () => (process.env.ROUTING_SERVICE_URL || "https://router.project-osrm.org").replace(/\/$/, "");
const severityWeight = { low: 1, medium: 2, high: 4, critical: 7 };
const toRadians = (value) => (value * Math.PI) / 180;

const distanceMeters = (latitudeA, longitudeA, latitudeB, longitudeB) => {
  const earthRadius = 6371000;
  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);
  const a = Math.sin(deltaLatitude / 2) ** 2 + Math.cos(toRadians(latitudeA)) * Math.cos(toRadians(latitudeB)) * Math.sin(deltaLongitude / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getRouteHazardExposure = (route, hazards) => {
  const points = route.geometry?.coordinates || [];
  if (points.length === 0 || hazards.length === 0) return { score: 0, hazards: [], warning: false };

  let score = 0;
  const exposed = [];

  hazards.forEach((hazard) => {
    const [hazardLongitude, hazardLatitude] = hazard.coordinates.coordinates;
    const radius = Math.max(Number(hazard.radius) || 1500, 500);
    let affectedPoints = 0;

    points.forEach(([longitude, latitude]) => {
      if (distanceMeters(latitude, longitude, hazardLatitude, hazardLongitude) <= radius) affectedPoints += 1;
    });

    if (affectedPoints > 0) {
      const coverage = affectedPoints / points.length;
      const weight = severityWeight[hazard.severity] || 1;
      score += coverage * weight * 100;
      exposed.push({ id: hazard._id, title: hazard.title, disasterType: hazard.disasterType, severity: hazard.severity, coverage: Math.round(coverage * 100) });
    }
  });

  return { score, hazards: exposed, warning: exposed.length > 0 };
};

const formatSteps = (route) => (route.legs?.[0]?.steps || []).map((step) => ({
  distanceMeters: Math.round(step.distance),
  durationSeconds: Math.round(step.duration),
  instruction: step.maneuver?.instruction || `${step.maneuver?.type || "Continue"} on ${step.name || "the road"}`,
}));

export const getEvacuationRoute = async (req, res) => {
  try {
    const originLatitude = Number(req.query.originLatitude);
    const originLongitude = Number(req.query.originLongitude);
    const destinationLatitude = Number(req.query.destinationLatitude);
    const destinationLongitude = Number(req.query.destinationLongitude);
    const values = [originLatitude, originLongitude, destinationLatitude, destinationLongitude];

    if (values.some((value) => !Number.isFinite(value)) || originLatitude < -90 || originLatitude > 90 || destinationLatitude < -90 || destinationLatitude > 90 || originLongitude < -180 || originLongitude > 180 || destinationLongitude < -180 || destinationLongitude > 180) {
      return res.status(400).json({ message: "Valid origin and destination coordinates are required" });
    }

    const coordinates = `${originLongitude},${originLatitude};${destinationLongitude},${destinationLatitude}`;
    const url = `${getRoutingServiceUrl()}/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true&alternatives=true`;
    const response = await fetch(url);
    if (!response.ok) return res.status(502).json({ message: "Routing service returned an error" });

    const data = await response.json();
    const candidates = data.routes || [];
    if (candidates.length === 0) return res.status(404).json({ message: "No drivable route found" });

    const hazards = await Alert.find({ status: { $in: ["active", "escalated"] }, coordinates: { $exists: true } }).select("title disasterType severity radius coordinates").lean();
    const evaluated = candidates.map((candidate) => ({ route: candidate, exposure: getRouteHazardExposure(candidate, hazards) }));
    const fastest = evaluated.reduce((best, current) => current.route.duration < best.route.duration ? current : best, evaluated[0]);

    evaluated.sort((a, b) => a.exposure.score - b.exposure.score || a.route.duration - b.route.duration);
    const selected = evaluated[0];
    const hazardAvoided = selected !== fastest && selected.exposure.score < fastest.exposure.score;

    return res.status(200).json({
      provider: "OSRM",
      routingMode: "hazard-aware",
      distanceMeters: Math.round(selected.route.distance),
      durationSeconds: Math.round(selected.route.duration),
      geometry: selected.route.geometry,
      steps: formatSteps(selected.route),
      hazardExposureScore: Math.round(selected.exposure.score),
      hazardsOnRoute: selected.exposure.hazards,
      hazardWarning: selected.exposure.warning,
      alternativesEvaluated: evaluated.length,
      hazardAvoided,
      advisory: selected.exposure.warning
        ? "This route still intersects one or more active hazard zones. Follow official emergency instructions and local responder directions."
        : hazardAvoided
          ? "The selected route is longer than the fastest option but reduces exposure to active hazard zones detected by the platform."
          : "The selected route avoids the active hazard zones detected by the platform at calculation time. Conditions can change rapidly.",
    });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ message: "Evacuation route service is unavailable" });
  }
};
