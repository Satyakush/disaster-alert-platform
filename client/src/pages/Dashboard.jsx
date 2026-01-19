import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchAlerts } from "../api/alerts";
import { analyzeRisk } from "../api/risk";

import Navbar from "../components/Navbar";
import MapView from "../components/MapView";
import CreateAlertForm from "../components/createAlertForm";
import AlertCard from "../components/AlertCard";

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Alerts
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");

  // Map + Risk
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [riskResult, setRiskResult] = useState(null);

  /* -------------------- ALERTS -------------------- */

  const loadAlerts = async () => {
    try {
      const data = await fetchAlerts();
      setAlerts(data.alerts);
    } catch (err) {
      console.error(err);
      setError("Failed to load alerts");
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  /* -------------------- RISK ANALYSIS -------------------- */

  useEffect(() => {
    if (!selectedRegion) return;

    const fetchRisk = async () => {
      try {
        const result = await analyzeRisk(selectedRegion);
        setRiskResult(result);
      } catch (err) {
        console.error("Risk analysis failed:", err);
      }
    };

    fetchRisk();
  }, [selectedRegion]);

  /* -------------------- UI -------------------- */

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Alerts Dashboard
          </h2>
          <p className="text-sm text-gray-500">
            Monitor and manage disaster alerts
          </p>
        </div>

        {/* Map + Region Selection */}
        <MapView onRegionSelect={setSelectedRegion} />

        {/* Debug (can remove later) */}
        {selectedRegion && (
          <pre className="bg-white p-3 rounded text-xs overflow-x-auto">
            {JSON.stringify(selectedRegion, null, 2)}
          </pre>
        )}

        {/* Risk Result */}
        {riskResult && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
            <h3 className="font-semibold mb-1">
              Risk Assessment
            </h3>
            <p>
              <strong>Risk Level:</strong>{" "}
              <span className="capitalize">
                {riskResult.riskLevel}
              </span>
            </p>
            <p>
              <strong>Confidence:</strong>{" "}
              {(riskResult.confidence * 100).toFixed(0)}%
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Factors: {riskResult.factors.join(", ")}
            </p>
          </div>
        )}

        {/* Admin: Create Alert */}
        {isAdmin && (
          <CreateAlertForm onCreated={loadAlerts} />
        )}

        {/* Error */}
        {error && (
          <p className="text-red-600">{error}</p>
        )}

        {/* Alerts Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {alerts.length === 0 ? (
            <p className="text-gray-500">
              No alerts available
            </p>
          ) : (
            alerts.map((alert) => (
              <AlertCard
                key={alert._id}
                alert={alert}
                setAlerts={setAlerts}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
