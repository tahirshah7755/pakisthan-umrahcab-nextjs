"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateFollowupMutation } from "@/store/api/followupsApi";
import { useGetCompaniesQuery } from "@/store/api/companiesApi";
import { useGetCustomersQuery } from "@/store/api/customersApi";
import { getSaudiTodayDate } from "@/utils/formatters";

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

export default function AddFollowupPage() {
  const router = useRouter();

  // RTK Query Hooks
  const { data: companiesData, isLoading: loadingCompanies } = useGetCompaniesQuery(undefined);
  const { data: customersData, isLoading: loadingCustomers } = useGetCustomersQuery(undefined);
  const [createFollowup, { isLoading: isCreating }] = useCreateFollowupMutation();

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
  const [formDate, setFormDate] = useState(getSaudiTodayDate());
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formCompany || !formContact || !formRemarks) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    try {
      // Serialize all custom legacy fields inside the notes JSON
      const notesPayload = JSON.stringify({
        remarks: formRemarks,
        rating: formRating,
        company: formCompany,
        payment_amount: formPaymentAmount ? Number(formPaymentAmount) : null,
        next_followup_date: formNextFollowupDate || null,
      });

      const payload = {
        title: formTitle,
        agent: formCompany,
        contact: formContact,
        date: formDate,
        status: formStatus,
        notes: notesPayload,
        customer_id: formCustomerId ? Number(formCustomerId) : null,
      };

      await createFollowup(payload).unwrap();
      showToast("Follow-up logged successfully!", "success");
      setTimeout(() => {
        router.push("/admin/agent-followups");
      }, 1500);
    } catch (err: any) {
      console.error(err);
      showToast(err?.data?.message || "Failed to log followup.", "error");
    }
  };

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
          <h2>Add New Agent Follow-up</h2>
          <p>Register a new task log to follow-up on broker vouchers, pickups or payments.</p>
        </div>
        <button onClick={() => router.push("/admin/agent-followups")} className="form-btn-back">
          <i className="fas fa-arrow-left"></i>
          <span>Back to List</span>
        </button>
      </div>

      {/* Form Card */}
      <div style={{ maxWidth: "600px", margin: "0 auto", width: "100%" }}>
        <div className="form-card" style={{ padding: "30px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Row 1: Company & Customer Selector */}
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
                  placeholder="e.g. 050123456" 
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
                placeholder="e.g. Confirm Zahid Travels pickup window" 
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
                placeholder="Type summary of conversation Remarks..." 
                value={formRemarks} 
                onChange={(e) => setFormRemarks(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "20px", marginTop: "10px" }}>
              <button 
                type="button" 
                onClick={() => router.push("/admin/agent-followups")} 
                style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 20px", fontWeight: "600", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isCreating}
                style={{ background: "#0f172a", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 24px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
              >
                {isCreating ? (
                  <div className="spinner" style={{ width: "14px", height: "14px", borderWidth: "2px", borderTopColor: "#ffffff" }}></div>
                ) : (
                  <i className="fas fa-save"></i>
                )}
                <span>Save Interaction</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
