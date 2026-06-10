"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useGetPaymentsQuery, useUpdatePaymentStatusMutation } from "@/store/api/paymentsApi";
import { useGetCompaniesQuery } from "@/store/api/companiesApi";

const fmt = (n: number, curr = "SAR") =>
  `${curr} ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PaymentsPage() {
  const router = useRouter();

  // Filter input states
  const [companyFilter, setCompanyFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Applied filters state for RTK Query filtering (local filter on list)
  const [appliedFilters, setAppliedFilters] = useState({
    company: "",
    method: "all",
    start_date: "",
    end_date: "",
  });

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  // RTK Queries
  const { data: paymentsData, isLoading, isFetching } = useGetPaymentsQuery(undefined);
  const { data: companiesData } = useGetCompaniesQuery(undefined);
  const [updatePaymentStatus] = useUpdatePaymentStatusMutation();

  const companies = Array.isArray(companiesData)
    ? companiesData
    : (Array.isArray((companiesData as any)?.data) ? (companiesData as any).data : []);

  const paymentsRaw = Array.isArray(paymentsData) ? paymentsData : [];

  // Filter logic
  const filteredPayments = paymentsRaw.filter((item: any) => {
    // Search
    if (search) {
      const s = search.toLowerCase();
      const matchCompany = String(item.company || "").toLowerCase().includes(s);
      const matchId = String(item.custom_id || "").toLowerCase().includes(s);
      const matchMethod = String(item.method || "").toLowerCase().includes(s);
      if (!matchCompany && !matchId && !matchMethod) return false;
    }

    // Company filter
    if (appliedFilters.company && item.company !== appliedFilters.company) {
      return false;
    }

    // Method filter
    if (appliedFilters.method !== "all" && item.method !== appliedFilters.method) {
      return false;
    }

    // Date range filter
    if (appliedFilters.start_date && item.date && item.date < appliedFilters.start_date) {
      return false;
    }
    if (appliedFilters.end_date && item.date && item.date > appliedFilters.end_date) {
      return false;
    }

    return true;
  });

  // Pagination
  const totalRows = filteredPayments.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const fromRow = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const toRow = Math.min(currentPage * rowsPerPage, totalRows);
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      company: companyFilter,
      method: methodFilter,
      start_date: startDate,
      end_date: endDate,
    });
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setCompanyFilter("");
    setMethodFilter("all");
    setStartDate("");
    setEndDate("");
    setAppliedFilters({
      company: "",
      method: "all",
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
      start_date: startStr,
      end_date: endStr,
    });
    setCurrentPage(1);
    showToast(`Applied Quick Filter for last ${days} days!`, "success");
  };

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

      {/* Legacy Quick Filters row */}
      <div className="filter-card" style={{ padding: "20px" }}>
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
      <div className="filter-card">
        <div className="filter-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <div>
            <label className="filter-label">Company Account</label>
            <div className="filter-input-wrapper">
              <i className="fas fa-building filter-icon"></i>
              <select className="filter-input filter-select" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
                <option value="">All Companies</option>
                {companies.map((c: any) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="filter-label">Gateway / Method</label>
            <div className="filter-input-wrapper">
              <i className="fas fa-credit-card filter-icon"></i>
              <select className="filter-input filter-select" value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
                <option value="all">All Methods</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash Receipt">Cash Deposit (Physical)</option>
                <option value="Online Gateway">Online Checkout Card</option>
              </select>
            </div>
          </div>

          <div>
            <label className="filter-label">Date From</label>
            <div className="filter-input-wrapper">
              <i className="fas fa-calendar-alt filter-icon"></i>
              <input type="date" className="filter-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="filter-label">Date To</label>
            <div className="filter-input-wrapper">
              <i className="fas fa-calendar-alt filter-icon"></i>
              <input type="date" className="filter-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
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
            {["Copy", "CSV", "Excel", "PDF", "Print"].map((btn) => (
              <button key={btn} style={{ background: "#64748b", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                {btn}
              </button>
            ))}
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
                            <strong>Notes:</strong> {p.proof_details}
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
                            try {
                              await updatePaymentStatus({ id: p.id, status: e.target.value }).unwrap();
                              showToast(`Payment ${p.custom_id || `PAY-${p.id}`} marked as ${e.target.value}!`, "success");
                            } catch (err) {
                              console.error(err);
                              showToast("Failed to update payment status.", "error");
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
                      <td style={{ paddingRight: "16px", textAlign: "right" }}>
                        <button
                          title="Print Receipt"
                          onClick={() => showToast(`Downloading receipt for payment ${p.custom_id || p.id}...`, "success")}
                          style={{ background: "#f0fdf4", color: "#16a34a", border: "none", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <i className="fas fa-print"></i>
                        </button>
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", color: "#94a3b8", fontSize: "12px" }}>
        <span>&copy; 2026 Umrah Cab. General Payments Registrar.</span>
        <span>v2.0</span>
      </div>
    </div>
  );
}
