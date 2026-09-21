import { useMemo, useState } from "react";
import { Building2, CheckCircle2, MapPin, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import { createShelter, deleteShelter, updateShelter } from "../api/shelters";

const statuses = ["open", "limited", "full", "closed"];

const statusConfig = {
  open: { label: "Open", className: "bg-emerald-50 text-emerald-700 border-emerald-200", bar: "bg-emerald-500" },
  limited: { label: "Limited", className: "bg-amber-50 text-amber-700 border-amber-200", bar: "bg-amber-500" },
  full: { label: "Full", className: "bg-orange-50 text-orange-700 border-orange-200", bar: "bg-orange-500" },
  closed: { label: "Closed", className: "bg-slate-100 text-slate-600 border-slate-200", bar: "bg-slate-400" },
};

const emptyForm = {
  name: "",
  location: "",
  capacity: 100,
  availableCapacity: 100,
  status: "open",
  facilities: "",
  contact: "",
};

export default function ShelterManagement({ shelters = [], selectedRegion, onChanged }) {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const stats = useMemo(() => ({
    total: shelters.length,
    open: shelters.filter((shelter) => shelter.status === "open").length,
    capacity: shelters.reduce((sum, shelter) => sum + Number(shelter.capacity || 0), 0),
    available: shelters.reduce((sum, shelter) => sum + Number(shelter.availableCapacity || 0), 0),
  }), [shelters]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!selectedRegion && !editingId) {
      setError("Select the shelter location on the map before creating it.");
      return;
    }

    if (Number(form.availableCapacity) > Number(form.capacity)) {
      setError("Available capacity cannot exceed total capacity.");
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
    <section className="admin-modern-panel overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 p-6 text-white">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400">
              <Building2 size={17} />
              <p className="text-xs font-bold uppercase tracking-[0.2em]">Evacuation operations</p>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Shelter Command</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Manage emergency shelters, monitor available capacity, and maintain evacuation-ready facilities.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Shelters" value={stats.total} />
            <Metric label="Open" value={stats.open} />
            <Metric label="Capacity" value={stats.capacity} />
            <Metric label="Available" value={stats.available} />
          </div>
        </div>
      </div>

      <div className="p-6">
        {error && <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><X size={17} className="mt-0.5 shrink-0" />{error}</div>}

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-600">{editingId ? "Edit facility" : "Register facility"}</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">{editingId ? "Update shelter details" : "Add emergency shelter"}</h3>
            </div>
            {editingId && <button type="button" onClick={resetForm} className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-700"><X size={18} /></button>}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Shelter name"><input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Central Relief Shelter" required className="admin-field" /></Field>
              <Field label="Location"><input name="location" value={form.location} onChange={handleChange} placeholder="Area or address" required className="admin-field" /></Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Total capacity"><input type="number" name="capacity" min="1" value={form.capacity} onChange={handleChange} required className="admin-field" /></Field>
              <Field label="Available capacity"><input type="number" name="availableCapacity" min="0" value={form.availableCapacity} onChange={handleChange} required className="admin-field" /></Field>
              <Field label="Operational status"><select name="status" value={form.status} onChange={handleChange} className="admin-field">{statuses.map((status) => <option key={status} value={status}>{statusConfig[status].label}</option>)}</select></Field>
              <Field label="Emergency contact"><input name="contact" value={form.contact} onChange={handleChange} placeholder="Phone / contact" className="admin-field" /></Field>
            </div>

            <Field label="Facilities"><input name="facilities" value={form.facilities} onChange={handleChange} placeholder="Water, food, medical, sanitation..." className="admin-field" /><p className="mt-1 text-xs text-slate-400">Separate facilities with commas.</p></Field>

            <div className="flex items-center gap-3 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3">
              <MapPin size={18} className="shrink-0 text-cyan-600" />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">Map position</p>
                <p className="mt-0.5 text-sm text-slate-600">{editingId ? "Existing shelter coordinates are retained." : selectedRegion ? <><strong>{selectedRegion.lat.toFixed(5)}, {selectedRegion.lng.toFixed(5)}</strong> · Ready to register at selected map point.</> : "Click the map above to select the shelter location."}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button type="submit" disabled={loading || (!editingId && !selectedRegion)} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                {editingId ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                {loading ? "Saving..." : editingId ? "Update shelter" : "Create shelter"}
              </button>
              {editingId && <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>}
            </div>
          </form>
        </div>

        <div className="mt-7">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Live registry</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">Managed shelters</h3>
            </div>
            <span className="text-xs font-medium text-slate-400">{shelters.length} registered</span>
          </div>

          {shelters.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <Building2 size={34} className="mx-auto text-slate-300" />
              <p className="mt-3 font-semibold text-slate-700">No shelters registered</p>
              <p className="mt-1 text-sm text-slate-500">Select a location on the map and create the first emergency shelter.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {shelters.map((shelter) => {
                const config = statusConfig[shelter.status] || statusConfig.closed;
                const capacity = Number(shelter.capacity || 0);
                const available = Number(shelter.availableCapacity || 0);
                const occupancy = capacity ? Math.max(0, Math.min(100, ((capacity - available) / capacity) * 100)) : 0;

                return (
                  <article key={shelter._id} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="truncate font-bold text-slate-900">{shelter.name}</h4>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={14} className="text-slate-400" />{shelter.location}</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${config.className}`}>{config.label}</span>
                    </div>

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-500">Occupancy</span>
                        <span className="font-bold text-slate-700">{Math.round(occupancy)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full transition-all ${config.bar}`} style={{ width: `${occupancy}%` }} /></div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Info icon={Users} label="Total capacity" value={capacity} />
                      <Info icon={CheckCircle2} label="Available" value={available} />
                    </div>

                    {shelter.facilities?.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{shelter.facilities.map((facility) => <span key={facility} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium capitalize text-slate-600">{facility}</span>)}</div>}

                    {shelter.contact && <p className="mt-4 text-xs text-slate-500">Emergency contact: <span className="font-semibold text-slate-700">{shelter.contact}</span></p>}

                    <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                      <button type="button" onClick={() => handleEdit(shelter)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Pencil size={13} /> Edit</button>
                      <button type="button" onClick={() => handleDelete(shelter._id)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"><Trash2 size={13} /> Delete</button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-lg font-bold text-white">{value}</p></div>;
}

function Field({ label, children }) {
  return <label className="block text-sm font-semibold text-slate-700"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>{children}</label>;
}

function Info({ icon: Icon, label, value }) {
  return <div className="rounded-xl bg-slate-50 p-3"><div className="flex items-center gap-1.5 text-xs text-slate-400"><Icon size={13} />{label}</div><p className="mt-1 text-lg font-bold text-slate-900">{value}</p></div>;
}
