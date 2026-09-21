import { MapContainer, TileLayer, Marker, Circle, Popup, Polyline, Pane, useMap, useMapEvents } from "react-leaflet";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { searchPlace } from "../api/geocode";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickHandler({ setRegion, setMarker }) {
  useMapEvents({
    click(e) {
      const point = [e.latlng.lat, e.latlng.lng];
      setMarker(point);
      setRegion({ lat: e.latlng.lat, lng: e.latlng.lng, radius: 3000 });
    },
  });
  return null;
}

function MapCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, Math.max(map.getZoom(), 10), { animate: true });
  }, [center, map]);
  return null;
}

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const refresh = () => requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    refresh();
    window.addEventListener("resize", refresh);
    const observer = new ResizeObserver(refresh);
    observer.observe(map.getContainer());
    return () => {
      window.removeEventListener("resize", refresh);
      observer.disconnect();
    };
  }, [map]);

  return null;
}

function RouteView({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length < 2) return;
    map.invalidateSize({ pan: false });
    const bounds = L.latLngBounds(positions);
    requestAnimationFrame(() => map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: true }));
  }, [map, positions]);

  if (positions.length < 2) return null;

  return (
    <Pane name="evacuationRoute" style={{ zIndex: 700 }}>
      <Polyline positions={positions} pathOptions={{ color: "#2563eb", weight: 8, opacity: 1, lineCap: "round", lineJoin: "round" }}>
        <Popup>Recommended evacuation route</Popup>
      </Polyline>
      <Marker position={positions[0]}><Popup>Evacuation origin</Popup></Marker>
      <Marker position={positions[positions.length - 1]}><Popup>Safe shelter destination</Popup></Marker>
    </Pane>
  );
}

