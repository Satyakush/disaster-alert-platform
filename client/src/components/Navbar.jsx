import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-slate-900 text-white px-6 py-4 shadow">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <h1 className="text-lg font-semibold tracking-wide">
          Disaster Alert Platform
        </h1>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300 capitalize">
            {user?.role}
          </span>

          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-1.5 rounded text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
