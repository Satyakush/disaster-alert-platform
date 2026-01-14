import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";

import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const data = await loginUser({ email, password });

    const { token, user } = data;

    login(token, user);
    navigate("/dashboard");
  } catch (err) {
    console.error("Login failed:", err);
    setError("Invalid email or password");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md bg-white rounded-xl p-8">
        <h1 className="text-2xl font-bold text-center">
          Disaster Alert Platform
        </h1>

        {error && (
          <p className="text-red-600 text-sm mt-4 text-center">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full border px-3 py-2 rounded"
          />

          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full border px-3 py-2 rounded"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        
        <p className="text-sm text-center mt-4">
  New user?{" "}
  <span
    onClick={() => navigate("/register")}
    className="text-blue-600 cursor-pointer"
  >
    Register here
  </span>
</p>

      </div>
    </div>
  );
}