export default function MapView({ onRegionSelect, alerts = [], reports = [], shelters = [], infrastructure = [], route = null }) {
  const [query, setQuery] = useState("");
  const [center, setCenter] = useState([22.7196, 75.8577]);
  const [marker, setMarker] = useState(null);
  const [region, setRegion] = useState(null);
  const [error, setError] = useState("");
  const onRegionSelectRef = useRef(onRegionSelect);

  useEffect(() => {
    onRegionSelectRef.current = onRegionSelect;
  }, [onRegionSelect]);

  useEffect(() => {
    if (region && onRegionSelectRef.current) onRegionSelectRef.current(region);
  }, [region]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      const results = await searchPlace(query.trim());
      if (!results.length) {
        setError("Location not found");
        return;
      }
      const place = results[0];
      const lat = parseFloat(place.lat);
      const lng = parseFloat(place.lon);
      setCenter([lat, lng]);
      setMarker([lat, lng]);
      setRegion({ lat, lng, radius: 3000 });
      setError("");
    } catch {
      setError("Search failed");
    }
  };

  const alertPoints = alerts.filter((alert) => alert.coordinates?.coordinates?.length === 2 && ["active", "escalated"].includes(alert.status));
  const reportPoints = reports.filter((report) => report.coordinates?.coordinates?.length === 2);
  const shelterPoints = shelters.filter((shelter) => shelter.coordinates?.coordinates?.length === 2);
  const infrastructurePoints = infrastructure.filter((item) => item.coordinates?.coordinates?.length === 2);
  const severityColors = { low: "#22c55e", medium: "#eab308", high: "#f97316", critical: "#ef4444" };
  const routePositions = route?.geometry?.type === "LineString" && Array.isArray(route.geometry.coordinates)
    ? route.geometry.coordinates.filter((point) => Array.isArray(point) && point.length >= 2 && Number.isFinite(Number(point[0])) && Number.isFinite(Number(point[1]))).map(([lng, lat]) => [lat, lng])
    : [];
  const selectedAlertCount = alertPoints.filter((alert) => {
    if (!region || alert.coordinates?.coordinates?.length !== 2) return false;
    const [lng, lat] = alert.coordinates.coordinates;
    const dLat = ((lat - region.lat) * Math.PI) / 180;
    const dLng = ((lng - region.lng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((region.lat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return distance <= Number(region.radius || 3000) / 1000 + Math.max(Number(alert.radius) || 1500, 500) / 1000;
  }).length;

  return (
    <div className="platform-map h-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Live geospatial intelligence</p>
          <h2 className="text-lg font-bold text-slate-900">Situation map</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" />Live</div>
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="Search city / area" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:bg-white" />
        <button type="button" onClick={handleSearch} className="rounded-xl bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">Search</button>
      </div>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      {region && <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600"><div className="mb-1 flex justify-between"><span>Assessment radius</span><span className="font-semibold text-slate-900">{region.radius / 1000} km</span></div><input type="range" min="1000" max="20000" step="500" value={region.radius} onChange={(e) => setRegion({ ...region, radius: Number(e.target.value) })} className="w-full" /></div>}
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4"><MiniStat label="Active" value={alertPoints.length} /><MiniStat label="In area" value={selectedAlertCount} /><MiniStat label="Shelters" value={shelterPoints.length} /><MiniStat label="Reports" value={reportPoints.length} /></div>

      <MapContainer center={center} zoom={10} style={{ height: "480px", width: "100%", borderRadius: "12px", overflow: "hidden" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        <MapResizeHandler />
        <MapCenter center={center} />
        <ClickHandler setRegion={setRegion} setMarker={setMarker} />
        {marker && <Marker position={marker}><Popup>Selected location</Popup></Marker>}
        {region && <Circle center={[region.lat, region.lng]} radius={region.radius} pathOptions={{ color: "#0f172a", fillOpacity: 0.08 }} />}
        <RouteView positions={routePositions} />
        {alertPoints.map((alert) => { const [lng, lat] = alert.coordinates.coordinates; const color = severityColors[alert.severity] || severityColors.medium; return [<Circle key={`area-${alert._id}`} center={[lat, lng]} radius={Math.max(Number(alert.radius) || 1500, 500)} pathOptions={{ color, fillColor: color, fillOpacity: 0.2, weight: 2 }} />, <Marker key={`marker-${alert._id}`} position={[lat, lng]}><Popup><strong>{alert.title}</strong><br />{alert.severity} severity<br />{alert.location}</Popup></Marker>]; })}
        {reportPoints.map((report) => { const [lng, lat] = report.coordinates.coordinates; return <Marker key={`report-${report._id}`} position={[lat, lng]}><Popup><strong>{report.title}</strong><br />Citizen report · {report.priority}</Popup></Marker>; })}
        {shelterPoints.map((shelter) => { const [lng, lat] = shelter.coordinates.coordinates; return <Marker key={`shelter-${shelter._id}`} position={[lat, lng]}><Popup><strong>{shelter.name}</strong><br />{shelter.availableCapacity} spaces available<br />{shelter.location}</Popup></Marker>; })}
        {infrastructurePoints.map((item) => { const [lng, lat] = item.coordinates.coordinates; return <Marker key={`infrastructure-${item._id}`} position={[lat, lng]}><Popup><strong>{item.name}</strong><br />{String(item.type || "infrastructure").replaceAll("_", " ")} · {item.status}<br />{item.location}<br />{item.contact || "No contact listed"}</Popup></Marker>; })}
      </MapContainer>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <InfoCard title="Threat picture" value={`${alertPoints.length} active`} detail={`${selectedAlertCount} intersect selected area`} />
        <InfoCard title="Response capacity" value={`${shelterPoints.length} shelters`} detail="Shelter locations available on map" />
        <InfoCard title="Field intelligence" value={`${reportPoints.length} reports`} detail={`${infrastructurePoints.length} infrastructure assets mapped`} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"><p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p><p className="mt-0.5 text-lg font-bold text-slate-900">{value}</p></div>;
}

function InfoCard({ title, value, detail }) {
  return <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p><p className="mt-1 text-sm font-bold text-slate-900">{value}</p><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div>;
}
