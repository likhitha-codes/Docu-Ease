import { useState } from "react";
import { UserProfile } from "../types";

interface AuthModalProps {
  onLogin: (profile: UserProfile) => void;
  onClose: () => void;
}

type Tab = "login" | "register" | "phone";

export default function AuthModal({ onLogin, onClose }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.profile);
      } else {
        setError(data.error || "Login failed. Please try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    }
    setLoading(false);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name, email, phoneNumber: phone })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.profile);
      } else {
        setError(data.error || "Registration failed.");
      }
    } catch {
      setError("Connection error. Please try again.");
    }
    setLoading(false);
  }

  async function handlePhoneLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) { setError("Enter your phone number."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/lookup-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone })
      });
      const data = await res.json();
      if (res.ok && data.email) {
        const loginRes = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
          onLogin(loginData.profile);
        } else {
          setError(loginData.error || "Login failed.");
        }
      } else {
        setError(data.error || "Phone number not found.");
      }
    } catch {
      setError("Connection error. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        {/* Close */}
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Logo */}
        <div className="modal-logo">
          <span className="modal-logo-icon">📜</span>
          <h1 className="modal-logo-title">DocuEase</h1>
        </div>
        <p className="modal-tagline">Official Document Simplification Portal</p>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === "login" ? "active" : ""}`} onClick={() => { setTab("login"); setError(""); }}>
            Sign in
          </button>
          <button className={`auth-tab ${tab === "register" ? "active" : ""}`} onClick={() => { setTab("register"); setError(""); }}>
            Register
          </button>
          <button className={`auth-tab ${tab === "phone" ? "active" : ""}`} onClick={() => { setTab("phone"); setError(""); }}>
            Phone
          </button>
        </div>

        {/* Forms */}
        {tab === "login" && (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="field-group">
              <label className="field-label">Email address</label>
              <input
                className="field-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : "Continue"}
            </button>
            <p className="auth-switch">
              New here?{" "}
              <button type="button" className="link-btn" onClick={() => { setTab("register"); setError(""); }}>
                Create an account
              </button>
            </p>
          </form>
        )}

        {tab === "register" && (
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="field-group">
              <label className="field-label">Full name</label>
              <input
                className="field-input"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="field-group">
              <label className="field-label">Email address</label>
              <input
                className="field-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field-group">
              <label className="field-label">Phone number <span className="optional">(optional)</span></label>
              <input
                className="field-input"
                type="tel"
                placeholder="+91 99999 00000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : "Create account"}
            </button>
            <p className="auth-switch">
              Already have an account?{" "}
              <button type="button" className="link-btn" onClick={() => { setTab("login"); setError(""); }}>
                Sign in
              </button>
            </p>
          </form>
        )}

        {tab === "phone" && (
          <form className="auth-form" onSubmit={handlePhoneLookup}>
            <div className="field-group">
              <label className="field-label">Phone number</label>
              <input
                className="field-input"
                type="tel"
                placeholder="+91 99999 00000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                autoFocus
                required
              />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : "Find account"}
            </button>
            <p className="auth-hint">We'll look up your registered account using your phone number.</p>
          </form>
        )}
      </div>
    </div>
  );
}
