"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { exportToExcel } from "@/utils/excelHelper";

interface PaymentRecord {
  id: string;
  custom_id: string;
  date: string;
  method: string;
  amount: number;
  currency: string;
  status: string;
  transaction_ref?: string;
  proof_details?: string;
  proof_file?: string;
}

export default function CompanyPaymentsPage() {
  const { companyUser } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  // Deposit Request Form States
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("SAR");
  const [method, setMethod] = useState("Bank Transfer");
  const [transactionRef, setTransactionRef] = useState("");
  const [proofDetails, setProofDetails] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [bankFrom, setBankFrom] = useState("");
  const [bankTo, setBankTo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleExportExcel = () => {
    if (filteredPayments.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["Payment ID", "Date", "Payment Method", "Transaction ID", "Amount", "Currency", "Status"];
    const textRows = filteredPayments.map((p: any) => [
      p.custom_id,
      p.date || "",
      p.method || "",
      p.transaction_ref || "N/A",
      p.amount || 0,
      p.currency || "SAR",
      p.status || ""
    ]);
    
    exportToExcel({
      title: "Corporate Balance Deposits Statement",
      headers,
      rows: textRows,
      filename: `payments_${new Date().toISOString().split("T")[0]}.xls`,
      totalsIndices: [4],
      statusIndex: 6
    });
  };

  const handleCopy = () => {
    if (filteredPayments.length === 0) {
      showToast("No data to copy!", "error");
      return;
    }
    const headers = ["Payment ID", "Date", "Payment Method", "Transaction ID", "Amount", "Currency", "Status"];
    const textRows = filteredPayments.map((p: any) => [
      p.custom_id,
      p.date || "",
      p.method || "",
      p.transaction_ref || "N/A",
      p.amount || 0,
      p.currency || "SAR",
      p.status || ""
    ]);
    const text = [headers.join("\t"), ...textRows.map(r => r.join("\t"))].join("\n");
    navigator.clipboard.writeText(text)
      .then(() => showToast("Copied payments list to clipboard!", "success"))
      .catch(() => showToast("Failed to copy!", "error"));
  };

  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["Payment ID", "Date", "Payment Method", "Transaction ID", "Amount", "Currency", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredPayments.map((p: any) => [
        `"${(p.custom_id || "").replace(/"/g, '""')}"`,
        `"${(p.date || "").replace(/"/g, '""')}"`,
        `"${(p.method || "").replace(/"/g, '""')}"`,
        `"${(p.transaction_ref || "N/A").replace(/"/g, '""')}"`,
        p.amount || 0,
        `"${(p.currency || "SAR").replace(/"/g, '""')}"`,
        `"${(p.status || "").replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `payments_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV file downloaded successfully!", "success");
  };

  const handlePrint = (title: string = "Corporate Balance Deposits Statement") => {
    if (filteredPayments.length === 0) {
      showToast("No data to print!", "error");
      return;
    }
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocked! Please allow pop-ups to print.", "error");
      return;
    }

    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    
    const rowsHtml = filteredPayments.map((p: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1e293b;">${p.custom_id}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${p.date}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 600;">${p.method}</div>
          ${p.proof_details ? `<div style="font-size: 10px; color: #64748b; margin-top: 2px;">${p.proof_details}</div>` : ""}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${p.transaction_ref || "N/A"}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: right; color: #10b981;">SAR ${Number(p.amount || 0).toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${p.currency}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${p.status}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; margin: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #b48a1d; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #b48a1d; font-size: 24px; }
            .header p { margin: 5px 0 0 0; color: #64748b; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background-color: #f8fafc; padding: 12px 10px; border-bottom: 2px solid #e2e8f0; text-align: left; text-transform: uppercase; color: #475569; font-weight: 700; }
            @media print {
              body { margin: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>${title}</h1>
              <p>Umrah Cab B2B Agent Balance Deposits Registry</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Generated Date:</strong> ${today}</p>
              <p><strong>Total Deposits:</strong> ${filteredPayments.length}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Date</th>
                <th>Payment Method</th>
                <th>Transaction ID</th>
                <th style="text-align: right;">Amount</th>
                <th>Currency</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleButtonClick = (fmt: string) => {
    if (fmt === "Copy") handleCopy();
    else if (fmt === "CSV") handleExportCSV();
    else if (fmt === "Excel") handleExportExcel();
    else if (fmt === "PDF" || fmt === "Print") handlePrint(fmt === "PDF" ? "Balance Deposits Statement - PDF Report" : "Balance Deposits Statement");
  };

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await api.getCompanyPayments();
      setPayments(data || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to retrieve payments history.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyUser) {
      showToast("Authentication error: Logged in company user not found.", "error");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      showToast("Please enter a valid amount.", "error");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("company", companyUser.name);
      formData.append("method", method);
      formData.append("amount", amount);
      formData.append("currency", currency);
      if (transactionRef) {
        formData.append("transaction_ref", transactionRef);
      }
      
      const parts = [];
      if (bankFrom) parts.push(`Bank From: ${bankFrom}`);
      if (bankTo) parts.push(`Bank To: ${bankTo}`);
      if (proofDetails) parts.push(`Notes: ${proofDetails}`);
      
      if (parts.length > 0) {
        formData.append("proof_details", parts.join(" | "));
      }

      if (proofFile) {
        formData.append("proof_file", proofFile);
      }

      const res = await api.createCompanyPayment(formData);
      if (res.success) {
        showToast("Deposit request submitted successfully!", "success");
        setShowModal(false);
        setAmount("");
        setTransactionRef("");
        setProofDetails("");
        setBankFrom("");
        setBankTo("");
        setProofFile(null);
        loadPayments();
      } else {
        showToast(res.error || "Failed to submit deposit request.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("An unexpected error occurred.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("success") || s.includes("approve") || s.includes("paid")) return "completed";
    if (s.includes("pending") || s.includes("process")) return "pending";
    return "cancelled";
  };

  const fmt = (n: number) => `SAR ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const totalSum = payments.reduce((acc: number, p: any) => acc + parseFloat(p.amount || 0), 0);
  const approvedSum = payments.filter((p: any) => p.status === "Approved" || p.status === "approved" || p.status === "success" || p.status === "Verified").reduce((acc: number, p: any) => acc + parseFloat(p.amount || 0), 0);
  const pendingSum = payments.filter((p: any) => p.status === "Pending" || p.status === "pending").reduce((acc: number, p: any) => acc + parseFloat(p.amount || 0), 0);

  const filteredPayments = payments.filter((p) => {
    if (statusFilter !== "all") {
      const ps = (p.status || "").toLowerCase();
      const fs = statusFilter.toLowerCase();
      if (fs === "approved") {
        return ps === "approved" || ps === "success" || ps === "verified";
      }
      return ps === fs;
    }
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {toast.show && (
        <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 9999, background: toast.type === "success" ? "#10b981" : "#ef4444", color: "#ffffff", padding: "12px 24px", borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", fontWeight: "600" }}>
          <i className={toast.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"} style={{ marginRight: "8px" }}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="form-header-card mobile-header-card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Payments History</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>View detailed records of all deposits and processed balance payments.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        <div className="form-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "15px", borderRadius: "12px", borderLeft: "4px solid #3b82f6", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            <i className="fas fa-wallet"></i>
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Total Deposit Requests</span>
            <strong style={{ fontSize: "18px", color: "#1e293b" }}>{fmt(totalSum)}</strong>
          </div>
        </div>
        <div className="form-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "15px", borderRadius: "12px", borderLeft: "4px solid #10b981", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#dcfce7", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            <i className="fas fa-check-circle"></i>
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Approved / Received</span>
            <strong style={{ fontSize: "18px", color: "#10b981" }}>{fmt(approvedSum)}</strong>
          </div>
        </div>
        <div className="form-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "15px", borderRadius: "12px", borderLeft: "4px solid #d97706", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            <i className="fas fa-clock"></i>
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Payable Amount (Admin)</span>
            <strong style={{ fontSize: "18px", color: "#d97706" }}>{fmt(pendingSum)}</strong>
          </div>
        </div>
      </div>

      {/* Payments Table Card */}
      <div className="table-card mobile-card" style={{ padding: "25px", background: "#ffffff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
          <div className="mobile-toolbar" style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {["Copy", "CSV", "Excel", "PDF", "Print"].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleButtonClick(fmt)}
                  style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                >
                  {fmt}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Payment Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  height: "36px",
                  padding: "0 12px",
                  fontSize: "13px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#334155",
                  fontWeight: "600",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending Approval</option>
                <option value="Approved">Approved / Received</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="mobile-wallet-btn"
            style={{
              background: "linear-gradient(135deg, #b48a1d 0%, #d4af37 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "8px 18px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 4px rgba(212, 175, 55, 0.2)"
            }}
          >
            <i className="fas fa-wallet"></i> Request Deposit
          </button>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
            <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #d4af37", borderRadius: "50%", width: "35px", height: "35px", animation: "spin 1s linear infinite" }}></div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="db-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Date</th>
                  <th>Payment Method</th>
                  <th>Transaction ID</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "#64748b", padding: "30px 10px" }}>No payments registered under this corporate account.</td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700, color: "#1e293b" }}>{p.custom_id}</td>
                      <td>{p.date}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.method}</div>
                        {p.proof_details && (
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                            <strong>Notes:</strong> {p.proof_details}
                          </div>
                        )}
                        {p.proof_file && (
                          <div style={{ marginTop: "6px" }}>
                            <a 
                              href={`http://localhost:8000${p.proof_file}`} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ 
                                display: "inline-flex", 
                                alignItems: "center", 
                                gap: "4px", 
                                fontSize: "11px", 
                                color: "#b48a1d", 
                                textDecoration: "none",
                                fontWeight: "700" 
                              }}
                            >
                              <i className="fas fa-file-invoice"></i> View Receipt/Proof
                            </a>
                          </div>
                        )}
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: "13px" }}>{p.transaction_ref || "N/A"}</td>
                      <td style={{ fontWeight: 700, color: "#10b981" }}>SAR {parseFloat(p.amount as any).toFixed(2)}</td>
                      <td>{p.currency}</td>
                      <td>
                        <span className={`status-pill ${getStatusClass(p.status)}`}>{p.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f8fafc", fontWeight: "bold", borderTop: "2px solid #e2e8f0" }}>
                  <td colSpan={4} style={{ padding: "12px 16px", textAlign: "right" }}>Filtered Total:</td>
                  <td style={{ padding: "12px 10px", color: "#10b981" }}>
                    {fmt(filteredPayments.reduce((acc: number, p: any) => acc + parseFloat(p.amount || 0), 0))}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Deposit Request Modal */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.5)", zIndex: 10000,
          display: "flex", justifyContent: "center", alignItems: "center",
          padding: "20px"
        }}>
          <div style={{
            background: "#ffffff", borderRadius: "12px", width: "100%", maxWidth: "500px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            overflowY: "auto", display: "flex", flexDirection: "column", maxHeight: "90vh"
          }}>
            {/* Modal Header */}
            <div style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <h3 style={{ margin: 0, color: "#ffffff", fontSize: "18px", fontWeight: "700" }}>
                <i className="fas fa-wallet" style={{ color: "#d4af37", marginRight: "8px" }}></i>
                Request Deposit
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", color: "#ffffff", fontSize: "18px", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>
            
            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Amount & Currency row */}
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Amount *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", background: "#ffffff" }}
                  >
                    <option value="SAR">SAR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Payment Method *</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", background: "#ffffff" }}
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash Receipt">Cash Deposit (Physical)</option>
                  <option value="Online Gateway">Online Checkout Card</option>
                </select>
              </div>

              {/* Bank Details */}
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Bank Transferred From</label>
                  <input
                    type="text"
                    value={bankFrom}
                    onChange={(e) => setBankFrom(e.target.value)}
                    placeholder="e.g. Al-Rajhi Bank"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Receiving Bank / Wallet</label>
                  <input
                    type="text"
                    value={bankTo}
                    onChange={(e) => setBankTo(e.target.value)}
                    placeholder="e.g. SNB Al-Ahli"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
                  />
                </div>
              </div>

              {/* Transaction ID / Ref */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Transaction ID / Reference</label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. Bank Reference / TXN ID"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
                />
              </div>

              {/* Proof File (Image/PDF) */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Upload Proof (Image or PDF)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setProofFile(e.target.files[0]);
                    }
                  }}
                  style={{ width: "100%", fontSize: "13px" }}
                />
              </div>

              {/* Proof Details / Notes */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Proof Details / Notes</label>
                <textarea
                  value={proofDetails}
                  onChange={(e) => setProofDetails(e.target.value)}
                  placeholder="e.g. Sender bank account number, date/time of transfer, or extra verification info"
                  rows={3}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", resize: "none", fontFamily: "sans-serif" }}
                />
              </div>

              {/* Form Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "10px 20px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "10px 20px",
                    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  {submitting ? (
                    <>
                      <div style={{ border: "2px solid rgba(255,255,255,0.2)", borderTop: "2px solid #ffffff", borderRadius: "50%", width: "14px", height: "14px", animation: "spin 1s linear infinite" }}></div>
                      Submitting...
                    </>
                  ) : "Submit Request"}
                </button>
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
        @media (max-width: 768px) {
          .mobile-header-card {
            padding: 15px 20px !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 15px !important;
            text-align: center !important;
          }
          .mobile-card {
            padding: 15px !important;
          }
          .mobile-toolbar {
            width: 100% !important;
            justify-content: center !important;
            flex-wrap: wrap !important;
          }
          .mobile-toolbar button {
            flex: 1 !important;
            min-width: 70px !important;
            padding: 6px 10px !important;
            font-size: 11px !important;
          }
          .mobile-wallet-btn {
            width: 100% !important;
            justify-content: center !important;
          }
        }
      `}</style>
    </div>
  );
}
