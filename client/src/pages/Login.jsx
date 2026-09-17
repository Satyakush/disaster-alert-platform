import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";
import { useAuth } from "../context/AuthContext";

function MailIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>;
}

function LockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>;
}

function EyeIcon({ hidden }) {
  return hidden ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.1A11.6 11.6 0 0 1 12 5c5.4 0 9 5 9 7s-3.6 7-9 7a9.7 9.7 0 0 1-5.1-1.5"/></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"/><circle cx="12" cy="12" r="2.5"/></svg>;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      navigate(user.role === "responder" ? "/responder" : "/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="Disaster Alert Platform">
        <div className="auth-visual-overlay" />
        <div className="auth-visual-content">
          <div className="auth-brand-mark">✦</div>
          <p className="auth-kicker">BE AWARE · BE PREPARED · BE SAFER</p>
          <h1><span>DISASTER</span><strong>ALERT</strong><small>PLATFORM</small></h1>
          <p className="auth-tagline">Real-time Alerts. Smarter Insights. Safer Communities.</p>
          <div className="auth-features">
            <span><b>◈</b> Early Warnings</span>
            <span><b>▥</b> Risk Analysis</span>
            <span><b>♧</b> Community Support</span>
            <span><b>♢</b> Disaster Preparedness</span>
          </div>
          <p className="auth-script">Together<br />for a Safer Tomorrow</p>
        </div>
      </section>

      <section className="auth-panel-wrap">
        <div className="auth-panel">
          <div className="auth-tabs">
            <button className="auth-tab active" type="button">Login</button>
            <button className="auth-tab" type="button" onClick={() => navigate("/register")}>Register</button>
          </div>

          <div className="auth-heading">
            <p>WELCOME BACK</p>
            <h2>Sign in to continue to Disaster Alert Platform</h2>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-input-wrap">
              <MailIcon />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" autoComplete="email" />
            </label>
            <label className="auth-input-wrap">
              <LockIcon />
              <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                <EyeIcon hidden={showPassword} />
              </button>
            </label>

            <div className="auth-options">
              <label><input type="checkbox" /> <span>Remember me</span></label>
              <span className="auth-muted-link">Stay secure</span>
            </div>

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? "Signing in..." : "Sign In"}<span>→</span>
            </button>
          </form>

          <div className="auth-divider"><span>OR</span></div>

          <div className="auth-socials">
            <button type="button" disabled>G <span>Continue with Google</span></button>
            <button type="button" disabled>◉ <span>Continue with GitHub</span></button>
          </div>

          <p className="auth-switch">New user? <button type="button" onClick={() => navigate("/register")}>Register here</button></p>
        </div>
      </section>
    </main>
  );
}
