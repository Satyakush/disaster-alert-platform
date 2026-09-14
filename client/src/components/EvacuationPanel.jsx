import { useEffect, useState } from "react";
import { AlertTriangle, MapPin, Navigation, ShieldCheck } from "lucide-react";
import { fetchEvacuationGuidance, fetchNearestShelters } from "../api/evacuation";

export default function EvacuationPanel({ alert }) {
  const [guidance, setGuidance] = useState(null);
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!alert) {
      setGuidance(null);
      setShelters([]);
      return;
    }

    const coordinates = alert.coordinates?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      setGuidance(null);
      setShelters([]);
      setError("This alert does not have map coordinates, so nearby shelters cannot be calculated.");
      return;
    }

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [guidanceData, shelterData] = await Promise.all([
          fetchEvacuationGuidance({
            disasterType: alert.disasterType,
            severity: alert.severity,
          }),
          fetchNearestShelters({
            latitude: coordinates[1],
            longitude: coordinates[0],
            limit: 5,
            maxDistance: 25000,
          }),
        ]);
        setGuidance(guidanceData);
        setShelters(shelterData.shelters || []);
      } catch (err) {
        console.error(err);
        setError("Evacuation intelligence is temporarily unavailable.");
        setGuidance(null);
        setShelters([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [alert]);

  if (!alert) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
            <Navigation size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Evacuation intelligence</h2>
            <p className="text-sm text-slate-500">Select an alert below to see emergency guidance and nearby shelters.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Response guidance</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">{alert.title}</h2>
          <p className="mt-1 text-sm capitalize text-slate-500">{alert.disasterType} · {alert.severity} severity</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
          <AlertTriangle size={14} /> {alert.status}
        </span>
      </div>

      {loading ? (
        <div className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Calculating evacuation options...</div>
      ) : error ? (
        <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{error}</div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-red-600" />
              <h3 className="font-semibold text-slate-900">Emergency instructions</h3>
            </div>
            {guidance?.priorityInstruction && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
                {guidance.priorityInstruction}
              </div>
            )}
            <ul className="mt-3 space-y-2">
              {(guidance?.instructions || []).map((instruction) => (
                <li key={instruction} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{instruction}</li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-slate-700" />
              <h3 className="font-semibold text-slate-900">Nearest available shelters</h3>
            </div>
            {shelters.length === 0 ? (
              <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No available shelters were found within 25 km.</div>
            ) : (
              <div className="mt-3 space-y-3">
                {shelters.map((shelter) => (
                  <div key={shelter._id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{shelter.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{shelter.location}</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700">{shelter.status}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
                      <span>{formatDistance(shelter.distanceMeters)}</span>
                      <span>{shelter.availableCapacity} spaces available</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function formatDistance(meters) {
  if (!Number.isFinite(Number(meters))) return "Distance unavailable";
  const value = Number(meters);
  return value < 1000 ? `${Math.round(value)} m away` : `${(value / 1000).toFixed(1)} km away`;
}
