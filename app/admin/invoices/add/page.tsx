"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetCompaniesQuery } from "@/store/api/companiesApi";
import { useCalculateInvoiceMutation, useCreateInvoiceMutation } from "@/store/api/invoicesApi";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";
import { getSaudiTodayDate } from "@/utils/formatters";

const fmt = (n: number) =>
  `SAR ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AddInvoicePage() {
  const router = useRouter();
  const { settings } = useWebsiteSettings();
  const siteLogo = settings?.website_logo || "";
  const siteName = settings?.site_title || "Muhabiya Transport";
  const siteDesc = settings?.hero_title || settings?.meta_description || "Premium Transportation Solutions";

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

  // Form states
  const [selectedCompany, setSelectedCompany] = useState("");
  const [startDate,       setStartDate]       = useState("");
  const [endDate,         setEndDate]         = useState(getSaudiTodayDate());
  const [calculationType, setCalculationType] = useState<"VW" | "PW">("VW");
  const [remarks,         setRemarks]         = useState("");

  // Preview overlay states
  const [isPreviewOpen,   setIsPreviewOpen]   = useState(false);
  const [previewData,     setPreviewData]     = useState<any>(null);

  // RTK API hooks
  const { data: companiesData } = useGetCompaniesQuery(undefined);
  const [calculateInvoice, { isLoading: isCalculating }] = useCalculateInvoiceMutation();
  const [createInvoice,    { isLoading: isSaving }]      = useCreateInvoiceMutation();

  const companies = Array.isArray(companiesData)
    ? companiesData
    : (Array.isArray((companiesData as any)?.data) ? (companiesData as any).data : []);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const handlePreview = async () => {
    if (!selectedCompany) {
      showToast("Please assign a company first.", "error");
      return;
    }
    if (!startDate) {
      showToast("Please select a 'Date From' value.", "error");
      return;
    }

    try {
      const res = await calculateInvoice({
        company: selectedCompany,
        start_date: startDate,
        end_date: endDate,
        type: calculationType,
      }).unwrap();

      if (res && !res.isError) {
        setPreviewData(res.data);
        setIsPreviewOpen(true);
      } else {
        showToast("Calculation failed.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error executing preview calculation.", "error");
    }
  };

  const handleGenerateAndSave = async () => {
    if (!selectedCompany) {
      showToast("Please assign a company first.", "error");
      return;
    }
    if (!startDate) {
      showToast("Please select a 'Date From' value.", "error");
      return;
    }

    try {
      // 1. Calculate values
      const calcRes = await calculateInvoice({
        company: selectedCompany,
        start_date: startDate,
        end_date: endDate,
        type: calculationType,
      }).unwrap();

      if (!calcRes || calcRes.isError) {
        showToast("Failed to calculate invoice amounts.", "error");
        return;
      }

      const totalAmt = calcRes.data.total_balance_due;

      // 2. Save invoice to backend
      const saveRes = await createInvoice({
        customer: selectedCompany,
        date: getSaudiTodayDate(),
        period: `${startDate} to ${endDate}`,
        type: calculationType,
        amount: totalAmt,
        balance: totalAmt,
        remarks: remarks || `Invoice for ${selectedCompany} (${startDate} to ${endDate})`,
        entered_by: "Heba Cab",
      }).unwrap();

      if (saveRes && !saveRes.isError) {
        showToast("Invoice generated and saved successfully!", "success");
        setTimeout(() => {
          router.push("/admin/invoices");
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to generate and save invoice.", "error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", position: "relative" }}>
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

      {/* Crimson Red Theme Header Card */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)" }}>
        <div>
          <h2>Create New Invoice</h2>
          <p>Generate a financial statement for a specific company and period.</p>
        </div>
        <button onClick={() => router.push("/admin/invoices")} className="form-btn-back" style={{ background: "rgba(255, 255, 255, 0.15)", color: "#fff", border: "1px solid rgba(255, 255, 255, 0.25)" }}>
          <i className="fas fa-arrow-left"></i>
          <span>Back to Directory</span>
        </button>
      </div>

      {/* Main Invoice Form Card */}
      <div className="form-card" style={{ maxWidth: "800px", margin: "0 auto", width: "100%", padding: "40px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Company dropdown */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "8px" }}>
              Assign to Company <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div className="form-input-wrapper">
              <i className="fas fa-building form-icon" style={{ color: "#3b82f6" }}></i>
              <select
                className="form-input form-select"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                required
              >
                <option value="">Select a Company</option>
                {companies.map((c: any) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <i className="fas fa-chevron-down select-arrow"></i>
            </div>
          </div>

          {/* Date row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "8px" }}>
                Date From <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "8px" }}>
                Date To <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Calculation Type */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "8px" }}>
              Calculation Type <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: "24px", alignItems: "center", marginBottom: "8px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="calculationType"
                  value="VW"
                  checked={calculationType === "VW"}
                  onChange={() => setCalculationType("VW")}
                  style={{ width: "16px", height: "16px" }}
                />
                Voucher Wise (VW)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="calculationType"
                  value="PW"
                  checked={calculationType === "PW"}
                  onChange={() => setCalculationType("PW")}
                  style={{ width: "16px", height: "16px" }}
                />
                Pickup Wise (PW)
              </label>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>
              VW uses Voucher Dates for bookings and Entry Dates for services. PW uses Pickup Dates for bookings and Service Dates for services.
            </p>
          </div>

          {/* Remarks */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "8px" }}>
              Invoice Remarks
            </label>
            <textarea
              className="form-input"
              rows={4}
              placeholder="e.g. Monthly Statement for January 2024 - Service & Transport Fees."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              style={{ padding: "12px", height: "auto" }}
            />
          </div>

          {/* Action Row */}
          <div style={{ display: "flex", gap: "16px", justifyContent: "space-between", marginTop: "10px" }}>
            <button
              type="button"
              onClick={handlePreview}
              disabled={isCalculating}
              style={{
                flex: 1,
                background: "#ffffff",
                color: "#1e293b",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                height: "44px",
                fontWeight: "700",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.15s ease"
              }}
            >
              <i className="far fa-eye" style={{ color: "#3b82f6" }}></i>
              {isCalculating ? "Calculating..." : "Preview Statement"}
            </button>

            <button
              type="button"
              onClick={handleGenerateAndSave}
              disabled={isSaving}
              style={{
                flex: 1,
                background: "#1e293b",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                height: "44px",
                fontWeight: "700",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.15s ease",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
              }}
            >
              <i className="fas fa-file-invoice" style={{ color: "#22c55e" }}></i>
              {isSaving ? "Saving..." : "Generate & Save"}
            </button>
          </div>

        </div>
      </div>

      {/* Info Warning Bar */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "center", margin: "10px auto", maxWidth: "800px", color: "#64748b", fontSize: "12px", textAlign: "center", padding: "0 20px" }}>
        <i className="fas fa-info-circle"></i>
        <span>The invoice amount will be calculated automatically based on the cumulative ledger up to the selected &quot;Date To&quot;, including any carry-over balance from previous periods.</span>
      </div>

      {/* Premium Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", color: "#94a3b8", fontSize: "12px", borderTop: "1px solid #e2e8f0", marginTop: "20px" }}>
        <span>&copy; 2026 Heba Cab. All Rights Reserved.</span>
        <span>v2.0</span>
      </div>

      {/* Fullscreen Preview Mode (invoices_preview.php) */}
      {isPreviewOpen && previewData && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "#f1f5f9", zIndex: 10000, overflowY: "auto",
          padding: "0 0 40px 0"
        }}>
          {/* Draft Preview Header Bar */}
          <div style={{
            background: "#f97316", color: "#ffffff", padding: "10px 20px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            fontWeight: "700", fontSize: "14px", position: "sticky", top: 0, zIndex: 10001,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <i className="fas fa-exclamation-triangle"></i>
            <span>DRAFT PREVIEW MODE - This invoice is NOT yet saved to the database.</span>
          </div>

          <div style={{ maxWidth: "900px", margin: "30px auto", padding: "0 20px" }}>
            {/* Invoice Sheet Sheet */}
            <div style={{
              background: "#ffffff", borderRadius: "12px", padding: "50px",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)", position: "relative",
              overflow: "hidden"
            }}>
              {/* Draft Watermark */}
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%) rotate(-45deg)",
                fontSize: "130px", fontWeight: "900", color: "rgba(226, 232, 240, 0.55)",
                userSelect: "none", pointerEvents: "none", letterSpacing: "10px"
              }}>
                DRAFT
              </div>

              {/* Top Row: Brand & Ref */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                    {siteLogo ? (
                      <img
                        src={logoBase64 || siteLogo}
                        alt={siteName}
                        style={{ height: "44px", maxWidth: "150px", objectFit: "contain", borderRadius: "6px" }}
                      />
                    ) : (
                      <div style={{ background: "#facc15", color: "#000", padding: "10px", borderRadius: "8px", fontWeight: "800", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px" }}>
                        {siteName.charAt(0) || "M"}
                      </div>
                    )}
                    <div>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>{siteName}</h3>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>{siteDesc}</span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <h1 style={{ margin: "0 0 10px 0", fontSize: "36px", fontWeight: "900", color: "#2563eb", letterSpacing: "-1px" }}>DRAFT</h1>
                  <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#64748b" }}>
                    Ref: <strong>DRAFT-PREVIEW</strong>
                  </p>
                  <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#64748b" }}>
                    Date: <strong>{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</strong>
                  </p>
                  <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#64748b" }}>
                    Period: <strong>{startDate} - {endDate}</strong>
                  </p>
                </div>
              </div>

              <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", marginBottom: "30px" }} />

              {/* Bill To & Status */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px" }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#94a3b8", display: "block", marginBottom: "8px" }}>Bill To</span>
                  <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>{previewData.company}</h4>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Multan Office</p>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#94a3b8", display: "block", marginBottom: "8px" }}>Mode</span>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#d97706" }}>
                    {calculationType === "VW" ? "Voucher Wise" : "Pickup Wise"}
                  </span>
                </div>
              </div>

              {/*Transportation Bookings Table */}
              <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#2563eb", display: "block", marginBottom: "12px", borderBottom: "2px solid #3b82f6", paddingBottom: "6px" }}>
                Transportation Bookings
              </span>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "40px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "10px", textAlign: "left", color: "#475569" }}>Date</th>
                    <th style={{ padding: "10px", textAlign: "left", color: "#475569" }}>Voucher #</th>
                    <th style={{ padding: "10px", textAlign: "left", color: "#475569" }}>Customer</th>
                    <th style={{ padding: "10px", textAlign: "left", color: "#475569" }}>Route / Vehicle</th>
                    <th style={{ padding: "10px", textAlign: "right", color: "#475569" }}>Booking Price</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.bookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                        No bookings found for this period.
                      </td>
                    </tr>
                  ) : (
                    previewData.bookings.map((b: any) => (
                      <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px", color: "#475569" }}>{b.date}</td>
                        <td style={{ padding: "10px", fontWeight: "600", color: "#2563eb" }}>{b.booking_code}</td>
                        <td style={{ padding: "10px", color: "#475569" }}>{previewData.company}</td>
                        <td style={{ padding: "10px", color: "#475569" }}>{b.pickup} to {b.destination}</td>
                        <td style={{ padding: "10px", textAlign: "right", fontWeight: "700", color: "#1e293b" }}>{fmt(b.car_price)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Bottom calculations rows */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginTop: "20px" }}>
                <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "8px", fontSize: "11px", color: "#64748b", lineHeight: "1.6" }}>
                  <p style={{ margin: "0 0 8px 0" }}>
                    &bull; <strong>Prev. Carry-over</strong>: Sum of historical Booking Price and Service Cost minus payments prior to {startDate}.
                  </p>
                  <p style={{ margin: "0 0 8px 0" }}>
                    &bull; <strong>Cycle Items</strong>: Sum of all Bookings and Services within this statement cycle.
                  </p>
                  <p style={{ margin: "0" }}>
                    &bull; <strong>Cycle Payments</strong>: Sum of all payments received within this cycle period.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569" }}>
                    <span>Prev. Carry-over:</span>
                    <span style={{ fontWeight: "600" }}>{fmt(previewData.prev_balance)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569" }}>
                    <span>Cycle Items:</span>
                    <span style={{ fontWeight: "600" }}>{fmt(previewData.cycle_subtotal)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#10b981" }}>
                    <span>Cycle Payments:</span>
                    <span style={{ fontWeight: "600" }}>- {fmt(previewData.payments_sum)}</span>
                  </div>
                  <div style={{
                    background: "#f59e0b", color: "#ffffff", padding: "14px 20px",
                    borderRadius: "8px", display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginTop: "10px", fontWeight: "800", fontSize: "15px",
                    boxShadow: "0 4px 6px -1px rgba(245, 158, 11, 0.2)"
                  }}>
                    <span>ESTIMATED TOTAL:</span>
                    <span>{fmt(previewData.total_balance_due)}</span>
                  </div>
                </div>
              </div>

              {/* Close window message */}
              <div style={{ textAlign: "center", marginTop: "40px", fontSize: "12px", color: "#94a3b8" }}>
                Close this window to return to the invoice form and finalize.
              </div>
            </div>

            {/* Back button */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: "30px" }}>
              <button
                onClick={() => setIsPreviewOpen(false)}
                style={{
                  background: "#1e293b", color: "#ffffff", border: "none",
                  borderRadius: "20px", padding: "10px 24px", fontSize: "13px",
                  fontWeight: "700", cursor: "pointer", display: "flex",
                  alignItems: "center", gap: "8px"
                }}
              >
                <i className="fas fa-times"></i>
                <span>Close Preview</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
