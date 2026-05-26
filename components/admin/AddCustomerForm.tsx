"use client";

import React from "react";
import { CompanyItem } from "./CustomerDirectory";

interface AddCustomerFormProps {
  custCompany: string;
  setCustCompany: (val: string) => void;
  custName: string;
  setCustName: (val: string) => void;
  custPhone: string;
  setCustPhone: (val: string) => void;
  custSecondaryPhone: string;
  setCustSecondaryPhone: (val: string) => void;
  custAltPhone: string;
  setCustAltPhone: (val: string) => void;
  custEmail: string;
  setCustEmail: (val: string) => void;
  custNotes: string;
  setCustNotes: (val: string) => void;
  companies: CompanyItem[];
  handleAddCustomer: (e: React.FormEvent) => void;
  router: any;
}

export const AddCustomerForm: React.FC<AddCustomerFormProps> = ({
  custCompany,
  setCustCompany,
  custName,
  setCustName,
  custPhone,
  setCustPhone,
  custSecondaryPhone,
  setCustSecondaryPhone,
  custAltPhone,
  setCustAltPhone,
  custEmail,
  setCustEmail,
  custNotes,
  setCustNotes,
  companies,
  handleAddCustomer,
  router,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header Banner */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #047857 0%, #10b981 100%)" }}>
        <div>
          <span style={{ fontSize: "11px", background: "rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: "12px", display: "inline-block", marginBottom: "8px", fontWeight: "600" }}>
            <i className="fas fa-user-plus" style={{ marginRight: "5px" }}></i> New Registration
          </span>
          <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#fff", margin: 0 }}>Add New Customer</h2>
          <p style={{ color: "rgba(255,255,255,0.85)", margin: "5px 0 0 0" }}>Register a new individual customer and assign them to a company account.</p>
        </div>
        <button type="button" onClick={() => router.push("/admin/mock/customers-all")} className="form-btn-back" style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          <i className="fas fa-arrow-left"></i>
          <span>Back to List</span>
        </button>
      </div>

      {/* Quick Info Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div style={{ background: "#cbd5e1", padding: "16px 20px", borderRadius: "12px", borderLeft: "4px solid #64748b" }}>
          <span style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: "700", color: "#475569" }}>QUICK SETUP</span>
          <h4 style={{ margin: "4px 0", color: "#1e293b", fontSize: "16px" }}>Fresh Record</h4>
          <p style={{ margin: 0, fontSize: "13px", color: "#475569" }}>Customer data will be initialized.</p>
        </div>
        <div style={{ background: "#f8fafc", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: "700", color: "#2563eb" }}>ACTIVITY HISTORY</span>
          <h4 style={{ margin: "4px 0", color: "#1e293b", fontSize: "16px" }}>None yet</h4>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>New customers start with a clean slate.</p>
        </div>
      </div>

      {/* Registration Form Container */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
        <div className="form-card" style={{ width: "100%", maxWidth: "700px", padding: "30px", borderRadius: "16px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}>
          <form onSubmit={handleAddCustomer} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Company Select */}
            <div>
              <label className="form-label" style={{ fontWeight: "600", fontSize: "13px", color: "#374151", marginBottom: "6px", display: "block" }}>Assign to Company *</label>
              <div className="form-input-wrapper" style={{ position: "relative" }}>
                <i className="fas fa-building form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                <select className="form-input form-select" value={custCompany} onChange={(e) => setCustCompany(e.target.value)} required style={{ paddingLeft: "42px", width: "100%" }}>
                  <option value="">Select a Company</option>
                  {companies.map((com) => (
                    <option key={com.id} value={com.name}>
                      {com.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Customer Name */}
            <div>
              <label className="form-label" style={{ fontWeight: "600", fontSize: "13px", color: "#374151", marginBottom: "6px", display: "block" }}>Customer Name *</label>
              <div className="form-input-wrapper" style={{ position: "relative" }}>
                <i className="fas fa-user form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                <input type="text" className="form-input" placeholder="e.g. John Doe" value={custName} onChange={(e) => setCustName(e.target.value)} required style={{ paddingLeft: "42px", width: "100%" }} />
              </div>
            </div>

            {/* Two-Column Grid: Phones & Email */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label className="form-label" style={{ fontWeight: "600", fontSize: "13px", color: "#374151", marginBottom: "6px", display: "block" }}>Primary Phone</label>
                <div className="form-input-wrapper" style={{ position: "relative" }}>
                  <i className="fas fa-phone form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                  <input type="text" className="form-input" placeholder="+9665XXXXXXXX" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} style={{ paddingLeft: "42px", width: "100%" }} />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: "600", fontSize: "13px", color: "#374151", marginBottom: "6px", display: "block" }}>Secondary Phone</label>
                <div className="form-input-wrapper" style={{ position: "relative" }}>
                  <i className="fas fa-phone form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                  <input type="text" className="form-input" placeholder="+9665XXXXXXXX" value={custSecondaryPhone} onChange={(e) => setCustSecondaryPhone(e.target.value)} style={{ paddingLeft: "42px", width: "100%" }} />
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label className="form-label" style={{ fontWeight: "600", fontSize: "13px", color: "#374151", marginBottom: "6px", display: "block" }}>Alternative Phone</label>
                <div className="form-input-wrapper" style={{ position: "relative" }}>
                  <i className="fas fa-phone form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                  <input type="text" className="form-input" placeholder="+9665XXXXXXXX" value={custAltPhone} onChange={(e) => setCustAltPhone(e.target.value)} style={{ paddingLeft: "42px", width: "100%" }} />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: "600", fontSize: "13px", color: "#374151", marginBottom: "6px", display: "block" }}>Email Address</label>
                <div className="form-input-wrapper" style={{ position: "relative" }}>
                  <i className="fas fa-envelope form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                  <input type="email" className="form-input" placeholder="customer@example.com" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} style={{ paddingLeft: "42px", width: "100%" }} />
                </div>
              </div>
            </div>

            {/* External Notes */}
            <div>
              <label className="form-label" style={{ fontWeight: "600", fontSize: "13px", color: "#374151", marginBottom: "6px", display: "block" }}>External Notes</label>
              <div className="form-input-wrapper" style={{ position: "relative" }}>
                <i className="fas fa-comment form-icon" style={{ position: "absolute", left: "14px", top: "16px", color: "#9ca3af" }}></i>
                <textarea 
                  className="form-input" 
                  placeholder="Notes that might be shared or visible to relevant parties..." 
                  value={custNotes} 
                  onChange={(e) => setCustNotes(e.target.value)} 
                  rows={3} 
                  style={{ paddingLeft: "42px", width: "100%", resize: "vertical", fontFamily: "inherit" }}
                />
              </div>
            </div>

            {/* Submit Action */}
            <div style={{ marginTop: "10px" }}>
              <button type="submit" className="btn-submit" style={{ width: "100%", background: "#1e293b", color: "#fff", padding: "14px", borderRadius: "10px", border: "none", fontSize: "15px", fontWeight: "600", cursor: "pointer", boxShadow: "0 4px 12px rgba(30, 41, 59, 0.25)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <i className="fas fa-plus"></i> Register New Customer
              </button>
            </div>

            {/* Audit footer */}
            <div style={{ background: "#cbd5e1", padding: "12px 18px", borderRadius: "10px", marginTop: "10px" }}>
              <span style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: "700", color: "#475569" }}>AUDIT PREVIEW</span>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                <div>
                  <span style={{ fontSize: "10px", color: "#64748b" }}>Creator</span>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}><i className="fas fa-user" style={{ marginRight: "4px" }}></i> umrahcab (Current User)</div>
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: "#64748b" }}>Initial Date</span>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}><i className="fas fa-calendar" style={{ marginRight: "4px" }}></i> 25 May, 2026</div>
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
};
