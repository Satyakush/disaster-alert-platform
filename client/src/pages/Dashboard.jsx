import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchAlerts } from "../api/alerts";
import AlertCard from "../components/AlertCard";
import Navbar from "../components/Navbar";


export default function Dashboard() {
  const { token, logout, user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");

useEffect(() => {
  const loadAlerts = async () => {
    try {
      const data = await fetchAlerts();
      setAlerts(data.alerts);
    } catch (err) {
      console.error(err);
      setError("Failed to load alerts");
    }
  };

  loadAlerts();
}, []);


  return (
  <div className="min-h-screen bg-gray-100">
    <Navbar />

    <main className="max-w-6xl mx-auto p-6">
      {error && (
        <p className="text-red-600 mb-4">{error}</p>
      )}

      <div className="grid gap-4">
        {alerts.length === 0 ? (
          <p className="text-gray-500">No alerts found</p>
        ) : (
          alerts.map((alert) => (
            <AlertCard key={alert._id} alert={alert} />
          ))
        )}
      </div>
    </main>
  </div>
);
}
