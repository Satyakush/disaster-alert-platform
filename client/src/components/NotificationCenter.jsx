import { useEffect, useState } from "react";
import { Bell, Check, FileCheck2, ShieldAlert } from "lucide-react";
import { socket } from "../api/socket";

const severityClass = {
  low: "bg-emerald-50 text-emerald-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-orange-50 text-orange-700",
  critical: "bg-red-50 text-red-700",
};

const priorityClass = {
  low: "bg-emerald-50 text-emerald-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-orange-50 text-orange-700",
  critical: "bg-red-50 text-red-700",
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const addNotification = (notification) => {
      setNotifications((current) => [notification, ...current].slice(0, 20));

      if (["high", "critical"].includes(notification.severity) && typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(notification.title, { body: notification.message });
      }
    };

    const handleAlert = (alert, event) => {
      if (!alert?._id || (event === "alert:created" && alert.status === "draft")) return;

      addNotification({
        id: `${event}-${alert._id}-${Date.now()}`,
        entityId: String(alert._id),
        title: alert.title || "Disaster alert update",
        message: event === "alert:created" ? "A new disaster alert has been published." : `Alert status changed to ${alert.status}.`,
        severity: alert.severity || "medium",
        kind: "alert",
        time: new Date(),
      });
    };

    const handleIncidentCreated = (report) => {
      if (!report?._id) return;

      addNotification({
        id: `incident-created-${report._id}-${Date.now()}`,
        entityId: String(report._id),
        title: "New citizen incident report",
        message: `${report.title} was submitted for admin verification.`,
        severity: report.priority || "medium",
        kind: "report",
        time: new Date(),
      });
    };

    const handleIncidentStatus = (report) => {
      if (!report?._id) return;

      const accepted = report.status === "verified";
      addNotification({
        id: `incident-status-${report._id}-${Date.now()}`,
        entityId: String(report._id),
        title: accepted ? "Your incident report was accepted" : "Your incident report was rejected",
        message: accepted
          ? `${report.title} was verified by an administrator.`
          : `${report.title} was rejected by an administrator.${report.verificationNote ? ` Note: ${report.verificationNote}` : ""}`,
        severity: accepted ? "low" : "medium",
        kind: "report",
        time: new Date(),
      });
    };

    const handleIncidentConverted = (report) => {
      if (!report?._id) return;

      addNotification({
        id: `incident-converted-${report._id}-${Date.now()}`,
        entityId: String(report._id),
        title: "Your report is now a live alert",
        message: `${report.title} was converted into an active disaster alert.`,
        severity: report.linkedAlert?.severity || report.priority || "medium",
        kind: "report",
        time: new Date(),
      });
    };

    const handleDeleted = ({ id }) => {
      if (!id) return;
      setNotifications((current) => current.filter((notification) => notification.entityId !== String(id)));
    };

    socket.on("alert:created", (alert) => handleAlert(alert, "alert:created"));
    socket.on("alert:status-changed", (alert) => handleAlert(alert, "alert:status-changed"));
    socket.on("alert:updated", (alert) => handleAlert(alert, "alert:updated"));
    socket.on("alert:deleted", handleDeleted);
    socket.on("incident:created", handleIncidentCreated);
    socket.on("incident:status-updated", handleIncidentStatus);
    socket.on("incident:converted", handleIncidentConverted);

    return () => {
      socket.off("alert:created");
      socket.off("alert:status-changed");
      socket.off("alert:updated");
      socket.off("alert:deleted", handleDeleted);
      socket.off("incident:created", handleIncidentCreated);
      socket.off("incident:status-updated", handleIncidentStatus);
      socket.off("incident:converted", handleIncidentConverted);
    };
  }, []);

  const enableBrowserAlerts = async () => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") await Notification.requestPermission();
  };

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((current) => !current)} className="relative rounded-lg p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white" aria-label="Notifications">
        <Bell size={18} />
        {notifications.length > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-4 text-white">{notifications.length > 9 ? "9+" : notifications.length}</span>}
      </button>
      {open && <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-700 bg-white text-slate-900 shadow-xl sm:w-96">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="font-semibold">Notifications</p>
            <p className="text-xs text-slate-500">Alerts and incident report updates</p>
          </div>
          <button type="button" onClick={() => setNotifications([])} className="text-xs font-medium text-slate-500 hover:text-slate-900">Clear</button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <ShieldAlert size={24} className="mx-auto text-slate-300" />
              <p className="mt-2 text-sm text-slate-600">No new notifications</p>
            </div>
          ) : notifications.map((notification) => (
            <div key={notification.id} className="border-b border-slate-100 px-4 py-3">
              <div className="flex gap-3">
                {notification.kind === "report" ? (
                  <span className="mt-0.5 rounded-full bg-cyan-50 p-1.5 text-cyan-700"><FileCheck2 size={14} /></span>
                ) : (
                  <span className={`mt-0.5 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${severityClass[notification.severity] || severityClass.medium}`}>{notification.severity}</span>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{notification.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{notification.message}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{notification.time.toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {typeof Notification !== "undefined" && Notification.permission !== "granted" && <button type="button" onClick={enableBrowserAlerts} className="flex w-full items-center justify-center gap-2 border-t border-slate-200 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Check size={14} />Enable browser emergency alerts</button>}
      </div>}
    </div>
  );
}
