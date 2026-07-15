"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/utils/api";
import CustomerSearchDropdown from "@/components/admin/CustomerSearchDropdown";
import TimePicker24h from "@/components/admin/TimePicker24h";

function AddServicePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledCustomerId = searchParams.get("customerId") || searchParams.get("customer_id") || "";

  // Customer
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Catalogue selector
  const [catalogList, setCatalogList] = useState<any[]>([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogIsOpen, setCatalogIsOpen] = useState(false);
  const [selectedCatalogObj, setSelectedCatalogObj] = useState<any | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Form fields
  const [srvName, setSrvName] = useState("");
  const [srvType, setSrvType] = useState("Service");
  const [srvPrice, setSrvPrice] = useState("");
  const [srvPickupLocation, setSrvPickupLocation] = useState("");
  const [srvStatus, setSrvStatus] = useState("Pending");
  const [srvDriverCash, setSrvDriverCash] = useState("");
  const [srvDate, setSrvDate] = useState("");
  const [srvTime, setSrvTime] = useState("12:00");
  const [srvRemarks, setSrvRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3500);
  };

  // Prefill customer from query param
  useEffect(() => {
    if (prefilledCustomerId) {
      api.getCustomer(prefilledCustomerId).then((data: any) => {
        if (data) setSelectedCustomer(data.customer || data);
      }).catch(err => console.error("Failed to prefill customer details", err));
    }
  }, [prefilledCustomerId]);

  // Load catalogue items
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setLoadingCatalog(true);
        const res = await api.getServices(catalogSearch, "Catalogue", 1, 50, undefined, true);
        const arr = res?.data || res;
        if (Array.isArray(arr)) {
          setCatalogList(arr.filter((s: any) => s.type === "Catalogue"));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingCatalog(false);
      }
    };
    const timer = setTimeout(loadCatalog, 250);
    return () => clearTimeout(timer);
  }, [catalogSearch]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) { showToast("Please select a customer.", "error"); return; }
    if (!srvName) { showToast("Service Description is required.", "error"); return; }
    if (!srvDate) { showToast("Service Date is required.", "error"); return; }

    try {
      setSubmitting(true);
      const payload = {
        customer_id: selectedCustomer.id,
        name: srvName,
        type: srvType || "Service",
        base_price: parseFloat(srvPrice) || 0,
        pickup: srvPickupLocation || null,
        status: srvStatus || "Pending",
        driver_cash: parseFloat(srvDriverCash) || 0,
        date: srvDate || null,
        time: srvTime || null,
        description: srvRemarks || null,
      };
      const res = await api.createService(payload);
      if (res?.success) {
        showToast("Additional Service registered successfully!", "success");
        // Reset form
        setSelectedCustomer(null);
        setSrvName(""); setSrvType("Service"); setSrvPrice("");
        setSrvPickupLocation(""); setSrvStatus("Pending"); setSrvDriverCash("");
        setSrvDate(""); setSrvTime("12:00"); setSrvRemarks("");
        setSelectedCatalogObj(null); setCatalogSearch("");
        setTimeout(() => router.push("/admin/services"), 1200);
      } else {
        showToast("Failed to register service. Please try again.", "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast("An error occurred while saving.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCatalog = catalogList.filter((item) =>
    item.name.toLowerCase().includes(catalogSearch.toLowerCase())
  );



  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Toast */}
      {toast.show && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "#ffffff", padding: "12px 24px", borderRadius: "8px",
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontWeight: "600",
          fontSize: "14px", display: "flex", alignItems: "center", gap: "10px",
        }}>
          <i className={toast.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>Register Auxiliary Service</h2>
          <p>Add a new auxiliary service entry linked to a customer with standard default pricing.</p>
        </div>
        <button onClick={() => router.push("/admin/services")} className="form-btn-back">
          <i className="fas fa-arrow-left"></i>
          <span>Back to Services</span>
        </button>
      </div>

      {/* Form Card */}
      <div className="form-card">
        <form onSubmit={handleAddService} className="form-grid">

          {/* Customer Search */}
          <div className="form-group-full" style={{ position: "relative" }}>
            <CustomerSearchDropdown
              selectedCustomer={selectedCustomer}
              onSelectCustomer={setSelectedCustomer}
              label="Search Customer"
              required={true}
              themeColor="#7c3aed"
              placeholder="Search and select a customer..."
              disabled={!!prefilledCustomerId}
            />
          </div>

          {/* Service Description / Catalogue Selector */}
          <div style={{ position: "relative", marginBottom: "15px" }} className="form-group-full">
            <label className="form-label">Service Description *</label>
            <div
              className="form-input-wrapper"
              onClick={() => setCatalogIsOpen(!catalogIsOpen)}
              style={{ cursor: "pointer" }}
            >
              <i className="fas fa-hand-holding-hand form-icon"></i>
              <div className="form-input" style={{ display: "flex", alignItems: "center", background: "#ffffff", height: "46px", paddingLeft: "45px" }}>
                {selectedCatalogObj ? (
                  <span style={{ color: "#1e293b", fontWeight: "600" }}>
                    {selectedCatalogObj.name}{selectedCatalogObj.base_price > 0 ? ` (SR ${selectedCatalogObj.base_price})` : ""}
                  </span>
                ) : (
                  <span style={{ color: "#94a3b8" }}>Choose a service description from catalogue...</span>
                )}
              </div>
              <i className="fas fa-chevron-down select-arrow" style={{ pointerEvents: "none" }}></i>
            </div>

            {catalogIsOpen && (
              <div
                style={{
                  position: "absolute", top: "100%", left: 0, right: 0,
                  background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 99,
                  marginTop: "5px", padding: "10px",
                  display: "flex", flexDirection: "column", gap: "8px",
                }}
              >
                <div style={{ position: "relative" }}>
                  <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "14px" }}></i>
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: "35px", height: "38px" }}
                    placeholder="Search service description..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
                  {loadingCatalog && filteredCatalog.length === 0 ? (
                    <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                      <i className="fas fa-spinner fa-spin" style={{ marginRight: "6px" }}></i> Loading services...
                    </div>
                  ) : filteredCatalog.length === 0 ? (
                    <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                      No matching services found in catalogue
                    </div>
                  ) : (
                    filteredCatalog.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: "10px 12px", borderRadius: "6px", cursor: "pointer",
                          transition: "all 0.15s ease",
                          background: selectedCatalogObj && String(item.id) === String(selectedCatalogObj.id) ? "#f1f5f9" : "transparent",
                          color: "#1e293b", fontSize: "13px", fontWeight: "500",
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCatalogObj(item);
                          setSrvName(item.name);
                          setSrvPrice(item.base_price ? String(item.base_price) : "0");
                          setSrvType(item.type || "Catalogue");
                          setCatalogIsOpen(false);
                          setCatalogSearch("");
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = selectedCatalogObj && String(item.id) === String(selectedCatalogObj.id) ? "#f1f5f9" : "transparent")}
                      >
                        <div style={{ fontWeight: "700" }}>{item.name}</div>
                        {item.base_price > 0 && (
                          <span style={{ fontSize: "11px", background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "10px", fontWeight: "600" }}>
                            SR {item.base_price}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pickup Location */}
          <div>
            <label className="form-label">Pickup Location</label>
            <div className="form-input-wrapper">
              <i className="fas fa-map-marker-alt form-icon"></i>
              <input type="text" className="form-input" placeholder="Type or select location..." value={srvPickupLocation} onChange={(e) => setSrvPickupLocation(e.target.value)} />
            </div>
          </div>

          {/* Service Status */}
          <div>
            <label className="form-label">Service Status *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-chart-line form-icon"></i>
              <select className="form-input form-select" value={srvStatus} onChange={(e) => setSrvStatus(e.target.value)} required>
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <i className="fas fa-chevron-down select-arrow"></i>
            </div>
          </div>

          {/* Service Cost */}
          <div>
            <label className="form-label">Service Cost (SAR)</label>
            <div className="form-input-wrapper">
              <i className="fas fa-tags form-icon"></i>
              <input type="number" step="0.01" min="0" className="form-input" placeholder="0.00" value={srvPrice} onChange={(e) => setSrvPrice(e.target.value)} />
            </div>
          </div>

          {/* Cash to Receive (Driver) */}
          <div>
            <label className="form-label">Cash to Receive (Driver)</label>
            <div className="form-input-wrapper">
              <i className="fas fa-hand-holding-dollar form-icon"></i>
              <input type="number" step="0.01" min="0" className="form-input" placeholder="0.00" value={srvDriverCash} onChange={(e) => setSrvDriverCash(e.target.value)} />
            </div>
          </div>

          {/* Service Date */}
          <div>
            <label className="form-label">Service Date *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-calendar-alt form-icon"></i>
              <input type="date" className="form-input" value={srvDate} onChange={(e) => setSrvDate(e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="form-label">Service Time</label>
            <TimePicker24h value={srvTime} onChange={setSrvTime} />
          </div>

          {/* External Remarks */}
          <div className="form-group-full">
            <label className="form-label">External Remarks</label>
            <div className="form-input-wrapper">
              <i className="fas fa-comment-dots form-icon" style={{ top: "16px", transform: "none" }}></i>
              <textarea className="form-input form-textarea" placeholder="Customer/Driver remarks..." value={srvRemarks} onChange={(e) => setSrvRemarks(e.target.value)}></textarea>
            </div>
          </div>

          {/* Submit */}
          <div className="form-group-full form-submit-row" style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
            <button
              type="submit"
              disabled={submitting}
              className="btn-submit"
              style={{
                width: "100%", maxWidth: "500px",
                background: submitting ? "#94a3b8" : "#7c3aed",
                color: "#ffffff", fontWeight: "600", height: "48px",
                borderRadius: "8px", display: "flex", alignItems: "center",
                justifyContent: "center", gap: "8px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                cursor: submitting ? "not-allowed" : "pointer",
                border: "none", fontSize: "15px", transition: "all 0.2s ease",
              }}
            >
              {submitting ? (
                <><i className="fas fa-spinner fa-spin"></i><span>Saving...</span></>
              ) : (
                <><i className="fas fa-save"></i><span>Save Additional Service</span></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AddServicePage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #7c3aed", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <AddServicePageContent />
    </Suspense>
  );
}
