"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/utils/api";
import CustomerSearchDropdown from "@/components/admin/CustomerSearchDropdown";

function AddFlightContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId") || "";

  const [fltSelectedCustomerObj, setFltSelectedCustomerObj] = useState<any | null>(null);
  const [fltLeg, setFltLeg] = useState<"Arrival" | "Departure" | "Both Legs">("Arrival");

  // Arrival states
  const [fltArrFlightNo, setFltArrFlightNo] = useState("");
  const [fltArrPlace, setFltArrPlace] = useState("");
  const [fltArrDate, setFltArrDate] = useState("");
  const [fltArrTime, setFltArrTime] = useState("");

  // Departure states
  const [fltDepFlightNo, setFltDepFlightNo] = useState("");
  const [fltDepPlace, setFltDepPlace] = useState("");
  const [fltDepDate, setFltDepDate] = useState("");
  const [fltDepTime, setFltDepTime] = useState("");

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

  // Pre-populate customer if customerId is present in URL
  useEffect(() => {
    if (customerId) {
      const fetchCustomer = async () => {
        try {
          const res = await api.getCustomer(customerId);
          if (res && res.customer) {
            setFltSelectedCustomerObj(res.customer);
          }
        } catch (err) {
          console.error("Failed to load customer details", err);
        }
      };
      fetchCustomer();
    }
  }, [customerId]);

  const handleAddFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fltSelectedCustomerObj) {
      showToast("Please select a customer first.", "error");
      return;
    }

    try {
      if (fltLeg === "Arrival") {
        if (!fltArrFlightNo || !fltArrDate || !fltArrTime || !fltArrPlace) {
          showToast("Please fill in all Arrival details.", "error");
          return;
        }
        const res = await api.createFlight({
          customer_id: fltSelectedCustomerObj.id,
          flight_no: fltArrFlightNo,
          leg: "Arrival",
          date: fltArrDate,
          time: fltArrTime,
          route: fltArrPlace,
          status: "On Time"
        });
        if (!res?.success) {
          showToast(res?.error || "Failed to save flight details.", "error");
          return;
        }
      } else if (fltLeg === "Departure") {
        if (!fltDepFlightNo || !fltDepDate || !fltDepTime || !fltDepPlace) {
          showToast("Please fill in all Departure details.", "error");
          return;
        }
        const res = await api.createFlight({
          customer_id: fltSelectedCustomerObj.id,
          flight_no: fltDepFlightNo,
          leg: "Departure",
          date: fltDepDate,
          time: fltDepTime,
          route: fltDepPlace,
          status: "On Time"
        });
        if (!res?.success) {
          showToast(res?.error || "Failed to save flight details.", "error");
          return;
        }
      } else if (fltLeg === "Both Legs") {
        if (
          !fltArrFlightNo || !fltArrDate || !fltArrTime || !fltArrPlace ||
          !fltDepFlightNo || !fltDepDate || !fltDepTime || !fltDepPlace
        ) {
          showToast("Please fill in both Arrival and Departure details.", "error");
          return;
        }
        const res1 = await api.createFlight({
          customer_id: fltSelectedCustomerObj.id,
          flight_no: fltArrFlightNo,
          leg: "Arrival",
          date: fltArrDate,
          time: fltArrTime,
          route: fltArrPlace,
          status: "On Time"
        });
        const res2 = await api.createFlight({
          customer_id: fltSelectedCustomerObj.id,
          flight_no: fltDepFlightNo,
          leg: "Departure",
          date: fltDepDate,
          time: fltDepTime,
          route: fltDepPlace,
          status: "On Time"
        });
        if (!res1?.success || !res2?.success) {
          showToast("Failed to save some flight details.", "error");
          return;
        }
      }

      showToast("Flight tracking details saved!", "success");
      
      // Clear inputs
      setFltArrFlightNo("");
      setFltArrPlace("");
      setFltArrDate("");
      setFltArrTime("");
      setFltDepFlightNo("");
      setFltDepPlace("");
      setFltDepDate("");
      setFltDepTime("");
      setFltSelectedCustomerObj(null);

      setTimeout(() => {
        router.push(customerId ? `/company/customers/view?id=${customerId}` : `/company/customers`);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to add flight record.", "error");
    }
  };

  const GOLD_COLOR = "#d4af37";

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
        }}>
          <i className={toast.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"}></i>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #b48a1d 0%, #d4af37 100%)" }}>
        <div>
          <h2>Add Flight Record</h2>
          <p>Register departure and arrival details for a customer flight.</p>
        </div>
        <button onClick={() => router.push(customerId ? `/company/customers/view?id=${customerId}` : `/company/customers`)} className="form-btn-back">
          <i className="fas fa-arrow-left"></i>
          <span>Back to Profile</span>
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", width: "100%", padding: "10px 0" }}>
        <div className="form-card" style={{ maxWidth: "650px", width: "100%", background: "#ffffff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", padding: "30px", border: "1px solid #e2e8f0" }}>
          <form onSubmit={handleAddFlight} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Search Customer Dropdown Component */}
            <CustomerSearchDropdown
              selectedCustomer={fltSelectedCustomerObj}
              onSelectCustomer={setFltSelectedCustomerObj}
              themeColor={GOLD_COLOR}
            />

            {/* Leg Type Tab Buttons */}
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              {(["Arrival", "Departure", "Both Legs"] as const).map((leg) => (
                <button
                  key={leg}
                  type="button"
                  onClick={() => setFltLeg(leg)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                    border: fltLeg === leg ? "none" : "1px solid #cbd5e1",
                    background: fltLeg === leg ? GOLD_COLOR : "#ffffff",
                    color: fltLeg === leg ? "#ffffff" : "#64748b",
                    boxShadow: fltLeg === leg ? `0 4px 6px -1px rgba(212, 175, 55, 0.25)` : "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  <i className={leg === "Arrival" ? "fas fa-plane-arrival" : leg === "Departure" ? "fas fa-plane-departure" : "fas fa-arrows-left-right"}></i>
                  <span>{leg}</span>
                </button>
              ))}
            </div>

            {/* Arrival details */}
            {(fltLeg === "Arrival" || fltLeg === "Both Legs") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                  <i className="fas fa-plane-arrival" style={{ color: GOLD_COLOR }}></i>
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
                    <div className="form-input-wrapper">
                      <input type="time" className="form-input" value={fltArrTime} onChange={(e) => setFltArrTime(e.target.value)} style={{ paddingLeft: "15px" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Departure details */}
            {(fltLeg === "Departure" || fltLeg === "Both Legs") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "15px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                  <i className="fas fa-plane-departure" style={{ color: GOLD_COLOR }}></i>
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
                    <div className="form-input-wrapper">
                      <input type="time" className="form-input" value={fltDepTime} onChange={(e) => setFltDepTime(e.target.value)} style={{ paddingLeft: "15px" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button
                type="button"
                onClick={() => router.push(customerId ? `/company/customers/view?id=${customerId}` : `/company/customers`)}
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
                  background: GOLD_COLOR,
                  color: "#ffffff",
                  border: "none",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 6px -1px rgba(212, 175, 55, 0.2)"
                }}
              >
                <i className="fas fa-check"></i>
                <span>Save Flight Details</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AddFlight() {
  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <AddFlightContent />
    </Suspense>
  );
}
