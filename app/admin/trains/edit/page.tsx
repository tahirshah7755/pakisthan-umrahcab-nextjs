"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/utils/api";
import CustomerSearchDropdown from "@/components/admin/CustomerSearchDropdown";
import TimePicker24h from "@/components/admin/TimePicker24h";

interface TrainDetail {
  id: number;
  custom_id: string;
  train_no: string;
  leg: "Arrival" | "Departure" | "Both Legs";
  route: string;
  date: string;
  time: string;
  status: string;
  customer?: {
    id: number;
    custom_id: string;
    name: string;
    company: string;
    contact: string;
  };
}

function EditTrainContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryId = searchParams.get("id");

  const [trnSelected, setTrnSelected] = useState<TrainDetail | null>(null);
  const [singleTrnLoading, setSingleTrnLoading] = useState(true);
  const [singleTrnError, setSingleTrnError] = useState("");

  const [trnSelectedCustomerObj, setTrnSelectedCustomerObj] = useState<any | null>(null);
  const [trnLeg, setTrnLeg] = useState<"Arrival" | "Departure" | "Both Legs">("Arrival");

  // Arrival states
  const [trnArrTrainNo, setTrnArrTrainNo] = useState("");
  const [trnArrStation, setTrnArrStation] = useState("");
  const [trnArrDate, setTrnArrDate] = useState("");
  const [trnArrTime, setTrnArrTime] = useState("");
  const [trnArrStatus, setTrnArrStatus] = useState("Scheduled");

  // Departure states
  const [trnDepTrainNo, setTrnDepTrainNo] = useState("");
  const [trnDepStation, setTrnDepStation] = useState("");
  const [trnDepDate, setTrnDepDate] = useState("");
  const [trnDepTime, setTrnDepTime] = useState("");
  const [trnDepStatus, setTrnDepStatus] = useState("Scheduled");

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
      setSingleTrnError("No Train Record ID provided.");
      setSingleTrnLoading(false);
      return;
    }

    const fetchSingleTrain = async () => {
      try {
        setSingleTrnLoading(true);
        setSingleTrnError("");
        const res = await api.getTrain(queryId);
        if (res && res.id) {
          setTrnSelected(res);
          setTrnSelectedCustomerObj(res.customer || null);
          const currentLeg = res.leg || "Arrival";
          setTrnLeg(currentLeg);

          const timeVal = res.time ? res.time.substring(0, 5) : "";

          if (currentLeg === "Arrival") {
            setTrnArrTrainNo(res.train_no || "");
            setTrnArrStation(res.route || "");
            setTrnArrDate(res.date || "");
            setTrnArrTime(timeVal);
            setTrnArrStatus(res.status || "Scheduled");

            // Clear departure
            setTrnDepTrainNo("");
            setTrnDepStation("");
            setTrnDepDate("");
            setTrnDepTime("");
            setTrnDepStatus("Scheduled");
          } else if (currentLeg === "Departure") {
            setTrnDepTrainNo(res.train_no || "");
            setTrnDepStation(res.route || "");
            setTrnDepDate(res.date || "");
            setTrnDepTime(timeVal);
            setTrnDepStatus(res.status || "Scheduled");

            // Clear arrival
            setTrnArrTrainNo("");
            setTrnArrStation("");
            setTrnArrDate("");
            setTrnArrTime("");
            setTrnArrStatus("Scheduled");
          } else {
            // Both Legs
            setTrnArrTrainNo(res.train_no || "");
            setTrnArrStation(res.route || "");
            setTrnArrDate(res.date || "");
            setTrnArrTime(timeVal);
            setTrnArrStatus(res.status || "Scheduled");

            setTrnDepTrainNo(res.train_no || "");
            setTrnDepStation(res.route || "");
            setTrnDepDate(res.date || "");
            setTrnDepTime(timeVal);
            setTrnDepStatus(res.status || "Scheduled");
          }
        } else {
          setSingleTrnError("Failed to load train details.");
        }
      } catch (err: any) {
        console.error("Failed to load train details:", err);
        setSingleTrnError(err.message || "An error occurred while loading train details.");
      } finally {
        setSingleTrnLoading(false);
      }
    };

    fetchSingleTrain();
  }, [queryId]);

  const handleUpdateTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trnSelectedCustomerObj || !trnSelected) {
      showToast("Please select a customer first.", "error");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const originalDate = trnSelected?.date ? trnSelected.date.split("T")[0].split(" ")[0] : "";
    const minEditDate = originalDate && originalDate < todayStr ? originalDate : todayStr;

    if (trnLeg === "Arrival" || trnLeg === "Both Legs") {
      if (trnArrDate && trnArrDate < minEditDate) {
        showToast("Arrival date cannot be in the past.", "error");
        return;
      }
    }
    if (trnLeg === "Departure" || trnLeg === "Both Legs") {
      if (trnDepDate && trnDepDate < minEditDate) {
        showToast("Departure date cannot be in the past.", "error");
        return;
      }
    }

    try {
      if (trnLeg === "Arrival") {
        if (!trnArrTrainNo || !trnArrDate || !trnArrTime || !trnArrStation) {
          showToast("Please fill in all Arrival details.", "error");
          return;
        }
        const res = await api.updateTrain(trnSelected.id, {
          customer_id: trnSelectedCustomerObj.id,
          train_no: trnArrTrainNo,
          leg: "Arrival",
          date: trnArrDate,
          time: trnArrTime,
          route: trnArrStation,
          status: trnArrStatus
        });
        if (!res?.success) {
          showToast(res?.error || "Failed to update train details.", "error");
          return;
        }
      } else if (trnLeg === "Departure") {
        if (!trnDepTrainNo || !trnDepDate || !trnDepTime || !trnDepStation) {
          showToast("Please fill in all Departure details.", "error");
          return;
        }
        const res = await api.updateTrain(trnSelected.id, {
          customer_id: trnSelectedCustomerObj.id,
          train_no: trnDepTrainNo,
          leg: "Departure",
          date: trnDepDate,
          time: trnDepTime,
          route: trnDepStation,
          status: trnDepStatus
        });
        if (!res?.success) {
          showToast(res?.error || "Failed to update train details.", "error");
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

        if (trnSelected.leg === "Departure") {
          // Update Departure leg (current record)
          const res1 = await api.updateTrain(trnSelected.id, {
            customer_id: trnSelectedCustomerObj.id,
            train_no: trnDepTrainNo,
            leg: "Departure",
            date: trnDepDate,
            time: trnDepTime,
            route: trnDepStation,
            status: trnDepStatus
          });
          // Create Arrival leg (new record)
          const res2 = await api.createTrain({
            customer_id: trnSelectedCustomerObj.id,
            train_no: trnArrTrainNo,
            leg: "Arrival",
            date: trnArrDate,
            time: trnArrTime,
            route: trnArrStation,
            status: trnArrStatus
          });
          if (!res1?.success || !res2?.success) {
            showToast("Failed to save some train details.", "error");
            return;
          }
        } else {
          // Default: original was Arrival (or Both). Update Arrival leg (current record)
          const res1 = await api.updateTrain(trnSelected.id, {
            customer_id: trnSelectedCustomerObj.id,
            train_no: trnArrTrainNo,
            leg: "Arrival",
            date: trnArrDate,
            time: trnArrTime,
            route: trnArrStation,
            status: trnArrStatus
          });
          // Create Departure leg (new record)
          const res2 = await api.createTrain({
            customer_id: trnSelectedCustomerObj.id,
            train_no: trnDepTrainNo,
            leg: "Departure",
            date: trnDepDate,
            time: trnDepTime,
            route: trnDepStation,
            status: trnDepStatus
          });
          if (!res1?.success || !res2?.success) {
            showToast("Failed to save some train details.", "error");
            return;
          }
        }
      }

      showToast("Train journey details saved!", "success");
      setTimeout(() => {
        router.push(`/admin/trains/view?id=${trnSelected.id}`);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to update train record.", "error");
    }
  };

  const TRAIN_PURPLE = "#7c3aed";

  if (singleTrnLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="form-header-card" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" }}>
          <div>
            <h2>Edit Train Record</h2>
            <p>Modify scheduling and passenger details for the train record.</p>
          </div>
          <button onClick={() => router.push("/admin/trains")} className="form-btn-back">
            <i className="fas fa-list"></i>
            <span>Trains List</span>
          </button>
        </div>
        <div className="form-card" style={{ textAlign: "center", padding: "40px", color: "#64748b", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: "40px", color: TRAIN_PURPLE, marginBottom: "15px" }}></i>
          <h3>Loading Train Record Details...</h3>
        </div>
      </div>
    );
  }

  if (singleTrnError || !trnSelected) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="form-header-card" style={{ background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)" }}>
          <div>
            <h2>Edit Train Record Error</h2>
            <p>{singleTrnError || "Train record could not be found."}</p>
          </div>
          <button onClick={() => router.push("/admin/trains")} className="form-btn-back">
            <i className="fas fa-list"></i>
            <span>Trains List</span>
          </button>
        </div>
        <div className="form-card" style={{ textAlign: "center", padding: "40px", color: "#64748b", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <i className="fas fa-circle-exclamation" style={{ fontSize: "48px", color: "#ef4444", marginBottom: "15px" }}></i>
          <h3>Unable to retrieve train details</h3>
          <p>{singleTrnError || "The record may have been deleted, or there was a communication issue with the server."}</p>
          <button onClick={() => router.push("/admin/trains")} className="btn-submit" style={{ marginTop: "15px", background: "#ef4444" }}>
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

      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>Edit Train Record: {trnSelected.custom_id || `#TRN-${trnSelected.id}`}</h2>
          <p>Modify scheduling, direction and passenger information.</p>
        </div>
        <button onClick={() => router.push(`/admin/trains/view?id=${trnSelected.id}`)} className="form-btn-back">
          <i className="fas fa-list"></i>
          <span>Trains List</span>
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", width: "100%", padding: "10px 0" }}>
        <div className="form-card" style={{ maxWidth: "650px", width: "100%", background: "#ffffff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", padding: "30px", border: "1px solid #e2e8f0" }}>
          <form onSubmit={handleUpdateTrain} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Search Customer Dropdown Component */}
            <CustomerSearchDropdown
              selectedCustomer={trnSelectedCustomerObj}
              onSelectCustomer={setTrnSelectedCustomerObj}
              themeColor={TRAIN_PURPLE}
            />

            {/* Display Leg Direction Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "5px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Leg Direction:</span>
              <span style={{
                background: trnLeg === "Arrival" ? "#059669" : trnLeg === "Departure" ? "#2563eb" : TRAIN_PURPLE,
                color: "#ffffff",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "700"
              }}>
                <i className="fas fa-train" style={{ marginRight: "6px" }}></i>
                {trnLeg}
              </span>
            </div>

            {/* Arrival details section */}
            {(trnLeg === "Arrival" || trnLeg === "Both Legs") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                  <i className="fas fa-train" style={{ color: TRAIN_PURPLE }}></i>
                  <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>Arrival Train Details</span>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Train Number <span style={{ color: "#ef4444" }}>*</span></label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-train form-icon"></i>
                    <input type="text" className="form-input" placeholder="e.g. HHR-5" value={trnArrTrainNo} onChange={(e) => setTrnArrTrainNo(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Journey Status <span style={{ color: "#ef4444" }}>*</span></label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-info-circle form-icon"></i>
                    <select 
                      className="form-input form-select" 
                      value={trnArrStatus} 
                      onChange={(e) => setTrnArrStatus(e.target.value)}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Arrival Station <span style={{ color: "#ef4444" }}>*</span></label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-location-dot form-icon"></i>
                    <input type="text" className="form-input" placeholder="e.g. Makkah Station (MAK)" value={trnArrStation} onChange={(e) => setTrnArrStation(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "15px" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Arrival Date <span style={{ color: "#ef4444" }}>*</span></label>
                    <div className="form-input-wrapper">
                      <input
                        type="date"
                        className="form-input"
                        value={trnArrDate}
                        onChange={(e) => setTrnArrDate(e.target.value)}
                        min={trnSelected && trnSelected.date && trnSelected.date < new Date().toISOString().split("T")[0] ? trnSelected.date : new Date().toISOString().split("T")[0]}
                        style={{
                          paddingLeft: "15px",
                          borderColor: trnArrDate && trnArrDate < (trnSelected && trnSelected.date && trnSelected.date < new Date().toISOString().split("T")[0] ? trnSelected.date : new Date().toISOString().split("T")[0]) ? "#ef4444" : undefined
                        }}
                      />
                    </div>
                    {trnArrDate && trnArrDate < (trnSelected && trnSelected.date && trnSelected.date < new Date().toISOString().split("T")[0] ? trnSelected.date : new Date().toISOString().split("T")[0]) && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>
                        ⚠️ Past dates are not allowed. Please select a current or future date.
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Arrival Time <span style={{ color: "#ef4444" }}>*</span></label>
                    <TimePicker24h value={trnArrTime} onChange={setTrnArrTime} />
                  </div>
                </div>
              </div>
            )}

            {/* Departure details section */}
            {(trnLeg === "Departure" || trnLeg === "Both Legs") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "15px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                  <i className="fas fa-train" style={{ color: TRAIN_PURPLE }}></i>
                  <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>Departure Train Details</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Train Number <span style={{ color: "#ef4444" }}>*</span></label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-train form-icon"></i>
                    <input type="text" className="form-input" placeholder="e.g. HHR-10" value={trnDepTrainNo} onChange={(e) => setTrnDepTrainNo(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Journey Status <span style={{ color: "#ef4444" }}>*</span></label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-info-circle form-icon"></i>
                    <select 
                      className="form-input form-select" 
                      value={trnDepStatus} 
                      onChange={(e) => setTrnDepStatus(e.target.value)}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Departure Station <span style={{ color: "#ef4444" }}>*</span></label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-location-dot form-icon"></i>
                    <input type="text" className="form-input" placeholder="e.g. Medina Station (MED)" value={trnDepStation} onChange={(e) => setTrnDepStation(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "15px" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Departure Date <span style={{ color: "#ef4444" }}>*</span></label>
                    <div className="form-input-wrapper">
                      <input
                        type="date"
                        className="form-input"
                        value={trnDepDate}
                        onChange={(e) => setTrnDepDate(e.target.value)}
                        min={trnSelected && trnSelected.date && trnSelected.date < new Date().toISOString().split("T")[0] ? trnSelected.date : new Date().toISOString().split("T")[0]}
                        style={{
                          paddingLeft: "15px",
                          borderColor: trnDepDate && trnDepDate < (trnSelected && trnSelected.date && trnSelected.date < new Date().toISOString().split("T")[0] ? trnSelected.date : new Date().toISOString().split("T")[0]) ? "#ef4444" : undefined
                        }}
                      />
                    </div>
                    {trnDepDate && trnDepDate < (trnSelected && trnSelected.date && trnSelected.date < new Date().toISOString().split("T")[0] ? trnSelected.date : new Date().toISOString().split("T")[0]) && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>
                        ⚠️ Past dates are not allowed. Please select a current or future date.
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Departure Time <span style={{ color: "#ef4444" }}>*</span></label>
                    <TimePicker24h value={trnDepTime} onChange={setTrnDepTime} />
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button
                type="button"
                onClick={() => router.push(`/admin/trains/view?id=${trnSelected.id}`)}
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
                  background: TRAIN_PURPLE,
                  color: "#ffffff",
                  border: "none",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: `0 4px 6px -1px rgba(124, 58, 237, 0.2)`
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

export default function EditTrainPage() {
  return (
    <Suspense fallback={<div>Loading train edit layout...</div>}>
      <EditTrainContent />
    </Suspense>
  );
}
