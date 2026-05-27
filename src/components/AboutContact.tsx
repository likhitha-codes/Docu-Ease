import React, { useState } from "react";

export const AboutContact: React.FC = () => {
  const [ticketName, setTicketName] = useState("");
  const [ticketEmail, setTicketEmail] = useState("");
  const [ticketSubject, setTicketSubject] = useState("Technical Issue");
  const [ticketMessage, setTicketMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketName || !ticketEmail || !ticketMessage) {
      alert("Please fill all mandatory fields.");
      return;
    }
    // Simulate support ticket creation
    setIsSubmitted(true);
    setTimeout(() => {
      setTicketName("");
      setTicketEmail("");
      setTicketMessage("");
    }, 500);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
      
      {/* 1. About DocuEase Container (7 columns) */}
      <div className="md:col-span-7 bg-white border border-slate-300 p-8 space-y-6">
        <div className="border-b border-slate-200 pb-3">
          <h3 className="text-base font-extrabold text-[#003366] uppercase tracking-wider">
            About the DocuEase Initiative
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Empowering regional citizens through modern computational linguistics.
          </p>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed">
          Government circulars, gazette notifications, schemes and legal notifications contain essential directives that directly dictate public allowances, civic deadlines, pension structures, and constitutional laws. However, these documents are historically penned in archaic legal prose with heavy, obscure technical English jargon.
        </p>

        <p className="text-xs text-[#003366] font-bold leading-relaxed bg-[#f1f5f9] p-3 border-l-4 border-l-[#003366]">
          "Our mission is simple: to make Indian public administrative policies accessible, clear, and comprehensible in the localized languages spoken by hundreds of millions of everyday citizens, specifically targeting Telugu and Hindi."
        </p>

        <div className="space-y-3">
          <h4 className="text-xs font-extrabold text-[#FF6600] uppercase tracking-wider">
            Core Principles of Digital Governance:
          </h4>
          <ul className="list-disc pl-5 text-xs text-slate-700 space-y-2">
            <li>
              <strong>Linguistic Democratization:</strong> Ensuring that non-native English speakers from regions across Andhra Pradesh, Telangana, Uttar Pradesh, Bihar, and elsewhere are not excluded from accessing administrative benefits.
            </li>
            <li>
              <strong>Surgical Accuracy:</strong> The system simplifies *grammar complexity* while treating official metrics, dates, and regulatory sections as immutable variables.
            </li>
            <li>
              <strong>Total Transparency:</strong> Supported by a local security audit log database enabling citizens and officers to check logs dynamically.
            </li>
          </ul>
        </div>
      </div>

      {/* 2. Public Support Enquiries Ticket Form (5 columns) */}
      <div className="md:col-span-5 bg-white border border-slate-300 p-8">
        <div className="border-b border-slate-200 pb-3 mb-5">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            NIC Public Enquiries Desk
          </h3>
          <p className="text-[10px] text-slate-500 mt-1 uppercase">
            Submit Feedback or Report Obfuscated Administrative Jargon
          </p>
        </div>

        {isSubmitted ? (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 rounded space-y-2">
            <p className="font-bold">✓ Grievance Ticket Successfully Registered!</p>
            <p className="text-[11px]">Your request has been forwarded to the National Informatics Centre (NIC) Style portal officer group. An acknowledgement token has been logged.</p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="mt-2 text-[10px] font-bold uppercase text-[#003366] hover:underline"
            >
              Raise another query
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Citizen Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={ticketName}
                onChange={(e) => setTicketName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-none focus:border-[#003366] rounded"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contact Email *
              </label>
              <input
                type="email"
                placeholder="e.g. ramesh@example.com"
                value={ticketEmail}
                onChange={(e) => setTicketEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-none focus:border-[#003366] rounded"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Enquiry Subject *
              </label>
              <select
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                className="w-full px-2 py-2 text-xs bg-white border border-slate-300 focus:outline-none focus:border-[#003366] rounded"
              >
                <option value="Technical Issue">Technical Support / Bug</option>
                <option value="Linguistic Error">Linguistic / Translation Correction</option>
                <option value="Policy Obfuscation">Request Document Addition</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Grievance Message / Query Content *
              </label>
              <textarea
                rows={4}
                placeholder="Detail your request or copy-paste the specific regulatory statement giving errors..."
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-none focus:border-[#003366] rounded"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[#FF6600] hover:bg-[#e25a00] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              SUBMIT GRIEVANCE TICKET
            </button>
          </form>
        )}
      </div>

    </div>
  );
};
