import { HistoryItem } from "../types";

interface HistoryViewProps {
  items: HistoryItem[];
  saved: HistoryItem[];
  title: string;
  emptyMessage: string;
  onOpen: (item: HistoryItem) => void;
  onSave: (id: string, state: boolean) => void;
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
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function HistoryView({
  items, saved, title, emptyMessage, onOpen, onSave, onDelete
}: HistoryViewProps) {
  return (
    <div className="history-view">
      <div className="history-header">
        <h2 className="history-title">{title}</h2>
        <span className="history-count">{items.length} document{items.length !== 1 ? "s" : ""}</span>
      </div>

      {items.length === 0 ? (
        <div className="history-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <ul className="history-list">
          {items.map(item => {
            const isSaved = saved.some(s => s.id === item.id);
            return (
              <li key={item.id} className="history-card" onClick={() => onOpen(item)}>
                <div className="history-card-body">
                  <p className="history-card-type">{item.documentType}</p>
                  <h3 className="history-card-title">{item.title || "Untitled Document"}</h3>
                  <p className="history-card-summary">{item.summary}</p>
                </div>
                <div className="history-card-footer">
                  <span className="history-card-time">{timeAgo(item.timestamp)}</span>
                  <div className="history-card-btns" onClick={e => e.stopPropagation()}>
                    <button
                      className={`history-card-btn ${isSaved ? "saved" : ""}`}
                      onClick={() => onSave(item.id, !isSaved)}
                      title={isSaved ? "Remove bookmark" : "Bookmark"}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                      </svg>
                    </button>
                    <button
                      className="history-card-btn delete"
                      onClick={() => onDelete(item.id)}
                      title="Delete"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
