import { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const disasterTypes = [
  ["flood", "Flood"],
  ["cyclone", "Cyclone"],
  ["earthquake", "Earthquake"],
  ["wildfire", "Wildfire"],
  ["heatwave", "Heatwave"],
  ["storm", "Storm"],
  ["landslide", "Landslide"],
  ["tsunami", "Tsunami"],
  ["industrial", "Industrial"],
  ["other", "Other"],
];

const severities = ["low", "medium", "high", "critical"];
const statuses = ["draft", "active", "escalated", "resolved", "archived"];
const urgencies = ["immediate", "expected", "future", "past"];
const certainties = ["observed", "likely", "possible", "unknown"];

export default function CreateAlertForm({ onCreated, selectedRegion }) {
  const { user } = useAuth();

  if (user?.role !== "admin") return null;

  const [form, setForm] = useState({
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
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
        coordinates: {
          type: "Point",
          coordinates: [selectedRegion.lng, selectedRegion.lat],
        },
      });

      if (onCreated) await onCreated();

      setForm({
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
      });
    } catch (err) {
      console.error("Create alert failed:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to create alert");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Alert operations</p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">Create New Alert</h2>
        <p className="mt-1 text-sm text-slate-500">Select a location on the map, then publish a structured disaster alert.</p>
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

        <textarea name="instructions" placeholder="Emergency instructions for affected people" value={form.instructions} onChange={handleChange} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />

        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          {selectedRegion ? `Selected coordinates: ${selectedRegion.lat.toFixed(5)}, ${selectedRegion.lng.toFixed(5)}` : "No alert location selected. Click the map above to set coordinates."}
        </div>

        <button type="submit" disabled={loading || !selectedRegion} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? "Creating..." : "Create Alert"}
        </button>
      </form>
    </div>
  );
}
