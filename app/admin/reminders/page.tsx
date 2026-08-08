"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { formatTimeOnly, getSaudiTodayDate, getSaudiDateWithOffset } from "@/utils/formatters";

export default function RemindersPage() {
  const router = useRouter();

  const getYesterdayStr = () => {
    return getSaudiDateWithOffset(-1);
  };

  const getTodayStr = () => {
    return getSaudiTodayDate();
  };

  const getTomorrowStr = () => {
    return getSaudiDateWithOffset(1);
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
  const [reminderDate, setReminderDate] = useState("");
  const [reminderSearch, setReminderSearch] = useState("");
  const [reminderLimit, setReminderLimit] = useState(100);
  const [copiedReminders, setCopiedReminders] = useState<Record<string, boolean>>({});

  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // History logs modal states
  const [historyModal, setHistoryModal] = useState<{ show: boolean; row: any; logs: any[] }>({ show: false, row: null, logs: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);

  // WhatsApp Preview Modal States
  const [previewModal, setPreviewModal] = useState<{
    show: boolean;
    message: string;
    phone: string;
    row: any;
    buttonNo: number;
  }>({
    show: false,
    message: "",
    phone: "",
    row: null,
    buttonNo: 1,
  });

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

  const formatWhatsAppMessage = (text: string) => {
    if (!text) return "";
    let formatted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Replace *bold* with <strong>bold</strong>
    formatted = formatted.replace(/\*(.*?)\*/g, "<strong>$1</strong>");
    
    // Replace _italic_ with <em>italic</em>
    formatted = formatted.replace(/_(.*?)_/g, "<em>$1</em>");
    
    // Replace ~strikethrough~ with <del>strikethrough</del>
    formatted = formatted.replace(/~(.*?)~/g, "<del>$1</del>");
    
    // Replace newlines with <br />
    formatted = formatted.replace(/\n/g, "<br />");
    
    return formatted;
  };

  const handleOpenHistory = async (row: any) => {
    setHistoryModal({ show: true, row, logs: [] });
    
    // Fallback logic for mock entries
    if (row.rawId === "9710" || row.rawId === "9711" || row.rawId === "9843" || row.rawId === "001" || row.rawId === "002" || row.rawId === "9845" || row.rawId === "003") {
      setHistoryModal({
        show: true,
        row,
        logs: [
          {
            id: 1,
            reminder_type: 1,
            recipient: row.phones[0] || "+966501234567",
            driver_name: row.driverName || "N/A",
            driver_trip_status: row.driverTripStatus || "Assigned",
            created_at: new Date().toISOString()
          }
        ]
      });
      return;
    }

    try {
      setLoadingHistory(true);
      const res = await api.getReminderHistory(row.rawId, row.type);
      let logsList = [];
      if (Array.isArray(res)) {
        logsList = res;
      } else if (res && Array.isArray(res.data)) {
        logsList = res.data;
      } else if (res && res.success && Array.isArray(res.data)) {
        logsList = res.data;
      }
      setHistoryModal({ show: true, row, logs: logsList });
    } catch (err) {
      console.error("Failed to load reminder log history", err);
      showToast("Failed to retrieve reminder logs.", "error");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    setReminderDate(getTodayStr());
  }, []);

  useEffect(() => {
    if (!reminderDate) return;

    const loadRemindersData = async () => {
      try {
        setLoading(true);
        const res = await api.getRemindersList(reminderDate);
        if (res) {
          let rawList = [];
          if (Array.isArray(res)) {
            rawList = res;
          } else if (res.data && Array.isArray(res.data)) {
            rawList = res.data;
          }
          setReminders(rawList.map((item: any) => ({
            ...item,
            time: formatTimeOnly(item.time || "10:30 AM")
          })));
        } else {
          setReminders([]);
        }
      } catch (err) {
        console.error("Failed to load reminders backend data", err);
        showToast("Failed to fetch reminders dataset.", "error");
      } finally {
        setLoading(false);
      }
    };
    loadRemindersData();
  }, [reminderDate]);

  // Dynamically load active reminders, falling back to beautiful defaults if no records are found in database
  const allReminders = reminders.length > 0 ? reminders : [
    // Yesterday
    { id: "#BKG-9710", rawId: "9710", type: "BKG", date: getYesterdayStr(), time: "09:15", customerName: "Zubair Ahmad", companyName: "Zahid Travels", details: "Jeddah Airport → Makkah Hotel", vehicle: "Sedan (Standard)", phones: ["+966501234567"], customerId: "1", driverName: "Muhammad Ali", driverPhone: "+966555123456", driverTripStatus: "On The Way", reminder1_sent: false, reminder2_sent: false, reminder3_sent: false },
    { id: "#SRV-9711", rawId: "9711", type: "SRV", date: getYesterdayStr(), time: "11:00", customerName: "Abu Bakar", companyName: "Al-Latif Group", details: "Premium Umrah Visa Service", vehicle: "N/A", phones: ["+966549876543"], customerId: "3", driverName: null, driverPhone: null, driverTripStatus: "", reminder1_sent: false, reminder2_sent: false, reminder3_sent: false },

    // Today
    { id: "#BKG-9843", rawId: "9843", type: "BKG", date: getTodayStr(), time: "10:30", customerName: "Zubair Ahmad", companyName: "Zahid Travels", details: "Jeddah Airport → Makkah Hotel", vehicle: "Sedan (Standard)", phones: ["+966501234567"], customerId: "1", driverName: "Ahmed Khan", driverPhone: "+966555987654", driverTripStatus: "Reached At Location", reminder1_sent: false, reminder2_sent: false, reminder3_sent: false },
    { id: "#SRV-001", rawId: "001", type: "SRV", date: getTodayStr(), time: "12:00", customerName: "Zubair Ahmad", companyName: "Zahid Travels", details: "Premium Umrah Visa Service (Juice, Cake & Lays)", vehicle: "N/A", phones: ["+966501234567"], customerId: "1", driverName: null, driverPhone: null, driverTripStatus: "", reminder1_sent: false, reminder2_sent: false, reminder3_sent: false },
    { id: "#SRV-002", rawId: "002", type: "SRV", date: getTodayStr(), time: "14:00", customerName: "Abu Bakar", companyName: "Al-Latif Group", details: "Private Makkah Ziyarah Tour (Guided)", vehicle: "N/A", phones: ["+966549876543"], customerId: "3", driverName: null, driverPhone: null, driverTripStatus: "", reminder1_sent: false, reminder2_sent: false, reminder3_sent: false },

    // Tomorrow
    { id: "#BKG-9845", rawId: "9845", type: "BKG", date: getTomorrowStr(), time: "08:00", customerName: "Imran Khan", companyName: "Zahid Travels", details: "Jeddah Airport → Madinah Hotel", vehicle: "Hyundai Staria", phones: ["+966501234567"], customerId: "1", driverName: "Tariq Shah", driverPhone: "+966555456789", driverTripStatus: "Assigned", reminder1_sent: false, reminder2_sent: false, reminder3_sent: false },
    { id: "#SRV-003", rawId: "003", type: "SRV", date: getTomorrowStr(), time: "09:30", customerName: "Amjad", companyName: "Zahid Travels", details: "VIP Makkah Meet & Greet (Fast-track)", vehicle: "N/A", phones: ["+923114567890"], customerId: "2", driverName: null, driverPhone: null, driverTripStatus: "", reminder1_sent: false, reminder2_sent: false, reminder3_sent: false }
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
    const emojiHandshake = String.fromCodePoint(0x1F91D);
    const emojiCar = String.fromCodePoint(0x1F697);
    const emojiCalendar = String.fromCodePoint(0x1F4C5);
    const emojiPin = String.fromCodePoint(0x1F4CD);
    const emojiClock = String.fromCodePoint(0x23F0);
    const emojiFlag = String.fromCodePoint(0x1F3C1);
    const emojiUser = String.fromCodePoint(0x1F464);
    const emojiPhone = String.fromCodePoint(0x1F4DE);
    const emojiCheck = String.fromCodePoint(0x2705);
    const emojiWarning = String.fromCodePoint(0x26A0);
    const emojiMemo = String.fromCodePoint(0x1F4DD);
    const emojiPushpin = String.fromCodePoint(0x1F4CC);
    const emojiScroll = String.fromCodePoint(0x1F4DC);
    const emojiSparkles = String.fromCodePoint(0x2728);
    const emojiWrench = String.fromCodePoint(0x1F6E0);

    let message = "";
    if (buttonNo === 1) { // Trip / Service Reminder
      if (row.type === "BKG") {
        const pickup = row.details.split("→")[0]?.trim() || "Airport";
        const dropoff = row.details.split("→")[1]?.trim() || "Hotel";
        const status = row.driverTripStatus || "";

        if (status === "On The Way") {
          message = `${emojiHandshake} *Driver On The Way* ${emojiHandshake}\n\nالسلام عليكم\n\nDear Guest *${row.customerName}*,\n\n${emojiCar} Your driver is now *On the Way* to pick you up.\n_________________________\n${emojiCalendar} Pick Up Date: *${row.date}*\n${emojiPin} Pick Up Location: *${pickup}*\n${emojiClock} Pick Up Time: *${row.time}*\n${emojiFlag} Drop Off Location: *${dropoff}*\n_________________________\n${emojiCar} Vehicle: *${row.vehicle}*\n${emojiUser} Driver: *${row.driverName || "Assigned"}*\n${emojiPhone} Driver Contact: *${row.driverPhone || "N/A"}*\n\nPlease be ready at the pickup location. Thanks and regards`;
        } else if (status === "Reached At Location") {
          message = `${emojiHandshake} *Driver Arrived* ${emojiHandshake}\n\nالسلام عليكم\n\nDear Guest *${row.customerName}*,\n\n${emojiPin} Your driver has *Arrived* at your pickup location.\n_________________________\n${emojiCalendar} Pick Up Date: *${row.date}*\n${emojiPin} Pick Up Location: *${pickup}*\n${emojiClock} Pick Up Time: *${row.time}*\n${emojiFlag} Drop Off Location: *${dropoff}*\n_________________________\n${emojiCar} Vehicle: *${row.vehicle}*\n${emojiUser} Driver: *${row.driverName || "Assigned"}*\n${emojiPhone} Driver Contact: *${row.driverPhone || "N/A"}*\n\nPlease proceed to meet the driver. Thanks and regards`;
        } else if (status === "Guest In Contact") {
          message = `${emojiHandshake} *Driver in Contact* ${emojiHandshake}\n\nالسلام عليكم\n\nDear Guest *${row.customerName}*,\n\n${emojiPhone} Your driver is now *In Contact* with you for the pickup.\n_________________________\n${emojiCalendar} Pick Up Date: *${row.date}*\n${emojiPin} Pick Up Location: *${pickup}*\n${emojiClock} Pick Up Time: *${row.time}*\n${emojiFlag} Drop Off Location: *${dropoff}*\n_________________________\n${emojiCar} Vehicle: *${row.vehicle}*\n${emojiUser} Driver: *${row.driverName || "Assigned"}*\n${emojiPhone} Driver Contact: *${row.driverPhone || "N/A"}*\n\nThanks and regards`;
        } else {
          let driverInfo = "";
          if (row.driverName) {
            driverInfo = `${emojiUser} Driver: *${row.driverName}*\n${emojiPhone} Driver Contact: *${row.driverPhone || "N/A"}*\n_________________________\n`;
          }
          message = `${emojiHandshake} *Reminder Confirmation* ${emojiHandshake}\n\n` +
            `السلام عليكم\n\n` +
            `Dear *Guest*,\n\n` +
            `${emojiCheck} We have your confirmed booking for a pickup from *${pickup}* to *${dropoff}* on *${row.date}* at *${row.time}*.\n` +
            `_________________________\n` +
            `${emojiCalendar} Pick Up Date: *${row.date}*\n` +
            `${emojiPin} Pick Up Location: *${pickup}*\n` +
            `${emojiClock} Pick Up Time: *${row.time}*\n` +
            `${emojiFlag} Drop Off Location: *${dropoff}*\n` +
            `_________________________\n` +
            `${emojiCar} Vehicle: *${row.vehicle}*\n\n` +
            driverInfo +
            `${emojiWarning} *You are requested to please let us know if there is any change in the plan by 3pm today, after that the schedule shall be considered confirmed.*\n` +
            `${emojiMemo} *Please acknowledge the pickup time. Thanks and regards*`;
        }
      } else {
        message = `||| ${emojiPushpin} *Service Reminder* |||\n\nالسلام عليكم\n\nDear *${row.customerName}*,\n\n${emojiCheck} We have your confirmed service: *${row.details}*\n${emojiCalendar} Date: *${row.date}*\n${emojiClock} Time: *${row.time}*\n\nHope to serve you best!`;
      }
    } else if (buttonNo === 2) { // Guest Notice Rules
      message = `${emojiScroll} *Subject: Guest Notice*,\n\nDear *${row.customerName}*,\n\nالسلام عليكم\n\nFollowing these instructions is mandatory to maintain a travel process.\n\n*1\u{FE0F}\u{20E3} Response Time:* Please confirm trip details within 8 hours of reminder.\n*2\u{FE0F}\u{20E3} Cancellation:* Must be 3:30 hours prior to pickup window.\n${emojiPhone} Support: +966504861551.\n${emojiSparkles} *Safe journey and blessings.*`;
    } else if (buttonNo === 3) { // Completion / Partner Alert
      if (row.type === "BKG") {
        const pickup = row.details.split("→")[0]?.trim() || "Airport";
        const dropoff = row.details.split("→")[1]?.trim() || "Hotel";
        message = `${emojiHandshake} Dear Valuable Partner *${row.companyName}*\n\n${emojiUser} Regarding Client *${row.customerName}*\n${emojiPin} From *${pickup}* to *${dropoff}*\n${emojiCar} On *${row.vehicle}*\n\n${emojiCheck} Their Pickup Has Been *Successful.*`;
      } else {
        message = `${emojiHandshake} Dear Valuable Partner *${row.companyName}*\n\n${emojiUser} Regarding Client *${row.customerName}*\n${emojiWrench} Service *${row.details}*\n\n${emojiCheck} Has Been *Successfully Completed.*`;
      }
    }
    return message;
  };

  const markReminderAsSent = async (row: any, buttonNo: number) => {
    try {
      await api.markReminderSent(row.rawId, row.type, buttonNo);
      setReminders(prev => prev.map(r => {
        if (r.rawId === row.rawId && r.type === row.type) {
          return {
            ...r,
            [`reminder${buttonNo}_sent`]: true
          };
        }
        return r;
      }));
    } catch (err) {
      console.warn("Failed to mark reminder as sent in DB", err);
    }
  };

  const handleCopyReminder = (row: any, buttonNo: number) => {
    const message = getReminderMessageText(row, buttonNo);
    navigator.clipboard.writeText(message);
    setCopiedReminders(prev => ({ ...prev, [`${row.id}_${buttonNo}`]: true }));
    showToast(`Template ${buttonNo} copied to clipboard successfully!`, "success");
    markReminderAsSent(row, buttonNo);
  };

  const handleSendWhatsApp = (row: any, buttonNo: number) => {
    const message = getReminderMessageText(row, buttonNo);
    const phone = row.phones && row.phones[0] ? row.phones[0] : "";
    setPreviewModal({
      show: true,
      message,
      phone,
      row,
      buttonNo,
    });
  };

  const executeSendWhatsApp = () => {
    if (!previewModal.row) return;
    const cleanPhone = previewModal.phone.replace(/[^0-9]/g, "");
    const encodedText = encodeURIComponent(previewModal.message);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, "_blank");
    setCopiedReminders(prev => ({ ...prev, [`${previewModal.row.id}_${previewModal.buttonNo}`]: true }));
    showToast(`WhatsApp tab opened for Template ${previewModal.buttonNo}!`, "success");
    markReminderAsSent(previewModal.row, previewModal.buttonNo);
    setPreviewModal({ show: false, message: "", phone: "", row: null, buttonNo: 1 });
  };

  const handleCopyFromPreview = () => {
    if (!previewModal.row) return;
    navigator.clipboard.writeText(previewModal.message);
    setCopiedReminders(prev => ({ ...prev, [`${previewModal.row.id}_${previewModal.buttonNo}`]: true }));
    showToast(`Template ${previewModal.buttonNo} copied to clipboard successfully!`, "success");
    markReminderAsSent(previewModal.row, previewModal.buttonNo);
    setPreviewModal({ show: false, message: "", phone: "", row: null, buttonNo: 1 });
  };

  const handleTabChange = (buttonNo: number) => {
    if (!previewModal.row) return;
    const message = getReminderMessageText(previewModal.row, buttonNo);
    setPreviewModal(prev => ({
      ...prev,
      buttonNo,
      message
    }));
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
                            title={row.reminder1_sent ? "Reminder Sent (Click to copy again)" : "Copy Trip / Service Reminder Message"}
                            style={{ 
                              width: "34px", 
                              height: "34px", 
                              borderRadius: "50%", 
                              border: "none", 
                              background: row.reminder1_sent ? "#059669" : "#10b981", 
                              color: "#fff", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              cursor: "pointer",
                              boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)",
                              opacity: (copiedReminders[`${row.id}_1`] || row.reminder1_sent) ? 0.65 : 1,
                              transition: "opacity 0.2s"
                            }}
                          >
                            {row.reminder1_sent ? (
                              <i className="fas fa-check-double" style={{ fontSize: "12px" }}></i>
                            ) : (
                              <i className="fas fa-bell" style={{ fontSize: "13px" }}></i>
                            )}
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
                            title={row.reminder2_sent ? "Night Notice Sent (Click to copy again)" : "Copy Night Notice / Rules Rules Message"}
                            style={{ 
                              width: "34px", 
                              height: "34px", 
                              borderRadius: "50%", 
                              border: "none", 
                              background: row.reminder2_sent ? "#2563eb" : "#3b82f6", 
                              color: "#fff", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              cursor: "pointer",
                              boxShadow: "0 2px 4px rgba(59, 130, 246, 0.2)",
                              opacity: (copiedReminders[`${row.id}_2`] || row.reminder2_sent) ? 0.65 : 1,
                              transition: "opacity 0.2s"
                            }}
                          >
                            {row.reminder2_sent ? (
                              <i className="fas fa-check-double" style={{ fontSize: "12px" }}></i>
                            ) : (
                              <i className="fas fa-moon" style={{ fontSize: "13px" }}></i>
                            )}
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
                            title={row.reminder3_sent ? "Dispatch Alert Sent (Click to copy again)" : "Copy Dispatch / Completion Confirmation Message"}
                            style={{ 
                              width: "34px", 
                              height: "34px", 
                              borderRadius: "50%", 
                              border: "none", 
                              background: row.reminder3_sent ? "#0f766e" : "#0d9488", 
                              color: "#fff", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              cursor: "pointer",
                              boxShadow: "0 2px 4px rgba(13, 148, 136, 0.2)",
                              opacity: (copiedReminders[`${row.id}_3`] || row.reminder3_sent) ? 0.65 : 1,
                              transition: "opacity 0.2s"
                            }}
                          >
                            {row.reminder3_sent ? (
                              <i className="fas fa-check-double" style={{ fontSize: "12px" }}></i>
                            ) : (
                              <i className="fas fa-check" style={{ fontSize: "13px" }}></i>
                            )}
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

                        {/* Button 4: Log History (Grey) */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                          <button 
                            onClick={() => handleOpenHistory(row)}
                            title="View Dispatch History Logs"
                            style={{ 
                              width: "34px", 
                              height: "34px", 
                              borderRadius: "50%", 
                              border: "none", 
                              background: "#64748b", 
                              color: "#fff", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              cursor: "pointer",
                              boxShadow: "0 2px 4px rgba(100, 116, 139, 0.2)",
                              transition: "background 0.2s"
                            }}
                          >
                            <i className="fas fa-history" style={{ fontSize: "13px" }}></i>
                          </button>
                          <span style={{ fontSize: "9px", color: "#64748b", fontWeight: "600" }}>Logs</span>
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
      {/* History Logs Modal */}
      {historyModal.show && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            width: "500px",
            maxWidth: "90%",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#f8fafc"
            }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                  Reminder Dispatch Logs
                </h3>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                  History for {historyModal.row?.id} ({historyModal.row?.customerName})
                </p>
              </div>
              <button
                onClick={() => setHistoryModal({ show: false, row: null, logs: [] })}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: "18px",
                  padding: "4px"
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px", maxHeight: "400px", overflowY: "auto" }}>
              {loadingHistory ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                  <div style={{
                    width: "24px",
                    height: "24px",
                    border: "3px solid #e2e8f0",
                    borderTopColor: "#3b82f6",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }}></div>
                </div>
              ) : historyModal.logs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  <i className="fas fa-history" style={{ fontSize: "32px", color: "#cbd5e1", marginBottom: "8px" }}></i>
                  <p style={{ fontSize: "14px", margin: 0 }}>No dispatch history logs found for this item.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {historyModal.logs.map((log: any, idx: number) => (
                    <div key={log.id || idx} style={{
                      display: "flex",
                      gap: "12px",
                      position: "relative",
                      paddingBottom: idx === historyModal.logs.length - 1 ? 0 : "16px",
                      borderLeft: idx === historyModal.logs.length - 1 ? "none" : "2px solid #e2e8f0",
                      marginLeft: "6px",
                      paddingLeft: "16px"
                    }}>
                      {/* Timeline dot */}
                      <div style={{
                        position: "absolute",
                        left: "-6px",
                        top: "2px",
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: log.reminder_type === 1 ? "#10b981" : 
                                    log.reminder_type === 2 ? "#3b82f6" : 
                                    log.reminder_type === 3 ? "#0d9488" : "#f59e0b",
                        border: "2px solid #fff"
                      }}></div>

                      {/* Log details */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                          <span style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: log.reminder_type === 1 ? "#047857" : 
                                   log.reminder_type === 2 ? "#1d4ed8" : 
                                   log.reminder_type === 3 ? "#0f766e" : "#b45309"
                          }}>
                            {log.reminder_type === 1 ? "Template 1: Trip Reminder" : 
                             log.reminder_type === 2 ? "Template 2: Notice Rules" : 
                             log.reminder_type === 3 ? "Template 3: Dispatch Confirmation" :
                             log.reminder_type === 4 ? "System Log: Driver Assigned / Trip Status Updated" :
                             log.reminder_type === 5 ? "System Log: Status Updated" : "System Log"}
                          </span>
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                            {new Date(log.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p style={{ fontSize: "12px", color: "#475569", margin: "4px 0 0 0" }}>
                          {log.recipient === "System Update" ? (
                            <span>Type: <span style={{ fontWeight: 600, color: "#b45309" }}>System Auto-Log</span></span>
                          ) : (
                            <span>Sent to: <span style={{ fontWeight: 600 }}>{log.recipient || "N/A"}</span></span>
                          )}
                        </p>
                        {(log.driver_name || log.driver_trip_status) && (
                          <div style={{
                            marginTop: "6px",
                            background: "#f8fafc",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            border: "1px solid #e2e8f0",
                            fontSize: "11px",
                            color: "#475569"
                          }}>
                            {log.driver_name && <div>👤 Driver: <span style={{ fontWeight: 600 }}>{log.driver_name}</span></div>}
                            {log.driver_trip_status && (
                              <div style={{ marginTop: "2px" }}>
                                {log.reminder_type === 5 ? "📋 Booking Status: " : "🏁 Driver Status: "}
                                <span style={{ 
                                  fontWeight: 700, 
                                  color: log.driver_trip_status === "On The Way" ? "#0369a1" : 
                                         log.driver_trip_status === "Reached At Location" ? "#047857" : 
                                         log.driver_trip_status === "Active Dispatch" ? "#10b981" : "#475569"
                                }}>{log.driver_trip_status}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "12px 20px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "flex-end",
              background: "#f8fafc"
            }}>
              <button
                onClick={() => setHistoryModal({ show: false, row: null, logs: [] })}
                style={{
                  background: "#fff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "6px 16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Preview Modal */}
      {previewModal.show && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "500px",
            maxWidth: "90%",
            padding: "24px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            display: "flex",
            flexDirection: "column"
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>Share Booking / Trip Details</h3>
              <button
                onClick={() => setPreviewModal({ show: false, message: "", phone: "", row: null, buttonNo: 1 })}
                style={{ border: "none", background: "none", cursor: "pointer", fontSize: "20px", color: "#64748b" }}
              >
                &times;
              </button>
            </div>
            
            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "2px solid #f1f5f9", marginBottom: "16px", gap: "16px" }}>
              <button
                onClick={() => handleTabChange(1)}
                style={{
                  padding: "8px 4px",
                  fontWeight: "600",
                  fontSize: "14px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  borderBottom: previewModal.buttonNo === 1 ? "2px solid #2563eb" : "2px solid transparent",
                  color: previewModal.buttonNo === 1 ? "#2563eb" : "#64748b",
                  textTransform: "capitalize",
                  marginBottom: "-2px"
                }}
              >
                Reminder Copy
              </button>
              <button
                onClick={() => handleTabChange(2)}
                style={{
                  padding: "8px 4px",
                  fontWeight: "600",
                  fontSize: "14px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  borderBottom: previewModal.buttonNo === 2 ? "2px solid #2563eb" : "2px solid transparent",
                  color: previewModal.buttonNo === 2 ? "#2563eb" : "#64748b",
                  textTransform: "capitalize",
                  marginBottom: "-2px"
                }}
              >
                Notice Copy
              </button>
              <button
                onClick={() => handleTabChange(3)}
                style={{
                  padding: "8px 4px",
                  fontWeight: "600",
                  fontSize: "14px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  borderBottom: previewModal.buttonNo === 3 ? "2px solid #2563eb" : "2px solid transparent",
                  color: previewModal.buttonNo === 3 ? "#2563eb" : "#64748b",
                  textTransform: "capitalize",
                  marginBottom: "-2px"
                }}
              >
                Partner Copy
              </button>
            </div>

            {/* Recipient Phone Number */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Recipient Phone Number</label>
              <input
                type="text"
                value={previewModal.phone}
                onChange={(e) => setPreviewModal(prev => ({ ...prev, phone: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: "#334155",
                  outline: "none",
                  fontWeight: "600",
                  fontFamily: "monospace"
                }}
              />
            </div>

            {/* Text Area */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Edit Message Content</label>
              <textarea
                value={previewModal.message}
                onChange={(e) => setPreviewModal(prev => ({ ...prev, message: e.target.value }))}
                style={{
                  width: "100%",
                  height: "150px",
                  padding: "12px",
                  fontFamily: "monospace",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  color: "#334155",
                  resize: "none",
                  outline: "none"
                }}
              />
            </div>

            {/* Live Preview (WhatsApp Simulator) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Live Preview (WhatsApp Format)</label>
              <div style={{
                background: "#efeae2",
                padding: "12px",
                borderRadius: "8px",
                maxHeight: "130px",
                overflowY: "auto",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column"
              }}>
                <div style={{
                  background: "#d9fdd3",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  maxWidth: "90%",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  color: "#111b21",
                  boxShadow: "0 1px 0.5px rgba(11,20,26,.13)",
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                  wordBreak: "break-word",
                  whiteSpace: "pre-wrap"
                }} dangerouslySetInnerHTML={{ __html: formatWhatsAppMessage(previewModal.message) }} />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                onClick={() => setPreviewModal({ show: false, message: "", phone: "", row: null, buttonNo: 1 })}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#334155",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCopyFromPreview}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#334155",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <i className="fas fa-copy"></i>
                Copy
              </button>
              <button
                onClick={executeSendWhatsApp}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#25d366",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <i className="fab fa-whatsapp"></i>
                Send via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
}
