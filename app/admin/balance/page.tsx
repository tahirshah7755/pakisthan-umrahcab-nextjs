"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useGetBalanceSummaryQuery } from "@/store/api/balanceApi";
import { useGetCompaniesQuery, useUpdateCompanyMutation } from "@/store/api/companiesApi";

const fmt = (n: number) =>
  `SAR ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatRelativeDate = (dateStr: string | null) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  
  const dStr = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  
  // Calculate relative days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - target.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  let relative = "";
  if (diffDays === 0) relative = "0d ago";
  else if (diffDays > 0) relative = `${diffDays}d ago`;
  else relative = `${Math.abs(diffDays)}d from now`;
  
  return { date: dStr, relative };
};

const formatDateSimple = (dateStr: string | null) => {
  if (!dateStr) return "--";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const TABS = [
  { key: "all",          label: "All Companies" },
  { key: "due_today",    label: "Due Today" },
  { key: "overdue",      label: "Overdue" },
  { key: "cleared",      label: "Cleared / Paid" },
  { key: "upcoming",     label: "Upcoming (7 Days)" },
];

export default function BalancePage() {
  const router = useRouter();
  const [activeTab,     setActiveTab]     = useState("all");
  const [filterCompany, setFilterCompany] = useState("");
  const [search,        setSearch]        = useState("");
  const [editingRemarks, setEditingRemarks] = useState<number | null>(null);
  const [tempRemarks, setTempRemarks] = useState("");
  const [localStatuses, setLocalStatuses] = useState<Record<number, string>>({});
  const [localLocks, setLocalLocks] = useState<Record<number, boolean>>({});

  // Toast notifications
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleCopy = () => {
    if (rows.length === 0) {
      showToast("No data to copy!", "error");
      return;
    }
    const headers = ["ID", "Company Name", "Status", "Last Inv Amt", "Total Business", "Total Rec (VW)", "Total Rec (PW)", "Remarks"];
    const textRows = rows.map((item: any) => [
      item.id,
      item.company || "",
      item.status || "",
      item.last_inv_amt || 0,
      item.total_business || 0,
      item.total_rec_vw || 0,
      item.total_rec_pw || 0,
      item.company_remarks || ""
    ]);
    const text = [headers.join("\t"), ...textRows.map(r => r.join("\t"))].join("\n");
    navigator.clipboard.writeText(text)
      .then(() => showToast("Copied balance summary to clipboard!", "success"))
      .catch(() => showToast("Failed to copy!", "error"));
  };

  const handleExportCSV = () => {
    if (rows.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["ID", "Company Name", "Status", "Last Inv Amt", "Total Business", "Total Rec (VW)", "Total Rec (PW)", "Remarks"];
    const csvContent = [
      headers.join(","),
      ...rows.map((item: any) => [
        item.id,
        `"${(item.company || "").replace(/"/g, '""')}"`,
        `"${(item.status || "").replace(/"/g, '""')}"`,
        item.last_inv_amt || 0,
        item.total_business || 0,
        item.total_rec_vw || 0,
        item.total_rec_pw || 0,
        `"${(item.company_remarks || "").replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `balance_statement_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV file downloaded successfully!", "success");
  };

  const handleExportExcel = () => {
    if (rows.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["ID", "Company Name", "Status", "Last Inv Amt", "Total Business", "Total Rec (VW)", "Total Rec (PW)", "Remarks"];
    const textRows = rows.map((item: any) => [
      item.id,
      item.company || "",
      item.status || "",
      item.last_inv_amt || 0,
      item.total_business || 0,
      item.total_rec_vw || 0,
      item.total_rec_pw || 0,
      item.company_remarks || ""
    ]);
    
    const excelContent = [
      headers.join("\t"),
      ...textRows.map(r => r.join("\t"))
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + excelContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `balance_statement_${new Date().toISOString().split("T")[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Excel spreadsheet downloaded successfully!", "success");
  };

  const handlePrint = (title: string = "Balance Statement Report") => {
    if (rows.length === 0) {
      showToast("No data to print!", "error");
      return;
    }
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocked! Please allow pop-ups to print.", "error");
      return;
    }

    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    
    const rowsHtml = rows.map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">#${item.id}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1e5cff;">${item.company || ""}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.status || ""}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${fmt(item.last_inv_amt)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${fmt(item.total_business)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #ef4444;">${fmt(item.total_rec_vw)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #f97316;">${fmt(item.total_rec_pw)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${item.company_remarks || ""}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; margin: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e5cff; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #1e5cff; font-size: 24px; }
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
              <p>Umrah Cab Balance Statement Registry</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Generated Date:</strong> ${today}</p>
              <p><strong>Total Companies:</strong> ${rows.length}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Company Name</th>
                <th>Status</th>
                <th style="text-align: right;">Last Inv Amt</th>
                <th style="text-align: right;">Total Business</th>
                <th style="text-align: right;">Total Rec (VW)</th>
                <th style="text-align: right;">Total Rec (PW)</th>
                <th>Remarks</th>
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

  const { data: response, isLoading, isFetching } = useGetBalanceSummaryQuery(
    { company: filterCompany || undefined, tab: activeTab }
  );

  const { data: companiesData } = useGetCompaniesQuery(undefined);
  const [updateCompany] = useUpdateCompanyMutation();

  const companies = Array.isArray(companiesData)
    ? companiesData
    : (Array.isArray((companiesData as any)?.data) ? (companiesData as any).data : []);

  // Response shape: { data: { rows: [...], totals: {...} }, Message, ... }
  const payload = response?.data ?? response;
  const allRows: any[] = Array.isArray(payload?.rows)
    ? payload.rows
    : (Array.isArray(payload) ? payload : []);

  const totals = payload?.totals ?? {
    total_business: allRows.reduce((s: number, r: any) => s + Number(r.total_business || 0), 0),
    total_rec_vw:   allRows.reduce((s: number, r: any) => s + Number(r.total_rec_vw   || 0), 0),
    total_rec_pw:   allRows.reduce((s: number, r: any) => s + Number(r.total_rec_pw   || 0), 0),
  };

  // Client-side search filter on displayed rows
  const rows = allRows.filter((r) =>
    !search || r.company?.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleLock = async (item: any) => {
    const originalCompany = companies.find((c: any) => c.id === item.id);
    if (!originalCompany) return;
    const nextVal = !item.vouchers_lock;
    setLocalLocks(prev => ({ ...prev, [item.id]: nextVal }));
    try {
      await updateCompany({
        ...originalCompany,
        vouchers: nextVal,
      }).unwrap();
      showToast(`Voucher lock status updated for ${item.company}!`, "success");
    } catch (err) {
      console.error("Failed to toggle lock status:", err);
      showToast("Failed to toggle lock status.", "error");
      setLocalLocks(prev => ({ ...prev, [item.id]: item.vouchers_lock }));
    }
  };

  const handleChangeStatementStatus = async (item: any, status: string) => {
    const originalCompany = companies.find((c: any) => c.id === item.id);
    if (!originalCompany) return;
    setLocalStatuses(prev => ({ ...prev, [item.id]: status }));
    try {
      await updateCompany({
        ...originalCompany,
        statement_status: status,
      }).unwrap();
      showToast(`Statement status updated to "${status}" for ${item.company}`, "success");
    } catch (err) {
      console.error("Failed to update statement status:", err);
      showToast("Failed to update statement status.", "error");
      setLocalStatuses(prev => ({ ...prev, [item.id]: item.statement_status || "Pending" }));
    }
  };

  const handleSaveRemarks = async (item: any) => {
    const originalCompany = companies.find((c: any) => c.id === item.id);
    if (!originalCompany) return;
    try {
      await updateCompany({
        ...originalCompany,
        remarks: tempRemarks,
      }).unwrap();
      setEditingRemarks(null);
      showToast(`Remarks updated for ${item.company}!`, "success");
    } catch (err) {
      console.error("Failed to update company remarks:", err);
      showToast("Failed to update company remarks.", "error");
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

      {/* Header */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)" }}>
        <div>
          <h2>Balance Statement</h2>
          <p>Monitor company balances, receivables, follow-ups and service timelines.</p>
        </div>
        <button onClick={() => router.push("/admin/hub")} className="form-btn-back">
          <i className="fas fa-arrow-left"></i>
          <span>Return to Hub</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      {!isLoading && (
        <div className="db-stats-row">
          <div className="db-stat-card">
            <div className="db-stat-icon" style={{ background: "#3b82f6" }}>
              <i className="fas fa-briefcase"></i>
            </div>
            <div className="db-stat-info">
              <span className="db-stat-value">{fmt(totals.total_business)}</span>
              <span className="db-stat-label">Total Business Volume</span>
            </div>
          </div>
          <div className="db-stat-card">
            <div className="db-stat-icon" style={{ background: "#8b5cf6" }}>
              <i className="fas fa-file-invoice-dollar"></i>
            </div>
            <div className="db-stat-info">
              <span className="db-stat-value">{fmt(totals.total_rec_vw)}</span>
              <span className="db-stat-label">Total Receivable (VW)</span>
            </div>
          </div>
          <div className="db-stat-card">
            <div className="db-stat-icon" style={{ background: "#ef4444" }}>
              <i className="fas fa-hand-holding-dollar"></i>
            </div>
            <div className="db-stat-info">
              <span className="db-stat-value">{fmt(totals.total_rec_pw)}</span>
              <span className="db-stat-label">Total Receivable (PW)</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Tab Filters */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: activeTab === tab.key ? "#1e5cff" : "#ffffff",
              color: activeTab === tab.key ? "#ffffff" : "#475569",
              border: `1px solid ${activeTab === tab.key ? "#1e5cff" : "#e2e8f0"}`,
              borderRadius: "9999px", padding: "8px 18px",
              fontSize: "13px", fontWeight: "600", cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="table-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #f1f5f9", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleCopy} style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              Copy
            </button>
            <button onClick={handleExportCSV} style={{ background: "#64748b", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              CSV
            </button>
            <button onClick={handleExportExcel} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              Excel
            </button>
            <button onClick={() => handlePrint("Balance Statement PDF Report")} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              PDF
            </button>
            <button onClick={() => handlePrint("Balance Statement Report")} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              Print
            </button>
            {isFetching && (
              <span style={{ fontSize: "12px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
                <div className="spinner" style={{ width: "12px", height: "12px", borderWidth: "2px", borderTopColor: "#334155" }}></div>
                Updating...
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <select
              className="form-input"
              style={{ padding: "6px 12px", fontSize: "13px" }}
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
            >
              <option value="">All Companies</option>
              {companies.map((c: any) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <div style={{ position: "relative" }}>
              <i className="fas fa-search" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "12px" }}></i>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: "30px", padding: "6px 12px 6px 30px", fontSize: "13px" }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
            <div className="spinner" style={{ borderTopColor: "#334155" }}></div>
            <span style={{ marginLeft: "12px", color: "#64748b", fontWeight: "600" }}>Calculating Balances...</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="db-table" style={{ margin: 0, fontSize: "12px" }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: "16px" }}>Lock</th>
                  <th>Status</th>
                  <th>ID</th>
                  <th>Company Name</th>
                  <th>Last Inv. Amt</th>
                  <th>Inv. Period</th>
                  <th>Last Followup</th>
                  <th>Followup Remarks</th>
                  <th>Total Business</th>
                  <th>Last Pay Date</th>
                  <th>Last Pay Amt</th>
                  <th>Last Pickup</th>
                  <th>Last Service</th>
                  <th>Next Pickup</th>
                  <th>Next Service</th>
                  <th>Total Rec. (VW)</th>
                  <th>Total Rec. (PW)</th>
                  <th>Company Remarks</th>
                  <th style={{ paddingRight: "16px" }}>Statement Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={19} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                      No company records found for this filter.
                    </td>
                  </tr>
                ) : (
                  rows.map((item: any, idx: number) => {
                    const relativeFollowup = formatRelativeDate(item.last_followup);
                    return (
                      <tr key={idx}>
                        <td style={{ paddingLeft: "16px" }}>
                          <button
                            onClick={() => handleToggleLock(item)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: (localLocks[item.id] !== undefined ? localLocks[item.id] : item.vouchers_lock) ? "#10b981" : "#94a3b8",
                              fontSize: "14px"
                            }}
                            title={(localLocks[item.id] !== undefined ? localLocks[item.id] : item.vouchers_lock) ? "Vouchers Unlocked" : "Vouchers Locked"}
                          >
                            <i className={(localLocks[item.id] !== undefined ? localLocks[item.id] : item.vouchers_lock) ? "fas fa-lock-open" : "fas fa-lock"}></i>
                          </button>
                        </td>
                        <td>
                          <span style={{
                            display: "inline-block", padding: "3px 10px", borderRadius: "9999px",
                            fontSize: "10px", fontWeight: "800", textTransform: "uppercase",
                            background: item.status === "CLEARED" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                            color: item.status === "CLEARED" ? "#10b981" : "#ef4444",
                          }}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ color: "#64748b", fontWeight: "600" }}>
                          #{item.id}
                        </td>
                        <td style={{ fontWeight: 700, color: "#1e5cff", whiteSpace: "nowrap" }}>
                          {item.company}
                        </td>
                        <td style={{ color: "#475569", fontWeight: 600 }}>
                          {fmt(item.last_inv_amt)}
                        </td>
                        <td style={{ color: "#64748b", fontSize: "11px" }}>
                          {item.inv_period ?? "N/A"}
                        </td>
                        <td style={{ color: "#64748b", fontSize: "11px", whiteSpace: "nowrap" }}>
                          {relativeFollowup ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span>{relativeFollowup.date}</span>
                              <span style={{ fontSize: "10px", color: "#1e5cff", fontWeight: "700" }}>{relativeFollowup.relative}</span>
                            </div>
                          ) : (
                            "Never"
                          )}
                        </td>
                        <td style={{ color: "#475569", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.followup_remarks || "No remarks"}
                        </td>
                        <td style={{ fontWeight: 700, color: "#1e293b" }}>
                          {fmt(item.total_business)}
                        </td>
                        <td style={{ color: "#64748b", fontSize: "11px", whiteSpace: "nowrap" }}>
                          {formatDateSimple(item.last_pay_date)}
                        </td>
                        <td style={{ fontWeight: 600, color: "#10b981" }}>
                          {item.last_pay_amt > 0 ? fmt(item.last_pay_amt) : "0.00"}
                        </td>
                        <td style={{ color: "#64748b", fontSize: "11px" }}>
                          {formatDateSimple(item.last_pickup)}
                        </td>
                        <td style={{ color: "#64748b", fontSize: "11px" }}>
                          {formatDateSimple(item.last_service)}
                        </td>
                        <td style={{ fontSize: "11px" }}>
                          {item.next_pickup ? (
                            <span style={{ color: "#1e5cff", fontWeight: "600", textDecoration: "underline", cursor: "pointer" }}>
                              {formatDateSimple(item.next_pickup)}
                            </span>
                          ) : (
                            "--"
                          )}
                        </td>
                        <td style={{ fontSize: "11px" }}>
                          {item.next_service ? (
                            <span style={{ color: "#1e5cff", fontWeight: "600", textDecoration: "underline", cursor: "pointer" }}>
                              {formatDateSimple(item.next_service)}
                            </span>
                          ) : (
                            "--"
                          )}
                        </td>
                        <td style={{ fontWeight: 700, color: item.total_rec_vw > 0 ? "#ef4444" : "#64748b" }}>
                          {fmt(item.total_rec_vw)}
                        </td>
                        <td style={{ fontWeight: 700, color: item.total_rec_pw > 0 ? "#f97316" : "#64748b" }}>
                          {fmt(item.total_rec_pw)}
                        </td>
                        <td style={{ minWidth: "150px" }}>
                          {editingRemarks === item.id ? (
                            <div style={{ display: "flex", gap: "4px" }}>
                              <input
                                type="text"
                                value={tempRemarks}
                                onChange={(e) => setTempRemarks(e.target.value)}
                                className="form-input"
                                style={{ padding: "2px 6px", fontSize: "11px", height: "24px" }}
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveRemarks(item)}
                                style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: "4px", padding: "0 8px", cursor: "pointer" }}
                              >
                                <i className="fas fa-check" style={{ fontSize: "10px" }}></i>
                              </button>
                              <button
                                onClick={() => setEditingRemarks(null)}
                                style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", padding: "0 8px", cursor: "pointer" }}
                              >
                                <i className="fas fa-times" style={{ fontSize: "10px" }}></i>
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setEditingRemarks(item.id);
                                setTempRemarks(item.company_remarks || "");
                              }}
                              style={{ cursor: "pointer", minHeight: "18px", color: item.company_remarks ? "#334155" : "#94a3b8", fontSize: "11px" }}
                              title="Click to Edit Remarks"
                            >
                              {item.company_remarks || "Click to add remarks"}
                            </div>
                          )}
                        </td>
                        <td style={{ paddingRight: "16px" }}>
                          <select
                            value={localStatuses[item.id] !== undefined ? localStatuses[item.id] : (item.statement_status || "Pending")}
                            onChange={(e) => handleChangeStatementStatus(item, e.target.value)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "600",
                              border: "1px solid #cbd5e1",
                              background: "#fff",
                              color: "#334155",
                              cursor: "pointer"
                            }}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Awaiting FeedBack">Awaiting FeedBack</option>
                            <option value="Done">Done</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr style={{ background: "#f8fafc", borderTop: "2px solid #e2e8f0", fontWeight: 800 }}>
                    <td style={{ paddingLeft: "16px", color: "#0f172a" }} colSpan={4}>TOTALS ({rows.length} companies)</td>
                    <td colSpan={4}></td>
                    <td style={{ color: "#1e293b" }}>{fmt(totals.total_business)}</td>
                    <td colSpan={6}></td>
                    <td style={{ color: "#ef4444" }}>{fmt(totals.total_rec_vw)}</td>
                    <td style={{ color: "#f97316" }}>{fmt(totals.total_rec_pw)}</td>
                    <td colSpan={2} style={{ paddingRight: "16px" }}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
