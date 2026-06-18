"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useGetInvoicesQuery, useUpdateInvoiceMutation, useDeleteInvoiceMutation } from "@/store/api/invoicesApi";
import { useGetCompaniesQuery } from "@/store/api/companiesApi";

const fmt = (n: number) =>
  `SAR ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function InvoicesPage() {
  const router = useRouter();

  // Filter input states
  const [companyFilter, setCompanyFilter] = useState("");
  const [typeFilter,    setTypeFilter]    = useState("all");
  const [startDate,     setStartDate]     = useState("");
  const [endDate,       setEndDate]       = useState("");

  // Applied filters state (sends to RTK Query)
  const [appliedFilters, setAppliedFilters] = useState({
    company: "",
    type: "all",
    start_date: "",
    end_date: "",
  });

  const [search,         setSearch]         = useState("");
  const [currentPage,    setCurrentPage]    = useState(1);
  const [rowsPerPage,    setRowsPerPage]    = useState(10);

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
    if (invoices.length === 0) {
      showToast("No data to copy!", "error");
      return;
    }
    const headers = ["ID", "Invoice #", "Company", "Date", "Period", "Type", "Amount", "Remarks", "Entered By"];
    const textRows = invoices.map((inv: any) => [
      inv.id,
      inv.invoice_code || "",
      inv.customer_relation?.company || inv.customer || "Individual / Direct",
      inv.date ? new Date(inv.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "",
      inv.period || "",
      inv.type || "",
      inv.amount || 0,
      inv.remarks || "",
      inv.entered_by || "System Admin"
    ]);
    const text = [headers.join("\t"), ...textRows.map((r: any) => r.join("\t"))].join("\n");
    navigator.clipboard.writeText(text)
      .then(() => showToast("Copied invoices to clipboard!", "success"))
      .catch(() => showToast("Failed to copy!", "error"));
  };

  const handleExportCSV = () => {
    if (invoices.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["ID", "Invoice #", "Company", "Date", "Period", "Type", "Amount", "Remarks", "Entered By"];
    const csvContent = [
      headers.join(","),
      ...invoices.map((inv: any) => [
        inv.id,
        `"${(inv.invoice_code || "").replace(/"/g, '""')}"`,
        `"${(inv.customer_relation?.company || inv.customer || "Individual / Direct").replace(/"/g, '""')}"`,
        `"${inv.date ? new Date(inv.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""}"`,
        `"${(inv.period || "").replace(/"/g, '""')}"`,
        `"${(inv.type || "").replace(/"/g, '""')}"`,
        inv.amount || 0,
        `"${(inv.remarks || "").replace(/"/g, '""')}"`,
        `"${(inv.entered_by || "System Admin").replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `invoices_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV file downloaded successfully!", "success");
  };

  const handleExportExcel = () => {
    if (invoices.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["ID", "Invoice #", "Company", "Date", "Period", "Type", "Amount", "Remarks", "Entered By"];
    const textRows = invoices.map((inv: any) => [
      inv.id,
      inv.invoice_code || "",
      inv.customer_relation?.company || inv.customer || "Individual / Direct",
      inv.date ? new Date(inv.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "",
      inv.period || "",
      inv.type || "",
      inv.amount || 0,
      inv.remarks || "",
      inv.entered_by || "System Admin"
    ]);
    
    const excelContent = [
      headers.join("\t"),
      ...textRows.map((r: any) => r.join("\t"))
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + excelContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `invoices_${new Date().toISOString().split("T")[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Excel spreadsheet downloaded successfully!", "success");
  };

  const handlePrint = (title: string = "Corporate Invoices Registry") => {
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
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #64748b;">#${inv.id}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1e5cff;">${inv.invoice_code || ""}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155;">${inv.customer_relation?.company || inv.customer || "Individual / Direct"}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${inv.date ? new Date(inv.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "--"}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${inv.period || "—"}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${inv.type || "VW"}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: right;">${fmt(inv.amount)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${inv.remarks || "—"}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${inv.entered_by || "System Admin"}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; margin: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #dc2626; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #dc2626; font-size: 24px; }
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
              <p>Umrah Cab Invoices Ledger Registry</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Generated Date:</strong> ${today}</p>
              <p><strong>Total Invoices:</strong> ${invoices.length}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Invoice #</th>
                <th>Company</th>
                <th>Date</th>
                <th>Period</th>
                <th>Type</th>
                <th style="text-align: right;">Amount</th>
                <th>Remarks</th>
                <th>Entered By</th>
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

  // Queries & Mutations
  const { data: response, isLoading, isFetching } = useGetInvoicesQuery({
    page:       currentPage,
    per_page:   rowsPerPage,
    search:     search     || undefined,
    company:    appliedFilters.company || undefined,
    type:       appliedFilters.type    || undefined,
    start_date: appliedFilters.start_date || undefined,
    end_date:   appliedFilters.end_date   || undefined,
  });

  const { data: companiesData } = useGetCompaniesQuery(undefined);
  const [updateInvoice] = useUpdateInvoiceMutation();
  const [deleteInvoice] = useDeleteInvoiceMutation();

  const companies = Array.isArray(companiesData)
    ? companiesData
    : (Array.isArray((companiesData as any)?.data) ? (companiesData as any).data : []);

  // Response structure
  const paginator = response?.data ?? response;
  const invoices  = Array.isArray(paginator?.data) ? paginator.data : [];
  const totalRows = paginator?.total ?? 0;
  const totalPages = paginator?.last_page ?? 1;
  const fromRow   = paginator?.from ?? 0;
  const toRow     = paginator?.to ?? 0;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      company: companyFilter,
      type: typeFilter,
      start_date: startDate,
      end_date: endDate,
    });
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setCompanyFilter("");
    setTypeFilter("all");
    setStartDate("");
    setEndDate("");
    setAppliedFilters({
      company: "",
      type: "all",
      start_date: "",
      end_date: "",
    });
    setCurrentPage(1);
  };

  const handleQuickFilter = (type: "VW" | "PW", dateType: "today" | "yesterday" | "last_7") => {
    const today = new Date();
    let start = "";
    let end = today.toISOString().split("T")[0];

    if (dateType === "today") {
      start = end;
    } else if (dateType === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      start = yesterday.toISOString().split("T")[0];
      end = start;
    } else if (dateType === "last_7") {
      const last7 = new Date();
      last7.setDate(today.getDate() - 7);
      start = last7.toISOString().split("T")[0];
    }

    setTypeFilter(type);
    setStartDate(start);
    setEndDate(end);

    setAppliedFilters({
      company: companyFilter,
      type: type,
      start_date: start,
      end_date: end,
    });
    setCurrentPage(1);
  };

  const handleMarkPaid = async (item: any) => {
    try {
      await updateInvoice({
        id: item.id,
        balance: 0,
        status: "Paid",
      }).unwrap();
      showToast(`Invoice ${item.invoice_code} marked as Paid successfully!`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to mark invoice as paid.", "error");
    }
  };

  const handleDelete = async (item: any) => {
    if (confirm(`Are you sure you want to delete invoice ${item.invoice_code}?`)) {
      try {
        await deleteInvoice(item.id).unwrap();
        showToast(`Invoice ${item.invoice_code} deleted successfully!`, "success");
      } catch (err) {
        console.error(err);
        showToast("Failed to delete invoice.", "error");
      }
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
          transition: "all 0.3s ease"
        }}>
          <i className={toast.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Crimson Red Theme Header Card */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)" }}>
        <div>
          <h2>Invoices Directory</h2>
          <p>Manage, filter, and track all generated invoices across all companies.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => router.push("/admin/invoices/add")}
            style={{
              background: "#ffffff",
              color: "#059669",
              border: "1px solid #cbd5e1",
              borderRadius: "20px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease"
            }}
          >
            <i className="fas fa-plus" style={{ color: "#059669" }}></i>
            <span>Create New Invoice</span>
          </button>
        </div>
      </div>

      {/* Voucher Wise / Pickup Wise Quick Actions Row */}
      <div style={{ display: "flex", gap: "20px", background: "#fff", padding: "15px 20px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", flexWrap: "wrap" }}>
        {/* Voucher Wise */}
        <div style={{ flex: 1, minWidth: "280px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", display: "block", marginBottom: "8px" }}>Voucher Wise (VW)</span>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={() => handleQuickFilter("VW", "today")} style={{ background: "#eff6ff", border: "1px solid #3b82f6", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", color: "#1d4ed8" }}>
              <i className="far fa-calendar-alt" style={{ color: "#3b82f6" }}></i> Today VW
            </button>
            <button onClick={() => handleQuickFilter("VW", "yesterday")} style={{ background: "#fffbeb", border: "1px solid #f59e0b", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", color: "#b45309" }}>
              <i className="far fa-calendar-alt" style={{ color: "#f59e0b" }}></i> Yesterday VW
            </button>
            <button onClick={() => handleQuickFilter("VW", "last_7")} style={{ background: "#f5f3ff", border: "1px solid #8b5cf6", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", color: "#6d28d9" }}>
              <i className="fas fa-history" style={{ color: "#8b5cf6" }}></i> Last 7 Days VW
            </button>
          </div>
        </div>

        {/* Pickup Wise */}
        <div style={{ flex: 1, minWidth: "280px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", display: "block", marginBottom: "8px" }}>Pickup Wise (PW)</span>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={() => handleQuickFilter("PW", "today")} style={{ background: "#eff6ff", border: "1px solid #3b82f6", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", color: "#1d4ed8" }}>
              <i className="far fa-calendar-alt" style={{ color: "#3b82f6" }}></i> Today PW
            </button>
            <button onClick={() => handleQuickFilter("PW", "yesterday")} style={{ background: "#fffbeb", border: "1px solid #f59e0b", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", color: "#b45309" }}>
              <i className="far fa-calendar-alt" style={{ color: "#f59e0b" }}></i> Yesterday PW
            </button>
            <button onClick={() => handleQuickFilter("PW", "last_7")} style={{ background: "#f5f3ff", border: "1px solid #8b5cf6", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", color: "#6d28d9" }}>
              <i className="fas fa-history" style={{ color: "#8b5cf6" }}></i> Last 7 Days PW
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Filter Section */}
      <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: "5px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "15px", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>Company</label>
            <select
              className="form-input"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              style={{ width: "100%", height: "38px" }}
            >
              <option value="">All Companies</option>
              {companies.map((c: any) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>Type</label>
            <select
              className="form-input"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ width: "100%", height: "38px" }}
            >
              <option value="all">All Types</option>
              <option value="VW">VW (Voucher Wise)</option>
              <option value="PW">PW (Pickup Wise)</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>Start Date</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: "100%", height: "38px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>End Date</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: "100%", height: "38px" }}
            />
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleApplyFilters}
              style={{
                background: "#1e5cff",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                height: "38px",
                padding: "0 20px",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                flex: 1,
                justifyContent: "center"
              }}
            >
              <i className="fas fa-filter" style={{ color: "#10b981" }}></i> Apply
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

      {/* Table Card */}
      <div className="table-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Toolbar */}
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
            <button onClick={() => handlePrint("Invoices Registry - PDF Report")} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              PDF
            </button>
            <button onClick={() => handlePrint("Corporate Invoices Registry")} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
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
            <div style={{ position: "relative" }}>
              <i className="fas fa-search" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "12px" }}></i>
              <input
                type="text"
                placeholder="Search Invoices..."
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
            <div className="spinner" style={{ borderTopColor: "#334155" }}></div>
            <span style={{ marginLeft: "12px", color: "#64748b", fontWeight: "600" }}>Fetching Invoices...</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="db-table" style={{ margin: 0, fontSize: "12px" }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: "16px" }}>ID</th>
                  <th>Invoice #</th>
                  <th>Company</th>
                  <th>Date</th>
                  <th>Period</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Remarks</th>
                  <th>Entered By</th>
                  <th style={{ paddingRight: "16px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                      No invoice records found in database.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv: any) => (
                    <tr key={inv.id}>
                      <td style={{ paddingLeft: "16px", color: "#64748b", fontWeight: "600" }}>
                        #{inv.id}
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        <span 
                          onClick={() => router.push(`/admin/invoices/${inv.id}`)}
                          style={{ color: "#1e5cff", cursor: "pointer", textDecoration: "underline" }}
                        >
                          {inv.invoice_code}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: "#334155" }}>
                        {inv.customer_relation?.company || inv.customer || "Individual / Direct"}
                      </td>
                      <td>
                        {inv.date ? new Date(inv.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "--"}
                      </td>
                      <td style={{ color: "#475569" }}>
                        {inv.period || "—"}
                      </td>
                      <td>
                        <span style={{
                          display: "inline-block", padding: "2px 8px", borderRadius: "4px",
                          fontSize: "11px", fontWeight: "600",
                          background: inv.type === "VW" ? "rgba(139,92,246,0.1)" : "rgba(249,115,22,0.1)",
                          color: inv.type === "VW" ? "#8b5cf6" : "#f97316",
                        }}>
                          {inv.type || "VW"}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: "#1e293b" }}>
                        {fmt(inv.amount)}
                      </td>
                      <td style={{ color: "#64748b", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={inv.remarks}>
                        {inv.remarks || "—"}
                      </td>
                      <td style={{ color: "#475569" }}>
                        {inv.entered_by || "System Admin"}
                      </td>
                      <td style={{ paddingRight: "16px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button
                            title="Detailed View"
                            onClick={() => router.push(`/admin/invoices/${inv.id}`)}
                            style={{ background: "#eff6ff", color: "#2563eb", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                          >
                            <i className="far fa-eye"></i>
                          </button>
                          <button
                            title="Condensed View"
                            onClick={() => router.push(`/admin/invoices/${inv.id}?view=condensed`)}
                            style={{ background: "#f5f3ff", color: "#8b5cf6", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                          >
                            <i className="fas fa-file-lines"></i>
                          </button>
                          <button
                            title="VAT View"
                            onClick={() => router.push(`/admin/invoices/${inv.id}?view=vat`)}
                            style={{ background: "#f0fdf4", color: "#16a34a", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                          >
                            <i className="fas fa-receipt"></i>
                          </button>
                          <button
                            title="Mark Paid / Edit"
                            onClick={() => handleMarkPaid(inv)}
                            disabled={inv.status === "Paid"}
                            style={{ background: "#f0fdfa", color: "#0d9488", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: inv.status === "Paid" ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: inv.status === "Paid" ? 0.5 : 1, transition: "all 0.15s" }}
                          >
                            <i className="fas fa-pencil"></i>
                          </button>
                          <button
                            title="Delete"
                            onClick={() => handleDelete(inv)}
                            style={{ background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                          >
                            <i className="fas fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination Footer */}
        {totalRows > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}>
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              Showing <strong>{fromRow}</strong> to <strong>{toRow}</strong> of <strong>{totalRows}</strong> records
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {/* Rows Per Page Selector */}
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

      {/* Premium Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", color: "#94a3b8", fontSize: "12px" }}>
        <span>&copy; 2026 Umrah Cab. All Rights Reserved.</span>
        <span>v2.0</span>
      </div>
    </div>
  );
}
