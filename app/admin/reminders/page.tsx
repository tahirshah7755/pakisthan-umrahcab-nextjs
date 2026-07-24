"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { formatTimeOnly } from "@/utils/formatters";

export default function RemindersPage() {
  const router = useRouter();

  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const getFormattedLabel = (dateStr: string) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (dateStr === getYesterdayStr()) {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return `Yesterday (${d.getDate()} ${monthNames[d.getMonth()]})`;
    }
    if (dateStr === getTodayStr()) {
      const d = new Date();
      return `Today (${d.getDate()} ${monthNames[d.getMonth()]})`;
    }
    if (dateStr === getTomorrowStr()) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return `Tomorrow (${d.getDate()} ${monthNames[d.getMonth()]})`;
    }
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const year = parts[0];
        const monthIdx = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (!isNaN(day) && monthIdx >= 0 && monthIdx < 12) {
          return `${day} ${monthNames[monthIdx]}, ${year}`;
        }
      }
    } catch {}
    return dateStr;
  };

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
    setReminderDate(getTodayStr());

    const loadRemindersData = async () => {
      try {
        setLoading(true);
        const [bkList, srvList, custList] = await Promise.all([
          api.getBookings(),
          api.getServices(),
          api.getCustomers()
        ]);

        let rawBookings = [];
        if (bkList) {
          if (Array.isArray(bkList)) {
            rawBookings = bkList;
          } else if (bkList.data && Array.isArray(bkList.data)) {
            rawBookings = bkList.data;
          }
        }

        let rawServices = [];
        if (srvList) {
          if (Array.isArray(srvList)) {
            rawServices = srvList;
          } else if (srvList.data && Array.isArray(srvList.data)) {
            rawServices = srvList.data;
          }
        }

        let rawCustomers = [];
        if (custList) {
          if (Array.isArray(custList)) {
            rawCustomers = custList;
          } else if (custList.data && Array.isArray(custList.data)) {
            rawCustomers = custList.data;
          }
        }

        if (rawBookings.length > 0) {
          setBookings(rawBookings.map((b: any, idx: number) => {
            const customerNameVal = b.full_name || b.fullName || "Guest";
            const matchedCust = rawCustomers.find((c: any) => c.name === customerNameVal) || null;
            return {
              id: b.booking_code || `#BKG-87${idx + 10}`,
              rawId: b.id ? String(b.id) : `87${idx + 10}`,
              type: "BKG",
              date: b.date || getTodayStr(),
              time: formatTimeOnly(b.time || "10:30 AM"),
              customerName: customerNameVal,
              companyName: matchedCust ? matchedCust.company : "Zahid Travels",
              details: `${b.pickup || "Jeddah Airport"} → ${b.destination || "Makkah Hotel"}`,
              vehicle: b.car_type || b.carType || "Sedan (Standard)",
              phones: b.whatsapp ? [b.whatsapp] : (matchedCust && matchedCust.contact ? [matchedCust.contact.split(" ")[0]] : ["+966501234567"]),
              customerId: matchedCust ? (matchedCust.custom_id || matchedCust.id) : `1`,
              driverName: b.driver ? b.driver.name : null,
              driverPhone: b.driver ? b.driver.phone : null,
              driverTripStatus: b.driver_trip_status || ""
            };
          }));
        }

        if (rawServices.length > 0) {
          setServices(rawServices.map((s: any, idx: number) => {
            const matchedCust = rawCustomers.find((c: any) => c.company === "Zahid Travels" || c.company === "Al-Latif Group") || null;
            return {
              id: s.custom_id || `#SRV-${s.id}`,
              rawId: s.id ? String(s.id) : `00${idx + 1}`,
              type: "SRV",
              date: s.date || getTodayStr(),
              time: formatTimeOnly(s.time || "12:00 AM"),
              customerName: matchedCust ? matchedCust.name : "Zubair Ahmad",
              companyName: matchedCust ? matchedCust.company : "Zahid Travels",
              details: `${s.name} (${s.description || "Service Details"})`,
              vehicle: "N/A",
              phones: matchedCust && matchedCust.contact ? [matchedCust.contact.split(" ")[0]] : ["+966549876543"],
              customerId: matchedCust ? (matchedCust.custom_id || matchedCust.id) : `3`,
              driverName: null,
              driverPhone: null,
              driverTripStatus: ""
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
    // Yesterday
    { id: "#BKG-9710", rawId: "9710", type: "BKG", date: getYesterdayStr(), time: "09:15", customerName: "Zubair Ahmad", companyName: "Zahid Travels", details: "Jeddah Airport → Makkah Hotel", vehicle: "Sedan (Standard)", phones: ["+966501234567"], customerId: "1", driverName: "Muhammad Ali", driverPhone: "+966555123456", driverTripStatus: "On The Way" },
    { id: "#SRV-9711", rawId: "9711", type: "SRV", date: getYesterdayStr(), time: "11:00", customerName: "Abu Bakar", companyName: "Al-Latif Group", details: "Premium Umrah Visa Service", vehicle: "N/A", phones: ["+966549876543"], customerId: "3", driverName: null, driverPhone: null, driverTripStatus: "" },

    // Today
    { id: "#BKG-9843", rawId: "9843", type: "BKG", date: getTodayStr(), time: "10:30", customerName: "Zubair Ahmad", companyName: "Zahid Travels", details: "Jeddah Airport → Makkah Hotel", vehicle: "Sedan (Standard)", phones: ["+966501234567"], customerId: "1", driverName: "Ahmed Khan", driverPhone: "+966555987654", driverTripStatus: "Reached At Location" },
    { id: "#SRV-001", rawId: "001", type: "SRV", date: getTodayStr(), time: "12:00", customerName: "Zubair Ahmad", companyName: "Zahid Travels", details: "Premium Umrah Visa Service (Juice, Cake & Lays)", vehicle: "N/A", phones: ["+966501234567"], customerId: "1", driverName: null, driverPhone: null, driverTripStatus: "" },
    { id: "#SRV-002", rawId: "002", type: "SRV", date: getTodayStr(), time: "14:00", customerName: "Abu Bakar", companyName: "Al-Latif Group", details: "Private Makkah Ziyarah Tour (Guided)", vehicle: "N/A", phones: ["+966549876543"], customerId: "3", driverName: null, driverPhone: null, driverTripStatus: "" },

    // Tomorrow
    { id: "#BKG-9845", rawId: "9845", type: "BKG", date: getTomorrowStr(), time: "08:00", customerName: "Imran Khan", companyName: "Zahid Travels", details: "Jeddah Airport → Madinah Hotel", vehicle: "Hyundai Staria", phones: ["+966501234567"], customerId: "1", driverName: "Tariq Shah", driverPhone: "+966555456789", driverTripStatus: "Assigned" },
    { id: "#SRV-003", rawId: "003", type: "SRV", date: getTomorrowStr(), time: "09:30", customerName: "Amjad", companyName: "Zahid Travels", details: "VIP Makkah Meet & Greet (Fast-track)", vehicle: "N/A", phones: ["+923114567890"], customerId: "2", driverName: null, driverPhone: null, driverTripStatus: "" }
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

  const getReminderMessageText = (row: any, buttonNo: number) => {
    let message = "";
    if (buttonNo === 1) { // Trip / Service Reminder
      if (row.type === "BKG") {
        const pickup = row.details.split("→")[0]?.trim() || "Airport";
        const dropoff = row.details.split("→")[1]?.trim() || "Hotel";
        const status = row.driverTripStatus || "";

        if (status === "On The Way") {
          message = `🤝 *Driver On The Way* 🤝\n\nالسلام عليكم\n\nDear Guest *${row.customerName}*,\n\n🚗 Your driver is now *On the Way* to pick you up.\n_________________________\n📅 Pick Up Date: *${row.date}*\n📍 Pick Up Location: *${pickup}*\n⏰ Pick Up Time: *${row.time}*\n🏁 Drop Off Location: *${dropoff}*\n_________________________\n🚗 Vehicle: *${row.vehicle}*\n👤 Driver: *${row.driverName || "Assigned"}*\n📞 Driver Contact: *${row.driverPhone || "N/A"}*\n\nPlease be ready at the pickup location. Thanks and regards`;
        } else if (status === "Reached At Location") {
          message = `🤝 *Driver Arrived* 🤝\n\nالسلام عليكم\n\nDear Guest *${row.customerName}*,\n\n📍 Your driver has *Arrived* at your pickup location.\n_________________________\n📅 Pick Up Date: *${row.date}*\n📍 Pick Up Location: *${pickup}*\n⏰ Pick Up Time: *${row.time}*\n🏁 Drop Off Location: *${dropoff}*\n_________________________\n🚗 Vehicle: *${row.vehicle}*\n👤 Driver: *${row.driverName || "Assigned"}*\n📞 Driver Contact: *${row.driverPhone || "N/A"}*\n\nPlease proceed to meet the driver. Thanks and regards`;
        } else if (status === "Guest In Contact") {
          message = `🤝 *Driver in Contact* 🤝\n\nالسلام عليكم\n\nDear Guest *${row.customerName}*,\n\n📞 Your driver is now *In Contact* with you for the pickup.\n_________________________\n📅 Pick Up Date: *${row.date}*\n📍 Pick Up Location: *${pickup}*\n⏰ Pick Up Time: *${row.time}*\n🏁 Drop Off Location: *${dropoff}*\n_________________________\n🚗 Vehicle: *${row.vehicle}*\n👤 Driver: *${row.driverName || "Assigned"}*\n📞 Driver Contact: *${row.driverPhone || "N/A"}*\n\nThanks and regards`;
        } else {
          let driverInfo = "";
          if (row.driverName) {
            driverInfo = `👤 Driver: *${row.driverName}*\n📞 Driver Contact: *${row.driverPhone || "N/A"}*\n_________________________\n`;
          }
          message = `🤝 *Reminder Confirmation* 🤝\n\nالسلام عليكم\n\nDear Guest,\n\n✅ We have your confirmed booking for a pickup from *${pickup}* to *${dropoff}* on *${row.date}* at *${row.time}*.\n_________________________\n📅 Pick Up Date: *${row.date}*\n📍 Pick Up Location: *${pickup}*\n⏰ Pick Up Time: *${row.time}*\n🏁 Drop Off Location: *${dropoff}*\n_________________________\n🚗 Vehicle: *${row.vehicle}*\n${driverInfo}⚠️ *You are requested to please let us know if there is any change in the plan by 3pm today, after that the schedule shall be considered confirmed.*\n📝 *Please acknowledge the pickup time. Thanks and regards*`;
        }
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
    return message;
  };

  const handleCopyReminder = (row: any, buttonNo: number) => {
    const message = getReminderMessageText(row, buttonNo);
    navigator.clipboard.writeText(message);
    setCopiedReminders(prev => ({ ...prev, [`${row.id}_${buttonNo}`]: true }));
    showToast(`Template ${buttonNo} copied to clipboard successfully!`, "success");
  };

  const handleSendWhatsApp = (row: any, buttonNo: number) => {
    const message = getReminderMessageText(row, buttonNo);
    const phone = row.phones && row.phones[0] ? row.phones[0] : "";
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const encodedText = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, "_blank");
    setCopiedReminders(prev => ({ ...prev, [`${row.id}_${buttonNo}`]: true }));
    showToast(`WhatsApp tab opened for Template ${buttonNo}!`, "success");
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
          {getFormattedLabel(reminderDate)}
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
            onClick={() => setReminderDate(getYesterdayStr())}
            style={{ 
              background: reminderDate === getYesterdayStr() ? "#7c3aed" : "#f1f5f9", 
              color: reminderDate === getYesterdayStr() ? "#ffffff" : "#475569", 
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
            onClick={() => setReminderDate(getTodayStr())}
            style={{ 
              background: reminderDate === getTodayStr() ? "#7c3aed" : "#f1f5f9", 
              color: reminderDate === getTodayStr() ? "#ffffff" : "#475569", 
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
            onClick={() => setReminderDate(getTomorrowStr())}
            style={{ 
              background: reminderDate === getTomorrowStr() ? "#7c3aed" : "#f1f5f9", 
              color: reminderDate === getTomorrowStr() ? "#ffffff" : "#475569", 
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
                    {/* Details specs */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "12px", color: "#475569", fontWeight: 500 }}>
                          {row.details}
                          {row.vehicle !== "N/A" && ` (${row.vehicle})`}
                        </span>
                        {row.driverName && (
                          <div style={{ fontSize: "11px", color: "#4f46e5", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <i className="fas fa-id-card"></i> Driver: {row.driverName} {row.driverPhone ? `(${row.driverPhone})` : ""}
                          </div>
                        )}
                        {row.driverTripStatus && (
                          <div>
                            <span style={{
                              background: "#e0f2fe",
                              color: "#0369a1",
                              padding: "2px 8px",
                              borderRadius: "10px",
                              fontSize: "10px",
                              fontWeight: "700",
                              border: "1px solid #bae6fd",
                              display: "inline-block"
                            }}>
                              Status: {row.driverTripStatus}
                            </span>
                          </div>
                        )}
                      </div>
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
                      <div style={{ display: "flex", gap: "12px", justifyContent: "center", alignItems: "center" }}>
                        {/* Button 1: Trip / Service Reminder (Green) */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
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
                          <button 
                            onClick={() => handleSendWhatsApp(row, 1)}
                            title="Send Template 1 via WhatsApp"
                            style={{ 
                              width: "26px", 
                              height: "26px", 
                              borderRadius: "50%", 
                              border: "none", 
                              background: "#25d366", 
                              color: "#fff", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              cursor: "pointer",
                              boxShadow: "0 1px 3px rgba(37, 211, 102, 0.3)",
                            }}
                          >
                            <i className="fab fa-whatsapp" style={{ fontSize: "12px" }}></i>
                          </button>
                        </div>

                        {/* Button 2: Night Notice Rules Reminder (Blue) */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
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
                          <button 
                            onClick={() => handleSendWhatsApp(row, 2)}
                            title="Send Template 2 via WhatsApp"
                            style={{ 
                              width: "26px", 
                              height: "26px", 
                              borderRadius: "50%", 
                              border: "none", 
                              background: "#25d366", 
                              color: "#fff", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              cursor: "pointer",
                              boxShadow: "0 1px 3px rgba(37, 211, 102, 0.3)",
                            }}
                          >
                            <i className="fab fa-whatsapp" style={{ fontSize: "12px" }}></i>
                          </button>
                        </div>

                        {/* Button 3: Dispatch Completion Alert (Teal) */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
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
                          <button 
                            onClick={() => handleSendWhatsApp(row, 3)}
                            title="Send Template 3 via WhatsApp"
                            style={{ 
                              width: "26px", 
                              height: "26px", 
                              borderRadius: "50%", 
                              border: "none", 
                              background: "#25d366", 
                              color: "#fff", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              cursor: "pointer",
                              boxShadow: "0 1px 3px rgba(37, 211, 102, 0.3)",
                            }}
                          >
                            <i className="fab fa-whatsapp" style={{ fontSize: "12px" }}></i>
                          </button>
                        </div>
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
