"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
const DEFAULT_CITIES = ["Makkah", "Madinah", "Jeddah", "Taif", "Riyadh", "Yanbu"];

function EditHotelAssignmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [hotelName, setHotelName] = useState("");
  const [hotelCity, setHotelCity] = useState("Makkah");
  const [customCity, setCustomCity] = useState("");
  const [hotelActive, setHotelActive] = useState(1);
  const [directoryHotels, setDirectoryHotels] = useState<any[]>([]);
  const [hotelId, setHotelId] = useState("");
  const [isCustomHotel, setIsCustomHotel] = useState(false);
  const [customHotelName, setCustomHotelName] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [originalCheckIn, setOriginalCheckIn] = useState("");
  const [originalCheckOut, setOriginalCheckOut] = useState("");
  const [customId, setCustomId] = useState("");

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

  // Compute available properties for the selected city from both directory and mock list
  const cityHotels = useMemo(() => {
    const activeCity = hotelCity === "CUSTOM" ? customCity : hotelCity;
    if (!activeCity) return [];

    const dbHotelNames = directoryHotels
      .filter((h) => h.city?.toLowerCase() === activeCity.toLowerCase() && h.name)
      .map((h) => h.name.trim());

    const mockHotelNames = mockHotels
      .filter((h) => h.city.toLowerCase() === activeCity.toLowerCase())
      .map((h) => h.name.trim());

    const allNames = Array.from(new Set([...dbHotelNames, ...mockHotelNames]));

    return allNames.map((name) => ({
      id: name,
      name: name
    }));
  }, [directoryHotels, hotelCity, customCity]);

  // Fetch the assignment details and pre-populate the form
  useEffect(() => {
    if (!queryId) {
      setError("No Hotel Assignment ID provided.");
      setLoading(false);
      return;
    }

    const fetchAssignment = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.getHotel(queryId);
        if (res && res.success && res.data) {
          const h = res.data;
          setHotelName(h.name || "");
          
          if (DEFAULT_CITIES.includes(h.city)) {
            setHotelCity(h.city);
            setCustomCity("");
          } else {
            setHotelCity("CUSTOM");
            setCustomCity(h.city || "");
          }

          setHotelActive(h.active);
          setCheckIn(h.check_in || "");
          setCheckOut(h.check_out || "");
          setOriginalCheckIn(h.check_in || "");
          setOriginalCheckOut(h.check_out || "");
          setCustomId(h.custom_id || "");

          // Load customer details
          if (h.customer_id) {
            const cRes = await api.getCustomer(h.customer_id);
            if (cRes && cRes.customer) {
              setSelectedCustomer(cRes.customer);
            }
          }
        } else {
          setError("Failed to load assignment details.");
        }
      } catch (err: any) {
        console.error("Failed to load assignment details:", err);
        setError(err.message || "An error occurred while loading assignment.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [queryId]);

  // Set selected hotel property select value after hotelCity/name/directoryHotels are set
  useEffect(() => {
    if (!loading && hotelName) {
      const matched = cityHotels.find((h) => h.name.toLowerCase() === hotelName.toLowerCase());
      if (matched) {
        setHotelId(matched.name);
        setIsCustomHotel(false);
      } else {
        setHotelId("custom");
        setIsCustomHotel(true);
        setCustomHotelName(hotelName);
      }
    }
  }, [loading, directoryHotels, hotelCity, customCity, hotelName, cityHotels]);

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

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      showToast("Customer is required.", "error");
      return;
    }
    if (!queryId) return;

    const todayStr = new Date().toISOString().split("T")[0];
    const minCheckIn = originalCheckIn && originalCheckIn < todayStr ? originalCheckIn : todayStr;
    const minCheckOut = originalCheckOut && originalCheckOut < todayStr ? originalCheckOut : todayStr;

    if (checkIn && checkIn < minCheckIn) {
      showToast("Check-in date cannot be in the past.", "error");
      return;
    }
    if (checkOut && checkOut < minCheckOut) {
      showToast("Check-out date cannot be in the past.", "error");
      return;
    }

    const finalHotelName = isCustomHotel ? customHotelName : hotelName;
    if (!finalHotelName.trim()) {
      showToast("Hotel property selection or name is required.", "error");
      return;
    }

    const city = hotelCity === "CUSTOM" ? customCity.trim() : hotelCity;
    if (!city) {
      showToast("City/Area is required.", "error");
      return;
    }

    try {
      const payload = {
        customer_id: selectedCustomer.id,
        name: finalHotelName.trim(),
        city: city,
        active: hotelActive,
        check_in: checkIn || null,
        check_out: checkOut || null,
      };

      const res = await api.updateHotel(queryId, payload);

      if (res && res.success) {
        showToast("Hotel assignment updated successfully!", "success");
        setTimeout(() => {
          router.push(selectedCustomer?.id ? `/admin/customers/view?id=${selectedCustomer.id}` : "/admin/hotels/assignments");
        }, 1500);
      } else {
        showToast(res?.error || "Failed to update assignment.", "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast("An error occurred while saving.", "error");
    }
  };

  const GOLD_COLOR = "#b48a1d";

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="form-header-card" style={{ background: "linear-gradient(135deg, #b48a1d 0%, #8c6b12 100%)" }}>
          <div>
            <h2>Edit Hotel Assignment</h2>
            <p>Update check-in/out details for customer stay.</p>
          </div>
          <button onClick={() => router.push(selectedCustomer?.id ? `/admin/customers/view?id=${selectedCustomer.id}` : "/admin/hotels/assignments")} className="form-btn-back">
            <i className="fas fa-arrow-left"></i>
            <span>Back</span>
          </button>
        </div>
        <div className="form-card" style={{ textAlign: "center", padding: "40px", color: "#64748b", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: "40px", color: GOLD_COLOR, marginBottom: "15px" }}></i>
          <h3>Loading assignment details...</h3>
        </div>
      </div>
    );
  }

  if (error || !queryId) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="form-header-card" style={{ background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)" }}>
          <div>
            <h2>Edit Assignment Error</h2>
            <p>{error || "Assignment details could not be found."}</p>
          </div>
          <button onClick={() => router.push("/admin/hotels/assignments")} className="form-btn-back">
            <i className="fas fa-list"></i>
            <span>Assignments List</span>
          </button>
        </div>
        <div className="form-card" style={{ textAlign: "center", padding: "40px", color: "#64748b", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <i className="fas fa-circle-exclamation" style={{ fontSize: "48px", color: "#ef4444", marginBottom: "15px" }}></i>
          <h3>Unable to retrieve assignment details</h3>
          <p>{error || "The assignment may have been deleted, or there was a communication issue with the server."}</p>
          <button onClick={() => router.push("/admin/hotels/assignments")} className="btn-submit" style={{ marginTop: "15px", background: GOLD_COLOR, color: "#ffffff" }}>
            Return to Assignments
          </button>
        </div>
      </div>
    );
  }

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

      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #b48a1d 0%, #8c6b12 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>Edit Hotel Assignment: {customId || `#ASG-${queryId}`}</h2>
          <p>Modify check-in and check-out tracking dates for customer hotel stay.</p>
        </div>
        <button onClick={() => router.push(selectedCustomer?.id ? `/admin/customers/view?id=${selectedCustomer.id}` : "/admin/hotels/assignments")} className="form-btn-back">
          <i className="fas fa-arrow-left"></i>
          <span>Back</span>
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", width: "100%", padding: "10px 0" }}>
        <div className="form-card" style={{ maxWidth: "650px", width: "100%", background: "#ffffff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", padding: "30px", border: "1px solid #e2e8f0" }}>
          <form onSubmit={handleUpdateAssignment} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Search Customer Dropdown Component */}
            <CustomerSearchDropdown
              selectedCustomer={selectedCustomer}
              onSelectCustomer={setSelectedCustomer}
              themeColor={GOLD_COLOR}
              disabled={true}
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
                  {dynamicCities.map(city => (
                    <option key={city} value={city}>{city === "Makkah" ? "Makkah Mukarramah" : city === "Madinah" ? "Madinah Munawwarah" : city}</option>
                  ))}
                  <option value="CUSTOM">Other (Type custom city...)</option>
                </select>
              </div>
              {hotelCity === "CUSTOM" && (
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
                  min={originalCheckIn && originalCheckIn < new Date().toISOString().split("T")[0] ? originalCheckIn : new Date().toISOString().split("T")[0]}
                  style={{
                    width: "100%",
                    paddingLeft: "12px",
                    borderColor: checkIn && checkIn < (originalCheckIn && originalCheckIn < new Date().toISOString().split("T")[0] ? originalCheckIn : new Date().toISOString().split("T")[0]) ? "#ef4444" : undefined
                  }}
                />
                {checkIn && checkIn < (originalCheckIn && originalCheckIn < new Date().toISOString().split("T")[0] ? originalCheckIn : new Date().toISOString().split("T")[0]) && (
                  <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>
                    ⚠️ Past dates are not allowed.
                  </span>
                )}
              </div>
              <div>
                <label className="form-label" style={{ color: "#475569", fontWeight: "600", fontSize: "13px" }}>Check-Out Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || (originalCheckOut && originalCheckOut < new Date().toISOString().split("T")[0] ? originalCheckOut : new Date().toISOString().split("T")[0])}
                  style={{
                    width: "100%",
                    paddingLeft: "12px",
                    borderColor: checkOut && checkOut < (checkIn || (originalCheckOut && originalCheckOut < new Date().toISOString().split("T")[0] ? originalCheckOut : new Date().toISOString().split("T")[0])) ? "#ef4444" : undefined
                  }}
                />
                {checkOut && checkOut < (checkIn || (originalCheckOut && originalCheckOut < new Date().toISOString().split("T")[0] ? originalCheckOut : new Date().toISOString().split("T")[0])) && (
                  <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>
                    ⚠️ Past dates are not allowed.
                  </span>
                )}
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
                onClick={() => router.push("/admin/hotels/assignments")}
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
                  background: GOLD_COLOR,
                  color: "#ffffff",
                  border: "none",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: `0 4px 6px -1px rgba(180, 138, 29, 0.2)`
                }}
              >
                <i className="fas fa-save"></i>
                <span>Save Changes</span>
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

export default function EditHotelAssignmentPage() {
  return (
    <Suspense fallback={<div>Loading assignment editing layout...</div>}>
      <EditHotelAssignmentContent />
    </Suspense>
  );
}
