"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/utils/api";
import { getCompanyLogoSrc } from "@/utils/formatters";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/umrahcab";
const IMAGE_BASE = API_URL.split("/api/")[0] || "http://localhost:8000";

interface CompanyItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  vouchers: boolean;
  reminders: boolean;
  invoice: boolean;
  tomorrow_reminder?: boolean;
  exempt_bulk_lock?: boolean;
  ledger_frequency?: string;
  agent_username?: string;
  logo_path?: string;
}

function CompanyProfileContent() {
  const router = useRouter();
  const { user } = useAuth();
  const actorName = user?.name || user?.username || "hebacab";
  const searchParams = useSearchParams();
  const targetId = searchParams.get("id") || "";

  const [company, setCompany] = useState<CompanyItem | null>(null);
  const [companyCustomers, setCompanyCustomers] = useState<any[]>([]);
  const [companyBookings, setCompanyBookings] = useState<any[]>([]);
  const [companyLedgers, setCompanyLedgers] = useState<any[]>([]);
  const [companyPayments, setCompanyPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoFailed, setLogoFailed] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const fetchCompanyProfile = async () => {
    try {
      setLoading(true);
      if (!targetId) return;

      const result = await api.getCompany(targetId);
      if (result && result.company) {
        const found = result.company;
        setCompany({
          id: found.custom_id || `#COM-${found.id}`,
          name: found.name,
          email: found.email || "N/A",
          phone: found.phone || "N/A",
          address: found.address || "N/A",
          vouchers: !!found.vouchers,
          reminders: !!found.reminders,
          invoice: !!found.invoice,
          tomorrow_reminder: !!found.tomorrow_reminder,
          exempt_bulk_lock: !!found.exempt_bulk_lock,
          ledger_frequency: found.ledger_frequency || "Monday",
          agent_username: found.agent_username || "",
          logo_path: found.logo_path || ""
        });

        setCompanyCustomers(result.customers || []);
        setCompanyBookings(result.bookings || []);
        setCompanyLedgers(result.ledgers || []);
        setCompanyPayments(result.payments || []);
      } else {
        // Fallback template
        setCompany({
          id: `#COM-${targetId || "1"}`,
          name: "Zahid Travels",
          email: "zahid@travels.com",
          phone: "+966501234567",
          address: "Jeddah, Saudi Arabia",
          vouchers: true,
          reminders: true,
          invoice: true,
          tomorrow_reminder: true,
          exempt_bulk_lock: false,
          ledger_frequency: "Monday",
          agent_username: "zahid_travels"
        });
      }
    } catch (err) {
      console.error(err);
      showToast("Error loading company profile details", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyProfile();
  }, [targetId]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "250px" }}>
        <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #ea580c", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h3>No company found matching ID {targetId}.</h3>
        <button onClick={() => router.push("/admin/companies")} className="btn-submit" style={{ marginTop: "15px", background: "var(--primary-color)" }}>Back to Directory</button>
      </div>
    );
  }

  const rawId = company.id.replace("#COM-", "").replace("#CMP-", "");
  const displayId = `#CMP-${rawId}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
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

      {/* Amber Header Card */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #c2410c 0%, #ea580c 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "5px" }}>
            <span style={{ background: "rgba(255,255,255,0.2)", color: "#ffffff", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Agent Profile</span>
            <span style={{ color: "#ffedd5", fontSize: "12px", fontWeight: "700" }}>ID: {displayId}</span>
          </div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>{company.name}</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Company Profile Overview</p>
        </div>
        
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={() => router.push("/admin/companies/add")} 
            style={{ background: "#4f46e5", color: "#ffffff", border: "none", borderRadius: "6px", padding: "10px 18px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <i className="fas fa-plus"></i>
            <span>Register New</span>
          </button>
          <button 
            onClick={() => router.push(`/admin/companies/edit?id=${rawId}`)} 
            style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "10px 18px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <i className="fas fa-edit"></i>
            <span>Edit Profile</span>
          </button>
          <button 
            onClick={() => router.push("/admin/companies")} 
            style={{ background: "#334155", color: "#ffffff", border: "none", borderRadius: "6px", padding: "10px 18px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <i className="fas fa-arrow-left"></i>
            <span>Back to List</span>
          </button>
        </div>
      </div>

      {/* Two-Column Details Grid */}
      <div style={{ display: "flex", gap: "25px", flexWrap: "wrap" }}>
        {/* Left Card: Profile Summary */}
        <div style={{ width: "320px", background: "#ffffff", padding: "30px 20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ width: "100px", height: "100px", background: "#f1f5f9", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", overflow: "hidden" }}>
            {(() => {
              const logoSrc = getCompanyLogoSrc(company.logo_path);
              const showImg = logoSrc && !logoFailed;
              if (showImg) {
                return (
                  <img
                    src={logoSrc}
                    alt="Logo"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    onError={() => setLogoFailed(true)}
                  />
                );
              }
              return <i className="fas fa-building" style={{ fontSize: "40px", color: "#64748b" }}></i>;
            })()}
          </div>
          
          <h3 style={{ margin: "0 0 5px 0", fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>{company.name}</h3>
          <p style={{ margin: "0 0 15px 0", fontSize: "13px", color: "#94a3b8" }}>Entity Since May 2026</p>
          
          <span style={{ background: "#eff6ff", color: "#2563eb", padding: "4px 14px", borderRadius: "9999px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "30px" }}>
            BASIC TIER
          </span>

          <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", gap: "20px", borderTop: "1px solid #f1f5f9", paddingTop: "25px" }}>
            <div>
              <span style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", marginBottom: "5px" }}>Agent Username</span>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#475569" }}>
                <i className="fas fa-user" style={{ color: "#2563eb", width: "16px" }}></i>
                <span style={{ fontSize: "14px" }}>{company.agent_username || "—"}</span>
              </div>
            </div>

            <div>
              <span style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", marginBottom: "5px" }}>Official Email</span>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#475569" }}>
                <i className="fas fa-envelope" style={{ color: "#2563eb", width: "16px" }}></i>
                <span style={{ fontSize: "14px" }}>{company.email !== "N/A" ? company.email : "—"}</span>
              </div>
            </div>

            <div>
              <span style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", marginBottom: "5px" }}>Contact Number</span>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#475569" }}>
                <i className="fas fa-phone" style={{ color: "#2563eb", width: "16px" }}></i>
                <span style={{ fontSize: "14px" }}>{company.phone !== "N/A" ? company.phone : "—"}</span>
              </div>
            </div>

            <div>
              <span style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", marginBottom: "5px" }}>Physical Address</span>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", color: "#475569" }}>
                <i className="fas fa-location-dot" style={{ color: "#2563eb", width: "16px", marginTop: "3px" }}></i>
                <span style={{ fontSize: "14px" }}>{company.address !== "N/A" ? company.address : "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Balance, Metrics & Automations */}
        <div style={{ flex: 1, minWidth: "500px", display: "flex", flexDirection: "column", gap: "25px" }}>
          {/* Wallet Balance Card */}
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "20px 25px", borderRadius: "12px", display: "flex", gap: "20px", alignItems: "center" }}>
            <div style={{ width: "40px", height: "40px", background: "#dcfce7", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#166534" }}>
              <i className="fas fa-wallet" style={{ fontSize: "18px" }}></i>
            </div>
            <div>
              <span style={{ display: "block", fontSize: "12px", color: "#166534", fontWeight: "600" }}>Wallet Balance (PW)</span>
              <h4 style={{ margin: "2px 0 0 0", fontSize: "22px", fontWeight: "800", color: "#14532d" }}>
                SAR {companyLedgers[0]?.balance ? Number(companyLedgers[0].balance).toFixed(2) : "0.00"}
              </h4>
              <span style={{ display: "block", fontSize: "11px", color: "#15803d", marginTop: "3px" }}>
                VW Balance: <strong>SAR {companyLedgers[0]?.balance ? Number(companyLedgers[0].balance).toFixed(2) : "0.00"}</strong> (Wallet) | PW: Pick-up Wise | VW: Voucher Wise
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", borderLeft: "4px solid #3b82f6" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>Booking Volume</span>
              <h5 style={{ margin: "5px 0", fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>{companyBookings.length}</h5>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>Total Lifetime Bookings</span>
            </div>
            
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", borderLeft: "4px solid #f59e0b" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>Database Size</span>
              <h5 style={{ margin: "5px 0", fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>{companyCustomers.length}</h5>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>Total Unique Customers</span>
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", borderLeft: "4px solid #64748b" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>Business Volume</span>
              <h5 style={{ margin: "5px 0", fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>
                SAR {companyLedgers.reduce((acc, curr) => acc + Number(curr.debit || 0), 0).toFixed(2)}
              </h5>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>Lifetime Gross Revenue</span>
            </div>
          </div>

          {/* Automations & Settings Block */}
          <div style={{ background: "#ffffff", padding: "25px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <h4 style={{ margin: "0 0 20px 0", fontSize: "15px", fontWeight: "700", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="fas fa-cog" style={{ color: "#2563eb" }}></i>
              <span>Automations & Settings</span>
            </h4>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                <div>
                  <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>GUEST VOUCHERS</span>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>Auto-voucher delivery</span>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={company.vouchers} readOnly />
                  <span className="slider"></span>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                <div>
                  <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>GUEST REMINDERS</span>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>SMS/WhatsApp reminders</span>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={company.reminders} readOnly />
                  <span className="slider"></span>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                <div>
                  <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>INVOICING</span>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>Auto-PDF invoices</span>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={company.invoice} readOnly />
                  <span className="slider"></span>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                <div>
                  <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>NEXT-DAY REM.</span>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>Pre-arrival check-ins</span>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={company.tomorrow_reminder} readOnly />
                  <span className="slider"></span>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                <div>
                  <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>BULK-LOCK EXEMPTION</span>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>Exempt from locks</span>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={company.exempt_bulk_lock} readOnly />
                  <span className="slider"></span>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                <div>
                  <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>LEDGER FREQUENCY</span>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>Frequency interval</span>
                </div>
                <span style={{ fontWeight: "700", color: "#334155", fontSize: "14px" }}>
                  Every {company.ledger_frequency || "Monday"}
                </span>
              </div>
            </div>
          </div>

          {/* System Audit Block */}
          <div style={{ background: "#ffffff", padding: "25px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <h4 style={{ margin: "0 0 20px 0", fontSize: "15px", fontWeight: "700", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="fas fa-shield-alt" style={{ color: "#2563eb" }}></i>
              <span>System Audit</span>
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                <span style={{ color: "#64748b" }}>REGISTERED BY</span>
                <span style={{ fontWeight: "600", color: "#1e293b" }}>{actorName} <span style={{ color: "#94a3b8", fontWeight: "normal" }}>| 23 May, 2026 | 02:40 PM</span></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                <span style={{ color: "#64748b" }}>LAST PROFILE UPDATE</span>
                <span style={{ fontWeight: "600", color: "#1e293b" }}>{actorName} <span style={{ color: "#94a3b8", fontWeight: "normal" }}>| 23 May, 2026 | 04:06 PM</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Table Rows */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
        {/* Associated Customers */}
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", margin: "0 0 15px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="fas fa-users" style={{ color: "#2563eb" }}></i>
            <span>Associated Corporate Customers</span>
          </h4>
          <div className="table-responsive">
            <table className="db-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {companyCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", color: "#94a3b8", padding: "20px 0" }}>No customers linked yet.</td>
                  </tr>
                ) : (
                  companyCustomers.map(cust => (
                    <tr key={cust.id}>
                      <td style={{ fontWeight: 700 }}>{cust.custom_id || `#CST-${cust.id}`}</td>
                      <td>
                        <button
                          onClick={() => router.push(`/admin/customers/view?id=${cust.id}`)}
                          style={{ background: "none", border: "none", color: "#2563eb", textDecoration: "underline", cursor: "pointer", padding: 0 }}
                        >
                          {cust.name}
                        </button>
                      </td>
                      <td>{cust.contact}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments */}
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", margin: "0 0 15px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="fas fa-credit-card" style={{ color: "#2563eb" }}></i>
            <span>Recent Corporate Payments</span>
          </h4>
          <div className="table-responsive">
            <table className="db-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {companyPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "#94a3b8", padding: "20px 0" }}>No payments recorded.</td>
                  </tr>
                ) : (
                  companyPayments.map(pm => (
                    <tr key={pm.id}>
                      <td style={{ fontWeight: 700 }}>{pm.custom_id || `#PAY-${pm.id}`}</td>
                      <td>{pm.date}</td>
                      <td>
                        <div style={{ fontWeight: "600" }}>{pm.method}</div>
                        {pm.transaction_ref && (
                          <div style={{ fontSize: "11px", color: "#475569", marginTop: "2px" }}>
                            <strong>Ref:</strong> <code style={{ background: "#f1f5f9", padding: "1px 4px", borderRadius: "3px" }}>{pm.transaction_ref}</code>
                          </div>
                        )}
                        {pm.proof_details && (
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                            <strong>Notes:</strong> {pm.proof_details}
                          </div>
                        )}
                        {pm.proof_file && (
                          <div style={{ marginTop: "4px" }}>
                            <a 
                              href={`http://localhost:8000${pm.proof_file}`} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ 
                                display: "inline-flex", 
                                alignItems: "center", 
                                gap: "4px", 
                                fontSize: "11px", 
                                color: "#2563eb", 
                                textDecoration: "none",
                                fontWeight: "700" 
                              }}
                            >
                              <i className="fas fa-file-invoice"></i> View Receipt
                            </a>
                          </div>
                        )}
                      </td>
                      <td style={{ color: "#16a34a", fontWeight: "600" }}>{pm.currency || "SAR"} {Number(pm.amount).toFixed(2)}</td>
                      <td>
                        <select
                          value={pm.status || "Pending"}
                          onChange={async (e) => {
                            try {
                              const res = await api.updatePaymentStatus(pm.id, e.target.value);
                              if (res.success) {
                                showToast(`Payment ${pm.custom_id || `PAY-${pm.id}`} status updated to ${e.target.value}!`, "success");
                                fetchCompanyProfile();
                              } else {
                                showToast(res.error || "Failed to update status", "error");
                              }
                            } catch (err) {
                              console.error(err);
                              showToast("Failed to update status", "error");
                            }
                          }}
                          style={{
                            background: pm.status === "Approved" || pm.status === "Success" || pm.status === "Verified" ? "#e6f4ea" : pm.status === "Pending" ? "#fef3c7" : "#fce8e6",
                            color: pm.status === "Approved" || pm.status === "Success" || pm.status === "Verified" ? "#137333" : pm.status === "Pending" ? "#b06000" : "#c5221f",
                            padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", border: "1px solid rgba(0,0,0,0.05)", cursor: "pointer", outline: "none"
                          }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action Row */}
      <div style={{ display: "flex", gap: "10px", justifyContent: "center", background: "#f8fafc", padding: "15px", borderRadius: "12px" }}>
        <button onClick={() => router.push("/admin/customers/add")} className="btn-submit" style={{ background: "#4f46e5" }}><i className="fas fa-plus"></i> Add Customer</button>
        <button onClick={() => router.push("/admin/bookings/add")} className="btn-submit" style={{ background: "#2563eb" }}><i className="fas fa-calendar-plus"></i> Add Booking</button>
        <button onClick={() => router.push("/admin/ledgers")} className="btn-submit" style={{ background: "#16a34a" }}><i className="fas fa-file-invoice-dollar"></i> View Ledger</button>
        <button onClick={() => router.push("/admin/payments")} className="btn-submit" style={{ background: "#ea580c" }}><i className="fas fa-cash-register"></i> Payments</button>
      </div>

      {/* Audit Trail */}
      <div style={{ background: "#ffffff", padding: "25px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "8px" }}>
          <i className="fas fa-history" style={{ color: "#2563eb" }}></i>
          <span>Audit Trail & Activity History</span>
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div style={{ display: "flex", gap: "15px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8", minWidth: "150px" }}>23 May, 2026 | 04:06 PM</span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>{actorName}</span>
            <span style={{ fontSize: "13px", color: "#1e293b" }}>Updated company profile for {company.name} ({displayId})</span>
          </div>
          <div style={{ display: "flex", gap: "15px" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8", minWidth: "150px" }}>23 May, 2026 | 02:40 PM</span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>{actorName}</span>
            <span style={{ fontSize: "13px", color: "#1e293b" }}>Registered new company: {company.name} ({displayId})</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
}

export default function CompanyProfilePage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "250px" }}>
        <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #ea580c", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
      </div>
    }>
      <CompanyProfileContent />
    </Suspense>
  );
}
