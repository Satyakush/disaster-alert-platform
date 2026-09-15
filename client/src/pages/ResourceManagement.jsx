import { useEffect, useMemo, useState } from "react";
import { Activity, Ambulance, Package, Plus, Save, Trash2, Truck } from "lucide-react";
import Navbar from "../components/Navbar";
import { createResource, deleteResource, fetchResources, updateResource } from "../api/resources";

const resourceTypes = [
  "ambulance",
  "fire_truck",
  "rescue_team",
  "police_unit",
  "medical_team",
  "boat",
  "helicopter",
  "food_supply",
  "water_supply",
  "shelter_capacity",
  "other",
];

const statuses = ["available", "deployed", "maintenance", "unavailable"];

const emptyForm = {
  name: "",
  type: "ambulance",
  status: "available",
  quantity: 1,
  availableQuantity: 1,
  location: "",
  contact: "",
  notes: "",
};

const statusClass = {
  available: "bg-emerald-100 text-emerald-800",
  deployed: "bg-blue-100 text-blue-800",
  maintenance: "bg-amber-100 text-amber-800",
  unavailable: "bg-slate-100 text-slate-600",
};

export default function ResourceManagement() {
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadResources = async () => {
    try {
      const data = await fetchResources();
      setResources(data.resources || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const totals = useMemo(() => ({
    resources: resources.length,
    available: resources.reduce((sum, resource) => sum + Number(resource.availableQuantity || 0), 0),
    deployed: resources.filter((resource) => resource.status === "deployed").length,
  }), [resources]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (Number(form.availableQuantity) > Number(form.quantity)) {
        setError("Available quantity cannot exceed total quantity");
        return;
      }

      if (editingId) {
        const data = await updateResource(editingId, form);
        setResources((current) => current.map((resource) => resource._id === editingId ? data.resource : resource));
        setMessage("Resource updated successfully");
      } else {
        const data = await createResource(form);
        setResources((current) => [data.resource, ...current]);
        setMessage("Resource created successfully");
      }
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save resource");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (resource) => {
    setEditingId(resource._id);
    setMessage("");
    setError("");
    setForm({
      name: resource.name || "",
      type: resource.type || "other",
      status: resource.status || "available",
      quantity: resource.quantity || 0,
      availableQuantity: resource.availableQuantity || 0,
      location: resource.location || "",
      contact: resource.contact || "",
      notes: resource.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeResource = async (resource) => {
    if (!window.confirm(`Delete ${resource.name}?`)) return;
    try {
      await deleteResource(resource._id);
      setResources((current) => current.filter((item) => item._id !== resource._id));
      setMessage("Resource deleted successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete resource");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-2xl bg-slate-950 p-6 text-white shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Emergency operations</p>
          <h1 className="mt-1 text-2xl font-bold">Resource Management</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">Track emergency vehicles, teams, supplies, and operational capacity available for disaster response.</p>
        </section>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Package size={20} className="text-cyan-600" /><p className="mt-3 text-3xl font-bold text-slate-900">{totals.resources}</p><p className="text-sm text-slate-500">Resource records</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Activity size={20} className="text-emerald-600" /><p className="mt-3 text-3xl font-bold text-slate-900">{totals.available}</p><p className="text-sm text-slate-500">Available units</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Truck size={20} className="text-blue-600" /><p className="mt-3 text-3xl font-bold text-slate-900">{totals.deployed}</p><p className="text-sm text-slate-500">Deployed resources</p></div>
        </div>

        {(error || message) && <div className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error || message}</div>}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">{editingId ? "Edit resource" : "Add resource"}</h2><p className="text-sm text-slate-500">Register a response asset and its current availability.</p></div><Ambulance size={22} className="text-slate-400" /></div>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Resource name" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm capitalize">{resourceTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select>
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm capitalize">{statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select>
            <input required min="0" type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} placeholder="Total quantity" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <input required min="0" type="number" value={form.availableQuantity} onChange={(event) => setForm({ ...form, availableQuantity: event.target.value })} placeholder="Available quantity" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Current location" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <input value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} placeholder="Contact" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} maxLength="2000" placeholder="Operational notes" className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2" rows="2" />
            <div className="flex items-center gap-2 lg:col-span-3"><button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{editingId ? <Save size={16} /> : <Plus size={16} />}{saving ? "Saving..." : editingId ? "Save changes" : "Add resource"}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>}</div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5"><h2 className="font-semibold text-slate-900">Resource inventory</h2><p className="mt-1 text-sm text-slate-500">Current operational resources available to the response team.</p></div>
          {loading ? <div className="p-6 text-sm text-slate-500">Loading resources...</div> : resources.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No resources have been registered yet.</div> : <div className="divide-y divide-slate-200">{resources.map((resource) => <div key={resource._id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-900">{resource.name}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass[resource.status]}`}>{resource.status}</span></div><p className="mt-1 text-sm capitalize text-slate-500">{resource.type.replaceAll("_", " ")} · {resource.availableQuantity} available / {resource.quantity} total</p>{resource.location && <p className="mt-1 text-xs text-slate-400">{resource.location}</p>}{resource.assignedAlert && <p className="mt-2 text-xs font-medium text-blue-600">Assigned to: {resource.assignedAlert.title}</p>}</div><div className="flex gap-2"><button type="button" onClick={() => startEdit(resource)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Edit</button><button type="button" onClick={() => removeResource(resource)} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"><Trash2 size={15} />Delete</button></div></div>)}</div>}
        </section>
      </main>
    </div>
  );
}
