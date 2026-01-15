import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchAlerts } from "../api/alerts";
import AlertCard from "../components/AlertCard";
import Navbar from "../components/Navbar";
import CreateAlertForm from "../components/createAlertForm";


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
    <Navbar />

    <main className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Alerts Dashboard
        </h2>
        <p className="text-sm text-gray-500">
          Monitor and manage disaster alerts
        </p>
      </div>

      {/* Admin create */}
      {isAdmin && (
        <div className="mb-8">
          <CreateAlertForm onCreated={loadAlerts} />
        </div>
      )}

      {/* Errors */}
      {error && (
        <p className="text-red-600 mb-4">{error}</p>
      )}

      {/* Alerts */}
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
