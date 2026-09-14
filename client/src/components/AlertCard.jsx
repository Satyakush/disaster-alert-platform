import { useState } from "react";
import { MapPin, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { deleteAlert, updateAlert } from "../api/alerts";
import ResponseAssignment from "./ResponseAssignment";

const disasterTypes = ["flood", "cyclone", "earthquake", "wildfire", "heatwave", "storm", "landslide", "tsunami", "industrial", "other"];
const severities = ["low", "medium", "high", "critical"];

export default function AlertCard({ alert, setAlerts, onSelect, selected }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ title: alert.title, description: alert.description, disasterType: alert.disasterType, severity: alert.severity, location: alert.location });
  const createdTime = new Date(alert.createdAt).toLocaleString();
  const updatedTime = new Date(alert.updatedAt).toLocaleString();
  const isUpdated = alert.updatedAt !== alert.createdAt;

  const handleDelete = async () => {
    if (!window.confirm("Delete this alert?")) return;
    try {
      await deleteAlert(alert._id);
      setAlerts((prev) => prev.filter((item) => item._id !== alert._id));
    } catch (err) {
      window.alert("Failed to delete alert");
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await updateAlert(alert._id, form);
      setAlerts((prev) => prev.map((item) => item._id === alert._id ? res.alert : item));
      setIsEditing(false);
    } catch (err) {
      window.alert("Failed to update alert");
    }
  };

  if (isEditing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold text-slate-800">Edit Alert</h3>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mb-2 w-full rounded-lg border border-slate-200 p-2" placeholder="Title" />
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mb-2 w-full rounded-lg border border-slate-200 p-2" rows="3" placeholder="Description" />
        <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mb-2 w-full rounded-lg border border-slate-200 p-2" placeholder="Location" />
        <div className="mb-3 flex gap-2">
          <select value={form.disasterType} onChange={(e) => setForm({ ...form, disasterType: e.target.value })} className="w-1/2 rounded-lg border border-slate-200 p-2">{disasterTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select>
          <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="w-1/2 rounded-lg border border-slate-200 p-2">{severities.map((severity) => <option key={severity} value={severity}>{severity}</option>)}</select>
        </div>
        <div className="flex gap-2">
          <button onClick={handleUpdate} className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm text-white hover:bg-slate-700">Save</button>
          <button onClick={() => setIsEditing(false)} className="rounded-lg bg-slate-200 px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-300">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border bg-white p-5 shadow-sm transition ${selected ? "border-red-400 ring-2 ring-red-100" : "border-slate-200 hover:shadow-md"}`}>
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-800">{alert.title}</h3>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">{alert.status}</span>
        </div>
        <div className="mt-1 flex gap-3 text-xs capitalize text-slate-500"><span>{alert.disasterType}</span><span>{alert.severity}</span></div>
        <p className="mt-3 text-sm text-slate-700">{alert.description}</p>
        <p className="mt-3 flex items-center gap-1 text-sm text-slate-500"><MapPin size={14} /> {alert.location}</p>
        <p className="mt-2 text-xs text-slate-400">Created: {createdTime}</p>
        {isUpdated && <p className="text-xs text-blue-500">Updated: {updatedTime}</p>}
        <p className="mt-4 text-xs font-semibold text-red-600">View evacuation intelligence →</p>
      </button>
      {isAdmin && <>
        <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
          <button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm text-white hover:bg-amber-600"><Pencil size={14} /> Edit</button>
          <button onClick={handleDelete} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"><Trash2 size={14} /> Delete</button>
        </div>
        <ResponseAssignment alert={alert} />
      </>}
    </div>
  );
}
