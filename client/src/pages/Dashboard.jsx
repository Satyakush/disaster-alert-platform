import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, BellRing, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fetchAlerts } from "../api/alerts";
import { fetchReports } from "../api/reports";
import { fetchShelters } from "../api/shelters";
import { analyzeRisk } from "../api/risk";
import { connectToAlerts, disconnectFromAlerts, socket } from "../api/socket";
import Navbar from "../components/Navbar";
import MapView from "../components/MapView";
import CreateAlertForm from "../components/createAlertForm";
import AlertCard from "../components/AlertCard";
import EvacuationPanel from "../components/EvacuationPanel";

const riskStyles = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-red-50 text-red-700 border-red-200",
};

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [alerts, setAlerts] = useState([]);
  const [reports, setReports] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [error, setError] = useState("");
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [riskResult, setRiskResult] = useState(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [filters, setFilters] = useState({ status: "", disasterType: "", severity: "" });

  const loadData = async () => {
    try {
      const [alertsData, reportsData, sheltersData] = await Promise.all([
        fetchAlerts(),
        fetchReports({ status: "verified" }),
        fetchShelters({ status: "open" }),
      ]);
      setAlerts(alertsData.alerts || []);
      setReports(reportsData.reports || []);
      setShelters(sheltersData.shelters || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load disaster intelligence data");
    }
  };

  useEffect(() => {
    loadData();
    connectToAlerts();

    const handleCreated = (alert) => setAlerts((current) => [alert, ...current]);
    const handleUpdated = (alert) => setAlerts((current) => current.map((item) => (item._id === alert._id ? alert : item)));
    const handleStatusChanged = (alert) => setAlerts((current) => current.map((item) => (item._id === alert._id ? alert : item)));
    const handleDeleted = ({ id }) => setAlerts((current) => current.filter((item) => item._id !== id));
    const handleShelterCreated = (shelter) => setShelters((current) => [shelter, ...current]);
    const handleShelterUpdated = (shelter) => setShelters((current) => current.map((item) => (item._id === shelter._id ? shelter : item)));
    const handleShelterDeleted = ({ id }) => setShelters((current) => current.filter((item) => item._id !== id));

    socket.on("alert:created", handleCreated);
    socket.on("alert:updated", handleUpdated);
    socket.on("alert:status-changed", handleStatusChanged);
    socket.on("alert:deleted", handleDeleted);
    socket.on("shelter:created", handleShelterCreated);
    socket.on("shelter:updated", handleShelterUpdated);
    socket.on("shelter:deleted", handleShelterDeleted);

    return () => {
      socket.off("alert:created", handleCreated);
      socket.off("alert:updated", handleUpdated);
      socket.off("alert:status-changed", handleStatusChanged);
      socket.off("alert:deleted", handleDeleted);
      socket.off("shelter:created", handleShelterCreated);
      socket.off("shelter:updated", handleShelterUpdated);
      socket.off("shelter:deleted", handleShelterDeleted);
      disconnectFromAlerts();
    };
  }, []);

  useEffect(() => {
    if (!selectedRegion) return;

    const fetchRisk = async () => {
      setRiskLoading(true);
      try {
        const result = await analyzeRisk(selectedRegion);
        setRiskResult(result);
      } catch (err) {
        console.error("Risk analysis failed:", err);
        setRiskResult(null);
      } finally {
        setRiskLoading(false);
      }
    };

    fetchRisk();
  }, [selectedRegion]);

  useEffect(() => {
    if (!selectedAlert) return;
    const currentAlert = alerts.find((alert) => alert._id === selectedAlert._id);
    if (currentAlert) setSelectedAlert(currentAlert);
  }, [alerts, selectedAlert]);

  const filteredAlerts = useMemo(
    () => alerts.filter((alert) =>
      (!filters.status || alert.status === filters.status) &&
      (!filters.disasterType || alert.disasterType === filters.disasterType) &&
      (!filters.severity || alert.severity === filters.severity)
    ),
    [alerts, filters]
  );

  const activeCount = alerts.filter((alert) => ["active", "escalated"].includes(alert.status)).length;
  const criticalCount = alerts.filter((alert) => alert.severity === "critical").length;
  const resolvedCount = alerts.filter((alert) => alert.status === "resolved").length;
  const riskLevel = riskResult?.riskLevel || "low";
  const riskScore = Number(riskResult?.riskScore || 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <section className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-red-600">EARLY WARNING CENTER</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Disaster Intelligence Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Detect hazards, assess risk, and respond faster.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Live monitoring connected
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={BellRing} label="Total Alerts" value={alerts.length} />
          <StatCard icon={Activity} label="Active Alerts" value={activeCount} />
          <StatCard icon={ShieldAlert} label="Critical Alerts" value={criticalCount} />
          <StatCard icon={AlertTriangle} label="Resolved" value={resolvedCount} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <MapView onRegionSelect={setSelectedRegion} alerts={alerts} reports={reports} shelters={shelters} />

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Risk intelligence</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Selected area</h2>
              </div>
              {riskResult && <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${riskStyles[riskLevel] || riskStyles.low}`}>{riskLevel}</span>}
            </div>

            {!selectedRegion ? (
              <div className="mt-8 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Select an area on the map to calculate its current risk profile.</div>
            ) : riskLoading ? (
              <div className="mt-8 text-sm text-slate-500">Calculating risk profile...</div>
            ) : riskResult ? (
              <div className="mt-6 space-y-5">
                <div>
                  <div className="flex items-end justify-between">
                    <span className="text-sm text-slate-500">Risk score</span>
                    <span className="text-3xl font-bold text-slate-900">{riskScore}<span className="text-base text-slate-400">/100</span></span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-slate-900 transition-all" style={{ width: `${riskScore}%` }} /></div>
                </div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Confidence</span><span className="font-semibold text-slate-800">{Math.round((riskResult.confidence || 0) * 100)}%</span></div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-800">Risk factors</p>
                  <div className="space-y-2">
                    {(riskResult.factors || []).map((factor) => (
                      <div key={factor.name} className="rounded-lg bg-slate-50 p-3"><div className="flex justify-between gap-3 text-xs"><span className="capitalize text-slate-600">{factor.name.replaceAll("_", " ")}</span><span className="font-semibold text-slate-900">{Math.round(Number(factor.contribution ?? factor.value ?? 0))}</span></div></div>
                    ))}
                  </div>
                </div>
                {riskResult.recommendedActions?.length > 0 && <div><p className="mb-2 text-sm font-semibold text-slate-800">Recommended actions</p><ul className="space-y-2 text-sm text-slate-600">{riskResult.recommendedActions.slice(0, 4).map((action) => <li key={action}>• {action}</li>)}</ul></div>}
              </div>
            ) : null}
          </div>
        </section>

        <EvacuationPanel alert={selectedAlert} />

        {isAdmin && <CreateAlertForm onCreated={loadData} />}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div><h2 className="text-xl font-bold text-slate-900">Active intelligence feed</h2><p className="text-sm text-slate-500">Live alerts are updated automatically.</p></div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <FilterSelect value={filters.status} onChange={(value) => setFilters({ ...filters, status: value })} options={["active", "escalated", "resolved", "archived", "draft"]} placeholder="All statuses" />
              <FilterSelect value={filters.disasterType} onChange={(value) => setFilters({ ...filters, disasterType: value })} options={["flood", "cyclone", "earthquake", "wildfire", "heatwave", "storm", "landslide", "tsunami", "industrial", "other"]} placeholder="All hazards" />
              <FilterSelect value={filters.severity} onChange={(value) => setFilters({ ...filters, severity: value })} options={["low", "medium", "high", "critical"]} placeholder="All severity" />
            </div>
          </div>

          {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAlerts.length === 0 ? <p className="text-sm text-slate-500">No alerts match the selected filters.</p> : filteredAlerts.map((alert) => <AlertCard key={alert._id} alert={alert} setAlerts={setAlerts} onSelect={() => setSelectedAlert(alert)} selected={selectedAlert?._id === alert._id} />)}
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-slate-500">{label}</span><Icon size={19} className="text-slate-400" /></div><p className="mt-3 text-3xl font-bold text-slate-900">{value}</p></div>;
}

function FilterSelect({ value, onChange, options, placeholder }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"><option value="">{placeholder}</option>{options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select>;
}
