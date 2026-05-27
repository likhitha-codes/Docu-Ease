import React, { useEffect, useState } from "react";
import { LogEntry } from "../types";

interface HistoryLogsProps {
  highContrast: boolean;
  userEmail: string;
}

export const HistoryLogs: React.FC<HistoryLogsProps> = ({ highContrast, userEmail }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchLogs = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const response = await fetch("/api/logs");
      if (!response.ok) {
        throw new Error("Failed to consult official logs server database.");
      }
      const data = await response.json();
      if (data.status === "success") {
        setLogs(data.logs || []);
      } else {
        throw new Error(data.message || "Unknown logs query error.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to retrieve logs.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm("WARNING: Are you absolutely sure you want to clear all central government document audit simplification history logs permanently? This action is irreversible.")) {
      return;
    }
    try {
      const response = await fetch("/api/logs/clear", { method: "POST" });
      if (response.ok) {
        setLogs([]);
        setSelectedLog(null);
        alert("Central audit log directories successfully wiped.");
      } else {
        alert("Failed to wipe log files.");
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting audits cleaning API.");
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const term = searchQuery.toLowerCase();
    return (
      log.fileName.toLowerCase().includes(term) ||
      log.detectedType.toLowerCase().includes(term) ||
      log.userEmail.toLowerCase().includes(term) ||
      log.simplifiedEnglish.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-white border border-slate-300 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
        <div>
          <h3 className="text-base font-extrabold text-[#003366] uppercase tracking-wider">
            National Document Simplification Audits & Session Logs
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Real-time public transparency record. Each AI process instance generates a verified regulatory audit event.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#003366] border border-slate-300 text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            REFRESH AUDITS
          </button>
          <button
            onClick={handleClearLogs}
            disabled={logs.length === 0}
            className="px-3 py-1.5 bg-red-700 hover:bg-red-650 text-white text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
          >
            CLEAR LOG DATABASE
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border-l-4 border-l-red-600 text-xs text-red-700 mb-4 font-bold">
          {errorMsg}
        </div>
      )}

      {/* Main Grid: left side log list, right side translation detail pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Logs List Pane (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-700">Search Logs:</span>
            <input
              type="text"
              placeholder="Filter by file, classification or citizen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-slate-300 focus:outline-none focus:border-[#003366] text-xs rounded"
            />
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500 font-bold border border-dashed border-slate-200">
              Querying central secure transaction directories...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-200">
              No audit log occurrences registered. Start simplification on the Home panel.
            </div>
          ) : (
            <div className="border border-slate-250 divide-y divide-slate-150 max-h-[480px] overflow-y-auto bg-slate-50">
              {filteredLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`p-3 text-xs cursor-pointer select-none transition-colors ${
                      isSelected
                        ? "bg-amber-50 border-l-4 border-l-[#FF6600]"
                        : "hover:bg-slate-100 bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[#003366] max-w-[240px] truncate">
                        📄 {log.fileName}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleString("en-IN", { timeZone: "IST" })} IST
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-bold text-[9px] rounded uppercase border border-slate-200">
                          ID: #{log.id}
                        </span>
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                          log.isGovernmentRelated 
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                            : "bg-red-50 text-red-800 border border-red-200"
                        }`}>
                          {log.detectedType}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Citizen: <strong className="text-slate-800">{log.userEmail}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Audit Full Detail Inspector Pane (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-300 p-4">
          <h4 className="text-xs font-extrabold uppercase text-slate-800 pb-2 border-b border-b-slate-200 mb-3 tracking-wide">
            Detailed Audit Ledger Inspector
          </h4>

          {selectedLog ? (
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5 bg-slate-50 p-2.5 border border-slate-200">
                <div>
                  <span className="text-slate-500 font-medium">Event timestamp:</span>{" "}
                  <strong className="text-slate-800">
                    {new Date(selectedLog.timestamp).toUTCString()}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Verified Class:</span>{" "}
                  <strong className="text-[#003366]">{selectedLog.detectedType}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Citizen Email:</span>{" "}
                  <strong className="text-slate-700">{selectedLog.userEmail}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Validation status:</span>{" "}
                  <span className={`font-extrabold ${selectedLog.isGovernmentRelated ? "text-emerald-700" : "text-red-700"}`}>
                    {selectedLog.isGovernmentRelated ? "PASS (Legitimate Government Content)" : "REJECTED (Non-Govt)"}
                  </span>
                </div>
              </div>

              {selectedLog.isGovernmentRelated && (
                <div className="space-y-3">
                  <div>
                    <h5 className="font-extrabold text-[#003366] uppercase mb-1 text-[10px]">
                      1. Simplified Legislative Clause (English)
                    </h5>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 max-h-[100px] overflow-y-auto leading-relaxed whitespace-pre-wrap font-mono text-[10px]">
                      {selectedLog.simplifiedEnglish}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-extrabold text-[#FF6600] uppercase mb-1 text-[10px]">
                      2. Official Telugu translation (తెలుగు)
                    </h5>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 max-h-[100px] overflow-y-auto leading-relaxed whitespace-pre-wrap font-mono text-[10px]">
                      {selectedLog.teluguTranslation}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-extrabold text-[#138808] uppercase mb-1 text-[10px]">
                      3. Official Hindi translation (हिंदी)
                    </h5>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 max-h-[100px] overflow-y-auto leading-relaxed whitespace-pre-wrap font-mono text-[10px]">
                      {selectedLog.hindiTranslation}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs italic">
              Select or click any audit transaction event on the left to inspect the deep database record properties.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
