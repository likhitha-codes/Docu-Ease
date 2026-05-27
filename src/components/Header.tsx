import React from "react";
import { CitizenUser } from "../types";

interface HeaderProps {
  user: CitizenUser | null;
  onLogout: () => void;
  onSignInClick: () => void;
  onSignUpClick: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  fontSizeMultiplier: number;
  setFontSizeMultiplier: (val: number | ((prev: number) => number)) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onSignInClick,
  onSignUpClick,
  activeTab,
  setActiveTab,
  fontSizeMultiplier,
  setFontSizeMultiplier,
  highContrast,
  setHighContrast,
}) => {
  const tabs = [
    { id: "home", label: "Home / Simplify Engine" },
    { id: "logs", label: "Security Audit Logs" },
    { id: "works", label: "How It Works" },
    { id: "about", label: "About DocuEase" },
    { id: "contact", label: "Public Enquiries" },
  ];

  const handleZoomIn = () => setFontSizeMultiplier(prev => Math.min(prev + 0.1, 1.3));
  const handleZoomOut = () => setFontSizeMultiplier(prev => Math.max(prev - 0.1, 0.8));
  const handleResetZoom = () => setFontSizeMultiplier(1.0);

  return (
    <header className="w-full flex flex-col block" style={{ contentVisibility: "auto" }}>
      {/* 1. Indian National Flag Tricolor Bar */}
      <div className="w-full h-1.5 flex">
        <div className="flex-1 bg-[#FF9933]"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-[#138808]"></div>
      </div>

      {/* 2. Top Portal accessibility control utility bar (Similar to NIC standard) */}
      <div className="w-full bg-[#1b263b] text-white text-[11px] px-4 py-2 flex justify-between items-center border-b border-[#212f45]">
        <div className="flex items-center gap-4">
          <span className="font-medium tracking-wide">GOVERNMENT OF INDIA • भारत सरकार</span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="hidden md:inline text-slate-300">National Informatics Centre (NIC) Style Audited</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center border-r border-slate-700 pr-3 gap-1">
            <button
              onClick={handleZoomOut}
              className="px-1.5 py-0.5 bg-slate-800 text-white hover:bg-slate-700 rounded text-[10px]"
              title="Decrease Font Size"
            >
              A-
            </button>
            <button
              onClick={handleResetZoom}
              className="px-1.5 py-0.5 bg-slate-800 text-white hover:bg-slate-700 rounded text-[10px]"
              title="Normal Font Size"
            >
              A
            </button>
            <button
              onClick={handleZoomIn}
              className="px-1.5 py-0.5 bg-slate-800 text-white hover:bg-slate-700 rounded text-[10px]"
              title="Increase Font Size"
            >
              A+
            </button>
          </div>
          <button
            onClick={() => setHighContrast(!highContrast)}
            className={`px-2 py-0.5 text-[10px] rounded font-medium border ${
              highContrast
                ? "bg-[#FF6600] text-white border-[#FF6600]"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            {highContrast ? "NORMAL CONTRAST" : "HIGH CONTRAST (⚫/🟡)"}
          </button>
        </div>
      </div>

      {/* 3. Main Header Branding (Navy background #003366) */}
      <div className={`w-full ${highContrast ? "bg-black" : "bg-[#003366]"} text-white px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-4 border-b-2 border-[#FF6600]`}>
        <div className="flex items-center gap-4 select-none">
          {/* Official Ashoka Emblem SVG Placeholder */}
          <div className="bg-white p-1 rounded-full flex items-center justify-center border border-slate-200">
            <svg
              width="54"
              height="54"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-[#003366]"
            >
              <circle cx="50" cy="50" r="48" stroke="#003366" strokeWidth="2.5" fill="#f8fafc" />
              {/* Ashoka Chakra Center */}
              <circle cx="50" cy="46" r="16" stroke="#003366" strokeWidth="2" strokeDasharray="2,2" />
              <circle cx="50" cy="46" r="3" fill="#FF6600" />
              {/* External Spokes of Mandala pattern */}
              <path d="M50 10 L50 22 M50 70 L50 90 M20 50 L32 50 M68 50 L80 50" stroke="#003366" strokeWidth="1.5" />
              <path d="M50 25 L50 30 M50 62 L50 67 M29 46 L34 46 M66 46 L71 46" stroke="#FF6600" strokeWidth="2" />
              {/* Lotus Base */}
              <path d="M35 70 C 40 78, 60 78, 65 70 C 58 75, 42 75, 35 70 Z" fill="#FF6600" />
              <path d="M42 75 C 45 80, 55 80, 58 75" stroke="#003366" strokeWidth="2" fill="none" />
              {/* Lion outlines */}
              <path d="M45 28 Q48 24 50 26 Q52 24 55 28 Q50 34 45 28 Z" fill="#003366" />
              <path d="M38 32 Q34 38 42 42 Q40 34 38 32 Z" fill="#003366" />
              <path d="M62 32 Q66 38 58 42 Q60 34 62 32 Z" fill="#003366" />
              {/* Sanskrit Motto: Satyameva Jayate text banner representation */}
              <rect x="25" y="81" width="50" height="9" rx="2" fill="#003366" />
              <text x="50" y="87.5" fill="#FFFFFF" fontSize="6.5" fontWeight="bold" textAnchor="middle" letterSpacing="0.8">
                सत्यమేవ జయతే
              </text>
            </svg>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold tracking-tight">DocuEase</span>
              <span className="text-sm px-1.5 py-0.5 bg-[#FF6600] text-white font-semibold rounded text-[10px] tracking-widest uppercase">
                GOV-SIMPLIFY
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Simplifying Government Documents and Regulatory Orders for Every Citizen
            </p>
          </div>
        </div>

        {/* User SSO Logged In Status Panel */}
        <div className="flex flex-col items-end gap-1 text-right">
          {user ? (
            <div className={`p-2 rounded text-[11px] font-medium border ${highContrast ? "bg-zinc-900 border-zinc-700" : "bg-[#002244] border-slate-700"}`}>
              <div className="text-xs text-slate-300">
                Aadhaar SSO: <span className="text-white font-bold">{user.fullName}</span>
              </div>
              <div className="text-[10px] text-emerald-400">
                {user.email} | {user.stateOfResidence} (Registered)
              </div>
              <button
                onClick={onLogout}
                className="mt-1.5 px-2 py-0.5 bg-rose-700 hover:bg-rose-600 text-white rounded text-[9px] font-bold tracking-wider cursor-pointer"
              >
                SECURE SIGN OUT
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <span className="hidden lg:inline text-[10px] text-slate-300 mr-1 select-none font-medium">
                Guest Visitor Mode
              </span>
              <button
                onClick={onSignInClick}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold tracking-wider cursor-pointer shadow-sm transition-colors text-center uppercase whitespace-nowrap"
              >
                Sign In
              </button>
              <button
                onClick={onSignUpClick}
                className="px-3.5 py-1.5 bg-[#FF6600] hover:bg-[#e05300] text-white rounded text-xs font-bold tracking-wider cursor-pointer shadow-sm transition-colors text-center uppercase whitespace-nowrap"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Navigation Tab Menu Bar (Government style flat strip, navy text, white background or solid color) */}
      <nav className={`w-full ${highContrast ? "bg-zinc-900" : "bg-[#f8f9fa]"} border-b border-slate-300 flex overflow-x-auto`}>
        <div className="w-full max-w-7xl mx-auto flex">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-5 text-xs font-semibold uppercase tracking-wider border-r border-slate-200 cursor-pointer min-w-max transition-colors ${
                  isActive
                    ? highContrast
                      ? "bg-black text-[#FF6600] border-b-4 border-b-[#FF6600]"
                      : "bg-[#003366] text-white border-b-4 border-b-[#FF6600]"
                    : highContrast
                    ? "text-slate-300 hover:bg-zinc-800"
                    : "text-[#003366] hover:bg-slate-150"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
