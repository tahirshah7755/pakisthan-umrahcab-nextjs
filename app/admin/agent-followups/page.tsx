"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";

interface FollowupItem {
  id: string;
  title: string;
  agent: string;
  contact: string;
  date: string;
  status: string;
  notes: string;
}

export default function AgentFollowupsPage() {
  const router = useRouter();
  const [followups, setFollowups] = useState<FollowupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFollowupModal, setShowFollowupModal] = useState(false);

  // Form states
  const [flpTitle, setFlpTitle] = useState("");
  const [flpAgent, setFlpAgent] = useState("umrahcab");
  const [flpContact, setFlpContact] = useState("");
  const [flpDate, setFlpDate] = useState("2026-05-25");
  const [flpNotes, setFlpNotes] = useState("");

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

  const loadFollowups = async () => {
    try {
      setLoading(true);
      const flpList = await api.getFollowups();
      if (flpList) {
        setFollowups(flpList.map((f: any) => ({
          id: f.custom_id || `#FLP-${f.id}`,
          title: f.title,
          agent: f.agent,
          contact: f.contact,
          date: f.date,
          status: f.status,
          notes: f.notes
        })));
      } else {
        // Seed default fallback
        setFollowups([
          { id: "#FLP-1", title: "Confirm Zahid Travels pickup window", agent: "umrahcab", contact: "050123456", date: "2026-05-25", status: "Pending", notes: "Call by 3:00 PM" }
        ]);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch followups", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowups();
  }, []);

  const handleAddFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flpTitle || !flpContact) {
      showToast("Please enter a subject and contact number.", "error");
      return;
    }
    try {
      const newFlp = {
        title: flpTitle,
        agent: flpAgent,
        contact: flpContact,
        date: flpDate,
        notes: flpNotes
      };
      const res = await api.createFollowup(newFlp);
      if (res.success) {
        showToast("Followup logged successfully in database!", "success");
        setFlpTitle("");
        setFlpContact("");
        setFlpNotes("");
        setShowFollowupModal(false);
        await loadFollowups();
      } else {
        showToast("Failed to save follow-up.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to log follow-up.", "error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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

      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)" }}>
        <div>
          <h2>Agent & Broker Follow-ups</h2>
          <p>Keep track of pending calls, voucher delivery confirmations, and client feedback requests.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setShowFollowupModal(true)} className="form-btn-back">
            <i className="fas fa-plus"></i>
            <span>New Follow-up Task</span>
          </button>
          <button onClick={() => router.push("/admin/hub")} className="form-btn-back">
            <i className="fas fa-arrow-left"></i>
            <span>Back to Hub</span>
          </button>
        </div>
      </div>

      <div className="table-card" style={{ padding: "25px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
            <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #0f766e", borderRadius: "50%", width: "35px", height: "35px", animation: "spin 1s linear infinite" }}></div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="db-table">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Subject</th>
                  <th>Assigned Agent</th>
                  <th>Phone / Contact</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {followups.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                      No followup records found in the database.
                    </td>
                  </tr>
                ) : (
                  followups.map((f) => (
                    <tr key={f.id}>
                      <td style={{ fontWeight: 700 }}>{f.id}</td>
                      <td style={{ fontWeight: 600 }}>{f.title}</td>
                      <td>{f.agent}</td>
                      <td>{f.contact}</td>
                      <td>{f.date}</td>
                      <td>
                        <span className={`status-pill ${f.status === "Pending" ? "pending" : "completed"}`}>{f.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Followup Modal */}
      {showFollowupModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "500px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            overflow: "hidden",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{
              background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
              padding: "20px",
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Log New Follow-up Task</h3>
              <button onClick={() => setShowFollowupModal(false)} style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer", fontSize: "18px" }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAddFollowup} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "5px" }}>Subject / Title *</label>
                <input type="text" className="form-input" style={{ width: "100%" }} required placeholder="e.g. Confirm pickup timing" value={flpTitle} onChange={(e) => setFlpTitle(e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "5px" }}>Contact Phone *</label>
                <input type="text" className="form-input" style={{ width: "100%" }} required placeholder="e.g. 050123456" value={flpContact} onChange={(e) => setFlpContact(e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: "15px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "5px" }}>Assigned Agent</label>
                  <input type="text" className="form-input" style={{ width: "100%" }} value={flpAgent} onChange={(e) => setFlpAgent(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "5px" }}>Due Date</label>
                  <input type="date" className="form-input" style={{ width: "100%" }} value={flpDate} onChange={(e) => setFlpDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "5px" }}>Additional Remarks</label>
                <textarea className="form-input form-textarea" style={{ width: "100%", height: "80px" }} placeholder="Provide extra detail..." value={flpNotes} onChange={(e) => setFlpNotes(e.target.value)}></textarea>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowFollowupModal(false)} className="form-btn-back" style={{ background: "#f1f5f9", color: "#475569" }}>Cancel</button>
                <button type="submit" className="btn-submit" style={{ padding: "10px 20px" }}>Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
}
