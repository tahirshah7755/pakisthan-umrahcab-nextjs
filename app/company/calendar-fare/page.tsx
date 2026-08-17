"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { useRouter } from "next/navigation";
import { getSaudiTodayDate } from "@/utils/formatters";

interface PriceCell {
  price: string;
  from: string;
  to: string;
}

interface VehicleCol {
  id: string;
  name: string;
  model: string;
  icon: string;
}

interface PackageRow {
  id: string;
  englishName: string;
  urduName: string;
  prices: Record<string, PriceCell>;
}

const getVehiclePrice = (b: any, modelName: string) => {
  const defaultDates = b.sedan_dates || "2026-06-01 to 2026-10-31";
  
  if (b.custom_prices && typeof b.custom_prices === 'object') {
    const custom = b.custom_prices[modelName] || b.custom_prices[modelName.toLowerCase()];
    if (custom !== undefined && custom !== null) {
      if (typeof custom === 'object') {
        const price = custom.price !== undefined ? custom.price : 0;
        const from = custom.from || defaultDates.split(" to ")[0] || "2026-06-01";
        const to = custom.to || defaultDates.split(" to ")[1] || "2026-10-31";
        return { price: String(price), from, to };
      } else {
        const price = custom;
        const from = defaultDates.split(" to ")[0] || "2026-06-01";
        const to = defaultDates.split(" to ")[1] || "2026-10-31";
        return { price: String(price), from, to };
      }
    }
  }

  const mLower = modelName.toLowerCase();
  let price = 0;
  if (mLower.includes("gmc") || mLower.includes("yukon") || mLower.includes("suv")) {
    price = b.suv_price || 600;
  } else if (mLower.includes("staria") || mLower.includes("starex") || mLower.includes("hiace") || mLower.includes("van")) {
    price = b.van_price || 299;
  } else if (mLower.includes("coaster") || mLower.includes("bus") || mLower.includes("coach")) {
    price = b.coach_price || 549;
  } else {
    price = b.sedan_price || 249;
  }

  const parts = defaultDates.split(" to ");
  return {
    price: String(price),
    from: parts[0] || "2026-06-01",
    to: parts[1] || "2026-10-31"
  };
};

export default function CalendarFarePage() {
  const router = useRouter();
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [vehicles, setVehicles] = useState<VehicleCol[]>([]);
  const [loading, setLoading] = useState(true);

  // Selector state
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    return getSaudiTodayDate();
  });

  // Calendar render helper
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const loadFares = async () => {
      try {
        setLoading(true);
        const [fleetRes, priceListData] = await Promise.all([
          api.getFleet(),
          api.getPriceList()
        ]);

        let resolvedVehicles: VehicleCol[] = [];
        const rawFleet = Array.isArray(fleetRes) ? fleetRes : (fleetRes?.data && Array.isArray(fleetRes.data) ? fleetRes.data : []);

        if (rawFleet.length > 0) {
          resolvedVehicles = rawFleet.map((f: any) => {
            const m = f.model || f.name || "Vehicle";
            const mL = m.toLowerCase();
            let icon = "fa-car";
            if (mL.includes("gmc") || mL.includes("yukon")) icon = "fa-truck-pickup";
            else if (mL.includes("coaster") || mL.includes("bus")) icon = "fa-bus";
            else if (mL.includes("staria") || mL.includes("hiace") || mL.includes("starex")) icon = "fa-van-shuttle";

            return {
              id: mL.replace(/[^a-z0-9]/g, "_"),
              name: m,
              model: m,
              icon
            };
          });
        } else {
          resolvedVehicles = [
            { id: "gmc", name: "GMC", model: "GMC", icon: "fa-truck-pickup" },
            { id: "staria", name: "Hyundai Staria", model: "Hyundai Staria", icon: "fa-van-shuttle" },
            { id: "hiace", name: "Toyota Hiace", model: "Toyota Hiace", icon: "fa-van-shuttle" },
            { id: "coaster", name: "Toyota Coaster", model: "Toyota Coaster", icon: "fa-bus" },
            { id: "camry", name: "Toyota Camry", model: "Toyota Camry", icon: "fa-car" },
          ];
        }
        setVehicles(resolvedVehicles);

        if (priceListData && Array.isArray(priceListData)) {
          const mapped = priceListData.map((b: any) => {
            const pricesMap: Record<string, PriceCell> = {};
            resolvedVehicles.forEach((v) => {
              pricesMap[v.id] = getVehiclePrice(b, v.model);
            });

            return {
              id: String(b.id),
              englishName: b.route,
              urduName: b.route.includes("Airport") ? "ایئرپورٹ ٹرانسپورٹ" : "ہوٹل ٹرانسپورٹ",
              prices: pricesMap
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
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= numDays; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const calendarDays = getDaysInMonth(currentMonth);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isSelected = (day: Date | null) => {
    if (!day) return false;
    const dateStr = day.toISOString().split("T")[0];
    return dateStr === selectedDate;
  };

  const getFareStatus = (vehicleId: string) => {
    if (!activePackage) return { valid: false, text: "No Route Selected", price: "N/A" };
    const pInfo = activePackage.prices[vehicleId];
    if (!pInfo || pInfo.price === "N/A") return { valid: false, text: "Rate Unavailable", price: "N/A" };

    const sel = new Date(selectedDate);
    const from = new Date(pInfo.from);
    const to = new Date(pInfo.to);
    
    // Normalize date strings
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    sel.setHours(12, 0, 0, 0);

    const isValid = sel >= from && sel <= to;
    return {
      valid: isValid,
      text: isValid ? "Standard Season Pricing" : `Out of Season Range (${pInfo.from} to ${pInfo.to})`,
      price: pInfo.price
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

      {/* Main Content Layout */}
      {loading ? (
        <div style={{ background: "#ffffff", padding: "50px", borderRadius: "12px", textAlign: "center", color: "#64748b" }}>
          <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #d4af37", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", margin: "0 auto 12px auto" }}></div>
          <p style={{ fontWeight: "600" }}>Loading calendar fares...</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="responsive-calendar-grid">
          {/* Left: Route Selector & Interactive Calendar */}
          <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Route Selector Dropdown */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "8px" }}>Select Transportation Route</label>
              <select
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "600", outline: "none", background: "#f8fafc", color: "#0f172a" }}
              >
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.englishName}
                  </option>
                ))}
              </select>
            </div>

            {/* Calendar Controls */}
            <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ fontWeight: "700", fontSize: "16px", color: "#0f172a" }}>
                  {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={prevMonth} style={{ padding: "6px 12px", border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "6px", cursor: "pointer" }}>&lt;</button>
                  <button onClick={nextMonth} style={{ padding: "6px 12px", border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "6px", cursor: "pointer" }}>&gt;</button>
                </div>
              </div>

              {/* Day Headers */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontWeight: "600", fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
                <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
              </div>

              {/* Days Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                {calendarDays.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} style={{ height: "40px" }}></div>;
                  const active = isSelected(day);
                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day.toISOString().split("T")[0])}
                      style={{
                        height: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: active ? "700" : "500",
                        cursor: "pointer",
                        background: active ? "#d4af37" : "#ffffff",
                        color: active ? "#ffffff" : "#1e293b",
                        border: active ? "none" : "1px solid #f1f5f9"
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
                {vehicles.map((v) => {
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
              <div style={{ textAlign: "center", color: "#94a3b8", padding: "40px 0" }}>
                Please select a route to view fares.
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .responsive-calendar-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
}
