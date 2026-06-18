"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreateNoticeMutation } from "@/store/api/noticesApi";

function AddNoticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetGroup = searchParams.get("target") === "agent" ? "Agent" : "Admin";

  const [ntcTitle, setNtcTitle] = useState("");
  const [ntcPriority, setNtcPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [ntcContent, setNtcContent] = useState("");

  // RTK Query mutation hook
  const [createNotice, { isLoading: submitting }] = useCreateNoticeMutation();

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

  const handleAddNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ntcTitle || !ntcContent) {
      showToast("Please fill all required notice fields.", "error");
      return;
    }
    try {
      const newNotice = {
        title: ntcTitle,
        priority: ntcPriority,
        target: targetGroup,
        content: ntcContent
      };
      
      const res = await createNotice(newNotice).unwrap();
      const isSuccess = res && (res.success || res.data || res.title || (typeof res === "object" && Object.keys(res).length > 0));
      
      if (isSuccess) {
        showToast("System announcement published successfully!", "success");
        setNtcTitle(""); 
        setNtcContent("");
        setTimeout(() => {
          router.push(`/admin/notices?tab=${targetGroup.toLowerCase()}`);
        }, 1000);
      } else {
        showToast("Failed to publish announcement notice.", "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast(err?.data?.message || "Failed to publish announcement notice.", "error");
    }
  };

  const isAgent = targetGroup === "Agent";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
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

      {/* Header Card */}
      <div className="form-header-card" style={{ 
        background: isAgent ? "linear-gradient(135deg, #ea580c 0%, #f97316 100%)" : "linear-gradient(135deg, #ca8a04 0%, #eab308 100%)", 
        padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" 
      }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Publish Announcement Notice</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>
            Draft a notice to distribute to the {isAgent ? "Company Agents" : "Administrative staff"}.
          </p>
        </div>
        <button 
          onClick={() => router.push(`/admin/notices?tab=${targetGroup.toLowerCase()}`)} 
          style={{ background: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", padding: "10px 18px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <i className="fas fa-arrow-left"></i>
          <span>Back to Board</span>
        </button>
      </div>

      {/* Form Card */}
      <div className="form-card" style={{ background: "#ffffff", padding: "35px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
        <form onSubmit={handleAddNoticeSubmit} style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          
          <div style={{ width: "100%" }}>
            <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Notice Title *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-bullhorn form-icon" style={{ color: isAgent ? "#ea580c" : "#ca8a04" }}></i>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Announcement subject line..." 
                value={ntcTitle} 
                onChange={(e) => setNtcTitle(e.target.value)} 
                required 
                style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Target Audience Group</label>
              <div className="form-input-wrapper">
                <i className="fas fa-user-group form-icon" style={{ color: "#64748b" }}></i>
                <input 
                  type="text" 
                  className="form-input" 
                  value={isAgent ? "Company Agents Group" : "Administrators / Headquarters"} 
                  readOnly 
                  style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px", background: "#f8fafc", color: "#64748b", fontWeight: "600" }}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Broadcast Priority</label>
              <div className="form-input-wrapper">
                <i className="fas fa-triangle-exclamation form-icon" style={{ color: isAgent ? "#ea580c" : "#ca8a04" }}></i>
                <select 
                  className="form-input form-select" 
                  value={ntcPriority} 
                  onChange={(e) => setNtcPriority(e.target.value as any)}
                  style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority (Red Alert)</option>
                </select>
                <i className="fas fa-chevron-down select-arrow"></i>
              </div>
            </div>
          </div>

          <div style={{ width: "100%" }}>
            <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Notice Broadcast Body *</label>
            <div style={{ position: "relative" }}>
              <i className="fas fa-comment-dots" style={{ position: "absolute", top: "15px", left: "15px", color: isAgent ? "#ea580c" : "#ca8a04", fontSize: "16px" }}></i>
              <textarea 
                className="form-input" 
                placeholder="Draft announcement details and broadcast content..." 
                value={ntcContent} 
                onChange={(e) => setNtcContent(e.target.value)} 
                required 
                rows={5}
                style={{ border: "1px solid #cbd5e1", borderRadius: "6px", paddingLeft: "45px", paddingTop: "12px", height: "150px", width: "100%" }}
              />
            </div>
          </div>

          <div style={{ marginTop: "15px" }}>
            <button 
              type="submit" 
              className="btn-submit" 
              style={{ 
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", width: "100%", 
                background: isAgent ? "#ea580c" : "#ca8a04", height: "50px", fontWeight: "600", fontSize: "15px", cursor: "pointer", border: "none", borderRadius: "6px", color: "#ffffff"
              }} 
              disabled={submitting}
            >
              <i className="fas fa-bullhorn"></i>
              <span>{submitting ? "Publishing..." : "Publish Announcement"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AddNoticePage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "250px" }}>
        <div className="spinner" style={{ borderTopColor: "#ea580c" }}></div>
      </div>
    }>
      <AddNoticeContent />
    </Suspense>
  );
}
