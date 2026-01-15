import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchAlerts } from "../api/alerts";

import Navbar from "../components/Navbar";
import MapView from "../components/MapView";
import CreateAlertForm from "../components/createAlertForm";
import AlertCard from "../components/AlertCard";

export default function Dashboard() {
  const { user } = useAuth();

  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  const isAdmin = user?.role === "admin";

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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Nav */}
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

        {/* STEP 1 — MAP + SEARCH */}
        <MapView />

        {/* Admin-only: Create Alert */}
        {isAdmin && (
          <CreateAlertForm onCreated={loadAlerts} />
        )}

        {/* Errors */}
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
