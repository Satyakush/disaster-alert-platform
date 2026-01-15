import { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function CreateAlertForm({ onCreated }) {
  const { user } = useAuth();

  // UI-level admin safety (backend already enforces)
  if (user?.role !== "admin") return null;

  const [form, setForm] = useState({
    title: "",
    description: "",
    disasterType: "",
    severity: "low",
    location: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/alerts", form);

      // ✅ CRITICAL FIX — refresh alerts instantly
      if (onCreated) {
        await onCreated();
      }

      // Reset form
      setForm({
        title: "",
        description: "",
        disasterType: "",
        severity: "low",
        location: "",
      });
    } catch (err) {
      console.error(
        "Create alert failed:",
        err.response?.data || err.message
      );
      setError(
        err.response?.data?.message || "Failed to create alert"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">
        Create New Alert
      </h2>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <input
          type="text"
          name="title"
          placeholder="Alert Title"
          value={form.title}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2"
        />

        {/* Description */}
        <textarea
          name="description"
          placeholder="Alert Description"
          value={form.description}
          onChange={handleChange}
          required
          rows={3}
          className="w-full border rounded px-3 py-2"
        />

        {/* Disaster Type (ENUM SAFE) */}
        <select
          name="disasterType"
          value={form.disasterType}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Select Disaster Type</option>
          <option value="flood">Flood</option>
          <option value="earthquake">Earthquake</option>
          <option value="fire">Fire</option>
          <option value="cyclone">Cyclone</option>
          <option value="other">Other</option>
        </select>

        {/* Severity (ENUM SAFE) */}
        <select
          name="severity"
          value={form.severity}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        {/* Location */}
        <input
          type="text"
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Alert"}
        </button>
      </form>
    </div>
  );
}
