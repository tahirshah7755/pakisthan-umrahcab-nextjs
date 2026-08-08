"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { exportToExcel } from "@/utils/excelHelper";
import { getSaudiTodayDate } from "@/utils/formatters";

interface InvoiceRecord {
  id: string;
  invoice_code: string;
  customer: string;
  date: string;
  period: string;
  amount: number;
  balance: number;
  status: string;
  type: string;
  remarks: string;
}

export default function CompanyInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (invoices.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["Invoice Code", "Customer Name", "Date", "Period", "Invoice Type", "Amount", "Outstanding Balance", "Status"];
    const textRows = invoices.map((inv: any) => [
      inv.invoice_code || "",
      inv.customer || "",
      inv.date || "",
      inv.period || "",
      inv.type || "",
      inv.amount || 0,
      inv.balance || 0,
      inv.status || ""
    ]);
    
    exportToExcel({
      title: "Agent Invoices Statement",
      headers,
      rows: textRows,
      filename: `invoices_${getSaudiTodayDate()}.xls`,
      totalsIndices: [5, 6],
      statusIndex: 7
    });
  };

  const handleCopy = () => {
    if (invoices.length === 0) {
      showToast("No data to copy!", "error");
      return;
    }
    const headers = ["Invoice Code", "Customer Name", "Date", "Period", "Invoice Type", "Amount", "Outstanding Balance", "Status"];
    const textRows = invoices.map((inv: any) => [
      inv.invoice_code || "",
      inv.customer || "",
      inv.date || "",
      inv.period || "",
      inv.type || "",
      inv.amount || 0,
      inv.balance || 0,
      inv.status || ""
    ]);
    const text = [headers.join("\t"), ...textRows.map(r => r.join("\t"))].join("\n");
    navigator.clipboard.writeText(text)
      .then(() => showToast("Copied invoices list to clipboard!", "success"))
      .catch(() => showToast("Failed to copy!", "error"));
  };

  const handleExportCSV = () => {
    if (invoices.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["Invoice Code", "Customer Name", "Date", "Period", "Invoice Type", "Amount", "Outstanding Balance", "Status"];
    const csvContent = [
      headers.join(","),
      ...invoices.map((inv: any) => [
        `"${(inv.invoice_code || "").replace(/"/g, '""')}"`,
        `"${(inv.customer || "").replace(/"/g, '""')}"`,
        `"${(inv.date || "").replace(/"/g, '""')}"`,
        `"${(inv.period || "").replace(/"/g, '""')}"`,
        `"${(inv.type || "").replace(/"/g, '""')}"`,
        inv.amount || 0,
        inv.balance || 0,
        `"${(inv.status || "").replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `invoices_${getSaudiTodayDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV file downloaded successfully!", "success");
  };

  const handlePrint = (title: string = "Agent Invoices Registry") => {
    if (invoices.length === 0) {
      showToast("No data to print!", "error");
      return;
    }
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocked! Please allow pop-ups to print.", "error");
      return;
    }

    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    
    const rowsHtml = invoices.map((inv: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1e293b;">${inv.invoice_code}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${inv.customer}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${inv.date}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${inv.period || "N/A"}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${inv.type || "General"}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: right;">SAR ${Number(inv.amount || 0).toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: right; color: #ef4444;">SAR ${Number(inv.balance || 0).toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${inv.status}</td>
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
              <p>Umrah Cab B2B Agent Invoices Registry</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Generated Date:</strong> ${today}</p>
              <p><strong>Total Invoices:</strong> ${invoices.length}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Invoice Code</th>
                <th>Customer Name</th>
                <th>Date</th>
                <th>Period</th>
                <th>Invoice Type</th>
                <th style="text-align: right;">Amount</th>
                <th style="text-align: right;">Outstanding Balance</th>
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
    else if (fmt === "PDF" || fmt === "Print") handlePrint(fmt === "PDF" ? "Invoices Statement - PDF Report" : "Invoices Statement");
  };

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await api.getCompanyInvoices();
      setInvoices(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to retrieve corporate invoices.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const getStatusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("paid") && !s.includes("unpaid")) return "completed";
    if (s.includes("partial")) return "pending";
    return "cancelled";
  };

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
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>My Invoices</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Manage and view all corporate invoices and billing summaries.</p>
        </div>
      </div>

      {/* Invoices Grid Card */}
      <div className="table-card mobile-card" style={{ padding: "25px", background: "#ffffff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
          <div className="mobile-toolbar" style={{ display: "flex", gap: "6px" }}>
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
                  <th>Invoice Code</th>
                  <th>Customer Name</th>
                  <th>Date</th>
                  <th>Period</th>
                  <th>Invoice Type</th>
                  <th>Amount</th>
                  <th>Outstanding Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", color: "#64748b", padding: "30px 10px" }}>No invoices registered under this account.</td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 700, color: "#1e293b" }}>{inv.invoice_code}</td>
                      <td style={{ fontWeight: 600 }}>{inv.customer}</td>
                      <td>{inv.date}</td>
                      <td>{inv.period || "N/A"}</td>
                      <td>
                        <span style={{ background: "#f1f5f9", padding: "3px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>{inv.type || "General"}</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>SAR {parseFloat(inv.amount as any || 0).toFixed(2)}</td>
                      <td style={{ fontWeight: 700, color: "#ef4444" }}>SAR {parseFloat(inv.balance as any || 0).toFixed(2)}</td>
                      <td>
                        <span className={`status-pill ${getStatusClass(inv.status)}`}>{inv.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
        }
      `}</style>
    </div>
  );
}
