import api from "./axios";

function distanceKm(first, second) {
  const lat1 = Number(first?.lat);
  const lon1 = Number(first?.lng);
  const lat2 = Number(second?.lat);
  const lon2 = Number(second?.lng);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return Infinity;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function impactExposure(alert) {
  const population = Number(alert?.impact?.population) || 0;
  const households = Number(alert?.impact?.households) || 0;
  const hospitals = Number(alert?.impact?.hospitals) || 0;
  const schools = Number(alert?.impact?.schools) || 0;
  const roadsKm = Number(alert?.impact?.roadsKm) || 0;
  return Math.min(100, Math.round(population / 10000 + households / 2500 + hospitals * 4 + schools * 2 + roadsKm));
}

function impactVulnerability(alert) {
  const hospitals = Number(alert?.impact?.hospitals) || 0;
  const schools = Number(alert?.impact?.schools) || 0;
  const roadsKm = Number(alert?.impact?.roadsKm) || 0;
  const evacuationCenters = Number(alert?.impact?.evacuationCenters) || 0;
  return Math.min(100, Math.round(hospitals * 8 + schools * 4 + roadsKm * 1.5 + Math.max(0, 20 - evacuationCenters * 2)));
}

const severityDefaults = { low: [25, 25], medium: [45, 45], high: [70, 70], critical: [90, 90] };
const urgencyProbability = { immediate: 95, expected: 75, future: 55, past: 20 };
const certaintyProbability = { observed: 95, likely: 75, possible: 50, unknown: 25 };

async function collectContext(region) {
  const [alertsResponse, reportsResponse, sheltersResponse, infrastructureResponse] = await Promise.all([
    api.get("/alerts"),
    api.get("/reports", { params: { status: "verified" } }),
    api.get("/shelters"),
    api.get("/infrastructure"),
  ]);
  const radiusKm = Math.max(0.5, Number(region?.radius || 3000) / 1000);
  const alerts = alertsResponse.data?.alerts || [];
  const reports = reportsResponse.data?.reports || [];
  const shelters = sheltersResponse.data?.shelters || [];
  const infrastructure = infrastructureResponse.data?.infrastructure || [];
  const nearbyAlerts = alerts.filter((alert) => alert.coordinates?.coordinates?.length === 2 && ["active", "escalated"].includes(alert.status)).map((alert) => {
    const [lng, lat] = alert.coordinates.coordinates;
    const alertRadiusKm = Math.max(0.5, Number(alert.radius) || 1500) / 1000;
    const distance = distanceKm(region, { lat, lng });
    return { alert, distance, overlaps: distance <= radiusKm + alertRadiusKm };
  }).filter((item) => item.overlaps).sort((a, b) => a.distance - b.distance).map(({ alert }) => alert);
  const nearbyReports = reports.filter((report) => report.coordinates?.coordinates?.length === 2).map((report) => {
    const [lng, lat] = report.coordinates.coordinates;
    return { report, distance: distanceKm(region, { lat, lng }) };
  }).filter((item) => item.distance <= radiusKm).sort((a, b) => (severityDefaults[b.report.priority]?.[0] || 0) - (severityDefaults[a.report.priority]?.[0] || 0)).map(({ report }) => report);
  const nearbyShelters = shelters.filter((shelter) => shelter.coordinates?.coordinates?.length === 2).map((shelter) => {
    const [lng, lat] = shelter.coordinates.coordinates;
    return { shelter, distance: distanceKm(region, { lat, lng }) };
  }).filter((item) => item.distance <= radiusKm).map(({ shelter }) => shelter);
  const nearbyInfrastructure = infrastructure.filter((item) => item.coordinates?.coordinates?.length === 2).map((item) => {
    const [lng, lat] = item.coordinates.coordinates;
    return { item, distance: distanceKm(region, { lat, lng }) };
  }).filter((entry) => entry.distance <= radiusKm).map(({ item }) => item);
  const alert = nearbyAlerts[0];
  const alertSeverity = severityDefaults[alert?.severity] || severityDefaults.medium;
  const currentSignal = alert ? {
    type: alert.disasterType || "other",
    intensity: alertSeverity[0],
    probability: Math.round(((urgencyProbability[alert.urgency] ?? 50) + (certaintyProbability[alert.certainty] ?? 50)) / 2),
    exposure: impactExposure(alert),
    vulnerability: impactVulnerability(alert),
    source: "active-alert",
    alertId: alert._id,
  } : nearbyReports[0] ? {
    type: nearbyReports[0].disasterType || nearbyReports[0].type || "other",
    intensity: severityDefaults[nearbyReports[0].priority]?.[0] || 45,
    probability: severityDefaults[nearbyReports[0].priority]?.[1] || 45,
    exposure: 0,
    vulnerability: 0,
    source: "verified-report",
    reportId: nearbyReports[0]._id,
  } : null;
  return { nearbyAlerts, nearbyReports, nearbyShelters, nearbyInfrastructure, currentSignal };
}

export const analyzeRisk = async (region, hazard = {}) => {
  const context = await collectContext(region);
  const effectiveSignal = region?.currentSignal || hazard?.currentSignal || context.currentSignal;
  const enrichedRegion = { ...region, ...context, currentSignal: effectiveSignal };
  const enrichedHazard = { ...hazard, currentSignal: effectiveSignal };
  const res = await api.post("/risk/analyze", { region: enrichedRegion, hazard: enrichedHazard });
  return res.data;
};
