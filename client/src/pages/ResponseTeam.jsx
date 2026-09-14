import { useEffect, useState } from "react";
import { UserCheck, UserMinus } from "lucide-react";
import { assignResponderRole, fetchResponseTeam, revokeResponderRole } from "../api/responseTeam";
import Navbar from "../components/Navbar";

export default function ResponseTeam() {
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  const loadTeam = async () => {
    try {
      const data = await fetchResponseTeam();
      setMembers(data.members || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load response team");
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const changeRole = async (member) => {
    setLoadingId(member._id || member.id);
    setError("");
    try {
      if (member.role === "responder") {
        await revokeResponderRole(member._id || member.id);
      } else {
        await assignResponderRole(member._id || member.id);
      }
      await loadTeam();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update responder role");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600">Operations access</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Response Team</h1>
          <p className="mt-1 text-sm text-slate-500">Assign trusted users to the responder role for emergency operations.</p>

          {error && <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            {members.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">No response team members yet.</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {members.map((member) => {
                  const id = member._id || member.id;
                  const isAdmin = member.role === "admin";
                  const isResponder = member.role === "responder";
                  return (
                    <div key={id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="font-semibold text-slate-900">{member.name}</h2>
                        <p className="text-sm text-slate-500">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">{member.role}</span>
                        {!isAdmin && (
                          <button type="button" onClick={() => changeRole(member)} disabled={loadingId === id} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                            {isResponder ? <UserMinus size={16} /> : <UserCheck size={16} />}
                            {loadingId === id ? "Updating..." : isResponder ? "Revoke" : "Assign responder"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
