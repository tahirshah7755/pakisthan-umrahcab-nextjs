"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { useRouter } from "next/navigation";

interface PriceCell {
  price: string;
  from: string;
  to: string;
}

interface PackageRow {
  id: string;
  englishName: string;
  urduName: string;
  prices: Record<string, PriceCell>;
}

const VEHICLES = [
  { id: "sedan", name: "Sedan", icon: "fa-car" },
  { id: "staria", name: "Hyundai Staria", icon: "fa-van-shuttle" },
  { id: "starex", name: "Hyundai Starex", icon: "fa-van-shuttle" },
  { id: "yukon", name: "GMC XL Yukon", icon: "fa-truck-pickup" },
  { id: "hiace", name: "Hiace Grand Cabin", icon: "fa-van-shuttle" },
  { id: "coaster", name: "Coaster", icon: "fa-bus" },
  { id: "bus", name: "Bus", icon: "fa-bus" },
  { id: "luxury_bus", name: "Luxury Bus", icon: "fa-bus" },
];

export default function CalendarFarePage() {
  const router = useRouter();
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Selector state
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Calendar render helper
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const loadFares = async () => {
      try {
        setLoading(true);
        const priceListData = await api.getPriceList();
        if (priceListData && Array.isArray(priceListData)) {
          const mapped = priceListData.map((b: any) => {
            const sedanDates = b.sedan_dates || "2026-06-01 to 2026-08-31";
            const parts = sedanDates.split(" to ");
            const fromDate = parts[0] || "2026-06-01";
            const toDate = parts[1] || "2026-08-31";

            return {
              id: String(b.id),
              englishName: b.route,
              urduName: b.route.includes("Airport") ? "ایئرپورٹ ٹرانسپورٹ" : "ہوٹل ٹرانسپورٹ",
              prices: {
                sedan: { price: String(b.sedan_price || 300), from: fromDate, to: toDate },
                staria: { price: String(b.van_price || 500), from: fromDate, to: toDate },
                starex: { price: String(b.van_price || 450), from: fromDate, to: toDate },
                yukon: { price: String(b.suv_price || 700), from: fromDate, to: toDate },
                hiace: { price: String(b.van_price || 600), from: fromDate, to: toDate },
                coaster: { price: String(b.coach_price || 1200), from: fromDate, to: toDate },
                bus: { price: String(b.coach_price || 1800), from: fromDate, to: toDate },
                luxury_bus: { price: String(b.coach_price || 2400), from: fromDate, to: toDate },
              }
            };
          });
          setPackages(mapped);
          if (mapped.length > 0) {
            setSelectedRouteId(mapped[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load fares list:", err);
      } finally {
        setLoading(false);
      }
    };
    loadFares();
  }, []);

  const activePackage = packages.find(p => p.id === selectedRouteId);

  // Generate days for the month calendar
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const numDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Days in current month
    for (let i = 1; i <= numDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const days = getDaysInMonth(currentMonth);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isDateSelected = (day: Date) => {
    if (!day) return false;
    return day.toISOString().split("T")[0] === selectedDate;
  };

  // Check if date falls in standard fare validity period
  const getFareStatus = (vehicleId: string) => {
    if (!activePackage) return { valid: false, text: "No Package Selected" };
    const priceCell = activePackage.prices[vehicleId];
    if (!priceCell) return { valid: false, text: "Fare Not Configured" };

    const fromDate = new Date(priceCell.from);
    const toDate = new Date(priceCell.to);
    const targetDate = new Date(selectedDate);

    // Remove time components for pure date comparison
    fromDate.setHours(0,0,0,0);
    toDate.setHours(23,59,59,999);
    targetDate.setHours(12,0,0,0);

    const valid = targetDate >= fromDate && targetDate <= toDate;
    return {
      valid,
      text: valid ? "Standard Season Pricing" : `Out of Period (Validity: ${priceCell.from} to ${priceCell.to})`,
      price: priceCell.price
    };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header Banner */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Calendar Routes Fare</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Check pricing validity and season fares by selecting dates on the interactive calendar.</p>
        </div>
        <button onClick={() => router.push("/company/dashboard")} className="form-btn-back" style={{ background: "#ffffff", color: "#0f172a" }}>
          <i className="fas fa-arrow-left"></i>
          <span>Dashboard</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: "50px", background: "#ffffff", borderRadius: "12px", textAlign: "center", color: "#64748b" }}>
          <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #d4af37", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", margin: "0 auto 12px auto" }}></div>
          <p style={{ fontWeight: "600" }}>Loading fares calendar...</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px", alignItems: "start" }} className="calendar-grid-layout">
          {/* Left: Date Selection & Custom Calendar */}
          <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Route Selector */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "8px" }}>Select Transportation Route</label>
              <select
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                style={{ width: "100%", padding: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", outline: "none", background: "#ffffff" }}
              >
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.englishName}
                  </option>
                ))}
              </select>
            </div>

            {/* Calendar Widget */}
            <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ background: "#f8fafc", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ fontWeight: "700", color: "#0f172a", fontSize: "15px" }}>
                  {currentMonth.toLocaleString("default", { month: "long" })} {currentMonth.getFullYear()}
                </span>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={prevMonth} style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <i className="fas fa-chevron-left" style={{ fontSize: "11px", color: "#64748b" }}></i>
                  </button>
                  <button onClick={nextMonth} style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <i className="fas fa-chevron-right" style={{ fontSize: "11px", color: "#64748b" }}></i>
                  </button>
                </div>
              </div>

              {/* Day Labels */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", background: "#f1f5f9", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                  <span key={d} style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>{d}</span>
                ))}
              </div>

              {/* Days Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "8px", gap: "4px" }}>
                {days.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} />;
                  const dateStr = day.toISOString().split("T")[0];
                  const selected = isDateSelected(day);
                  
                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      style={{
                        height: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: selected ? "700" : "500",
                        cursor: "pointer",
                        background: selected ? "linear-gradient(135deg, #d4af37 0%, #b48a1d 100%)" : "transparent",
                        color: selected ? "#0f172a" : "#334155",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!selected) e.currentTarget.style.background = "#f1f5f9";
                      }}
                      onMouseLeave={(e) => {
                        if (!selected) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {day.getDate()}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Indicator */}
            <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", color: "#475569", fontWeight: "500" }}>Selected Check Date:</span>
              <span style={{ fontSize: "14px", color: "#0f172a", fontWeight: "700" }}>
                {new Date(selectedDate).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Right: Fare Details Panel */}
          <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: "18px", fontWeight: "700" }}>Fares Overview</h3>
              <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px" }}>Check vehicle rates matching your parameters.</p>
            </div>

            {activePackage ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {VEHICLES.map((v) => {
                  const check = getFareStatus(v.id);
                  return (
                    <div
                      key={v.id}
                      style={{
                        padding: "16px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: check.valid ? "#ffffff" : "#fffbeb",
                        borderColor: check.valid ? "#e2e8f0" : "#fef3c7"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "35px", height: "35px", borderRadius: "50%", background: "rgba(212, 175, 55, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <i className={`fas ${v.icon}`} style={{ color: "#b48a1d" }}></i>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: "700", color: "#334155", fontSize: "14px" }}>{v.name}</span>
                          <span style={{ fontSize: "11px", color: check.valid ? "#16a34a" : "#d97706", fontWeight: "600" }}>
                            {check.text}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "18px", fontWeight: "800", color: "#16a34a" }}>
                          SR {check.price}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: "40px 10px", textAlign: "center", color: "#94a3b8" }}>
                Please select a route to inspect details.
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
        @media (max-width: 991px) {
          .calendar-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
