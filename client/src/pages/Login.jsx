import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import "./login.css";

function MailIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>;
}

function LockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>;
}

function EyeIcon({ hidden }) {
  return hidden
    ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.1A11.6 11.6 0 0 1 12 5c5.4 0 9 5 9 7s-3.6 7-9 7a9.7 9.7 0 0 1-5.1-1.5"/></svg>
    : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"/><circle cx="12" cy="12" r="2.5"/></svg>;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginUser({ email, password });
      const { token, user } = data;
      login(token, user, remember);
      navigate(user.role === "responder" ? "/responder" : "/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="disaster-login">
      <section className="disaster-login__visual" aria-label="Disaster Alert Platform">
        <div className="disaster-login__visual-copy">
          <div className="disaster-login__badge">● Disaster Alert Platform</div>
          <h1>Stay informed.<br />Respond faster.</h1>
          <p>Monitor alerts, coordinate response teams, and keep communities informed through one secure operational platform.</p>
        </div>
      </section>

      <section className="disaster-login__panel-wrap">
        <div className="disaster-login__panel">
          <div className="disaster-login__tabs">
            <button className="disaster-login__tab active" type="button">Login</button>
            <button className="disaster-login__tab" type="button" onClick={() => navigate("/register")}>Register</button>
          </div>

          <div className="disaster-login__heading">
            <p>WELCOME BACK</p>
            <h2>Sign in to your response workspace</h2>
          </div>

          {error && <div className="disaster-login__error" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} className="disaster-login__form">
            <label className="disaster-login__field">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" autoComplete="email" aria-label="Email address" />
            </label>

            <label className="disaster-login__field">
              <input className="has-toggle" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" aria-label="Password" />
              <button type="button" className="disaster-login__toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                <EyeIcon hidden={showPassword} />
              </button>
            </label>

            <label className="disaster-login__remember">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Remember me
            </label>

            <button type="submit" disabled={loading} className="disaster-login__submit">
              {loading ? "Signing in..." : "Sign in →"}
            </button>
          </form>

          <p className="disaster-login__footer">New user? <button type="button" onClick={() => navigate("/register")}>Register here</button></p>
        </div>
      </section>
    </main>
  );
}
