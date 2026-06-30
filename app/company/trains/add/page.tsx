"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/utils/api";
import CustomerSearchDropdown from "@/components/admin/CustomerSearchDropdown";

function AddTrainContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId") || "";

  const [trnSelectedCustomerObj, setTrnSelectedCustomerObj] = useState<any | null>(null);
  const [trnLeg, setTrnLeg] = useState<"Arrival" | "Departure" | "Both Legs">("Arrival");

  // Arrival states
  const [trnArrTrainNo, setTrnArrTrainNo] = useState("");
  const [trnArrStation, setTrnArrStation] = useState("");
  const [trnArrDate, setTrnArrDate] = useState("");
  const [trnArrTime, setTrnArrTime] = useState("");

  // Departure states
  const [trnDepTrainNo, setTrnDepTrainNo] = useState("");
  const [trnDepStation, setTrnDepStation] = useState("");
  const [trnDepDate, setTrnDepDate] = useState("");
  const [trnDepTime, setTrnDepTime] = useState("");

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
            setTrnSelectedCustomerObj(res.customer);
          }
        } catch (err) {
          console.error("Failed to load customer details", err);
        }
      };
      fetchCustomer();
    }
  }, [customerId]);

  const handleAddTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trnSelectedCustomerObj) {
      showToast("Please select a customer first.", "error");
      return;
    }

    try {
      if (trnLeg === "Arrival") {
        if (!trnArrTrainNo || !trnArrDate || !trnArrTime || !trnArrStation) {
          showToast("Please fill in all Arrival details.", "error");
          return;
        }
        const res = await api.createTrain({
          customer_id: trnSelectedCustomerObj.id,
          train_no: trnArrTrainNo,
          leg: "Arrival",
          date: trnArrDate,
          time: trnArrTime,
          route: trnArrStation,
          status: "Scheduled"
        });
        if (!res?.success) {
          showToast(res?.error || "Failed to save train details.", "error");
          return;
        }
      } else if (trnLeg === "Departure") {
        if (!trnDepTrainNo || !trnDepDate || !trnDepTime || !trnDepStation) {
          showToast("Please fill in all Departure details.", "error");
          return;
        }
        const res = await api.createTrain({
          customer_id: trnSelectedCustomerObj.id,
          train_no: trnDepTrainNo,
          leg: "Departure",
          date: trnDepDate,
          time: trnDepTime,
          route: trnDepStation,
          status: "Scheduled"
        });
        if (!res?.success) {
          showToast(res?.error || "Failed to save train details.", "error");
          return;
        }
      } else if (trnLeg === "Both Legs") {
        if (
          !trnArrTrainNo || !trnArrDate || !trnArrTime || !trnArrStation ||
          !trnDepTrainNo || !trnDepDate || !trnDepTime || !trnDepStation
        ) {
          showToast("Please fill in both Arrival and Departure details.", "error");
          return;
        }
        const res1 = await api.createTrain({
          customer_id: trnSelectedCustomerObj.id,
          train_no: trnArrTrainNo,
          leg: "Arrival",
          date: trnArrDate,
          time: trnArrTime,
          route: trnArrStation,
          status: "Scheduled"
        });
        const res2 = await api.createTrain({
          customer_id: trnSelectedCustomerObj.id,
          train_no: trnDepTrainNo,
          leg: "Departure",
          date: trnDepDate,
          time: trnDepTime,
          route: trnDepStation,
          status: "Scheduled"
        });
        if (!res1?.success || !res2?.success) {
          showToast("Failed to save some train details.", "error");
          return;
        }
      }

      showToast("Train tracking details saved!", "success");
      
      // Clear inputs
      setTrnArrTrainNo("");
      setTrnArrStation("");
      setTrnArrDate("");
      setTrnArrTime("");
      setTrnDepTrainNo("");
      setTrnDepStation("");
      setTrnDepDate("");
      setTrnDepTime("");
      setTrnSelectedCustomerObj(null);

      setTimeout(() => {
        router.push(customerId ? `/company/customers/view?id=${customerId}` : `/company/customers`);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to add train record.", "error");
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
          <h2>Add Train Record</h2>
          <p>Register departure and arrival details for a customer train journey.</p>
        </div>
        <button onClick={() => router.push(customerId ? `/company/customers/view?id=${customerId}` : `/company/customers`)} className="form-btn-back">
          <i className="fas fa-arrow-left"></i>
          <span>Back to Profile</span>
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", width: "100%", padding: "10px 0" }}>
        <div className="form-card" style={{ maxWidth: "650px", width: "100%", background: "#ffffff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", padding: "30px", border: "1px solid #e2e8f0" }}>
          <form onSubmit={handleAddTrain} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Search Customer Dropdown Component */}
            <CustomerSearchDropdown
              selectedCustomer={trnSelectedCustomerObj}
              onSelectCustomer={setTrnSelectedCustomerObj}
              themeColor={GOLD_COLOR}
              disabled={!!customerId}
            />

            {/* Leg Type Tab Buttons */}
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              {(["Arrival", "Departure", "Both Legs"] as const).map((leg) => (
                <button
                  key={leg}
                  type="button"
                  onClick={() => setTrnLeg(leg)}
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
                    border: trnLeg === leg ? "none" : "1px solid #cbd5e1",
                    background: trnLeg === leg ? GOLD_COLOR : "#ffffff",
                    color: trnLeg === leg ? "#ffffff" : "#64748b",
                    boxShadow: trnLeg === leg ? `0 4px 6px -1px rgba(212, 175, 55, 0.25)` : "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  <i className={leg === "Arrival" ? "fas fa-train" : leg === "Departure" ? "fas fa-train" : "fas fa-arrows-left-right"}></i>
                  <span>{leg}</span>
                </button>
              ))}
            </div>

            {/* Arrival details */}
            {(trnLeg === "Arrival" || trnLeg === "Both Legs") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                  <i className="fas fa-train" style={{ color: GOLD_COLOR }}></i>
                  <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>Arrival Train Details</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Train Number / Code <span style={{ color: "#ef4444" }}>*</span></label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-train form-icon"></i>
                    <input type="text" className="form-input" placeholder="e.g. HHR-5240" value={trnArrTrainNo} onChange={(e) => setTrnArrTrainNo(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Arrival Station <span style={{ color: "#ef4444" }}>*</span></label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-location-dot form-icon"></i>
                    <input type="text" className="form-input" placeholder="e.g. Makkah Haramain Station" value={trnArrStation} onChange={(e) => setTrnArrStation(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "15px" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Arrival Date <span style={{ color: "#ef4444" }}>*</span></label>
                    <div className="form-input-wrapper">
                      <input type="date" className="form-input" value={trnArrDate} onChange={(e) => setTrnArrDate(e.target.value)} style={{ paddingLeft: "15px" }} />
                    </div>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Arrival Time <span style={{ color: "#ef4444" }}>*</span></label>
                    <div className="form-input-wrapper">
                      <input type="time" className="form-input" value={trnArrTime} onChange={(e) => setTrnArrTime(e.target.value)} style={{ paddingLeft: "15px" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Departure details */}
            {(trnLeg === "Departure" || trnLeg === "Both Legs") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "15px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                  <i className="fas fa-train" style={{ color: GOLD_COLOR }}></i>
                  <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>Departure Train Details</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Train Number / Code <span style={{ color: "#ef4444" }}>*</span></label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-train form-icon"></i>
                    <input type="text" className="form-input" placeholder="e.g. HHR-5241" value={trnDepTrainNo} onChange={(e) => setTrnDepTrainNo(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Departure Station <span style={{ color: "#ef4444" }}>*</span></label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-location-dot form-icon"></i>
                    <input type="text" className="form-input" placeholder="e.g. Madinah Haramain Station" value={trnDepStation} onChange={(e) => setTrnDepStation(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "15px" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Departure Date <span style={{ color: "#ef4444" }}>*</span></label>
                    <div className="form-input-wrapper">
                      <input type="date" className="form-input" value={trnDepDate} onChange={(e) => setTrnDepDate(e.target.value)} style={{ paddingLeft: "15px" }} />
                    </div>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Departure Time <span style={{ color: "#ef4444" }}>*</span></label>
                    <div className="form-input-wrapper">
                      <input type="time" className="form-input" value={trnDepTime} onChange={(e) => setTrnDepTime(e.target.value)} style={{ paddingLeft: "15px" }} />
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
                <span>Save Train Details</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AddTrain() {
  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <AddTrainContent />
    </Suspense>
  );
}
