"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useGetInvoiceQuery } from "@/store/api/invoicesApi";

const fmt = (n: number) =>
  `SAR ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ViewInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { data: res, isLoading, isError } = useGetInvoiceQuery(id);

  // View state modes (can toggle if condensed or VAT view is clicked)
  const [viewMode, setViewMode] = useState<"standard" | "condensed" | "vat">("standard");

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <div className="spinner" style={{ borderTopColor: "#334155", width: "40px", height: "40px" }}></div>
        <span style={{ marginLeft: "15px", color: "#64748b", fontWeight: "700" }}>Loading Invoice Sheet...</span>
      </div>
    );
  }

  if (isError || !res || res.isError) {
    return (
      <div style={{ padding: "40px", textAlign: "center", background: "#fef2f2", color: "#ef4444", borderRadius: "8px", border: "1px solid #fee2e2" }}>
        <i className="fas fa-exclamation-circle" style={{ fontSize: "24px", marginBottom: "10px" }}></i>
        <h4 style={{ margin: 0, fontWeight: "700" }}>Error Retrieving Invoice</h4>
        <p style={{ margin: "5px 0 15px 0", fontSize: "14px" }}>The invoice record could not be found or has been deleted.</p>
        <button onClick={() => router.push("/admin/invoices")} className="form-btn-back" style={{ display: "inline-flex" }}>
          Back to Invoices
        </button>
      </div>
    );
  }

  const invoice = res.data.invoice;
  const breakdown = res.data.breakdown;
  const bookings = breakdown.bookings || [];
  const services = breakdown.services || [];
  const payments = breakdown.payments || [];
  const activities = breakdown.activities || [];

  const companyName = invoice.customer_relation?.company || invoice.customer || "Individual / Direct";
  const contact = invoice.customer_relation?.contact || "—";

  // Date formatting helpers
  const formatInvoiceDate = (dStr: string) => {
    if (!dStr) return "—";
    return new Date(dStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "50px" }}>
      
      {/* Top Actions Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <button
          onClick={() => router.push("/admin/invoices")}
          style={{
            background: "#ffffff", color: "#475569", border: "1px solid #cbd5e1",
            borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600",
            cursor: "pointer", display: "flex", alignItems: "center", gap: "8px"
          }}
        >
          <i className="fas fa-arrow-left"></i>
          Back to Directory
        </button>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => setViewMode(viewMode === "condensed" ? "standard" : "condensed")}
            style={{
              background: viewMode === "condensed" ? "#6b21a8" : "#8b5cf6",
              color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px",
              fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "flex",
              alignItems: "center", gap: "6px", transition: "all 0.15s ease"
            }}
          >
            <i className="fas fa-list-ul"></i>
            Condensed View
          </button>

          <button
            onClick={() => setViewMode(viewMode === "vat" ? "standard" : "vat")}
            style={{
              background: viewMode === "vat" ? "#065f46" : "#10b981",
              color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px",
              fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "flex",
              alignItems: "center", gap: "6px", transition: "all 0.15s ease"
            }}
          >
            <i className="fas fa-check-double"></i>
            VAT View (Maroof)
          </button>

          <button
            onClick={() => window.print()}
            style={{
              background: "#374151", color: "#ffffff", border: "none",
              borderRadius: "6px", padding: "8px 16px", fontSize: "13px",
              fontWeight: "700", cursor: "pointer", display: "flex",
              alignItems: "center", gap: "6px"
            }}
          >
            <i className="fas fa-file-pdf"></i>
            PDF
          </button>

          <button
            onClick={() => window.print()}
            style={{
              background: "#2563eb", color: "#ffffff", border: "none",
              borderRadius: "6px", padding: "8px 16px", fontSize: "13px",
              fontWeight: "700", cursor: "pointer", display: "flex",
              alignItems: "center", gap: "6px"
            }}
          >
            <i className="fas fa-print"></i>
            Print Invoice
          </button>
        </div>
      </div>

      {/* Main Print Container Sheet */}
      <div id="invoice-print-area" style={{
        background: "#ffffff", borderRadius: "12px", padding: "50px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.03)", position: "relative"
      }}>
        
        {/* Top Header Block */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div style={{ background: "#facc15", color: "#000", padding: "10px", borderRadius: "8px", fontWeight: "900", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center", width: "42px", height: "42px" }}>U</div>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Muhabiya Transport</h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Premium Transportation Solutions</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <h1 style={{ margin: "0 0 8px 0", fontSize: "32px", fontWeight: "900", color: "#2563eb", letterSpacing: "-1px" }}>INVOICE</h1>
            <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#64748b" }}>
              Invoice #: <strong>{invoice.invoice_code}</strong>
            </p>
            <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#64748b" }}>
              Date: <strong>{formatInvoiceDate(invoice.date)}</strong>
            </p>
            <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#64748b" }}>
              Period: <strong>{invoice.period || "—"}</strong>
            </p>
          </div>
        </div>

        <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", marginBottom: "30px" }} />

        {/* Bill To & Payment Status */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "45px", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#94a3b8", display: "block", marginBottom: "8px" }}>Bill To</span>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>{companyName}</h4>
            <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#64748b" }}>Multan Office</p>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>📞 {contact}</p>
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#94a3b8", display: "block", marginBottom: "8px" }}>Payment Status</span>
            <h2 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: "800", color: invoice.status === "Paid" ? "#10b981" : "#ef4444" }}>
              {invoice.status === "Paid" ? "UP TO DATE" : "OUTSTANDING DUE"}
            </h2>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
              Type: <strong>{invoice.type === "VW" ? "Voucher Wise" : "Pickup Wise"}</strong>
            </p>
          </div>
        </div>

        {/* Transportation Bookings Table */}
        <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#2563eb", display: "block", marginBottom: "12px", borderBottom: "2px solid #3b82f6", paddingBottom: "6px" }}>
          Transportation Bookings
        </span>
        <div style={{ overflowX: "auto", marginBottom: "40px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "10px", textAlign: "left", color: "#475569" }}>Voucher Date</th>
                <th style={{ padding: "10px", textAlign: "left", color: "#475569" }}>Pickup Date</th>
                <th style={{ padding: "10px", textAlign: "left", color: "#475569" }}>Voucher #</th>
                <th style={{ padding: "10px", textAlign: "left", color: "#475569" }}>Customer</th>
                <th style={{ padding: "10px", textAlign: "left", color: "#475569" }}>Route / Vehicle</th>
                <th style={{ padding: "10px", textAlign: "left", color: "#475569" }}>Status</th>
                <th style={{ padding: "10px", textAlign: "right", color: "#475569" }}>Booking Price</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                    No bookings found for this period.
                  </td>
                </tr>
              ) : (
                bookings.map((b: any) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px", color: "#475569" }}>{b.date}</td>
                    <td style={{ padding: "10px", color: "#475569" }}>{b.date}</td>
                    <td style={{ padding: "10px", fontWeight: "600", color: "#2563eb" }}>{b.booking_code}</td>
                    <td style={{ padding: "10px", color: "#475569" }}>{companyName}</td>
                    <td style={{ padding: "10px", color: "#475569" }}>{b.pickup} to {b.destination}</td>
                    <td style={{ padding: "10px", color: "#475569" }}>{b.status || "Completed"}</td>
                    <td style={{ padding: "10px", textAlign: "right", fontWeight: "700", color: "#1e293b" }}>{fmt(b.car_price)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Calculations Section */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "40px", marginTop: "20px" }}>
          
          {/* Definitions Column */}
          <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "8px", fontSize: "11px", color: "#64748b", lineHeight: "1.6" }}>
            <p style={{ margin: "0 0 8px 0" }}>
              &bull; <strong>Prev. Balance</strong>: Sum of historical Booking Price and Service Cost minus payments.
            </p>
            <p style={{ margin: "0 0 8px 0" }}>
              &bull; <strong>Current Subtotal</strong>: Sum of all Bookings and Services within this cycle.
            </p>
            <p style={{ margin: "0 0 8px 0" }}>
              &bull; <strong>Balance Due</strong>: (Prev. Bal + Curr. Subtotal - Curr. Payments)
            </p>
            <p style={{ margin: "0" }}>
              &bull; Cancelled items are excluded from all calculations.
            </p>
          </div>

          {/* Breakdowns Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569" }}>
              <span>Previous Balance Carry-over:</span>
              <span style={{ fontWeight: "600" }}>{fmt(breakdown.prev_balance)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569" }}>
              <span>Current Cycle Bookings (Gross):</span>
              <span style={{ fontWeight: "600" }}>{fmt(breakdown.bookings_sum)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569" }}>
              <span>Current Cycle Services:</span>
              <span style={{ fontWeight: "600" }}>{fmt(breakdown.services_sum)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569" }}>
              <span>Cycle Subtotal:</span>
              <span style={{ fontWeight: "600" }}>{fmt(breakdown.cycle_subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#10b981" }}>
              <span>Total Paid in this Cycle:</span>
              <span style={{ fontWeight: "600" }}>- {fmt(breakdown.payments_sum)}</span>
            </div>

            <div style={{
              background: "#2563eb", color: "#ffffff", padding: "14px 20px",
              borderRadius: "8px", display: "flex", justifyContent: "space-between",
              alignItems: "center", marginTop: "10px", fontWeight: "800", fontSize: "15px",
              boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)"
            }}>
              <span>TOTAL BALANCE DUE:</span>
              <span>{fmt(breakdown.total_balance_due)}</span>
            </div>
          </div>
        </div>

        {/* Print Footer Disclaimer */}
        <div style={{ textAlign: "center", marginTop: "50px", fontSize: "11px", color: "#94a3b8", borderTop: "1px dashed #e2e8f0", paddingTop: "20px" }}>
          This is a computer-generated invoice. No signature is required. Thank you for choosing Muhabiya Transport. We appreciate your business!
        </div>

      </div>

      {/* Audit Trail & Activity History Block */}
      <div style={{ background: "#ffffff", borderRadius: "12px", padding: "30px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
        <h4 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "700", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
          <i className="fas fa-history" style={{ color: "#64748b" }}></i>
          Audit Trail & Activity History
        </h4>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
              <th style={{ padding: "10px", color: "#475569" }}>DATETIME</th>
              <th style={{ padding: "10px", color: "#475569" }}>ACTION BY</th>
              <th style={{ padding: "10px", color: "#475569" }}>REMARK</th>
            </tr>
          </thead>
          <tbody>
            {activities.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: "15px", textAlign: "center", color: "#94a3b8" }}>
                  No historical audits recorded for this invoice cycle.
                </td>
              </tr>
            ) : (
              activities.map((a: any) => (
                <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px", color: "#475569" }}>
                    {new Date(a.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td style={{ padding: "10px", fontWeight: "600", color: "#0f172a" }}>
                    {a.user_session || "umrahcab"}
                  </td>
                  <td style={{ padding: "10px", color: "#475569" }}>
                    {a.performed_action}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Premium Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", color: "#94a3b8", fontSize: "12px" }}>
        <span>&copy; 2026 Umrah Cab. All Rights Reserved.</span>
        <span>v2.0</span>
      </div>
    </div>
  );
}
