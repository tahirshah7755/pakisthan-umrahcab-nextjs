"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";

interface AuditItem {
  id: string;
  user_session: string;
  ip_location: string;
  performed_action: string;
  created_at: string;
}

export default function AuditTrailPage() {
  const router = useRouter();
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setLoading(true);
        const audList = await api.getAudits();
        if (audList) {
          setAudits(audList.map((a: any) => ({
            id: a.custom_id || `#AUD-${a.id}`,
            user_session: a.user_session || "umrahcab",
            ip_location: a.ip_location || "127.0.0.1",
            performed_action: a.performed_action,
            created_at: a.created_at || new Date().toISOString()
          })));
        } else {
          // Mock data template fallback
          setAudits([
            { id: "#AUD-1002", user_session: "umrahcab", ip_location: "192.168.1.5", performed_action: "Unlocked Ledger balance for #CMP-1", created_at: "2026-05-23T14:06:00.000Z" },
            { id: "#AUD-1001", user_session: "umrahcab", ip_location: "192.168.1.5", performed_action: "Registered new company Al-Saudia Travel", created_at: "2026-05-23T12:40:00.000Z" }
          ]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px", maxWidth: "1100px", margin: "0 auto", padding: "10px" }}>
      {/* Header Card */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #374151 0%, #1f2937 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>System Security Audit Trail</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Track administrator dashboard log-ins, pricing updates, and booking registrations.</p>
        </div>
        <button 
          onClick={() => router.push("/admin/extras")} 
          style={{ background: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", padding: "10px 18px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <i className="fas fa-arrow-left"></i>
          <span>Back to Utilities</span>
        </button>
      </div>

      {/* Main Table Panel */}
      <div className="table-card" style={{ background: "#ffffff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
            <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #374151", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="db-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Audit ID</th>
                  <th>User Session</th>
                  <th>IP Location</th>
                  <th>Performed Action</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {audits.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                      No audit log records found in the database.
                    </td>
                  </tr>
                ) : (
                  audits.map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 700 }}>{a.id}</td>
                      <td style={{ fontWeight: 600 }}>{a.user_session}</td>
                      <td>{a.ip_location}</td>
                      <td style={{ 
                        color: a.performed_action.includes("Unlocked") ? "#10b981" : 
                               a.performed_action.includes("Registered") ? "#3b82f6" : "#1e293b", 
                        fontWeight: "600" 
                      }}>
                        {a.performed_action}
                      </td>
                      <td>{a.created_at.substring(0, 19).replace("T", " ")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
}
