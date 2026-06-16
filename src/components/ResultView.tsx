import { useState } from "react";
import { HistoryItem } from "../types";

interface ResultViewProps {
  result: HistoryItem;
  isSaved: boolean;
  onSave: () => void;
  onDelete: () => void;
  onNew: () => void;
}

type ActiveLang = "en" | "te" | "hi";

export default function ResultView({ result, isSaved, onSave, onDelete, onNew }: ResultViewProps) {
  const [activeLang, setActiveLang] = useState<ActiveLang>("en");
  const [copied, setCopied] = useState(false);

  function getContent() {
    if (activeLang === "en") return result.simplifiedEnglish;
    if (activeLang === "te") return result.teluguTranslation;
    return result.hindiTranslation;
  }

  function handleCopy() {
    navigator.clipboard.writeText(getContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const docTypeColor: Record<string, string> = {
    "Government Order": "#1a73e8",
    "Circular": "#188038",
    "Welfare Scheme": "#e37400",
    "Tax & Customs Notice": "#d93025",
    "Judiciary Brief": "#9334e6",
    "Public Notice": "#0288d1",
    "Advisory": "#00897b",
  };
  const tagColor = docTypeColor[result.documentType] || "#5f6368";

  return (
    <div className="result-view">
      {/* Back + actions */}
      <div className="result-topbar">
        <button className="result-back" onClick={onNew}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          New document
        </button>
        <div className="result-actions">
          <button
            className={`result-action-btn ${isSaved ? "saved" : ""}`}
            onClick={onSave}
            title={isSaved ? "Remove from saved" : "Save"}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            {isSaved ? "Saved" : "Save"}
          </button>
          <button className="result-action-btn copy-btn" onClick={handleCopy}>
            {copied ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copy
              </>
            )}
          </button>
          <button
            className="result-action-btn delete-btn"
            onClick={onDelete}
            title="Delete"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/>
              <path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="result-header">
        <div className="result-meta">
          <span
            className="doc-type-tag"
            style={{ color: tagColor, backgroundColor: tagColor + "18", borderColor: tagColor + "30" }}
          >
            {result.documentType}
          </span>
          <span className="result-date">{new Date(result.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
        </div>
        <h1 className="result-title">{result.title}</h1>
        <p className="result-summary">{result.summary}</p>
      </div>

      {/* Lang tabs */}
      <div className="lang-tabs">
        {([
          { value: "en", label: "English" },
          { value: "te", label: "Telugu" },
          { value: "hi", label: "Hindi" },
        ] as { value: ActiveLang; label: string }[]).map(tab => (
          <button
            key={tab.value}
            className={`lang-tab ${activeLang === tab.value ? "active" : ""}`}
            onClick={() => setActiveLang(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="result-content">
        <div className={`result-text ${activeLang !== "en" ? "regional-script" : ""}`}>
          {getContent()}
        </div>
      </div>

      {/* Glossary */}
      {result.glossary && result.glossary.length > 0 && (
        <div className="glossary-section">
          <h3 className="glossary-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            Glossary
          </h3>
          <div className="glossary-grid">
            {result.glossary.map((g, i) => (
              <div key={i} className="glossary-card">
                <dt className="glossary-term">{g.term}</dt>
                <dd className="glossary-def">{g.definition}</dd>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
