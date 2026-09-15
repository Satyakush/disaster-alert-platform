import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, MapPin, Navigation, Route, ShieldCheck } from "lucide-react";
import { fetchEvacuationGuidance, fetchEvacuationRoute, fetchNearestShelters } from "../api/evacuation";

export default function EvacuationPanel({ alert, region, onRouteChange }) {
  const [guidance, setGuidance] = useState(null);
  const [shelters, setShelters] = useState([]);
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [error, setError] = useState("");
  const [routeError, setRouteError] = useState("");

  const intelligence = useMemo(() => {
    if (alert) {
      return {
        title: alert.title || "Disaster alert",
        disasterType: alert.disasterType || "flood",
        severity: alert.severity || "medium",
        status: alert.status || "active",
        coordinates: alert.coordinates?.coordinates,
      };
    }

    if (region) {
      return {
        title: "Selected location",
        disasterType: "flood",
        severity: "medium",
        status: "location assessment",
        coordinates: [region.lng, region.lat],
      };
    }

    return null;
  }, [alert, region]);

  useEffect(() => {
    if (!intelligence) {
      setGuidance(null);
      setShelters([]);
      setSelectedShelter(null);
      setRoute(null);
      setError("");
      setRouteError("");
      onRouteChange?.(null);
      return;
    }

    const coordinates = intelligence.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      setGuidance(null);
      setShelters([]);
      setSelectedShelter(null);
      setRoute(null);
      setError("This location does not have valid map coordinates, so nearby shelters cannot be calculated.");
      setRouteError("");
      onRouteChange?.(null);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError("");
      setRouteError("");
      setRoute(null);
      setSelectedShelter(null);
      onRouteChange?.(null);

      try {
        const [guidanceData, shelterData] = await Promise.all([
          fetchEvacuationGuidance({ disasterType: intelligence.disasterType, severity: intelligence.severity }),
          fetchNearestShelters({ latitude: coordinates[1], longitude: coordinates[0], limit: 5, maxDistance: 25000 }),
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
  }, [intelligence, onRouteChange]);

  const handleRoute = async (shelter) => {
    const origin = intelligence?.coordinates;
    const destination = shelter?.coordinates?.coordinates;
    if (!Array.isArray(origin) || origin.length !== 2 || !Array.isArray(destination) || destination.length !== 2) return;

    setSelectedShelter(shelter);
    setRouteLoading(true);
    setRouteError("");

    try {
      const routeData = await fetchEvacuationRoute({
        originLatitude: origin[1],
        originLongitude: origin[0],
        destinationLatitude: destination[1],
        destinationLongitude: destination[0],
      });
      setRoute(routeData);
      onRouteChange?.(routeData);
    } catch (err) {
      console.error(err);
      setRoute(null);
      onRouteChange?.(null);
      setRouteError("No road route could be calculated for this shelter.");
    } finally {
      setRouteLoading(false);
    }
  };

  if (!intelligence) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-100 p-2 text-slate-600"><Navigation size={20} /></div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Evacuation intelligence</h2>
            <p className="text-sm text-slate-500">Select an alert or click a location on the map to calculate emergency guidance and nearby shelters.</p>
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
          <h2 className="mt-1 text-xl font-bold text-slate-900">{intelligence.title}</h2>
          <p className="mt-1 text-sm capitalize text-slate-500">{intelligence.disasterType} · {intelligence.severity} severity</p>
          {!alert && <p className="mt-1 text-xs text-blue-600">Using the selected map location as your evacuation origin.</p>}
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold capitalize text-red-700"><AlertTriangle size={14} /> {intelligence.status}</span>
      </div>

      {loading ? (
        <div className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Calculating evacuation options...</div>
      ) : error ? (
        <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{error}</div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-red-600" /><h3 className="font-semibold text-slate-900">Emergency instructions</h3></div>
            {guidance?.priorityInstruction && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">{guidance.priorityInstruction}</div>}
            <ul className="mt-3 space-y-2">{(guidance?.instructions || []).map((instruction) => <li key={instruction} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{instruction}</li>)}</ul>
          </div>

          <div>
            <div className="flex items-center gap-2"><MapPin size={18} className="text-slate-700" /><h3 className="font-semibold text-slate-900">Nearest available shelters</h3></div>
            {shelters.length === 0 ? (
              <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No available shelters were found within 25 km.</div>
            ) : (
              <div className="mt-3 space-y-3">
                {shelters.map((shelter) => {
                  const isSelected = selectedShelter?._id === shelter._id;
                  return (
                    <div key={shelter._id} className={`rounded-xl border p-4 ${isSelected ? "border-blue-300 bg-blue-50/40" : "border-slate-200"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div><p className="font-semibold text-slate-900">{shelter.name}</p><p className="mt-1 text-xs text-slate-500">{shelter.location}</p></div>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700">{shelter.status}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-3 text-xs text-slate-600"><span>{formatDistance(shelter.distanceMeters)}</span><span>{shelter.availableCapacity} spaces available</span></div>
                        <button onClick={() => handleRoute(shelter)} disabled={routeLoading && isSelected} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"><Route size={14} />{routeLoading && isSelected ? "Routing..." : "Show safe route"}</button>
                      </div>
                      {isSelected && route && <div className="mt-3 rounded-lg bg-white p-3 text-xs text-slate-700"><div className="flex items-start gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" /><div><p className="font-semibold">{formatDistance(route.distanceMeters)} · {formatDuration(route.durationSeconds)}</p><p className="mt-1 text-slate-500">{route.advisory}</p>{route.hazardsOnRoute?.length > 0 && <p className="mt-2 font-medium text-amber-700">Hazard exposure: {route.hazardsOnRoute.map((hazard) => `${hazard.severity} ${hazard.disasterType}`).join(", ")}</p>}</div></div></div>}
                    </div>
                  );
                })}
              </div>
            )}
            {routeError && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">{routeError}</p>}
            <p className="mt-3 text-[11px] leading-5 text-slate-400">Routes are calculated from the available road network and active hazard data at calculation time. They are navigation assistance, not authoritative emergency evacuation orders.</p>
          </div>
        </div>
      )}
    </section>
  );
}

function formatDistance(meters) {
  const value = Number(meters);
  if (!Number.isFinite(value)) return "Distance unavailable";
  return value < 1000 ? `${Math.round(value)} m away` : `${(value / 1000).toFixed(1)} km away`;
}

function formatDuration(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value)) return "Duration unavailable";
  const minutes = Math.round(value / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
