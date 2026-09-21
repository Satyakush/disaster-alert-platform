import { useState } from "react";
import api from "../api/axios";
import { analyzeRisk } from "../api/risk";
import { useAuth } from "../context/AuthContext";

const disasterTypes = [["flood", "Flood"], ["cyclone", "Cyclone"], ["earthquake", "Earthquake"], ["wildfire", "Wildfire"], ["heatwave", "Heatwave"], ["storm", "Storm"], ["landslide", "Landslide"], ["tsunami", "Tsunami"], ["industrial", "Industrial"], ["other", "Other"]];
const severities = ["low", "medium", "high", "critical"];
const statuses = ["draft", "active", "escalated", "resolved", "archived"];
const urgencies = ["immediate", "expected", "future", "past"];
const certainties = ["observed", "likely", "possible", "unknown"];
const severityDefaults = { low: { intensity: 25, probability: 25 }, medium: { intensity: 45, probability: 45 }, high: { intensity: 70, probability: 70 }, critical: { intensity: 90, probability: 90 } };

const initialForm = {
  title: "",
  description: "",
  disasterType: "",
  severity: "medium",
  status: "active",
  location: "",
  radius: 3000,
  urgency: "immediate",
  certainty: "observed",
  instructions: "",
  impact: { population: 0, households: 0, hospitals: 0, schools: 0, evacuationCenters: 0, roadsKm: 0, estimatedDamage: 0 },
};

