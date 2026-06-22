"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import CustomerSearchDropdown from "@/components/admin/CustomerSearchDropdown";

const mockHotels = [
  { id: "m1", name: "Makkah Clock Royal Tower (Fairmont)", city: "Makkah" },
  { id: "m2", name: "Pullman ZamZam Makkah", city: "Makkah" },
  { id: "m3", name: "Swissôtel Makkah", city: "Makkah" },
  { id: "m4", name: "Hilton Suites Makkah", city: "Makkah" },
  { id: "m5", name: "Anjum Hotel Makkah", city: "Makkah" },
  { id: "m6", name: "Oberoi Madinah", city: "Madinah" },
  { id: "m7", name: "Madinah Hilton", city: "Madinah" },
  { id: "m8", name: "Anwar Al Madinah Mövenpick", city: "Madinah" },
  { id: "m9", name: "Pullman Zamzam Madinah", city: "Madinah" },
  { id: "m10", name: "Dar Al Taqwa Hotel Madinah", city: "Madinah" },
  { id: "m11", name: "Jeddah Hilton", city: "Jeddah" },
  { id: "m12", name: "InterContinental Jeddah", city: "Jeddah" },
  { id: "m13", name: "Sheraton Jeddah Hotel", city: "Jeddah" },
  { id: "m14", name: "Rosewood Jeddah", city: "Jeddah" }
];

export default function AddHotel() {
  const router = useRouter();
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [hotelName, setHotelName] = useState("");
  const [hotelCity, setHotelCity] = useState("Makkah");
  const [hotelActive, setHotelActive] = useState(1);
  const [availableHotels, setAvailableHotels] = useState<any[]>([]);
  const [hotelId, setHotelId] = useState("");
  const [isCustomHotel, setIsCustomHotel] = useState(false);
  const [customHotelName, setCustomHotelName] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

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

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const data = await api.getHotels();
        if (data) {
          // Keep all hotels for dropdown options to extract unique hotel names
          setAvailableHotels(data);
        }
      } catch (err) {
        console.error("Failed to load hotels list:", err);
      }
    };
    fetchHotels();
  }, []);

  // Compute available properties for the selected city
  const cityHotels = useMemo(() => {
    // 1. Get all unique hotel names from database for the selected city
    const dbHotelNames = availableHotels
      .filter((h) => h.city?.toLowerCase() === hotelCity?.toLowerCase() && h.name)
      .map((h) => h.name.trim());

    // 2. Get static mock hotels for the selected city
    const mockHotelNames = mockHotels
      .filter((h) => h.city.toLowerCase() === hotelCity?.toLowerCase())
      .map((h) => h.name.trim());

    // 3. Merge them and deduplicate
    const allNames = Array.from(new Set([...dbHotelNames, ...mockHotelNames]));

    // 4. Map to options
    return allNames.map((name) => ({
      id: name,
      name: name
    }));
  }, [availableHotels, hotelCity]);

  const handleHotelSelect = (val: string) => {
    setHotelId(val);
    if (val === "custom") {
      setIsCustomHotel(true);
      setHotelName("");
    } else {
      setIsCustomHotel(false);
      setHotelName(val);
    }
  };

  const handleAddHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      showToast("Please select a customer first.", "error");
      return;
    }

    const finalHotelName = isCustomHotel ? customHotelName : hotelName;
    if (!finalHotelName.trim()) {
      showToast("Hotel name is required.", "error");
      return;
    }

    try {
      const payload = {
        customer_id: selectedCustomer.id,
        name: finalHotelName.trim(),
        city: hotelCity,
        active: hotelActive,
        check_in: checkIn || null,
        check_out: checkOut || null,
      };

      const res = await api.createHotel(payload);

      if (res && res.success) {
        showToast("Hotel added successfully!", "success");
        setHotelName("");
        setHotelId("");
        setCustomHotelName("");
        setIsCustomHotel(false);
        setHotelCity("Makkah");
        setHotelActive(1);
        setSelectedCustomer(null);
        setCheckIn("");
        setCheckOut("");
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
          <p>Register a new hotel accommodation to be available for bookings.</p>
        </div>
        <button onClick={() => router.push("/admin/hotels")} className="form-btn-back">
          <i className="fas fa-list"></i>
          <span>Hotels List</span>
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", width: "100%", padding: "10px 0" }}>
        <div className="form-card" style={{ maxWidth: "600px", width: "100%", background: "#ffffff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", padding: "30px", border: "1px solid #e2e8f0" }}>
          <form onSubmit={handleAddHotel} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Search Customer Dropdown Component */}
            <CustomerSearchDropdown
              selectedCustomer={selectedCustomer}
              onSelectCustomer={setSelectedCustomer}
              themeColor={HOTEL_PURPLE}
            />

            <div>
              <label className="form-label" style={{ color: "#475569", fontWeight: "600", fontSize: "13px" }}>City / Area *</label>
              <div className="form-input-wrapper" style={{ position: "relative" }}>
                <i className="fa-solid fa-city form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}></i>
                <select
                  className="form-input form-select"
                  value={hotelCity}
                  onChange={(e) => {
                    setHotelCity(e.target.value);
                    setHotelId("");
                    setHotelName("");
                  }}
                  style={{ paddingLeft: "42px", width: "100%" }}
                  required
                >
                  <option value="Makkah">Makkah Mukarramah</option>
                  <option value="Madinah">Madinah Munawwarah</option>
                  <option value="Jeddah">Jeddah</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ color: "#475569", fontWeight: "600", fontSize: "13px" }}>Hotel / Property Name *</label>
              <div className="form-input-wrapper" style={{ position: "relative", marginBottom: isCustomHotel ? "10px" : "0" }}>
                <i className="fa-solid fa-building-circle-check form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}></i>
                <select
                  className="form-input form-select"
                  value={hotelId}
                  onChange={(e) => handleHotelSelect(e.target.value)}
                  style={{ paddingLeft: "42px", width: "100%" }}
                  required
                >
                  <option value="">-- Select Hotel --</option>
                  {cityHotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                  <option value="custom">-- Other / Custom Hotel --</option>
                </select>
              </div>
              {isCustomHotel && (
                <div className="form-input-wrapper" style={{ position: "relative", marginTop: "10px" }}>
                  <i className="fa-solid fa-hotel form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}></i>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter custom hotel name..."
                    value={customHotelName}
                    onChange={(e) => setCustomHotelName(e.target.value)}
                    style={{ paddingLeft: "42px", width: "100%" }}
                    required
                  />
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label className="form-label" style={{ color: "#475569", fontWeight: "600", fontSize: "13px" }}>Check-In Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  style={{ width: "100%", paddingLeft: "12px" }}
                />
              </div>
              <div>
                <label className="form-label" style={{ color: "#475569", fontWeight: "600", fontSize: "13px" }}>Check-Out Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  style={{ width: "100%", paddingLeft: "12px" }}
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
                <span>Save</span>
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
