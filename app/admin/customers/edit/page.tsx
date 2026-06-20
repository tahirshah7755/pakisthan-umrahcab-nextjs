"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/utils/api";

function EditCustomerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetId = searchParams.get("id") || "";

  // Form states
  const [custName, setCustName] = useState("");
  const [custCompany, setCustCompany] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custSecondaryPhone, setCustSecondaryPhone] = useState("");
  const [custAltPhone, setCustAltPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [hotelInfo, setHotelInfo] = useState("");
  const [notes, setNotes] = useState("");

  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    const loadData = async () => {
      try {
        setLoading(true);
        if (!targetId) return;

        // Fetch customer profile
        const result = await api.getCustomer(targetId);
        const found = result?.customer || result;

        if (found) {
          setCustName(found.name || "");
          setCustCompany(found.company || "");
          setCustPhone(found.phone || "");
          setCustSecondaryPhone(found.secondary_phone || "");
          setCustAltPhone(found.alternative_phone || "");
          setCustEmail(found.email || "");
          setPassportNo(found.passport_no || "");
          setHotelInfo(found.hotel_info || "");
          setNotes(found.notes || "");
        }

        // Fetch companies list for dropdown selector
        const compList = await api.getCompanies();
        if (compList) {
          setCompanies(compList);
        }
      } catch (err) {
        console.error(err);
        showToast("Error loading customer profile details", "error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [targetId]);

  const handleEditCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) return;
    try {
      const updated = {
        name: custName,
        company: custCompany,
        phone: custPhone || "",
        secondary_phone: custSecondaryPhone || "",
        alternative_phone: custAltPhone || "",
        email: custEmail || "",
        passport_no: passportNo || "",
        hotel_info: hotelInfo || "",
        notes: notes || "",
        contact: "" // Allow controller to auto-compile formatted contact field
      };
      
      const response = await api.updateCustomer(targetId, updated);
      if (response && response.success) {
        showToast("Customer profile updated successfully!", "success");
        setTimeout(() => {
          router.push(`/admin/customers/view?id=${targetId}`);
        }, 1000);
      } else {
        showToast(response?.error || "Failed to update customer.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to save changes to customer profile.", "error");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "250px" }}>
        <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #0f766e", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
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

      {/* Teal/Emerald Header Card */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Edit Customer Profile</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Modify contact coordinates, passport documentation, and notes for the customer.</p>
        </div>
        <button 
          onClick={() => router.push(`/admin/customers/view?id=${targetId}`)} 
          style={{ background: "#064e3b", color: "#ffffff", border: "none", borderRadius: "6px", padding: "10px 18px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <i className="fas fa-arrow-left"></i>
          <span>Back to View</span>
        </button>
      </div>

      {/* Form Card */}
      <div className="form-card" style={{ background: "#ffffff", padding: "35px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}>
        <form onSubmit={handleEditCustomerSubmit} style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          
          {/* Customer Name */}
          <div style={{ width: "100%" }}>
            <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Customer Full Name *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-user form-icon" style={{ color: "#0f766e" }}></i>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Abu Bakar" 
                value={custName} 
                onChange={(e) => setCustName(e.target.value)} 
                required 
                style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
              />
            </div>
          </div>

          {/* Associated Company selector */}
          <div style={{ width: "100%" }}>
            <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Associated Company *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-building form-icon" style={{ color: "#0f766e" }}></i>
              <select 
                className="form-input form-select" 
                value={custCompany} 
                onChange={(e) => setCustCompany(e.target.value)}
                required
                style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
              >
                <option value="">Select Associated Company</option>
                {companies.map((com) => (
                  <option key={com.id} value={com.name}>
                    {com.name}
                  </option>
                ))}
              </select>
              <i className="fas fa-chevron-down select-arrow"></i>
            </div>
          </div>

          {/* Phones Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
            <div>
              <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Primary Phone *</label>
              <div className="form-input-wrapper">
                <i className="fas fa-phone form-icon" style={{ color: "#0f766e" }}></i>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. +966501234567" 
                  value={custPhone} 
                  onChange={(e) => setCustPhone(e.target.value)} 
                  required
                  style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Secondary Phone</label>
              <div className="form-input-wrapper">
                <i className="fas fa-phone-volume form-icon" style={{ color: "#0f766e" }}></i>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. +966501234568" 
                  value={custSecondaryPhone} 
                  onChange={(e) => setCustSecondaryPhone(e.target.value)} 
                  style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Alternative Phone</label>
              <div className="form-input-wrapper">
                <i className="fas fa-phone-flip form-icon" style={{ color: "#0f766e" }}></i>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. +923001234567" 
                  value={custAltPhone} 
                  onChange={(e) => setCustAltPhone(e.target.value)} 
                  style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                />
              </div>
            </div>
          </div>

          {/* Email & Passport Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Email Address</label>
              <div className="form-input-wrapper">
                <i className="fas fa-envelope form-icon" style={{ color: "#0f766e" }}></i>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="e.g. customer@email.com" 
                  value={custEmail} 
                  onChange={(e) => setCustEmail(e.target.value)} 
                  style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Passport Number</label>
              <div className="form-input-wrapper">
                <i className="fas fa-passport form-icon" style={{ color: "#0f766e" }}></i>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. AA1234567" 
                  value={passportNo} 
                  onChange={(e) => setPassportNo(e.target.value)} 
                  style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                />
              </div>
            </div>
          </div>

          {/* Hotel Stay info */}
          <div style={{ width: "100%" }}>
            <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Hotel / Stay Info</label>
            <div className="form-input-wrapper">
              <i className="fas fa-hotel form-icon" style={{ color: "#0f766e" }}></i>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Makkah Fairmont Tower, Room 1024" 
                value={hotelInfo} 
                onChange={(e) => setHotelInfo(e.target.value)} 
                style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
              />
            </div>
          </div>

          {/* External Notes / Remarks */}
          <div style={{ width: "100%" }}>
            <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Customer Remarks / External Notes</label>
            <div style={{ position: "relative" }}>
              <i className="fas fa-comment-dots" style={{ position: "absolute", top: "15px", left: "15px", color: "#0f766e", fontSize: "16px" }}></i>
              <textarea 
                className="form-input" 
                placeholder="Add notes or remarks here..." 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                rows={3}
                style={{ border: "1px solid #cbd5e1", borderRadius: "6px", paddingLeft: "45px", paddingTop: "12px", height: "100px", width: "100%" }}
              />
            </div>
          </div>

          {/* Submit Button */}
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

export default function EditCustomerPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "250px" }}>
        <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #0f766e", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
      </div>
    }>
      <EditCustomerContent />
    </Suspense>
  );
}
