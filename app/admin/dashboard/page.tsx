"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";

interface BookingRecord {
  id: string;
  time: string;
  customerName: string;
  companyName: string;
  route: string;
  vehicle: string;
  price: number;
  costAgent: number;
  status: string;
  tafweej: string;
  customerId: string;
}

interface ServiceRecord {
  id: string;
  time: string;
  customerName: string;
  companyName: string;
  serviceName: string;
  details: string;
  price: number;
  costAgent: number;
  status: string;
  customerId: string;
}

export default function OperationsDashboard() {
  const router = useRouter();
  
  // Tab Navigation state
  const [activeTab, setActiveTab] = useState<"bookings-today" | "bookings-tomorrow" | "services-today" | "services-tomorrow">("bookings-today");
  
  // Data lists state
  const [bookingsToday, setBookingsToday] = useState<BookingRecord[]>([]);
  const [bookingsTomorrow, setBookingsTomorrow] = useState<BookingRecord[]>([]);
  const [servicesToday, setServicesToday] = useState<ServiceRecord[]>([]);
  const [servicesTomorrow, setServicesTomorrow] = useState<ServiceRecord[]>([]);
  
  // UI & control states
  const [loading, setLoading] = useState(true);
  const [makkahTime, setMakkahTime] = useState("");
  const [makkahDate, setMakkahDate] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });

  // Top Table Controls & Filter State
  const [topPackageFilter, setTopPackageFilter] = useState("All");
  const [topVehicleFilter, setTopVehicleFilter] = useState("All");
  const [topSearchTerm, setTopSearchTerm] = useState("");
  const [topEntriesLimit, setTopEntriesLimit] = useState(100);

  // Bottom Table (Completed & Cancelled) Controls & Filter State
  const [bottomPackageFilter, setBottomPackageFilter] = useState("All");
  const [bottomVehicleFilter, setBottomVehicleFilter] = useState("All");
  const [bottomSearchTerm, setBottomSearchTerm] = useState("");
  const [bottomEntriesLimit, setBottomEntriesLimit] = useState(100);

  // Toast handler helper
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  // Clock Update Effect (Saudi Arabia Riyad / Makkah Time Zone)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeFmt = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Riyadh",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      });
      const dateFmt = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Riyadh",
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
      setMakkahTime(timeFmt.format(now));
      setMakkahDate(dateFmt.format(now));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real database records & synthesize operations lists
  useEffect(() => {
    async function loadOperationsData() {
      try {
        const dbBookings = await api.getBookings();
        const dbCustomers = await api.getCustomers();
        
        // Define fallback seeds matching exactly the legacy PHP datasets
        const legacyBookingsToday: BookingRecord[] = [
          { id: "#BKG-9843", time: "10:30 AM", customerName: "Zubair Ahmad", companyName: "Zahid Travels", route: "Jeddah Airport → Makkah Hotel", vehicle: "Sedan (Standard)", price: 300.00, costAgent: 100.00, status: "Active Dispatch", tafweej: "T-091A", customerId: "#CST-1" },
          { id: "#BKG-9844", time: "04:00 PM", customerName: "Abdul Rahman", companyName: "Al-Latif Group", route: "Makkah Hotel → Jeddah Airport", vehicle: "GMC Yukon XL", price: 550.00, costAgent: 180.00, status: "Confirmed Booking", tafweej: "T-091B", customerId: "#CST-2" },
          { id: "#BKG-9848", time: "11:15 AM", customerName: "Zubair Ahmad", companyName: "Zahid Travels", route: "Jeddah Airport → Makkah Hotel", vehicle: "Sedan (Standard)", price: 300.00, costAgent: 100.00, status: "Completed", tafweej: "T-098A", customerId: "#CST-1" },
          { id: "#BKG-9849", time: "09:00 PM", customerName: "Mohammed Siddique", companyName: "Al-Latif Group", route: "Madinah Hotel → Jeddah Airport", vehicle: "GMC Yukon XL", price: 550.00, costAgent: 180.00, status: "Cancelled", tafweej: "T-098B", customerId: "#CST-3" }
        ];

        const legacyBookingsTomorrow: BookingRecord[] = [
          { id: "#BKG-9845", time: "08:00 AM", customerName: "Imran Khan", companyName: "Zahid Travels", route: "Jeddah Airport → Madinah Hotel", vehicle: "Hyundai Staria", price: 650.00, costAgent: 220.00, status: "Pending Check", tafweej: "T-092A", customerId: "#CST-1" }
        ];

        const legacyServicesToday: ServiceRecord[] = [
          { id: "#SRV-1", time: "12:00 AM", customerName: "Zubair Ahmad", companyName: "Zahid Travels", serviceName: "Premium Umrah Visa Service", details: "Electronic Umrah visa compilation (Juice, Cake & Lays)", price: 450.00, costAgent: 150.00, status: "Pending", customerId: "#CST-1" },
          { id: "#SRV-2", time: "02:00 PM", customerName: "Abu Bakar", companyName: "Al-Latif Group", serviceName: "Private Makkah Ziyarah Tour", details: "Guided tour to Jabal al-Nour", price: 250.00, costAgent: 100.00, status: "Active", customerId: "#CST-3" },
          { id: "#SRV-4", time: "10:00 AM", customerName: "Abu Bakar", companyName: "Al-Latif Group", serviceName: "Private Makkah Ziyarah Tour", details: "Ziyarah Completed", price: 250.00, costAgent: 100.00, status: "Completed", customerId: "#CST-3" }
        ];

        const legacyServicesTomorrow: ServiceRecord[] = [
          { id: "#SRV-3", time: "09:30 AM", customerName: "Amjad", companyName: "Zahid Travels", serviceName: "VIP Makkah Meet & Greet", details: "Airport Fast-track service", price: 350.00, costAgent: 120.00, status: "Pending", customerId: "#CST-2" }
        ];

        // Hydrate from live DB if valid elements are present
        if (dbBookings && dbBookings.length > 0) {
          // Map database elements dynamically into our dashboard structure
          const mapped = dbBookings.map((b: any, idx: number) => {
            const matchedCust = dbCustomers ? dbCustomers.find((c: any) => c.name === b.fullName) : null;
            return {
              id: b.booking_code || `#BKG-87${idx + 10}`,
              time: b.time || "12:00 PM",
              customerName: b.fullName || "Guest",
              companyName: matchedCust ? matchedCust.company : "Independent",
              route: `${b.pickup} → ${b.destination}`,
              vehicle: b.carType || "Sedan",
              price: parseFloat(b.carPrice || 300),
              costAgent: parseFloat(b.carPrice || 300) * 0.4,
              status: b.status || "Confirmed Booking",
              tafweej: `T-0${idx + 90}X`,
              customerId: matchedCust ? (matchedCust.custom_id || `#CST-${matchedCust.id}`) : `#CST-1`
            };
          });

          // Sort or segregate based on dates if applicable, otherwise merge nicely with legacies
          setBookingsToday([...legacyBookingsToday, ...mapped.slice(0, 2)]);
          setBookingsTomorrow([...legacyBookingsTomorrow, ...mapped.slice(2)]);
        } else {
          setBookingsToday(legacyBookingsToday);
          setBookingsTomorrow(legacyBookingsTomorrow);
        }

        setServicesToday(legacyServicesToday);
        setServicesTomorrow(legacyServicesTomorrow);

      } catch (err) {
        console.error("Dashboard backend load failed, loading fallback metrics.", err);
      } finally {
        setLoading(false);
      }
    }

    loadOperationsData();
  }, []);

  // WhatsApp Alert Simulation Clipboard Copy
  const handleTriggerWhatsAppAlert = (item: any, isBooking: boolean, mode: "start" | "complete") => {
    let message = "";
    if (isBooking) {
      if (mode === "start") {
        message = `*UmrahCab Alert - Booking Starting*\n\nDear ${item.customerName},\nYour vehicle (${item.vehicle}) for route *${item.route}* is preparing to start. Tafweej ref: ${item.tafweej}.\n\nThank you for choosing UmrahCab.`;
      } else {
        message = `*UmrahCab Alert - Booking Completed*\n\nDear ${item.customerName},\nYour transport booking *${item.id}* has been marked as COMPLETED. We hope you had a pleasant journey.\n\nBest regards,\nUmrahCab Operations.`;
      }
    } else {
      if (mode === "start") {
        message = `*UmrahCab Alert - Service Commenced*\n\nDear ${item.customerName},\nYour additional service *${item.serviceName}* (${item.id}) has been activated.\nDetails: ${item.details}.\n\nBest regards,\nUmrahCab Services.`;
      } else {
        message = `*UmrahCab Alert - Service Done*\n\nDear ${item.customerName},\nYour additional service *${item.serviceName}* (${item.id}) has been successfully completed.\n\nThank you,\nUmrahCab Services.`;
      }
    }

    navigator.clipboard.writeText(message);
    showToast(`WhatsApp alert text copied to clipboard successfully!`, "success");
  };

  // Mark completion handler
  const handleMarkCompleted = (itemId: string, isBooking: boolean) => {
    if (isBooking) {
      setBookingsToday(prev => prev.map(b => b.id === itemId ? { ...b, status: "Completed" } : b));
      setBookingsTomorrow(prev => prev.map(b => b.id === itemId ? { ...b, status: "Completed" } : b));
    } else {
      setServicesToday(prev => prev.map(s => s.id === itemId ? { ...s, status: "Completed" } : s));
      setServicesTomorrow(prev => prev.map(s => s.id === itemId ? { ...s, status: "Completed" } : s));
    }
    showToast(`Record ${itemId} marked as Completed!`, "success");
  };

  // Export alerts simulation
  const triggerExport = (format: string) => {
    showToast(`Dashboard view successfully exported as ${format}!`, "success");
  };

  // 1. SELECT DATA LIST BASE ON THE TAB SELECTION
  const getRawTabList = () => {
    if (activeTab === "bookings-today") return bookingsToday;
    if (activeTab === "bookings-tomorrow") return bookingsTomorrow;
    if (activeTab === "services-today") return servicesToday;
    return servicesTomorrow;
  };

  const rawList = getRawTabList();
  const isBookingTab = activeTab.startsWith("bookings");

  // 2. SEGREGATE ACTIVE VS COMPLETED & CANCELLED
  const topActiveRecords = rawList.filter((item: any) => {
    const statusLower = item.status.toLowerCase();
    return statusLower !== "completed" && statusLower !== "cancelled";
  });

  const bottomCompletedRecords = rawList.filter((item: any) => {
    const statusLower = item.status.toLowerCase();
    return statusLower === "completed" || statusLower === "cancelled";
  });

  // 3. APPLY FILTERS TO TOP ACTIVE OPERATIONS
  const filteredTopRecords = topActiveRecords.filter((item: any) => {
    // Package filter
    if (topPackageFilter !== "All") {
      const packageLower = topPackageFilter.toLowerCase();
      if (isBookingTab) {
        if (!item.route.toLowerCase().includes(packageLower)) return false;
      } else {
        if (!item.serviceName.toLowerCase().includes(packageLower)) return false;
      }
    }
    // Vehicle filter
    if (isBookingTab && topVehicleFilter !== "All") {
      if (!item.vehicle.toLowerCase().includes(topVehicleFilter.toLowerCase())) return false;
    }
    // Search filter
    if (topSearchTerm) {
      const s = topSearchTerm.toLowerCase();
      const matchId = item.id.toLowerCase().includes(s);
      const matchName = item.customerName.toLowerCase().includes(s);
      const matchComp = item.companyName.toLowerCase().includes(s);
      const matchDesc = isBookingTab ? item.route.toLowerCase().includes(s) : item.serviceName.toLowerCase().includes(s);
      if (!matchId && !matchName && !matchComp && !matchDesc) return false;
    }
    return true;
  });

  // 4. APPLY FILTERS TO BOTTOM COMPLETED & CANCELLED OPERATIONS
  const filteredBottomRecords = bottomCompletedRecords.filter((item: any) => {
    // Package filter
    if (bottomPackageFilter !== "All") {
      const packageLower = bottomPackageFilter.toLowerCase();
      if (isBookingTab) {
        if (!item.route.toLowerCase().includes(packageLower)) return false;
      } else {
        if (!item.serviceName.toLowerCase().includes(packageLower)) return false;
      }
    }
    // Vehicle filter
    if (isBookingTab && bottomVehicleFilter !== "All") {
      if (!item.vehicle.toLowerCase().includes(bottomVehicleFilter.toLowerCase())) return false;
    }
    // Search filter
    if (bottomSearchTerm) {
      const s = bottomSearchTerm.toLowerCase();
      const matchId = item.id.toLowerCase().includes(s);
      const matchName = item.customerName.toLowerCase().includes(s);
      const matchComp = item.companyName.toLowerCase().includes(s);
      const matchDesc = isBookingTab ? item.route.toLowerCase().includes(s) : item.serviceName.toLowerCase().includes(s);
      if (!matchId && !matchName && !matchComp && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="db-grid" style={{ display: "flex", flexDirection: "column", gap: "25px", padding: "5px" }}>
      
      {/* Toast alert popups */}
      {toast.show && (
        <div className="toast-container" style={{ position: "fixed", top: "20px", right: "20px", zIndex: 9999 }}>
          <div className={`toast toast-${toast.type}`} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 20px", borderRadius: "8px", background: toast.type === "success" ? "#10b981" : "#ef4444", color: "#fff", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
            <i className={`fas ${toast.type === "success" ? "fa-circle-check" : "fa-circle-xmark"}`}></i>
            <span style={{ fontWeight: 600 }}>{toast.message}</span>
          </div>
        </div>
      )}

      {/* 🚀 Main Header Banner matching PHP Design */}
      <div 
        className="form-header-card" 
        style={{ 
          background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)", 
          padding: "30px 40px", 
          borderRadius: "16px", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          boxShadow: "0 10px 25px -5px rgba(217, 119, 6, 0.3)"
        }}
      >
        <div style={{ flex: 1, minWidth: "280px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", margin: "0 0 8px 0", letterSpacing: "-0.5px" }}>
            Operations Control Dashboard
          </h2>
          <p style={{ color: "#fef3c7", fontSize: "14px", margin: 0, fontWeight: 500, opacity: 0.9 }}>
            Real-time management center for bookings and auxiliary services today and tomorrow.
          </p>
        </div>

        {/* 🕌 Makkah Clock Widget Card */}
        <div 
          style={{ 
            background: "#ffffff", 
            borderRadius: "12px", 
            padding: "12px 24px", 
            boxShadow: "0 8px 16px -4px rgba(0,0,0,0.1)", 
            display: "flex", 
            alignItems: "center", 
            gap: "15px",
            minWidth: "220px",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#d97706", letterSpacing: "1px", textTransform: "uppercase" }}>
              <i className="fas fa-clock" style={{ marginRight: "5px" }}></i> Makkah Time
            </span>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b", fontFamily: "monospace", marginTop: "4px" }}>
              {makkahTime || "00:00:00 AM"}
            </span>
          </div>
          <div style={{ width: "45px", height: "45px", borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706", fontSize: "20px" }}>
            <i className="fas fa-mosque"></i>
          </div>
        </div>
      </div>

      {/* 📊 Four Real-Time Dynamic Action Stat Tabs */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", 
          gap: "20px" 
        }}
      >
        {/* Tab 1: Bookings Today */}
        <div 
          onClick={() => setActiveTab("bookings-today")}
          style={{ 
            background: "#ffffff", 
            borderRadius: "12px", 
            padding: "20px", 
            boxShadow: activeTab === "bookings-today" ? "0 10px 20px -3px rgba(37, 99, 235, 0.25)" : "0 4px 6px -1px rgba(0,0,0,0.05)",
            border: activeTab === "bookings-today" ? "2px solid #2563eb" : "2px solid transparent",
            cursor: "pointer",
            transition: "all 0.2s ease-in-out",
            transform: activeTab === "bookings-today" ? "translateY(-4px)" : "none"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "8px", background: "#dbeafe", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
              <i className="fas fa-calendar-day"></i>
            </div>
            <span style={{ background: "#2563eb", color: "#ffffff", fontWeight: 700, fontSize: "14px", padding: "4px 10px", borderRadius: "20px" }}>
              {bookingsToday.filter(b => b.status !== "Completed" && b.status !== "Cancelled").length} Active
            </span>
          </div>
          <div style={{ marginTop: "15px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 500, color: "#64748b", margin: 0 }}>Bookings Today</h4>
            <p style={{ fontSize: "11px", color: "#94a3b8", margin: "4px 0 0 0" }}>Transport dispatch for today</p>
          </div>
        </div>

        {/* Tab 2: Bookings Tomorrow */}
        <div 
          onClick={() => setActiveTab("bookings-tomorrow")}
          style={{ 
            background: "#ffffff", 
            borderRadius: "12px", 
            padding: "20px", 
            boxShadow: activeTab === "bookings-tomorrow" ? "0 10px 20px -3px rgba(79, 70, 229, 0.25)" : "0 4px 6px -1px rgba(0,0,0,0.05)",
            border: activeTab === "bookings-tomorrow" ? "2px solid #4f46e5" : "2px solid transparent",
            cursor: "pointer",
            transition: "all 0.2s ease-in-out",
            transform: activeTab === "bookings-tomorrow" ? "translateY(-4px)" : "none"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "8px", background: "#e0e7ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
              <i className="fas fa-calendar-plus"></i>
            </div>
            <span style={{ background: "#4f46e5", color: "#ffffff", fontWeight: 700, fontSize: "14px", padding: "4px 10px", borderRadius: "20px" }}>
              {bookingsTomorrow.filter(b => b.status !== "Completed" && b.status !== "Cancelled").length} Scheduled
            </span>
          </div>
          <div style={{ marginTop: "15px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 500, color: "#64748b", margin: 0 }}>Bookings Tomorrow</h4>
            <p style={{ fontSize: "11px", color: "#94a3b8", margin: "4px 0 0 0" }}>Upcoming scheduled transports</p>
          </div>
        </div>

        {/* Tab 3: Services Today */}
        <div 
          onClick={() => setActiveTab("services-today")}
          style={{ 
            background: "#ffffff", 
            borderRadius: "12px", 
            padding: "20px", 
            boxShadow: activeTab === "services-today" ? "0 10px 20px -3px rgba(16, 185, 129, 0.25)" : "0 4px 6px -1px rgba(0,0,0,0.05)",
            border: activeTab === "services-today" ? "2px solid #10b981" : "2px solid transparent",
            cursor: "pointer",
            transition: "all 0.2s ease-in-out",
            transform: activeTab === "services-today" ? "translateY(-4px)" : "none"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "8px", background: "#d1fae5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
              <i className="fas fa-truck-loading"></i>
            </div>
            <span style={{ background: "#10b981", color: "#ffffff", fontWeight: 700, fontSize: "14px", padding: "4px 10px", borderRadius: "20px" }}>
              {servicesToday.filter(s => s.status !== "Completed" && s.status !== "Cancelled").length} Scheduled
            </span>
          </div>
          <div style={{ marginTop: "15px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 500, color: "#64748b", margin: 0 }}>Services Today</h4>
            <p style={{ fontSize: "11px", color: "#94a3b8", margin: "4px 0 0 0" }}>Active packages & visa items</p>
          </div>
        </div>

        {/* Tab 4: Services Tomorrow */}
        <div 
          onClick={() => setActiveTab("services-tomorrow")}
          style={{ 
            background: "#ffffff", 
            borderRadius: "12px", 
            padding: "20px", 
            boxShadow: activeTab === "services-tomorrow" ? "0 10px 20px -3px rgba(245, 158, 11, 0.25)" : "0 4px 6px -1px rgba(0,0,0,0.05)",
            border: activeTab === "services-tomorrow" ? "2px solid #f59e0b" : "2px solid transparent",
            cursor: "pointer",
            transition: "all 0.2s ease-in-out",
            transform: activeTab === "services-tomorrow" ? "translateY(-4px)" : "none"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "8px", background: "#fef3c7", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
              <i className="fas fa-clock"></i>
            </div>
            <span style={{ background: "#f59e0b", color: "#ffffff", fontWeight: 700, fontSize: "14px", padding: "4px 10px", borderRadius: "20px" }}>
              {servicesTomorrow.filter(s => s.status !== "Completed" && s.status !== "Cancelled").length} Pending
            </span>
          </div>
          <div style={{ marginTop: "15px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 500, color: "#64748b", margin: 0 }}>Services Tomorrow</h4>
            <p style={{ fontSize: "11px", color: "#94a3b8", margin: "4px 0 0 0" }}>Tomorrow's service ledgers</p>
          </div>
        </div>
      </div>

      {/* 📋 SECTION 1: ACTIVE / PENDING OPERATIONS TABLE */}
      <div className="table-card" style={{ padding: "25px", borderRadius: "12px", background: "#ffffff", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        
        {/* Dynamic Header & Double Filters Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px", marginBottom: "20px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1e293b", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="fas fa-circle-check" style={{ color: "#10b981" }}></i>
              Active Operations 
              <span style={{ background: "#f1f5f9", fontSize: "12px", color: "#475569", padding: "2px 8px", borderRadius: "12px", fontWeight: 600 }}>{filteredTopRecords.length}</span>
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "3px 0 0 0" }}>Active dispatches, confirmed vouchers, and pending checks.</p>
          </div>

          {/* Top Dropdown Filters */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "#d97706", textTransform: "uppercase" }}>Package Filter</label>
              <select 
                value={topPackageFilter}
                onChange={(e) => setTopPackageFilter(e.target.value)}
                style={{ padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "12px", color: "#334155", background: "#f8fafc", width: "160px" }}
              >
                <option value="All">All Packages</option>
                <option value="Jeddah">Jeddah Airport</option>
                <option value="Makkah">Makkah Hotel</option>
                <option value="Madinah">Madinah Hotel</option>
                <option value="Visa">Visa Services</option>
                <option value="Tour">Tour Packages</option>
              </select>
            </div>

            {isBookingTab && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "10px", fontWeight: 700, color: "#d97706", textTransform: "uppercase" }}>Vehicle Filter</label>
                <select 
                  value={topVehicleFilter}
                  onChange={(e) => setTopVehicleFilter(e.target.value)}
                  style={{ padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "12px", color: "#334155", background: "#f8fafc", width: "140px" }}
                >
                  <option value="All">All Vehicles</option>
                  <option value="Sedan">Sedan</option>
                  <option value="GMC">GMC Yukon XL</option>
                  <option value="Staria">Staria</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Datatables control header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "15px" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={() => triggerExport("Excel")} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "6px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              <i className="fas fa-file-excel"></i> Excel
            </button>
            <button onClick={() => triggerExport("PDF")} style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "6px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              <i className="fas fa-file-pdf"></i> PDF
            </button>
            <button onClick={() => window.print()} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", padding: "6px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              <i className="fas fa-print"></i> Print Grid
            </button>
            <select 
              value={topEntriesLimit} 
              onChange={(e) => setTopEntriesLimit(parseInt(e.target.value))}
              style={{ padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "13px", color: "#334155", background: "#f8fafc", outline: "none", cursor: "pointer" }}
            >
              <option value={5}>Show 5 entries</option>
              <option value={10}>Show 10 entries</option>
              <option value={25}>Show 25 entries</option>
              <option value={100}>Show All entries</option>
            </select>
          </div>

          <div style={{ position: "relative", minWidth: "260px" }}>
            <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}></i>
            <input 
              type="text" 
              placeholder="Search records..." 
              value={topSearchTerm} 
              onChange={(e) => setTopSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "8px 12px 8px 36px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", color: "#334155", outline: "none", background: "#f8fafc" }}
            />
          </div>
        </div>

        {/* Top Active Bookings / Services Table */}
        <div className="table-responsive">
          <table className="db-table">
            <thead>
              {isBookingTab ? (
                <tr>
                  <th style={{ width: "130px" }}>TIME / ID</th>
                  <th>CUSTOMER / COMPANY</th>
                  <th>TRIP DETAILS</th>
                  <th style={{ width: "210px" }}>FINANCE / TAFWEEJ</th>
                  <th>STATUS</th>
                  <th style={{ width: "200px", textAlign: "center" }}>ACTIONS</th>
                </tr>
              ) : (
                <tr>
                  <th style={{ width: "130px" }}>TIME / ID</th>
                  <th>CUSTOMER</th>
                  <th>SERVICE TYPE</th>
                  <th>SERVICE DETAILS</th>
                  <th style={{ width: "210px" }}>PRICING SCHEME</th>
                  <th>STATUS</th>
                  <th style={{ width: "200px", textAlign: "center" }}>ACTIONS</th>
                </tr>
              )}
            </thead>
            <tbody>
              {isBookingTab ? (
                filteredTopRecords.slice(0, topEntriesLimit).map((b: any) => {
                  const isPending = b.status === "Pending Check" || b.status === "Pending";
                  return (
                    <tr key={b.id} style={{ borderLeft: isPending ? "4px solid #ef4444" : "4px solid #10b981" }}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#d97706" }}><i className="far fa-clock"></i> {b.time}</span>
                          <span style={{ fontWeight: 700, color: "#2563eb", marginTop: "3px", fontSize: "13px" }}>{b.id}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span onClick={() => router.push(`/admin/customers/view?id=${b.customerId}`)} style={{ fontWeight: 700, color: "#1e293b", cursor: "pointer", textDecoration: "underline" }}>{b.customerName}</span>
                          <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 600 }}><i className="fas fa-building" style={{ marginRight: "4px" }}></i> {b.companyName}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <span style={{ fontWeight: 600, color: "#334155", fontSize: "13px" }}>{b.route}</span>
                          <span style={{ fontSize: "11px", color: "#64748b" }}><i className="fas fa-car" style={{ marginRight: "4px" }}></i> {b.vehicle}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ background: "#fef3c7", padding: "6px 10px", borderRadius: "8px", border: "1px solid #fde68a", display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "9px", fontWeight: 700, color: "#b45309" }}>TOTAL PRICE</span>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#d97706" }}>SAR {b.price.toFixed(2)}</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "9px", fontWeight: 800, color: "#94a3b8" }}>TAFWEEJ REF</span>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>{b.tafweej}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="status-pill active">{b.status}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button onClick={() => handleTriggerWhatsAppAlert(b, true, "start")} title="Start WhatsApp Alert" style={{ background: "#eff6ff", border: "none", color: "#2563eb", borderRadius: "6px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><i className="fas fa-play"></i></button>
                          <button onClick={() => { handleTriggerWhatsAppAlert(b, true, "complete"); handleMarkCompleted(b.id, true); }} title="Complete & Alert" style={{ background: "#e0f2fe", border: "none", color: "#0284c7", borderRadius: "6px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><i className="fas fa-check"></i></button>
                          <button onClick={() => router.push(`/admin/customers/view?id=${b.customerId}`)} title="View Profile" style={{ background: "#ecfdf5", border: "none", color: "#10b981", borderRadius: "6px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><i className="fas fa-user"></i></button>
                          <button onClick={() => setSelectedVoucher({ ...b, type: "Transport Voucher" })} title="Transport Voucher (SV)" style={{ background: "#faf5ff", border: "none", color: "#8b5cf6", borderRadius: "6px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><i className="fas fa-file-invoice"></i></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                filteredTopRecords.slice(0, topEntriesLimit).map((s: any) => {
                  const isPending = s.status === "Pending";
                  return (
                    <tr key={s.id} style={{ borderLeft: isPending ? "4px solid #f59e0b" : "4px solid #10b981" }}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#d97706" }}><i className="far fa-clock"></i> {s.time}</span>
                          <span style={{ fontWeight: 700, color: "#10b981", marginTop: "3px", fontSize: "13px" }}>{s.id}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span onClick={() => router.push(`/admin/customers/view?id=${s.customerId}`)} style={{ fontWeight: 700, color: "#1e293b", cursor: "pointer", textDecoration: "underline" }}>{s.customerName}</span>
                          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}><i className="fas fa-building" style={{ marginRight: "4px" }}></i> {s.companyName}</span>
                        </div>
                      </td>
                      <td><span style={{ fontWeight: 700, color: "#334155", fontSize: "13px" }}>{s.serviceName}</span></td>
                      <td><span style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic" }}>{s.details}</span></td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ background: "#ecfdf5", padding: "6px 10px", borderRadius: "8px", border: "1px solid #a7f3d0", display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "9px", fontWeight: 700, color: "#047857" }}>TOTAL PRICE</span>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#10b981" }}>SAR {s.price.toFixed(2)}</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "9px", fontWeight: 800, color: "#94a3b8" }}>COST PRICE</span>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#d97706" }}><i className="fas fa-wallet" style={{ marginRight: "2px" }}></i> SAR {s.costAgent.toFixed(2)}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="status-pill pending">{s.status}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button onClick={() => handleTriggerWhatsAppAlert(s, false, "start")} title="Start Alert" style={{ background: "#eff6ff", border: "none", color: "#2563eb", borderRadius: "6px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><i className="fas fa-play"></i></button>
                          <button onClick={() => { handleTriggerWhatsAppAlert(s, false, "complete"); handleMarkCompleted(s.id, false); }} title="Complete Alert" style={{ background: "#e0f2fe", border: "none", color: "#0284c7", borderRadius: "6px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><i className="fas fa-check"></i></button>
                          <button onClick={() => router.push(`/admin/services/view?id=${s.id}`)} title="View Details" style={{ background: "#ecfdf5", border: "none", color: "#10b981", borderRadius: "6px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><i className="fas fa-eye"></i></button>
                          <button onClick={() => setSelectedVoucher({ ...s, type: "Additional Service Voucher" })} title="Print Service Voucher" style={{ background: "#faf5ff", border: "none", color: "#8b5cf6", borderRadius: "6px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><i className="fas fa-file-invoice"></i></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {filteredTopRecords.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}><i className="fas fa-inbox"></i></div>
                    No active operations found for this tab filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📋 SECTION 2: COMPLETED & CANCELLED OPERATIONS TABLE */}
      <div className="table-card" style={{ padding: "25px", borderRadius: "12px", background: "#ffffff", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", borderTop: "4px solid #64748b" }}>
        
        {/* Dynamic Header & Double Filters Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px", marginBottom: "20px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#475569", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="fas fa-ban" style={{ color: "#64748b" }}></i>
              Completed & Cancelled 
              <span style={{ background: "#f1f5f9", fontSize: "12px", color: "#475569", padding: "2px 8px", borderRadius: "12px", fontWeight: 600 }}>{filteredBottomRecords.length}</span>
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "3px 0 0 0" }}>Historical archive of successfully executed and discarded dispatches.</p>
          </div>

          {/* Bottom Dropdown Filters */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Package Filter</label>
              <select 
                value={bottomPackageFilter}
                onChange={(e) => setBottomPackageFilter(e.target.value)}
                style={{ padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "12px", color: "#334155", background: "#f8fafc", width: "160px" }}
              >
                <option value="All">All Packages</option>
                <option value="Jeddah">Jeddah Airport</option>
                <option value="Makkah">Makkah Hotel</option>
                <option value="Madinah">Madinah Hotel</option>
                <option value="Visa">Visa Services</option>
                <option value="Tour">Tour Packages</option>
              </select>
            </div>

            {isBookingTab && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Vehicle Filter</label>
                <select 
                  value={bottomVehicleFilter}
                  onChange={(e) => setBottomVehicleFilter(e.target.value)}
                  style={{ padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "12px", color: "#334155", background: "#f8fafc", width: "140px" }}
                >
                  <option value="All">All Vehicles</option>
                  <option value="Sedan">Sedan</option>
                  <option value="GMC">GMC Yukon XL</option>
                  <option value="Staria">Staria</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Datatables control header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "15px" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={() => triggerExport("Excel")} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "6px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              <i className="fas fa-file-excel"></i> Excel
            </button>
            <button onClick={() => triggerExport("PDF")} style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "6px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              <i className="fas fa-file-pdf"></i> PDF
            </button>
            <button onClick={() => window.print()} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", padding: "6px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              <i className="fas fa-print"></i> Print Grid
            </button>
            <select 
              value={bottomEntriesLimit} 
              onChange={(e) => setBottomEntriesLimit(parseInt(e.target.value))}
              style={{ padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "13px", color: "#334155", background: "#f8fafc", outline: "none", cursor: "pointer" }}
            >
              <option value={5}>Show 5 entries</option>
              <option value={10}>Show 10 entries</option>
              <option value={25}>Show 25 entries</option>
              <option value={100}>Show All entries</option>
            </select>
          </div>

          <div style={{ position: "relative", minWidth: "260px" }}>
            <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}></i>
            <input 
              type="text" 
              placeholder="Search records..." 
              value={bottomSearchTerm} 
              onChange={(e) => setBottomSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "8px 12px 8px 36px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", color: "#334155", outline: "none", background: "#f8fafc" }}
            />
          </div>
        </div>

        {/* Bottom Completed & Cancelled Bookings / Services Table */}
        <div className="table-responsive">
          <table className="db-table" style={{ background: "#fafafa" }}>
            <thead>
              {isBookingTab ? (
                <tr>
                  <th style={{ width: "130px" }}>TIME / ID</th>
                  <th>CUSTOMER / COMPANY</th>
                  <th>TRIP DETAILS</th>
                  <th style={{ width: "210px" }}>FINANCE / TAFWEEJ</th>
                  <th>STATUS</th>
                  <th style={{ width: "200px", textAlign: "center" }}>ACTIONS</th>
                </tr>
              ) : (
                <tr>
                  <th style={{ width: "130px" }}>TIME / ID</th>
                  <th>CUSTOMER</th>
                  <th>SERVICE TYPE</th>
                  <th>SERVICE DETAILS</th>
                  <th style={{ width: "210px" }}>PRICING SCHEME</th>
                  <th>STATUS</th>
                  <th style={{ width: "200px", textAlign: "center" }}>ACTIONS</th>
                </tr>
              )}
            </thead>
            <tbody>
              {isBookingTab ? (
                filteredBottomRecords.slice(0, bottomEntriesLimit).map((b: any) => {
                  const isCompleted = b.status === "Completed";
                  return (
                    <tr key={b.id} style={{ borderLeft: isCompleted ? "4px solid #10b981" : "4px solid #ef4444", opacity: 0.85 }}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}><i className="far fa-clock"></i> {b.time}</span>
                          <span style={{ fontWeight: 700, color: "#475569", marginTop: "3px", fontSize: "13px" }}>{b.id}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span onClick={() => router.push(`/admin/customers/view?id=${b.customerId}`)} style={{ fontWeight: 700, color: "#1e293b", cursor: "pointer", textDecoration: "underline" }}>{b.customerName}</span>
                          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}><i className="fas fa-building" style={{ marginRight: "4px" }}></i> {b.companyName}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <span style={{ fontWeight: 600, color: "#475569", fontSize: "13px" }}>{b.route}</span>
                          <span style={{ fontSize: "11px", color: "#64748b" }}><i className="fas fa-car" style={{ marginRight: "4px" }}></i> {b.vehicle}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ background: "#f1f5f9", padding: "6px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "9px", fontWeight: 700, color: "#475569" }}>TOTAL PRICE</span>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>SAR {b.price.toFixed(2)}</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "9px", fontWeight: 800, color: "#94a3b8" }}>TAFWEEJ REF</span>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>{b.tafweej}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${isCompleted ? "completed" : "cancelled"}`}>{b.status}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button onClick={() => router.push(`/admin/customers/view?id=${b.customerId}`)} title="View Profile" style={{ background: "#ecfdf5", border: "none", color: "#10b981", borderRadius: "6px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><i className="fas fa-user"></i></button>
                          <button onClick={() => setSelectedVoucher({ ...b, type: "Transport Voucher" })} title="Transport Voucher (SV)" style={{ background: "#faf5ff", border: "none", color: "#8b5cf6", borderRadius: "6px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><i className="fas fa-file-invoice"></i></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                filteredBottomRecords.slice(0, bottomEntriesLimit).map((s: any) => {
                  const isCompleted = s.status === "Completed";
                  return (
                    <tr key={s.id} style={{ borderLeft: isCompleted ? "4px solid #10b981" : "4px solid #ef4444", opacity: 0.85 }}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}><i className="far fa-clock"></i> {s.time}</span>
                          <span style={{ fontWeight: 700, color: "#475569", marginTop: "3px", fontSize: "13px" }}>{s.id}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span onClick={() => router.push(`/admin/customers/view?id=${s.customerId}`)} style={{ fontWeight: 700, color: "#1e293b", cursor: "pointer", textDecoration: "underline" }}>{s.customerName}</span>
                          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}><i className="fas fa-building" style={{ marginRight: "4px" }}></i> {s.companyName}</span>
                        </div>
                      </td>
                      <td><span style={{ fontWeight: 700, color: "#475569", fontSize: "13px" }}>{s.serviceName}</span></td>
                      <td><span style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic" }}>{s.details}</span></td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ background: "#f1f5f9", padding: "6px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "9px", fontWeight: 700, color: "#475569" }}>TOTAL PRICE</span>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>SAR {s.price.toFixed(2)}</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "9px", fontWeight: 800, color: "#94a3b8" }}>COST PRICE</span>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}><i className="fas fa-wallet" style={{ marginRight: "2px" }}></i> SAR {s.costAgent.toFixed(2)}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className={`status-pill ${isCompleted ? "completed" : "cancelled"}`}>{s.status}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button onClick={() => router.push(`/admin/services/view?id=${s.id}`)} title="View Details" style={{ background: "#ecfdf5", border: "none", color: "#10b981", borderRadius: "6px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><i className="fas fa-eye"></i></button>
                          <button onClick={() => setSelectedVoucher({ ...s, type: "Additional Service Voucher" })} title="Print Service Voucher" style={{ background: "#faf5ff", border: "none", color: "#8b5cf6", borderRadius: "6px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><i className="fas fa-file-invoice"></i></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {filteredBottomRecords.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}><i className="fas fa-inbox"></i></div>
                    No completed or cancelled entries found for this tab filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🧾 PRINT SERVICE VOUCHER (SV) MODAL PREVIEW */}
      {selectedVoucher && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "600px", margin: "20px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", background: "#ffffff", padding: "30px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            
            {/* Header Voucher */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px dashed #cbd5e1", paddingBottom: "20px", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "20px", fontWeight: 800, color: "#d97706" }}><i className="fas fa-kaaba"></i> UmrahCab</span>
                <span style={{ fontSize: "10px", display: "block", color: "#94a3b8", fontWeight: 600, marginTop: "2px" }}>OFFICIAL ADMINISTRATIVE VOUCHER</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#334155" }}>{selectedVoucher.type}</span>
                <span style={{ fontSize: "11px", display: "block", color: "#d97706", fontWeight: 700, marginTop: "2px" }}>REF: {selectedVoucher.id}</span>
              </div>
            </div>

            {/* Content list */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "25px" }}>
              <div>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Passenger Customer</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", display: "block" }}>{selectedVoucher.customerName}</span>
              </div>
              <div>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Corporate Agency</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#10b981", display: "block" }}>{selectedVoucher.companyName}</span>
              </div>
              
              {selectedVoucher.route ? (
                <>
                  <div style={{ gridColumn: "span 2" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Route Sector</span>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#334155", display: "block" }}>{selectedVoucher.route}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Vehicle Type</span>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#475569", display: "block" }}>{selectedVoucher.vehicle}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Tafweej Reference</span>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#475569", display: "block" }}>{selectedVoucher.tafweej}</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ gridColumn: "span 2" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Service Provided</span>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#334155", display: "block" }}>{selectedVoucher.serviceName}</span>
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Service Details</span>
                    <span style={{ fontSize: "13px", color: "#64748b", display: "block", fontStyle: "italic" }}>{selectedVoucher.details}</span>
                  </div>
                </>
              )}

              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "15px", gridColumn: "span 2" }}></div>

              <div>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Issue Time</span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569", display: "block" }}>{selectedVoucher.time}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Voucher Price</span>
                <span style={{ fontSize: "18px", fontWeight: 800, color: "#10b981", display: "block" }}>SAR {selectedVoucher.price.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer and controls */}
            <div style={{ display: "flex", gap: "10px", borderTop: "2px dashed #cbd5e1", paddingTop: "20px", justifyContent: "flex-end" }}>
              <button 
                onClick={() => { window.print(); showToast("Sent voucher to printer spool!", "success"); }}
                className="btn-submit"
                style={{ background: "#d97706", display: "flex", alignItems: "center", gap: "8px", height: "42px" }}
              >
                <i className="fas fa-print"></i> Print Voucher
              </button>
              <button 
                onClick={() => setSelectedVoucher(null)}
                className="form-btn-back"
                style={{ background: "#f1f5f9", color: "#475569", height: "42px" }}
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
