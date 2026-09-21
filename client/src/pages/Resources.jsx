import { useEffect, useMemo, useState } from "react";
import { Boxes, Pencil, Plus, Search, Trash2, UserRound, X } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { fetchResources, createResource, updateResource, deleteResource } from "../api/resources";
import { fetchResponseTeam } from "../api/responseTeam";
import { fetchAlerts } from "../api/alerts";

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
  assignedResponder: "",
  assignedAlert: "",
};

const statusClass = {
  available: "bg-emerald-100 text-emerald-700",
  deployed: "bg-orange-100 text-orange-700",
  maintenance: "bg-yellow-100 text-yellow-800",
  unavailable: "bg-slate-100 text-slate-600",
};

export default function Resources() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [resources, setResources] = useState([]);
  const [responders, setResponders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const requests = [fetchResources(), fetchAlerts({ status: "active" })];
      if (isAdmin) requests.push(fetchResponseTeam());
      const [resourceData, alertData, teamData] = await Promise.all(requests);
      setResources(resourceData.resources || []);
      setAlerts(alertData.alerts || []);
      if (isAdmin) setResponders((teamData.members || []).filter((member) => member.role === "responder"));
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load resource operations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, assignedResponder: isAdmin ? "" : user?.id || "" });
    setShowForm(true);
    setMessage("");
  };

  const openEdit = (resource) => {
    setEditingId(resource._id);
    setForm({
      name: resource.name || "",
      type: resource.type || "other",
      status: resource.status || "available",
      quantity: resource.quantity ?? 0,
      availableQuantity: resource.availableQuantity ?? 0,
      location: resource.location || "",
      contact: resource.contact || "",
      notes: resource.notes || "",
      assignedResponder: resource.assignedResponder?._id || resource.assignedResponder || "",
      assignedAlert: resource.assignedAlert?._id || resource.assignedAlert || "",
    });
    setShowForm(true);
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity),
        availableQuantity: Number(form.availableQuantity),
        assignedResponder: form.assignedResponder || undefined,
        assignedAlert: form.assignedAlert || undefined,
      };
      const data = editingId ? await updateResource(editingId, payload) : await createResource(payload);
      if (editingId) {
        setResources((current) => current.map((item) => item._id === editingId ? data.resource : item));
        setMessage("Resource updated successfully");
      } else {
        setResources((current) => [data.resource, ...current]);
        setMessage("Resource created successfully");
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save resource");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (resource) => {
    if (!window.confirm(`Delete ${resource.name}?`)) return;
    try {
      await deleteResource(resource._id);
      setResources((current) => current.filter((item) => item._id !== resource._id));
      setMessage("Resource deleted successfully");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete resource");
    }
  };

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();
    return resources.filter((resource) => {
      const matchesStatus = !filterStatus || resource.status === filterStatus;
      const haystack = [resource.name, resource.type, resource.location, resource.assignedResponder?.name, resource.assignedAlert?.title].filter(Boolean).join(" ").toLowerCase();
      return matchesStatus && (!query || haystack.includes(query));
    });
  }, [resources, search, filterStatus]);

  const stats = useMemo(() => ({
    total: resources.reduce((sum, resource) => sum + Number(resource.quantity || 0), 0),
    available: resources.reduce((sum, resource) => sum + Number(resource.availableQuantity || 0), 0),
    deployed: resources.filter((resource) => resource.status === "deployed").length,
    maintenance: resources.filter((resource) => resource.status === "maintenance").length,
  }), [resources]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <div className="platform-polished admin-modern min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-2xl bg-slate-950 p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Emergency operations</p>
              <h1 className="mt-1 text-2xl font-bold">Resource Operations</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">Track response resources, deployment status, and assignments across active incidents.</p>
            </div>
            <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400">
              <Plus size={17} /> Add resource
            </button>
          </div>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase text-slate-400">Total units</p><p className="mt-2 text-3xl font-bold text-slate-900">{stats.total}</p><p className="mt-1 text-sm text-slate-500">Tracked resource capacity</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase text-slate-400">Available</p><p className="mt-2 text-3xl font-bold text-emerald-600">{stats.available}</p><p className="mt-1 text-sm text-slate-500">Ready for deployment</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase text-slate-400">Deployed</p><p className="mt-2 text-3xl font-bold text-orange-600">{stats.deployed}</p><p className="mt-1 text-sm text-slate-500">Active deployments</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase text-slate-400">Maintenance</p><p className="mt-2 text-3xl font-bold text-yellow-600">{stats.maintenance}</p><p className="mt-1 text-sm text-slate-500">Temporarily unavailable</p></div>
        </div>

        {(error || message) && <div className={`mt-6 rounded-xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error || message}</div>}

        {showForm && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div><h2 className="font-semibold text-slate-900">{editingId ? "Edit resource" : "Add resource"}</h2><p className="text-sm text-slate-500">Register operational capacity and deployment details.</p></div>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <input required value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Resource name" className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500" />
              <select value={form.type} onChange={(event) => updateField("type", event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm capitalize outline-none focus:border-cyan-500">{resourceTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select>
              <select value={form.status} onChange={(event) => updateField("status", event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm capitalize outline-none focus:border-cyan-500">{statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select>
              <input required min="0" type="number" value={form.quantity} onChange={(event) => updateField("quantity", event.target.value)} placeholder="Total quantity" className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500" />
              <input required min="0" max={form.quantity} type="number" value={form.availableQuantity} onChange={(event) => updateField("availableQuantity", event.target.value)} placeholder="Available quantity" className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500" />
              <input value={form.location} onChange={(event) => updateField("location", event.target.value)} placeholder="Base / location" className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500" />
              <input value={form.contact} onChange={(event) => updateField("contact", event.target.value)} placeholder="Contact" className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500" />
              {isAdmin && <select value={form.assignedResponder} onChange={(event) => updateField("assignedResponder", event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500"><option value="">No responder assigned</option>{responders.map((responder) => <option key={responder._id} value={responder._id}>{responder.name} · {responder.email}</option>)}</select>}
              <select value={form.assignedAlert} onChange={(event) => updateField("assignedAlert", event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500"><option value="">No alert assigned</option>{alerts.map((alert) => <option key={alert._id} value={alert._id}>{alert.title}</option>)}</select>
              <textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} maxLength="2000" rows="3" placeholder="Operational notes" className="md:col-span-2 lg:col-span-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500" />
              <div className="flex gap-2 md:col-span-2 lg:col-span-3"><button disabled={saving} type="submit" className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{saving ? "Saving..." : editingId ? "Save changes" : "Create resource"}</button><button type="button" onClick={() => setShowForm(false)} className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">Cancel</button></div>
            </form>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div><h2 className="font-semibold text-slate-900">Resource inventory</h2><p className="text-sm text-slate-500">{filteredResources.length} resources matching the current view.</p></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search resources" className="rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-cyan-500" /></div>
              <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select>
            </div>
          </div>

          {loading ? <div className="p-8 text-sm text-slate-500">Loading resources...</div> : filteredResources.length === 0 ? <div className="p-10 text-center"><Boxes size={32} className="mx-auto text-slate-300" /><p className="mt-3 font-medium text-slate-700">No resources found</p><p className="mt-1 text-sm text-slate-500">Add operational resources to start tracking deployments.</p></div> : (
            <div className="divide-y divide-slate-200">
              {filteredResources.map((resource) => (
                <article key={resource._id} className="admin-resource-card p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-900">{resource.name}</h3><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">{resource.type.replaceAll("_", " ")}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass[resource.status]}`}>{resource.status}</span></div>
                      <div className="mt-3 grid gap-2 text-sm text-slate-500 sm:grid-cols-2 lg:grid-cols-4"><span>Total: <strong className="text-slate-700">{resource.quantity}</strong></span><span>Available: <strong className="text-emerald-600">{resource.availableQuantity}</strong></span><span>Location: <strong className="text-slate-700">{resource.location || "Not specified"}</strong></span><span>Contact: <strong className="text-slate-700">{resource.contact || "Not specified"}</strong></span></div>
                      {(resource.assignedResponder || resource.assignedAlert) && <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">{resource.assignedResponder && <span className="inline-flex items-center gap-1"><UserRound size={13} /> {resource.assignedResponder.name}</span>}{resource.assignedAlert && <span className="rounded-full bg-red-50 px-2.5 py-1 font-medium text-red-700">Alert: {resource.assignedAlert.title}</span>}</div>}
                      {resource.notes && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{resource.notes}</p>}
                    </div>
                    <div className="flex gap-2"><button onClick={() => openEdit(resource)} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600"><Pencil size={14} /> Edit</button>{isAdmin && <button onClick={() => handleDelete(resource)} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"><Trash2 size={14} /> Delete</button>}</div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
