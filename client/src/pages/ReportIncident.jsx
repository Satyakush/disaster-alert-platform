import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import MapView from "../components/MapView";
import { createReport } from "../api/reports";

const disasterTypes = [
  "flood",
  "cyclone",
  "earthquake",
  "wildfire",
  "heatwave",
  "storm",
  "landslide",
  "tsunami",
  "industrial",
  "other",
];

export default function ReportIncident() {
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    disasterType: "flood",
    location: "",
    priority: "medium",
    mediaUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleLocation = (region) => {
    setLocation(region);
    setForm((current) => ({
      ...current,
      location: current.location || `${region.lat.toFixed(5)}, ${region.lng.toFixed(5)}`,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!location) {
      toast.error("Select the incident location on the map");
      return;
    }

    try {
      setSubmitting(true);
      await createReport({
        ...form,
        coordinates: {
          type: "Point",
          coordinates: [location.lng, location.lat],
        },
      });
      toast.success("Incident reported successfully");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit incident report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="platform-polished min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-400">Citizen safety</p>
          <h1 className="mt-2 text-3xl font-bold">Report an Incident</h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Send a verified-location incident report to help responders understand what is happening on the ground.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="mb-3 text-lg font-semibold">Incident location</h2>
            <MapView onRegionSelect={handleLocation} />
            {location && (
              <div className="mt-3 rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-300">
                Selected: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </div>
            )}
          </section>

          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Incident title</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                maxLength={160}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
                placeholder="Flooding near residential area"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Disaster type</label>
              <select
                name="disasterType"
                value={form.disasterType}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
              >
                {disasterTypes.map((type) => (
                  <option key={type} value={type}>{type.replace("wildfire", "wildfire").replace("heatwave", "heatwave")}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Location name</label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
                placeholder="Area, landmark, road, or neighborhood"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Priority</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                maxLength={2000}
                rows={5}
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
                placeholder="Describe what you observed, affected areas, and any immediate danger."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Evidence URL (optional)</label>
              <input
                name="mediaUrl"
                type="url"
                value={form.mediaUrl}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
                placeholder="https://..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Incident Report"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
