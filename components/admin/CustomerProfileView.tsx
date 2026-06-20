"use client";

import React, { useState } from "react";
import { CustomerItem } from "./CustomerDirectory";

interface CustomerProfileViewProps {
  currentProfile: {
    id: string;
    name: string;
    email: string;
    company: string;
    phones: string[];
    passportNo?: string;
    hotelInfo?: string;
    externalRemarks?: string;
    internalRemarks?: string;
    meta: {
      registeredBy: string;
      registeredDate: string;
      lastEditedBy: string;
      lastEditedDate: string;
    };
  };
  stats: {
    bookings: number;
    flights: number;
    trains: number;
    services: number;
  };
  activeProfileTab: string;
  setActiveProfileTab: (tab: string) => void;
  custBookings: any[];
  custServices: any[];
  custFlights: any[];
  custTrains: any[];
  customers: CustomerItem[];
  setEditingCustomer: (c: CustomerItem) => void;
  router: any;
  showToast: (msg: string, type: "success" | "error") => void;
  triggerExportAlert: (fmt: string) => void;
}

export const CustomerProfileView: React.FC<CustomerProfileViewProps> = ({
  currentProfile,
  stats,
  activeProfileTab,
  setActiveProfileTab,
  custBookings,
  custServices,
  custFlights,
  custTrains,
  customers,
  setEditingCustomer,
  router,
  showToast,
  triggerExportAlert,
}) => {
  const [selectedProfileBooking, setSelectedProfileBooking] = useState<any>(null);
  const [selectedProfileFlight, setSelectedProfileFlight] = useState<any>(null);
  const [selectedProfileTrain, setSelectedProfileTrain] = useState<any>(null);

  const handleActionClick = (actionName: string) => {
    showToast(`Triggered simulated customer action: ${actionName}`, "success");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
      
      {/* Header Panel Card (Teal/Emerald Green Gradient) */}
      <div 
        style={{ 
          background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)", 
          borderRadius: "16px", 
          padding: "24px 30px",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          boxShadow: "0 10px 25px -5px rgba(15, 118, 110, 0.3)"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span 
              style={{ 
                background: "rgba(255, 255, 255, 0.2)", 
                color: "#ffffff", 
                padding: "4px 10px", 
                borderRadius: "6px", 
                fontSize: "11px", 
                fontWeight: "800",
                letterSpacing: "0.5px"
              }}
            >
              Customer Record
            </span>
            <span 
              style={{ 
                background: "rgba(15, 23, 42, 0.6)", 
                color: "#ffffff", 
                padding: "4px 10px", 
                borderRadius: "6px", 
                fontSize: "11px", 
                fontWeight: "700" 
              }}
            >
              ID: {currentProfile.id}
            </span>
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: "800", margin: 0, textShadow: "0 2px 4px rgba(0,0,0,0.15)" }}>
            {currentProfile.name}
          </h2>
          <p style={{ margin: 0, fontSize: "14px", color: "rgba(255, 255, 255, 0.8)", fontWeight: "500" }}>
            {currentProfile.email}
          </p>
        </div>
        
        {/* Header Action Buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => router.push("/admin/customers")}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              borderRadius: "8px",
              padding: "10px 18px",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s"
            }}
          >
            <i className="fas fa-list"></i>
            <span>List</span>
          </button>
          <button
            onClick={() => {
              const rawId = currentProfile.id.replace("#CST-", "").replace("#Cst-", "");
              router.push(`/admin/customers/edit?id=${rawId}`);
            }}
            style={{
              background: "#ffffff",
              color: "#0f766e",
              border: "none",
              borderRadius: "8px",
              padding: "10px 18px",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.08)",
              transition: "all 0.2s"
            }}
          >
            <i className="fas fa-pencil"></i>
            <span>Edit</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div 
        style={{ 
          display: "flex", 
          gap: "8px", 
          borderBottom: "2px solid #e2e8f0", 
          paddingBottom: "10px", 
          flexWrap: "wrap" 
        }}
      >
        {[
          { id: "overview", label: "Overview", badge: null },
          { id: "bookings", label: "Bookings", badge: stats.bookings },
          { id: "flights", label: "Flights", badge: stats.flights },
          { id: "trains", label: "Trains", badge: stats.trains },
          { id: "services", label: "Services", badge: stats.services }
        ].map((tab) => {
          const isSelected = activeProfileTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveProfileTab(tab.id);
                showToast(`Loaded tab: ${tab.label}`, "success");
              }}
              style={{
                background: isSelected ? "#3b82f6" : "#ffffff",
                color: isSelected ? "#ffffff" : "#475569",
                border: `1px solid ${isSelected ? "#2563eb" : "#cbd5e1"}`,
                borderRadius: "8px",
                padding: "8px 18px",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: isSelected ? "0 4px 10px rgba(59, 130, 246, 0.25)" : "none",
                transition: "all 0.15s"
              }}
            >
              <span>{tab.label}</span>
              {tab.badge !== null && (
                <span 
                  style={{ 
                    background: isSelected ? "rgba(255,255,255,0.25)" : "#f1f5f9", 
                    color: isSelected ? "#ffffff" : "#475569", 
                    borderRadius: "10px", 
                    padding: "2px 6px", 
                    fontSize: "11px", 
                    fontWeight: "800" 
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* MAIN TAB PANELS */}
      {activeProfileTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "25px", alignItems: "start" }}>
          
          {/* Left Column: Customer Details Card */}
          <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            
            {/* Profile Card */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "20px" }}>
                <div 
                  style={{ 
                    width: "80px", 
                    height: "80px", 
                    borderRadius: "16px", 
                    background: "#3b82f6", 
                    color: "#ffffff", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    fontSize: "36px",
                    boxShadow: "0 8px 16px rgba(59, 130, 246, 0.2)" 
                  }}
                >
                  <i className="fas fa-user"></i>
                </div>
                <h3 style={{ margin: "10px 0 0 0", fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
                  {currentProfile.name}
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                  Joined: 22 May, 2026 08:32 PM
                </span>
              </div>

              {/* Contact listings */}
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.5px" }}>Primary Phone</span>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                      <i className="fas fa-phone" style={{ color: "#0f766e", marginRight: "8px" }}></i>
                      {currentProfile.phones[0]}
                    </span>
                    <button onClick={() => { navigator.clipboard.writeText(currentProfile.phones[0]); showToast("Copied phone!", "success"); }} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer" }}>
                      <i className="fas fa-copy"></i>
                    </button>
                  </div>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.5px" }}>Secondary Phone</span>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                      <i className="fas fa-phone-volume" style={{ color: "#3b82f6", marginRight: "8px" }}></i>
                      {currentProfile.phones[1]}
                    </span>
                    <button onClick={() => { navigator.clipboard.writeText(currentProfile.phones[1]); showToast("Copied phone!", "success"); }} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer" }}>
                      <i className="fas fa-copy"></i>
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.5px" }}>Alternative Phone</span>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                      <i className="fas fa-phone-flip" style={{ color: "#8b5cf6", marginRight: "8px" }}></i>
                      {currentProfile.phones[2]}
                    </span>
                    <button onClick={() => { navigator.clipboard.writeText(currentProfile.phones[2]); showToast("Copied phone!", "success"); }} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer" }}>
                      <i className="fas fa-copy"></i>
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px", borderTop: "1px solid #f1f5f9", paddingTop: "15px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.5px" }}>Email Address</span>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                    <i className="fas fa-envelope" style={{ color: "#ef4444", marginRight: "8px" }}></i>
                    {currentProfile.email === "No email provided" ? "N/A" : currentProfile.email}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.5px" }}>Linked Company</span>
                  <a onClick={() => router.push("/admin/companies")} style={{ fontSize: "14px", fontWeight: "700", color: "#2563eb", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                    <i className="fas fa-building" style={{ fontSize: "12px" }}></i>
                    {currentProfile.company}
                  </a>
                </div>

                {currentProfile.passportNo && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", borderTop: "1px solid #f1f5f9", paddingTop: "15px" }}>
                    <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.5px" }}>Passport Number</span>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                      <i className="fas fa-passport" style={{ color: "#eab308", marginRight: "8px" }}></i>
                      {currentProfile.passportNo}
                    </span>
                  </div>
                )}

                {currentProfile.hotelInfo && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.5px" }}>Hotel / Stay Info</span>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>
                      <i className="fas fa-hotel" style={{ color: "#3b82f6", marginRight: "8px" }}></i>
                      {currentProfile.hotelInfo}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* System Audit */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <h4 style={{ fontSize: "12px", textTransform: "uppercase", color: "#475569", fontWeight: "700", letterSpacing: "0.5px", margin: 0, paddingBottom: "8px", borderBottom: "1px solid #f1f5f9" }}>
                <i className="fas fa-shield-halved" style={{ marginRight: "6px" }}></i> System Audit
              </h4>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                <span style={{ fontWeight: "600", display: "block" }}>REGISTERED BY:</span>
                <span style={{ fontWeight: "700", color: "#1e293b" }}>
                  <i className="fas fa-user-circle" style={{ marginRight: "4px" }}></i> {currentProfile.meta.registeredBy}
                </span>
                <span style={{ display: "block", fontSize: "11px", color: "#94a3b8" }}>{currentProfile.meta.registeredDate}</span>
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", borderTop: "1px solid #f8fafc", paddingTop: "8px" }}>
                <span style={{ fontWeight: "600", display: "block" }}>LAST PROFILE UPDATE:</span>
                <span style={{ fontWeight: "700", color: "#1e293b" }}>
                  <i className="fas fa-user-pen" style={{ marginRight: "4px" }}></i> {currentProfile.meta.lastEditedBy}
                </span>
                <span style={{ display: "block", fontSize: "11px", color: "#94a3b8" }}>{currentProfile.meta.lastEditedDate}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Activity stats & Remarks Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            
            {/* Activity Summary Stats */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fas fa-chart-pie" style={{ color: "#3b82f6" }}></i> Activity Summary
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "15px" }}>
                {[
                  { label: "Total Bookings", val: stats.bookings, bg: "#eff6ff", text: "#1e40af", icon: "fa-calendar-days" },
                  { label: "Total Flights", val: stats.flights, bg: "#ecfeff", text: "#0891b2", icon: "fa-plane" },
                  { label: "Total Trains", val: stats.trains, bg: "#faf5ff", text: "#6b21a8", icon: "fa-train" },
                  { label: "Total Services", val: stats.services, bg: "#f0fdf4", text: "#166534", icon: "fa-bell" }
                ].map((stat, idx) => (
                  <div key={idx} style={{ background: stat.bg, borderRadius: "12px", padding: "15px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                    <i className={`fas ${stat.icon}`} style={{ color: stat.text, fontSize: "18px" }}></i>
                    <span style={{ fontSize: "22px", fontWeight: "800", color: stat.text }}>{stat.val}</span>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>{stat.label}</span>
                  </div>
                ))}
              </div>

              {/* Status Trackers (Linear indicators) */}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "15px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px" }}>
                {[
                  { label: "Pending", count: custBookings.filter(b => (b.status || "").toLowerCase() === "pending").length, color: "#d97706", bg: "#f59e0b" },
                  { label: "Confirmed", count: custBookings.filter(b => (b.status || "").toLowerCase() === "confirmed").length, color: "#2563eb", bg: "#3b82f6" },
                  { label: "Completed", count: custBookings.filter(b => (b.status || "").toLowerCase() === "completed").length, color: "#16a34a", bg: "#22c55e" },
                  { label: "Cancelled", count: custBookings.filter(b => (b.status || "").toLowerCase() === "cancelled").length, color: "#dc2626", bg: "#ef4444" }
                ].map((tracker, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "4px", height: "30px", background: tracker.bg, borderRadius: "2px" }}></div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>{tracker.label}</span>
                      <span style={{ fontSize: "13px", fontWeight: "800", color: tracker.color }}>{tracker.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Remarks Card */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fas fa-comment-dots" style={{ color: "#8b5cf6" }}></i> Account Remarks
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#94a3b8", display: "block", marginBottom: "6px" }}>External Notes</span>
                  <div style={{ background: "#f8fafc", padding: "12px 15px", borderRadius: "8px", border: "1px solid #f1f5f9", minHeight: "60px", fontSize: "13px", color: "#64748b" }}>
                    {currentProfile.externalRemarks || "No external notes linked."}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#ef4444", display: "block", marginBottom: "6px" }}>Internal Notes (Admin Only)</span>
                  <div style={{ background: "#fef2f2", padding: "12px 15px", borderRadius: "8px", border: "1px solid #fee2e2", minHeight: "60px", fontSize: "13px", color: "#b91c1c", fontWeight: "500" }}>
                    {currentProfile.internalRemarks || "No internal notes linked."}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* LISTS VIEW BY TAB */}
      {activeProfileTab !== "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          
          {/* Main List Table Widescreen Card */}
          <div className="table-card" style={{ padding: "20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", marginTop: 0, marginBottom: "15px", textTransform: "capitalize" }}>
              Registered {activeProfileTab} Details for {currentProfile.name}
            </h3>
            
            <div className="table-responsive">
              
              {activeProfileTab === "bookings" && (() => {
                const profileBookings = custBookings;
                return (
                  <table className="db-table" style={{ width: "100%" }}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Date & Time</th>
                        <th>Route</th>
                        <th>Vehicle</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profileBookings.length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>No bookings found for this customer.</td></tr>
                      ) : profileBookings.map((b: any) => (
                        <tr key={b.id}>
                          <td style={{ fontWeight: 700, color: "var(--primary-color)" }}>{b.id}</td>
                          <td>{b.date} {b.time}</td>
                          <td style={{ fontWeight: 600 }}>{b.details}</td>
                          <td><span className="status-pill active" style={{ background: "#ecfeff", color: "#0891b2" }}>{b.vehicle}</span></td>
                          <td>
                            <span className={`status-pill ${b.status === "Confirmed" || b.status === "confirmed" ? "completed" : "pending"}`}>
                              {(b.status || "PENDING").toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => setSelectedProfileBooking({
                                id: b.id,
                                customerName: currentProfile.name,
                                pickupDate: b.date,
                                pickupTime: b.time,
                                pickupLocation: b.details.split(" → ")[0] || "N/A",
                                dropoffLocation: b.details.split(" → ")[1] || "N/A",
                                vehicle: b.vehicle,
                                finalPrice: 0,
                                status: b.status || "Pending"
                              })}
                              style={{ background: "#f1f5f9", border: "none", borderRadius: "6px", width: "30px", height: "30px", color: "#2563eb", cursor: "pointer" }}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}

              {activeProfileTab === "flights" && (
                <table className="db-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Flight ID</th>
                      <th>Type</th>
                      <th>Flight #</th>
                      <th>Route</th>
                      <th>Date & Time</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {custFlights.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>No flights found for this customer.</td></tr>
                    ) : custFlights.map((f: any) => (
                      <tr key={f.id}>
                        <td style={{ fontWeight: 700 }}>{f.id}</td>
                        <td><span className="status-pill active" style={{ background: "#eff6ff", color: "#1e40af" }}>{f.leg}</span></td>
                        <td style={{ fontWeight: 700 }}>{f.flightNo}</td>
                        <td style={{ fontWeight: 600 }}>{f.route}</td>
                        <td>{f.date} | {f.time}</td>
                        <td>
                          <span className={`status-pill ${f.status === "On Time" || f.status === "on time" ? "completed" : "pending"}`}>
                            {(f.status || "SCHEDULED").toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => setSelectedProfileFlight({
                              id: f.id,
                              type: f.leg,
                              flightNo: f.flightNo,
                              airline: "N/A",
                              sector: f.route,
                              dateTime: `${f.date} | ${f.time}`,
                              status: f.status
                            })}
                            style={{ background: "#f1f5f9", border: "none", borderRadius: "6px", width: "30px", height: "30px", color: "#3b82f6", cursor: "pointer" }}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeProfileTab === "trains" && (
                <table className="db-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Train ID</th>
                      <th>Date & Time</th>
                      <th>Route</th>
                      <th>Train # / Leg</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {custTrains.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>No trains found for this customer.</td></tr>
                    ) : custTrains.map((t: any) => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 700 }}>{t.id}</td>
                        <td>{t.dateTime}</td>
                        <td style={{ fontWeight: 600 }}>{t.route}</td>
                        <td>{t.allocation}</td>
                        <td>
                          <span className={`status-pill ${t.status === "Confirmed" || t.status === "confirmed" ? "completed" : "pending"}`}>
                            {(t.status || "SCHEDULED").toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => setSelectedProfileTrain({
                              id: t.id,
                              dateTime: t.dateTime,
                              route: t.route,
                              allocation: t.allocation,
                              classType: t.classType || "Standard",
                              pricing: t.pricing || "SAR 0.00",
                              status: t.status
                            })}
                            style={{ background: "#f1f5f9", border: "none", borderRadius: "6px", width: "30px", height: "30px", color: "#8b5cf6", cursor: "pointer" }}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeProfileTab === "services" && (() => {
                const profileServices = custServices;
                return (
                  <table className="db-table" style={{ width: "100%" }}>
                    <thead>
                      <tr>
                        <th>Service ID</th>
                        <th>Service Date</th>
                        <th>Service Name</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profileServices.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>No services found for this customer.</td></tr>
                      ) : profileServices.map((s: any) => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 700 }}>{s.id}</td>
                          <td>{s.date}</td>
                          <td style={{ fontWeight: 600 }}>{s.details}</td>
                          <td>
                            <span className={`status-pill ${s.status === "Active" || s.status === "active" ? "completed" : "pending"}`}>
                              {(s.status || "PENDING").toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => router.push(`/admin/services/view?id=${s.id}`)}
                              style={{ background: "#e0f2fe", border: "none", borderRadius: "6px", width: "30px", height: "30px", color: "#0284c7", cursor: "pointer" }}
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}

            </div>
          </div>

          {/* Bottom Quick Action Panel */}
          <div 
            style={{ 
              display: "flex", 
              gap: "10px", 
              background: "#ffffff", 
              border: "1px solid #e2e8f0", 
              borderRadius: "16px", 
              padding: "15px 20px", 
              flexWrap: "wrap",
              justifyContent: "space-between",
              boxShadow: "0 4px 10px rgba(0,0,0,0.02)"
            }}
          >
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button onClick={() => handleActionClick("Welcome Message")} style={{ background: "#22c55e", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 15px", fontWeight: "700", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                <i className="fab fa-whatsapp"></i> Welcome Message
              </button>
              <button onClick={() => router.push("/admin/bookings/add")} style={{ background: "#3b82f6", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 15px", fontWeight: "700", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                <i className="fas fa-calendar-plus"></i> Add Booking
              </button>
              <button onClick={() => router.push("/admin/flights/add")} style={{ background: "#0ea5e9", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 15px", fontWeight: "700", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                <i className="fas fa-plane"></i> Add Flight
              </button>
              <button onClick={() => router.push("/admin/trains/add")} style={{ background: "#a855f7", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 15px", fontWeight: "700", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                <i className="fas fa-train"></i> Add Train
              </button>
              <button onClick={() => router.push("/admin/services/add")} style={{ background: "#8b5cf6", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 15px", fontWeight: "700", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                <i className="fas fa-bell"></i> Add Service
              </button>
            </div>
            
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button onClick={() => handleActionClick("Print Detail")} style={{ background: "#475569", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 15px", fontWeight: "700", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                <i className="fas fa-print"></i> Print Detail
              </button>
              <button onClick={() => handleActionClick("Print with Price")} style={{ background: "#f97316", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 15px", fontWeight: "700", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                <i className="fas fa-print"></i> Print with Price
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Global Audit Trail for Customer View */}
      <div className="table-card" style={{ padding: "20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#1e293b", margin: "0 0 15px 0", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
          <i className="fas fa-history" style={{ color: "#64748b", marginRight: "6px" }}></i> Audit Trail & Activity History
        </h3>
        <div className="table-responsive">
          <table className="db-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700" }}>Datetime</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700" }}>Action By</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700" }}>Remark</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>22 May, 2026 09:59 PM</td>
                <td style={{ fontWeight: 600 }}>umrahcab</td>
                <td style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span>Updated customer profile #CST-1: Abu Bakar</span>
                  <span onClick={() => showToast("Loading detailed audit log changeset...", "success")} style={{ color: "#2563eb", cursor: "pointer", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <i className="fas fa-circle-info"></i> View Detailed Changes
                  </span>
                </td>
              </tr>
              <tr>
                <td>22 May, 2026 08:32 PM</td>
                <td style={{ fontWeight: 600 }}>umrahcab</td>
                <td>Added new customer #CST-1: Amjad (123456789)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* View Haramain Booking Details Modal */}
      {selectedProfileBooking && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "550px", margin: "20px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "15px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--primary-color)", margin: 0 }}><i className="fas fa-file-invoice"></i> Haramain Booking Details ({selectedProfileBooking.id})</h3>
              <button onClick={() => setSelectedProfileBooking(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>&times;</button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Customer Name</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileBooking.customerName}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Car/Vehicle Model</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileBooking.vehicle}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Pickup Date</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileBooking.pickupDate}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Pickup Time</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileBooking.pickupTime}</span>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Route Mapping</span>
                <span style={{ fontSize: "14px", fontWeight: "600" }}>{selectedProfileBooking.pickupLocation} → {selectedProfileBooking.dropoffLocation}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Billing Value</span>
                <span style={{ fontSize: "15px", fontWeight: "700", color: "#16a34a" }}>SAR {selectedProfileBooking.finalPrice.toFixed(2)}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Tracking Status</span>
                <span className={`status-pill ${selectedProfileBooking.status.toLowerCase()}`}>{selectedProfileBooking.status}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-color)", paddingTop: "15px" }}>
              <button onClick={() => setSelectedProfileBooking(null)} className="form-btn-back" style={{ background: "#f1f5f9", color: "#475569", width: "120px", justifyContent: "center" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* View Flight Details Modal */}
      {selectedProfileFlight && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "550px", margin: "20px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "15px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--primary-color)", margin: 0 }}><i className="fas fa-plane"></i> Flight Details ({selectedProfileFlight.id})</h3>
              <button onClick={() => setSelectedProfileFlight(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>&times;</button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Flight Number</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileFlight.flightNo}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Leg / Type</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileFlight.type}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Airline</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileFlight.airline}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Sector / Route</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileFlight.sector}</span>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Scheduled Date & Time</span>
                <span style={{ fontSize: "14px", fontWeight: "600" }}>{selectedProfileFlight.dateTime}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Tracking Status</span>
                <span className={`status-pill ${selectedProfileFlight.status === "ON TIME" ? "completed" : "pending"}`}>{selectedProfileFlight.status}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-color)", paddingTop: "15px" }}>
              <button onClick={() => setSelectedProfileFlight(null)} className="form-btn-back" style={{ background: "#f1f5f9", color: "#475569", width: "120px", justifyContent: "center" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* View Train Details Modal */}
      {selectedProfileTrain && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "550px", margin: "20px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "15px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--primary-color)", margin: 0 }}><i className="fas fa-train"></i> Train Ticket Details ({selectedProfileTrain.id})</h3>
              <button onClick={() => setSelectedProfileTrain(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>&times;</button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Scheduled Date & Time</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileTrain.dateTime}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Sector / Route</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileTrain.route}</span>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Train # / Car / Seats</span>
                <span style={{ fontSize: "14px", fontWeight: "600" }}>{selectedProfileTrain.allocation}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Class</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileTrain.classType}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Pricing</span>
                <span style={{ fontSize: "15px", fontWeight: "700", color: "#16a34a" }}>{selectedProfileTrain.pricing}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Status</span>
                <span className={`status-pill ${selectedProfileTrain.status === "CONFIRMED" ? "completed" : "pending"}`}>{selectedProfileTrain.status}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-color)", paddingTop: "15px" }}>
              <button onClick={() => setSelectedProfileTrain(null)} className="form-btn-back" style={{ background: "#f1f5f9", color: "#475569", width: "120px", justifyContent: "center" }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
