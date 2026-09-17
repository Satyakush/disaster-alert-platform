import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, BellRing, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fetchAlerts } from "../api/alerts";
import { fetchReports } from "../api/reports";
import { fetchShelters } from "../api/shelters";
import { fetchInfrastructure } from "../api/infrastructure";
import { analyzeRisk } from "../api/risk";
import { connectToAlerts, disconnectFromAlerts, socket } from "../api/socket";
import Navbar from "../components/Navbar";
import MapView from "../components/MapView";
import CreateAlertForm from "../components/createAlertForm";
import ShelterManagement from "../components/ShelterManagement";
import AlertCard from "../components/AlertCard";
import EvacuationPanel from "../components/EvacuationPanel";

const hazards = [["flood", "Flood"], ["cyclone", "Cyclone"], ["earthquake", "Earthquake"], ["wildfire", "Wildfire"], ["heatwave", "Heatwave"], ["storm", "Storm"], ["landslide", "Landslide"], ["tsunami", "Tsunami"], ["industrial", "Industrial"], ["other", "Other"]];
const riskStyles = { low: "bg-emerald-50 text-emerald-700 border-emerald-200", medium: "bg-amber-50 text-amber-700 border-amber-200", high: "bg-orange-50 text-orange-700 border-orange-200", critical: "bg-red-50 text-red-700 border-red-200" };
const severityDefaults = { low: { intensity: 25, probability: 25 }, medium: { intensity: 45, probability: 45 }, high: { intensity: 70, probability: 70 }, critical: { intensity: 90, probability: 90 } };
const urgencyProbability = { immediate: 95, expected: 75, future: 55, past: 20 };
const certaintyProbability = { observed: 95, likely: 75, possible: 50, unknown: 25 };

