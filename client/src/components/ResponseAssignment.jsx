import { useEffect, useState } from "react";
import { UserRoundPlus } from "lucide-react";
import { fetchResponseTeam } from "../api/responseTeam";
import { createResponseTask } from "../api/responseTasks";

export default function ResponseAssignment({ alert }) {
  const [members, setMembers] = useState([]);
  const [selectedResponder, setSelectedResponder] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchResponseTeam();
        setMembers(data.members || []);
      } catch (error) {
        setMessage("Unable to load response team");
      }
    };
    load();
  }, []);

  const responders = members.filter((member) => member.role === "responder");

  const handleAssign = async () => {
    if (!selectedResponder) return;
    setLoading(true);
    setMessage("");
    try {
      await createResponseTask({
        alertId: alert._id,
        responderId: selectedResponder,
        priority: alert.severity,
        notes,
      });
      setMessage("Responder assigned successfully");
      setSelectedResponder("");
      setNotes("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to assign responder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="platform-assignment mt-4 border-t border-slate-100 pt-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <UserRoundPlus size={16} /> Assign responder
      </div>
      {responders.length === 0 ? (
        <p className="text-xs text-slate-500">No responders are currently available. Assign the responder role from Response Team first.</p>
      ) : (
        <div className="space-y-2">
          <select value={selectedResponder} onChange={(event) => setSelectedResponder(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <option value="">Select responder</option>
            {responders.map((member) => <option key={member._id} value={member._id}>{member.name} · {member.email}</option>)}
          </select>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows="2" maxLength="2000" placeholder="Optional field instructions" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700" />
          <button disabled={!selectedResponder || loading} onClick={handleAssign} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Assigning..." : "Assign to response team"}
          </button>
          {message && <p className="text-xs text-slate-500">{message}</p>}
        </div>
      )}
    </div>
  );
}
