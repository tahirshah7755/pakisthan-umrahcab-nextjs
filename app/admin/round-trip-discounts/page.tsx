"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetSettingsQuery, useUpdateSettingsMutation } from "@/store/api/settingsApi";

export default function RoundTripDiscountsPage() {
  const router = useRouter();

  // RTK Query hooks
  const { data: settings, isLoading } = useGetSettingsQuery(undefined);
  const [updateSettings, { isLoading: isUpdating }] = useUpdateSettingsMutation();

  // Form states
  const [minLegs, setMinLegs] = useState("2");
  const [discountPct, setDiscountPct] = useState("5");

  // Sync state with fetched settings
  useEffect(() => {
    if (settings) {
      if (settings.round_trip_min_legs) {
        setMinLegs(settings.round_trip_min_legs);
      }
      if (settings.round_trip_discount_pct) {
        setDiscountPct(settings.round_trip_discount_pct);
      }
    }
  }, [settings]);

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

  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings([
        { key: "round_trip_min_legs", value: minLegs },
        { key: "round_trip_discount_pct", value: discountPct }
      ]).unwrap();
      
      showToast("Discount rate configuration updated successfully!", "success");
    } catch (err: any) {
      console.error(err);
      showToast("Failed to update discount settings.", "error");
    }
  };

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

      {/* Header Card */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #15803d 0%, #16a34a 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Round Trip Discount Rates</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Configure percentage or fixed discount offsets dynamically triggered for multi-leg bookings.</p>
        </div>
        <button 
          onClick={() => router.push("/admin/hub")} 
          style={{ background: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", padding: "10px 18px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <i className="fas fa-arrow-left"></i>
          <span>Back to Hub</span>
        </button>
      </div>

      {/* Form Card */}
      <div className="form-card" style={{ background: "#ffffff", padding: "35px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
            <div className="spinner" style={{ borderTopColor: "#16a34a" }}></div>
            <span style={{ marginLeft: "12px", color: "#64748b", fontWeight: "600" }}>Loading Discount Settings...</span>
          </div>
        ) : (
          <form onSubmit={handleSaveDiscount} style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Minimum Legs Trigger *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-arrows-spin form-icon" style={{ color: "#16a34a" }}></i>
                  <input 
                    type="number"
                    className="form-input" 
                    placeholder="e.g. 2"
                    value={minLegs}
                    onChange={(e) => setMinLegs(e.target.value)}
                    min={2}
                    required 
                    style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Discount Percentage (%) *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-percent form-icon" style={{ color: "#16a34a" }}></i>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 5" 
                    value={discountPct} 
                    onChange={(e) => setDiscountPct(e.target.value)}
                    min={0}
                    max={100}
                    required 
                    style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: "15px" }}>
              <button 
                type="submit" 
                disabled={isUpdating}
                className="btn-submit" 
                style={{ 
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", width: "100%", 
                  background: "#15803d", height: "50px", fontWeight: "600", fontSize: "15px", border: "none", borderRadius: "6px", color: "#ffffff", cursor: "pointer" 
                }}
              >
                <i className="fas fa-floppy-disk"></i>
                <span>{isUpdating ? "Saving Configuration..." : "Save Discount Settings"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
