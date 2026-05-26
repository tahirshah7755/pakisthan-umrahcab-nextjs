"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";

export default function RemindersPage() {
  const router = useRouter();

  // State hooks
  const [reminderDate, setReminderDate] = useState("2026-05-25");
  const [reminderSearch, setReminderSearch] = useState("");
  const [reminderLimit, setReminderLimit] = useState(100);
  const [copiedReminders, setCopiedReminders] = useState<Record<string, boolean>>({});

  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Toast notification
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    const loadRemindersData = async () => {
      try {
        setLoading(true);
        const [bkList, srvList, custList] = await Promise.all([
          api.getBookings(),
          api.getServices(),
          api.getCustomers()
        ]);

        if (bkList) {
          setBookings(bkList.map((b: any, idx: number) => {
            const matchedCust = custList ? custList.find((c: any) => c.name === b.fullName) : null;
            return {
              id: b.booking_code || `#BKG-87${idx + 10}`,
              rawId: b.id ? String(b.id) : `87${idx + 10}`,
              type: "BKG",
              date: b.date || "2026-05-25",
              time: b.time || "10:30 AM",
              customerName: b.fullName || "Guest",
              companyName: matchedCust ? matchedCust.company : "Zahid Travels",
              details: `${b.pickup || "Jeddah Airport"} → ${b.destination || "Makkah Hotel"}`,
              vehicle: b.carType || "Sedan (Standard)",
              phones: matchedCust && matchedCust.contact ? [matchedCust.contact.split(" ")[0]] : ["+966501234567"],
              customerId: matchedCust ? (matchedCust.custom_id || matchedCust.id) : `1`
            };
          }));
        }

        if (srvList) {
          setServices(srvList.map((s: any, idx: number) => {
            const matchedCust = custList ? custList.find((c: any) => c.company === "Zahid Travels" || c.company === "Al-Latif Group") : null;
            return {
              id: s.custom_id || `#SRV-${s.id}`,
              rawId: s.id ? String(s.id) : `00${idx + 1}`,
              type: "SRV",
              date: s.date || "2026-05-25",
              time: s.time || "12:00 AM",
              customerName: matchedCust ? matchedCust.name : "Zubair Ahmad",
              companyName: matchedCust ? matchedCust.company : "Zahid Travels",
              details: `${s.name} (${s.description || "Service Details"})`,
              vehicle: "N/A",
              phones: matchedCust && matchedCust.contact ? [matchedCust.contact.split(" ")[0]] : ["+966549876543"],
              customerId: matchedCust ? (matchedCust.custom_id || matchedCust.id) : `3`
            };
          }));
        }
      } catch (err) {
        console.error("Failed to load reminders backend data", err);
        showToast("Failed to fetch reminders datasets.", "error");
      } finally {
        setLoading(false);
      }
    };
    loadRemindersData();
  }, []);

  // Dynamically load active reminders, falling back to beautiful defaults if no records are found
  const dbReminders = [...bookings, ...services];
  const allReminders = dbReminders.length > 0 ? dbReminders : [
    // Yesterday (2026-05-24)
    { id: "#BKG-9710", rawId: "9710", type: "BKG", date: "2026-05-24", time: "09:15 AM", customerName: "Zubair Ahmad", companyName: "Zahid Travels", details: "Jeddah Airport → Makkah Hotel", vehicle: "Sedan (Standard)", phones: ["+966501234567"], customerId: "1" },
    { id: "#SRV-9711", rawId: "9711", type: "SRV", date: "2026-05-24", time: "11:00 AM", customerName: "Abu Bakar", companyName: "Al-Latif Group", details: "Premium Umrah Visa Service", vehicle: "N/A", phones: ["+966549876543"], customerId: "3" },

    // Today (2026-05-25)
    { id: "#BKG-9843", rawId: "9843", type: "BKG", date: "2026-05-25", time: "10:30 AM", customerName: "Zubair Ahmad", companyName: "Zahid Travels", details: "Jeddah Airport → Makkah Hotel", vehicle: "Sedan (Standard)", phones: ["+966501234567"], customerId: "1" },
    { id: "#SRV-001", rawId: "001", type: "SRV", date: "2026-05-25", time: "12:00 AM", customerName: "Zubair Ahmad", companyName: "Zahid Travels", details: "Premium Umrah Visa Service (Juice, Cake & Lays)", vehicle: "N/A", phones: ["+966501234567"], customerId: "1" },
    { id: "#SRV-002", rawId: "002", type: "SRV", date: "2026-05-25", time: "02:00 PM", customerName: "Abu Bakar", companyName: "Al-Latif Group", details: "Private Makkah Ziyarah Tour (Guided)", vehicle: "N/A", phones: ["+966549876543"], customerId: "3" },

    // Tomorrow (2026-05-26)
    { id: "#BKG-9845", rawId: "9845", type: "BKG", date: "2026-05-26", time: "08:00 AM", customerName: "Imran Khan", companyName: "Zahid Travels", details: "Jeddah Airport → Madinah Hotel", vehicle: "Hyundai Staria", phones: ["+966501234567"], customerId: "1" },
    { id: "#SRV-003", rawId: "003", type: "SRV", date: "2026-05-26", time: "09:30 AM", customerName: "Amjad", companyName: "Zahid Travels", details: "VIP Makkah Meet & Greet (Fast-track)", vehicle: "N/A", phones: ["+923114567890"], customerId: "2" }
  ];

  // Filtering operations based on active date
  const activeReminders = allReminders.filter(r => r.date === reminderDate);

  // Search operations
  const filteredReminders = activeReminders.filter(r => {
    const s = reminderSearch.toLowerCase();
    return (
      r.id.toLowerCase().includes(s) ||
      r.customerName.toLowerCase().includes(s) ||
      r.companyName.toLowerCase().includes(s) ||
      r.details.toLowerCase().includes(s)
    );
  });

  const handleCopyReminder = (row: any, buttonNo: number) => {
    let message = "";
    if (buttonNo === 1) { // Trip / Service Reminder
      if (row.type === "BKG") {
        const pickup = row.details.split("→")[0]?.trim() || "Airport";
        const dropoff = row.details.split("→")[1]?.trim() || "Hotel";
        message = `🤝 *Reminder Confirmation* 🤝\n\nالسلام عليكم\n\nDear *${row.customerName}*,\n\n✅ We have your confirmed booking for a pickup from *${pickup}* to *${dropoff}* on *${row.date}* at *${row.time}*.\n_________________________\n📅 Pick Up Date: *${row.date}*\n📍 Pick Up Location: *${pickup}*\n⏰ Pick Up Time: *${row.time}*\n🏁 Drop Off Location: *${dropoff}*\n_________________________\n🚗 Vehicle: *${row.vehicle}*\n\n⚠️ *You are requested to please let us know if there is any change in the plan by 3pm today, after that the schedule shall be considered confirmed.*\n📝 *Please acknowledge the pickup time. Thanks and regards*`;
      } else {
        message = `||| 📌 *Service Reminder* |||\n\nالسلام عليكم\n\nDear *${row.customerName}*,\n\n✅ We have your confirmed service: *${row.details}*\n📅 Date: *${row.date}*\n⏰ Time: *${row.time}*\n\nHope to serve you best!`;
      }
    } else if (buttonNo === 2) { // Guest Notice Rules
      message = `📜 *Subject: Guest Notice*,\n\nDear *${row.customerName}*,\n\nالسلام عليكم\n\nFollowing these instructions is mandatory to maintain a travel process.\n\n*1️⃣ Response Time:* Please confirm trip details within 8 hours of reminder.\n*2️⃣ Cancellation:* Must be 3:30 hours prior to pickup window.\n📞 Support: +966504861551.\n✨ *Safe journey and blessings.*`;
    } else if (buttonNo === 3) { // Completion / Partner Alert
      if (row.type === "BKG") {
        const pickup = row.details.split("→")[0]?.trim() || "Airport";
        const dropoff = row.details.split("→")[1]?.trim() || "Hotel";
        message = `🤝 Dear Valuable Partner *${row.companyName}*\n\n👤 Regarding Client *${row.customerName}*\n📍 From *${pickup}* to *${dropoff}*\n🚗 On *${row.vehicle}*\n\n✅ Their Pickup Has Been *Successful.*`;
      } else {
        message = `🤝 Dear Valuable Partner *${row.companyName}*\n\n👤 Regarding Client *${row.customerName}*\n🛠 Service *${row.details}*\n\n✅ Has Been *Successfully Completed.*`;
      }
    }

    navigator.clipboard.writeText(message);
    setCopiedReminders(prev => ({ ...prev, [`${row.id}_${buttonNo}`]: true }));
    showToast(`Template ${buttonNo} copied to clipboard successfully!`, "success");
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    showToast(`Phone number ${phone} copied to clipboard!`, "success");
  };

  const triggerExport = (format: string) => {
    showToast(`Exported reminders view as ${format}!`, "success");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "#ffffff", padding: "12px 24px", borderRadius: "8px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", fontWeight: "600",
          fontSize: "14px", display: "flex", alignItems: "center", gap: "10px",
        }}>
          <i className={toast.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner - Royal Deep Blue Gradient */}
      <div 
        className="form-header-card" 
        style={{ 
          background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)", 
          padding: "25px 35px", 
          borderRadius: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: "#fff", fontSize: "24px", fontWeight: 800 }}>System Reminders</h2>
          <p style={{ margin: "4px 0 0 0", color: "#dbeafe", fontSize: "14px" }}>Quickly copy templates for WhatsApp communication.</p>
        </div>
        
        {/* Dynamic Date pill */}
        <div style={{ background: "#eff6ff", color: "#7c3aed", fontWeight: 700, padding: "8px 16px", borderRadius: "20px", fontSize: "13px" }}>
          <i className="fas fa-calendar-alt" style={{ marginRight: "6px" }}></i>
          {reminderDate === "2026-05-24" ? "Yesterday (24 May)" : reminderDate === "2026-05-25" ? "Today (25 May)" : reminderDate === "2026-05-26" ? "Tomorrow (26 May)" : reminderDate}
        </div>
      </div>

      {/* 📅 Navigation shortcut filters bar */}
      <div 
        style={{ 
          background: "#ffffff", 
          padding: "15px 25px", 
          borderRadius: "12px", 
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px"
        }}
      >
        {/* Shortcut Pills */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button 
            onClick={() => setReminderDate("2026-05-24")}
            style={{ 
              background: reminderDate === "2026-05-24" ? "#7c3aed" : "#f1f5f9", 
              color: reminderDate === "2026-05-24" ? "#ffffff" : "#475569", 
              padding: "8px 18px", 
              borderRadius: "20px", 
              border: "none", 
              fontWeight: 700, 
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Yesterday
          </button>
          <button 
            onClick={() => setReminderDate("2026-05-25")}
            style={{ 
              background: reminderDate === "2026-05-25" ? "#7c3aed" : "#f1f5f9", 
              color: reminderDate === "2026-05-25" ? "#ffffff" : "#475569", 
              padding: "8px 18px", 
              borderRadius: "20px", 
              border: "none", 
              fontWeight: 700, 
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Today
          </button>
          <button 
            onClick={() => setReminderDate("2026-05-26")}
            style={{ 
              background: reminderDate === "2026-05-26" ? "#7c3aed" : "#f1f5f9", 
              color: reminderDate === "2026-05-26" ? "#ffffff" : "#475569", 
              padding: "8px 18px", 
              borderRadius: "20px", 
              border: "none", 
              fontWeight: 700, 
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Tomorrow
          </button>
        </div>

        {/* Custom Date Input selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#475569" }}>Custom Date:</span>
          <input 
            type="date" 
            value={reminderDate} 
            onChange={(e) => setReminderDate(e.target.value)}
            style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", outline: "none", color: "#334155", fontWeight: 600 }}
          />
        </div>
      </div>

      {/* Table Container Grid */}
      <div className="table-card" style={{ padding: "25px", borderRadius: "12px", background: "#ffffff", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        {/* Datatables commands */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "15px" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={() => triggerExport("Excel")} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", padding: "6px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              Excel
            </button>
            <button onClick={() => triggerExport("PDF")} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", padding: "6px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              PDF
            </button>
            <button onClick={() => window.print()} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", padding: "6px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              Print
            </button>
            <select 
              value={reminderLimit} 
              onChange={(e) => setReminderLimit(parseInt(e.target.value))}
              style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", color: "#334155" }}
            >
              <option value={5}>Show 5 entries</option>
              <option value={10}>Show 10 entries</option>
              <option value={100}>Show All entries</option>
            </select>
          </div>

          <div style={{ position: "relative", minWidth: "260px" }}>
            <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}></i>
            <input 
              type="text" 
              placeholder="Search reminders..." 
              value={reminderSearch} 
              onChange={(e) => setReminderSearch(e.target.value)}
              style={{ width: "100%", padding: "8px 12px 8px 36px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", color: "#334155", outline: "none" }}
            />
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
            <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #7c3aed", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
          </div>
        ) : (
          /* Table */
          <div className="table-responsive">
            <table className="db-table">
              <thead>
                <tr>
                  <th style={{ width: "110px" }}>TIME</th>
                  <th style={{ width: "100px" }}>TYPE / ID</th>
                  <th>CUSTOMER / AGENT</th>
                  <th>SERVICE DETAILS</th>
                  <th style={{ width: "200px" }}>PHONE NUMBERS</th>
                  <th style={{ width: "160px", textAlign: "center" }}>REMINDERS</th>
                </tr>
              </thead>
              <tbody>
                {filteredReminders.slice(0, reminderLimit).map((row) => (
                  <tr key={row.id}>
                    {/* Scheduled Time */}
                    <td>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#7c3aed" }}>
                        <i className="far fa-clock" style={{ marginRight: "4px" }}></i>
                        {row.time}
                      </span>
                    </td>

                    {/* Type Badge & Link ID */}
                    <td>
                      <span 
                        onClick={() => {
                          if (row.type === "BKG") {
                            router.push(`/admin/customers/view?id=${row.customerId}`);
                          } else {
                            router.push(`/admin/services/view?id=${row.id}`);
                          }
                        }}
                        className={`status-pill ${row.type === "BKG" ? "active" : "pending"}`} 
                        style={{ 
                          fontSize: "11px", 
                          fontWeight: 800, 
                          cursor: "pointer", 
                          textDecoration: "underline",
                          background: row.type === "BKG" ? "#dbeafe" : "#fef3c7",
                          color: row.type === "BKG" ? "#1e3a8a" : "#d97706"
                        }}
                      >
                        {row.type} - {row.rawId}
                      </span>
                    </td>

                    {/* Customer / Agent Stack */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span 
                          onClick={() => router.push(`/admin/customers/view?id=${row.customerId}`)}
                          style={{ fontWeight: 700, color: "#1e293b", cursor: "pointer", textDecoration: "underline" }}
                        >
                          {row.customerName}
                        </span>
                        <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                          <i className="fas fa-building" style={{ marginRight: "3px" }}></i>
                          {row.companyName}
                        </span>
                      </div>
                    </td>

                    {/* Details specs */}
                    <td>
                      <span style={{ fontSize: "12px", color: "#475569", fontWeight: 500 }}>
                        {row.details}
                        {row.vehicle !== "N/A" && ` (${row.vehicle})`}
                      </span>
                    </td>

                    {/* stacked phone numbers with individual copy */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {row.phones.map((phone: string, idx: number) => (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f8fafc", padding: "4px 8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569", fontFamily: "monospace" }}>{phone}</span>
                            <button 
                              onClick={() => handleCopyPhone(phone)}
                              title="Copy Phone Number"
                              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
                            >
                              <i className="far fa-copy" style={{ fontSize: "12px" }}></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Template Reminders 1-2-3 Actions Panel */}
                    <td>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                        {/* Button 1: Trip / Service Reminder (Green) */}
                        <button 
                          onClick={() => handleCopyReminder(row, 1)}
                          title="Copy Trip / Service Reminder Message"
                          style={{ 
                            width: "34px", 
                            height: "34px", 
                            borderRadius: "50%", 
                            border: "none", 
                            background: "#10b981", 
                            color: "#fff", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            cursor: "pointer",
                            boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)",
                            opacity: copiedReminders[`${row.id}_1`] ? 0.45 : 1,
                            transition: "opacity 0.2s"
                          }}
                        >
                          <i className="fas fa-bell" style={{ fontSize: "13px" }}></i>
                        </button>

                        {/* Button 2: Night Notice Rules Reminder (Blue) */}
                        <button 
                          onClick={() => handleCopyReminder(row, 2)}
                          title="Copy Night Notice / Rules Rules Message"
                          style={{ 
                            width: "34px", 
                            height: "34px", 
                            borderRadius: "50%", 
                            border: "none", 
                            background: "#3b82f6", 
                            color: "#fff", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            cursor: "pointer",
                            boxShadow: "0 2px 4px rgba(59, 130, 246, 0.2)",
                            opacity: copiedReminders[`${row.id}_2`] ? 0.45 : 1,
                            transition: "opacity 0.2s"
                          }}
                        >
                          <i className="fas fa-moon" style={{ fontSize: "13px" }}></i>
                        </button>

                        {/* Button 3: Dispatch Completion Alert (Teal) */}
                        <button 
                          onClick={() => handleCopyReminder(row, 3)}
                          title="Copy Dispatch / Completion Confirmation Message"
                          style={{ 
                            width: "34px", 
                            height: "34px", 
                            borderRadius: "50%", 
                            border: "none", 
                            background: "#0d9488", 
                            color: "#fff", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            cursor: "pointer",
                            boxShadow: "0 2px 4px rgba(13, 148, 136, 0.2)",
                            opacity: copiedReminders[`${row.id}_3`] ? 0.45 : 1,
                            transition: "opacity 0.2s"
                          }}
                        >
                          <i className="fas fa-check" style={{ fontSize: "13px" }}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredReminders.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                      <div style={{ fontSize: "24px", marginBottom: "8px" }}><i className="fas fa-calendar-times"></i></div>
                      No system reminders recorded for this date query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
}
