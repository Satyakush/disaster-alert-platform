import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-slate-900 text-white">
      <h1 className="font-semibold text-lg">
        Disaster Alert Platform
      </h1>

      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">
            {user.name}
          </span>

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
