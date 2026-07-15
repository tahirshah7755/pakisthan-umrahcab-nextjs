"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/utils/api";
import CustomerSearchDropdown from "@/components/admin/CustomerSearchDropdown";
import { parseTimeTo12hParts, format12hPartsTo24h } from "@/utils/formatters";

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

  const [editFltLeg, setEditFltLeg] = useState<"Arrival" | "Departure" | "Both Legs">("Arrival");
  const [fltSelectedCustomerObj, setFltSelectedCustomerObj] = useState<any | null>(null);

  // Arrival states
  const [fltArrFlightNo, setFltArrFlightNo] = useState("");
  const [fltArrPlace, setFltArrPlace] = useState("");
  const [fltArrDate, setFltArrDate] = useState("");
  const [fltArrTime, setFltArrTime] = useState("");
  const [fltArrStatus, setFltArrStatus] = useState("On Time");

  // Departure states
  const [fltDepFlightNo, setFltDepFlightNo] = useState("");
  const [fltDepPlace, setFltDepPlace] = useState("");
  const [fltDepDate, setFltDepDate] = useState("");
  const [fltDepTime, setFltDepTime] = useState("");
  const [fltDepStatus, setFltDepStatus] = useState("On Time");

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
          setEditFltLeg(f.leg || "Arrival");
          setFltSelectedCustomerObj(f.customer || null);

          const timeVal = f.time ? f.time.substring(0, 5) : "";

          if (f.leg === "Arrival") {
            setFltArrFlightNo(f.flight_no || "");
            setFltArrPlace(f.route || "");
            setFltArrDate(f.date || "");
            setFltArrTime(timeVal);
            setFltArrStatus(f.status || "On Time");

            // Clear departure fields
            setFltDepFlightNo("");
            setFltDepPlace("");
            setFltDepDate("");
            setFltDepTime("");
            setFltDepStatus("On Time");
          } else if (f.leg === "Departure") {
            setFltDepFlightNo(f.flight_no || "");
            setFltDepPlace(f.route || "");
            setFltDepDate(f.date || "");
            setFltDepTime(timeVal);
            setFltDepStatus(f.status || "On Time");

            // Clear arrival fields
            setFltArrFlightNo("");
            setFltArrPlace("");
            setFltArrDate("");
            setFltArrTime("");
            setFltArrStatus("On Time");
          } else {
            // Legacy / Both Legs
            setFltArrFlightNo(f.flight_no || "");
            setFltArrPlace(f.route || "");
            setFltArrDate(f.date || "");
            setFltArrTime(timeVal);
            setFltArrStatus(f.status || "On Time");

            setFltDepFlightNo(f.flight_no || "");
            setFltDepPlace(f.route || "");
            setFltDepDate(f.date || "");
            setFltDepTime(timeVal);
            setFltDepStatus(f.status || "On Time");
          }
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
    if (!fltSelectedCustomerObj || !fltSelected) {
      showToast("Please select a customer first.", "error");
      return;
    }

    try {
      if (editFltLeg === "Arrival") {
        if (!fltArrFlightNo || !fltArrDate || !fltArrTime || !fltArrPlace) {
          showToast("Please fill in all Arrival details.", "error");
          return;
        }
        const res = await api.updateFlight(fltSelected.id, {
          customer_id: fltSelectedCustomerObj.id,
          flight_no: fltArrFlightNo,
          leg: "Arrival",
          date: fltArrDate,
          time: fltArrTime,
          route: fltArrPlace,
          status: fltArrStatus
        });
        if (!res?.success) {
          showToast(res?.error || "Failed to update flight details.", "error");
          return;
        }
      } else if (editFltLeg === "Departure") {
        if (!fltDepFlightNo || !fltDepDate || !fltDepTime || !fltDepPlace) {
          showToast("Please fill in all Departure details.", "error");
          return;
        }
        const res = await api.updateFlight(fltSelected.id, {
          customer_id: fltSelectedCustomerObj.id,
          flight_no: fltDepFlightNo,
          leg: "Departure",
          date: fltDepDate,
          time: fltDepTime,
          route: fltDepPlace,
          status: fltDepStatus
        });
        if (!res?.success) {
          showToast(res?.error || "Failed to update flight details.", "error");
          return;
        }
      } else if (editFltLeg === "Both Legs") {
        if (
          !fltArrFlightNo || !fltArrDate || !fltArrTime || !fltArrPlace ||
          !fltDepFlightNo || !fltDepDate || !fltDepTime || !fltDepPlace
        ) {
          showToast("Please fill in both Arrival and Departure details.", "error");
          return;
        }

        if (fltSelected.leg === "Departure") {
          // Update Departure leg (current flight)
          const res1 = await api.updateFlight(fltSelected.id, {
            customer_id: fltSelectedCustomerObj.id,
            flight_no: fltDepFlightNo,
            leg: "Departure",
            date: fltDepDate,
            time: fltDepTime,
            route: fltDepPlace,
            status: fltDepStatus
          });
          // Create Arrival leg (new flight)
          const res2 = await api.createFlight({
            customer_id: fltSelectedCustomerObj.id,
            flight_no: fltArrFlightNo,
            leg: "Arrival",
            date: fltArrDate,
            time: fltArrTime,
            route: fltArrPlace,
            status: fltArrStatus
          });
          if (!res1?.success || !res2?.success) {
            showToast("Failed to save some flight details.", "error");
            return;
          }
        } else {
          // Default: original was Arrival (or Both). Update Arrival leg (current flight)
          const res1 = await api.updateFlight(fltSelected.id, {
            customer_id: fltSelectedCustomerObj.id,
            flight_no: fltArrFlightNo,
            leg: "Arrival",
            date: fltArrDate,
            time: fltArrTime,
            route: fltArrPlace,
            status: fltArrStatus
          });
          // Create Departure leg (new flight)
          const res2 = await api.createFlight({
            customer_id: fltSelectedCustomerObj.id,
            flight_no: fltDepFlightNo,
            leg: "Departure",
            date: fltDepDate,
            time: fltDepTime,
            route: fltDepPlace,
            status: fltDepStatus
          });
          if (!res1?.success || !res2?.success) {
            showToast("Failed to save some flight details.", "error");
            return;
          }
        }
      }

      showToast("Flight tracking details saved!", "success");
      setTimeout(() => {
        router.push(`/admin/flights/view?id=${fltSelected.id}`);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to update flight record.", "error");
    }
  };

  const SKY_BLUE = "#0284c7";

  if (singleFltLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" }}>
          <div>
            <h2>Edit Flight Record</h2>
            <p>Modify tracking and schedule details for the flight record.</p>
          </div>
          <button onClick={() => router.push("/admin/flights")} className="form-btn-back">
            <i className="fas fa-list"></i>
            <span>Flights List</span>
          </button>
        </div>
        <div className="form-card" style={{ textAlign: "center", padding: "40px", color: "#64748b", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: "40px", color: SKY_BLUE, marginBottom: "15px" }}></i>
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
            <i className="fas fa-list"></i>
            <span>Flights List</span>
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

      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>Edit Flight Record: {fltSelected.custom_id || `#FLT-${fltSelected.id}`}</h2>
          <p>Update tracking, routing, and status information for this flight schedule.</p>
        </div>
        <button onClick={() => router.push(`/admin/flights/view?id=${fltSelected.id}`)} className="form-btn-back">
          <i className="fas fa-list"></i>
          <span>Flights List</span>
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

            {/* Display Leg Direction Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "5px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Leg Direction:</span>
              <span style={{
                background: editFltLeg === "Arrival" ? "#059669" : editFltLeg === "Departure" ? "#2563eb" : SKY_BLUE,
                color: "#ffffff",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "700"
              }}>
                <i className={editFltLeg === "Arrival" ? "fas fa-plane-arrival" : editFltLeg === "Departure" ? "fas fa-plane-departure" : "fas fa-arrows-left-right"} style={{ marginRight: "6px" }}></i>
                {editFltLeg}
              </span>
            </div>

            {/* Arrival details section */}
            {(editFltLeg === "Arrival" || editFltLeg === "Both Legs") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                  <i className="fas fa-plane-arrival" style={{ color: SKY_BLUE }}></i>
                  <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>Arrival Flight Details</span>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Flight Number <span style={{ color: "#ef4444" }}>*</span></label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-plane form-icon"></i>
                    <input type="text" className="form-input" placeholder="e.g. SV-3720" value={fltArrFlightNo} onChange={(e) => setFltArrFlightNo(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Flight Status <span style={{ color: "#ef4444" }}>*</span></label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-info-circle form-icon"></i>
                    <select 
                      className="form-input form-select" 
                      value={fltArrStatus} 
                      onChange={(e) => setFltArrStatus(e.target.value)}
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

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Arrival Airport / City <span style={{ color: "#ef4444" }}>*</span></label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-location-dot form-icon"></i>
                    <input type="text" className="form-input" placeholder="e.g. Jeddah International Airport (JED)" value={fltArrPlace} onChange={(e) => setFltArrPlace(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "15px" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Arrival Date <span style={{ color: "#ef4444" }}>*</span></label>
                    <div className="form-input-wrapper">
                      <input type="date" className="form-input" value={fltArrDate} onChange={(e) => setFltArrDate(e.target.value)} style={{ paddingLeft: "15px" }} />
                    </div>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Arrival Time <span style={{ color: "#ef4444" }}>*</span></label>
                    {(() => {
                      const { hour, minute, merid } = parseTimeTo12hParts(fltArrTime);
                      return (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <div className="form-input-wrapper" style={{ flex: 1, position: "relative" }}>
                            <i className="fas fa-clock form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                            <select
                              className="form-input form-select"
                              value={hour}
                              onChange={(e) => {
                                const h = e.target.value;
                                const newTime = format12hPartsTo24h(h, minute || "00", merid);
                                setFltArrTime(newTime);
                              }}
                              style={{ paddingLeft: "42px", width: "100%" }}
                            >
                              <option value="">Hour</option>
                              {Array.from({ length: 12 }, (_, i) => {
                                const val = String(i + 1).padStart(2, "0");
                                return <option key={val} value={val}>{val}</option>;
                              })}
                            </select>
                            <i className="fas fa-chevron-down select-arrow" style={{ right: "12px", position: "absolute", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}></i>
                          </div>
                          <div className="form-input-wrapper" style={{ flex: 1, position: "relative" }}>
                            <select
                              className="form-input form-select"
                              value={minute}
                              onChange={(e) => {
                                const m = e.target.value;
                                const newTime = format12hPartsTo24h(hour || "12", m, merid);
                                setFltArrTime(newTime);
                              }}
                              style={{ width: "100%" }}
                            >
                              <option value="">Min</option>
                              {Array.from({ length: 60 }, (_, i) => {
                                const val = String(i).padStart(2, "0");
                                return <option key={val} value={val}>{val}</option>;
                              })}
                            </select>
                            <i className="fas fa-chevron-down select-arrow" style={{ right: "12px", position: "absolute", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}></i>
                          </div>
                          <div className="form-input-wrapper" style={{ flex: 1, position: "relative" }}>
                            <select
                              className="form-input form-select"
                              value={merid}
                              onChange={(e) => {
                                const mer = e.target.value;
                                const newTime = format12hPartsTo24h(hour || "12", minute || "00", mer);
                                setFltArrTime(newTime);
                              }}
                              style={{ width: "100%" }}
                            >
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                            <i className="fas fa-chevron-down select-arrow" style={{ right: "12px", position: "absolute", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}></i>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Departure details section */}
            {(editFltLeg === "Departure" || editFltLeg === "Both Legs") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "15px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                  <i className="fas fa-plane-departure" style={{ color: SKY_BLUE }}></i>
                  <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>Departure Flight Details</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Flight Number <span style={{ color: "#ef4444" }}>*</span></label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-plane form-icon"></i>
                    <input type="text" className="form-input" placeholder="e.g. SV-3721" value={fltDepFlightNo} onChange={(e) => setFltDepFlightNo(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Flight Status <span style={{ color: "#ef4444" }}>*</span></label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-info-circle form-icon"></i>
                    <select 
                      className="form-input form-select" 
                      value={fltDepStatus} 
                      onChange={(e) => setFltDepStatus(e.target.value)}
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

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Departure Airport / City <span style={{ color: "#ef4444" }}>*</span></label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-location-dot form-icon"></i>
                    <input type="text" className="form-input" placeholder="e.g. Madinah Airport (MED)" value={fltDepPlace} onChange={(e) => setFltDepPlace(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "15px" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Departure Date <span style={{ color: "#ef4444" }}>*</span></label>
                    <div className="form-input-wrapper">
                      <input type="date" className="form-input" value={fltDepDate} onChange={(e) => setFltDepDate(e.target.value)} style={{ paddingLeft: "15px" }} />
                    </div>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Departure Time <span style={{ color: "#ef4444" }}>*</span></label>
                    {(() => {
                      const { hour, minute, merid } = parseTimeTo12hParts(fltDepTime);
                      return (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <div className="form-input-wrapper" style={{ flex: 1, position: "relative" }}>
                            <i className="fas fa-clock form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                            <select
                              className="form-input form-select"
                              value={hour}
                              onChange={(e) => {
                                const h = e.target.value;
                                const newTime = format12hPartsTo24h(h, minute || "00", merid);
                                setFltDepTime(newTime);
                              }}
                              style={{ paddingLeft: "42px", width: "100%" }}
                            >
                              <option value="">Hour</option>
                              {Array.from({ length: 12 }, (_, i) => {
                                const val = String(i + 1).padStart(2, "0");
                                return <option key={val} value={val}>{val}</option>;
                              })}
                            </select>
                            <i className="fas fa-chevron-down select-arrow" style={{ right: "12px", position: "absolute", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}></i>
                          </div>
                          <div className="form-input-wrapper" style={{ flex: 1, position: "relative" }}>
                            <select
                              className="form-input form-select"
                              value={minute}
                              onChange={(e) => {
                                const m = e.target.value;
                                const newTime = format12hPartsTo24h(hour || "12", m, merid);
                                setFltDepTime(newTime);
                              }}
                              style={{ width: "100%" }}
                            >
                              <option value="">Min</option>
                              {Array.from({ length: 60 }, (_, i) => {
                                const val = String(i).padStart(2, "0");
                                return <option key={val} value={val}>{val}</option>;
                              })}
                            </select>
                            <i className="fas fa-chevron-down select-arrow" style={{ right: "12px", position: "absolute", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}></i>
                          </div>
                          <div className="form-input-wrapper" style={{ flex: 1, position: "relative" }}>
                            <select
                              className="form-input form-select"
                              value={merid}
                              onChange={(e) => {
                                const mer = e.target.value;
                                const newTime = format12hPartsTo24h(hour || "12", minute || "00", mer);
                                setFltDepTime(newTime);
                              }}
                              style={{ width: "100%" }}
                            >
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                            <i className="fas fa-chevron-down select-arrow" style={{ right: "12px", position: "absolute", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}></i>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

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
                  boxShadow: `0 4px 6px -1px rgba(2, 132, 199, 0.2)`
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
