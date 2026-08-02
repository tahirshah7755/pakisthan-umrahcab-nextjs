"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useGetLedgersQuery, useGetDirectClientsLedgerQuery } from "@/store/api/ledgersApi";
import { useGetCompaniesQuery } from "@/store/api/companiesApi";
import { exportToExcel } from "@/utils/excelHelper";
import { api } from "@/utils/api";

const fmt = (n: number) =>
  `SAR ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function LedgersPage() {
  const router = useRouter();

  // Tab State
  const [activeTab, setActiveTab] = useState<"agent" | "direct">("agent");

  // Admin Payment Modal State
  const [adminPaymentModal, setAdminPaymentModal] = useState<{
    show: boolean;
    booking: any;
    receivedAmount: string;
    saving: boolean;
  }>({
    show: false,
    booking: null,
    receivedAmount: "",
    saving: false,
  });

  // Filter input states
  const [companyFilter, setCompanyFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Applied filters state for RTK Query filtering (local filter on list)
  const [appliedFilters, setAppliedFilters] = useState({
    company: "",
    type: "all",
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

  const handleOpenAdminPaymentModal = (item: any) => {
    setAdminPaymentModal({
      show: true,
      booking: item,
      receivedAmount: String(item.received_amount || 0),
      saving: false,
    });
  };

  const handleSaveAdminPayment = async () => {
    if (!adminPaymentModal.booking) return;
    try {
      setAdminPaymentModal(prev => ({ ...prev, saving: true }));
      const newReceived = parseFloat(adminPaymentModal.receivedAmount) || 0;
      const res = await api.updateAdminBookingPayment(adminPaymentModal.booking.id, newReceived);
      if (res && (res.success || res.id)) {
        showToast("Payment updated successfully!", "success");
        setAdminPaymentModal({ show: false, booking: null, receivedAmount: "", saving: false });
        refetchDirectLedger();
      } else {
        showToast(res?.message || "Failed to update payment.", "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast("Error updating payment: " + (err.message || "Unknown error"), "error");
    } finally {
      setAdminPaymentModal(prev => ({ ...prev, saving: false }));
    }
  };


  // RTK Queries
  const { data: ledgersData, isLoading, isFetching } = useGetLedgersQuery(undefined);
  const { data: directLedgerRes, isLoading: isDirectLoading, refetch: refetchDirectLedger } = useGetDirectClientsLedgerQuery({
    search,
    start_date: appliedFilters.start_date,
    end_date: appliedFilters.end_date
  });
  const { data: companiesData } = useGetCompaniesQuery(undefined);



  const companies = Array.isArray(companiesData)
    ? companiesData
    : (Array.isArray((companiesData as any)?.data) ? (companiesData as any).data : []);

  const ledgersRaw = Array.isArray(ledgersData)
    ? ledgersData
    : (Array.isArray((ledgersData as any)?.data) ? (ledgersData as any).data : []);

  // Filter logic
  const filteredLedgers = ledgersRaw.filter((item: any) => {
    // Search
    if (search) {
      const s = search.toLowerCase();
      const matchCompany = String(item.company || "").toLowerCase().includes(s);
      const matchDesc = String(item.description || "").toLowerCase().includes(s);
      const matchId = String(item.custom_id || "").toLowerCase().includes(s);
      if (!matchCompany && !matchDesc && !matchId) return false;
    }

    // Company filter
    if (appliedFilters.company && item.company !== appliedFilters.company) {
      return false;
    }

    // Type filter (Debit / Credit)
    if (appliedFilters.type !== "all") {
      if (appliedFilters.type === "debit" && !(item.debit > 0)) return false;
      if (appliedFilters.type === "credit" && !(item.credit > 0)) return false;
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
  const totalRows = filteredLedgers.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const fromRow = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const toRow = Math.min(currentPage * rowsPerPage, totalRows);
  const paginatedLedgers = filteredLedgers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

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

  const setQuickDateFilter = (type: "VW" | "PW", days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    setStartDate(startStr);
    setEndDate(endStr);
    setTypeFilter(type === "VW" ? "credit" : "debit");
    setAppliedFilters({
      company: companyFilter,
      type: type === "VW" ? "credit" : "debit",
      start_date: startStr,
      end_date: endStr,
    });
    setCurrentPage(1);
    showToast(`Applied ${type} Quick Filter for last ${days} days!`, "success");
  };

  const handleCopy = () => {
    if (filteredLedgers.length === 0) {
      showToast("No data to copy!", "error");
      return;
    }
    const headers = ["ID", "Ledger Code", "Company", "Date", "Debit (Dr)", "Credit (Cr)", "Balance", "Remarks"];
    const rows = filteredLedgers.map((ld: any) => [
      ld.id,
      ld.custom_id || `LED-${ld.id}`,
      ld.company || "",
      ld.date ? new Date(ld.date).toLocaleDateString("en-GB") : "",
      ld.debit || 0,
      ld.credit || 0,
      ld.balance || 0,
      ld.description || ""
    ]);
    const text = [headers.join("\t"), ...rows.map((r: any) => r.join("\t"))].join("\n");
    navigator.clipboard.writeText(text)
      .then(() => showToast("Copied ledger list to clipboard!", "success"))
      .catch(() => showToast("Failed to copy!", "error"));
  };

  const handleExportCSV = () => {
    if (filteredLedgers.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["ID", "Ledger Code", "Company", "Date", "Debit (Dr)", "Credit (Cr)", "Balance", "Remarks"];
    const csvContent = [
      headers.join(","),
      ...filteredLedgers.map((ld: any) => [
        ld.id,
        `"${(ld.custom_id || `LED-${ld.id}`).replace(/"/g, '""')}"`,
        `"${(ld.company || "").replace(/"/g, '""')}"`,
        ld.date ? new Date(ld.date).toLocaleDateString("en-GB") : "",
        ld.debit || 0,
        ld.credit || 0,
        ld.balance || 0,
        `"${(ld.description || "").replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ledgers_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV file downloaded successfully!", "success");
  };

  const handleExportExcel = () => {
    if (filteredLedgers.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["ID", "Ledger Code", "Company", "Date", "Debit (Dr)", "Credit (Cr)", "Balance", "Remarks"];
    const rows = filteredLedgers.map((ld: any) => [
      ld.id,
      ld.custom_id || `LED-${ld.id}`,
      ld.company || "",
      ld.date ? new Date(ld.date).toLocaleDateString("en-GB") : "",
      ld.debit || 0,
      ld.credit || 0,
      ld.balance || 0,
      ld.description || ""
    ]);
    
    exportToExcel({
      title: "Ledger Audit Report",
      headers,
      rows,
      filename: `ledgers_${new Date().toISOString().split("T")[0]}.xls`,
      totalsIndices: [4, 5]
    });
  };

  const handlePrint = (title: string = "Ledger Audit Report") => {
    if (filteredLedgers.length === 0) {
      showToast("No data to print!", "error");
      return;
    }
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocked! Please allow pop-ups to print.", "error");
      return;
    }

    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    
    const rowsHtml = filteredLedgers.map((ld: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">#${ld.id}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #ea580c;">${ld.custom_id || `LED-${ld.id}`}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${ld.company || ""}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${ld.date ? new Date(ld.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "--"}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${ld.debit > 0 ? fmt(ld.debit) : "--"}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #059669;">${ld.credit > 0 ? fmt(ld.credit) : "--"}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${fmt(ld.balance)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${ld.description || "—"}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; margin: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ea580c; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #ea580c; font-size: 24px; }
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
              <p>Umrah Cab Ledger Auditor Registry Statement</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Generated Date:</strong> ${today}</p>
              <p><strong>Total Records:</strong> ${filteredLedgers.length}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Ledger Code</th>
                <th>Company</th>
                <th>Date</th>
                <th style="text-align: right;">Debit (Dr)</th>
                <th style="text-align: right;">Credit (Cr)</th>
                <th style="text-align: right;">New Balance</th>
                <th>Remarks / Description</th>
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
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #ea580c 0%, #d97706 100%)", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
        <div>
          <h2>Ledger Directory</h2>
          <p>Audit cash transfers, balance adjustments, and dynamic voucher balances.</p>
        </div>
      </div>

      {/* Mode / Workflow Tab Navigation */}
      <div style={{ display: "flex", gap: "12px", background: "#ffffff", padding: "12px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <button
          onClick={() => setActiveTab("agent")}
          style={{
            flex: 1,
            padding: "12px 20px",
            borderRadius: "8px",
            fontWeight: "700",
            fontSize: "14px",
            cursor: "pointer",
            border: activeTab === "agent" ? "2px solid #ea580c" : "1px solid #e2e8f0",
            background: activeTab === "agent" ? "#fff7ed" : "#f8fafc",
            color: activeTab === "agent" ? "#ea580c" : "#64748b",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
        >
          <i className="fas fa-building"></i>
          <span>Agent / B2B Settlement Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab("direct")}
          style={{
            flex: 1,
            padding: "12px 20px",
            borderRadius: "8px",
            fontWeight: "700",
            fontSize: "14px",
            cursor: "pointer",
            border: activeTab === "direct" ? "2px solid #ea580c" : "1px solid #e2e8f0",
            background: activeTab === "direct" ? "#fff7ed" : "#f8fafc",
            color: activeTab === "direct" ? "#ea580c" : "#64748b",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
        >
          <i className="fas fa-user-check"></i>
          <span>Direct Client Payment Ledger</span>
        </button>
      </div>

      {activeTab === "direct" ? (
        /* Direct Client Payment Ledger View */
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", borderLeft: "4px solid #3b82f6" }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Total Direct Billed</div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: "#1e293b", marginTop: "6px" }}>
                {fmt(directLedgerRes?.summary?.total_billed || 0)}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                {directLedgerRes?.summary?.total_bookings || 0} Direct Bookings
              </div>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", borderLeft: "4px solid #10b981" }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Total Received</div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: "#10b981", marginTop: "6px" }}>
                {fmt(directLedgerRes?.summary?.total_received || 0)}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                Collected from direct clients
              </div>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", borderLeft: "4px solid #ef4444" }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Pending Balance</div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: "#ef4444", marginTop: "6px" }}>
                {fmt(directLedgerRes?.summary?.total_pending || 0)}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                Outstanding from direct clients
              </div>
            </div>
          </div>

          {/* Direct Clients Search & Table */}
          <div className="table-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#1e293b", fontWeight: "700" }}>
                Direct Clients Payment Registry
              </h3>
              <div style={{ width: "300px" }}>
                <input
                  type="text"
                  placeholder="Search code, name, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-input"
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {isDirectLoading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading Direct Client Ledger...</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ padding: "12px", textAlign: "left" }}>Booking Code</th>
                      <th style={{ padding: "12px", textAlign: "left" }}>Client Details</th>
                      <th style={{ padding: "12px", textAlign: "left" }}>Route / Service</th>
                      <th style={{ padding: "12px", textAlign: "left" }}>Date</th>
                      <th style={{ padding: "12px", textAlign: "right" }}>Total Price</th>
                      <th style={{ padding: "12px", textAlign: "right" }}>Received</th>
                      <th style={{ padding: "12px", textAlign: "right" }}>Pending</th>
                      <th style={{ padding: "12px", textAlign: "center" }}>Status</th>
                      <th style={{ padding: "12px", textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!directLedgerRes?.data || directLedgerRes.data.length === 0) ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                          No direct client entries found.
                        </td>
                      </tr>
                    ) : (
                      directLedgerRes.data.map((item: any) => {
                        const pendingVal = typeof item.calculated_pending !== "undefined" 
                          ? Number(item.calculated_pending) 
                          : Math.max(0, Number(item.car_price || 0) - Number(item.received_amount || 0));
                        const isPaid = pendingVal <= 0;
                        return (
                          <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "12px", fontWeight: "700", color: "#ea580c" }}>
                              {item.booking_code || `UCB-${item.id}`}
                            </td>
                            <td style={{ padding: "12px" }}>
                              <div style={{ fontWeight: "600", color: "#1e293b" }}>{item.full_name || item.customer?.name || "Direct Client"}</div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>{item.whatsapp || item.email || "No contact"}</div>
                            </td>
                            <td style={{ padding: "12px", fontSize: "12px" }}>
                              {item.pickup} → {item.destination}
                            </td>
                            <td style={{ padding: "12px", fontSize: "12px" }}>{item.date}</td>
                            <td style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>
                              {fmt(item.car_price)}
                            </td>
                            <td style={{ padding: "12px", textAlign: "right", color: "#10b981", fontWeight: "600" }}>
                              {fmt(item.received_amount)}
                            </td>
                            <td style={{ padding: "12px", textAlign: "right", color: pendingVal > 0 ? "#ef4444" : "#64748b", fontWeight: "700" }}>
                              {fmt(pendingVal)}
                            </td>
                            <td style={{ padding: "12px", textAlign: "center" }}>
                              <span style={{
                                padding: "4px 8px",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: "700",
                                background: isPaid ? "#dcfce7" : "#fee2e2",
                                color: isPaid ? "#15803d" : "#b91c1c"
                              }}>
                                {isPaid ? "Paid" : "Pending"}
                              </span>
                            </td>
                            <td style={{ padding: "12px", textAlign: "center" }}>
                              <button
                                onClick={() => handleOpenAdminPaymentModal(item)}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: "6px",
                                  border: "none",
                                  background: isPaid ? "#64748b" : "#ea580c",
                                  color: "#ffffff",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}
                              >
                                <span>{isPaid ? "Edit" : "Update Payment"}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Admin Quick Update Payment Modal */}
          {adminPaymentModal.show && adminPaymentModal.booking && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "15px" }}>
              <div style={{ background: "#ffffff", borderRadius: "12px", width: "100%", maxWidth: "450px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#1e293b", fontWeight: "700" }}>
                    Update Direct Client Payment
                  </h3>
                  <button
                    onClick={() => setAdminPaymentModal({ show: false, booking: null, receivedAmount: "", saving: false })}
                    style={{ border: "none", background: "none", fontSize: "18px", color: "#94a3b8", cursor: "pointer" }}
                  >
                    &times;
                  </button>
                </div>

                <div style={{ background: "#fff7ed", borderLeft: "4px solid #ea580c", padding: "12px", borderRadius: "8px", fontSize: "13px", color: "#334155", marginBottom: "16px" }}>
                  <div style={{ marginBottom: "4px" }}><strong>Booking:</strong> <span style={{ color: "#ea580c", fontWeight: "700" }}>{adminPaymentModal.booking.booking_code || `UCB-${adminPaymentModal.booking.id}`}</span></div>
                  <div style={{ marginBottom: "4px" }}><strong>Client:</strong> {adminPaymentModal.booking.full_name || adminPaymentModal.booking.customer?.name}</div>
                  <div><strong>Total Price:</strong> SAR {Number(adminPaymentModal.booking.car_price || 0).toFixed(2)}</div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                    Received Amount (SAR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={adminPaymentModal.receivedAmount}
                    onChange={(e) => setAdminPaymentModal(prev => ({ ...prev, receivedAmount: e.target.value }))}
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "700" }}
                  />
                  <div style={{ fontSize: "12px", fontWeight: "600", color: (Number(adminPaymentModal.booking.car_price || 0) - (parseFloat(adminPaymentModal.receivedAmount) || 0)) > 0 ? "#ef4444" : "#10b981", marginTop: "6px" }}>
                    Calculated Pending Balance: SAR {Math.max(0, Number(adminPaymentModal.booking.car_price || 0) - (parseFloat(adminPaymentModal.receivedAmount) || 0)).toFixed(2)}
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <button
                    type="button"
                    onClick={() => setAdminPaymentModal(prev => ({ ...prev, receivedAmount: String(adminPaymentModal.booking.car_price || 0) }))}
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #10b981", background: "#ecfdf5", color: "#047857", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    <i className="fas fa-check-circle"></i>
                    <span>Mark Fully Paid (SAR {Number(adminPaymentModal.booking.car_price || 0).toFixed(2)})</span>
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setAdminPaymentModal({ show: false, booking: null, receivedAmount: "", saving: false })}
                    style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#64748b", fontWeight: "600", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAdminPayment}
                    disabled={adminPaymentModal.saving}
                    style={{ padding: "8px 20px", borderRadius: "6px", border: "none", background: "#ea580c", color: "#ffffff", fontWeight: "700", cursor: "pointer" }}
                  >
                    {adminPaymentModal.saving ? "Saving..." : "Save Payment"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (

        /* Agent / B2B Settlement Ledger View */
        <>
          {/* Legacy Quick Filters row */}
          <div className="filter-card" style={{ padding: "20px" }}>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Voucher Wise (VW)</span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={() => setQuickDateFilter("VW", 0)} className="quick-filter-btn">Today VW</button>
              <button onClick={() => setQuickDateFilter("VW", 1)} className="quick-filter-btn">Yesterday VW</button>
              <button onClick={() => setQuickDateFilter("VW", 7)} className="quick-filter-btn">Last 7 Days VW</button>
            </div>
          </div>

          <div style={{ width: "1px", height: "40px", background: "#e2e8f0" }}></div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Pickup Wise (PW)</span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={() => setQuickDateFilter("PW", 0)} className="quick-filter-btn">Today PW</button>
              <button onClick={() => setQuickDateFilter("PW", 1)} className="quick-filter-btn">Yesterday PW</button>
              <button onClick={() => setQuickDateFilter("PW", 7)} className="quick-filter-btn">Last 7 Days PW</button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="filter-card">
        <div className="filter-grid">
          <div>
            <label className="filter-label">Corporate Account</label>
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
            <label className="filter-label">Entry Type</label>
            <div className="filter-input-wrapper">
              <i className="fas fa-list filter-icon"></i>
              <select className="filter-input filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                <option value="credit">Credit (Cr) - Addition</option>
                <option value="debit">Debit (Dr) - Reduction</option>
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
              className="filter-btn-apply"
            >
              <i className="fas fa-filter"></i> Apply
            </button>
            <button
              onClick={handleResetFilters}
              className="filter-btn-reset"
              title="Reset Filters"
            >
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>
      </div>


      {/* Table view card */}
      <div className="table-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #f1f5f9", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={handleCopy} style={{ background: "#64748b", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              Copy
            </button>
            <button onClick={handleExportCSV} style={{ background: "#64748b", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              CSV
            </button>
            <button onClick={handleExportExcel} style={{ background: "#64748b", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              Excel
            </button>
            <button onClick={() => handlePrint("Ledger Audit Report - PDF Statement")} style={{ background: "#64748b", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              PDF
            </button>
            <button onClick={() => handlePrint("Ledger Audit Report")} style={{ background: "#64748b", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              Print
            </button>
            {isFetching && (
              <span style={{ fontSize: "12px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
                <div className="spinner" style={{ width: "12px", height: "12px", borderWidth: "2px", borderTopColor: "#ea580c" }}></div>
                Updating...
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ position: "relative" }}>
              <i className="fas fa-search" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "12px" }}></i>
              <input
                type="text"
                placeholder="Search Narratives..."
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
            <div className="spinner" style={{ borderTopColor: "#ea580c" }}></div>
            <span style={{ marginLeft: "12px", color: "#64748b", fontWeight: "600" }}>Fetching Ledger Registry...</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="db-table" style={{ margin: 0, fontSize: "12px" }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: "16px" }}>ID</th>
                  <th>Ledger Code</th>
                  <th>Company</th>
                  <th>Date</th>
                  <th>Debit (Dr)</th>
                  <th>Credit (Cr)</th>
                  <th>New Balance</th>
                  <th>Remarks / Description</th>
                  <th style={{ paddingRight: "16px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLedgers.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                      No ledger records found matching the active criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedLedgers.map((ld: any) => (
                    <tr key={ld.id}>
                      <td style={{ paddingLeft: "16px", color: "#64748b", fontWeight: "600" }}>
                        #{ld.id}
                      </td>
                      <td style={{ fontWeight: 700, color: "#ea580c" }}>
                        {ld.custom_id || `LED-${ld.id}`}
                      </td>
                      <td style={{ fontWeight: 600, color: "#334155" }}>
                        {ld.company}
                      </td>
                      <td>
                        {ld.date ? new Date(ld.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "--"}
                      </td>
                      <td style={{ fontWeight: 700, color: ld.debit > 0 ? "#4b5563" : "#94a3b8" }}>
                        {ld.debit > 0 ? fmt(ld.debit) : "--"}
                      </td>
                      <td style={{ fontWeight: 700, color: ld.credit > 0 ? "#059669" : "#94a3b8" }}>
                        {ld.credit > 0 ? fmt(ld.credit) : "--"}
                      </td>
                      <td style={{ fontWeight: 800, color: "#1e293b" }}>
                        {fmt(ld.balance)}
                      </td>
                      <td style={{ color: "#64748b", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={ld.description}>
                        {ld.description || "—"}
                      </td>
                      <td style={{ paddingRight: "16px", textAlign: "right" }}>
                        <button
                          title="Print Ledger Report"
                          onClick={() => showToast(`Printing ledger statement ${ld.custom_id}...`, "success")}
                          style={{ background: "#eff6ff", color: "#1e5cff", border: "none", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
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
      </>
      )}


      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", color: "#94a3b8", fontSize: "12px" }}>

        <span>&copy; 2026 Umrah Cab. Ledger Auditor Module.</span>
        <span>v2.0</span>
      </div>
    </div>
  );
}
