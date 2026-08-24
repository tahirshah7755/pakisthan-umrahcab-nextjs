"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/utils/api";

function EditCompanyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetId = searchParams.get("id") || "";

  // Form states
  const [compName, setCompName] = useState("");
  const [agentUsername, setAgentUsername] = useState("");
  const [agentPassword, setAgentPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [compPhone, setCompPhone] = useState("");
  const [compEmail, setCompEmail] = useState("");
  const [compWeb, setCompWeb] = useState("");
  const [compLogoName, setCompLogoName] = useState("");
  const [compLogoBase64, setCompLogoBase64] = useState("");
  const [compAddress, setCompAddress] = useState("");
  const [compVouchers, setCompVouchers] = useState(true);
  const [compReminders, setCompReminders] = useState(true);
  const [compLedgerFrequency, setCompLedgerFrequency] = useState("Monday");
  const [compInvoice, setCompInvoice] = useState(true);
  const [compTomorrowReminder, setCompTomorrowReminder] = useState(false);
  const [compExemptBulkLock, setCompExemptBulkLock] = useState(false);
  const [compRemarks, setCompRemarks] = useState("");
  const [loading, setLoading] = useState(true);
  const [priceGroups, setPriceGroups] = useState<string[]>(["Standard"]);
  const [compPriceGroup, setCompPriceGroup] = useState("Standard");

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const groups = await api.getPriceGroups();
        if (groups && groups.length > 0) {
          setPriceGroups(groups);
        }
      } catch (err) {
        console.error("Error fetching price groups:", err);
      }
    };
    fetchGroups();
  }, []);

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

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        if (!targetId) return;

        const result = await api.getCompany(targetId);
        const found = result?.company;

        if (found) {
          setCompName(found.name || "");
          setAgentUsername(found.agent_username || "");
          setCompPhone(found.phone || "");
          setCompEmail(found.email || "");
          setCompWeb(found.website || "");
          setCompLogoName(found.logo_path || "");
          setCompAddress(found.address || "");
          setCompVouchers(found.vouchers === 1 || found.vouchers === true);
          setCompReminders(found.reminders === 1 || found.reminders === true);
          setCompLedgerFrequency(found.ledger_frequency || "Monday");
          setCompInvoice(found.invoice === 1 || found.invoice === true);
          setCompTomorrowReminder(found.tomorrow_reminder === 1 || found.tomorrow_reminder === true);
          setCompExemptBulkLock(found.exempt_bulk_lock === 1 || found.exempt_bulk_lock === true);
          setCompRemarks(found.remarks || "");
          setCompPriceGroup(found.price_group || "Standard");
        } else {
          // Default fallbacks
          setCompName("Zahid Travels");
          setCompPhone("+966501234567");
          setCompEmail("zahid@travels.com");
          setCompAddress("Jeddah, Saudi Arabia");
        }
      } catch (err) {
        console.error(err);
        showToast("Error loading company profile details", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [targetId]);

  const handleEditCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) return;
    try {
      const updated = {
        name: compName,
        agent_username: agentUsername,
        agent_password: agentPassword || undefined,
        phone: compPhone || "N/A",
        email: compEmail || "N/A",
        website: compWeb || "N/A",
        address: compAddress || "N/A",
        invoice: compInvoice ? 1 : 0,
        vouchers: compVouchers ? 1 : 0,
        reminders: compReminders ? 1 : 0,
        ledger_frequency: compLedgerFrequency,
        tomorrow_reminder: compTomorrowReminder ? 1 : 0,
        exempt_bulk_lock: compExemptBulkLock ? 1 : 0,
        remarks: compRemarks || "",
        logo_path: compLogoBase64 ? compLogoBase64 : (compLogoName && (compLogoName.includes('/') || compLogoName.includes('.')) ? compLogoName : undefined),
        price_group: compPriceGroup
      };
      await api.updateCompany(targetId, updated);
      showToast("Company profile updated successfully!", "success");
      setTimeout(() => {
        router.push(`/admin/companies/view?id=${targetId}`);
      }, 1000);
    } catch (err) {
      console.error(err);
      showToast("Failed to save changes to company profile.", "error");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "250px" }}>
        <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #ea580c", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px", maxWidth: "900px", margin: "0 auto", padding: "10px" }}>
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
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Edit Company Profile</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Modify configuration and preference values for the corporate contract.</p>
        </div>
        <button 
          onClick={() => router.push(`/admin/companies/view?id=${targetId}`)} 
          style={{ background: "#7c2d12", color: "#ffffff", border: "none", borderRadius: "6px", padding: "10px 18px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <i className="fas fa-arrow-left"></i>
          <span>Back to View</span>
        </button>
      </div>

      {/* Form Card */}
      <div className="form-card" style={{ background: "#ffffff", padding: "35px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}>
        <form onSubmit={handleEditCompanySubmit} style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          
          {/* Company / Agent Name */}
          <div style={{ width: "100%" }}>
            <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Company / Agent Name *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-building form-icon" style={{ color: "#2563eb" }}></i>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Al-Saudia Travel" 
                value={compName} 
                onChange={(e) => setCompName(e.target.value)} 
                required 
                style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
              />
            </div>
          </div>

          {/* Agent Username & Password */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Agent Username *</label>
              <div className="form-input-wrapper">
                <i className="fas fa-user form-icon" style={{ color: "#2563eb" }}></i>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter Username" 
                  value={agentUsername} 
                  onChange={(e) => setAgentUsername(e.target.value)} 
                  required 
                  style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Agent Password (Leave blank to keep current)</label>
              <div className="form-input-wrapper" style={{ position: "relative" }}>
                <i className="fas fa-lock form-icon" style={{ color: "#2563eb" }}></i>
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-input" 
                  placeholder="Enter New Password" 
                  value={agentPassword} 
                  onChange={(e) => setAgentPassword(e.target.value)} 
                  style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px", paddingRight: "45px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "15px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#64748b",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 5
                  }}
                >
                  <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                </button>
              </div>
            </div>
          </div>

          {/* Row 1: Phone & Email */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Official Phone</label>
              <div className="form-input-wrapper">
                <i className="fas fa-phone form-icon" style={{ color: "#2563eb" }}></i>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="+966XXXXXXXXX" 
                  value={compPhone} 
                  onChange={(e) => setCompPhone(e.target.value)} 
                  style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Official Email</label>
              <div className="form-input-wrapper">
                <i className="fas fa-envelope form-icon" style={{ color: "#2563eb" }}></i>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="info@company.com" 
                  value={compEmail} 
                  onChange={(e) => setCompEmail(e.target.value)} 
                  style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Website & Logo */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Company Website</label>
              <div className="form-input-wrapper">
                <i className="fas fa-globe form-icon" style={{ color: "#2563eb" }}></i>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="https://example.com" 
                  value={compWeb} 
                  onChange={(e) => setCompWeb(e.target.value)} 
                  style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Company Logo</label>
              <div className="form-input-wrapper" style={{ position: "relative" }}>
                <i className="fas fa-image form-icon" style={{ color: "#2563eb", zIndex: 5 }}></i>
                <input 
                  type="file" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCompLogoName(file.name);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setCompLogoBase64(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ opacity: 0, position: "absolute", top: 0, left: 0, width: "100%", height: "100%", cursor: "pointer", zIndex: 10 }} 
                />
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px", paddingLeft: "45px", width: "100%", fontSize: "14px", color: "#64748b", background: "#fff" }}>
                  <span style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "4px 10px", marginRight: "10px", fontWeight: "600", fontSize: "12px", color: "#475569" }}>Choose File</span>
                  {compLogoName || "No file chosen"}
                </div>
              </div>
            </div>
          </div>

          {/* Physical Address */}
          <div style={{ width: "100%" }}>
            <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Physical Address</label>
            <div style={{ position: "relative" }}>
              <i className="fas fa-location-dot" style={{ position: "absolute", top: "15px", left: "15px", color: "#2563eb", fontSize: "16px" }}></i>
              <textarea 
                className="form-input" 
                placeholder="Full office address..." 
                value={compAddress} 
                onChange={(e) => setCompAddress(e.target.value)} 
                rows={3}
                style={{ border: "1px solid #cbd5e1", borderRadius: "6px", paddingLeft: "45px", paddingTop: "12px", height: "100px", width: "100%" }}
              />
            </div>
          </div>

          {/* Row 3: Send Vouchers & Send Reminders */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>Send Vouchers to their guests?</span>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>Enable auto-voucher</span>
              </div>
              <label className="switch">
                <input type="checkbox" checked={compVouchers} onChange={(e) => setCompVouchers(e.target.checked)} />
                <span className="slider"></span>
              </label>
            </div>

            <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>Send Reminders to their guests?</span>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>Enable reminders</span>
              </div>
              <label className="switch">
                <input type="checkbox" checked={compReminders} onChange={(e) => setCompReminders(e.target.checked)} />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {/* Row 4: Ledger Frequency & Generate Invoice */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Ledger Frequency (Weekly Day)</label>
              <div className="form-input-wrapper">
                <i className="fas fa-calendar-alt form-icon" style={{ color: "#2563eb" }}></i>
                <select 
                  className="form-input form-select" 
                  value={compLedgerFrequency} 
                  onChange={(e) => setCompLedgerFrequency(e.target.value)}
                  style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
                <i className="fas fa-chevron-down select-arrow"></i>
              </div>
            </div>

            <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>Generate Invoice?</span>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>Enable invoices</span>
              </div>
              <label className="switch">
                <input type="checkbox" checked={compInvoice} onChange={(e) => setCompInvoice(e.target.checked)} />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {/* Row 4.5: Assigned Price Group */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Assigned Price Group</label>
              <div className="form-input-wrapper">
                <i className="fas fa-tags form-icon" style={{ color: "#2563eb" }}></i>
                <select 
                  className="form-input form-select" 
                  value={compPriceGroup} 
                  onChange={(e) => setCompPriceGroup(e.target.value)}
                  style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                >
                  {priceGroups.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <i className="fas fa-chevron-down select-arrow"></i>
              </div>
            </div>
            <div></div>
          </div>

          {/* Row 5: Tomorrow Invoice Reminder & Exempt from Bulk Lock */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>Tomorrow Invoice Reminder?</span>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>Enable reminder</span>
              </div>
              <label className="switch">
                <input type="checkbox" checked={compTomorrowReminder} onChange={(e) => setCompTomorrowReminder(e.target.checked)} />
                <span className="slider"></span>
              </label>
            </div>

            <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>Exempt from Bulk Lock?</span>
                <span style={{ fontSize: "11px", color: "#2563eb", fontWeight: "600" }}>{compExemptBulkLock ? "EXEMPTED" : "NOT EXEMPTED"}</span>
              </div>
              <label className="switch">
                <input type="checkbox" checked={compExemptBulkLock} onChange={(e) => setCompExemptBulkLock(e.target.checked)} />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {/* Internal Remarks */}
          <div style={{ width: "100%" }}>
            <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Internal Remarks</label>
            <div style={{ position: "relative" }}>
              <i className="fas fa-comment-dots" style={{ position: "absolute", top: "15px", left: "15px", color: "#2563eb", fontSize: "16px" }}></i>
              <textarea 
                className="form-input" 
                placeholder="Any internal notes about this company..." 
                value={compRemarks} 
                onChange={(e) => setCompRemarks(e.target.value)} 
                rows={3}
                style={{ border: "1px solid #cbd5e1", borderRadius: "6px", paddingLeft: "45px", paddingTop: "12px", height: "100px", width: "100%" }}
              />
            </div>
          </div>

          {/* Submit Row */}
          <div style={{ marginTop: "15px" }}>
            <button type="submit" style={{ width: "100%", background: "#0f172a", color: "#ffffff", border: "none", borderRadius: "6px", height: "50px", fontWeight: "600", fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <i className="fas fa-check"></i>
              <span>Save Changes</span>
            </button>
          </div>
        </form>
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

export default function EditCompanyPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "250px" }}>
        <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #ea580c", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
      </div>
    }>
      <EditCompanyContent />
    </Suspense>
  );
}
