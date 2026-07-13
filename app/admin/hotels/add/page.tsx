"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";

const DEFAULT_CITIES = ["Makkah", "Madinah", "Jeddah", "Taif", "Riyadh", "Yanbu"];

export default function AddHotelDirectory() {
  const router = useRouter();
  const [hotelName, setHotelName] = useState("");
  const [hotelCitySelect, setHotelCitySelect] = useState("Makkah");
  const [customCity, setCustomCity] = useState("");
  const [hotelActive, setHotelActive] = useState(1);
  const [directoryHotels, setDirectoryHotels] = useState<any[]>([]);

  useEffect(() => {
    const fetchDirectoryHotels = async () => {
      try {
        const data = await api.getHotels(undefined, undefined, "directory");
        if (data) {
          setDirectoryHotels(data);
        }
      } catch (err) {
        console.error("Failed to load directory hotels list:", err);
      }
    };
    fetchDirectoryHotels();
  }, []);

  const dynamicCities = useMemo(() => {
    const dbCities = directoryHotels.map((h) => h.city).filter(Boolean);
    const combined = Array.from(new Set([...DEFAULT_CITIES, ...dbCities]));
    return combined.sort((a, b) => {
      if (a === "Makkah" || a === "Madinah") return -1;
      if (b === "Makkah" || b === "Madinah") return 1;
      return a.localeCompare(b);
    });
  }, [directoryHotels]);

  // Toast notifications
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleAddHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelName.trim()) {
      showToast("Hotel name is required.", "error");
      return;
    }

    const city = hotelCitySelect === "CUSTOM" ? customCity.trim() : hotelCitySelect;
    if (!city) {
      showToast("City/Area is required.", "error");
      return;
    }

    try {
      const payload = {
        customer_id: null,
        name: hotelName.trim(),
        city: city,
        active: hotelActive,
        check_in: null,
        check_out: null,
      };

      const res = await api.createHotel(payload);

      if (res && res.success) {
        showToast("Hotel property registered in directory successfully!", "success");
        setHotelName("");
        setCustomCity("");
        setTimeout(() => {
          router.push("/admin/hotels");
        }, 1500);
      } else {
        showToast(res?.error || "Failed to save hotel.", "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast("An error occurred while saving.", "error");
    }
  };

  const HOTEL_PURPLE = "#7c3aed";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Toast Alert */}
      {toast.show && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 9999,
          background: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "#ffffff",
          padding: "12px 24px",
          borderRadius: "8px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          fontWeight: "600",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          animation: "slideIn 0.3s ease-out"
        }}>
          <i className={toast.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"}></i>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4338ca 100%)" }}>
        <div>
          <h2>Add Hotel Property</h2>
          <p>Register a new hotel accommodation globally in the system lookup directory.</p>
        </div>
        <button onClick={() => router.push("/admin/hotels")} className="form-btn-back">
          <i className="fas fa-list"></i>
          <span>Hotel Directory</span>
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", width: "100%", padding: "10px 0" }}>
        <div className="form-card" style={{ maxWidth: "600px", width: "100%", background: "#ffffff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", padding: "30px", border: "1px solid #e2e8f0" }}>
          <form onSubmit={handleAddHotel} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            <div>
              <label className="form-label" style={{ color: "#475569", fontWeight: "600", fontSize: "13px" }}>City / Area *</label>
              <div className="form-input-wrapper" style={{ position: "relative" }}>
                <i className="fa-solid fa-city form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}></i>
                <select
                  className="form-input form-select"
                  value={hotelCitySelect}
                  onChange={(e) => setHotelCitySelect(e.target.value)}
                  style={{ paddingLeft: "42px", width: "100%" }}
                  required
                >
                  {dynamicCities.map(city => (
                    <option key={city} value={city}>{city === "Makkah" ? "Makkah Mukarramah" : city === "Madinah" ? "Madinah Munawwarah" : city}</option>
                  ))}
                  <option value="CUSTOM">Other (Type custom city...)</option>
                </select>
              </div>
              {hotelCitySelect === "CUSTOM" && (
                <div style={{ position: "relative", marginTop: "8px" }}>
                  <i className="fa-solid fa-map-pin form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", zIndex: 5 }}></i>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter custom city/area name..."
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    style={{ paddingLeft: "42px", width: "100%" }}
                    required
                  />
                </div>
              )}
            </div>

            <div>
              <label className="form-label" style={{ color: "#475569", fontWeight: "600", fontSize: "13px" }}>Hotel / Property Name *</label>
              <div className="form-input-wrapper" style={{ position: "relative" }}>
                <i className="fa-solid fa-hotel form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}></i>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter hotel name (e.g. Makkah Clock Royal Tower)..."
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  style={{ paddingLeft: "42px", width: "100%" }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ color: "#475569", fontWeight: "600", fontSize: "13px" }}>Status *</label>
              <div className="form-input-wrapper" style={{ position: "relative" }}>
                <i className="fa-solid fa-circle-info form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}></i>
                <select
                  className="form-input form-select"
                  value={hotelActive}
                  onChange={(e) => setHotelActive(Number(e.target.value))}
                  style={{ paddingLeft: "42px", width: "100%" }}
                  required
                >
                  <option value={1}>Active Property</option>
                  <option value={0}>Inactive Property</option>
                </select>
              </div>
            </div>

            {/* Form Actions */}
            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button
                type="button"
                onClick={() => router.push("/admin/hotels")}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "8px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  textAlign: "center"
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  flex: 2,
                  padding: "12px",
                  borderRadius: "8px",
                  background: HOTEL_PURPLE,
                  color: "#ffffff",
                  border: "none",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: `0 4px 6px -1px rgba(124, 58, 237, 0.2)`
                }}
              >
                <i className="fas fa-check"></i>
                <span>Save Property</span>
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
