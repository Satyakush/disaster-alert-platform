import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, ExternalLink, FileWarning, RefreshCw, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { fetchMyReports } from "../api/reports";

const statusConfig = {
  pending: {
    label: "Pending review",
    icon: Clock3,
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  verified: {
    label: "Accepted by admin",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Rejected by admin",
    icon: XCircle,
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

const formatType = (value) => value?.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchMyReports();
      setReports(data.reports || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load your reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <section className="rounded-2xl bg-slate-950 p-6 text-white shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">Citizen activity</p>
          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold">My Incident Reports</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Track every incident you have reported, its verification status, admin feedback, and whether it became a live disaster alert.</p>
            </div>
            <button type="button" onClick={loadReports} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">Loading your reports...</div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <FileWarning className="mx-auto text-slate-300" size={42} />
            <h2 className="mt-4 text-lg font-semibold text-slate-800">No reports yet</h2>
            <p className="mt-1 text-sm text-slate-500">Your submitted incident reports will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const config = statusConfig[report.status] || statusConfig.pending;
              const StatusIcon = config.icon;

              return (
                <article key={report._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}>
                          <StatusIcon size={13} /> {config.label}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">{report.priority}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs capitalize text-slate-600">{formatType(report.disasterType)}</span>
                      </div>
                      <h2 className="mt-3 text-xl font-bold text-slate-900">{report.title}</h2>
                      <p className="mt-1 text-sm text-slate-500">{report.location}</p>
                    </div>
                    <p className="shrink-0 text-xs text-slate-400">{new Date(report.createdAt).toLocaleString()}</p>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600">{report.description}</p>

                  {report.verificationNote && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Admin note</p>
                      <p className="mt-1 text-sm text-slate-700">{report.verificationNote}</p>
                    </div>
                  )}

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Review status</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{config.label}</p>
                      {report.verifiedAt && <p className="mt-1 text-xs text-slate-500">Updated {new Date(report.verifiedAt).toLocaleString()}</p>}
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live alert</p>
                      {report.linkedAlert ? (
                        <div className="mt-1">
                          <p className="text-sm font-semibold text-emerald-700">Published as active alert</p>
                          <p className="mt-1 text-xs text-slate-500">{report.linkedAlert.title} · {report.linkedAlert.severity}</p>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-slate-500">{report.status === "verified" ? "Accepted, awaiting alert conversion" : "Not converted"}</p>
                      )}
                    </div>
                  </div>

                  {report.mediaUrl && (
                    <a href={report.mediaUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-600 hover:text-cyan-500">
                      View submitted evidence <ExternalLink size={14} />
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
