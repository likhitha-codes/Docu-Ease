import { useState, useEffect, useRef } from "react";
import AuthModal from "./components/AuthModal";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import { UserProfile, HistoryItem } from "./types";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [saved, setSaved] = useState<HistoryItem[]>([]);
  const [activeView, setActiveView] = useState<"home" | "history" | "saved" | "result">("home");
  const [currentResult, setCurrentResult] = useState<HistoryItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("docuease_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        fetchUserData(parsed.email);
      } catch {
        localStorage.removeItem("docuease_user");
      }
    }
  }, []);

  async function fetchUserData(email: string) {
    try {
      const res = await fetch("/api/history", {
        headers: { "x-user-email": email }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
        setSaved(data.saved || []);
      }
    } catch {}
  }

  async function handleLogin(profile: UserProfile) {
    setUser(profile);
    localStorage.setItem("docuease_user", JSON.stringify(profile));
    setShowAuth(false);
    await fetchUserData(profile.email);
  }

  function handleLogout() {
    setUser(null);
    localStorage.removeItem("docuease_user");
    setHistory([]);
    setSaved([]);
    setActiveView("home");
    setCurrentResult(null);
  }

  async function handleProcess(result: HistoryItem, newScore: number) {
    setCurrentResult(result);
    setActiveView("result");
    if (user) {
      const updatedUser = { ...user, trustScore: newScore };
      setUser(updatedUser);
      localStorage.setItem("docuease_user", JSON.stringify(updatedUser));
      await fetchUserData(user.email);
    }
  }

  // Updates only the trust score (no navigation) — used when an upload is
  // rejected (e.g. non-government document) so the sidebar score and lock
  // state stay in sync without yanking the user to a result view.
  function handleTrustScoreSync(newScore: number) {
    if (!user) return;
    const updatedUser = { ...user, trustScore: newScore };
    setUser(updatedUser);
    localStorage.setItem("docuease_user", JSON.stringify(updatedUser));
  }

  async function handleSave(docId: string, saveState: boolean) {
    if (!user) return;
    await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-email": user.email },
      body: JSON.stringify({ documentId: docId, saveState })
    });
    await fetchUserData(user.email);
  }

  async function handleDelete(docId: string) {
    if (!user) return;
    await fetch(`/api/history/${docId}`, {
      method: "DELETE",
      headers: { "x-user-email": user.email }
    });
    await fetchUserData(user.email);
    if (currentResult?.id === docId) {
      setCurrentResult(null);
      setActiveView("home");
    }
  }

  return (
    <div className="app-shell">
      {/* Auth Modal */}
      {showAuth && (
        <AuthModal
          onLogin={handleLogin}
          onClose={() => setShowAuth(false)}
        />
      )}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar
        user={user}
        history={history}
        saved={saved}
        activeView={activeView}
        currentResultId={currentResult?.id}
        sidebarOpen={sidebarOpen}
        onNavigate={(view, item?) => {
          setActiveView(view);
          if (item) setCurrentResult(item);
          setSidebarOpen(false);
        }}
        onShowAuth={() => setShowAuth(true)}
        onLogout={handleLogout}
        onDelete={handleDelete}
      />

      <main className="main-area">
        {/* Top bar */}
        <header className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="topbar-brand">
            <span className="brand-icon">📜</span>
            <span className="brand-name">DocuEase</span>
          </div>
          <div className="topbar-right">
            {!user ? (
              <button className="btn-sign-in" onClick={() => setShowAuth(true)}>Sign in</button>
            ) : (
              <div className="avatar-wrap" title={user.displayName}>
                <div className="avatar">{user.displayName?.[0]?.toUpperCase() || "U"}</div>
              </div>
            )}
          </div>
        </header>

        <MainContent
          user={user}
          activeView={activeView}
          currentResult={currentResult}
          history={history}
          saved={saved}
          loading={loading}
          setLoading={setLoading}
          onProcess={handleProcess}
          onTrustScoreSync={handleTrustScoreSync}
          onSave={handleSave}
          onDelete={handleDelete}
          onShowAuth={() => setShowAuth(true)}
          onNavigate={(view, item?) => {
            setActiveView(view);
            if (item) setCurrentResult(item);
          }}
        />
      </main>
    </div>
  );
}