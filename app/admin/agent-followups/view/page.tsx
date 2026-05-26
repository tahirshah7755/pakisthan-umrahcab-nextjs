"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetFollowupQuery, useDeleteFollowupMutation } from "@/store/api/followupsApi";

const RatingStars = ({ rating }: { rating: number }) => {
  return (
    <div style={{ display: "flex", gap: "6px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={star <= rating ? "fas fa-star" : "far fa-star"}
          style={{
            color: star <= rating ? "#ffc107" : "#cbd5e1",
            fontSize: "18px",
          }}
        />
      ))}
    </div>
  );
};

function FollowupViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const { data: followup, isLoading, error } = useGetFollowupQuery(id, {
    skip: !id,
  });
  const [deleteFollowup] = useDeleteFollowupMutation();

  // Extract nested followup item safely
  const followupItem = followup?.data || followup;

  // Read the preloaded relational customer directly from followupItem
  const customer = followupItem?.customer;

  const handleDelete = async () => {
    if (!id) return;
    if (confirm("Are you sure you want to delete this follow-up entry?")) {
      try {
        await deleteFollowup(id).unwrap();
        router.push("/admin/agent-followups");
      } catch (err) {
        alert("Failed to delete follow-up entry.");
      }
    }
  };

  if (!id) {
    return (
      <div className="form-card" style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "#ef4444", fontWeight: "700" }}>Error: Missing Follow-up ID parameter in URL.</p>
        <button onClick={() => router.push("/admin/agent-followups")} className="btn-submit" style={{ padding: "10px 20px", marginTop: "15px" }}>
          Back to List
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <div className="spinner" style={{ borderTopColor: "#1e5cff" }}></div>
        <span style={{ marginLeft: "12px", color: "#64748b", fontWeight: "600" }}>Loading details...</span>
      </div>
    );
  }

  if (error || !followupItem) {
    return (
      <div className="form-card" style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "#ef4444", fontWeight: "700" }}>Error: Follow-up interaction not found or database is unreachable.</p>
        <button onClick={() => router.push("/admin/agent-followups")} className="btn-submit" style={{ padding: "10px 20px", marginTop: "15px" }}>
          Back to List
        </button>
      </div>
    );
  }

  // Parse notes
  let remarks = followupItem.notes || "";
  let rating = 5;
  let company = followupItem.agent || "";
  let paymentAmount = "";
  let nextFollowupDate = "";

  try {
    if (followupItem.notes && (followupItem.notes.startsWith("{") || followupItem.notes.startsWith("["))) {
      const parsed = JSON.parse(followupItem.notes);
      remarks = parsed.remarks || "";
      rating = parsed.rating || 5;
      company = parsed.company || followupItem.agent || "";
      paymentAmount = parsed.payment_amount !== undefined && parsed.payment_amount !== null ? String(parsed.payment_amount) : "";
      nextFollowupDate = parsed.next_followup_date || "";
    }
  } catch (e) {}

  // Set beautiful Muhabiya badges for all 5 custom statuses
  const getStatusStyle = (statusStr: string) => {
    switch (statusStr) {
      case "Pending":
        return { bg: "rgba(249, 115, 22, 0.1)", fg: "#f97316" };
      case "Awaiting FeedBack":
        return { bg: "rgba(234, 179, 8, 0.1)", fg: "#eab308" };
      case "Not Followed":
        return { bg: "rgba(244, 63, 94, 0.1)", fg: "#f43f5e" };
      case "Followed Up":
        return { bg: "rgba(111, 66, 193, 0.1)", fg: "#6f42c1" };
      case "Done":
        return { bg: "rgba(16, 185, 129, 0.1)", fg: "#10b981" };
      default:
        return { bg: "rgba(100, 116, 139, 0.1)", fg: "#64748b" };
    }
  };

  const statusStyle = getStatusStyle(followupItem.status || "Pending");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header Card */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #1e5cff 0%, #0040e6 100%)" }}>
        <div>
          <h2>Agent Follow-up Interaction</h2>
          <p>Review the historical records and satisfaction outcomes of broker conversations.</p>
        </div>
        <button onClick={() => router.push("/admin/agent-followups")} className="form-btn-back">
          <i className="fas fa-arrow-left"></i>
          <span>Back to List</span>
        </button>
      </div>

      {/* Split Panel details */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "25px", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
        
        {/* Left Side Panel */}
        <div style={{ 
          background: "linear-gradient(135deg, #1e5cff 0%, #0040e6 100%)", 
          borderRadius: "16px", padding: "30px", color: "#ffffff", 
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)"
        }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", background: "rgba(255, 255, 255, 0.2)", padding: "4px 10px", borderRadius: "4px" }}>
              Active Interaction Log
            </span>
            <h3 style={{ fontSize: "22px", fontWeight: "800", margin: "20px 0 5px 0" }}>
              {company}
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "rgba(255, 255, 255, 0.8)" }}>
              Follow-up ID: {followupItem.custom_id || `#FLP-${followupItem.id}`}
            </p>

            {/* Linked Customer Relational Display */}
            {customer && (
              <div style={{
                background: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "12px",
                padding: "16px",
                marginTop: "25px",
                boxShadow: "inset 0 1px 3px rgba(255,255,255,0.05)"
              }}>
                <span style={{ fontSize: "10px", fontWeight: "800", color: "rgba(255, 255, 255, 0.75)", textTransform: "uppercase", display: "block", letterSpacing: "0.5px" }}>
                  Linked Customer Profile
                </span>
                <span style={{ fontSize: "15px", fontWeight: "800", color: "#ffffff", display: "block", marginTop: "6px" }}>
                  {customer.name}
                </span>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", display: "block", marginTop: "3px", fontFamily: "monospace" }}>
                  {customer.phone || customer.email || "No phone listed"}
                </span>
                <button 
                  onClick={() => router.push(`/admin/customers/view?id=${customer.id}`)}
                  style={{
                    width: "100%",
                    marginTop: "12px",
                    background: "#ffffff",
                    color: "#0040e6",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px",
                    fontSize: "12px",
                    fontWeight: "800",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.08)"
                  }}
                >
                  <i className="fas fa-user-circle"></i>
                  <span>View Customer File</span>
                </button>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "40px" }}>
            <button 
              onClick={() => router.push(`/admin/agent-followups/edit?id=${id}`)}
              style={{ 
                flex: 1, background: "#ffffff", color: "#0040e6", border: "none", 
                borderRadius: "8px", padding: "10px 15px", fontWeight: "700", 
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" 
              }}
            >
              <i className="fas fa-pen"></i>
              <span>Edit Logs</span>
            </button>
            <button 
              onClick={handleDelete}
              style={{ 
                background: "rgba(239, 68, 68, 0.2)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", 
                borderRadius: "8px", padding: "10px 15px", fontWeight: "600", 
                cursor: "pointer" 
              }}
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="form-card" style={{ padding: "30px", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "15px" }}>
            <span
              style={{
                display: "inline-block",
                padding: "6px 16px",
                borderRadius: "9999px",
                fontSize: "11px",
                fontWeight: "700",
                textTransform: "uppercase",
                background: statusStyle.bg,
                color: statusStyle.fg,
              }}
            >
              {followupItem.status || "Pending"}
            </span>

            <RatingStars rating={rating} />
          </div>

          {/* Details Grid Container */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            
            {/* Field 1: Interaction Date */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#0040e6" }}>
                <i className="fas fa-calendar-alt"></i>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", display: "block", fontWeight: "600" }}>INTERACTION DATE</span>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>{followupItem.date}</span>
              </div>
            </div>

            {/* Field 2: Contact Phone */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#0040e6" }}>
                <i className="fas fa-phone"></i>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", display: "block", fontWeight: "600" }}>CONTACT PHONE</span>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", fontFamily: "monospace" }}>{followupItem.contact}</span>
              </div>
            </div>

            {/* Field 3: Payment Amount */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#0040e6" }}>
                <i className="fas fa-wallet"></i>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", display: "block", fontWeight: "600" }}>PAYMENT AMOUNT</span>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                  {paymentAmount ? `${Number(paymentAmount).toFixed(2)} SAR` : "0.00 SAR"}
                </span>
              </div>
            </div>

            {/* Field 4: Next Follow-up Date */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#0040e6" }}>
                <i className="fas fa-clock"></i>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", display: "block", fontWeight: "600" }}>NEXT FOLLOW-UP DATE</span>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                  {nextFollowupDate || "None scheduled"}
                </span>
              </div>
            </div>

          </div>

          <div>
            <span style={{ fontSize: "11px", color: "#64748b", display: "block", fontWeight: "600", marginBottom: "4px" }}>SUBJECT / TITLE</span>
            <span style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b" }}>{followupItem.title}</span>
          </div>

          <div>
            <span style={{ fontSize: "11px", color: "#64748b", display: "block", fontWeight: "600", marginBottom: "8px" }}>REMARKS SUMMARY</span>
            <div style={{ 
              background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", 
              padding: "15px", fontSize: "13px", color: "#334155", lineHeight: "1.6",
              minHeight: "100px", whiteSpace: "pre-wrap"
            }}>
              {remarks || "No summary remarks provided."}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", fontSize: "11px", color: "#94a3b8", borderTop: "1px solid #f1f5f9", paddingTop: "15px" }}>
            <span>Created at: {followupItem.created_at ? new Date(followupItem.created_at).toLocaleString() : followupItem.date}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ViewFollowupPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <div className="spinner" style={{ borderTopColor: "#1e5cff" }}></div>
        <span style={{ marginLeft: "12px", color: "#64748b", fontWeight: "600" }}>Loading...</span>
      </div>
    }>
      <FollowupViewContent />
    </Suspense>
  );
}
