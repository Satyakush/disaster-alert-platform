import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, BarChart3, CheckCircle2, Flame, MapPin, Radio, ShieldCheck } from "lucide-react";
import Navbar from "../components/Navbar";
import { fetchAnalyticsOverview } from "../api/analytics";

const periods = [7, 30, 90, 365];

const severityClass = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchAnalyticsOverview(days);
        setData(result);
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [days]);

  const maxTrend = useMemo(() => Math.max(...(data?.trend || []).map((item) => item.alerts), 1), [data]);
  const maxDisaster = useMemo(() => Math.max(...(data?.byDisasterType || []).map((item) => item.count), 1), [data]);

  return (
    <div className="platform-polished admin-modern min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-2xl bg-slate-950 p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Intelligence center</p>
              <h1 className="mt-1 text-2xl font-bold">Disaster Analytics</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">Analyze historical incidents, identify recurring hotspots, and evaluate warning performance.</p>
            </div>
            <div className="flex rounded-xl border border-slate-700 bg-slate-900 p-1">{periods.map((period) => <button key={period} onClick={() => setDays(period)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${days === period ? "bg-cyan-500 text-slate-950" : "text-slate-300 hover:bg-slate-800"}`}>{period}d</button>)}</div>
          </div>
        </section>

        {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {loading && <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">Loading intelligence data...</div>}

        {!loading && data && <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Radio size={20} className="text-cyan-600" /><p className="mt-3 text-3xl font-bold text-slate-900">{data.totals.alerts}</p><p className="mt-1 text-sm text-slate-500">Alerts in selected period</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><AlertTriangle size={20} className="text-red-600" /><p className="mt-3 text-3xl font-bold text-slate-900">{data.totals.activeAlerts}</p><p className="mt-1 text-sm text-slate-500">Active or escalated alerts</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><ShieldCheck size={20} className="text-emerald-600" /><p className="mt-3 text-3xl font-bold text-slate-900">{data.totals.verifiedReports}</p><p className="mt-1 text-sm text-slate-500">Verified citizen reports</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Activity size={20} className="text-violet-600" /><p className="mt-3 text-3xl font-bold text-slate-900">{data.predictionEvaluation.accuracy === null ? "—" : `${data.predictionEvaluation.accuracy}%`}</p><p className="mt-1 text-sm text-slate-500">Recorded severity match</p></div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2"><BarChart3 size={19} className="text-cyan-600" /><div><h2 className="font-semibold text-slate-900">Alert trend</h2><p className="text-sm text-slate-500">Monthly alert volume for the selected period.</p></div></div>
              <div className="mt-6 space-y-4">{data.trend.length === 0 ? <p className="text-sm text-slate-500">No historical alert data in this period.</p> : data.trend.map((item) => <div key={`${item.year}-${item.month}`}><div className="mb-1 flex justify-between text-xs font-medium text-slate-500"><span>{new Date(item.year, item.month - 1).toLocaleString(undefined, { month: "short", year: "numeric" })}</span><span>{item.alerts} alerts</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyan-500" style={{ width: `${(item.alerts / maxTrend) * 100}%` }} /></div><div className="mt-1 text-[11px] text-slate-400">High: {item.high} · Critical: {item.critical}</div></div>)}</div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2"><Flame size={19} className="text-orange-600" /><div><h2 className="font-semibold text-slate-900">Disaster distribution</h2><p className="text-sm text-slate-500">Incident volume by hazard category.</p></div></div>
              <div className="mt-6 space-y-4">{data.byDisasterType.length === 0 ? <p className="text-sm text-slate-500">No alert data in this period.</p> : data.byDisasterType.map((item) => <div key={item.disasterType}><div className="mb-1 flex justify-between text-xs font-medium capitalize text-slate-500"><span>{item.disasterType}</span><span>{item.count}</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-orange-500" style={{ width: `${(item.count / maxDisaster) * 100}%` }} /></div></div>)}</div>
            </section>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">Severity profile</h2><p className="mt-1 text-sm text-slate-500">Current historical severity mix.</p><div className="mt-5 space-y-3">{["critical", "high", "medium", "low"].map((severity) => { const item = data.bySeverity.find((entry) => entry.severity === severity); return <div key={severity} className="flex items-center justify-between"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${severityClass[severity]}`}>{severity}</span><span className="font-semibold text-slate-700">{item?.count || 0}</span></div>; })}</div></section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">Warning evaluation</h2><p className="mt-1 text-sm text-slate-500">Comparison is based only on alerts with a recorded actual outcome.</p><div className="mt-5 space-y-4"><div><p className="text-xs uppercase text-slate-400">Evaluated alerts</p><p className="mt-1 text-2xl font-bold text-slate-900">{data.predictionEvaluation.evaluatedAlerts}</p></div><div><p className="text-xs uppercase text-slate-400">Matched severity</p><p className="mt-1 text-2xl font-bold text-emerald-600">{data.predictionEvaluation.matchedSeverity}</p></div><div><p className="text-xs uppercase text-slate-400">Average risk confidence</p><p className="mt-1 text-2xl font-bold text-slate-900">{data.predictionEvaluation.averageRiskConfidence === null ? "—" : `${data.predictionEvaluation.averageRiskConfidence}%`}</p></div></div></section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">Response activity</h2><p className="mt-1 text-sm text-slate-500">Operational lifecycle totals.</p><div className="mt-5 space-y-3">{Object.entries(data.statusCounts).map(([status, count]) => <div key={status} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"><span className="text-sm capitalize text-slate-600">{status}</span><span className="font-semibold text-slate-800">{count}</span></div>)}</div></section>
          </div>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4"><div className="flex items-center gap-2"><MapPin size={19} className="text-red-600" /><div><h2 className="font-semibold text-slate-900">Disaster hotspots</h2><p className="text-sm text-slate-500">Clusters of repeated alerts and citizen reports in the same geographic area.</p></div></div></div>
            {data.hotspots.length === 0 ? <div className="p-8 text-center"><MapPin size={30} className="mx-auto text-slate-300" /><p className="mt-3 font-medium text-slate-700">No recurring hotspots detected</p><p className="mt-1 text-sm text-slate-500">Hotspots appear when multiple incidents cluster geographically.</p></div> : <div className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">{data.hotspots.map((hotspot, index) => <article key={`${hotspot.coordinates.longitude}-${hotspot.coordinates.latitude}`} className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wide text-slate-400">Hotspot #{index + 1}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${severityClass[hotspot.level]}`}>{hotspot.level}</span></div><p className="mt-3 text-2xl font-bold text-slate-900">{hotspot.count} incidents</p><p className="mt-1 text-sm capitalize text-slate-500">Dominant hazard: {hotspot.dominantType}</p><p className="mt-3 text-xs text-slate-400">Lat {hotspot.coordinates.latitude} · Lng {hotspot.coordinates.longitude}</p><div className="mt-3 flex flex-wrap gap-1.5">{Object.entries(hotspot.sources).map(([source, count]) => <span key={source} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] capitalize text-slate-600">{source.replaceAll("_", " ")}: {count}</span>)}</div></article>)}</div>}
          </section>
        </>}
      </main>
    </div>
  );
}
