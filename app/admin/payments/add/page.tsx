"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreatePaymentMutation } from "@/store/api/paymentsApi";
import { useGetCompaniesQuery } from "@/store/api/companiesApi";

export default function AddPaymentPage() {
  const router = useRouter();

  // Form states
  const [pmtCompany, setPmtCompany] = useState("");
  const [pmtMethod, setPmtMethod] = useState("Bank Transfer");
  const [pmtAmount, setPmtAmount] = useState(0);
  const [pmtCurrency, setPmtCurrency] = useState("SAR");
  const [roe, setRoe] = useState(1);
  const [amountInCurrency, setAmountInCurrency] = useState(0);

  // Bank & Reference
  const [bankFrom, setBankFrom] = useState("");
  const [bankTo, setBankTo] = useState("");
  const [reference, setReference] = useState("");

  // Attachments
  const [screenshot1, setScreenshot1] = useState("");
  const [file1, setFile1] = useState("");
  const [folder1, setFolder1] = useState("");

  // Notes
  const [internalNotes, setInternalNotes] = useState("");
  const [externalNotes, setExternalNotes] = useState("");

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

  // Queries & Mutations
  const { data: companiesData, isLoading: companiesLoading } = useGetCompaniesQuery(undefined);
  const [createPayment, { isLoading: isCreating }] = useCreatePaymentMutation();

  const companies = Array.isArray(companiesData)
    ? companiesData
    : (Array.isArray((companiesData as any)?.data) ? (companiesData as any).data : []);

  // Update amount in currency based on ROE & SAR amount
  useEffect(() => {
    setAmountInCurrency(pmtAmount * roe);
  }, [pmtAmount, roe]);

  // Set default ROE based on currency selection
  useEffect(() => {
    if (pmtCurrency === "SAR") setRoe(1);
    else if (pmtCurrency === "PKR") setRoe(74.5);
    else if (pmtCurrency === "USD") setRoe(0.27);
  }, [pmtCurrency]);

  const handleAddPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pmtCompany) {
      showToast("Please select a corporate depositor.", "error");
      return;
    }
    if (pmtAmount <= 0) {
      showToast("Amount must be greater than zero.", "error");
      return;
    }

    try {
      const payload = {
        company: pmtCompany,
        method: pmtMethod,
        amount: pmtAmount,
        currency: pmtCurrency,
        // Optional/additional details are simulated/saved inside standard logs or parameters
        bank_from: bankFrom,
        bank_to: bankTo,
        reference: reference,
        notes: internalNotes || externalNotes,
        date: new Date().toISOString().split("T")[0],
      };

      await createPayment(payload).unwrap();
      showToast("General payment registered! Awaiting audit verification.", "success");
      setTimeout(() => {
        router.push("/admin/payments");
      }, 1000);
    } catch (err: any) {
      console.error(err);
      showToast(err?.data?.message || "Failed to register payment.", "error");
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

      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)" }}>
        <div>
          <h2>Register General Payment / Deposit</h2>
          <p>Add cash receipts, bank transfer deposits, and reference documents to corporate accounts.</p>
        </div>
        <button onClick={() => router.push("/admin/payments")} className="form-btn-back">
          <i className="fas fa-arrow-left"></i>
          <span>Back to Payments</span>
        </button>
      </div>

      <div className="form-card">
        {companiesLoading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            <div className="spinner" style={{ borderTopColor: "#0d9488" }}></div>
            <p style={{ marginTop: "10px", fontWeight: "600" }}>Loading corporate accounts...</p>
          </div>
        ) : (
          <form onSubmit={handleAddPaymentSubmit} style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
            
            {/* Section 1: Basic Info */}
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0f766e", borderBottom: "2px solid #f1f5f9", paddingBottom: "8px", marginBottom: "15px" }}>
                <i className="fas fa-money-bill-wave" style={{ marginRight: "8px" }}></i> Basic Payment Information
              </h3>
              <div className="form-grid">
                <div>
                  <label className="form-label">Depositor Corporate *</label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-building form-icon"></i>
                    <select className="form-input form-select" value={pmtCompany} onChange={(e) => setPmtCompany(e.target.value)} required>
                      <option value="">Select corporate account...</option>
                      {companies.map((c: any) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    <i className="fas fa-chevron-down select-arrow"></i>
                  </div>
                </div>

                <div>
                  <label className="form-label">Currency *</label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-money-bill-1-wave form-icon"></i>
                    <select className="form-input form-select" value={pmtCurrency} onChange={(e) => setPmtCurrency(e.target.value)}>
                      <option value="SAR">Saudi Riyal (SAR)</option>
                      <option value="PKR">Pakistani Rupee (PKR)</option>
                      <option value="USD">US Dollar (USD)</option>
                    </select>
                    <i className="fas fa-chevron-down select-arrow"></i>
                  </div>
                </div>

                <div>
                  <label className="form-label">Payment Amount (SAR) *</label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-coins form-icon"></i>
                    <input type="number" step="0.01" className="form-input" placeholder="0.00" value={pmtAmount || ""} onChange={(e) => setPmtAmount(parseFloat(e.target.value) || 0)} required />
                  </div>
                </div>

                <div>
                  <label className="form-label">Rate of Exchange (ROE)</label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-percent form-icon"></i>
                    <input type="number" step="0.0001" className="form-input" placeholder="1.0000" value={roe || ""} onChange={(e) => setRoe(parseFloat(e.target.value) || 1)} />
                  </div>
                </div>

                <div>
                  <label className="form-label">Amount in Selected Currency</label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-calculator form-icon"></i>
                    <input type="text" className="form-input" value={amountInCurrency.toFixed(2)} readOnly style={{ background: "#f8fafc", fontWeight: "600" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Account Info */}
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0f766e", borderBottom: "2px solid #f1f5f9", paddingBottom: "8px", marginBottom: "15px" }}>
                <i className="fas fa-university" style={{ marginRight: "8px" }}></i> Account & Gateway Info
              </h3>
              <div className="form-grid">
                <div>
                  <label className="form-label">Payment Gateway Method *</label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-credit-card form-icon"></i>
                    <select className="form-input form-select" value={pmtMethod} onChange={(e) => setPmtMethod(e.target.value)}>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash Receipt">Cash Deposit (Physical)</option>
                      <option value="Online Gateway">Online Checkout Card</option>
                    </select>
                    <i className="fas fa-chevron-down select-arrow"></i>
                  </div>
                </div>

                <div>
                  <label className="form-label">Bank Transferred From</label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-arrow-right-from-bracket form-icon"></i>
                    <input type="text" className="form-input" placeholder="e.g. Al-Rajhi Bank" value={bankFrom} onChange={(e) => setBankFrom(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="form-label">Receiving Bank / Wallet</label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-arrow-right-to-bracket form-icon"></i>
                    <input type="text" className="form-input" placeholder="e.g. SNB Al-Ahli" value={bankTo} onChange={(e) => setBankTo(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="form-label">Payment Gateway Reference</label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-hashtag form-icon"></i>
                    <input type="text" className="form-input" placeholder="e.g. TXN-9823489234" value={reference} onChange={(e) => setReference(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Attachments & Links */}
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0f766e", borderBottom: "2px solid #f1f5f9", paddingBottom: "8px", marginBottom: "15px" }}>
                <i className="fas fa-paperclip" style={{ marginRight: "8px" }}></i> Attachments & Screenshots
              </h3>
              <div className="form-grid">
                <div>
                  <label className="form-label">Screenshot / Receipt Image Link</label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-image form-icon"></i>
                    <input type="text" className="form-input" placeholder="https://..." value={screenshot1} onChange={(e) => setScreenshot1(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="form-label">PDF / Document File Link</label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-file-pdf form-icon"></i>
                    <input type="text" className="form-input" placeholder="https://..." value={file1} onChange={(e) => setFile1(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="form-label">Associated Drive Folder Link</label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-folder-open form-icon"></i>
                    <input type="text" className="form-input" placeholder="https://drive.google.com/..." value={folder1} onChange={(e) => setFolder1(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Notes */}
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0f766e", borderBottom: "2px solid #f1f5f9", paddingBottom: "8px", marginBottom: "15px" }}>
                <i className="fas fa-comment-dots" style={{ marginRight: "8px" }}></i> Auditor Remarks & Notes
              </h3>
              <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div>
                  <label className="form-label">Internal Remarks (Admin Only)</label>
                  <textarea className="form-input" rows={3} style={{ height: "auto", resize: "none" }} placeholder="Enter private auditor remarks..." value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
                </div>

                <div>
                  <label className="form-label">External Remarks (Shown to Corporate)</label>
                  <textarea className="form-input" rows={3} style={{ height: "auto", resize: "none" }} placeholder="Enter remarks visible to company users..." value={externalNotes} onChange={(e) => setExternalNotes(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="form-submit-row">
              <button type="submit" disabled={isCreating} className="btn-submit" style={{ background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)", padding: "12px 30px" }}>
                {isCreating ? "Registering Deposit..." : "Save General Payment Record"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
