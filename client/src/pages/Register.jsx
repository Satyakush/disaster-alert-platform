import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function UserIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>;
}

function MailIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>;
}

function LockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>;
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      navigate("/login");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-visual" style={{ backgroundImage: "url(/disaster.png)" }} aria-label="Disaster Alert Platform">
        <div className="auth-visual-overlay" />
      </section>

      <section className="auth-panel-wrap">
        <div className="auth-panel">
          <div className="auth-tabs">
            <button className="auth-tab" type="button" onClick={() => navigate("/login")}>Login</button>
            <button className="auth-tab active" type="button">Register</button>
          </div>

          <div className="auth-heading">
            <p>JOIN THE PLATFORM</p>
            <h2>Create your Disaster Alert Platform account</h2>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-input-wrap">
              <UserIcon />
              <input name="name" placeholder="Full name" value={form.name} onChange={handleChange} required autoComplete="name" />
            </label>
            <label className="auth-input-wrap">
              <MailIcon />
              <input name="email" type="email" placeholder="Email address" value={form.email} onChange={handleChange} required autoComplete="email" />
            </label>
            <label className="auth-input-wrap">
              <LockIcon />
              <input name="password" type="password" placeholder="Create password" value={form.password} onChange={handleChange} required minLength={6} autoComplete="new-password" />
            </label>

            <p className="auth-helper">Your account gives you access to real-time alerts, risk intelligence and community safety tools.</p>

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? "Creating..." : "Create Account"}<span>→</span>
            </button>
          </form>

          <div className="auth-divider"><span>OR</span></div>

          <div className="auth-socials">
            <button type="button" disabled>G <span>Continue with Google</span></button>
            <button type="button" disabled>◉ <span>Continue with GitHub</span></button>
          </div>

          <p className="auth-switch">Already have an account? <button type="button" onClick={() => navigate("/login")}>Sign in</button></p>
        </div>
      </section>
    </main>
  );
}
