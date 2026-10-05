import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./login.css";

function EyeIcon({ hidden }) {
  return hidden
    ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.1A11.6 11.6 0 0 1 12 5c5.4 0 9 5 9 7s-3.6 7-9 7a9.7 9.7 0 0 1-5.1-1.5"/></svg>
    : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"/><circle cx="12" cy="12" r="2.5"/></svg>;
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="disaster-login">
      <section className="disaster-login__visual" aria-label="Disaster Alert Platform">
        <div className="disaster-login__visual-mark" aria-hidden="true"><svg viewBox="0 0 64 64"><path d="M32 5 53 13v17c0 14-9 24-21 29C20 54 11 44 11 30V13L32 5Z"/><path d="m32 17 4.2 9 9.8 1-7.3 6.5 2.1 9.5-8.8-5-8.8 5 2.1-9.5-7.3-6.5 9.8-1L32 17Z"/></svg></div>
        <div className="disaster-login__visual-copy">
          <div className="disaster-login__badge"><span className="disaster-login__status-dot" /> Disaster Alert Platform</div>
          <h1>Stay informed.<br />Respond faster.</h1>
          <p>Monitor alerts, coordinate response teams, and keep communities informed through one secure operational platform.</p>
        </div>
      </section>

      <section className="disaster-login__panel-wrap">
        <div className="disaster-login__panel">
          <div className="disaster-login__tabs">
            <button className="disaster-login__tab" type="button" onClick={() => navigate("/login")}>Login</button>
            <button className="disaster-login__tab active" type="button">Register</button>
          </div>

          <div className="disaster-login__heading">
            <p>SECURE OPERATIONS</p>
            <h2>Create your account</h2>
          </div>

          {error && <div className="disaster-login__error" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} className="disaster-login__form">
            <label className="disaster-login__field">
              <input name="name" required value={form.name} onChange={handleChange} placeholder="Full name" autoComplete="name" aria-label="Full name" />
            </label>

            <label className="disaster-login__field">
              <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="Email address" autoComplete="email" aria-label="Email address" />
            </label>

            <label className="disaster-login__field">
              <input className="has-toggle" type={showPassword ? "text" : "password"} name="password" required minLength={6} value={form.password} onChange={handleChange} placeholder="Create password" autoComplete="new-password" aria-label="Password" />
              <button type="button" className="disaster-login__toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                <EyeIcon hidden={showPassword} />
              </button>
            </label>

            <p className="disaster-login__footer" style={{ margin: 0, textAlign: "left" }}>Use at least 6 characters for a secure password.</p>

            <button type="submit" disabled={loading} className="disaster-login__submit">
              {loading ? "Creating account..." : "Create account →"}
            </button>
          </form>

          <p className="disaster-login__footer">Already have an account? <button type="button" onClick={() => navigate("/login")}>Sign in</button></p>
        </div>
      </section>
    </main>
  );
}
