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

    <main className="max-w-6xl mx-auto p-6">
    <div className="mb-4">
  <span className="text-sm text-gray-600">
    Role:{" "}
    <strong className="capitalize">
      {user?.role}
    </strong>
  </span>
</div>

{isAdmin && (
  <CreateAlertForm onAlertCreated={loadAlerts} />
)}

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
