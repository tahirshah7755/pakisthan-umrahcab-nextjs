"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetNoticesQuery } from "@/store/api/noticesApi";

interface NoticeItem {
  id: string | number;
  custom_id?: string;
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

  // RTK Query hook fetching notices by target
  const { data: noticesResponse, isLoading } = useGetNoticesQuery(activeTab);

  // Parse response list
  const noticesList: NoticeItem[] = Array.isArray(noticesResponse)
    ? noticesResponse
    : (noticesResponse && typeof noticesResponse === "object" && Array.isArray((noticesResponse as any).data)
        ? (noticesResponse as any).data
        : []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
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
            onClick={() => router.push("/admin/hub")} 
            style={{ background: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", padding: "10px 18px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <i className="fas fa-arrow-left"></i>
            <span>Back to Hub</span>
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
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
            <div className="spinner" style={{ borderTopColor: activeTab === "Agent" ? "#ea580c" : "#ca8a04" }}></div>
          </div>
        ) : noticesList.length === 0 ? (
          <div className="form-card" style={{ background: "#ffffff", padding: "50px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", textAlign: "center", color: "#64748b" }}>
            <i className="fas fa-folder-open" style={{ fontSize: "40px", color: "#cbd5e1", marginBottom: "15px", display: "block" }}></i>
            <span style={{ fontSize: "14px" }}>No active announcements published on this board.</span>
          </div>
        ) : (
          noticesList.map((n) => (
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
                <span>Broadcast ID: <strong style={{ color: "#475569" }}>{n.custom_id || `NTC-${n.id}`}</strong></span>
                <span>Published: <strong style={{ color: "#475569" }}>{n.date}</strong></span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function NoticesPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "250px" }}>
        <div className="spinner" style={{ borderTopColor: "#ea580c" }}></div>
      </div>
    }>
      <NoticesContent />
    </Suspense>
  );
}
