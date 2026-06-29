"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/utils/api";

interface AuditLog {
  id: number;
  performed_action: string;
  ip_location: string;
  user_session: string;
  created_at: string;
  updated_at: string;
}

interface FlightDetail {
  id: string;
  custom_id: string;
  flightNo: string;
  leg: string;
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
  audits?: AuditLog[];
}

function FlightDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryId = searchParams.get("id");

  const [singleFlt, setSingleFlt] = useState<FlightDetail | null>(null);
  const [singleFltAudits, setSingleFltAudits] = useState<AuditLog[]>([]);
  const [singleFltLoading, setSingleFltLoading] = useState(true);
  const [singleFltError, setSingleFltError] = useState("");

  const formatScheduleDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const formatTime12h = (timeStr: string) => {
    if (!timeStr) return "";
    try {
      const parts = timeStr.split(":");
      if (parts.length >= 2) {
        let hours = parseInt(parts[0], 10);
        const minutes = parts[1];
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours < 10 ? "0" + hours : hours}:${minutes} ${ampm}`;
      }
      return timeStr;
    } catch {
      return timeStr;
    }
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
          setSingleFlt(res.flight);
          setSingleFltAudits(res.audits || []);
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

  if (singleFltLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", gap: "15px" }}>
        <div className="spinner" style={{ width: "40px", height: "40px", border: "4px solid #f3f3f3", borderTop: "4px solid #3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        <p style={{ color: "#64748b", fontWeight: "600" }}>Loading flight details...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (singleFltError || !singleFlt) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="form-header-card" style={{ background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)" }}>
          <div>
            <h2>Flight Details Error</h2>
            <p>{singleFltError || "Flight record could not be found."}</p>
          </div>
          <button onClick={() => router.push("/admin/flights")} className="form-btn-back">
            <i className="fas fa-arrow-left"></i>
            <span>Back to Flights Directory</span>
          </button>
        </div>
        <div className="form-card" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
          <i className="fas fa-circle-exclamation" style={{ fontSize: "48px", color: "#ef4444", marginBottom: "15px" }}></i>
          <h3>Unable to retrieve flight details</h3>
          <p>The record may have been deleted, or there was a communication issue with the server.</p>
          <button onClick={() => router.push("/admin/flights")} className="btn-submit" style={{ marginTop: "15px", background: "#ef4444" }}>
            Return to Registry
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = formatScheduleDate(singleFlt.date);
  const formattedTime = formatTime12h(singleFlt.time);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header Card */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0 }}>Flight Record: {singleFlt.custom_id || `#FLT-${singleFlt.id}`}</h2>
            <span className={`status-pill ${
              singleFlt.status === 'On Time' || singleFlt.status === 'Scheduled' || singleFlt.status === 'Completed' ? 'completed' :
              singleFlt.status === 'Cancelled' ? 'cancelled' : 'pending'
            }`} style={{ padding: "4px 12px", fontSize: "12px", fontWeight: "700" }}>
              {singleFlt.status || 'On Time'}
            </span>
          </div>
          <p style={{ marginTop: "5px", opacity: 0.9 }}>
            {singleFlt.leg} flight {singleFlt.flightNo} registered on {formattedDate}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => {
              router.push(`/admin/flights/edit?id=${singleFlt.id}`);
            }}
            className="form-btn-back"
            style={{ background: "#ffffff", color: "#4f46e5", border: "none", cursor: "pointer" }}
          >
            <i className="far fa-edit"></i>
            <span>Edit Record</span>
          </button>
          <button onClick={() => router.push("/admin/flights")} className="form-btn-back">
            <i className="fas fa-arrow-left"></i>
            <span>Back to Registry</span>
          </button>
        </div>
      </div>

      {/* Details Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", flexWrap: "wrap" }}>
        
        {/* Flight Schedule Details */}
        <div className="form-card" style={{ background: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="fas fa-plane" style={{ color: "#4f46e5" }}></i>
            <span>Flight Logistics & Schedule</span>
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { label: "Flight ID / Ref", value: singleFlt.custom_id, icon: "fa-hashtag" },
              { label: "Flight / Carrier Number", value: singleFlt.flightNo, icon: "fa-plane-departure" },
              { label: "Leg Direction", value: singleFlt.leg, icon: "fa-arrow-right-arrow-left" },
              { label: "Scheduled Date", value: formattedDate, icon: "fa-calendar" },
              { label: "Scheduled Time", value: formattedTime, icon: "fa-clock" },
              { label: "Route Mapping", value: singleFlt.route, icon: "fa-location-dot" }
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
              { label: "Passenger Name", value: singleFlt.customer ? singleFlt.customer.name : "N/A", icon: "fa-user" },
              { label: "Company Registry", value: singleFlt.customer ? singleFlt.customer.company : "Independent", icon: "fa-building" },
              { label: "Contact Details", value: singleFlt.customer ? singleFlt.customer.contact : "N/A", icon: "fa-phone" },
              { label: "Last Updated", value: new Date(singleFlt.updated_at || singleFlt.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }), icon: "fa-pen-to-square" }
            ].map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid #f8fafc" }}>
                <span style={{ color: "#64748b", fontWeight: "600", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className={`fas ${item.icon}`} style={{ width: "16px", color: "#94a3b8" }}></i>
                  {item.label}
                </span>
                <span style={{ color: "#1e293b", fontWeight: "700", fontSize: "14px" }}>{item.value}</span>
              </div>
            ))}

            {singleFlt.customer && singleFlt.customer.contact && (
              <div style={{ marginTop: "12px" }}>
                <a
                  href={`https://wa.me/${singleFlt.customer.contact.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${singleFlt.customer.name}, checking your flight ${singleFlt.flightNo} status.`)}`}
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
              {singleFltAudits.map((audit) => (
                <tr key={audit.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>
                    {new Date(audit.created_at || audit.updated_at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </td>
                  <td style={{ padding: "12px", fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>
                    {audit.performed_action}
                  </td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "#64748b", fontFamily: "monospace" }}>
                    {audit.ip_location || "127.0.0.1"}
                  </td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>
                    <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700" }}>
                      {audit.user_session || "system"}
                    </span>
                  </td>
                </tr>
              ))}
              {singleFltAudits.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "30px", color: "#94a3b8", fontSize: "13px" }}>
                    No audit trail records available for this flight.
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

export default function FlightDetailsPage() {
  return (
    <Suspense fallback={<div>Loading flight details layout...</div>}>
      <FlightDetailsContent />
    </Suspense>
  );
}
