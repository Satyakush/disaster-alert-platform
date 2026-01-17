import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";
import { useState } from "react";
import "leaflet/dist/leaflet.css";
import { searchPlace } from "../api/geocode";
import L from "leaflet";

/* Fix marker icons */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickHandler({ setRegion }) {
  useMapEvents({
    click(e) {
      setRegion({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        radius: 3000, // default 3km
      });
    },
  });
  return null;
}

export default function MapView({ onRegionSelect }) {
  const [query, setQuery] = useState("");
  const [center, setCenter] = useState([22.7196, 75.8577]);
  const [marker, setMarker] = useState(null);
  const [region, setRegion] = useState(null);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    try {
      const results = await searchPlace(query);
      if (!results.length) {
        setError("Location not found");
        return;
      }

      const place = results[0];
      const lat = parseFloat(place.lat);
      const lng = parseFloat(place.lon);

      setCenter([lat, lng]);
      setMarker([lat, lng]);
      setError("");
    } catch {
      setError("Search failed");
    }
  };

  // Sync region to dashboard
  if (region && onRegionSelect) {
    onRegionSelect(region);
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-lg font-semibold mb-3">
        Select Risk Region
      </h2>

      <div className="flex gap-2 mb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search city / area"
          className="flex-1 border px-3 py-2 rounded"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-4 rounded"
        >
          Search
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-2">{error}</p>
      )}

      {region && (
        <div className="mb-3 text-sm">
          Radius:
          <input
            type="range"
            min="1000"
            max="20000"
            step="500"
            value={region.radius}
            onChange={(e) =>
              setRegion({ ...region, radius: Number(e.target.value) })
            }
            className="w-full"
          />
          <span className="text-xs text-gray-600">
            {region.radius / 1000} km
          </span>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={10}
        style={{ height: "420px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler setRegion={setRegion} />

        {marker && <Marker position={marker} />}

        {region && (
          <Circle
            center={[region.lat, region.lng]}
            radius={region.radius}
            pathOptions={{ color: "red" }}
          />
        )}
      </MapContainer>
    </div>
  );
}
