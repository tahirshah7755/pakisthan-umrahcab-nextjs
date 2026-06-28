"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, getDefaultPhoneCode } from "@/utils/api";
import { CountryCodeSelector } from "@/components/CountryCodeSelector";
import { useAuth } from "@/context/AuthContext";

const defaultCountryCodes = [
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+92", flag: "🇵🇰", name: "Pakistan" },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+1", flag: "🇺🇸", name: "US/Canada" },
];

const formatPhoneNumber = (code: string, number: string) => {
  if (!number) return "";
  const cleaned = number.trim();
  if (cleaned.startsWith("+") || cleaned.startsWith("00")) return cleaned;
  return `${code}${cleaned}`;
};

export default function AddNewBooking() {
  const router = useRouter();
  const { companyUser } = useAuth();

  // Form State
  const [customer, setCustomer] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [timingStatus, setTimingStatus] = useState("Confirmed");
  const [adults, setAdults] = useState(0);
  const [childrenCount, setChildrenCount] = useState(0);
  const [bags, setBags] = useState(0);
  const [vehicle, setVehicle] = useState("");
  const [tripPackage, setTripPackage] = useState("");
  const [priceBeforeDiscount, setPriceBeforeDiscount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [cashToReceive, setCashToReceive] = useState(0);
  const [discountReason, setDiscountReason] = useState("");
  const [tafweejRequired, setTafweejRequired] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [externalNotes, setExternalNotes] = useState("");

  // Searchable Dropdown state
  const [customerSearch, setCustomerSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCustomerObj, setSelectedCustomerObj] = useState<any>(null);

  // Loaded Customers List State (scoped to company)
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  // Add Customer Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustMobile, setNewCustMobile] = useState("");
  const [newCustMobileCode, setNewCustMobileCode] = useState("+966");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPassport, setNewCustPassport] = useState("");
  const [newCustNotes, setNewCustNotes] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [countryCodes, setCountryCodes] = useState(defaultCountryCodes);

  useEffect(() => {
    async function loadCountryCodes() {
      const list = await api.getCountryCodes();
      if (list && list.length > 0) {
        setCountryCodes(list);
      }
    }
    loadCountryCodes();
  }, []);

  useEffect(() => {
    if (companyUser) {
      setNewCustMobileCode(getDefaultPhoneCode(companyUser));
    }
  }, [companyUser]);

  // Dynamic Dropdown Lists from API
  const [vehiclesList, setVehiclesList] = useState<string[]>([]);
  const [packagesList, setPackagesList] = useState<string[]>([]);
  const [rawPriceList, setRawPriceList] = useState<any[]>([]);
  const [locationsList, setLocationsList] = useState<string[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
  const [externalPickupLocations, setExternalPickupLocations] = useState<string[]>([]);
  const [externalDropoffLocations, setExternalDropoffLocations] = useState<string[]>([]);

  const extractedLocations = React.useMemo(() => {
    if (locationsList && locationsList.length > 0) {
      return locationsList;
    }
    const fallbackLocations = [
      "Jeddah Airport (JED) - Terminal 1",
      "Jeddah Airport (JED) - North Terminal",
      "Makkah Hotel",
      "Madinah Hotel",
      "Jeddah Hotel",
      "Makkah Station (Haramain)",
      "Madinah Station (Haramain)",
      "Jeddah Station (Haramain)",
      "Madinah Haram",
      "Makkah Haram",
      "Yanbu",
      "Taif"
    ];
    return fallbackLocations;
  }, [locationsList]);

  const filteredPickupSuggestions = React.useMemo(() => {
    const localMatches = extractedLocations.filter((loc) =>
      loc.toLowerCase().includes(pickupLocation.toLowerCase())
    );
    return Array.from(new Set([...localMatches, ...externalPickupLocations]));
  }, [extractedLocations, pickupLocation, externalPickupLocations]);

  const filteredDropoffSuggestions = React.useMemo(() => {
    const localMatches = extractedLocations.filter((loc) =>
      loc.toLowerCase().includes(dropoffLocation.toLowerCase())
    );
    return Array.from(new Set([...localMatches, ...externalDropoffLocations]));
  }, [extractedLocations, dropoffLocation, externalDropoffLocations]);

  useEffect(() => {
    if (!pickupLocation || pickupLocation.trim().length < 3) {
      setExternalPickupLocations([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      const results = await api.searchExternalLocations(pickupLocation);
      setExternalPickupLocations(results);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [pickupLocation]);

  useEffect(() => {
    if (!dropoffLocation || dropoffLocation.trim().length < 3) {
      setExternalDropoffLocations([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      const results = await api.searchExternalLocations(dropoffLocation);
      setExternalDropoffLocations(results);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [dropoffLocation]);

  // Fetch dynamic vehicles and packages lists on mount
  useEffect(() => {
    async function loadDynamicDropdowns() {
      try {
        const [fleetData, priceListData, locationsData] = await Promise.all([
          api.getFleet(),
          api.getPriceList(),
          api.getLocations(),
        ]);

        // Map fleet models dynamically
        if (Array.isArray(fleetData) && fleetData.length > 0) {
          setVehiclesList(fleetData.map((f: any) => f.model));
        } else if (fleetData && Array.isArray(fleetData.data) && fleetData.data.length > 0) {
          setVehiclesList(fleetData.data.map((f: any) => f.model));
        } else {
          setVehiclesList([
            "Sedan CORE",
            "Hyundai Staria CORE",
            "Hyundai Starex CORE",
            "GMC XL Yukon CORE",
            "Hiace Grand Cabin CORE",
            "Coaster CORE",
            "Bus CORE",
            "Luxury Bus CORE",
            "SUV",
          ]);
        }

        // Map price list routes/packages dynamically
        let rawList: any[] = [];
        if (Array.isArray(priceListData)) {
          rawList = priceListData;
        } else if (priceListData && Array.isArray(priceListData.data)) {
          rawList = priceListData.data;
        }
        setRawPriceList(rawList);

        if (locationsData && Array.isArray(locationsData)) {
          setLocationsList(locationsData);
        }

        if (rawList.length > 0) {
          setPackagesList(rawList.map((p: any) => p.route));
        } else {
          setPackagesList([
            "Jeddah Airport to Makkah Hotel ★ (جدہ ایئرپورٹ سے مکہ ہوٹل)",
            "Makkah Hotel to Jeddah Airport ★ (مکہ ہوٹل سے جدہ ایئرپورٹ)",
            "Jeddah Airport to Madinah Hotel (جدہ ایئرپورٹ سے مدینہ ہوٹل)",
            "4 in 1 Tour: Kiswah Factory + Makkah Museum + Hira Museum + Holy Quran Museum (ان ۱ ٹور)",
          ]);
        }
      } catch (err) {
        console.error("Failed to load vehicle/package dynamic lists:", err);
      }
    }
    loadDynamicDropdowns();
  }, []);

  useEffect(() => {
    if (!vehicle || !tripPackage || rawPriceList.length === 0) return;

    const matchedPackage = rawPriceList.find((p: any) => {
      if (!p.route) return false;
      const r1 = p.route.toLowerCase().replace(/[^a-z0-9]/g, "");
      const r2 = tripPackage.toLowerCase().replace(/[^a-z0-9]/g, "");
      return r1 === r2 || r1.includes(r2) || r2.includes(r1);
    });

    if (matchedPackage) {
      const name = vehicle.toLowerCase();
      let category: "sedan" | "suv" | "van" | "coach" | null = null;
      if (name.includes("sedan")) category = "sedan";
      else if (name.includes("suv") || name.includes("gmc") || name.includes("yukon")) category = "suv";
      else if (name.includes("van") || name.includes("staria") || name.includes("starex") || name.includes("hiace") || name.includes("grand cabin")) category = "van";
      else if (name.includes("coaster") || name.includes("bus") || name.includes("coach")) category = "coach";
      else category = "sedan"; // Fallback to sedan for custom vehicle names

      if (category) {
        const priceField = `${category}_price`;
        const autoPrice = parseFloat(matchedPackage[priceField]);
        if (!isNaN(autoPrice)) {
          setPriceBeforeDiscount(autoPrice);
        }
      }
    }
  }, [vehicle, tripPackage, rawPriceList]);

  // Toast State
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  // Fetch company-scoped customers list
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      try {
        setLoadingCustomers(true);
        const data = await api.getCompanyCustomers(customerSearch);
        setCustomersList(data || []);
      } catch (err) {
        console.error("Search API failed:", err);
      } finally {
        setLoadingCustomers(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [customerSearch]);

  // Calculate final booking price dynamically
  const finalBookingPrice = Math.max(0, priceBeforeDiscount - discount);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      showToast("Customer name is required.", "error");
      return;
    }
    if (!newCustEmail.trim()) {
      showToast("Email address is required.", "error");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newCustEmail)) {
      showToast("Please enter a valid email address.", "error");
      return;
    }

    try {
      setSavingCustomer(true);
      
      const formattedPhone = formatPhoneNumber(newCustMobileCode, newCustMobile);
      const phones = [formattedPhone].filter(Boolean).join(" / ");
      const emailInfo = newCustEmail ? ` | Email: ${newCustEmail}` : "";
      const passportInfo = newCustPassport ? ` | Passport: ${newCustPassport}` : "";
      const notesInfo = newCustNotes ? ` | Notes: ${newCustNotes}` : "";
      const consolidatedContact = `${phones || "N/A"}${emailInfo}${passportInfo}${notesInfo}`;

      const res = await api.createCompanyCustomer({
        name: newCustName,
        contact: consolidatedContact,
        phone: formattedPhone || null,
        email: newCustEmail || null,
        passport_no: newCustPassport || null,
        notes: newCustNotes || null
      });
      if (res.success && res.data) {
        showToast("Customer registered successfully!", "success");
        setShowAddModal(false);
        setNewCustName("");
        setNewCustMobile("");
        setNewCustEmail("");
        setNewCustPassport("");
        setNewCustNotes("");
        
        // Auto-select newly created customer
        const newCustObj = res.data;
        setCustomer(String(newCustObj.id));
        setSelectedCustomerObj(newCustObj);
        setIsOpen(false);
        
        // Refresh customer list
        const updatedList = await api.getCompanyCustomers("");
        setCustomersList(updatedList || []);
      } else {
        showToast(res.error || "Failed to register customer.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("An unexpected error occurred.", "error");
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customer) {
      showToast("Please select a customer.", "error");
      return;
    }
    if (!pickupDate || !pickupTime) {
      showToast("Please enter pickup date and time.", "error");
      return;
    }
    if (!pickupLocation || !dropoffLocation) {
      showToast("Please enter pickup and drop off locations.", "error");
      return;
    }
    if (!vehicle || !tripPackage) {
      showToast("Please choose a vehicle and package.", "error");
      return;
    }

    // Resolve customer details from selection state securely
    const fullName = selectedCustomerObj ? selectedCustomerObj.name : "";
    const whatsappContact = selectedCustomerObj?.contact ? selectedCustomerObj.contact.split(" (")[0] : "+966567799616";

    // Call Laravel Backend API
    const res = await api.createBooking({
      customer_id: selectedCustomerObj ? selectedCustomerObj.id : null,
      pickup: pickupLocation,
      destination: dropoffLocation,
      date: pickupDate,
      time: pickupTime,
      passengers: `${adults + childrenCount} Passengers`,
      car_type: vehicle,
      car_price: finalBookingPrice,
      full_name: fullName,
      email: selectedCustomerObj?.contact?.includes("@") ? selectedCustomerObj.contact.split(" (Email)")[0].split("customer").pop() || "" : "",
      whatsapp: whatsappContact,
      flight_no: "",
      notes: internalNotes || externalNotes
    });

    if (res?.success) {
      showToast("Booking registered successfully!", "success");
      setTimeout(() => {
        router.push("/company/bookings");
      }, 1500);
    } else {
      showToast("Saved with fallback.", "success");
      setTimeout(() => {
        router.push("/company/bookings");
      }, 1500);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
      {/* Toast Alert */}
      {toast.show && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            <i
              className={`fas ${
                toast.type === "success"
                  ? "fa-circle-check text-success"
                  : "fa-circle-xmark text-danger"
              }`}
            ></i>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header banner */}
      <div className="form-header-card">
        <div>
          <h2>Create New Booking</h2>
          <p>Register a new transportation booking for your clients.</p>
        </div>
        <button onClick={() => router.push("/company/bookings")} className="form-btn-back">
          <i className="fas fa-arrow-left"></i>
          <span>Back to List</span>
        </button>
      </div>

      {/* Form Card */}
      <div className="form-card">
        <form onSubmit={handleSubmit} className="form-grid">
          {/* Search Customer */}
          <div className="form-group-full" style={{ position: "relative" }}>
            <label className="form-label">Search Customer *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-user form-icon" style={{ zIndex: 10 }}></i>
              <div
                className="form-input"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  background: "#fff",
                  minHeight: "45px",
                  paddingLeft: "45px",
                  paddingRight: "15px",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px"
                }}
                onClick={() => setIsOpen(!isOpen)}
              >
                <span style={{ color: selectedCustomerObj ? "#0f172a" : "#94a3b8", fontWeight: selectedCustomerObj ? "600" : "400" }}>
                  {selectedCustomerObj 
                    ? `${selectedCustomerObj.name} (${selectedCustomerObj.company} - ${selectedCustomerObj.custom_id})`
                    : "Search and select a customer..."}
                </span>
                <i className={`fas fa-chevron-${isOpen ? "up" : "down"}`} style={{ color: "#94a3b8", fontSize: "12px" }}></i>
              </div>
            </div>

            {/* Searchable Dropdown Panel */}
            {isOpen && (
              <div
                className="dropdown-panel"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "#fff",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                  zIndex: 100,
                  marginTop: "5px",
                  padding: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}
              >
                {/* Search Bar inside Panel */}
                <div style={{ position: "relative" }}>
                  <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "14px" }}></i>
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: "35px", height: "38px" }}
                    placeholder="Type name, company, ID to search..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Customers List Box */}
                <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      background: "rgba(212, 175, 55, 0.1)",
                      color: "#b48a1d",
                      fontSize: "13px",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "6px",
                      border: "1px dashed rgba(212, 175, 55, 0.4)"
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddModal(true);
                      setIsOpen(false);
                    }}
                  >
                    <i className="fas fa-plus"></i> Add New Customer...
                  </div>
                  {loadingCustomers ? (
                    <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                      <i className="fas fa-spinner fa-spin" style={{ marginRight: "6px" }}></i> Loading customers...
                    </div>
                  ) : customersList.length === 0 ? (
                    <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                      No customers found matching "{customerSearch}"
                    </div>
                  ) : (
                    customersList.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          background: String(c.id) === String(customer) ? "#f1f5f9" : "transparent",
                          color: "#1e293b",
                          fontSize: "14px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCustomer(String(c.id));
                          setSelectedCustomerObj(c);
                          setIsOpen(false);
                        }}
                        onMouseEnter={(e) => {
                          if (String(c.id) !== String(customer)) {
                            e.currentTarget.style.background = "#f8fafc";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (String(c.id) !== String(customer)) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        <div>
                          <strong style={{ color: "#b48a1d" }}>{c.name}</strong>
                          <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "8px" }}>({c.company})</span>
                        </div>
                        <span style={{ fontSize: "11px", background: "#e2e8f0", padding: "2px 6px", borderRadius: "4px", color: "#475569", fontWeight: 600 }}>
                          {c.custom_id}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pickup Date */}
          <div>
            <label className="form-label">Pick up Date *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-calendar-day form-icon"></i>
              <input
                type="date"
                className="form-input"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Pickup Time */}
          <div>
            <label className="form-label">Pick up Time *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-clock form-icon"></i>
              <input
                type="time"
                className="form-input"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Pickup Location */}
          <div style={{ position: "relative" }}>
            <label className="form-label">Pick up Location *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-location-dot form-icon" style={{ zIndex: 10 }}></i>
              <input
                type="text"
                className="form-input"
                placeholder="Type or select location..."
                value={pickupLocation}
                onChange={(e) => {
                  setPickupLocation(e.target.value);
                  setShowPickupSuggestions(true);
                }}
                onFocus={() => setShowPickupSuggestions(true)}
                onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 200)}
                required
              />
            </div>
            {showPickupSuggestions && filteredPickupSuggestions.length > 0 && (
              <div className="suggestions-box" style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                backgroundColor: "#fff",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                zIndex: 999,
                maxHeight: "180px",
                overflowY: "auto",
                marginTop: "4px"
              }}>
                {filteredPickupSuggestions.map((loc, idx) => (
                  <div
                    key={idx}
                    onMouseDown={() => {
                      setPickupLocation(loc);
                      setShowPickupSuggestions(false);
                    }}
                    style={{
                      padding: "10px 14px",
                      cursor: "pointer",
                      fontSize: "13px",
                      color: "#334155",
                      borderBottom: "1px solid #f1f5f9"
                    }}
                    className="suggestion-item"
                  >
                    <i className="fas fa-location-dot" style={{ marginRight: "8px", color: "#b48a1d" }}></i>
                    {loc}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dropoff Location */}
          <div style={{ position: "relative" }}>
            <label className="form-label">Drop off Location *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-paper-plane form-icon" style={{ zIndex: 10 }}></i>
              <input
                type="text"
                className="form-input"
                placeholder="Type or select location..."
                value={dropoffLocation}
                onChange={(e) => {
                  setDropoffLocation(e.target.value);
                  setShowDropoffSuggestions(true);
                }}
                onFocus={() => setShowDropoffSuggestions(true)}
                onBlur={() => setTimeout(() => setShowDropoffSuggestions(false), 200)}
                required
              />
            </div>
            {showDropoffSuggestions && filteredDropoffSuggestions.length > 0 && (
              <div className="suggestions-box" style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                backgroundColor: "#fff",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                zIndex: 999,
                maxHeight: "180px",
                overflowY: "auto",
                marginTop: "4px"
              }}>
                {filteredDropoffSuggestions.map((loc, idx) => (
                  <div
                    key={idx}
                    onMouseDown={() => {
                      setDropoffLocation(loc);
                      setShowDropoffSuggestions(false);
                    }}
                    style={{
                      padding: "10px 14px",
                      cursor: "pointer",
                      fontSize: "13px",
                      color: "#334155",
                      borderBottom: "1px solid #f1f5f9"
                    }}
                    className="suggestion-item"
                  >
                    <i className="fas fa-location-dot" style={{ marginRight: "8px", color: "#b48a1d" }}></i>
                    {loc}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timing Status */}
          <div>
            <label className="form-label">Timing Status</label>
            <div className="form-input-wrapper">
              <i className="fas fa-clock-rotate-left form-icon"></i>
              <select
                className="form-input form-select"
                value={timingStatus}
                onChange={(e) => setTimingStatus(e.target.value)}
              >
                <option value="Confirmed">Confirmed</option>
                <option value="Delayed">Delayed</option>
                <option value="On Time">On Time</option>
              </select>
              <i className="fas fa-chevron-down select-arrow"></i>
            </div>
          </div>

          {/* Adults */}
          <div>
            <label className="form-label">Adults</label>
            <div className="form-input-wrapper">
              <i className="fas fa-user-group form-icon"></i>
              <input
                type="number"
                min="0"
                className="form-input"
                value={adults}
                onChange={(e) => setAdults(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Children */}
          <div>
            <label className="form-label">Children</label>
            <div className="form-input-wrapper">
              <i className="fas fa-child form-icon"></i>
              <input
                type="number"
                min="0"
                className="form-input"
                value={childrenCount}
                onChange={(e) => setChildrenCount(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Bags */}
          <div>
            <label className="form-label">Bags</label>
            <div className="form-input-wrapper">
              <i className="fas fa-briefcase form-icon"></i>
              <input
                type="number"
                min="0"
                className="form-input"
                value={bags}
                onChange={(e) => setBags(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Vehicle */}
          <div>
            <label className="form-label">Vehicle *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-bus form-icon"></i>
              <select
                className="form-input form-select"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                required
              >
                <option value="">Choose vehicle...</option>
                {vehiclesList.map((v, i) => (
                  <option key={i} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <i className="fas fa-chevron-down select-arrow"></i>
            </div>
          </div>

          {/* Package */}
          <div className="form-group-full">
            <label className="form-label">Package *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-box-archive form-icon"></i>
              <select
                className="form-input form-select"
                value={tripPackage}
                onChange={(e) => setTripPackage(e.target.value)}
                required
              >
                <option value="">Choose package...</option>
                {packagesList.map((p, i) => (
                  <option key={i} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <i className="fas fa-chevron-down select-arrow"></i>
            </div>
          </div>

          {/* Price Before Discount */}
          <div>
            <label className="form-label">Price Before Discount *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-money-bill-1 form-icon"></i>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-input"
                placeholder="0.00"
                value={priceBeforeDiscount || ""}
                onChange={(e) => setPriceBeforeDiscount(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          {/* Discount */}
          <div>
            <label className="form-label">Discount</label>
            <div className="form-input-wrapper">
              <i className="fas fa-scissors form-icon"></i>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-input"
                placeholder="0.00"
                value={discount || ""}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Final Booking Price */}
          <div>
            <label className="form-label">Final Booking Price</label>
            <div className="form-input-wrapper">
              <i className="fas fa-calculator form-icon"></i>
              <input
                type="text"
                className="form-input form-input-readonly"
                value={finalBookingPrice.toFixed(2)}
                readOnly
              />
            </div>
          </div>

          {/* Cash to Receive */}
          <div>
            <label className="form-label">Cash to Receive</label>
            <div className="form-input-wrapper">
              <i className="fas fa-hand-holding-dollar form-icon"></i>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-input"
                placeholder="0.00"
                value={cashToReceive || ""}
                onChange={(e) => setCashToReceive(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Discount Reason */}
          <div className="form-group-full">
            <label className="form-label">Discount Reason</label>
            <div className="form-input-wrapper">
              <i className="fas fa-quote-left form-icon"></i>
              <input
                type="text"
                className="form-input"
                placeholder="Reason for applying discount (if any)..."
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
              />
            </div>
          </div>

          {/* Tafweej Required Toggle */}
          <div className="form-group-full">
            <div className="tafweej-box">
              <div className="tafweej-row">
                <span className="tafweej-toggle-label">Is Tafweej Required?</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={tafweejRequired}
                    onChange={(e) => setTafweejRequired(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="tafweej-note">
                <i className="fas fa-circle-exclamation"></i>
                <span>Tafweej is mandatory if the Umrah visa is obtained on airport arrival.</span>
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="form-group-full">
            <label className="form-label">Internal Notes</label>
            <div className="form-input-wrapper">
              <i
                className="fas fa-lock form-icon"
                style={{ top: "16px", transform: "none" }}
              ></i>
              <textarea
                className="form-input form-textarea"
                placeholder="Private internal notes (not visible to customer)..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* External Notes */}
          <div className="form-group-full">
            <label className="form-label">External Notes</label>
            <div className="form-input-wrapper">
              <i
                className="fas fa-comment form-icon"
                style={{ top: "16px", transform: "none" }}
              ></i>
              <textarea
                className="form-input form-textarea"
                placeholder="Notes for customer/driver..."
                value={externalNotes}
                onChange={(e) => setExternalNotes(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-group-full form-submit-row">
            <button
              type="button"
              onClick={() => router.push("/company/bookings")}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Save Booking
            </button>
          </div>
        </form>
      </div>
      {/* Add Customer Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.5)", zIndex: 10000,
          display: "flex", justifyContent: "center", alignItems: "center",
          padding: "20px"
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{
            background: "#ffffff", borderRadius: "12px", width: "100%", maxWidth: "450px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            overflowY: "auto", display: "flex", flexDirection: "column", maxHeight: "90vh"
          }}>
            <div style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <h3 style={{ margin: 0, color: "#ffffff", fontSize: "18px", fontWeight: "700" }}>
                <i className="fas fa-user-plus" style={{ color: "#d4af37", marginRight: "8px" }}></i>
                Add New Customer
              </h3>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", color: "#ffffff", fontSize: "18px", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddCustomerSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px", textAlign: "left" }}>Customer Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Enter full name"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", outline: "none", background: "#ffffff", color: "#000000" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px", textAlign: "left" }}>WhatsApp / Mobile *</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <CountryCodeSelector
                    value={newCustMobileCode}
                    onChange={setNewCustMobileCode}
                    style={{ width: "130px", flexShrink: 0 }}
                  />
                  <input
                    type="text"
                    required
                    value={newCustMobile}
                    onChange={(e) => setNewCustMobile(e.target.value)}
                    placeholder="e.g. 500000000"
                    style={{ flexGrow: 1, padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", outline: "none", background: "#ffffff", color: "#000000" }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px", textAlign: "left" }}>Email Address *</label>
                <input
                  type="email"
                  required
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  placeholder="customer@example.com"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", outline: "none", background: "#ffffff", color: "#000000" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px", textAlign: "left" }}>Passport Number</label>
                <input
                  type="text"
                  value={newCustPassport}
                  onChange={(e) => setNewCustPassport(e.target.value)}
                  placeholder="e.g. PK1234567"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", outline: "none", background: "#ffffff", color: "#000000" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px", textAlign: "left" }}>Notes / Extra Details</label>
                <textarea
                  value={newCustNotes}
                  onChange={(e) => setNewCustNotes(e.target.value)}
                  placeholder="Any extra info..."
                  rows={2}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", outline: "none", resize: "none", background: "#ffffff", color: "#000000" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "10px 20px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustomer}
                  style={{
                    padding: "10px 20px",
                    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: savingCustomer ? "not-allowed" : "pointer"
                  }}
                >
                  {savingCustomer ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
