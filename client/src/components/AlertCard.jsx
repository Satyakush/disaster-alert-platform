import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { deleteAlert, updateAlert } from "../api/alerts";

export default function AlertCard({ alert, setAlerts }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    title: alert.title,
    description: alert.description,
    disasterType: alert.disasterType,
    severity: alert.severity,
    location: alert.location,
  });

  const createdTime = new Date(alert.createdAt).toLocaleString();
  const updatedTime = new Date(alert.updatedAt).toLocaleString();
  const isUpdated = alert.updatedAt !== alert.createdAt;

  const handleDelete = async () => {
    if (!window.confirm("Delete this alert?")) return;

    try {
      await deleteAlert(alert._id);
      setAlerts((prev) =>
        prev.filter((a) => a._id !== alert._id)
      );
    } catch (err) {
      alert("Failed to delete alert");
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await updateAlert(alert._id, form);

      setAlerts((prev) =>
        prev.map((a) =>
          a._id === alert._id ? res.alert : a
        )
      );

      setIsEditing(false);
    } catch (err) {
      alert("Failed to update alert");
    }
  };

  /* ---------------- EDIT MODE ---------------- */
  if (isEditing) {
    return (
      <div className="bg-white rounded-xl shadow border p-5">
        <h3 className="font-semibold mb-4 text-gray-800">
          Edit Alert
        </h3>

        <input
          value={form.title}
          onChange={(e) =>
            setForm({ ...form, title: e.target.value })
          }
          className="w-full border rounded p-2 mb-2"
          placeholder="Title"
        />

        <textarea
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
          className="w-full border rounded p-2 mb-2"
          rows="3"
          placeholder="Description"
        />

        <input
          value={form.location}
          onChange={(e) =>
            setForm({ ...form, location: e.target.value })
          }
          className="w-full border rounded p-2 mb-2"
          placeholder="Location"
        />

        <div className="flex gap-2 mb-3">
          <select
            value={form.disasterType}
            onChange={(e) =>
              setForm({ ...form, disasterType: e.target.value })
            }
            className="border rounded p-2 w-1/2"
          >
            <option value="flood">Flood</option>
            <option value="earthquake">Earthquake</option>
            <option value="fire">Fire</option>
            <option value="cyclone">Cyclone</option>
            <option value="other">Other</option>
          </select>

          <select
            value={form.severity}
            onChange={(e) =>
              setForm({ ...form, severity: e.target.value })
            }
            className="border rounded p-2 w-1/2"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleUpdate}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded"
          >
            Save
          </button>

          <button
            onClick={() => setIsEditing(false)}
            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-1.5 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- VIEW MODE ---------------- */
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
      <h3 className="text-lg font-semibold text-gray-800">
        {alert.title}
      </h3>

      <div className="text-xs text-gray-500 mt-1 flex gap-3 capitalize">
        <span>{alert.disasterType}</span>
        <span>{alert.severity}</span>
      </div>

      <p className="text-sm text-gray-700 mt-3">
        {alert.description}
      </p>

      <p className="text-sm text-gray-500 mt-3">
        📍 {alert.location}
      </p>

      <p className="text-xs text-gray-400 mt-2">
        Created: {createdTime}
      </p>

      {isUpdated && (
        <p className="text-xs text-blue-500">
          Updated: {updatedTime}
        </p>
      )}

      {isAdmin && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded text-sm"
          >
            Edit
          </button>

          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
