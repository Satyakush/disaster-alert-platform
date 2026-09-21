import { useEffect, useState } from "react";
import { UserCheck, UserMinus } from "lucide-react";
import { assignResponderRole, fetchAssignableUsers, fetchResponseTeam, revokeResponderRole } from "../api/responseTeam";
import Navbar from "../components/Navbar";

export default function ResponseTeam() {
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  const loadTeam = async () => {
    try {
      const [teamData, userData] = await Promise.all([fetchResponseTeam(), fetchAssignableUsers()]);
      setMembers(teamData.members || []);
      setUsers(userData.users || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load response team");
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const assignUser = async (user) => {
    const id = user._id || user.id;
    setLoadingId(id);
    setError("");
    try {
      await assignResponderRole(id);
      await loadTeam();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign responder role");
    } finally {
      setLoadingId(null);
    }
  };

  const revokeResponder = async (member) => {
    const id = member._id || member.id;
    setLoadingId(id);
    setError("");
    try {
      await revokeResponderRole(id);
      await loadTeam();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to revoke responder role");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="admin-modern min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600">Operations access</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Response Team</h1>
          <p className="mt-1 text-sm text-slate-500">Manage trusted personnel who can coordinate emergency response operations.</p>
          {error && <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5"><h2 className="font-semibold text-slate-900">Eligible users</h2><p className="mt-1 text-sm text-slate-500">Registered users who can be assigned to emergency response.</p></div>
          {users.length === 0 ? <div className="p-6 text-sm text-slate-500">No unassigned users available.</div> : <div className="divide-y divide-slate-200">{users.map((user) => { const id = user._id || user.id; return <div key={id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold text-slate-900">{user.name}</h3><p className="text-sm text-slate-500">{user.email}</p></div><button type="button" onClick={() => assignUser(user)} disabled={loadingId === id} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"><UserCheck size={16} />{loadingId === id ? "Assigning..." : "Assign responder"}</button></div>; })}</div>}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5"><h2 className="font-semibold text-slate-900">Current response team</h2><p className="mt-1 text-sm text-slate-500">Administrators and active responders.</p></div>
          <div className="divide-y divide-slate-200">{members.map((member) => { const id = member._id || member.id; const isAdmin = member.role === "admin"; return <div key={id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold text-slate-900">{member.name}</h3><p className="text-sm text-slate-500">{member.email}</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">{member.role}</span>{!isAdmin && <button type="button" onClick={() => revokeResponder(member)} disabled={loadingId === id} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><UserMinus size={16} />{loadingId === id ? "Updating..." : "Revoke"}</button>}</div></div>; })}</div>
        </section>
      </main>
    </div>
  );
}
