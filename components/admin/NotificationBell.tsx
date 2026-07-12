"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/utils/api";

interface Driver {
  id: number;
  name: string;
  phone: string;
  username: string;
}

interface Booking {
  id: number;
  booking_code: string;
  pickup: string;
  destination: string;
  date: string;
  time: string;
  full_name: string;
  car_type: string;
  whatsapp: string;
  driver_id?: number | null;
  driver?: Driver | null;
}

export default function NotificationBell() {
  const [reminders, setReminders] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [prevCount, setPrevCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load reminders and drivers
  const loadData = async (isFirstLoad = false) => {
    try {
      const remindersData = await api.getUpcomingReminders();
      if (Array.isArray(remindersData)) {
        setReminders(remindersData);
        
        // Show real-time notification alert popup if new reminders are found
        if (!isFirstLoad && remindersData.length > prevCount) {
          const newItemsCount = remindersData.length - prevCount;
          setAlertMessage(`Attention: You have ${newItemsCount} new upcoming ride booking(s) starting within 24 hours requiring a driver!`);
          
          // Auto-hide alert after 8 seconds
          setTimeout(() => {
            setAlertMessage(null);
          }, 8000);
        }
        setPrevCount(remindersData.length);
      }
    } catch (err) {
      console.warn("Error fetching reminders", err);
    }
  };

  const loadDrivers = async () => {
    try {
      const driversData = await api.getDrivers();
      if (Array.isArray(driversData)) {
        setDrivers(driversData);
      }
    } catch (err) {
      console.warn("Error fetching drivers", err);
    }
  };

  useEffect(() => {
    loadData(true);
    loadDrivers();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      loadData(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [prevCount]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setAssigningId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAssignDriver = async (bookingId: number) => {
    if (!selectedDriverId) return;
    setActionLoading(true);
    try {
      const res = await api.updateBooking(String(bookingId), {
        driver_id: parseInt(selectedDriverId),
        status: "Active Dispatch" // Automatically move to Active Dispatch once driver is assigned
      });
      if (res.success) {
        // Refresh the unassigned reminders
        const updated = reminders.filter(r => r.id !== bookingId);
        setReminders(updated);
        setPrevCount(updated.length);
        setAssigningId(null);
        setSelectedDriverId("");
        
        // Show flash success
        setAlertMessage("Driver successfully assigned to the ride!");
        setTimeout(() => setAlertMessage(null), 4000);
      } else {
        alert("Failed to assign driver.");
      }
    } catch (err) {
      console.error("Assign driver error", err);
      alert("Error occurred while assigning driver.");
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to format date nicely
  const formatDateTime = (dateStr: string, timeStr: string) => {
    try {
      const bookingDate = new Date(`${dateStr}T${timeStr}`);
      if (isNaN(bookingDate.getTime())) {
        return `${dateStr} ${timeStr}`;
      }
      
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      let dayPart = dateStr;
      if (bookingDate.toDateString() === today.toDateString()) {
        dayPart = "Today";
      } else if (bookingDate.toDateString() === tomorrow.toDateString()) {
        dayPart = "Tomorrow";
      } else {
        dayPart = bookingDate.toLocaleDateString("en-US", { day: "numeric", month: "short" });
      }

      const timePart = bookingDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
      return `${dayPart} at ${timePart}`;
    } catch (e) {
      return `${dateStr} ${timeStr}`;
    }
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      {/* Real-time Alert Toast Notification */}
      {alertMessage && (
        <div style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          backgroundColor: "#b48a1d",
          color: "#ffffff",
          padding: "16px 20px",
          borderRadius: "10px",
          boxShadow: "0 10px 30px rgba(180, 138, 29, 0.35)",
          zIndex: 999999,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          maxWidth: "400px",
          animation: "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          fontSize: "14px",
          fontWeight: 600,
          border: "1px solid rgba(255, 255, 255, 0.2)",
          backdropFilter: "blur(8px)"
        }}>
          <i className="fas fa-triangle-exclamation" style={{ fontSize: "20px", color: "#ffffff" }}></i>
          <div style={{ flex: 1 }}>{alertMessage}</div>
          <button 
            onClick={() => setAlertMessage(null)}
            style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer", opacity: 0.8, padding: 0 }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "none",
          border: "none",
          color: "#334155",
          cursor: "pointer",
          position: "relative",
          padding: "8px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background-color 0.2s",
          width: "40px",
          height: "40px"
        }}
        className="hover:bg-slate-100"
        title="Ride Assignment Reminders"
      >
        <i className="fas fa-bell" style={{ fontSize: "20px", color: reminders.length > 0 ? "#b48a1d" : "#64748b" }}></i>
        
        {reminders.length > 0 && (
          <span style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            backgroundColor: "#ef4444",
            color: "#ffffff",
            borderRadius: "50%",
            width: "18px",
            height: "18px",
            fontSize: "10px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 0 2px #ffffff",
            animation: "pulse 2s infinite"
          }}>
            {reminders.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div style={{
          position: "absolute",
          top: "48px",
          right: "0",
          width: "360px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
          border: "1px solid #e2e8f0",
          zIndex: 1000,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}>
          {/* Header */}
          <div style={{
            padding: "16px",
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#1e293b" }}>Ride Notifications (24h)</h4>
              <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#64748b" }}>Rides scheduled in 24h needing a driver</p>
            </div>
            {reminders.length > 0 && (
              <span style={{
                fontSize: "11px",
                fontWeight: "bold",
                backgroundColor: "#fef3c7",
                color: "#b48a1d",
                padding: "2px 8px",
                borderRadius: "12px"
              }}>
                {reminders.length} Pending
              </span>
            )}
          </div>

          {/* List Area */}
          <div style={{ maxHeight: "380px", overflowY: "auto" }}>
            {reminders.length === 0 ? (
              <div style={{ padding: "40px 16px", textAlign: "center", color: "#64748b" }}>
                <i className="fas fa-circle-check" style={{ fontSize: "28px", color: "#10b981", marginBottom: "10px", display: "block" }}></i>
                <span style={{ fontSize: "13px", fontWeight: 500 }}>All rides have drivers assigned!</span>
              </div>
            ) : (
              reminders.map((booking) => (
                <div key={booking.id} style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid #f1f5f9",
                  transition: "background-color 0.2s"
                }} className="hover:bg-slate-50">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "#b48a1d",
                      backgroundColor: "#fffbeb",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      border: "1px solid #fde68a"
                    }}>
                      {booking.booking_code}
                    </span>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
                      <i className="far fa-clock" style={{ marginRight: "4px" }}></i>
                      {formatDateTime(booking.date, booking.time)}
                    </span>
                  </div>

                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    {booking.full_name}
                  </div>
                  
                  <div style={{ fontSize: "11px", color: "#64748b", display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                    <span><i className="fas fa-location-dot" style={{ marginRight: "4px" }}></i>{booking.pickup} → {booking.destination}</span>
                    <span><i className="fas fa-car" style={{ marginRight: "4px" }}></i>{booking.car_type}</span>
                  </div>

                  {assigningId === booking.id ? (
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <select
                        value={selectedDriverId}
                        onChange={(e) => setSelectedDriverId(e.target.value)}
                        style={{
                          flex: 1,
                          fontSize: "12px",
                          padding: "6px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          outline: "none"
                        }}
                      >
                        <option value="">Select Driver...</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.name} ({d.username})</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssignDriver(booking.id)}
                        disabled={actionLoading || !selectedDriverId}
                        style={{
                          backgroundColor: "#b48a1d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          opacity: (actionLoading || !selectedDriverId) ? 0.6 : 1
                        }}
                      >
                        {actionLoading ? "..." : "Confirm"}
                      </button>
                      <button
                        onClick={() => {
                          setAssigningId(null);
                          setSelectedDriverId("");
                        }}
                        style={{
                          backgroundColor: "#e2e8f0",
                          color: "#475569",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 8px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAssigningId(booking.id)}
                      style={{
                        width: "100%",
                        backgroundColor: "#1e293b",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        transition: "background-color 0.2s"
                      }}
                      className="hover:bg-slate-800"
                    >
                      <i className="fas fa-user-plus"></i>
                      Assign Driver
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Global CSS injected */}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }
        @keyframes slideIn {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
