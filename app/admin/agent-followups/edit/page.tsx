"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetFollowupQuery, useUpdateFollowupMutation } from "@/store/api/followupsApi";
import { useGetCompaniesQuery } from "@/store/api/companiesApi";
import { useGetCustomersQuery } from "@/store/api/customersApi";

interface RatingSelectorProps {
  rating: number;
  onChange: (r: number) => void;
}

const RatingStars: React.FC<RatingSelectorProps> = ({ rating, onChange }) => {
  return (
    <div style={{ display: "flex", gap: "6px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={star <= rating ? "fas fa-star" : "far fa-star"}
          onClick={() => onChange(star)}
          style={{
            color: star <= rating ? "#ffc107" : "#cbd5e1",
            cursor: "pointer",
            fontSize: "18px",
            transition: "color 0.2s ease",
          }}
        />
      ))}
    </div>
  );
};

function FollowupEditContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  // RTK Query Hooks
  const { data: followup, isLoading: loadingFollowup, error } = useGetFollowupQuery(id, { skip: !id });
  const { data: companiesData, isLoading: loadingCompanies } = useGetCompaniesQuery(undefined);
  const { data: customersData, isLoading: loadingCustomers } = useGetCustomersQuery(undefined);
  const [updateFollowup, { isLoading: isUpdating }] = useUpdateFollowupMutation();

  const followupItem = followup?.data || followup;

  const companies = Array.isArray(companiesData)
    ? companiesData
    : (companiesData && typeof companiesData === "object" && Array.isArray((companiesData as any).data) ? (companiesData as any).data : []);

  const customers = Array.isArray(customersData)
    ? customersData
    : (customersData && typeof customersData === "object" && Array.isArray((customersData as any).data) ? (customersData as any).data : []);

  // Form State matching all legacy PHP fields
  const [formTitle, setFormTitle] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formStatus, setFormStatus] = useState("Pending");
  
  // Custom serialized fields in notes
  const [formPaymentAmount, setFormPaymentAmount] = useState("");
  const [formNextFollowupDate, setFormNextFollowupDate] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formRemarks, setFormRemarks] = useState("");

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  // Populate state on load
  useEffect(() => {
    if (followupItem && id) {
      setFormTitle(followupItem.title || "");
      setFormContact(followupItem.contact || "");
      setFormDate(followupItem.date || "");
      setFormStatus(followupItem.status || "Pending");
      setFormCustomerId(followupItem.customer_id ? String(followupItem.customer_id) : "");

      // Parse notes for custom fields
      let remarksText = followupItem.notes || "";
      let rateScore = 5;
      let compName = followupItem.agent || "";
      let paymentAmt = "";
      let nextDate = "";

      try {
        if (followupItem.notes && (followupItem.notes.startsWith("{") || followupItem.notes.startsWith("["))) {
          const parsed = JSON.parse(followupItem.notes);
          remarksText = parsed.remarks || "";
          rateScore = Number(parsed.rating || 5);
          compName = parsed.company || followupItem.agent || "";
          paymentAmt = parsed.payment_amount !== undefined && parsed.payment_amount !== null ? String(parsed.payment_amount) : "";
          nextDate = parsed.next_followup_date || "";
        }
      } catch (e) {}

      setFormRemarks(remarksText);
      setFormRating(rateScore);
      setFormCompany(compName);
      setFormPaymentAmount(paymentAmt);
      setFormNextFollowupDate(nextDate);
    }
  }, [followupItem, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!formTitle || !formCompany || !formContact) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    try {
      // Serialize all legacy custom fields inside the notes JSON
      const notesPayload = JSON.stringify({
        remarks: formRemarks,
        rating: formRating,
        company: formCompany,
        payment_amount: formPaymentAmount ? Number(formPaymentAmount) : null,
        next_followup_date: formNextFollowupDate || null,
      });

      const payload = {
        id,
        title: formTitle,
        agent: formCompany,
        contact: formContact,
        date: formDate,
        status: formStatus,
        notes: notesPayload,
        customer_id: formCustomerId ? Number(formCustomerId) : null,
      };

      await updateFollowup(payload).unwrap();
      showToast("Follow-up entry updated successfully!", "success");
      setTimeout(() => {
        router.push(`/admin/agent-followups/view?id=${id}`);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      showToast("Failed to update follow-up log.", "error");
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

  if (loadingFollowup) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <div className="spinner" style={{ borderTopColor: "#1e5cff" }}></div>
        <span style={{ marginLeft: "12px", color: "#64748b", fontWeight: "600" }}>Loading interaction...</span>
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {toast.show && (
        <div style={{
          position: "fixed", top: "25px", right: "25px", zIndex: 99999,
          background: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "#ffffff", padding: "14px 28px", borderRadius: "10px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)", fontWeight: "600",
          fontSize: "14px", display: "flex", alignItems: "center", gap: "10px",
        }}>
          <i className={toast.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #1e5cff 0%, #0040e6 100%)" }}>
        <div>
          <h2>Edit Agent Follow-up</h2>
          <p>Update subject, dates, satisfaction rating or remarks for this interaction log.</p>
        </div>
        <button onClick={() => router.push(`/admin/agent-followups/view?id=${id}`)} className="form-btn-back">
          <i className="fas fa-arrow-left"></i>
          <span>Cancel & Back</span>
        </button>
      </div>

      {/* Form Card */}
      <div style={{ maxWidth: "600px", margin: "0 auto", width: "100%" }}>
        <div className="form-card" style={{ padding: "30px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Row 1: Company Selector & Customer Selector */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <label className="form-label" style={{ fontWeight: "700" }}>Assign to Company <span style={{ color: "#ef4444" }}>*</span></label>
                <select 
                  className="form-input" 
                  style={{ width: "100%", padding: "10px 12px" }}
                  required
                  value={formCompany} 
                  onChange={(e) => setFormCompany(e.target.value)}
                >
                  <option value="">-- Choose Company --</option>
                  {loadingCompanies ? (
                    <option disabled>Loading companies list...</option>
                  ) : (
                    companies.map((c: any) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: "700" }}>Link to Customer (Optional)</label>
                <select 
                  className="form-input" 
                  style={{ width: "100%", padding: "10px 12px" }}
                  value={formCustomerId} 
                  onChange={(e) => setFormCustomerId(e.target.value)}
                >
                  <option value="">-- No Customer Selected --</option>
                  {loadingCustomers ? (
                    <option disabled>Loading customers...</option>
                  ) : (
                    customers.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone || c.email})</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Row 2: Follow-up Date & Status Selector */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <label className="form-label" style={{ fontWeight: "700" }}>Follow-up Date <span style={{ color: "#ef4444" }}>*</span></label>
                <input 
                  type="date" 
                  className="form-input" 
                  style={{ width: "100%" }}
                  required 
                  value={formDate} 
                  onChange={(e) => setFormDate(e.target.value)} 
                />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: "700" }}>Follow-up Status <span style={{ color: "#ef4444" }}>*</span></label>
                <select 
                  className="form-input" 
                  style={{ width: "100%" }}
                  required
                  value={formStatus} 
                  onChange={(e) => setFormStatus(e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="Awaiting FeedBack">Awaiting FeedBack</option>
                  <option value="Not Followed">Not Followed</option>
                  <option value="Followed Up">Followed Up</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>

            {/* Row 3: Payment Amount & Next Follow-up Date */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <label className="form-label" style={{ fontWeight: "700" }}>Payment Amount</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="e.g. 100.00"
                  className="form-input" 
                  style={{ width: "100%" }}
                  value={formPaymentAmount} 
                  onChange={(e) => setFormPaymentAmount(e.target.value)} 
                />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: "700" }}>Next Follow-up Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  style={{ width: "100%" }}
                  value={formNextFollowupDate} 
                  onChange={(e) => setFormNextFollowupDate(e.target.value)} 
                />
              </div>
            </div>

            {/* Row 4: Phone Contact & Agent Rating */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <label className="form-label" style={{ fontWeight: "700" }}>Follow-up Phone / Contact <span style={{ color: "#ef4444" }}>*</span></label>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ width: "100%" }}
                  required 
                  value={formContact} 
                  onChange={(e) => setFormContact(e.target.value)} 
                />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: "700", marginBottom: "8px", display: "block" }}>Outcome / Satisfaction Rating</label>
                <RatingStars rating={formRating} onChange={setFormRating} />
              </div>
            </div>

            {/* Row 5: Subject Title */}
            <div>
              <label className="form-label" style={{ fontWeight: "700" }}>Subject / Title <span style={{ color: "#ef4444" }}>*</span></label>
              <input 
                type="text" 
                className="form-input" 
                style={{ width: "100%" }}
                required 
                value={formTitle} 
                onChange={(e) => setFormTitle(e.target.value)} 
              />
            </div>

            {/* Row 6: Remarks Summary */}
            <div>
              <label className="form-label" style={{ fontWeight: "700" }}>Remarks & Details Notes <span style={{ color: "#ef4444" }}>*</span></label>
              <textarea 
                className="form-input" 
                style={{ width: "100%", height: "110px", resize: "none" }}
                required
                placeholder="Type summary of conversation remarks..."
                value={formRemarks} 
                onChange={(e) => setFormRemarks(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "20px", marginTop: "10px" }}>
              <button 
                type="button" 
                onClick={() => router.push(`/admin/agent-followups/view?id=${id}`)} 
                style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 20px", fontWeight: "600", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isUpdating}
                style={{ background: "#0d6efd", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 24px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
              >
                {isUpdating ? (
                  <div className="spinner" style={{ width: "14px", height: "14px", borderWidth: "2px", borderTopColor: "#ffffff" }}></div>
                ) : (
                  <i className="fas fa-check"></i>
                )}
                <span>Update Follow-up</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function EditFollowupPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <div className="spinner" style={{ borderTopColor: "#1e5cff" }}></div>
        <span style={{ marginLeft: "12px", color: "#64748b", fontWeight: "600" }}>Loading...</span>
      </div>
    }>
      <FollowupEditContent />
    </Suspense>
  );
}
