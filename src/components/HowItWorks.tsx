import React from "react";

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: "1",
      title: "Secure Document Submission",
      desc: "Upload official .pdf or .txt directives, notifications or paste legal structures directly. The gateway authenticates transaction origin with citizen email metadata logging."
    },
    {
      num: "2",
      title: "Legitics Validation Check",
      desc: "Our Gemini NLP engine scans the structure to verify if content originates from municipal, state, federal or administrative authorities. Non-government files are instantly caught and rejected to safeguard throughput."
    },
    {
      num: "3",
      title: "Clause Simplification Processor",
      desc: "System cleans excessive vocabulary, archaic legal terminologies, and nested double-negatives. The output retains critical operational dates, direct monetary numbers, and departmental indices in simplified English."
    },
    {
      num: "4",
      title: "Bilingual Translation Dispatcher",
      desc: "The simplified schema simultaneously translates into functional regional dialects — specifically Hindi (हिंदी) and Telugu (తెలుగు) — ensuring direct empowerment and barrier-free public service comprehension."
    }
  ];

  return (
    <div className="bg-white border border-slate-300 p-8 space-y-8">
      <div className="border-b border-slate-200 pb-4 mb-2">
        <h3 className="text-base font-extrabold text-[#003366] uppercase tracking-wider">
          How DocuEase Platform Pipeline Functions
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          A highly secured, sequential NLP simplification pipeline built for public welfare and digital transparency.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
        {steps.map((st, idx) => (
          <div key={idx} className="bg-slate-50 border border-slate-250 p-5 flex flex-col relative">
            {/* Connector line for large screens */}
            {idx < 3 && (
              <div className="hidden md:block absolute top-12 -right-3 w-6 h-0.5 bg-slate-300 z-10"></div>
            )}
            
            <div className="w-12 h-12 rounded-full bg-[#FF6600] border-2 border-[#003366] flex items-center justify-center text-white font-extrabold text-lg mb-4 select-none">
              {st.num}
            </div>

            <h4 className="text-xs font-extrabold text-[#003366] uppercase tracking-wider mb-2">
              Step {st.num}: {st.title}
            </h4>
            
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {st.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 leading-relaxed">
        <strong>Technical Standards Info:</strong> Deployed with server-side AI state parameters maintaining Zero-Trust guidelines. Under standard operation, processing is dispatched in single-threaded async queues protecting server security.
      </div>
    </div>
  );
};
