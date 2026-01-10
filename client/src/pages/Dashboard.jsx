import React, { useEffect, useState } from "react";

function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");

  // Fetch alerts from backend
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No token found. Please login again.");
          return;
        }

        const res = await fetch("http://localhost:5000/api/alerts", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Failed to fetch alerts");
          return;
        }

        setAlerts(data.alerts);
      } catch (err) {
        console.error(err);
        setError("Server error while fetching alerts");
      }
    };

    fetchAlerts();
  }, []);

  return (
    <div style={{ maxWidth: "800px", margin: "30px auto" }}>
      <h2>Admin Dashboard</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {alerts.length === 0 ? (
        <p>No alerts found</p>
      ) : (
        <table
          border="1"
          cellPadding="10"
          cellSpacing="0"
          style={{ width: "100%", marginTop: "20px" }}
        >
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Disaster Type</th>
              <th>Severity</th>
              <th>Location</th>
              <th>Created By</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert._id}>
                <td>{alert.title}</td>
                <td>{alert.description}</td>
                <td>{alert.disasterType}</td>
                <td>{alert.severity}</td>
                <td>{alert.location}</td>
                <td>{alert.createdBy.name}</td>
                <td>{new Date(alert.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Dashboard;
