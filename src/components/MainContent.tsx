import { useState, useRef } from "react";
import { HistoryItem, UserProfile } from "../types";
import ResultView from "./ResultView";
import HistoryView from "./HistoryView";

interface MainContentProps {
  user: UserProfile | null;
  activeView: "home" | "history" | "saved" | "result";
  currentResult: HistoryItem | null;
  history: HistoryItem[];
  saved: HistoryItem[];
  loading: boolean;
  setLoading: (v: boolean) => void;
  onProcess: (result: HistoryItem, score: number) => void;
  onTrustScoreSync: (score: number) => void;
  onSave: (id: string, state: boolean) => void;
  onDelete: (id: string) => void;
  onShowAuth: () => void;
  onNavigate: (view: "home" | "history" | "saved" | "result", item?: HistoryItem) => void;
}

type InputMode = "text" | "file";
type Lang = "en" | "hi" | "te";

const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "te", label: "Telugu" },
];

export default function MainContent({
  user, activeView, currentResult, history, saved,
  loading, setLoading, onProcess, onTrustScoreSync, onSave, onDelete,
  onShowAuth, onNavigate
}: MainContentProps) {
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [textInput, setTextInput] = useState("");
  const [sourceLang, setSourceLang] = useState<Lang>("en");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLocked = !!user && user.trustScore <= 5;

  async function handleSubmit() {
    if (!user) { onShowAuth(); return; }
    if (isLocked) {
      setError("Your trust score is too low. The translation feature is locked on your account.");
      return;
    }
    if (inputMode === "text" && !textInput.trim()) { setError("Please paste some document text."); return; }
    if (inputMode === "file" && !selectedFile) { setError("Please select a file to upload."); return; }
    setError("");
    setWarning("");
    setLoading(true);

    try {
      let body: any = { sourceLang };
      if (inputMode === "text") {
        body.text = textInput;
      } else if (selectedFile) {
        const base64 = await fileToBase64(selectedFile);
        body.fileData = base64;
        body.mimeType = selectedFile.type;
        body.fileName = selectedFile.name;
      }

      const res = await fetch("/api/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user.email
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        onProcess(data.result, data.trustScore);
        setTextInput("");
        setSelectedFile(null);
      } else {
        setError(data.error || "Processing failed. Please try again.");
        if (data.warning) setWarning(data.warning);
        if (typeof data.trustScore === "number") onTrustScoreSync(data.trustScore);
      }
    } catch {
      setError("Network error. Please check your connection.");
    }
    setLoading(false);
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res((reader.result as string).split(",")[1]);
      reader.onerror = () => rej(new Error("File read failed"));
      reader.readAsDataURL(file);
    });
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setInputMode("file");
    }
  }

  // Route to correct view
  if (activeView === "result" && currentResult) {
    const isSaved = saved.some(s => s.id === currentResult.id);
    return (
      <ResultView
        result={currentResult}
        isSaved={isSaved}
        onSave={() => onSave(currentResult.id, !isSaved)}
        onDelete={() => onDelete(currentResult.id)}
        onNew={() => onNavigate("home")}
      />
    );
  }

  if (activeView === "history") {
    return (
      <HistoryView
        items={history}
        saved={saved}
        title="History"
        emptyMessage="No documents processed yet."
        onOpen={(item) => onNavigate("result", item)}
        onSave={onSave}
        onDelete={onDelete}
      />
    );
  }

  if (activeView === "saved") {
    return (
      <HistoryView
        items={saved}
        saved={saved}
        title="Saved"
        emptyMessage="No saved documents yet."
        onOpen={(item) => onNavigate("result", item)}
        onSave={onSave}
        onDelete={onDelete}
      />
    );
  }

  // Home view
  return (
    <div className="home-view">
      <div className="home-hero">
        <h1 className="home-title">
          Understand any government document
        </h1>
        <p className="home-subtitle">
          Paste text or upload a PDF — DocuEase simplifies and translates official documents into plain English, Telugu, and Hindi.
        </p>
      </div>

      <div className="input-card">
        {/* Mode tabs */}
        <div className="mode-tabs">
          <button
            className={`mode-tab ${inputMode === "text" ? "active" : ""}`}
            onClick={() => setInputMode("text")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Paste text
          </button>
          <button
            className={`mode-tab ${inputMode === "file" ? "active" : ""}`}
            onClick={() => setInputMode("file")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 16 12 12 8 16"/>
              <line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
            </svg>
            Upload file
          </button>
        </div>

        {/* Language selector */}
        <div className="lang-row">
          <span className="lang-label">Source language:</span>
          <div className="lang-pills">
            {LANG_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`lang-pill ${sourceLang === opt.value ? "active" : ""}`}
                onClick={() => setSourceLang(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input area */}
        {inputMode === "text" ? (
          <textarea
            className="doc-textarea"
            placeholder="Paste your government document, legal notice, scheme details, or circular here..."
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            rows={8}
          />
        ) : (
          <div
            className={`drop-zone ${dragOver ? "drag-over" : ""} ${selectedFile ? "has-file" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.txt"
              style={{ display: "none" }}
              onChange={e => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
            />
            {selectedFile ? (
              <div className="drop-file-info">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <div>
                  <p className="drop-file-name">{selectedFile.name}</p>
                  <p className="drop-file-size">{(selectedFile.size / 1024).toFixed(1)} KB — click to change</p>
                </div>
                <button className="drop-file-remove" onClick={e => { e.stopPropagation(); setSelectedFile(null); }}>
                  ×
                </button>
              </div>
            ) : (
              <div className="drop-placeholder">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polyline points="16 16 12 12 8 16"/>
                  <line x1="12" y1="12" x2="12" y2="21"/>
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                </svg>
                <p className="drop-title">Drop your file here</p>
                <p className="drop-hint">Supports PDF, PNG, JPG, TXT — up to 25 MB</p>
              </div>
            )}
          </div>
        )}

        {warning && (
          <div className="trust-warning">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {warning}
          </div>
        )}

        {isLocked && (
          <div className="trust-locked-msg">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            The translation feature is locked because your trust score is too low. Upload genuine government documents to restore access.
          </div>
        )}

        {error && (
          <div className="input-error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="input-actions">
          <button
            className={`btn-process ${isLocked ? "locked" : ""}`}
            onClick={handleSubmit}
            disabled={loading || isLocked}
          >
            {loading ? (
              <>
                <span className="spinner-sm" />
                Processing...
              </>
            ) : isLocked ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Locked
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Simplify & Translate
              </>
            )}
          </button>
          {!user && (
            <p className="signin-nudge">
              <button className="link-btn" onClick={onShowAuth}>Sign in</button> to save your results
            </p>
          )}
        </div>
      </div>

      {/* Features row */}
      <div className="features-row">
        {[
          { icon: "🇮🇳", title: "Government-focused", desc: "Trained on Indian govt orders, welfare schemes, circulars, and legal notices." },
          { icon: "🌐", title: "3-language output", desc: "Every document simplified in English, Telugu, and Hindi simultaneously." },
          { icon: "📚", title: "Auto glossary", desc: "Complex legal and bureaucratic terms explained in plain language." },
        ].map(f => (
          <div key={f.title} className="feature-card">
            <span className="feature-icon">{f.icon}</span>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-desc">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}