"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/utils/api";

interface NoticeItem {
  id: string;
  title: string;
  date: string;
  priority: "Low" | "Medium" | "High";
  target: "Admin" | "Agent";
  content: string;
}

function NoticesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "agent" ? "Agent" : "Admin";

  const [activeTab, setActiveTab] = useState<"Admin" | "Agent">(initialTab);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Toast notification
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const notList = await api.getNotices();
      if (notList) {
        setNotices(notList.map((n: any) => ({
          id: n.custom_id || `NTC-${n.id}`,
          title: n.title,
          date: n.date || new Date().toISOString().split("T")[0],
          priority: n.priority || "Medium",
          target: n.target || "Admin",
          content: n.content
        })));
      } else {
        // Fallback default announcements
        setNotices([
          { id: "NTC-101", title: "Umrah Route Maintenance Scheduled", date: "2026-05-25", priority: "High", target: "Admin", content: "Main database server and booking logs will undergo system maintenance from 02:00 AM to 04:00 AM UTC. Please finalize all pending vouchers before this period." },
          { id: "NTC-102", title: "New Transport Fleet Booking Guide", date: "2026-05-24", priority: "Medium", target: "Agent", content: "We have updated the active inventory allocation rules for Staria and GMC classes. Please review the updated fleet policies page under Utilities before dispatching bookings." },
        ]);
      }
    } catch (err) {
      console.error(err);
      showToast("Error loading announcements list", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const filteredNotices = notices.filter((n) => n.target === activeTab);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px", maxWidth: "1000px", margin: "0 auto", padding: "10px" }}>
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "#ffffff", padding: "12px 24px", borderRadius: "8px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", fontWeight: "600",
          fontSize: "14px", display: "flex", alignItems: "center", gap: "10px",
        }}>
          <i className={toast.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Dynamic Header Banner */}
      <div className="form-header-card" style={{ 
        background: activeTab === "Agent" ? "linear-gradient(135deg, #ea580c 0%, #f97316 100%)" : "linear-gradient(135deg, #ca8a04 0%, #eab308 100%)",
        padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center",
        transition: "background 0.3s ease"
      }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>
            {activeTab === "Agent" ? "Agent Announcements Board" : "Administrative Notice Center"}
          </h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>
            Publish guidelines, system outages, and operational procedures to employees.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={() => router.push(`/admin/notices/add?target=${activeTab.toLowerCase()}`)} 
            style={{ background: "#ffffff", color: activeTab === "Agent" ? "#ea580c" : "#ca8a04", border: "none", borderRadius: "6px", padding: "10px 18px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <i className="fas fa-plus"></i>
            <span>Create Announcement</span>
          </button>
          <button 
            onClick={() => router.push("/admin/extras")} 
            style={{ background: "rgba(0, 0, 0, 0.15)", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: "6px", padding: "10px 18px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <i className="fas fa-arrow-left"></i>
            <span>Back to Utilities</span>
          </button>
        </div>
      </div>

      {/* Tabs Selector Bar */}
      <div style={{ display: "flex", background: "#e2e8f0", padding: "5px", borderRadius: "8px", gap: "5px" }}>
        <button 
          onClick={() => setActiveTab("Admin")}
          style={{
            flex: 1, padding: "12px", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "14px", cursor: "pointer",
            background: activeTab === "Admin" ? "#ffffff" : "transparent",
            color: activeTab === "Admin" ? "#854d0e" : "#475569",
            boxShadow: activeTab === "Admin" ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
            transition: "all 0.2s"
          }}
        >
          <i className="fas fa-shield-halved" style={{ marginRight: "8px" }}></i>
          Administrative Staff (HQ)
        </button>
        <button 
          onClick={() => setActiveTab("Agent")}
          style={{
            flex: 1, padding: "12px", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "14px", cursor: "pointer",
            background: activeTab === "Agent" ? "#ffffff" : "transparent",
            color: activeTab === "Agent" ? "#c2410c" : "#475569",
            boxShadow: activeTab === "Agent" ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
            transition: "all 0.2s"
          }}
        >
          <i className="fas fa-user-tie" style={{ marginRight: "8px" }}></i>
          Company Agents Board
        </button>
      </div>

      {/* Notices Stream Panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
            <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: `4px solid ${activeTab === "Agent" ? "#ea580c" : "#ca8a04"}`, borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="form-card" style={{ background: "#ffffff", padding: "50px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", textAlign: "center", color: "#64748b" }}>
            <i className="fas fa-folder-open" style={{ fontSize: "40px", color: "#cbd5e1", marginBottom: "15px", display: "block" }}></i>
            <span style={{ fontSize: "14px" }}>No active announcements published on this board.</span>
          </div>
        ) : (
          filteredNotices.map((n) => (
            <div 
              key={n.id} 
              className="form-card" 
              style={{ 
                background: "#ffffff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                borderLeft: `6px solid ${n.priority === "High" ? "#ef4444" : n.priority === "Medium" ? "#3b82f6" : "#10b981"}`
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#1e293b", margin: 0 }}>{n.title}</h3>
                <span style={{ 
                  background: n.priority === "High" ? "#fee2e2" : n.priority === "Medium" ? "#dbeafe" : "#dcfce7",
                  color: n.priority === "High" ? "#b91c1c" : n.priority === "Medium" ? "#1d4ed8" : "#156534",
                  padding: "4px 12px", borderRadius: "9999px", fontSize: "11px", fontWeight: "700"
                }}>
                  {n.priority} Priority
                </span>
              </div>
              <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6", margin: "0 0 15px 0" }}>{n.content}</p>
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px", fontSize: "12px", color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
                <span>Broadcast ID: <strong style={{ color: "#475569" }}>{n.id}</strong></span>
                <span>Published: <strong style={{ color: "#475569" }}>{n.date}</strong></span>
              </div>
            </div>
          ))
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

export default function NoticesPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "250px" }}>
        <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #ea580c", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
      </div>
    }>
      <NoticesContent />
    </Suspense>
  );
}
