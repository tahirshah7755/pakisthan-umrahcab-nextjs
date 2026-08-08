"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useGetPaymentsQuery, useUpdatePaymentStatusMutation, useDeletePaymentMutation } from "@/store/api/paymentsApi";
import { useGetCompaniesQuery } from "@/store/api/companiesApi";
import { exportToExcel } from "@/utils/excelHelper";

const fmt = (n: number, curr = "SAR") =>
  `${curr} ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PaymentsPage() {
  const router = useRouter();

  // Filter input states
  const [companyFilter, setCompanyFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Applied filters state for RTK Query filtering (local filter on list)
  const [appliedFilters, setAppliedFilters] = useState({
    company: "",
    method: "all",
    status: "all",
    start_date: "",
    end_date: "",
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Debounce search input to avoid hitting backend too frequently
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Toast notifications
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  // Modal states for Payment Approval
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleCopy = () => {
    if (paginatedPayments.length === 0) {
      showToast("No data to copy!", "error");
      return;
    }
    const headers = ["Ref ID", "Company", "Date", "Payment Method", "Transaction Ref", "Deposited Amount", "Currency", "Audit Status"];
    const textRows = paginatedPayments.map((p: any) => [
      p.custom_id || `PAY-${p.id}`,
      p.company || "",
      p.date ? new Date(p.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "",
      p.method || "",
      p.transaction_ref || "",
      p.amount || 0,
      p.currency || "SAR",
      p.status || "Pending"
    ]);
    const text = [headers.join("\t"), ...textRows.map(r => r.join("\t"))].join("\n");
    navigator.clipboard.writeText(text)
      .then(() => showToast("Copied payments list to clipboard!", "success"))
      .catch(() => showToast("Failed to copy!", "error"));
  };

  const handleExportCSV = () => {
    if (paginatedPayments.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["Ref ID", "Company", "Date", "Payment Method", "Transaction Ref", "Deposited Amount", "Currency", "Audit Status"];
    const csvContent = [
      headers.join(","),
      ...paginatedPayments.map((p: any) => [
        `"${(p.custom_id || `PAY-${p.id}`).replace(/"/g, '""')}"`,
        `"${(p.company || "").replace(/"/g, '""')}"`,
        `"${p.date ? new Date(p.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""}"`,
        `"${(p.method || "").replace(/"/g, '""')}"`,
        `"${(p.transaction_ref || "").replace(/"/g, '""')}"`,
        p.amount || 0,
        `"${(p.currency || "SAR").replace(/"/g, '""')}"`,
        `"${(p.status || "Pending").replace(/"/g, '""')}"`
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

  const handleExportExcel = () => {
    if (paginatedPayments.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["Ref ID", "Company", "Date", "Payment Method", "Transaction Ref", "Deposited Amount", "Currency", "Audit Status"];
    const textRows = paginatedPayments.map((p: any) => [
      p.custom_id || `PAY-${p.id}`,
      p.company || "",
      p.date ? new Date(p.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "",
      p.method || "",
      p.transaction_ref || "",
      p.amount || 0,
      p.currency || "SAR",
      p.status || "Pending"
    ]);
    
    exportToExcel({
      title: "Payments Register Report",
      headers,
      rows: textRows,
      filename: `payments_${new Date().toISOString().split("T")[0]}.xls`,
      totalsIndices: [5],
      statusIndex: 7
    });
  };

  const handlePrint = (title: string = "Corporate Payments Audit Ledger") => {
    if (paginatedPayments.length === 0) {
      showToast("No data to print!", "error");
      return;
    }
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocked! Please allow pop-ups to print.", "error");
      return;
    }

    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    
    const rowsHtml = paginatedPayments.map((p: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0d9488;">${p.custom_id || `PAY-${p.id}`}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155;">${p.company || ""}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${p.date ? new Date(p.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "--"}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
          <div>${p.method || ""}</div>
          ${p.transaction_ref ? `<div style="font-size: 10px; color: #64748b;">Ref: ${p.transaction_ref}</div>` : ""}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: right; color: ${p.amount < 0 ? "#dc2626" : "#059669"};">${fmt(p.amount, p.currency)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${p.status || "Pending"}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; margin: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0d9488; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #0d9488; font-size: 24px; }
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
              <p>Umrah Cab Payments Ledger Registry</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Generated Date:</strong> ${today}</p>
              <p><strong>Total Transactions:</strong> ${paginatedPayments.length}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Ref ID</th>
                <th>Company</th>
                <th>Date</th>
                <th>Payment Method</th>
                <th style="text-align: right;">Deposited Amount</th>
                <th>Audit Status</th>
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

  const handlePrintSingle = (p: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocked! Please allow pop-ups to print.", "error");
      return;
    }

    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const formattedDate = p.date ? new Date(p.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "--";
    const amountStr = fmt(p.amount, p.currency);

    printWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt - ${p.custom_id || `PAY-${p.id}`}</title>
          <style>
            body { font-family: sans-serif; margin: 40px; color: #1e293b; }
            .receipt-container { max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 30px; borderRadius: 12px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0d9488; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #0d9488; font-size: 24px; }
            .header p { margin: 5px 0 0 0; color: #64748b; font-size: 13px; }
            .details-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .details-label { color: #64748b; font-weight: 600; }
            .details-value { color: #1e293b; font-weight: 700; }
            .remarks-box { margin-top: 25px; padding: 15px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            @media print {
              body { margin: 20px; }
              .receipt-container { border: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div>
                <h1>Payment Receipt</h1>
                <p>Corporate Deposit Voucher Registry</p>
              </div>
              <div style="text-align: right;">
                <p><strong>Print Date:</strong> ${today}</p>
              </div>
            </div>
            
            <div class="details-row">
              <span class="details-label">Reference ID</span>
              <span class="details-value" style="color: #0d9488;">${p.custom_id || `PAY-${p.id}`}</span>
            </div>
            <div class="details-row">
              <span class="details-label">B2B Company / Client</span>
              <span class="details-value">${p.company || ""}</span>
            </div>
            <div class="details-row">
              <span class="details-label">Payment Date</span>
              <span class="details-value">${formattedDate}</span>
            </div>
            <div class="details-row">
              <span class="details-label">Payment Method</span>
              <span class="details-value">${p.method || ""}</span>
            </div>
            ${p.transaction_ref ? `
            <div class="details-row">
              <span class="details-label">Transaction Ref / Cheque</span>
              <span class="details-value">${p.transaction_ref}</span>
            </div>
            ` : ""}
            <div class="details-row">
              <span class="details-label">Audit Status</span>
              <span class="details-value" style="text-transform: uppercase;">${p.status || "Pending"}</span>
            </div>
            <div class="details-row" style="border-bottom: 2px solid #e2e8f0;">
              <span class="details-label">Deposited Amount</span>
              <span class="details-value" style="font-size: 18px; color: ${p.amount < 0 ? "#dc2626" : "#059669"};">${amountStr}</span>
            </div>

            <div class="remarks-box">
              <strong style="display: block; margin-bottom: 5px; color: #475569;">Transaction Notes:</strong>
              <span style="color: #334155;">${p.remarks || "No remarks/notes recorded for this transaction."}</span>
            </div>

            <div class="footer">
              Thank you for choosing Umrah Cab &bull; Corporate Financial Ledger Registry
            </div>
          </div>
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

  // RTK Queries
  const { data: paymentsData, isLoading, isFetching } = useGetPaymentsQuery({
    page: currentPage,
    per_page: rowsPerPage,
    search: debouncedSearch || undefined,
    company: appliedFilters.company || undefined,
    method: appliedFilters.method !== "all" ? appliedFilters.method : undefined,
    status: appliedFilters.status !== "all" ? appliedFilters.status : undefined,
    start_date: appliedFilters.start_date || undefined,
    end_date: appliedFilters.end_date || undefined,
  });
  const { data: companiesData } = useGetCompaniesQuery(undefined);
  const [updatePaymentStatus] = useUpdatePaymentStatusMutation();
  const [deletePayment] = useDeletePaymentMutation();

  const companies = Array.isArray(companiesData)
    ? companiesData
    : (Array.isArray((companiesData as any)?.data) ? (companiesData as any).data : []);

  // Robust paginator and list resolver supporting nested structures
  let paginatorObj: any = null;
  let paymentsRaw: any[] = [];

  if (paymentsData) {
    if (Array.isArray(paymentsData)) {
      paymentsRaw = paymentsData;
    } else if (typeof paymentsData === "object") {
      const pObj = paymentsData as any;
      if (pObj.current_page !== undefined && Array.isArray(pObj.data)) {
        paginatorObj = pObj;
        paymentsRaw = pObj.data;
      } else if (pObj.data && typeof pObj.data === "object") {
        const nested = pObj.data;
        if (nested.current_page !== undefined && Array.isArray(nested.data)) {
          paginatorObj = nested;
          paymentsRaw = nested.data;
        } else if (Array.isArray(nested)) {
          paymentsRaw = nested;
        }
      } else if (Array.isArray(pObj.data)) {
        paymentsRaw = pObj.data;
      }
    }
  }

  // Server-side pagination parameters
  const totalRows = paginatorObj?.total ?? paymentsRaw.length;
  const totalPages = paginatorObj?.last_page ?? (Math.ceil(totalRows / rowsPerPage) || 1);
  const fromRow = paginatorObj?.from ?? (totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1);
  const toRow = paginatorObj?.to ?? Math.min(currentPage * rowsPerPage, totalRows);
  const paginatedPayments = paymentsRaw;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      company: companyFilter,
      method: methodFilter,
      status: statusFilter,
      start_date: startDate,
      end_date: endDate,
    });
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setCompanyFilter("");
    setMethodFilter("all");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setAppliedFilters({
      company: "",
      method: "all",
      status: "all",
      start_date: "",
      end_date: "",
    });
    setCurrentPage(1);
  };

  const setQuickDateFilter = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    setStartDate(startStr);
    setEndDate(endStr);
    setAppliedFilters({
      company: companyFilter,
      method: methodFilter,
      status: statusFilter,
      start_date: startStr,
      end_date: endStr,
    });
    setCurrentPage(1);
    showToast(`Applied Quick Filter for last ${days} days!`, "success");
  };
  // Fetch all payments for summation (non-paginated, or high per_page)
  const { data: allPaymentsData } = useGetPaymentsQuery({
    search: debouncedSearch || undefined,
    company: appliedFilters.company || undefined,
    method: appliedFilters.method !== "all" ? appliedFilters.method : undefined,
    status: appliedFilters.status !== "all" ? appliedFilters.status : undefined,
    start_date: appliedFilters.start_date || undefined,
    end_date: appliedFilters.end_date || undefined,
    per_page: 100000,
  });

  let allPayments: any[] = [];
  if (allPaymentsData) {
    if (Array.isArray(allPaymentsData)) {
      allPayments = allPaymentsData;
    } else if (typeof allPaymentsData === "object") {
      const pObj = allPaymentsData as any;
      if (pObj.data && Array.isArray(pObj.data)) {
        allPayments = pObj.data;
      } else if (pObj.data && typeof pObj.data === "object" && Array.isArray(pObj.data.data)) {
        allPayments = pObj.data.data;
      } else if (Array.isArray(pObj)) {
        allPayments = pObj;
      }
    }
  }

  const totalSum = allPayments.filter((p: any) => p.method !== "Loan Due").reduce((acc: number, p: any) => acc + parseFloat(p.amount || 0), 0);
  const approvedSum = allPayments.filter((p: any) => p.method !== "Loan Due" && (p.status === "Approved" || p.status === "approved" || p.status === "success" || p.status === "Verified")).reduce((acc: number, p: any) => acc + parseFloat(p.amount || 0), 0);
  const pendingSum = allPayments.filter((p: any) => p.status === "Pending" || p.status === "pending").reduce((acc: number, p: any) => acc + parseFloat(p.amount || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "10px" }}>
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

      {/* Header card matching design aesthetics */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0f766e 0%, #059669 100%)", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
        <div>
          <h2>General Payments</h2>
          <p>Track all payments received and sent for your company accounts.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={() => router.push("/admin/payments/add")} className="form-btn-back" style={{ background: "#ffffff", color: "#1f2937", fontWeight: "700", border: "1px solid #cbd5e1" }}>
            <i className="fas fa-plus" style={{ color: "#1f2937" }}></i>
            <span>New Payment</span>
          </button>
          <button onClick={() => router.push("/admin/hub")} className="form-btn-back">
            <i className="fas fa-arrow-left"></i>
            <span>Back to Hub</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        <div className="form-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "15px", borderRadius: "12px", borderLeft: "4px solid #3b82f6" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            <i className="fas fa-wallet"></i>
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Total Loaded Amount</span>
            <strong style={{ fontSize: "18px", color: "#1e293b" }}>{fmt(totalSum)}</strong>
          </div>
        </div>
        <div className="form-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "15px", borderRadius: "12px", borderLeft: "4px solid #10b981" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#dcfce7", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            <i className="fas fa-check-circle"></i>
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Approved / Received</span>
            <strong style={{ fontSize: "18px", color: "#10b981" }}>{fmt(approvedSum)}</strong>
          </div>
        </div>
        <div className="form-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "15px", borderRadius: "12px", borderLeft: "4px solid #d97706" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            <i className="fas fa-clock"></i>
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Pending Approval / Due Amount</span>
            <strong style={{ fontSize: "18px", color: "#d97706" }}>{fmt(pendingSum)}</strong>
          </div>
        </div>
      </div>

      {/* Legacy Quick Filters row */}
      <div className="form-card" style={{ padding: "18px 24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Quick Date Range</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setQuickDateFilter(0)} style={{ padding: "6px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f8fafc", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Today</button>
            <button onClick={() => setQuickDateFilter(1)} style={{ padding: "6px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f8fafc", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Yesterday</button>
            <button onClick={() => setQuickDateFilter(7)} style={{ padding: "6px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f8fafc", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Last 7 Days</button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="form-card" style={{ padding: "18px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", alignItems: "flex-end" }}>
          <div>
            <label className="form-label" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>Company Account</label>
            <div className="form-input-wrapper">
              <i className="fas fa-building form-icon" style={{ fontSize: "13px" }}></i>
              <select 
                className="form-input form-select" 
                style={{ height: "38px", paddingLeft: "38px", fontSize: "13px", borderRadius: "6px" }}
                value={companyFilter} 
                onChange={(e) => setCompanyFilter(e.target.value)}
              >
                <option value="">All Companies</option>
                {companies.map((c: any) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <i className="fas fa-chevron-down select-arrow" style={{ fontSize: "10px" }}></i>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>Gateway / Method</label>
            <div className="form-input-wrapper">
              <i className="fas fa-credit-card form-icon" style={{ fontSize: "13px" }}></i>
              <select 
                className="form-input form-select" 
                style={{ height: "38px", paddingLeft: "38px", fontSize: "13px", borderRadius: "6px" }}
                value={methodFilter} 
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                <option value="all">All Methods</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash Receipt">Cash Deposit (Physical)</option>
                <option value="Online Gateway">Online Checkout Card</option>
                <option value="Loan Balance">Loan / Credit Balance</option>
              </select>
              <i className="fas fa-chevron-down select-arrow" style={{ fontSize: "10px" }}></i>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>Payment Status</label>
            <div className="form-input-wrapper">
              <i className="fas fa-info-circle form-icon" style={{ fontSize: "13px" }}></i>
              <select 
                className="form-input form-select" 
                style={{ height: "38px", paddingLeft: "38px", fontSize: "13px", borderRadius: "6px" }}
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending Approval</option>
                <option value="Approved">Approved / Received</option>
                <option value="Rejected">Rejected</option>
              </select>
              <i className="fas fa-chevron-down select-arrow" style={{ fontSize: "10px" }}></i>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>Date From</label>
            <div className="form-input-wrapper">
              <i className="fas fa-calendar-alt form-icon" style={{ fontSize: "13px" }}></i>
              <input 
                type="date" 
                className="form-input" 
                style={{ height: "38px", paddingLeft: "38px", fontSize: "13px", borderRadius: "6px" }}
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
              />
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>Date To</label>
            <div className="form-input-wrapper">
              <i className="fas fa-calendar-alt form-icon" style={{ fontSize: "13px" }}></i>
              <input 
                type="date" 
                className="form-input" 
                style={{ height: "38px", paddingLeft: "38px", fontSize: "13px", borderRadius: "6px" }}
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
            <button
              onClick={handleApplyFilters}
              style={{
                background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                height: "38px",
                padding: "0 20px",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flex: 1,
                justifyContent: "center",
                boxShadow: "0 2px 4px rgba(13, 148, 136, 0.2)"
              }}
            >
              <i className="fas fa-filter"></i> Apply
            </button>
            <button
              onClick={handleResetFilters}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                height: "38px",
                width: "38px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
              title="Reset Filters"
            >
              <i className="fas fa-sync-alt" style={{ color: "#64748b" }}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Table view card */}
      <div className="table-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #f1f5f9", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={handleCopy} style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              Copy
            </button>
            <button onClick={handleExportCSV} style={{ background: "#64748b", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              CSV
            </button>
            <button onClick={handleExportExcel} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              Excel
            </button>
            <button onClick={() => handlePrint("Payments Registry - PDF Audit Report")} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              PDF
            </button>
            <button onClick={() => handlePrint("Corporate Payments Audit Ledger")} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              Print
            </button>
            {isFetching && (
              <span style={{ fontSize: "12px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
                <div className="spinner" style={{ width: "12px", height: "12px", borderWidth: "2px", borderTopColor: "#0d9488" }}></div>
                Updating...
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ position: "relative" }}>
              <i className="fas fa-search" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "12px" }}></i>
              <input
                type="text"
                placeholder="Search Payments..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="form-input"
                style={{ paddingLeft: "30px", padding: "6px 12px 6px 30px", fontSize: "13px" }}
              />
            </div>
          </div>
        </div>

        {/* Table View */}
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
            <div className="spinner" style={{ borderTopColor: "#0d9488" }}></div>
            <span style={{ marginLeft: "12px", color: "#64748b", fontWeight: "600" }}>Loading Payments logs...</span>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            {/* Loading Overlay during page/search/filter change */}
            {isFetching && (
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 10,
                backdropFilter: "blur(1px)",
                borderRadius: "8px"
              }}>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                  background: "#ffffff",
                  padding: "16px 24px",
                  borderRadius: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                }}>
                  <div className="spinner" style={{ width: "24px", height: "24px", borderWidth: "3px", borderTopColor: "#0d9488" }}></div>
                  <span style={{ fontSize: "12px", color: "#475569", fontWeight: "600" }}>Updating Payments...</span>
                </div>
              </div>
            )}
            <div className="table-responsive">
              <table className="db-table" style={{ margin: 0, fontSize: "12px" }}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: "16px" }}>Ref ID</th>
                  <th>Company</th>
                  <th>Date</th>
                  <th>Payment Method</th>
                  <th>Deposited Amount</th>
                  <th>Currency</th>
                  <th>Audit Status</th>
                  <th style={{ paddingRight: "16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                      No payment records found matching the active criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedPayments.map((p: any) => (
                    <tr key={p.id}>
                      <td style={{ paddingLeft: "16px", fontWeight: "700", color: "#0d9488" }}>
                        {p.custom_id || `PAY-${p.id}`}
                      </td>
                      <td style={{ fontWeight: 600, color: "#334155" }}>
                        {p.company}
                      </td>
                      <td>
                        {p.date ? new Date(p.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "--"}
                      </td>
                      <td>
                        <div style={{ fontWeight: "600" }}>{p.method}</div>
                        {p.transaction_ref && (
                          <div style={{ fontSize: "11px", color: "#475569", marginTop: "2px" }}>
                            <strong>Ref:</strong> <code style={{ background: "#f1f5f9", padding: "1px 4px", borderRadius: "3px" }}>{p.transaction_ref}</code>
                          </div>
                        )}
                        {p.proof_details && (
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                            <strong>Notes:</strong> <span style={{ whiteSpace: "pre-line" }}>{p.proof_details}</span>
                          </div>
                        )}
                        {p.proof_file && (
                          <div style={{ marginTop: "4px" }}>
                            <a 
                              href={`http://localhost:8000${p.proof_file}`} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ 
                                display: "inline-flex", 
                                alignItems: "center", 
                                gap: "4px", 
                                fontSize: "11px", 
                                color: "#0d9488", 
                                textDecoration: "none",
                                fontWeight: "700" 
                              }}
                            >
                              <i className="fas fa-file-invoice"></i> View Receipt
                            </a>
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 800, color: p.amount < 0 ? "#dc2626" : "#059669" }}>
                        {fmt(p.amount, p.currency)}
                      </td>
                      <td>
                        {p.currency}
                      </td>
                      <td>
                        <select
                          value={p.status || "Pending"}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            if (newStatus === "Approved") {
                              setSelectedPayment(p);
                              setReceivedAmount(String(p.amount));
                              setApprovalNotes("");
                              setShowApprovalModal(true);
                            } else {
                              try {
                                await updatePaymentStatus({ 
                                  id: p.id, 
                                  status: newStatus
                                }).unwrap();
                                showToast(`Payment ${p.custom_id || `PAY-${p.id}`} marked as ${newStatus}!`, "success");
                              } catch (err) {
                                console.error(err);
                                showToast("Failed to update payment status.", "error");
                              }
                            }
                          }}
                          style={{
                            background: p.status === "Approved" || p.status === "Success" || p.status === "Verified" ? "#e6f4ea" : p.status === "Pending" ? "#fef3c7" : "#fce8e6",
                            color: p.status === "Approved" || p.status === "Success" || p.status === "Verified" ? "#137333" : p.status === "Pending" ? "#b06000" : "#c5221f",
                            padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", border: "1px solid rgba(0,0,0,0.05)", cursor: "pointer", outline: "none"
                          }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </td>
                      <td style={{ paddingRight: "16px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            title="Print Receipt"
                            onClick={() => handlePrintSingle(p)}
                            style={{ background: "#f0fdf4", color: "#16a34a", border: "none", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <i className="fas fa-print"></i>
                          </button>
                          <button
                            title="Delete Payment Record"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete payment record ${p.custom_id || `PAY-${p.id}`}?`)) {
                                try {
                                  await deletePayment(p.id).unwrap();
                                  showToast(`Payment ${p.custom_id || `PAY-${p.id}`} deleted successfully!`, "success");
                                } catch (err) {
                                  console.error(err);
                                  showToast("Failed to delete payment record.", "error");
                                }
                              }
                            }}
                            style={{ background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f8fafc", fontWeight: "bold", borderTop: "2px solid #e2e8f0" }}>
                  <td colSpan={4} style={{ padding: "12px 16px", textAlign: "right" }}>Page Total:</td>
                  <td style={{ padding: "12px 10px", color: "#059669" }}>
                    {fmt(paginatedPayments.reduce((acc: number, p: any) => acc + parseFloat(p.amount || 0), 0))}
                  </td>
                  <td colSpan={4}></td>
                </tr>
                <tr style={{ background: "#f1f5f9", fontWeight: "bold", borderTop: "1px solid #cbd5e1" }}>
                  <td colSpan={4} style={{ padding: "12px 16px", textAlign: "right" }}>Filtered Total (All Pages):</td>
                  <td style={{ padding: "12px 10px", color: "#0d9488" }}>
                    {fmt(allPayments.reduce((acc: number, p: any) => acc + parseFloat(p.amount || 0), 0))}
                  </td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
          </div>
        )}

        {/* Server-Side Pagination Footer */}
        {totalRows > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}>
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              Showing <strong>{fromRow}</strong> to <strong>{toRow}</strong> of <strong>{totalRows}</strong> entries
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <select
                className="form-input"
                style={{ padding: "4px 8px", fontSize: "12px", width: "auto", marginRight: "10px" }}
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {[10, 25, 50, 100].map((v) => (
                  <option key={v} value={v}>{v} / Page</option>
                ))}
              </select>

              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isFetching}
                style={{ background: "#fff", color: currentPage === 1 ? "#cbd5e1" : "#475569", border: "1px solid #e2e8f0", borderRadius: "6px", width: "30px", height: "30px", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontWeight: "bold" }}
              >
                &lt;
              </button>
              <span style={{ fontSize: "13px", color: "#475569", margin: "0 8px" }}>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isFetching}
                style={{ background: "#fff", color: currentPage === totalPages ? "#cbd5e1" : "#475569", border: "1px solid #e2e8f0", borderRadius: "6px", width: "30px", height: "30px", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontWeight: "bold" }}
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Premium Approval Modal */}
      {showApprovalModal && selectedPayment && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "16px"
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            width: "100%",
            maxWidth: "500px",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
            overflow: "hidden",
            border: "1px solid #e2e8f0"
          }}>
            {/* Modal Header */}
            <div style={{
              background: "linear-gradient(135deg, #0f766e, #0d9488)",
              padding: "20px 24px",
              color: "#ffffff",
              position: "relative"
            }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px" }}>
                <i className="fas fa-check-circle" style={{ fontSize: "20px" }}></i>
                Approve Payment Request
              </h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#ccfbf1", opacity: 0.9 }}>
                Verify and approve deposits to credit B2B agent balance
              </p>
              <button 
                onClick={() => setShowApprovalModal(false)}
                style={{
                  position: "absolute",
                  right: "20px",
                  top: "20px",
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "18px",
                  cursor: "pointer",
                  opacity: 0.8
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Payment Details Card */}
              <div style={{
                background: "#f8fafc",
                borderRadius: "12px",
                padding: "16px",
                border: "1px solid #e2e8f0",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                fontSize: "13px"
              }}>
                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: "600" }}>Ref ID</span>
                  <strong style={{ color: "#1e293b" }}>{selectedPayment.custom_id || `PAY-${selectedPayment.id}`}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: "600" }}>Company</span>
                  <strong style={{ color: "#1e293b" }}>{selectedPayment.company}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: "600" }}>Requested Amount</span>
                  <strong style={{ color: "#0f766e", fontSize: "14px" }}>{fmt(selectedPayment.amount, selectedPayment.currency)}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: "11px", textTransform: "uppercase", fontWeight: "600" }}>Payment Method</span>
                  <strong style={{ color: "#1e293b" }}>{selectedPayment.method}</strong>
                </div>
              </div>

              {/* Form Input fields */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                  Received Amount *
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#64748b",
                    fontWeight: "600",
                    fontSize: "14px"
                  }}>
                    {selectedPayment.currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedPayment.amount}
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    placeholder="Enter amount"
                    style={{
                      width: "100%",
                      padding: "10px 14px 10px 52px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      outline: "none",
                      fontWeight: "600",
                      color: "#1e293b"
                    }}
                  />
                </div>
                {selectedPayment?.method && (selectedPayment.method.toLowerCase().includes("loan") || selectedPayment.method.toLowerCase().includes("credit")) ? (
                  <span style={{ display: "block", fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    If the received amount is less than the requested amount, a new pending payment of <strong>{fmt(selectedPayment.amount - (Number(receivedAmount) || 0), selectedPayment.currency)}</strong> will be created as due.
                  </span>
                ) : (
                  <span style={{ display: "block", fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    The approved received amount of <strong>{fmt(Number(receivedAmount) || 0, selectedPayment.currency)}</strong> will be credited directly to <strong>{selectedPayment.company}</strong>'s ledger balance.
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                  Approval Notes / Remarks
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="e.g. Received partial cash at counter, remaining will pay tomorrow."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    outline: "none",
                    fontFamily: "inherit",
                    resize: "none",
                    color: "#1e293b"
                  }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              background: "#f8fafc",
              padding: "16px 24px",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px"
            }}>
              <button
                type="button"
                onClick={() => setShowApprovalModal(false)}
                disabled={isSubmittingApproval}
                style={{
                  background: "#ffffff",
                  color: "#64748b",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingApproval || !receivedAmount || Number(receivedAmount) <= 0 || Number(receivedAmount) > selectedPayment.amount}
                onClick={async () => {
                  setIsSubmittingApproval(true);
                  try {
                    await updatePaymentStatus({
                      id: selectedPayment.id,
                      status: "Approved",
                      approved_amount: Number(receivedAmount),
                      notes: approvalNotes
                    }).unwrap();
                    showToast(`Payment ${selectedPayment.custom_id || `PAY-${selectedPayment.id}`} approved successfully!`, "success");
                    setShowApprovalModal(false);
                  } catch (err) {
                    console.error(err);
                    showToast("Failed to approve payment.", "error");
                  } finally {
                    setIsSubmittingApproval(false);
                  }
                }}
                style={{
                  background: "linear-gradient(135deg, #0d9488, #0f766e)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 20px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: (isSubmittingApproval || !receivedAmount || Number(receivedAmount) <= 0 || Number(receivedAmount) > selectedPayment.amount) ? "not-allowed" : "pointer",
                  opacity: (isSubmittingApproval || !receivedAmount || Number(receivedAmount) <= 0 || Number(receivedAmount) > selectedPayment.amount) ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                {isSubmittingApproval ? "Approving..." : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", color: "#94a3b8", fontSize: "12px" }}>
        <span>&copy; 2026 Umrah Cab. General Payments Registrar.</span>
        <span>v2.0</span>
      </div>
    </div>
  );
}
