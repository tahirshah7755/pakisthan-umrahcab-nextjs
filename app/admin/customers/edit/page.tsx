"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, getDefaultPhoneCode, formatPhoneNumber, parsePhoneAndCode } from "@/utils/api";
import { CountryCodeSelector } from "@/components/CountryCodeSelector";

function EditCustomerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetId = searchParams.get("id") || "";

  // Form states
  const [custName, setCustName] = useState("");
  const [custCompany, setCustCompany] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custPhoneCode, setCustPhoneCode] = useState("+966");
  const [custSecondaryPhone, setCustSecondaryPhone] = useState("");
  const [custSecondaryPhoneCode, setCustSecondaryPhoneCode] = useState("+966");
  const [custAltPhone, setCustAltPhone] = useState("");
  const [custAltPhoneCode, setCustAltPhoneCode] = useState("+966");
  const [custEmail, setCustEmail] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [hotelInfo, setHotelInfo] = useState("");
  const [notes, setNotes] = useState("");

  const [requireHotel, setRequireHotel] = useState(false);
  const [hotelCity, setHotelCity] = useState("Makkah");
  const [hotelId, setHotelId] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [hotelCheckin, setHotelCheckin] = useState("");
  const [hotelCheckout, setHotelCheckout] = useState("");
  const [availableHotels, setAvailableHotels] = useState<any[]>([]);

  const DEFAULT_CITIES = ["Makkah", "Madinah", "Jeddah", "Taif", "Riyadh", "Yanbu"];

  const dynamicCities = React.useMemo(() => {
    const dbCities = availableHotels.map((h) => h.city).filter(Boolean);
    const combined = Array.from(new Set([...DEFAULT_CITIES, ...dbCities]));
    return combined.sort((a, b) => {
      if (a === "Makkah" || a === "Madinah") return -1;
      if (b === "Makkah" || b === "Madinah") return 1;
      return a.localeCompare(b);
    });
  }, [availableHotels]);

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

  const parseHotelInfo = (info: string) => {
    if (!info) return { name: "", city: "", checkin: "", checkout: "" };
    const regex = /^(.*) in (Makkah|Madinah|Jeddah) \(In: ([\d-]+), Out: ([\d-]+)\)$/i;
    const match = info.match(regex);
    if (match) {
      return {
        name: match[1].trim(),
        city: match[2].trim(),
        checkin: match[3].trim(),
        checkout: match[4].trim()
      };
    }
    return { name: info, city: "", checkin: "", checkout: "" };
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        if (!targetId) return;

        // Fetch hotels list
        const hotelsData = await api.getHotels();
        if (hotelsData) {
          setAvailableHotels(hotelsData);
        }

        // Fetch customer profile
        const result = await api.getCustomer(targetId);
        const found = result?.customer || result;

        if (found) {
          const defaultCode = getDefaultPhoneCode(found);
          
          const parsedPrimary = parsePhoneAndCode(found.phone || "", defaultCode);
          setCustPhoneCode(parsedPrimary.code);
          setCustPhone(parsedPrimary.number);

          const parsedSecondary = parsePhoneAndCode(found.secondary_phone || "", defaultCode);
          setCustSecondaryPhoneCode(parsedSecondary.code);
          setCustSecondaryPhone(parsedSecondary.number);

          const parsedAlt = parsePhoneAndCode(found.alternative_phone || "", defaultCode);
          setCustAltPhoneCode(parsedAlt.code);
          setCustAltPhone(parsedAlt.number);

          setCustName(found.name || "");
          setCustCompany(found.company || "");
          setCustEmail(found.email || "");
          setPassportNo(found.passport_no || "");
          setNotes(found.notes || "");
          
          const rawHotelInfo = found.hotel_info || "";
          setHotelInfo(rawHotelInfo);

          if (rawHotelInfo) {
            const parsed = parseHotelInfo(rawHotelInfo);
            setHotelCity(parsed.city || "Makkah");
            setHotelName(parsed.name);
            setHotelCheckin(parsed.checkin);
            setHotelCheckout(parsed.checkout);
            setRequireHotel(true);

            if (hotelsData && parsed.name) {
              const matched = hotelsData.find(
                (h: any) =>
                  (h.name || h.hotel_name)?.toLowerCase() === parsed.name.toLowerCase()
              );
              if (matched) {
                setHotelId(String(matched.id));
              }
            }
          }
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
      let compiledHotelInfo = "";
      if (requireHotel) {
        if (!hotelCity || !hotelCheckin || !hotelCheckout) {
          showToast("Please fill all required hotel fields", "error");
          return;
        }
        let nameToUse = hotelName;
        if (hotelId) {
          const selectedH = availableHotels.find((h) => String(h.id) === String(hotelId));
          if (selectedH) {
            nameToUse = selectedH.name || selectedH.hotel_name;
          }
        } else {
          showToast("Please select a hotel property", "error");
          return;
        }
        compiledHotelInfo = `${nameToUse} in ${hotelCity} (In: ${hotelCheckin}, Out: ${hotelCheckout})`;
      }

      const formattedPrimary = formatPhoneNumber(custPhoneCode, custPhone);
      const formattedSecondary = formatPhoneNumber(custSecondaryPhoneCode, custSecondaryPhone);
      const formattedAlt = formatPhoneNumber(custAltPhoneCode, custAltPhone);

      const updated = {
        name: custName,
        company: custCompany,
        phone: formattedPrimary || "",
        secondary_phone: formattedSecondary || "",
        alternative_phone: formattedAlt || "",
        email: custEmail || "",
        passport_no: passportNo || "",
        hotel_info: compiledHotelInfo,
        notes: notes || "",
        contact: "" // Allow controller to auto-compile formatted contact field
      };
      
      const response = await api.updateCustomer(targetId, updated);
      if (response && response.success) {
        // Also update or create the hotel record referencing this customer in uc_hotels
        try {
          if (requireHotel) {
            let nameToUse = hotelName;
            if (hotelId) {
              const selectedH = availableHotels.find((h) => String(h.id) === String(hotelId));
              if (selectedH) {
                nameToUse = selectedH.name || selectedH.hotel_name;
              }
            }
            const existingHotels = await api.getHotels();
            const existingCustomerHotel = existingHotels.find(
              (h: any) => h.customer_id === Number(targetId)
            );

            const hotelPayload = {
              customer_id: Number(targetId),
              name: nameToUse,
              city: hotelCity,
              active: 1
            };

            if (existingCustomerHotel) {
              await api.updateHotel(existingCustomerHotel.id, hotelPayload);
            } else {
              await api.createHotel(hotelPayload);
            }
          } else {
            const existingHotels = await api.getHotels();
            const existingCustomerHotel = existingHotels.find(
              (h: any) => h.customer_id === Number(targetId)
            );
            if (existingCustomerHotel) {
              await api.deleteHotel(existingCustomerHotel.id);
            }
          }
        } catch (hotelErr) {
          console.error("Failed to sync customer hotel record:", hotelErr);
        }

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
              <div style={{ display: "flex", gap: "8px" }}>
                <CountryCodeSelector
                  value={custPhoneCode}
                  onChange={setCustPhoneCode}
                  style={{ width: "130px", flexShrink: 0 }}
                />
                <div className="form-input-wrapper" style={{ flexGrow: 1 }}>
                  <i className="fas fa-phone form-icon" style={{ color: "#0f766e" }}></i>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 501234567" 
                    value={custPhone} 
                    onChange={(e) => setCustPhone(e.target.value)} 
                    required
                    style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Secondary Phone</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <CountryCodeSelector
                  value={custSecondaryPhoneCode}
                  onChange={setCustSecondaryPhoneCode}
                  style={{ width: "130px", flexShrink: 0 }}
                />
                <div className="form-input-wrapper" style={{ flexGrow: 1 }}>
                  <i className="fas fa-phone-volume form-icon" style={{ color: "#0f766e" }}></i>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 501234568" 
                    value={custSecondaryPhone} 
                    onChange={(e) => setCustSecondaryPhone(e.target.value)} 
                    style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Alternative Phone</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <CountryCodeSelector
                  value={custAltPhoneCode}
                  onChange={setCustAltPhoneCode}
                  style={{ width: "130px", flexShrink: 0 }}
                />
                <div className="form-input-wrapper" style={{ flexGrow: 1 }}>
                  <i className="fas fa-phone-flip form-icon" style={{ color: "#0f766e" }}></i>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 3001234567" 
                    value={custAltPhone} 
                    onChange={(e) => setCustAltPhone(e.target.value)} 
                    style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                  />
                </div>
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
                  placeholder="e.g. A1234567" 
                  value={passportNo}
                  onChange={(e) => setPassportNo(e.target.value)}
                  style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                />
              </div>
            </div>
          </div>

          {/* Hotel Stay info */}
          <div style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", background: "#f8fafc" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "15px" }}>
              <span style={{ fontWeight: "700", color: "#334155", fontSize: "14px" }}>
                <i className="fas fa-hotel" style={{ marginRight: "8px", color: "#0f766e" }}></i> Include Hotel Reservation?
              </span>
              <label className="switch" style={{ position: "relative", display: "inline-block", width: "44px", height: "24px" }}>
                <input
                  type="checkbox"
                  checked={requireHotel}
                  onChange={(e) => setRequireHotel(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span className="slider" style={{
                  position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: requireHotel ? "#0f766e" : "#ccc", transition: ".4s", borderRadius: "24px"
                }}>
                  <span style={{
                    position: "absolute", content: '""', height: "16px", width: "16px", left: "4px", bottom: "4px",
                    backgroundColor: "white", transition: ".4s", borderRadius: "50%",
                    transform: requireHotel ? "translateX(20px)" : "none"
                  }}></span>
                </span>
              </label>
            </div>

            {requireHotel && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "15px" }}>
                <div>
                  <label className="form-label" style={{ fontWeight: "600", color: "#475569", display: "block", marginBottom: "8px", fontSize: "13px" }}>Select Destination Area/City *</label>
                  <div className="form-input-wrapper">
                    <i className="fa-solid fa-city form-icon" style={{ color: "#0f766e" }}></i>
                    <select
                      className="form-input form-select"
                      value={hotelCity}
                      onChange={(e) => {
                        setHotelCity(e.target.value);
                        setHotelId("");
                      }}
                      style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px", paddingLeft: "45px" }}
                      required={requireHotel}
                    >
                      <option value="">-- Choose City --</option>
                      {dynamicCities.map(city => (
                        <option key={city} value={city}>{city === "Makkah" ? "Makkah Mukarramah" : city === "Madinah" ? "Madinah Munawwarah" : city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: "600", color: "#475569", display: "block", marginBottom: "8px", fontSize: "13px" }}>Available Property / Hotel *</label>
                  <div className="form-input-wrapper">
                    <i className="fa-solid fa-building-circle-check form-icon" style={{ color: "#0f766e" }}></i>
                    <select
                      className="form-input form-select"
                      value={hotelId}
                      onChange={(e) => setHotelId(e.target.value)}
                      style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px", paddingLeft: "45px" }}
                      required={requireHotel}
                    >
                      <option value="">-- Select Hotel --</option>
                      {availableHotels
                        .filter((h) => h.city.toLowerCase() === hotelCity.toLowerCase())
                        .map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name || h.hotel_name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: "600", color: "#475569", display: "block", marginBottom: "8px", fontSize: "13px" }}>Check-In Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={hotelCheckin}
                    onChange={(e) => setHotelCheckin(e.target.value)}
                    style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px", paddingLeft: "15px" }}
                    required={requireHotel}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: "600", color: "#475569", display: "block", marginBottom: "8px", fontSize: "13px" }}>Check-Out Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={hotelCheckout}
                    onChange={(e) => setHotelCheckout(e.target.value)}
                    style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px", paddingLeft: "15px" }}
                    required={requireHotel}
                  />
                </div>
              </div>
            )}
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
            <button 
              type="submit" 
              style={{ background: "#0f766e", color: "#ffffff", border: "none", borderRadius: "8px", padding: "14px 28px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", width: "100%", justifyContent: "center", fontSize: "16px" }}
            >
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
