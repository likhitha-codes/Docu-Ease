import { HistoryItem, UserProfile } from "../types";

interface SidebarProps {
  user: UserProfile | null;
  history: HistoryItem[];
  saved: HistoryItem[];
  activeView: string;
  currentResultId?: string;
  sidebarOpen: boolean;
  onNavigate: (view: "home" | "history" | "saved" | "result", item?: HistoryItem) => void;
  onShowAuth: () => void;
  onLogout: () => void;
  onDelete: (id: string) => void;
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function Sidebar({
  user, history, saved, activeView, currentResultId,
  sidebarOpen, onNavigate, onShowAuth, onLogout, onDelete
}: SidebarProps) {
  const trustColor = (score: number) => {
    if (score >= 80) return "#1e8e3e";
    if (score >= 50) return "#f9ab00";
    return "#d93025";
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">📜</span>
        <span className="sidebar-brand-name">DocuEase</span>
      </div>

      {/* New document */}
      <div className="sidebar-section">
        <button
          className={`sidebar-new-btn ${activeView === "home" ? "active" : ""}`}
          onClick={() => onNavigate("home")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Document
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <button
          className={`sidebar-nav-item ${activeView === "saved" ? "active" : ""}`}
          onClick={() => onNavigate("saved")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          Saved
        </button>
        <button
          className={`sidebar-nav-item ${activeView === "history" ? "active" : ""}`}
          onClick={() => onNavigate("history")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          History
        </button>
      </nav>

      {/* Recent history */}
      {user && history.length > 0 && (
        <div className="sidebar-history">
          <p className="sidebar-section-label">Recent</p>
          <ul className="sidebar-history-list">
            {history.slice(0, 8).map(item => (
              <li key={item.id}>
                <button
                  className={`sidebar-history-item ${currentResultId === item.id && activeView === "result" ? "active" : ""}`}
                  onClick={() => onNavigate("result", item)}
                >
                  <span className="sidebar-history-title">{item.title || "Untitled"}</span>
                  <span className="sidebar-history-time">{timeAgo(item.timestamp)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="sidebar-footer">
        {user ? (
          <div className="sidebar-user-card">
            <div className="sidebar-user-top">
              <div className="sidebar-avatar">{user.displayName?.[0]?.toUpperCase() || "U"}</div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user.displayName}</span>
                <span className="sidebar-user-email">{user.email}</span>
              </div>
            </div>
            <div className="trust-bar-wrap">
              <div className="trust-bar-header">
                <span className="trust-label">Trust Score</span>
                <span className="trust-value" style={{ color: trustColor(user.trustScore) }}>
                  {user.trustScore}
                </span>
              </div>
              <div className="trust-bar-track">
                <div
                  className="trust-bar-fill"
                  style={{
                    width: `${user.trustScore}%`,
                    backgroundColor: trustColor(user.trustScore)
                  }}
                />
              </div>
            </div>
            <button className="sidebar-logout-btn" onClick={onLogout}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </button>
          </div>
        ) : (
          <button className="sidebar-signin-btn" onClick={onShowAuth}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Sign in
          </button>
        )}
      </div>
    </aside>
  );
}
