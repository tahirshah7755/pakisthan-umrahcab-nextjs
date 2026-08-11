"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { exportToExcel } from "@/utils/excelHelper";
import { getSaudiTodayDate } from "@/utils/formatters";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";

interface LedgerRecord {
  id: string;
  custom_id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export default function CompanyLedgerPage() {
  const { settings } = useWebsiteSettings();
  const brandName = settings?.site_title?.split("-")[0]?.trim() || settings?.site_title || "Heba Cab";
  const [activeTab, setActiveTab] = useState<"settlement" | "client">("settlement");
  const [ledgers, setLedgers] = useState<LedgerRecord[]>([]);
  const [clientLedgerData, setClientLedgerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientLoading, setClientLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [paymentModal, setPaymentModal] = useState<{
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

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleOpenPaymentModal = (item: any) => {
    setPaymentModal({
      show: true,
      booking: item,
      receivedAmount: String(item.received_amount || 0),
      saving: false,
    });
  };

  const handleSavePayment = async () => {
    if (!paymentModal.booking) return;
    try {
      setPaymentModal(prev => ({ ...prev, saving: true }));
      const newReceived = parseFloat(paymentModal.receivedAmount) || 0;
      const res = await api.updateCompanyBookingPayment(paymentModal.booking.id, newReceived);
      if (res && res.success) {
        showToast("Client payment updated successfully!", "success");
        setPaymentModal({ show: false, booking: null, receivedAmount: "", saving: false });
        loadClientLedger(search);
      } else {
        showToast(res?.message || "Failed to update payment.", "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast("Error updating payment: " + (err.message || "Unknown error"), "error");
    } finally {
      setPaymentModal(prev => ({ ...prev, saving: false }));
    }
  };


  const loadLedgers = async () => {
    try {
      setLoading(true);
      const data = await api.getCompanyLedgers();
      setLedgers(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to retrieve ledger statements.", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadClientLedger = async (searchTerm = search) => {
    try {
      setClientLoading(true);
      const res = await api.getCompanyClientLedger({ search: searchTerm });
      setClientLedgerData(res);
    } catch (err) {
      console.error(err);
      showToast("Failed to load client payment ledger.", "error");
    } finally {
      setClientLoading(false);
    }
  };

  useEffect(() => {
    loadLedgers();
    loadClientLedger();
  }, []);

  useEffect(() => {
    if (activeTab === "client") {
      loadClientLedger(search);
    }
  }, [search, activeTab]);


  const handleExportExcel = () => {
    if (ledgers.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["Transaction ID", "Date", "Description", "Debit (Charges)", "Credit (Payments)", "Running Balance"];
    const textRows = ledgers.map((l: any) => [
      l.custom_id,
      l.date || "",
      l.description || "",
      l.debit || 0,
      l.credit || 0,
      l.balance || 0
    ]);
    
    exportToExcel({
      title: "Agent Account Ledger Statement",
      headers,
      rows: textRows,
      filename: `ledger_${getSaudiTodayDate()}.xls`,
      totalsIndices: [3, 4]
    });
  };

  const handleCopy = () => {
    if (ledgers.length === 0) {
      showToast("No data to copy!", "error");
      return;
    }
    const headers = ["Transaction ID", "Date", "Description", "Debit (Charges)", "Credit (Payments)", "Running Balance"];
    const textRows = ledgers.map((l: any) => [
      l.custom_id,
      l.date || "",
      l.description || "",
      l.debit || 0,
      l.credit || 0,
      l.balance || 0
    ]);
    const text = [headers.join("\t"), ...textRows.map(r => r.join("\t"))].join("\n");
    navigator.clipboard.writeText(text)
      .then(() => showToast("Copied ledger list to clipboard!", "success"))
      .catch(() => showToast("Failed to copy!", "error"));
  };

  const handleExportCSV = () => {
    if (ledgers.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["Transaction ID", "Date", "Description", "Debit (Charges)", "Credit (Payments)", "Running Balance"];
    const csvContent = [
      headers.join(","),
      ...ledgers.map((l: any) => [
        `"${(l.custom_id || "").replace(/"/g, '""')}"`,
        `"${(l.date || "").replace(/"/g, '""')}"`,
        `"${(l.description || "").replace(/"/g, '""')}"`,
        l.debit || 0,
        l.credit || 0,
        l.balance || 0
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ledger_${getSaudiTodayDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV file downloaded successfully!", "success");
  };

  const handlePrint = (title: string = "Agent Account Ledger Statement") => {
    if (ledgers.length === 0) {
      showToast("No data to print!", "error");
      return;
    }
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocked! Please allow pop-ups to print.", "error");
      return;
    }

    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    
    const rowsHtml = ledgers.map((l: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1e293b;">${l.custom_id}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${l.date}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${l.description}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: ${l.debit > 0 ? "#ef4444" : "#64748b"}; font-weight: bold;">
          ${l.debit > 0 ? `SAR ${Number(l.debit).toFixed(2)}` : "-"}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: ${l.credit > 0 ? "#10b981" : "#64748b"}; font-weight: bold;">
          ${l.credit > 0 ? `SAR ${Number(l.credit).toFixed(2)}` : "-"}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #1e293b;">SAR ${Number(l.balance).toFixed(2)}</td>
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
              <p>${brandName} B2B Agent Account Ledger Registry</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Generated Date:</strong> ${today}</p>
              <p><strong>Total Transactions:</strong> ${ledgers.length}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Date</th>
                <th>Description</th>
                <th style="text-align: right;">Debit (Charges)</th>
                <th style="text-align: right;">Credit (Payments)</th>
                <th style="text-align: right;">Running Balance</th>
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
    else if (fmt === "PDF" || fmt === "Print") handlePrint(fmt === "PDF" ? "Ledger Statement - PDF Report" : "Ledger Statement");
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
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Account Ledger & Client Reports</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Manage Admin Settlement Ledger and Client Payment Accounts.</p>
        </div>
      </div>

      {/* Workflow Tabs */}
      <div style={{ display: "flex", gap: "12px", background: "#ffffff", padding: "12px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <button
          onClick={() => setActiveTab("settlement")}
          style={{
            flex: 1,
            padding: "12px 20px",
            borderRadius: "8px",
            fontWeight: "700",
            fontSize: "14px",
            cursor: "pointer",
            border: activeTab === "settlement" ? "2px solid #2563eb" : "1px solid #e2e8f0",
            background: activeTab === "settlement" ? "#eff6ff" : "#f8fafc",
            color: activeTab === "settlement" ? "#2563eb" : "#64748b",
            transition: "all 0.2s ease"
          }}
        >
          Admin Settlement Ledger (Agent ↔ Admin)
        </button>
        <button
          onClick={() => setActiveTab("client")}
          style={{
            flex: 1,
            padding: "12px 20px",
            borderRadius: "8px",
            fontWeight: "700",
            fontSize: "14px",
            cursor: "pointer",
            border: activeTab === "client" ? "2px solid #2563eb" : "1px solid #e2e8f0",
            background: activeTab === "client" ? "#eff6ff" : "#f8fafc",
            color: activeTab === "client" ? "#2563eb" : "#64748b",
            transition: "all 0.2s ease"
          }}
        >
          Client Payment Ledger (Agent ↔ Client)
        </button>
      </div>

      {activeTab === "client" ? (() => {
        const clientBookingsList = Array.isArray(clientLedgerData)
          ? clientLedgerData
          : (Array.isArray(clientLedgerData?.data)
              ? clientLedgerData.data
              : (Array.isArray(clientLedgerData?.data?.data) ? clientLedgerData.data.data : []));

        const clientSummary = clientLedgerData?.summary || clientLedgerData?.data?.summary || {
          total_billed: clientBookingsList.reduce((s: number, b: any) => s + Number(b.car_price || 0), 0),
          total_received: clientBookingsList.reduce((s: number, b: any) => s + Number(b.received_amount || 0), 0),
          total_pending: clientBookingsList.reduce((s: number, b: any) => s + Number(b.pending_amount || 0), 0),
          total_bookings: clientBookingsList.length
        };

        return (
          /* Client Payment Ledger View */
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: "4px solid #3b82f6" }}>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Total Client Billed</div>
                <div style={{ fontSize: "22px", fontWeight: "800", color: "#1e293b", marginTop: "6px" }}>
                  SAR {Number(clientSummary.total_billed || 0).toLocaleString('en-US', {minimumFractionDigits:2})}
                </div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                  {clientSummary.total_bookings || 0} Client Bookings
                </div>
              </div>

              <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: "4px solid #10b981" }}>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Total Collected from Clients</div>
                <div style={{ fontSize: "22px", fontWeight: "800", color: "#10b981", marginTop: "6px" }}>
                  SAR {Number(clientSummary.total_received || 0).toLocaleString('en-US', {minimumFractionDigits:2})}
                </div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                  Payments received into Agent account
                </div>
              </div>

              <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: "4px solid #ef4444" }}>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Outstanding Client Due</div>
                <div style={{ fontSize: "22px", fontWeight: "800", color: "#ef4444", marginTop: "6px" }}>
                  SAR {Number(clientSummary.total_pending || 0).toLocaleString('en-US', {minimumFractionDigits:2})}
                </div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                  Pending payment from Clients to Agent
                </div>
              </div>
            </div>

            {/* Client Ledger Table */}
            <div className="table-card mobile-card" style={{ padding: "25px", background: "#ffffff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", color: "#1e293b", fontWeight: "700" }}>
                  Client Payment Ledger Breakdown
                </h3>
                <div style={{ width: "260px" }}>
                  <input
                    type="text"
                    placeholder="Filter client or booking..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              {clientLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "30px" }}>
                  <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #2563eb", borderRadius: "50%", width: "30px", height: "30px", animation: "spin 1s linear infinite" }}></div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="db-table" style={{ width: "100%", fontSize: "13px" }}>
                    <thead>
                      <tr>
                        <th>Booking Code</th>
                        <th>Client Name</th>
                        <th>Route</th>
                        <th>Date</th>
                        <th style={{ textAlign: "right" }}>Car Price</th>
                        <th style={{ textAlign: "right" }}>Received</th>
                        <th style={{ textAlign: "right" }}>Pending</th>
                        <th style={{ textAlign: "center" }}>Status</th>
                        <th style={{ textAlign: "center" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientBookingsList.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: "center", color: "#64748b", padding: "30px" }}>
                            No client booking ledger entries found.
                          </td>
                        </tr>
                      ) : (
                        clientBookingsList.map((item: any) => {
                          const isPaid = (item.pending_amount || 0) <= 0;
                          return (
                            <tr key={item.id}>
                              <td style={{ fontWeight: 700, color: "#2563eb" }}>{item.booking_code ? String(item.booking_code).replace(/UCB-/gi, "HCB-") : `HCB-${10000 + Number(item.id || 0)}`}</td>
                              <td>
                                <div style={{ fontWeight: "600" }}>{item.full_name || item.customer?.name || "Client"}</div>
                                <div style={{ fontSize: "11px", color: "#64748b" }}>{item.whatsapp || "N/A"}</div>
                              </td>
                              <td>{item.pickup} → {item.destination}</td>
                              <td>{item.date}</td>
                              <td style={{ textAlign: "right", fontWeight: "600" }}>SAR {Number(item.car_price || 0).toFixed(2)}</td>
                              <td style={{ textAlign: "right", color: "#10b981", fontWeight: "700" }}>SAR {Number(item.received_amount || 0).toFixed(2)}</td>
                              <td style={{ textAlign: "right", color: item.pending_amount > 0 ? "#ef4444" : "#64748b", fontWeight: "700" }}>
                                SAR {Number(item.pending_amount || 0).toFixed(2)}
                              </td>
                              <td style={{ textAlign: "center" }}>
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
                              <td style={{ textAlign: "center" }}>
                                <button
                                  onClick={() => handleOpenPaymentModal(item)}
                                  style={{
                                    padding: "6px 12px",
                                    borderRadius: "6px",
                                    border: "none",
                                    background: isPaid ? "#64748b" : "#2563eb",
                                    color: "#ffffff",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}
                                >
                                  <i className="fas fa-edit"></i>
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

            {/* Quick Update Payment Modal */}
            {paymentModal.show && paymentModal.booking && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "15px" }}>
                <div style={{ background: "#ffffff", borderRadius: "12px", width: "100%", maxWidth: "450px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                    <h3 style={{ margin: 0, fontSize: "18px", color: "#1e293b", fontWeight: "700" }}>
                      Update Client Payment
                    </h3>
                    <button
                      onClick={() => setPaymentModal({ show: false, booking: null, receivedAmount: "", saving: false })}
                      style={{ border: "none", background: "none", fontSize: "18px", color: "#94a3b8", cursor: "pointer" }}
                    >
                      &times;
                    </button>
                  </div>

                  <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", fontSize: "13px", color: "#334155", marginBottom: "16px" }}>
                    <div style={{ marginBottom: "4px" }}><strong>Booking:</strong> <span style={{ color: "#2563eb", fontWeight: "700" }}>{paymentModal.booking.booking_code ? String(paymentModal.booking.booking_code).replace(/UCB-/gi, "HCB-") : `HCB-${10000 + Number(paymentModal.booking.id || 0)}`}</span></div>
                    <div style={{ marginBottom: "4px" }}><strong>Client Name:</strong> {paymentModal.booking.full_name || paymentModal.booking.customer?.name}</div>
                    <div><strong>Car Price:</strong> SAR {Number(paymentModal.booking.car_price || 0).toFixed(2)}</div>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                      Received Amount from Client (SAR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentModal.receivedAmount}
                      onChange={(e) => setPaymentModal(prev => ({ ...prev, receivedAmount: e.target.value }))}
                      style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: "700" }}
                    />
                    <div style={{ fontSize: "12px", fontWeight: "600", color: (Number(paymentModal.booking.car_price || 0) - (parseFloat(paymentModal.receivedAmount) || 0)) > 0 ? "#ef4444" : "#10b981", marginTop: "6px" }}>
                      Calculated Pending Balance: SAR {Math.max(0, Number(paymentModal.booking.car_price || 0) - (parseFloat(paymentModal.receivedAmount) || 0)).toFixed(2)}
                    </div>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <button
                      type="button"
                      onClick={() => setPaymentModal(prev => ({ ...prev, receivedAmount: String(paymentModal.booking.car_price || 0) }))}
                      style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #10b981", background: "#ecfdf5", color: "#047857", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    >
                      <i className="fas fa-check-circle"></i>
                      <span>Mark Fully Paid (SAR {Number(paymentModal.booking.car_price || 0).toFixed(2)})</span>
                    </button>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setPaymentModal({ show: false, booking: null, receivedAmount: "", saving: false })}
                      style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#64748b", fontWeight: "600", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePayment}
                      disabled={paymentModal.saving}
                      style={{ padding: "8px 20px", borderRadius: "6px", border: "none", background: "#2563eb", color: "#ffffff", fontWeight: "700", cursor: "pointer" }}
                    >
                      {paymentModal.saving ? "Saving..." : "Save Payment"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })() : (


        /* Ledger Table Card (Admin Settlement Ledger) */
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
                  <th>Transaction ID</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Debit (Charges)</th>
                  <th>Credit (Payments)</th>
                  <th>Running Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledgers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "#64748b", padding: "30px 10px" }}>No ledger transactions recorded yet.</td>
                  </tr>
                ) : (
                  ledgers.map((l) => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 700, color: "#1e293b" }}>{l.custom_id}</td>
                      <td>{l.date}</td>
                      <td style={{ fontWeight: "600" }}>{l.description}</td>
                      <td style={{ color: l.debit > 0 ? "#ef4444" : "#64748b", fontWeight: "700" }}>
                        {l.debit > 0 ? `SAR ${parseFloat(l.debit as any).toFixed(2)}` : "-"}
                      </td>
                      <td style={{ color: l.credit > 0 ? "#10b981" : "#64748b", fontWeight: "700" }}>
                        {l.credit > 0 ? `SAR ${parseFloat(l.credit as any).toFixed(2)}` : "-"}
                      </td>
                      <td style={{ fontWeight: 800, color: "#1e293b" }}>SAR {parseFloat(l.balance as any).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
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
        }
      `}</style>
    </div>
  );
}
