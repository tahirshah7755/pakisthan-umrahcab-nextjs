"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useGetInvoiceQuery } from "@/store/api/invoicesApi";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";
import { formatDateToCustom } from "@/utils/formatters";

const fmt = (n: number) =>
  `SAR ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function InvoicePrintContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const autoPrint = searchParams.get("autoprint") !== "0";

  const { data: res, isLoading, isError } = useGetInvoiceQuery(id, { skip: !id });
  const { settings } = useWebsiteSettings();

  const siteLogo = settings?.website_logo || "";
  const siteName = settings?.site_title || "";
  const siteDesc = settings?.hero_title || settings?.meta_description || "";

  const [hasTriggeredPrint, setHasTriggeredPrint] = useState(false);

  useEffect(() => {
    if (!isLoading && res?.data?.invoice && autoPrint && !hasTriggeredPrint) {
      const timer = setTimeout(() => {
        window.print();
        setHasTriggeredPrint(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, res, autoPrint, hasTriggeredPrint]);

  useEffect(() => {
    if (res?.data?.invoice?.invoice_code) {
      document.title = `${res.data.invoice.invoice_code} - ${siteName} Invoice`;
    }
  }, [res, siteName]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #2563eb", borderRadius: "50%", width: "48px", height: "48px", animation: "spin 1s linear infinite", margin: "0 auto 16px" }}></div>
          <p style={{ color: "#475569", fontWeight: "600" }}>Loading printable invoice...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (isError || !res?.data?.invoice) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "20px", fontFamily: "sans-serif" }}>
        <div style={{ maxWidth: "450px", width: "100%", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "30px", textAlign: "center", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: "40px", color: "#ef4444", marginBottom: "16px" }}></i>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>Failed to Load Invoice</h2>
          <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "13px" }}>Invoice not found or invalid identifier.</p>
          <button onClick={() => window.close()} style={{ background: "#475569", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 16px", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}>Close Window</button>
        </div>
      </div>
    );
  }

  const { invoice, bookings, services } = res.data;
  const grandTotal = Number(invoice.amount || 0);
  const paidAmount = Number(invoice.paid_amount || 0);
  const balanceDue = Number(invoice.balance_due || 0);

  const formatInvoiceDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", color: "#0f172a", fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}>
      {/* Top action controller - hidden on print */}
      <div className="print-controller" style={{
        position: "sticky", top: 0, left: 0, right: 0,
        background: "#ffffff", borderBottom: "1px solid #e2e8f0",
        padding: "12px 24px", display: "flex", justifyContent: "space-between",
        alignItems: "center", zIndex: 1000, boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ background: "#2563eb", color: "#fff", width: "36px", height: "36px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
            <i className="fas fa-file-invoice"></i>
          </div>
          <div>
            <h1 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "#0f172a" }}>Invoice #{invoice.invoice_code}</h1>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
              {invoice.company?.name || "Company Invoice"} • {formatInvoiceDate(invoice.date)}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => window.print()} style={{
            background: "#2563eb", color: "#ffffff", border: "none",
            borderRadius: "6px", padding: "8px 16px", fontWeight: "700",
            fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
          }}>
            <i className="fas fa-print"></i> Print Invoice
          </button>
          <button onClick={() => window.close()} style={{
            background: "#ebeef2", color: "#475569", border: "none",
            borderRadius: "6px", padding: "8px 16px", fontWeight: "700",
            fontSize: "13px", cursor: "pointer"
          }}>
            Close
          </button>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="print-page-layout" style={{
        background: "#ffffff", borderRadius: "12px", padding: "30px",
        boxShadow: "0 4px 25px rgba(0,0,0,0.06)", position: "relative",
        maxWidth: "820px", width: "100%", margin: "25px auto", border: "1px solid #e2e8f0"
      }}>
        {/* Top Header Block */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {siteLogo ? (
                <img
                  src={siteLogo}
                  alt={siteName}
                  style={{ height: "42px", maxWidth: "150px", objectFit: "contain" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#facc15", padding: "6px", borderRadius: "8px", fontWeight: "900", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center", width: "42px", height: "42px" }}>
                  {siteName.charAt(0) || "M"}
                </div>
              )}
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.5px" }}>{siteName}</h3>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>{siteDesc}</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <h1 style={{ margin: "0 0 4px 0", fontSize: "28px", fontWeight: "900", color: "#2563eb", letterSpacing: "-1px" }}>INVOICE</h1>
            <p style={{ margin: "0 0 2px 0", fontSize: "13px", color: "#64748b" }}>
              Invoice #: <strong style={{ color: "#0f172a" }}>{invoice.invoice_code}</strong>
            </p>
            <p style={{ margin: "0 0 2px 0", fontSize: "13px", color: "#64748b" }}>
              Date: <strong style={{ color: "#0f172a" }}>{formatInvoiceDate(invoice.date)}</strong>
            </p>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
              Period: <strong>{invoice.start_date || "—"} to {invoice.end_date || "—"}</strong>
            </p>
          </div>
        </div>

        {/* Info Grid (Bill To & Payment Status) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "25px",
          width: "100%",
          boxSizing: "border-box"
        }}>
          {/* Bill To */}
          <div style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "14px 18px",
            boxSizing: "border-box",
            minWidth: 0
          }}>
            <span style={{ fontSize: "10px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>BILL TO</span>
            <h3 style={{ margin: "0 0 3px 0", fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>{invoice.company?.name || invoice.customer || "Corporate Account"}</h3>
            <p style={{ margin: "0 0 3px 0", fontSize: "12px", color: "#64748b" }}>{invoice.company?.address || "Saudi Arabia"}</p>
            {(invoice.company?.phone || invoice.company?.whatsapp) ? (
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                <i className="fas fa-phone-alt" style={{ fontSize: "10px", marginRight: "4px" }}></i>
                {invoice.company?.phone || invoice.company?.whatsapp}
              </p>
            ) : null}
          </div>

          {/* Payment Status */}
          <div style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderLeft: `4px solid ${balanceDue === 0 ? "#10b981" : "#f59e0b"}`,
            borderRadius: "8px",
            padding: "14px 18px",
            boxSizing: "border-box",
            minWidth: 0
          }}>
            <span style={{ fontSize: "10px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>PAYMENT STATUS</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 4px 0" }}>
              <span style={{
                color: balanceDue === 0 ? "#059669" : "#d97706",
                fontWeight: "900",
                fontSize: "15px",
                letterSpacing: "0.5px"
              }}>
                {balanceDue === 0 ? "PAID IN FULL" : "UP TO DATE"}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
              Type: <strong>{invoice.calculation_type === "PW" ? "Passenger Wise" : "Voucher Wise"}</strong>
            </p>
          </div>
        </div>

        {/* Transportation Bookings Table */}
        <div style={{ marginBottom: "25px" }}>
          <h4 style={{ margin: "0 0 10px 0", fontSize: "11px", fontWeight: "800", color: "#2563eb", letterSpacing: "0.5px", textTransform: "uppercase" }}>
            Transportation Bookings
          </h4>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <thead>
              <tr style={{ background: "#0f172a", color: "#ffffff" }}>
                <th style={{ padding: "8px 6px", textAlign: "left", borderRadius: "6px 0 0 0" }}>Voucher Date</th>
                <th style={{ padding: "8px 6px", textAlign: "left" }}>Pickup Date</th>
                <th style={{ padding: "8px 6px", textAlign: "left" }}>Voucher #</th>
                <th style={{ padding: "8px 6px", textAlign: "left" }}>Customer</th>
                <th style={{ padding: "8px 6px", textAlign: "left" }}>Route / Vehicle</th>
                <th style={{ padding: "8px 6px", textAlign: "center" }}>Status</th>
                <th style={{ padding: "8px 6px", textAlign: "right", borderRadius: "0 6px 0 0" }}>Booking Price</th>
              </tr>
            </thead>
            <tbody>
              {bookings?.length > 0 ? (
                bookings.map((b: any, idx: number) => (
                  <tr key={b.id || idx} style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                    <td style={{ padding: "6px", color: "#64748b" }}>{formatInvoiceDate(b.booking_date || b.created_at || b.date)}</td>
                    <td style={{ padding: "6px", fontWeight: "600", color: "#0f172a" }}>{formatInvoiceDate(b.date)}</td>
                    <td style={{ padding: "6px", color: "#2563eb", fontWeight: "600" }}>{b.booking_code || `#${b.id}`}</td>
                    <td style={{ padding: "6px", fontWeight: "600", color: "#334155" }}>{b.full_name || b.customer_name || "—"}</td>
                    <td style={{ padding: "6px", color: "#475569" }}>
                      {b.pickup} ➔ {b.destination}
                      <span style={{ display: "block", fontSize: "10px", color: "#94a3b8" }}>{b.car_type || "Standard Sedan"}</span>
                    </td>
                    <td style={{ padding: "6px", textAlign: "center" }}>
                      <span style={{
                        display: "inline-block", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700",
                        background: b.status === "Completed" ? "#dcfce7" : b.status === "Cancelled" ? "#fee2e2" : "#fef3c7",
                        color: b.status === "Completed" ? "#15803d" : b.status === "Cancelled" ? "#b91c1c" : "#b45309"
                      }}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ padding: "6px", textAlign: "right", fontWeight: "700", color: "#0f172a" }}>{fmt(b.car_price)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: "16px", textAlign: "center", color: "#94a3b8", fontStyle: "italic" }}>
                    No bookings found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Extra Services Table (if applicable) */}
        {services && services.length > 0 && (
          <div style={{ marginBottom: "25px" }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "11px", fontWeight: "800", color: "#2563eb", letterSpacing: "0.5px", textTransform: "uppercase" }}>
              Additional Services
            </h4>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr style={{ background: "#0f172a", color: "#ffffff" }}>
                  <th style={{ padding: "8px 6px", textAlign: "left", borderRadius: "6px 0 0 0" }}>Date</th>
                  <th style={{ padding: "8px 6px", textAlign: "left" }}>Service Name</th>
                  <th style={{ padding: "8px 6px", textAlign: "left" }}>Customer</th>
                  <th style={{ padding: "8px 6px", textAlign: "left" }}>Type</th>
                  <th style={{ padding: "8px 6px", textAlign: "right", borderRadius: "0 6px 0 0" }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s: any, idx: number) => (
                  <tr key={s.id || idx} style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                    <td style={{ padding: "6px", color: "#64748b" }}>{formatInvoiceDate(s.date || s.created_at)}</td>
                    <td style={{ padding: "6px", fontWeight: "600", color: "#0f172a" }}>{s.service_name || s.name}</td>
                    <td style={{ padding: "6px", color: "#334155" }}>{s.customer_name || "—"}</td>
                    <td style={{ padding: "6px", color: "#64748b" }}>{s.type || "Special Service"}</td>
                    <td style={{ padding: "6px", textAlign: "right", fontWeight: "700", color: "#0f172a" }}>{fmt(s.base_price || s.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Invoice Summary & Financial Calculations */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "25px", marginTop: "20px" }}>
          {/* Notes & Summary breakdown */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px", fontSize: "11px" }}>
            <h5 style={{ margin: "0 0 8px 0", fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>Summary Details</h5>
            <ul style={{ margin: 0, paddingLeft: "16px", color: "#64748b", lineHeight: "1.6" }}>
              <li><strong>Prev. Balance:</strong> Sum of historical Booking Price and Service Cost minus payments.</li>
              <li><strong>Current Subtotal:</strong> Sum of all Bookings and Services within this cycle.</li>
              <li><strong>Balance Due:</strong> (Prev. Bal + Curr. Subtotal - Curr. Payments)</li>
              <li>Cancelled items are excluded from all calculations.</li>
            </ul>
          </div>

          {/* Pricing Totals Box */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px" }}>
            {Number(invoice.previous_balance || 0) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px", color: "#64748b" }}>
                <span>Previous Balance Carry-over:</span>
                <strong style={{ color: "#0f172a" }}>{fmt(invoice.previous_balance || 0)}</strong>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px", color: "#64748b" }}>
              <span>Current Cycle Bookings (Gross):</span>
              <strong style={{ color: "#0f172a" }}>{fmt(invoice.bookings_amount || 0)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px", color: "#64748b" }}>
              <span>Current Cycle Services:</span>
              <strong style={{ color: "#0f172a" }}>{fmt(invoice.services_amount || 0)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px", color: "#64748b", borderTop: "1px dashed #e2e8f0", paddingTop: "8px" }}>
              <span>Cycle Subtotal:</span>
              <strong style={{ color: "#0f172a" }}>{fmt(grandTotal)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "12px", color: "#059669" }}>
              <span>Total Paid in this Cycle:</span>
              <strong>– {fmt(paidAmount)}</strong>
            </div>

            <div style={{
              background: "#2563eb", color: "#ffffff", padding: "10px 14px",
              borderRadius: "6px", display: "flex", justifyContent: "space-between",
              alignItems: "center", fontSize: "13px", fontWeight: "800"
            }}>
              <span>TOTAL BALANCE DUE:</span>
              <span style={{ fontSize: "15px" }}>{fmt(balanceDue)}</span>
            </div>
          </div>
        </div>

        {/* Print Footer Disclaimer */}
        <div style={{ textAlign: "center", marginTop: "30px", fontSize: "10px", color: "#94a3b8", borderTop: "1px dashed #e2e8f0", paddingTop: "14px" }}>
          This is a computer-generated invoice. No signature is required. Thank you for choosing {siteName}. We appreciate your business!
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .print-controller {
            display: none !important;
          }
          .print-page-layout {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          thead {
            display: table-header-group;
          }
          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

export default function InvoicePrintPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #2563eb", borderRadius: "50%", width: "48px", height: "48px", animation: "spin 1s linear infinite", margin: "0 auto 16px" }}></div>
          <p style={{ color: "#475569", fontWeight: "600" }}>Initializing invoice print view...</p>
        </div>
      </div>
    }>
      <InvoicePrintContent />
    </Suspense>
  );
}
