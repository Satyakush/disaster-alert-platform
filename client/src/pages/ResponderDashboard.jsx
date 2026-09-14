import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, MapPin, ShieldAlert, Truck } from "lucide-react";
import Navbar from "../components/Navbar";
import { fetchResponseTasks, updateResponseTask } from "../api/responseTasks";

const statusOptions = ["assigned", "acknowledged", "in_progress", "completed", "cancelled"];

const severityClass = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function ResponderDashboard() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadTasks = async () => {
    try {
      const data = await fetchResponseTasks();
      setTasks(data.tasks || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load response assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const updateTask = async (task, status) => {
    const id = task._id || task.id;
    setUpdatingId(id);
    try {
      const data = await updateResponseTask(id, { status });
      setTasks((current) => current.map((item) => (item._id === id ? data.task : item)));
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update assignment");
    } finally {
      setUpdatingId(null);
    }
  };

  const stats = useMemo(() => {
    const active = tasks.filter((task) => ["assigned", "acknowledged", "in_progress"].includes(task.status)).length;
    const critical = tasks.filter((task) => task.priority === "critical").length;
    const completed = tasks.filter((task) => task.status === "completed").length;
    return { active, critical, completed };
  }, [tasks]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-2xl bg-slate-950 p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Emergency operations</p>
              <h1 className="mt-1 text-2xl font-bold">Responder Dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">Manage your assigned incidents, acknowledge deployments, and track field response progress.</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300">
              <ShieldAlert size={18} className="text-cyan-400" />
              Field response mode
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><Clock3 size={20} className="text-cyan-600" /><span className="text-xs font-semibold uppercase text-slate-400">Active</span></div>
            <p className="mt-3 text-3xl font-bold text-slate-900">{stats.active}</p>
            <p className="mt-1 text-sm text-slate-500">Assignments requiring action</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><AlertTriangle size={20} className="text-red-600" /><span className="text-xs font-semibold uppercase text-slate-400">Critical</span></div>
            <p className="mt-3 text-3xl font-bold text-slate-900">{stats.critical}</p>
            <p className="mt-1 text-sm text-slate-500">High-priority deployments</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><CheckCircle2 size={20} className="text-emerald-600" /><span className="text-xs font-semibold uppercase text-slate-400">Completed</span></div>
            <p className="mt-3 text-3xl font-bold text-slate-900">{stats.completed}</p>
            <p className="mt-1 text-sm text-slate-500">Completed response assignments</p>
          </div>
        </div>

        {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">My assignments</h2>
              <p className="text-sm text-slate-500">Incidents assigned to you by emergency administrators.</p>
            </div>
            <Truck size={20} className="text-slate-400" />
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading assignments...</div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center">
              <ShieldAlert size={28} className="mx-auto text-slate-300" />
              <p className="mt-3 font-medium text-slate-700">No response assignments</p>
              <p className="mt-1 text-sm text-slate-500">New deployments assigned by an admin will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {tasks.map((task) => {
                const alert = task.alert || {};
                const id = task._id || task.id;
                const severity = alert.severity || task.priority || "medium";
                return (
                  <article key={id} className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${severityClass[severity] || severityClass.medium}`}>{severity}</span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">{task.status.replace("_", " ")}</span>
                          <span className="text-xs text-slate-400">{alert.disasterType || "incident"}</span>
                        </div>
                        <h3 className="mt-3 text-lg font-bold text-slate-900">{alert.title || alert.location || "Emergency assignment"}</h3>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                          {alert.location && <span className="inline-flex items-center gap-1"><MapPin size={15} />{alert.location}</span>}
                          {alert.radius && <span>{(alert.radius / 1000).toFixed(1)} km affected radius</span>}
                        </div>
                        {task.notes && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{task.notes}</p>}
                      </div>

                      <div className="flex flex-col gap-2 lg:min-w-52">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Response status</label>
                        <select value={task.status} disabled={updatingId === id} onChange={(event) => updateTask(task, event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-cyan-500 disabled:opacity-50">
                          {statusOptions.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
                        </select>
                        {updatingId === id && <span className="text-xs text-slate-400">Updating...</span>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
