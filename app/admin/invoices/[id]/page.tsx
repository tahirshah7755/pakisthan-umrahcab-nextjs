"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useGetInvoiceQuery } from "@/store/api/invoicesApi";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const fmt = (n: number) =>
  `SAR ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ViewInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { data: res, isLoading, isError } = useGetInvoiceQuery(id);
  const { settings } = useWebsiteSettings();
  const brandName = settings?.site_title?.split("-")[0]?.trim() || settings?.site_title || "Heba Cab";
  const siteLogo = settings?.website_logo || "";
  const siteName = settings?.site_title || "Heba Cab";
  const siteDesc = settings?.hero_title || settings?.meta_description || "Premium Transportation Solutions";

  // Preload logo into Base64 to ensure 100% reliable rendering in popup windows and PDF canvas
  const [logoBase64, setLogoBase64] = useState<string>("");

  useEffect(() => {
    if (!siteLogo) {
      setLogoBase64("");
      return;
    }
    if (siteLogo.startsWith("data:")) {
      setLogoBase64(siteLogo);
      return;
    }

    let isMounted = true;
    let fullUrl = siteLogo;

    if (typeof window !== "undefined") {
      if (siteLogo.startsWith("http://") || siteLogo.startsWith("https://") || siteLogo.startsWith("data:")) {
        fullUrl = siteLogo;
      } else if (siteLogo.startsWith("/")) {
        fullUrl = window.location.origin + siteLogo;
      } else {
        const apiEnv = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/umrahcab";
        const backendOrigin = apiEnv.replace(/\/api\/.*$/, "").replace(/\/+$/, "");
        fullUrl = `${backendOrigin}/${siteLogo}`;
      }
    }

    // Use our server-side image proxy to eliminate CORS restrictions for PDF canvas
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(fullUrl)}`;

    fetch(proxyUrl)
      .then((r) => {
        if (!r.ok) throw new Error("proxy fetch failed");
        return r.blob();
      })
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (isMounted && typeof reader.result === "string" && reader.result.startsWith("data:image")) {
            setLogoBase64(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      })
      .catch(() => {
        if (isMounted) setLogoBase64(fullUrl);
      });

    return () => {
      isMounted = false;
    };
  }, [siteLogo]);

  // View state modes (can toggle if condensed or VAT view is clicked)
  const [viewMode, setViewMode] = useState<"standard" | "condensed" | "vat">("standard");
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handlePrint = () => {
    const printArea = document.getElementById("invoice-pdf-download-area");
    if (!printArea) {
      window.print();
      return;
    }

    const contentHtml = printArea.innerHTML;
    let iframe = document.getElementById("invoice-print-frame") as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "invoice-print-frame";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0px";
      iframe.style.height = "0px";
      iframe.style.border = "none";
      iframe.style.zIndex = "-9999";
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      window.print();
      return;
    }

    const invCode = res?.data?.invoice?.invoice_code || "INVOICE";

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${invCode} - ${siteName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
            * { box-sizing: border-box; }
            body {
              font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
              background-color: #ffffff !important;
              color: #0f172a !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @page {
              size: A4 portrait;
              margin: 8mm 6mm;
            }
            .print-only {
              display: block !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              max-width: 100% !important;
              width: 100% !important;
            }
            img {
              max-width: 100%;
              display: block;
            }
          </style>
        </head>
        <body>
          <div class="print-only">
            ${contentHtml}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 200);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("invoice-pdf-download-area");
    if (!element || !res?.data?.invoice) return;
    
    try {
      setIsExportingPDF(true);

      // Preload all images inside element before capturing canvas
      const imgElements = Array.from(element.querySelectorAll("img"));
      await Promise.all(
        imgElements.map((img) => {
          if (img.complete && img.naturalHeight !== 0) return Promise.resolve(true);
          return new Promise((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
          });
        })
      );

      await new Promise(r => setTimeout(r, 200));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileCode = res.data.invoice.invoice_code || "INVOICE";
      pdf.save(`${fileCode}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF download:", err);
    } finally {
      setIsExportingPDF(false);
    }
  };

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

  const companyName = invoice.company?.name || invoice.customer_relation?.company || invoice.customer || "Individual / Direct";
  const companyAddress = invoice.company?.address || "";
  const companyPhone = invoice.company?.phone || invoice.company?.whatsapp || invoice.customer_relation?.phone || invoice.customer_relation?.contact || "";

  // Date formatting helpers
  const formatInvoiceDate = (dStr: string) => {
    if (!dStr) return "—";
    return new Date(dStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "50px" }}>
      
      {/* Top Actions Bar */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
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
            onClick={handleDownloadPDF}
            disabled={isExportingPDF}
            style={{
              background: "#374151", color: "#ffffff", border: "none",
              borderRadius: "6px", padding: "8px 16px", fontSize: "13px",
              fontWeight: "700", cursor: isExportingPDF ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: "6px",
              opacity: isExportingPDF ? 0.7 : 1
            }}
          >
            <i className={isExportingPDF ? "fas fa-spinner fa-spin" : "fas fa-file-pdf"}></i>
            {isExportingPDF ? "Generating PDF..." : "Download PDF"}
          </button>

          <button
            onClick={handlePrint}
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
      {/* 1. Main Screen View Container (Visible on screen, unmodified full-width layout) */}
      <div id="invoice-print-area" style={{
        background: "#ffffff", borderRadius: "12px", padding: "50px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.03)", position: "relative"
      }}>
        {/* Top Header Block */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "8px" }}>
              {siteLogo ? (
                <img
                  src={logoBase64 || siteLogo}
                  alt={siteName}
                  style={{ height: "48px", maxWidth: "160px", objectFit: "contain", borderRadius: "6px" }}
                />
              ) : (
                <div style={{ background: "#facc15", color: "#000", padding: "10px", borderRadius: "8px", fontWeight: "900", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center", width: "42px", height: "42px" }}>
                  {siteName.charAt(0) || "M"}
                </div>
              )}
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>{siteName}</h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>{siteDesc}</span>
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
            {companyAddress ? <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#64748b" }}>{companyAddress}</p> : null}
            {companyPhone ? <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>📞 {companyPhone}</p> : null}
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
            {breakdown.prev_balance > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569" }}>
                <span>Previous Balance Carry-over:</span>
                <span style={{ fontWeight: "600" }}>{fmt(breakdown.prev_balance)}</span>
              </div>
            )}
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
          This is a computer-generated invoice. No signature is required. Thank you for choosing {siteName}. We appreciate your business!
        </div>
      </div>

      {/* 2. Hidden Print/PDF Optimized Layout (Active during PDF Export & Direct Print) */}
      <div id="invoice-pdf-download-area" className="print-only" style={{
        background: "#ffffff", borderRadius: "12px", padding: "30px",
        boxShadow: "0 4px 25px rgba(0,0,0,0.06)", position: "relative",
        maxWidth: "820px", width: "100%", margin: "0 auto", border: "1px solid #e2e8f0"
      }}>
        {/* Top Header Block */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {siteLogo ? (
                <img
                  src={logoBase64 || siteLogo}
                  alt={siteName}
                  crossOrigin="anonymous"
                  style={{ height: "42px", maxWidth: "150px", objectFit: "contain" }}
                />
              ) : (
                <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#facc15", padding: "6px", borderRadius: "8px", fontWeight: "900", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center", width: "42px", height: "42px", boxShadow: "0 4px 10px rgba(15,23,42,0.15)" }}>
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
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
              Period: <strong style={{ color: "#0f172a" }}>{invoice.period || "—"}</strong>
            </p>
          </div>
        </div>

        <hr style={{ border: 0, borderTop: "2px solid #f1f5f9", marginBottom: "20px" }} />

        {/* Bill To & Payment Status side-by-side cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px" }}>
          {/* Bill To Card */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "15px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", display: "block", marginBottom: "6px", letterSpacing: "0.5px" }}>Bill To</span>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>{companyName}</h4>
            {companyAddress ? <p style={{ margin: "0 0 2px 0", fontSize: "13px", color: "#475569" }}>{companyAddress}</p> : null}
            {companyPhone ? <p style={{ margin: 0, fontSize: "13px", color: "#475569", fontWeight: "600" }}>📞 {companyPhone}</p> : null}
          </div>

          {/* Payment Status Card */}
          <div style={{ 
            background: invoice.status === "Paid" ? "rgba(16, 185, 129, 0.04)" : "rgba(239, 68, 68, 0.04)", 
            border: invoice.status === "Paid" ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)", 
            borderLeft: invoice.status === "Paid" ? "5px solid #10b981" : "5px solid #ef4444", 
            borderRadius: "10px", padding: "15px"
          }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", display: "block", marginBottom: "6px", letterSpacing: "0.5px" }}>Payment Status</span>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "900", color: invoice.status === "Paid" ? "#10b981" : "#ef4444" }}>
              {invoice.status === "Paid" ? "UP TO DATE" : "OUTSTANDING DUE"}
            </h2>
            <p style={{ margin: 0, fontSize: "13px", color: "#475569" }}>
              Type: <strong style={{ color: "#0f172a" }}>{invoice.type === "VW" ? "Voucher Wise" : "Pickup Wise"}</strong>
            </p>
          </div>
        </div>

        {/* Transportation Bookings Table */}
        <span style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", color: "#2563eb", display: "block", marginBottom: "10px", borderBottom: "2px solid #3b82f6", paddingBottom: "6px", letterSpacing: "0.5px" }}>
          Transportation Bookings
        </span>
        <div style={{ overflowX: "auto", marginBottom: "20px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#0f172a", borderBottom: "2px solid #cbd5e1" }}>
                <th style={{ padding: "8px 10px", textAlign: "left", color: "#ffffff", fontWeight: "700" }}>Voucher Date</th>
                <th style={{ padding: "8px 10px", textAlign: "left", color: "#ffffff", fontWeight: "700" }}>Pickup Date</th>
                <th style={{ padding: "8px 10px", textAlign: "left", color: "#ffffff", fontWeight: "700" }}>Voucher #</th>
                <th style={{ padding: "8px 10px", textAlign: "left", color: "#ffffff", fontWeight: "700" }}>Customer</th>
                <th style={{ padding: "8px 10px", textAlign: "left", color: "#ffffff", fontWeight: "700" }}>Route / Vehicle</th>
                <th style={{ padding: "8px 10px", textAlign: "left", color: "#ffffff", fontWeight: "700" }}>Status</th>
                <th style={{ padding: "8px 10px", textAlign: "right", color: "#ffffff", fontWeight: "700" }}>Booking Price</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "16px 10px", textAlign: "center", color: "#94a3b8" }}>
                    No bookings found for this period.
                  </td>
                </tr>
              ) : (
                bookings.map((b: any, idx: number) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid #e2e8f0", background: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                    <td style={{ padding: "8px 10px", color: "#475569" }}>{b.date}</td>
                    <td style={{ padding: "8px 10px", color: "#475569" }}>{b.date}</td>
                    <td style={{ padding: "8px 10px", fontWeight: "700", color: "#2563eb" }}>{b.booking_code}</td>
                    <td style={{ padding: "8px 10px", color: "#475569" }}>{companyName}</td>
                    <td style={{ padding: "8px 10px", color: "#475569" }}>{b.pickup} to {b.destination}</td>
                    <td style={{ padding: "8px 10px", color: "#475569" }}>{b.status || "Completed"}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "800", color: "#0f172a" }}>{fmt(b.car_price)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Calculations Section */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "10px" }}>
          
          {/* Definitions Column */}
          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", fontSize: "11px", color: "#475569", borderLeft: "4px solid #2563eb", lineHeight: "1.5", border: "1px solid #e2e8f0", borderLeftWidth: "4px" }}>
            <p style={{ margin: "0 0 6px 0" }}>
              &bull; <strong>Prev. Balance</strong>: Sum of historical Booking Price and Service Cost minus payments.
            </p>
            <p style={{ margin: "0 0 6px 0" }}>
              &bull; <strong>Current Subtotal</strong>: Sum of all Bookings and Services within this cycle.
            </p>
            <p style={{ margin: "0 0 6px 0" }}>
              &bull; <strong>Balance Due</strong>: (Prev. Bal + Curr. Subtotal - Curr. Payments)
            </p>
            <p style={{ margin: "0" }}>
              &bull; Cancelled items are excluded from all calculations.
            </p>
          </div>

          {/* Breakdowns Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {breakdown.prev_balance > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569", borderBottom: "1px dashed #e2e8f0", paddingBottom: "4px" }}>
                <span>Previous Balance Carry-over:</span>
                <span style={{ fontWeight: "700", color: "#0f172a" }}>{fmt(breakdown.prev_balance)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569", borderBottom: "1px dashed #e2e8f0", paddingBottom: "4px" }}>
              <span>Current Cycle Bookings (Gross):</span>
              <span style={{ fontWeight: "700", color: "#0f172a" }}>{fmt(breakdown.bookings_sum)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569", borderBottom: "1px dashed #e2e8f0", paddingBottom: "4px" }}>
              <span>Current Cycle Services:</span>
              <span style={{ fontWeight: "700", color: "#0f172a" }}>{fmt(breakdown.services_sum)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569", borderBottom: "1px dashed #e2e8f0", paddingBottom: "4px" }}>
              <span>Cycle Subtotal:</span>
              <span style={{ fontWeight: "700", color: "#0f172a" }}>{fmt(breakdown.cycle_subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#10b981", borderBottom: "1px dashed #e2e8f0", paddingBottom: "4px" }}>
              <span>Total Paid in this Cycle:</span>
              <span style={{ fontWeight: "700" }}>- {fmt(breakdown.payments_sum)}</span>
            </div>

            <div style={{
              background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)", color: "#ffffff", padding: "12px 16px",
              borderRadius: "10px", display: "flex", justifyContent: "space-between",
              alignItems: "center", marginTop: "6px", fontWeight: "900", fontSize: "15px",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)"
            }}>
              <span>TOTAL BALANCE DUE:</span>
              <span style={{ color: "#facc15" }}>{fmt(breakdown.total_balance_due)}</span>
            </div>
          </div>
        </div>

        {/* Print Footer Disclaimer */}
        <div style={{ textAlign: "center", marginTop: "30px", fontSize: "11px", color: "#94a3b8", borderTop: "1px dashed #e2e8f0", paddingTop: "15px" }}>
          This is a computer-generated invoice. No signature is required. Thank you for choosing {siteName}. We appreciate your business!
        </div>
      </div>

      {/* Audit Trail & Activity History Block */}
      <div className="no-print" style={{ background: "#ffffff", borderRadius: "12px", padding: "30px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
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
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", color: "#94a3b8", fontSize: "12px" }}>
        <span>&copy; {new Date().getFullYear()} {brandName}. All Rights Reserved.</span>
        <span>v2.0</span>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print,
          header,
          aside,
          nav {
            display: none !important;
          }
          #invoice-pdf-download-area {
            display: block !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 6mm;
          }
        }
      `}</style>
    </div>
  );
}
