import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { useState } from "react";
import "leaflet/dist/leaflet.css";
import { searchPlace } from "../api/geocode";

// Fix leaflet marker icon issue
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function RecenterMap({ center }) {
  const map = useMap();
  map.setView(center, 10);
  return null;
}

export default function MapView() {
  const [query, setQuery] = useState("");
  const [center, setCenter] = useState([22.7196, 75.8577]); // Indore default
  const [marker, setMarker] = useState(null);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!query) return;

    try {
      setError("");
      const results = await searchPlace(query);

      if (!results.length) {
        setError("Location not found");
        return;
      }

      const place = results[0];
      const lat = parseFloat(place.lat);
      const lon = parseFloat(place.lon);

      setCenter([lat, lon]);
      setMarker([lat, lon]);
    } catch (err) {
      setError("Search failed");
    }
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="text-lg font-semibold mb-3">
        Search Risk Area
      </h2>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Search city / area"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
        <p className="text-sm text-red-600 mb-2">
          {error}
        </p>
      )}

      <MapContainer
        center={center}
        zoom={10}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap center={center} />

        {marker && <Marker position={marker} />}
      </MapContainer>
    </div>
  );
}