export default function CreateAlertForm({ onCreated, selectedRegion }) {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [riskInputs, setRiskInputs] = useState({ intensity: 0, probability: 0, exposure: 0, vulnerability: 0, historicalRisk: 0 });
  const [riskResult, setRiskResult] = useState(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (user?.role !== "admin") return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "severity" && severityDefaults[value]) setRiskInputs((current) => ({ ...current, ...severityDefaults[value] }));
  };

  const handleImpactChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, impact: { ...prev.impact, [name]: value } }));
  };

  const updateRisk = (field, value) => setRiskInputs((current) => ({ ...current, [field]: Number(value) }));

  const assessRisk = async () => {
    if (!selectedRegion) {
      setRiskError("Select the alert location on the map first");
      return;
    }
    setRiskLoading(true);
    setRiskError("");
    try {
      const result = await analyzeRisk({ ...selectedRegion, exposure: riskInputs.exposure, vulnerability: riskInputs.vulnerability, historicalRisk: riskInputs.historicalRisk }, { type: form.disasterType || "other", intensity: riskInputs.intensity, probability: riskInputs.probability });
      setRiskResult(result);
    } catch (err) {
      console.error("Alert risk assessment failed:", err);
      setRiskResult(null);
      setRiskError(err.response?.data?.message || "Risk analysis service unavailable");
    } finally {
      setRiskLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!selectedRegion) {
      setError("Select the alert location on the map before creating the alert");
      return;
    }

    setLoading(true);
    try {
      await api.post("/alerts", {
        ...form,
        radius: Number(form.radius),
        instructions: form.instructions ? form.instructions.split("\n").map((item) => item.trim()).filter(Boolean) : [],
        impact: Object.fromEntries(Object.entries(form.impact).map(([key, value]) => [key, Number(value)])),
        coordinates: { type: "Point", coordinates: [selectedRegion.lng, selectedRegion.lat] },
        risk: riskResult ? { score: riskResult.riskScore, level: riskResult.riskLevel, confidence: riskResult.confidence, factors: riskResult.factors } : undefined,
      });
      if (onCreated) await onCreated();
      setForm(initialForm);
      setRiskInputs({ intensity: 0, probability: 0, exposure: 0, vulnerability: 0, historicalRisk: 0 });
      setRiskResult(null);
    } catch (err) {
      console.error("Create alert failed:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to create alert");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ui-command-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-red-50 p-2.5 text-red-600">🚨</div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">Alert operations</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Create New Alert</h2>
            <p className="mt-1 text-sm text-slate-500">Select a location on the map, assess the hazard scenario, then publish a structured disaster alert.</p>
          </div>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <input type="text" name="title" placeholder="Alert title" value={form.title} onChange={handleChange} required className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          <input type="text" name="location" placeholder="Location name" value={form.location} onChange={handleChange} required className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
        </div>

        <textarea name="description" placeholder="Describe the hazard, expected impact, and affected area" value={form.description} onChange={handleChange} required rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <select name="disasterType" value={form.disasterType} onChange={handleChange} required className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400">
            <option value="">Disaster type</option>
            {disasterTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select name="severity" value={form.severity} onChange={handleChange} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400">
            {severities.map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)} severity</option>)}
          </select>
          <select name="status" value={form.status} onChange={handleChange} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400">
            {statuses.map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)} status</option>)}
          </select>
          <input type="number" name="radius" min="100" max="100000" step="100" value={form.radius} onChange={handleChange} placeholder="Radius in meters" required className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <select name="urgency" value={form.urgency} onChange={handleChange} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400">
            {urgencies.map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)} urgency</option>)}
          </select>
          <select name="certainty" value={form.certainty} onChange={handleChange} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400">
            {certainties.map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)} certainty</option>)}
          </select>
        </div>

        <textarea name="instructions" placeholder="Emergency instructions, one instruction per line" value={form.instructions} onChange={handleChange} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />

        <div className="ui-intelligence-panel rounded-2xl border border-cyan-100 bg-cyan-50/40 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">AI risk assessment</h3>
              <p className="text-xs text-slate-500">Calculate explainable risk before publishing this alert.</p>
            </div>
            <button type="button" onClick={assessRisk} disabled={riskLoading || !selectedRegion || !form.disasterType} className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50">{riskLoading ? "Assessing..." : "Assess risk"}</button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[["intensity", "Intensity"], ["probability", "Probability"], ["exposure", "Exposure"], ["vulnerability", "Vulnerability"], ["historicalRisk", "Historical risk"]].map(([name, label]) => (
              <label key={name} className="text-xs font-medium text-slate-600">
                {label}
                <div className="mt-1 flex items-center gap-2">
                  <input type="range" min="0" max="100" value={riskInputs[name]} onChange={(event) => updateRisk(name, event.target.value)} className="w-full" />
                  <span className="w-7 text-right font-semibold text-slate-800">{riskInputs[name]}</span>
                </div>
              </label>
            ))}
          </div>
          {riskError && <p className="mt-3 text-xs text-red-600">{riskError}</p>}
          {riskResult && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-white p-3"><p className="text-[11px] uppercase text-slate-400">Risk score</p><p className="mt-1 text-xl font-bold text-slate-900">{riskResult.riskScore}/100</p></div>
              <div className="rounded-lg bg-white p-3"><p className="text-[11px] uppercase text-slate-400">Risk level</p><p className="mt-1 text-xl font-bold capitalize text-slate-900">{riskResult.riskLevel}</p></div>
              <div className="rounded-lg bg-white p-3"><p className="text-[11px] uppercase text-slate-400">Confidence</p><p className="mt-1 text-xl font-bold text-slate-900">{Math.round((riskResult.confidence || 0) * 100)}%</p></div>
            </div>
          )}
        </div>

        <div className="ui-section-panel rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-slate-800">Impact & infrastructure estimate</h3>
            <p className="text-xs text-slate-500">Record the estimated exposure for this alert.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[["population", "Population"], ["households", "Households"], ["hospitals", "Hospitals"], ["schools", "Schools"], ["evacuationCenters", "Evacuation centers"], ["roadsKm", "Roads affected (km)"], ["estimatedDamage", "Estimated damage"]].map(([name, label]) => (
              <label key={name} className="text-xs font-medium text-slate-500">
                {label}
                <input type="number" min="0" step="0.1" name={name} value={form.impact[name]} onChange={handleImpactChange} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-500" />
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{selectedRegion ? `Selected coordinates: ${selectedRegion.lat.toFixed(5)}, ${selectedRegion.lng.toFixed(5)}` : "No alert location selected. Click the map above to set coordinates."}</div>
        <button type="submit" disabled={loading || !selectedRegion} className="ui-primary-action rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Creating..." : "Create Alert"}</button>
      </form>
    </div>
  );
}
