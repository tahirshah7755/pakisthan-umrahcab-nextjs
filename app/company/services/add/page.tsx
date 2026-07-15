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
      const fetchCustomer = async () => {
        try {
          const res = await api.getCustomer(prefilledCustomerId);
          if (res && res.customer) {
            setSelectedCustomer(res.customer);
          }
        } catch (err) {
          console.error("Failed to prefill customer details", err);
        }
      };
      fetchCustomer();
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

        setTimeout(() => {
          router.push(prefilledCustomerId ? `/company/customers/view?id=${prefilledCustomerId}` : `/company/customers`);
        }, 1200);
      } else {
        showToast(res?.error || "Registration failed.", "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Request submission error.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCatalogSelect = (item: any) => {
    setSelectedCatalogObj(item);
    setSrvName(item.name || "");
    setSrvType(item.type || "Service");
    setSrvPrice(item.base_price ? String(item.base_price) : "");
    setSrvPickupLocation(item.pickup || "");
    setSrvDriverCash(item.driver_cash ? String(item.driver_cash) : "");
    setCatalogIsOpen(false);
  };

  const GOLD_COLOR = "#d4af37";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {toast.show && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: toast.type === "success" ? "#10b981" : "#ef4444", color: "#ffffff",
          padding: "12px 24px", borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          fontWeight: "600", fontSize: "14px", display: "flex", alignItems: "center", gap: "10px"
        }}>
          <i className={toast.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"}></i>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #b48a1d 0%, #d4af37 100%)" }}>
        <div>
          <h2>Add Customer Service</h2>
          <p>Register extra support, transport upgrades, or auxiliary services under a customer profile.</p>
        </div>
        <button onClick={() => router.push(prefilledCustomerId ? `/company/customers/view?id=${prefilledCustomerId}` : `/company/customers`)} className="form-btn-back">
          <i className="fas fa-arrow-left"></i>
          <span>Back to Profile</span>
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", width: "100%", padding: "10px 0" }}>
        <div className="form-card" style={{ maxWidth: "650px", width: "100%", background: "#ffffff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", padding: "30px", border: "1px solid #e2e8f0" }}>
          
          <div style={{ marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "15px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#64748b" }}>QUICK CATALOGUE SELECTOR (OPTIONAL)</span>
            <div style={{ position: "relative", marginTop: "8px" }}>
              <div 
                className="form-input" 
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", background: "#f8fafc" }}
                onClick={() => setCatalogIsOpen(!catalogIsOpen)}
              >
                <span style={{ color: selectedCatalogObj ? "#0f172a" : "#94a3b8", fontWeight: selectedCatalogObj ? "600" : "400" }}>
                  {selectedCatalogObj ? `${selectedCatalogObj.name} (SAR ${selectedCatalogObj.base_price})` : "Select template from Catalogue..."}
                </span>
                <i className={`fas fa-chevron-${catalogIsOpen ? "up" : "down"}`} style={{ color: "#94a3b8", fontSize: "12px" }}></i>
              </div>

              {catalogIsOpen && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #cbd5e1", borderRadius: "8px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", zIndex: 100, marginTop: "5px", padding: "10px", maxHeight: "250px", overflowY: "auto" }}>
                  <input 
                    type="text" 
                    placeholder="Search templates..." 
                    className="form-input" 
                    value={catalogSearch} 
                    onChange={(e) => setCatalogSearch(e.target.value)} 
                    style={{ marginBottom: "10px", height: "35px" }} 
                  />
                  {loadingCatalog ? (
                    <div style={{ textAlign: "center", padding: "10px", color: "#64748b" }}>Loading templates...</div>
                  ) : catalogList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "10px", color: "#64748b" }}>No catalog templates found.</div>
                  ) : (
                    catalogList.map((item) => (
                      <div 
                        key={item.id} 
                        style={{ padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "#334155", transition: "background 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        onClick={() => handleCatalogSelect(item)}
                      >
                        {item.name} <span style={{ color: "#10b981", marginLeft: "5px" }}>SAR {item.base_price}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleAddService} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            <CustomerSearchDropdown
              selectedCustomer={selectedCustomer}
              onSelectCustomer={setSelectedCustomer}
              themeColor={GOLD_COLOR}
              disabled={!!prefilledCustomerId}
            />

            <div>
              <label className="form-label">Service Description *</label>
              <div className="form-input-wrapper">
                <i className="fas fa-file-signature form-icon"></i>
                <input type="text" className="form-input" placeholder="e.g. VIP Meet & Greet Service" value={srvName} onChange={(e) => setSrvName(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: "flex", gap: "15px" }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Category / Type *</label>
                <div className="form-input-wrapper">
                  <select className="form-input form-select" value={srvType} onChange={(e) => setSrvType(e.target.value)}>
                    <option value="Service">Service</option>
                    <option value="Visa">Visa</option>
                    <option value="Guide">Ziyarah Guide</option>
                    <option value="Upgrade">Upgrade Option</option>
                    <option value="Other">Other Category</option>
                  </select>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <label className="form-label">Base Price (SAR) *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-money-bill-wave form-icon"></i>
                  <input type="number" className="form-input" placeholder="0.00" value={srvPrice} onChange={(e) => setSrvPrice(e.target.value)} required />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "15px" }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Service Date *</label>
                <div className="form-input-wrapper">
                  <input type="date" className="form-input" value={srvDate} onChange={(e) => setSrvDate(e.target.value)} style={{ paddingLeft: "15px" }} required />
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <label className="form-label">Service Time</label>
                <TimePicker24h value={srvTime} onChange={setSrvTime} />
              </div>
            </div>

            <div>
              <label className="form-label">Pickup Location / Details</label>
              <div className="form-input-wrapper">
                <i className="fas fa-map-marker-alt form-icon"></i>
                <input type="text" className="form-input" placeholder="e.g. Makkah Hotel Lobby" value={srvPickupLocation} onChange={(e) => setSrvPickupLocation(e.target.value)} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "15px" }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Driver Cash payout (if applicable)</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-hand-holding-dollar form-icon"></i>
                  <input type="number" className="form-input" placeholder="0.00" value={srvDriverCash} onChange={(e) => setSrvDriverCash(e.target.value)} />
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <label className="form-label">Status</label>
                <div className="form-input-wrapper">
                  <select className="form-input form-select" value={srvStatus} onChange={(e) => setSrvStatus(e.target.value)}>
                    <option value="Pending">Pending Setup</option>
                    <option value="Active">Active / Confirmed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="form-label">Notes / Instructions</label>
              <textarea className="form-input" style={{ minHeight: "80px", padding: "10px 15px" }} placeholder="Provide internal guidelines, confirmation notes..." value={srvRemarks} onChange={(e) => setSrvRemarks(e.target.value)} />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button
                type="button"
                onClick={() => router.push(prefilledCustomerId ? `/company/customers/view?id=${prefilledCustomerId}` : `/company/customers`)}
                style={{ flex: 1, padding: "12px", borderRadius: "8px", background: "#f1f5f9", color: "#475569", border: "none", fontSize: "15px", fontWeight: "600", cursor: "pointer", textAlign: "center" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{ flex: 2, padding: "12px", borderRadius: "8px", background: GOLD_COLOR, color: "#ffffff", border: "none", fontSize: "15px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 6px -1px rgba(212, 175, 55, 0.2)" }}
              >
                <i className="fas fa-check"></i>
                <span>{submitting ? "Saving..." : "Save Service Details"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AddServicePage() {
  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <AddServicePageContent />
    </Suspense>
  );
}
