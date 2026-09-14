import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FileWarning, LayoutDashboard, LogOut, ShieldCheck, Users, Radio } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="border-b border-slate-800 bg-slate-950 text-white shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <button onClick={() => navigate(user?.role === "responder" ? "/responder" : "/dashboard")} className="flex items-center gap-3 text-left">
          <div className="rounded-xl bg-cyan-500 p-2 text-slate-950">
            <FileWarning size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wide">Disaster Intelligence</h1>
            <p className="text-xs text-slate-500">Early Warning Platform</p>
          </div>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          {user?.role === "responder" ? (
            <button onClick={() => navigate("/responder")} className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white sm:flex">
              <Radio size={16} /> Operations
            </button>
          ) : (
            <button onClick={() => navigate("/dashboard")} className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white sm:flex">
              <LayoutDashboard size={16} /> Dashboard
            </button>
          )}
          {user?.role === "admin" && (
            <>
              <button onClick={() => navigate("/responder")} className="hidden items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white lg:flex">
                <Radio size={16} /> Operations
              </button>
              <button onClick={() => navigate("/reports")} className="hidden items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white md:flex">
                <ShieldCheck size={16} /> Verify Reports
              </button>
              <button onClick={() => navigate("/response-team")} className="hidden items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white xl:flex">
                <Users size={16} /> Response Team
              </button>
            </>
          )}
          <button onClick={() => navigate("/report")} className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
            Report Incident
          </button>
          <span className="hidden text-sm capitalize text-slate-400 lg:block">{user?.role}</span>
          <button onClick={handleLogout} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-red-400" aria-label="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}
