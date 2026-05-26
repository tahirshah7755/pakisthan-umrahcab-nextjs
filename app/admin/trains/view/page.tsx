"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/utils/api";

interface TrainDetail {
  id: number;
  custom_id: string;
  train_no: string;
  leg: "Arrival" | "Departure" | "Both Legs";
  route: string;
  date: string;
  time: string;
  status: string;
  created_at: string;
  updated_at: string;
  customer?: {
    id: number;
    custom_id: string;
    name: string;
    company: string;
    contact: string;
  };
  audits?: any[];
}

function TrainDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryId = searchParams.get("id");

  const [singleTrn, setSingleTrn] = useState<TrainDetail | null>(null);
  const [singleTrnAudits, setSingleTrnAudits] = useState<any[]>([]);
  const [singleTrnLoading, setSingleTrnLoading] = useState(true);
  const [singleTrnError, setSingleTrnError] = useState("");

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
          setSingleTrn(res);
          setSingleTrnAudits(res.audits || []);
        } else {
          setSingleTrnError("Failed to load train record details.");
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

  const formatScheduleDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formatTime12h = (timeStr: string) => {
    if (!timeStr) return "";
    try {
      const [hours, minutes] = timeStr.split(":");
      const h = parseInt(hours, 10);
      const ampm = h >= 12 ? "PM" : "AM";
      const formattedHours = h % 12 || 12;
      const pad = (n: number) => (n < 10 ? `0${n}` : n);
      return `${pad(formattedHours)}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  if (singleTrnLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", gap: "15px" }}>
        <div className="spinner" style={{ width: "40px", height: "40px", border: "4px solid #f3f3f3", borderTop: "4px solid #db2777", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        <p style={{ color: "#64748b", fontWeight: "600" }}>Loading train logistics details...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (singleTrnError || !singleTrn) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="form-header-card" style={{ background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)" }}>
          <div>
            <h2>Train Record Error</h2>
            <p>{singleTrnError || "Train record could not be found."}</p>
          </div>
          <button onClick={() => router.push("/admin/trains")} className="form-btn-back">
            <i className="fas fa-arrow-left"></i>
            <span>Back to Trains Directory</span>
          </button>
        </div>
        <div className="form-card" style={{ textAlign: "center", padding: "40px", color: "#64748b", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <i className="fas fa-circle-exclamation" style={{ fontSize: "48px", color: "#ef4444", marginBottom: "15px" }}></i>
          <h3>Unable to retrieve train record</h3>
          <p>The record may have been deleted, or there was a communication issue with the server.</p>
          <button onClick={() => router.push("/admin/trains")} className="btn-submit" style={{ marginTop: "15px", background: "#ef4444" }}>
            Return to Directory
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = formatScheduleDate(singleTrn.date);
  const formattedTime = formatTime12h(singleTrn.time);

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

      {/* Header Card */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #db2777 0%, #be185d 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0 }}>Train Record: {singleTrn.custom_id || `#TRN-${singleTrn.id}`}</h2>
            <span className={`status-pill ${
              singleTrn.status === 'Completed' || singleTrn.status === 'Confirmed' || singleTrn.status === 'Scheduled' ? 'completed' :
              singleTrn.status === 'Cancelled' ? 'cancelled' : 'pending'
            }`} style={{ padding: "4px 12px", fontSize: "12px", fontWeight: "700" }}>
              {singleTrn.status || 'Confirmed'}
            </span>
          </div>
          <p style={{ marginTop: "5px", opacity: 0.9 }}>
            {singleTrn.leg} train journey {singleTrn.train_no} on {formattedDate}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => {
              router.push(`/admin/trains/edit?id=${singleTrn.id}`);
            }}
            className="form-btn-back"
            style={{ background: "#ffffff", color: "#be185d", border: "none", cursor: "pointer" }}
          >
            <i className="far fa-edit"></i>
            <span>Edit Record</span>
          </button>
          <button onClick={() => router.push("/admin/trains")} className="form-btn-back">
            <i className="fas fa-arrow-left"></i>
            <span>Back to Directory</span>
          </button>
        </div>
      </div>

      {/* Details Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        
        {/* Train logistics */}
        <div className="form-card" style={{ background: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="fas fa-train" style={{ color: "#db2777" }}></i>
            <span>Train Logistics & Schedule</span>
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { label: "Train Record ID", value: singleTrn.custom_id || `#TRN-${singleTrn.id}`, icon: "fa-hashtag" },
              { label: "Train Number / Code", value: singleTrn.train_no, icon: "fa-train-subway" },
              { label: "Leg Direction", value: singleTrn.leg, icon: "fa-arrow-right-arrow-left" },
              { label: "Journey Date", value: formattedDate, icon: "fa-calendar" },
              { label: "Journey Time", value: formattedTime, icon: "fa-clock" },
              { label: "Station Mapping / City", value: singleTrn.route, icon: "fa-location-dot" }
            ].map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid #f8fafc" }}>
                <span style={{ color: "#64748b", fontWeight: "600", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className={`fas ${item.icon}`} style={{ width: "16px", color: "#94a3b8" }}></i>
                  {item.label}
                </span>
                <span style={{ color: "#1e293b", fontWeight: "700", fontSize: "14px" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Linked Passenger Details */}
        <div className="form-card" style={{ background: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="fas fa-circle-user" style={{ color: "#10b981" }}></i>
            <span>Linked Passenger Profile</span>
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { label: "Passenger Name", value: singleTrn.customer ? singleTrn.customer.name : "Walk-in Passenger", icon: "fa-user" },
              { label: "Company Registry", value: singleTrn.customer ? singleTrn.customer.company : "Independent", icon: "fa-building" },
              { label: "Contact Details", value: singleTrn.customer ? singleTrn.customer.contact : "N/A", icon: "fa-phone" },
              { label: "Last Updated", value: new Date(singleTrn.updated_at || singleTrn.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }), icon: "fa-pen-to-square" }
            ].map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid #f8fafc" }}>
                <span style={{ color: "#64748b", fontWeight: "600", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className={`fas ${item.icon}`} style={{ width: "16px", color: "#94a3b8" }}></i>
                  {item.label}
                </span>
                <span style={{ color: "#1e293b", fontWeight: "700", fontSize: "14px" }}>{item.value}</span>
              </div>
            ))}

            {singleTrn.customer && singleTrn.customer.contact && (
              <div style={{ marginTop: "12px" }}>
                <a
                  href={`https://wa.me/${singleTrn.customer.contact.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${singleTrn.customer.name}, checking your Haramain Train ${singleTrn.train_no} ticket details.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    background: "#25d366",
                    color: "#ffffff",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    textDecoration: "none",
                    fontSize: "13px",
                    boxShadow: "0 2px 8px rgba(37,211,102,0.25)",
                    transition: "all 0.2s"
                  }}
                >
                  <i className="fab fa-whatsapp" style={{ fontSize: "16px" }}></i>
                  <span>Contact Passenger via WhatsApp</span>
                </a>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Audit Logs Trail Card */}
      <div className="table-card" style={{ padding: "24px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <i className="fas fa-clock-rotate-left" style={{ color: "#64748b" }}></i>
          <span>Activity Audit Trail</span>
        </h3>

        <div className="table-responsive">
          <table className="db-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", width: "20%" }}>Timestamp</th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", width: "45%" }}>Performed Action</th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", width: "20%" }}>IP Address</th>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", width: "15%" }}>Operator</th>
              </tr>
            </thead>
            <tbody>
              {singleTrnAudits.map((audit) => (
                <tr key={audit.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>
                    {new Date(audit.created_at || audit.updated_at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </td>
                  <td style={{ padding: "12px", fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>
                    {audit.action}
                  </td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "#64748b" }}>
                    <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "12px" }}>{audit.ip_address || "127.0.0.1"}</code>
                  </td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>
                    <span style={{ fontWeight: "600" }}>{audit.user_name || audit.user_id || "admin"}</span>
                  </td>
                </tr>
              ))}
              {singleTrnAudits.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "24px", color: "#94a3b8", fontSize: "13px" }}>
                    No audit history logs recorded for this train record.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function TrainDetailsPage() {
  return (
    <Suspense fallback={<div>Loading train details layout...</div>}>
      <TrainDetailsContent />
    </Suspense>
  );
}
