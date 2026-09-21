import { useEffect, useState } from "react";
import { Building2, Pencil, Plus, Trash2, X } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { fetchInfrastructure, createInfrastructure, updateInfrastructure, deleteInfrastructure } from "../api/infrastructure";
import { fetchShelters } from "../api/shelters";

const types = ["hospital", "school", "police_station", "fire_station", "power_station", "water_facility", "telecom", "government", "bridge", "other"];
const statuses = ["operational", "limited", "damaged", "closed"];
const initialForm = { name: "", type: "hospital", status: "operational", location: "", latitude: "", longitude: "", capacity: 0, contact: "", notes: "" };

export default function Infrastructure() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [items, setItems] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sheltersLoading, setSheltersLoading] = useState(false);
  const [selectedShelterId, setSelectedShelterId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchInfrastructure();
      setItems(data.infrastructure || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load infrastructure");
    } finally {
      setLoading(false);
    }
  };

  const loadShelters = async () => {
    setSheltersLoading(true);
    try {
      const data = await fetchShelters();
      setShelters(data.shelters || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load shelters");
    } finally {
      setSheltersLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadShelters();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setSelectedShelterId("");
    setShowForm(true);
    setMessage("");
  };

  const openEdit = (item) => {
    setEditingId(item._id);
    setSelectedShelterId("");
    setForm({
      name: item.name || "",
      type: item.type || "other",
      status: item.status || "operational",
      location: item.location || "",
      latitude: item.coordinates?.coordinates?.[1] ?? "",
      longitude: item.coordinates?.coordinates?.[0] ?? "",
      capacity: item.capacity ?? 0,
      contact: item.contact || "",
      notes: item.notes || "",
    });
    setShowForm(true);
    setMessage("");
  };

  const handleShelterSelect = (shelterId) => {
    setSelectedShelterId(shelterId);

    if (!shelterId) {
      setForm((current) => ({
        ...current,
        location: "",
        latitude: "",
        longitude: "",
      }));
      return;
    }

    const shelter = shelters.find((item) => item._id === shelterId);
    if (!shelter) return;

    setForm((current) => ({
      ...current,
      location: shelter.location || "",
      latitude: shelter.coordinates?.coordinates?.[1] ?? "",
      longitude: shelter.coordinates?.coordinates?.[0] ?? "",
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity),
        coordinates: {
          type: "Point",
          coordinates: [Number(form.longitude), Number(form.latitude)],
        },
      };

      const data = editingId
        ? await updateInfrastructure(editingId, payload)
        : await createInfrastructure(payload);

      if (editingId) {
        setItems((current) => current.map((item) => item._id === editingId ? data.infrastructure : item));
      } else {
        setItems((current) => [data.infrastructure, ...current]);
      }

      setShowForm(false);
      setForm(initialForm);
      setSelectedShelterId("");
      setMessage(editingId ? "Infrastructure updated successfully" : "Infrastructure created successfully");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save infrastructure");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete ${item.name}?`)) return;

    try {
      await deleteInfrastructure(item._id);
      setItems((current) => current.filter((entry) => entry._id !== item._id));
      setMessage("Infrastructure deleted successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete infrastructure");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-2xl bg-slate-950 p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Critical infrastructure</p>
              <h1 className="mt-1 text-2xl font-bold">Infrastructure Registry</h1>
              <p className="mt-2 text-sm text-slate-300">Track hospitals, schools, emergency facilities, utilities, and other critical assets.</p>
            </div>
            {isAdmin && (
              <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400">
                <Plus size={17} /> Add facility
              </button>
            )}
          </div>
        </section>

        {(error || message) && (
          <div className={`mt-6 rounded-xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
            {error || message}
          </div>
        )}

        {showForm && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">{editingId ? "Edit facility" : "Add facility"}</h2>
                <p className="text-sm text-slate-500">Register the facility and its map coordinates.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Facility name" className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />

              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm capitalize">
                {types.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}
              </select>

              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm capitalize">
                {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>

              {!editingId && (
                <div className="lg:col-span-3">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Location from existing shelter</label>
                  <select
                    value={selectedShelterId}
                    onChange={(e) => handleShelterSelect(e.target.value)}
                    disabled={sheltersLoading}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 disabled:bg-slate-100"
                  >
                    <option value="">
                      {sheltersLoading ? "Loading shelters..." : shelters.length ? "Select an existing shelter" : "No shelters available"}
                    </option>
                    {shelters.map((shelter) => (
                      <option key={shelter._id} value={shelter._id}>
                        {shelter.name} — {shelter.location}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-slate-500">Selecting a shelter automatically fills its location, latitude, and longitude.</p>
                </div>
              )}

              <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location" className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
              <input required readOnly={!editingId && Boolean(selectedShelterId)} type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="Latitude" className={`rounded-lg border border-slate-200 px-3 py-2.5 text-sm ${!editingId && selectedShelterId ? "bg-slate-100 text-slate-500" : ""}`} />
              <input required readOnly={!editingId && Boolean(selectedShelterId)} type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="Longitude" className={`rounded-lg border border-slate-200 px-3 py-2.5 text-sm ${!editingId && selectedShelterId ? "bg-slate-100 text-slate-500" : ""}`} />

              <input min="0" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="Capacity" className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
              <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Contact" className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength="2000" rows="3" placeholder="Operational notes" className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm lg:col-span-3" />

              <div className="flex gap-2 lg:col-span-3">
                <button disabled={saving} type="submit" className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  {saving ? "Saving..." : editingId ? "Save changes" : "Create facility"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700">
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Facility registry</h2>
            <p className="text-sm text-slate-500">{items.length} critical infrastructure records.</p>
          </div>

          {loading ? (
            <div className="p-8 text-sm text-slate-500">Loading infrastructure...</div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center">
              <Building2 size={32} className="mx-auto text-slate-300" />
              <p className="mt-3 font-medium text-slate-700">No infrastructure registered</p>
            </div>
          ) : (
            <div className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <article key={item._id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{item.name}</h3>
                      <p className="mt-1 text-xs capitalize text-slate-500">{item.type.replaceAll("_", " ")}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">{item.status}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">{item.location}</p>
                  <p className="mt-2 text-xs text-slate-400">{item.coordinates?.coordinates?.[1]}, {item.coordinates?.coordinates?.[0]} · Capacity {item.capacity || 0}</p>
                  {item.contact && <p className="mt-2 text-xs text-slate-500">Contact: {item.contact}</p>}
                  {isAdmin && (
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => openEdit(item)} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white"><Pencil size={13} /> Edit</button>
                      <button onClick={() => remove(item)} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white"><Trash2 size={13} /> Delete</button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
