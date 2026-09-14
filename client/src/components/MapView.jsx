import { MapContainer, TileLayer, Marker, Circle, Popup, Polyline, useMap, useMapEvents } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import { searchPlace } from "../api/geocode";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickHandler({ setRegion }) {
  useMapEvents({ click(e) { setRegion({ lat: e.latlng.lat, lng: e.latlng.lng, radius: 3000 }); } });
  return null;
}

function MapCenter({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center, Math.max(map.getZoom(), 10), { animate: true }); }, [center, map]);
  return null;
}

export default function MapView({ onRegionSelect, alerts = [], reports = [], shelters = [], route = null }) {
  const [query, setQuery] = useState("");
  const [center, setCenter] = useState([22.7196, 75.8577]);
  const [marker, setMarker] = useState(null);
  const [region, setRegion] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (region && onRegionSelect) onRegionSelect(region);
  }, [region, onRegionSelect]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      const results = await searchPlace(query.trim());
      if (!results.length) { setError("Location not found"); return; }
      const place = results[0];
      const lat = parseFloat(place.lat);
      const lng = parseFloat(place.lon);
      setCenter([lat, lng]);
      setMarker([lat, lng]);
      setRegion({ lat, lng, radius: 3000 });
      setError("");
    } catch { setError("Search failed"); }
  };

  const alertPoints = alerts.filter((alert) => alert.coordinates?.coordinates?.length === 2 && ["active", "escalated"].includes(alert.status));
  const reportPoints = reports.filter((report) => report.coordinates?.coordinates?.length === 2);
  const shelterPoints = shelters.filter((shelter) => shelter.coordinates?.coordinates?.length === 2);
  const severityColors = { low: "#22c55e", medium: "#eab308", high: "#f97316", critical: "#ef4444" };
  const routePositions = route?.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]) || [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="Search city / area" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" />
        <button onClick={handleSearch} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Search</button>
      </div>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      {region && <div className="mb-3 text-sm text-slate-600"><div className="flex justify-between"><span>Selected risk radius</span><span className="font-semibold">{region.radius / 1000} km</span></div><input type="range" min="1000" max="20000" step="500" value={region.radius} onChange={(e) => setRegion({ ...region, radius: Number(e.target.value) })} className="w-full" /></div>}
      <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-500"><span>● Active alerts: {alertPoints.length}</span><span>● Reports: {reportPoints.length}</span><span>● Shelters: {shelterPoints.length}</span>{route && <span>● Evacuation route ready</span>}</div>

      <MapContainer center={center} zoom={10} style={{ height: "480px", width: "100%", borderRadius: "12px" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        <MapCenter center={center} />
        <ClickHandler setRegion={setRegion} />
        {marker && <Marker position={marker}><Popup>Selected location</Popup></Marker>}
        {region && <Circle center={[region.lat, region.lng]} radius={region.radius} pathOptions={{ color: "#0f172a", fillOpacity: 0.08 }} />}
        {routePositions.length > 1 && <Polyline positions={routePositions} pathOptions={{ color: "#2563eb", weight: 6, opacity: 0.85 }}><Popup>Recommended evacuation route</Popup></Polyline>}

        {alertPoints.map((alert) => {
          const [lng, lat] = alert.coordinates.coordinates;
          const color = severityColors[alert.severity] || severityColors.medium;
          return [
            <Circle key={`area-${alert._id}`} center={[lat, lng]} radius={Math.max(Number(alert.radius) || 1500, 500)} pathOptions={{ color, fillColor: color, fillOpacity: 0.2, weight: 2 }} />,
            <Marker key={`marker-${alert._id}`} position={[lat, lng]}><Popup><strong>{alert.title}</strong><br />{alert.severity} severity<br />{alert.location}</Popup></Marker>,
          ];
        })}
        {reportPoints.map((report) => { const [lng, lat] = report.coordinates.coordinates; return <Marker key={`report-${report._id}`} position={[lat, lng]}><Popup><strong>{report.title}</strong><br />Citizen report · {report.priority}</Popup></Marker>; })}
        {shelterPoints.map((shelter) => { const [lng, lat] = shelter.coordinates.coordinates; return <Marker key={`shelter-${shelter._id}`} position={[lat, lng]}><Popup><strong>{shelter.name}</strong><br />{shelter.availableCapacity} spaces available<br />{shelter.location}</Popup></Marker>; })}
      </MapContainer>
    </div>
  );
}
