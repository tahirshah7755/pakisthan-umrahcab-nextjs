"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/utils/api";
import CustomerSearchDropdown from "@/components/admin/CustomerSearchDropdown";

interface FlightDetail {
  id: string;
  custom_id: string;
  flight_no: string;
  leg: "Arrival" | "Departure" | "Both Legs";
  route: string;
  date: string;
  time: string;
  status: string;
  customer_id: number;
  customer?: {
    id: number;
    custom_id: string;
    name: string;
    company: string;
    contact: string;
  };
}

function EditFlightContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryId = searchParams.get("id");

  const [fltSelected, setFltSelected] = useState<FlightDetail | null>(null);
  const [singleFltLoading, setSingleFltLoading] = useState(true);
  const [singleFltError, setSingleFltError] = useState("");

  const [editFltNo, setEditFltNo] = useState("");
  const [editFltDate, setEditFltDate] = useState("");
  const [editFltTime, setEditFltTime] = useState("");
  const [editFltLeg, setEditFltLeg] = useState<"Arrival" | "Departure" | "Both Legs">("Arrival");
  const [editFltRoute, setEditFltRoute] = useState("");
  const [editFltStatus, setEditFltStatus] = useState("On Time");
  const [fltSelectedCustomerObj, setFltSelectedCustomerObj] = useState<any | null>(null);

  // Toast notifications
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
    if (!queryId) {
      setSingleFltError("No Flight ID provided.");
      setSingleFltLoading(false);
      return;
    }

    const fetchSingleFlight = async () => {
      try {
        setSingleFltLoading(true);
        setSingleFltError("");
        const res = await api.getFlight(queryId);
        if (res && res.flight) {
          const f = res.flight;
          setFltSelected(f);
          setEditFltNo(f.flight_no || "");
          setEditFltDate(f.date || "");
          setEditFltTime(f.time ? f.time.substring(0, 5) : "");
          setEditFltLeg(f.leg || "Arrival");
          setEditFltRoute(f.route || "");
          setEditFltStatus(f.status || "On Time");
          setFltSelectedCustomerObj(f.customer || null);
        } else {
          setSingleFltError("Failed to load flight details.");
        }
      } catch (err: any) {
        console.error("Failed to load flight details:", err);
        setSingleFltError(err.message || "An error occurred while loading flight details.");
      } finally {
        setSingleFltLoading(false);
      }
    };

    fetchSingleFlight();
  }, [queryId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFltNo || !editFltDate || !editFltTime || !editFltRoute || !fltSelectedCustomerObj || !fltSelected) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    try {
      const payload = {
        customer_id: fltSelectedCustomerObj.id,
        flight_no: editFltNo,
        leg: editFltLeg,
        date: editFltDate,
        time: editFltTime,
        route: editFltRoute,
        status: editFltStatus
      };
      const res = await api.updateFlight(fltSelected.id, payload);
      if (res.success) {
        showToast("Flight updated successfully!", "success");
        setTimeout(() => {
          router.push(`/admin/flights/view?id=${fltSelected.id}`);
        }, 1000);
      } else {
        showToast("Failed to update flight record", "error");
      }
    } catch (err: any) {
      console.error("Failed updating flight:", err);
      showToast(err.message || "An error occurred while saving flight details", "error");
    }
  };

  if (singleFltLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="form-header-card" style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" }}>
          <div>
            <h2>Edit Flight Record</h2>
            <p>Modify tracking and schedule details for the flight record.</p>
          </div>
          <button onClick={() => router.push("/admin/flights")} className="form-btn-back">
            <i className="fas fa-arrow-left"></i>
            <span>Back to Flights Registry</span>
          </button>
        </div>
        <div className="form-card" style={{ textAlign: "center", padding: "40px", color: "#64748b", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: "40px", color: "#4f46e5", marginBottom: "15px" }}></i>
          <h3>Loading Flight Record Details...</h3>
        </div>
      </div>
    );
  }

  if (singleFltError || !fltSelected) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="form-header-card" style={{ background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)" }}>
          <div>
            <h2>Edit Flight Record Error</h2>
            <p>{singleFltError || "Flight record could not be found."}</p>
          </div>
          <button onClick={() => router.push("/admin/flights")} className="form-btn-back">
            <i className="fas fa-arrow-left"></i>
            <span>Back to Flights Registry</span>
          </button>
        </div>
        <div className="form-card" style={{ textAlign: "center", padding: "40px", color: "#64748b", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <i className="fas fa-circle-exclamation" style={{ fontSize: "48px", color: "#ef4444", marginBottom: "15px" }}></i>
          <h3>Unable to retrieve flight details</h3>
          <p>{singleFltError || "The record may have been deleted, or there was a communication issue with the server."}</p>
          <button onClick={() => router.push("/admin/flights")} className="btn-submit" style={{ marginTop: "15px", background: "#ef4444" }}>
            Return to Registry
          </button>
        </div>
      </div>
    );
  }

  const SKY_BLUE = "#4f46e5";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Toast Alert */}
      {toast.show && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 9999,
          background: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "#ffffff",
          padding: "12px 24px",
          borderRadius: "8px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          fontWeight: "600",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          animation: "slideIn 0.3s ease-out"
        }}>
          <i className={toast.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"}></i>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>Edit Flight Record: {fltSelected.custom_id || `#FLT-${fltSelected.id}`}</h2>
          <p>Update tracking, routing, and status information for this flight schedule.</p>
        </div>
        <button onClick={() => router.push(`/admin/flights/view?id=${fltSelected.id}`)} className="form-btn-back">
          <i className="fas fa-arrow-left"></i>
          <span>Back to Details</span>
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", width: "100%", padding: "10px 0" }}>
        <div className="form-card" style={{ maxWidth: "650px", width: "100%", background: "#ffffff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", padding: "30px", border: "1px solid #e2e8f0" }}>
          <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Search Customer Dropdown Component */}
            <CustomerSearchDropdown
              selectedCustomer={fltSelectedCustomerObj}
              onSelectCustomer={setFltSelectedCustomerObj}
              themeColor={SKY_BLUE}
            />

            {/* Leg Selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label className="form-label" style={{ fontWeight: "600", fontSize: "14px", color: "#475569" }}>Leg Type <span style={{ color: "#ef4444" }}>*</span></label>
              <div style={{ display: "flex", gap: "10px" }}>
                {["Arrival", "Departure"].map((legType) => (
                  <button
                    key={legType}
                    type="button"
                    onClick={() => setEditFltLeg(legType as any)}
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      borderRadius: "8px",
                      fontWeight: "600",
                      fontSize: "13px",
                      cursor: "pointer",
                      border: editFltLeg === legType ? "none" : "1px solid #cbd5e1",
                      background: editFltLeg === legType ? SKY_BLUE : "#ffffff",
                      color: editFltLeg === legType ? "#ffffff" : "#64748b",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {legType === "Arrival" && <i className="fas fa-plane-arrival" style={{ marginRight: "6px" }}></i>}
                    {legType === "Departure" && <i className="fas fa-plane-departure" style={{ marginRight: "6px" }}></i>}
                    {legType}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <label className="form-label" style={{ fontWeight: "600", fontSize: "14px", color: "#475569" }}>Flight Number <span style={{ color: "#ef4444" }}>*</span></label>
                <div className="form-input-wrapper">
                  <i className="fas fa-plane form-icon" style={{ color: "#94a3b8" }}></i>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editFltNo} 
                    onChange={(e) => setEditFltNo(e.target.value)} 
                    placeholder="e.g. SV-320" 
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: "600", fontSize: "14px", color: "#475569" }}>Flight Status <span style={{ color: "#ef4444" }}>*</span></label>
                <div className="form-input-wrapper">
                  <i className="fas fa-info-circle form-icon" style={{ color: "#94a3b8" }}></i>
                  <select 
                    className="form-input form-select" 
                    value={editFltStatus} 
                    onChange={(e) => setEditFltStatus(e.target.value)}
                  >
                    <option value="On Time">On Time</option>
                    <option value="Delay">Delay</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Landed">Landed</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: "600", fontSize: "14px", color: "#475569" }}>Date <span style={{ color: "#ef4444" }}>*</span></label>
                <div className="form-input-wrapper">
                  <i className="fas fa-calendar-alt form-icon" style={{ color: "#94a3b8" }}></i>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={editFltDate} 
                    onChange={(e) => setEditFltDate(e.target.value)} 
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: "600", fontSize: "14px", color: "#475569" }}>Time <span style={{ color: "#ef4444" }}>*</span></label>
                <div className="form-input-wrapper">
                  <i className="fas fa-clock form-icon" style={{ color: "#94a3b8" }}></i>
                  <input 
                    type="time" 
                    className="form-input" 
                    value={editFltTime} 
                    onChange={(e) => setEditFltTime(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: "600", fontSize: "14px", color: "#475569" }}>Airport / Route Mapping <span style={{ color: "#ef4444" }}>*</span></label>
              <div className="form-input-wrapper">
                <i className="fas fa-map-marker-alt form-icon" style={{ color: "#94a3b8" }}></i>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editFltRoute} 
                  onChange={(e) => setEditFltRoute(e.target.value)} 
                  placeholder="e.g. Jeddah Airport (JED) to Makkah" 
                />
              </div>
            </div>

            {/* Form Actions */}
            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button
                type="button"
                onClick={() => router.push(`/admin/flights/view?id=${fltSelected.id}`)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "8px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  textAlign: "center"
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  flex: 2,
                  padding: "12px",
                  borderRadius: "8px",
                  background: SKY_BLUE,
                  color: "#ffffff",
                  border: "none",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)"
                }}
              >
                <i className="fas fa-save"></i>
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function EditFlightPage() {
  return (
    <Suspense fallback={<div>Loading flight editing layout...</div>}>
      <EditFlightContent />
    </Suspense>
  );
}
