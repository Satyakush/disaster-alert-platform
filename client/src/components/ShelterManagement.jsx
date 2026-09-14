import { useState } from "react";
import { createShelter, deleteShelter, updateShelter } from "../api/shelters";

const statuses = ["open", "limited", "full", "closed"];

export default function ShelterManagement({ shelters = [], selectedRegion, onChanged }) {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    location: "",
    capacity: 100,
    availableCapacity: 100,
    status: "open",
    facilities: "",
    contact: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      location: "",
      capacity: 100,
      availableCapacity: 100,
      status: "open",
      facilities: "",
      contact: "",
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!selectedRegion && !editingId) {
      setError("Select the shelter location on the map before creating it");
      return;
    }

    if (Number(form.availableCapacity) > Number(form.capacity)) {
      setError("Available capacity cannot exceed total capacity");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: form.name,
        location: form.location,
        capacity: Number(form.capacity),
        availableCapacity: Number(form.availableCapacity),
        status: form.status,
        facilities: form.facilities.split(",").map((item) => item.trim()).filter(Boolean),
        contact: form.contact,
      };

      if (!editingId) {
        payload.coordinates = {
          type: "Point",
          coordinates: [selectedRegion.lng, selectedRegion.lat],
        };
      }

      if (editingId) {
        await updateShelter(editingId, payload);
      } else {
        await createShelter(payload);
      }

      await onChanged?.();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save shelter");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (shelter) => {
    setEditingId(shelter._id);
    setForm({
      name: shelter.name || "",
      location: shelter.location || "",
      capacity: shelter.capacity || 100,
      availableCapacity: shelter.availableCapacity || 0,
      status: shelter.status || "open",
      facilities: (shelter.facilities || []).join(", "),
      contact: shelter.contact || "",
    });
    setError("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this shelter?")) return;
    setError("");
    try {
      await deleteShelter(id);
      await onChanged?.();
      if (editingId === id) resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete shelter");
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600">Evacuation operations</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Shelter Management</h2>
          <p className="mt-1 text-sm text-slate-500">Create and maintain emergency shelters used by evacuation intelligence.</p>
        </div>
        <span className="text-sm text-slate-500">{shelters.length} shelter{shelters.length === 1 ? "" : "s"}</span>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Shelter name" required className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          <input name="location" value={form.location} onChange={handleChange} placeholder="Location name" required className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <input type="number" name="capacity" min="1" value={form.capacity} onChange={handleChange} placeholder="Capacity" required className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          <input type="number" name="availableCapacity" min="0" value={form.availableCapacity} onChange={handleChange} placeholder="Available" required className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          <select name="status" value={form.status} onChange={handleChange} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400">
            {statuses.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}
          </select>
          <input name="contact" value={form.contact} onChange={handleChange} placeholder="Emergency contact" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
        </div>

        <input name="facilities" value={form.facilities} onChange={handleChange} placeholder="Facilities, comma separated (water, food, medical)" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />

        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          {editingId ? "Editing existing shelter location." : selectedRegion ? `Selected coordinates: ${selectedRegion.lat.toFixed(5)}, ${selectedRegion.lng.toFixed(5)}` : "No shelter location selected. Click the map above to set coordinates."}
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={loading || (!editingId && !selectedRegion)} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Saving..." : editingId ? "Update Shelter" : "Create Shelter"}
          </button>
          {editingId && <button type="button" onClick={resetForm} className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>}
        </div>
      </form>

      {shelters.length > 0 && (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {shelters.map((shelter) => (
            <div key={shelter._id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{shelter.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{shelter.location}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">{shelter.status}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-slate-50 p-2"><span className="text-slate-500">Capacity</span><div className="font-semibold text-slate-900">{shelter.capacity}</div></div>
                <div className="rounded-lg bg-slate-50 p-2"><span className="text-slate-500">Available</span><div className="font-semibold text-slate-900">{shelter.availableCapacity}</div></div>
              </div>
              {shelter.facilities?.length > 0 && <p className="mt-3 text-xs text-slate-500">{shelter.facilities.join(" · ")}</p>}
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => handleEdit(shelter)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit</button>
                <button type="button" onClick={() => handleDelete(shelter._id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
