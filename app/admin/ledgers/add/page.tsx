"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateLedgerMutation } from "@/store/api/ledgersApi";
import { useGetCompaniesQuery } from "@/store/api/companiesApi";
import { getSaudiTodayDate } from "@/utils/formatters";

export default function AddLedgerPage() {
  const router = useRouter();

  // Form States
  const [companyName, setCompanyName] = useState("");
  const [entryType, setEntryType] = useState("Credit"); // Debit or Credit
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState("");

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  // RTK Queries & Mutations
  const { data: companiesData, isLoading: companiesLoading } = useGetCompaniesQuery(undefined);
  const [createLedger, { isLoading: isPosting }] = useCreateLedgerMutation();

  const companies = Array.isArray(companiesData)
    ? companiesData
    : (Array.isArray((companiesData as any)?.data) ? (companiesData as any).data : []);

  const handlePostLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) {
      showToast("Please select a target corporate account.", "error");
      return;
    }
    if (amount <= 0) {
      showToast("Amount must be greater than zero.", "error");
      return;
    }
    if (!description.trim()) {
      showToast("Please enter an adjustment narrative.", "error");
      return;
    }

    try {
      const payload = {
        company: companyName,
        date: getSaudiTodayDate(),
        description: description,
        // The Laravel UcLedger model calculates running balance based on debit/credit values
        debit: entryType === "Debit" ? amount : 0,
        credit: entryType === "Credit" ? amount : 0,
      };

      await createLedger(payload).unwrap();
      showToast("Ledger adjustment posted successfully!", "success");
      setTimeout(() => {
        router.push("/admin/ledgers");
      }, 1000);
    } catch (err: any) {
      console.error(err);
      showToast(err?.data?.message || "Failed to post ledger entry.", "error");
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

      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #c2410c 0%, #ea580c 100%)" }}>
        <div>
          <h2>Create Ledger Entry</h2>
          <p>Add manual ledger adjustments or cash balance offsets.</p>
        </div>
        <button onClick={() => router.push("/admin/ledgers")} className="form-btn-back">
          <i className="fas fa-arrow-left"></i>
          <span>Back to Ledger</span>
        </button>
      </div>

      <div className="form-card">
        {companiesLoading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            <div className="spinner" style={{ borderTopColor: "#ea580c" }}></div>
            <p style={{ marginTop: "10px", fontWeight: "600" }}>Loading corporate accounts...</p>
          </div>
        ) : (
          <form onSubmit={handlePostLedger} className="form-grid">
            <div>
              <label className="form-label">Target Corporate Account *</label>
              <div className="form-input-wrapper">
                <i className="fas fa-building form-icon"></i>
                <select
                  className="form-input form-select"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                >
                  <option value="">Select associated account...</option>
                  {companies.map((comp: any) => (
                    <option key={comp.id} value={comp.name}>
                      {comp.name}
                    </option>
                  ))}
                </select>
                <i className="fas fa-chevron-down select-arrow"></i>
              </div>
            </div>

            <div>
              <label className="form-label">Entry Type Mapping *</label>
              <div className="form-input-wrapper">
                <i className="fas fa-arrows-spin form-icon"></i>
                <select
                  className="form-input form-select"
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                  required
                >
                  <option value="Credit">Credit (Cr) - Addition</option>
                  <option value="Debit">Debit (Dr) - Reduction</option>
                </select>
                <i className="fas fa-chevron-down select-arrow"></i>
              </div>
            </div>

            <div>
              <label className="form-label">Amount (SR) *</label>
              <div className="form-input-wrapper">
                <i className="fas fa-coins form-icon"></i>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={amount || ""}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">Adjustment Narrative *</label>
              <div className="form-input-wrapper">
                <i className="fas fa-comment form-icon"></i>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Narrative notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group-full form-submit-row">
              <button type="submit" disabled={isPosting} className="btn-submit" style={{ background: "linear-gradient(135deg, #c2410c 0%, #ea580c 100%)" }}>
                {isPosting ? "Posting Entry..." : "Post Ledger Entry"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
