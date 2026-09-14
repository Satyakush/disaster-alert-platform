import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, RefreshCw, ShieldAlert, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { convertReportToAlert, fetchReports, updateReportStatus } from "../api/reports";

const formatType = (value) => value?.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const priorityClasses = {
  low: "bg-slate-800 text-slate-300",
  medium: "bg-amber-500/15 text-amber-300",
  high: "bg-orange-500/15 text-orange-300",
  critical: "bg-red-500/15 text-red-300",
};

export default function ReportReview() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [note, setNote] = useState({});

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchReports();
      setReports(data.reports || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const changeStatus = async (id, status) => {
    try {
      setBusyId(id);
      await updateReportStatus(id, { status, verificationNote: note[id] || "" });
      toast.success(status === "verified" ? "Report verified" : "Report rejected");
      await loadReports();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update report");
    } finally {
      setBusyId(null);
    }
  };

  const convertToAlert = async (id) => {
    try {
      setBusyId(id);
      await convertReportToAlert(id);
      toast.success("Verified report is now an active alert");
      await loadReports();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create alert");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">Verification center</p>
            <h2 className="mt-2 text-3xl font-bold">Citizen Incident Reports</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Review citizen observations, verify credible incidents, and promote verified reports into live alerts.
            </p>
          </div>
          <button onClick={loadReports} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800">
            <RefreshCw size={16} /> Refresh
          </button>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">
            <ShieldAlert className="mx-auto text-slate-600" size={42} />
            <p className="mt-4 text-slate-300">No incident reports found.</p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {reports.map((report) => (
              <article key={report._id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${priorityClasses[report.priority] || priorityClasses.medium}`}>
                        {report.priority}
                      </span>
                      <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs capitalize text-slate-300">{report.status}</span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold">{report.title}</h3>
                    <p className="mt-1 text-sm text-cyan-400">{formatType(report.disasterType)}</p>
                  </div>
                  <span className="text-xs text-slate-500">{new Date(report.createdAt).toLocaleString()}</span>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-300">{report.description}</p>
                <div className="mt-4 space-y-2 text-sm text-slate-400">
                  <p><span className="text-slate-500">Location:</span> {report.location}</p>
                  <p><span className="text-slate-500">Reporter:</span> {report.createdBy?.name || "Unknown"}</p>
                  <p><span className="text-slate-500">Coordinates:</span> {report.coordinates?.coordinates?.join(", ") || "Unavailable"}</p>
                </div>

                {report.mediaUrl && (
                  <a href={report.mediaUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300">
                    View attached media <ExternalLink size={14} />
                  </a>
                )}

                {report.status === "pending" && (
                  <>
                    <textarea
                      value={note[report._id] || ""}
                      onChange={(event) => setNote((current) => ({ ...current, [report._id]: event.target.value }))}
                      placeholder="Verification note (optional)"
                      className="mt-5 min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none focus:border-cyan-500"
                    />
                    <div className="mt-3 flex gap-3">
                      <button disabled={busyId === report._id} onClick={() => changeStatus(report._id, "verified")} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50">
                        <CheckCircle2 size={16} /> Verify
                      </button>
                      <button disabled={busyId === report._id} onClick={() => changeStatus(report._id, "rejected")} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-300 disabled:opacity-50">
                        <XCircle size={16} /> Reject
                      </button>
                    </div>
                  </>
                )}

                {report.status === "verified" && !report.linkedAlert && (
                  <button disabled={busyId === report._id} onClick={() => convertToAlert(report._id)} className="mt-5 w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50">
                    Convert to Live Alert
                  </button>
                )}

                {report.linkedAlert && (
                  <div className="mt-5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                    Linked alert: {report.linkedAlert.title} · {report.linkedAlert.status}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