function distanceKm(first, second) {
  const lat1 = Number(first?.lat);
  const lon1 = Number(first?.lng);
  const lat2 = Number(second?.lat);
  const lon2 = Number(second?.lng);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return Infinity;
  const radius = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

function currentSignalFromAlert(alert) {
  if (!alert) return null;
  const severity = severityDefaults[alert.severity] || severityDefaults.medium;
  const urgency = urgencyProbability[alert.urgency] ?? 50;
  const certainty = certaintyProbability[alert.certainty] ?? 50;
  return {
    type: alert.disasterType || "other",
    intensity: severity.intensity,
    probability: Math.round((urgency + certainty) / 2),
    exposure: impactExposure(alert),
    vulnerability: impactVulnerability(alert),
    source: "active-alert",
    alertId: alert._id,
  };
}

function currentSignalFromReport(report) {
  if (!report) return null;
  const severity = severityDefaults[report.priority] || severityDefaults.medium;
  return {
    type: report.disasterType || report.type || "other",
    intensity: severity.intensity,
    probability: severity.probability,
    exposure: 0,
    vulnerability: 0,
    source: "verified-report",
    reportId: report._id,
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [alerts, setAlerts] = useState([]);
  const [reports, setReports] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [infrastructure, setInfrastructure] = useState([]);
  const [error, setError] = useState("");
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [route, setRoute] = useState(null);
  const [riskResult, setRiskResult] = useState(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState("");
  const [riskInputs, setRiskInputs] = useState({ type: "flood", intensity: 0, probability: 0, exposure: 0, vulnerability: 0, historicalRisk: 0 });
  const [filters, setFilters] = useState({ status: "", disasterType: "", severity: "" });

  const loadData = async () => {
    try {
      const [alertsData, reportsData, sheltersData, infrastructureData] = await Promise.all([fetchAlerts(), fetchReports({ status: "verified" }), fetchShelters({}), fetchInfrastructure()]);
      setAlerts(alertsData.alerts || []);
      setReports(reportsData.reports || []);
      setShelters(sheltersData.shelters || []);
      setInfrastructure(infrastructureData.infrastructure || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load disaster intelligence data");
    }
  };

  useEffect(() => {
    loadData();
    connectToAlerts();
    const handleCreated = (alert) => setAlerts((current) => [alert, ...current.filter((item) => item._id !== alert._id)]);
    const handleUpdated = (alert) => setAlerts((current) => current.map((item) => (item._id === alert._id ? alert : item)));
    const handleStatusChanged = (alert) => setAlerts((current) => current.map((item) => (item._id === alert._id ? alert : item)));
    const handleDeleted = ({ id }) => setAlerts((current) => current.filter((item) => item._id !== id));
    const handleShelterCreated = (shelter) => setShelters((current) => [shelter, ...current.filter((item) => item._id !== shelter._id)]);
    const handleShelterUpdated = (shelter) => setShelters((current) => current.map((item) => (item._id === shelter._id ? shelter : item)));
    const handleShelterDeleted = ({ id }) => setShelters((current) => current.filter((item) => item._id !== id));
    const handleInfrastructureCreated = (item) => setInfrastructure((current) => [item, ...current.filter((entry) => entry._id !== item._id)]);
    const handleInfrastructureUpdated = (item) => setInfrastructure((current) => current.map((entry) => (entry._id === item._id ? item : entry)));
    const handleInfrastructureDeleted = ({ id }) => setInfrastructure((current) => current.filter((item) => item._id !== id));
    socket.on("alert:created", handleCreated);
    socket.on("alert:updated", handleUpdated);
    socket.on("alert:status-changed", handleStatusChanged);
    socket.on("alert:deleted", handleDeleted);
    socket.on("shelter:created", handleShelterCreated);
    socket.on("shelter:updated", handleShelterUpdated);
    socket.on("shelter:deleted", handleShelterDeleted);
    socket.on("infrastructure:created", handleInfrastructureCreated);
    socket.on("infrastructure:updated", handleInfrastructureUpdated);
    socket.on("infrastructure:deleted", handleInfrastructureDeleted);
    return () => {
      socket.off("alert:created", handleCreated);
      socket.off("alert:updated", handleUpdated);
      socket.off("alert:status-changed", handleStatusChanged);
      socket.off("alert:deleted", handleDeleted);
      socket.off("shelter:created", handleShelterCreated);
      socket.off("shelter:updated", handleShelterUpdated);
      socket.off("shelter:deleted", handleShelterDeleted);
      socket.off("infrastructure:created", handleInfrastructureCreated);
      socket.off("infrastructure:updated", handleInfrastructureUpdated);
      socket.off("infrastructure:deleted", handleInfrastructureDeleted);
      disconnectFromAlerts();
    };
  }, []);

  const handleRegionSelect = (region) => {
    const radiusKm = Number(region.radius || 3000) / 1000;
    const nearbyAlerts = alerts.filter((alert) => alert.coordinates?.coordinates?.length === 2 && ["active", "escalated"].includes(alert.status)).map((alert) => {
      const [lng, lat] = alert.coordinates.coordinates;
      const alertRadiusKm = Math.max(Number(alert.radius) || 1500, 500) / 1000;
      const distance = distanceKm(region, { lat, lng });
      return { alert, distance, alertRadiusKm, overlaps: distance <= radiusKm + alertRadiusKm };
    }).filter((item) => item.overlaps).sort((a, b) => (a.distance - a.alertRadiusKm) - (b.distance - b.alertRadiusKm));
    const nearbyReports = reports.filter((report) => report.coordinates?.coordinates?.length === 2).map((report) => {
      const [lng, lat] = report.coordinates.coordinates;
      return { report, distance: distanceKm(region, { lat, lng }) };
    }).filter((item) => item.distance <= radiusKm).sort((a, b) => (severityDefaults[b.report.priority]?.intensity || 0) - (severityDefaults[a.report.priority]?.intensity || 0));
    const currentAlert = nearbyAlerts[0]?.alert || null;
    const currentReport = nearbyReports[0]?.report || null;
    const currentSignal = currentSignalFromAlert(currentAlert) || currentSignalFromReport(currentReport);
    setSelectedRegion(region);
    setSelectedAlert(currentAlert);
    setSelectedReport(currentReport);
    setRoute(null);
    setRiskResult(null);
    setRiskError("");
    if (currentSignal) {
      setRiskInputs((current) => ({ ...current, type: currentSignal.type, intensity: currentSignal.intensity, probability: currentSignal.probability, exposure: currentSignal.exposure, vulnerability: currentSignal.vulnerability, historicalRisk: 0 }));
    } else {
      setRiskInputs((current) => ({ ...current, intensity: 0, probability: 0, exposure: 0, vulnerability: 0, historicalRisk: 0 }));
    }
  };

  const applySeverityPreset = (severity) => {
    const values = severityDefaults[severity];
    if (!values) return;
    setRiskInputs((current) => ({ ...current, intensity: values.intensity, probability: values.probability }));
  };

  const analyzeSelectedRisk = async () => {
    if (!selectedRegion || riskLoading) return;
    setRiskLoading(true);
    setRiskError("");
    try {
      const currentSignal = selectedAlert ? currentSignalFromAlert(selectedAlert) : selectedReport ? currentSignalFromReport(selectedReport) : null;
      const region = { ...selectedRegion, exposure: riskInputs.exposure, vulnerability: riskInputs.vulnerability, historicalRisk: riskInputs.historicalRisk, currentSignal };
      const result = await analyzeRisk(region, { type: riskInputs.type, intensity: riskInputs.intensity, probability: riskInputs.probability, currentSignal });
      if (!result || typeof result !== "object") throw new Error("Risk service returned an empty response");
      setRiskResult(result);
      const factorValues = Object.fromEntries((Array.isArray(result.factors) ? result.factors : []).map((factor) => [factor.name, Number(factor.value) || 0]));
      setRiskInputs((current) => ({ ...current, intensity: factorValues.hazard_intensity ?? current.intensity, probability: factorValues.hazard_probability ?? current.probability, exposure: factorValues.exposure ?? current.exposure, vulnerability: factorValues.vulnerability ?? current.vulnerability, historicalRisk: factorValues.historical_risk ?? current.historicalRisk }));
    } catch (err) {
      console.error("Risk analysis failed:", err);
      setRiskResult(null);
      setRiskError(err.response?.data?.message || err.message || "Risk analysis service unavailable");
    } finally {
      setRiskLoading(false);
    }
  };

  const filteredAlerts = useMemo(() => alerts.filter((alert) => (!filters.status || alert.status === filters.status) && (!filters.disasterType || alert.disasterType === filters.disasterType) && (!filters.severity || alert.severity === filters.severity)), [alerts, filters]);
  const activeCount = alerts.filter((alert) => ["active", "escalated"].includes(alert.status)).length;
  const criticalCount = alerts.filter((alert) => alert.severity === "critical").length;
  const resolvedCount = alerts.filter((alert) => alert.status === "resolved").length;
  const riskLevel = riskResult?.riskLevel || "low";
  const riskScore = Number(riskResult?.riskScore || 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <section className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-red-600">EARLY WARNING CENTER</p><h1 className="text-3xl font-bold tracking-tight text-slate-900">Disaster Intelligence Dashboard</h1><p className="mt-1 text-sm text-slate-500">Detect hazards, assess risk, and respond faster.</p></div><div className="flex items-center gap-2 text-sm text-emerald-700"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Live monitoring connected</div></section>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatCard icon={BellRing} label="Total Alerts" value={alerts.length} /><StatCard icon={Activity} label="Active Alerts" value={activeCount} /><StatCard icon={ShieldAlert} label="Critical Alerts" value={criticalCount} /><StatCard icon={AlertTriangle} label="Resolved" value={resolvedCount} /></section>
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]"><MapView onRegionSelect={handleRegionSelect} alerts={alerts} reports={reports} shelters={shelters} infrastructure={infrastructure} route={route} /><RiskPanel selectedRegion={selectedRegion} riskInputs={riskInputs} setRiskInputs={setRiskInputs} onPreset={applySeverityPreset} onAnalyze={analyzeSelectedRisk} riskResult={riskResult} riskLoading={riskLoading} riskError={riskError} riskLevel={riskLevel} riskScore={riskScore} /></section>
        <EvacuationPanel alert={selectedAlert} region={selectedRegion} onRouteChange={setRoute} />
        {isAdmin && <CreateAlertForm onCreated={loadData} selectedRegion={selectedRegion} />}
        {isAdmin && <ShelterManagement shelters={shelters} selectedRegion={selectedRegion} onChanged={loadData} />}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-xl font-bold text-slate-900">Active intelligence feed</h2><p className="text-sm text-slate-500">Live alerts are updated automatically.</p></div><div className="grid grid-cols-1 gap-2 sm:grid-cols-3"><FilterSelect value={filters.status} onChange={(value) => setFilters({ ...filters, status: value })} options={["active", "escalated", "resolved", "archived", "draft"]} placeholder="All statuses" /><FilterSelect value={filters.disasterType} onChange={(value) => setFilters({ ...filters, disasterType: value })} options={hazards.map(([value]) => value)} placeholder="All hazards" /><FilterSelect value={filters.severity} onChange={(value) => setFilters({ ...filters, severity: value })} options={["low", "medium", "high", "critical"]} placeholder="All severity" /></div></div>{error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filteredAlerts.length === 0 ? <p className="text-sm text-slate-500">No alerts match the selected filters.</p> : filteredAlerts.map((alert) => <AlertCard key={alert._id} alert={alert} setAlerts={setAlerts} onSelect={() => setSelectedAlert(alert)} selected={selectedAlert?._id === alert._id} />)}</div></section>
      </main>
    </div>
  );
}

function RiskPanel({ selectedRegion, riskInputs, setRiskInputs, onPreset, onAnalyze, riskResult, riskLoading, riskError, riskLevel, riskScore }) {
  const update = (field, value) => setRiskInputs((current) => ({ ...current, [field]: Number(value) }));
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hybrid ML risk intelligence</p><h2 className="mt-1 text-xl font-bold text-slate-900">Scenario assessment</h2><p className="mt-1 text-xs text-slate-500">Historical risk comes from the trained model; current signals come from active alerts or verified reports in the selected radius.</p></div>{riskResult && <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${riskStyles[riskLevel] || riskStyles.low}`}>{riskLevel}</span>}</div><div className="mt-5 space-y-5"><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Hazard type<select value={riskInputs.type} onChange={(event) => setRiskInputs((current) => ({ ...current, type: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 capitalize outline-none focus:border-slate-400">{hazards.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm font-medium text-slate-700">Scenario preset<select defaultValue="baseline" onChange={(event) => event.target.value !== "baseline" && onPreset(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 capitalize outline-none focus:border-slate-400"><option value="baseline">Custom / baseline</option><option value="low">Low</option><option value="medium">Moderate</option><option value="high">High</option><option value="critical">Extreme</option></select></label></div><div className="grid gap-4 sm:grid-cols-2"><RangeField label="Hazard intensity" value={riskInputs.intensity} onChange={(value) => update("intensity", value)} /><RangeField label="Hazard probability" value={riskInputs.probability} onChange={(value) => update("probability", value)} /><RangeField label="Population exposure" value={riskInputs.exposure} onChange={(value) => update("exposure", value)} /><RangeField label="Vulnerability" value={riskInputs.vulnerability} onChange={(value) => update("vulnerability", value)} /><RangeField label="Historical risk (ML)" value={riskInputs.historicalRisk} onChange={() => {}} disabled /></div><button type="button" onClick={onAnalyze} disabled={!selectedRegion || riskLoading} className="w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">{riskLoading ? "Analyzing scenario..." : selectedRegion ? "Analyze risk scenario" : "Select an area to analyze"}</button>{riskError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{riskError}</div>}{riskLoading ? <div className="text-sm text-slate-500">Combining historical ML prediction with current scenario factors...</div> : riskResult ? <div className="space-y-5"><div><div className="flex items-end justify-between"><span className="text-sm text-slate-500">Final risk score</span><span className="text-3xl font-bold text-slate-900">{riskScore}<span className="text-base text-slate-400">/100</span></span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-slate-900 transition-all" style={{ width: `${Math.max(0, Math.min(100, riskScore))}%` }} /></div></div><div className="flex flex-wrap gap-2 text-xs text-slate-500"><span className="rounded-full bg-slate-100 px-2.5 py-1">ML confidence {Math.round(Number(riskResult.confidence || 0) * 100)}%</span><span className="rounded-full bg-slate-100 px-2.5 py-1">Historical prediction {riskResult.historicalPrediction || "-"}</span><span className="rounded-full bg-slate-100 px-2.5 py-1">Hazard {riskInputs.type}</span></div><div><p className="text-sm font-semibold text-slate-900">Risk factors</p><div className="mt-2 space-y-2">{(Array.isArray(riskResult.factors) ? riskResult.factors : []).map((factor) => <div key={factor.name} className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600"><div className="flex justify-between gap-3"><span>{String(factor.name || "factor").replaceAll("_", " ")}</span><strong>{Number(factor.value || 0).toFixed(0)}</strong></div><div className="mt-1 h-1.5 rounded-full bg-slate-200"><div className="h-1.5 rounded-full bg-slate-700" style={{ width: `${Math.max(0, Math.min(100, Number(factor.value) || 0))}%` }} /></div><div className="mt-1 flex justify-between text-[11px] text-slate-400"><span>{factor.source === "trained-model" ? "ML historical signal" : "Current signal"}</span><span>{Math.round(Number(factor.weight || 0) * 100)}% weight</span></div></div>)}</div></div><div><p className="text-sm font-semibold text-slate-900">Recommended actions</p><ul className="mt-2 space-y-2">{(Array.isArray(riskResult.recommendedActions) ? riskResult.recommendedActions : []).map((action) => <li key={action} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">{action}</li>)}</ul></div></div> : <p className="text-sm text-slate-500">Select an area on the map, set the current scenario, and run the hybrid AI risk assessment.</p>}</div></div>;
}

function RangeField({ label, value, onChange, disabled = false }) {
  return <label className={`text-sm text-slate-600 ${disabled ? "opacity-80" : ""}`}><div className="flex justify-between"><span>{label}</span><strong>{value}</strong></div><input type="range" min="0" max="100" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="mt-2 w-full" /></label>;
}

function StatCard({ icon: Icon, label, value }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold text-slate-900">{value}</p></div><div className="rounded-xl bg-slate-100 p-3 text-slate-700"><Icon size={20} /></div></div></div>;
}

function FilterSelect({ value, onChange, options, placeholder }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm capitalize outline-none focus:border-slate-400"><option value="">{placeholder}</option>{options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select>;
}
