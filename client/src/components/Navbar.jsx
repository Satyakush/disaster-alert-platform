import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileWarning, LayoutDashboard, LogOut, ShieldCheck, Users, Radio, Boxes, BarChart3, Building2, ClipboardList, Menu, X } from "lucide-react";
import NotificationCenter from "./NotificationCenter";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="platform-navbar border-b border-slate-800 bg-slate-950 text-white shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <button onClick={() => navigate(user?.role === "responder" ? "/responder" : "/dashboard")} className="flex items-center gap-3 text-left"><div className="rounded-xl bg-cyan-500 p-2 text-slate-950"><FileWarning size={20} /></div><div><h1 className="text-base font-bold tracking-wide">Disaster Intelligence</h1><p className="text-xs text-slate-500">Early Warning Platform</p></div></button>
        <div className="hidden items-center gap-2 sm:flex sm:gap-3">
          {user?.role === "responder" ? <button onClick={() => navigate("/responder")} className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white sm:flex"><Radio size={16} /> Operations</button> : <button onClick={() => navigate("/dashboard")} className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white sm:flex"><LayoutDashboard size={16} /> Dashboard</button>}
          <button onClick={() => navigate("/analytics")} className="hidden items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white lg:flex"><BarChart3 size={16} /> Analytics</button>
          {(user?.role === "responder" || user?.role === "admin") && <><button onClick={() => navigate("/resources")} className="hidden items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white lg:flex"><Boxes size={16} /> Resources</button><button onClick={() => navigate("/infrastructure")} className="hidden items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white xl:flex"><Building2 size={16} /> Infrastructure</button></>}
          {user?.role === "admin" && <><button onClick={() => navigate("/responder")} className="hidden items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white lg:flex"><Radio size={16} /> Operations</button><button onClick={() => navigate("/reports")} className="hidden items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white md:flex"><ShieldCheck size={16} /> Verify Reports</button><button onClick={() => navigate("/response-team")} className="hidden items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white xl:flex"><Users size={16} /> Response Team</button></>}
          {user?.role !== "admin" && <button onClick={() => navigate("/my-reports")} className="hidden items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white md:flex"><ClipboardList size={16} /> My Reports</button>}
          <NotificationCenter />
          <button onClick={() => navigate("/report")} className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">Report Incident</button>
          <span className="hidden text-sm capitalize text-slate-400 lg:block">{user?.role}</span><button onClick={handleLogout} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-red-400" aria-label="Logout"><LogOut size={18} /></button>
        </div>
        <button type="button" className="flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-700 text-slate-200 sm:hidden" aria-label={isMenuOpen ? "Close navigation" : "Open navigation"} aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen(v => !v)}>{isMenuOpen ? <X size={20}/> : <Menu size={20}/>}</button>
      </div>
      {isMenuOpen && <div className="border-t border-slate-800 px-4 py-3 sm:hidden"><div className="grid gap-1">
        <button onClick={() => { navigate(user?.role === "responder" ? "/responder" : "/dashboard"); setIsMenuOpen(false); }} className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"><LayoutDashboard size={17}/> Dashboard</button>
        <button onClick={() => { navigate("/analytics"); setIsMenuOpen(false); }} className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"><BarChart3 size={17}/> Analytics</button>
        {(user?.role === "responder" || user?.role === "admin") && <><button onClick={() => { navigate("/resources"); setIsMenuOpen(false); }} className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"><Boxes size={17}/> Resources</button><button onClick={() => { navigate("/infrastructure"); setIsMenuOpen(false); }} className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"><Building2 size={17}/> Infrastructure</button></>}
        {user?.role === "admin" && <><button onClick={() => { navigate("/reports"); setIsMenuOpen(false); }} className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"><ShieldCheck size={17}/> Verify Reports</button><button onClick={() => { navigate("/response-team"); setIsMenuOpen(false); }} className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"><Users size={17}/> Response Team</button></>}
        {user?.role !== "admin" && <button onClick={() => { navigate("/my-reports"); setIsMenuOpen(false); }} className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"><ClipboardList size={17}/> My Reports</button>}
        <button onClick={() => { navigate("/report"); setIsMenuOpen(false); }} className="mt-1 min-h-11 rounded-lg bg-cyan-500 px-3 py-2 text-left text-sm font-bold text-slate-950">Report Incident</button>
        <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="mt-1 flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-red-950/30"><LogOut size={17}/> Logout</button>
      </div></div>}
    </nav>
  );
}
