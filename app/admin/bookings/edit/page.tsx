"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, getDefaultPhoneCode } from "@/utils/api";
import { CountryCodeSelector } from "@/components/CountryCodeSelector";

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

function parseNotes(notesStr: string, carPrice: number) {
  const result = {
    tripPackage: "",
    vehicle: "",
    adults: 0,
    childrenCount: 0,
    timingStatus: "Confirmed",
    bags: 0,
    priceBeforeDiscount: carPrice,
    discount: 0,
    discountReason: "",
    tafweejRequired: false,
    cashToReceive: 0,
    internalNotes: "",
    externalNotes: "",
  };

  if (!notesStr) return result;

  const parts = notesStr.split(" | ");
  let matchedCount = 0;

  parts.forEach((part) => {
    const cleanPart = part.trim();
    if (cleanPart.startsWith("Route:")) {
      result.tripPackage = cleanPart.substring("Route:".length).trim();
      matchedCount++;
    } else if (cleanPart.startsWith("Vehicle:")) {
      result.vehicle = cleanPart.substring("Vehicle:".length).trim();
      matchedCount++;
    } else if (cleanPart.startsWith("Passengers:")) {
      const pStr = cleanPart.substring("Passengers:".length).trim();
      result.adults = parseInt(pStr) || 0;
      matchedCount++;
    } else if (cleanPart.startsWith("Timing Status:")) {
      result.timingStatus = cleanPart.substring("Timing Status:".length).trim();
      matchedCount++;
    } else if (cleanPart.startsWith("Bags:")) {
      result.bags = parseInt(cleanPart.substring("Bags:".length).trim()) || 0;
      matchedCount++;
    } else if (cleanPart.startsWith("Price Before Discount:")) {
      result.priceBeforeDiscount = parseFloat(cleanPart.substring("Price Before Discount:".length).trim()) || 0;
      matchedCount++;
    } else if (cleanPart.startsWith("Discount:")) {
      result.discount = parseFloat(cleanPart.substring("Discount:".length).trim()) || 0;
      matchedCount++;
    } else if (cleanPart.startsWith("Discount Reason:")) {
      result.discountReason = cleanPart.substring("Discount Reason:".length).trim();
      matchedCount++;
    } else if (cleanPart.startsWith("Tafweej Required:")) {
      result.tafweejRequired = cleanPart.substring("Tafweej Required:".length).trim().toLowerCase() === "yes";
      matchedCount++;
    } else if (cleanPart.startsWith("Cash to Receive:")) {
      result.cashToReceive = parseFloat(cleanPart.substring("Cash to Receive:".length).trim()) || 0;
      matchedCount++;
    } else if (cleanPart.startsWith("Internal Notes:")) {
      result.internalNotes = cleanPart.substring("Internal Notes:".length).trim();
      matchedCount++;
    } else if (cleanPart.startsWith("External Notes:")) {
      result.externalNotes = cleanPart.substring("External Notes:".length).trim();
      matchedCount++;
    }
  });

  if (matchedCount < 2) {
    result.externalNotes = notesStr;
  }

  return result;
}

function BookingEditContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetId = searchParams.get("id") || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [customer, setCustomer] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [timingStatus, setTimingStatus] = useState("Confirmed");
  const [bookingStatus, setBookingStatus] = useState("Pending");
  const [adults, setAdults] = useState<number | "">(0);
  const [childrenCount, setChildrenCount] = useState<number | "">(0);
  const [bags, setBags] = useState<number | "">(0);
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

  // Pagination & Scrolling state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Loaded Customers List State
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  // Dynamic Dropdown Lists from API
  const [vehiclesList, setVehiclesList] = useState<string[]>([]);
  const [packagesList, setPackagesList] = useState<string[]>([]);
  const [rawPriceList, setRawPriceList] = useState<any[]>([]);
  const [locationsList, setLocationsList] = useState<string[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);

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

  const [externalPickupLocations, setExternalPickupLocations] = useState<string[]>([]);
  const [externalDropoffLocations, setExternalDropoffLocations] = useState<string[]>([]);

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

  // Add Customer Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustCompany, setNewCustCompany] = useState("");
  const [newCustMobile, setNewCustMobile] = useState("");
  const [newCustMobileCode, setNewCustMobileCode] = useState("+966");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPassport, setNewCustPassport] = useState("");
  const [newCustNotes, setNewCustNotes] = useState("");
  const [companiesList, setCompaniesList] = useState<any[]>([]);
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
    if (newCustCompany && companiesList.length > 0) {
      const matched = companiesList.find((c: any) => c.name === newCustCompany);
      if (matched) {
        setNewCustMobileCode(getDefaultPhoneCode(matched));
      } else {
        setNewCustMobileCode(getDefaultPhoneCode({ name: newCustCompany }));
      }
    }
  }, [newCustCompany, companiesList]);

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

  // Fetch dynamic vehicles and packages lists on mount
  useEffect(() => {
    async function loadDynamicDropdowns() {
      try {
        const [fleetData, priceListData, companiesData, locationsData] = await Promise.all([
          api.getFleet(),
          api.getPriceList(),
          api.getCompanies(),
          api.getLocations()
        ]);

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
        setCompaniesList(companiesData || []);
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

      if (category) {
        const priceField = `${category}_price`;
        const autoPrice = parseFloat(matchedPackage[priceField]);
        if (!isNaN(autoPrice)) {
          setPriceBeforeDiscount(autoPrice);
        }
      }
    }
  }, [vehicle, tripPackage, rawPriceList]);

  // Fetch target booking details
  useEffect(() => {
    const loadBookingData = async () => {
      if (!targetId) return;
      try {
        setLoading(true);
        const b = await api.getBooking(targetId);
        if (b) {
          setPickupDate(b.date || "");
          setPickupTime(b.time ? b.time.substring(0, 5) : "");
          setPickupLocation(b.pickup || "");
          setDropoffLocation(b.destination || "");

          // Map status
          let uiStatus = "Pending";
          if (b.status === "Active Dispatch" || b.status === "Confirmed Booking") uiStatus = "Confirmed";
          else if (b.status === "Completed") uiStatus = "Completed";
          else if (b.status === "Cancelled") uiStatus = "Cancelled";
          setBookingStatus(uiStatus);

          const parsed = parseNotes(b.notes, parseFloat(b.car_price || 0));
          setTripPackage(parsed.tripPackage);
          setVehicle(parsed.vehicle || b.car_type || "");
          setTimingStatus(parsed.timingStatus);
          setAdults(parsed.adults || 0);
          setChildrenCount(parsed.childrenCount || 0);
          setBags(parsed.bags || 0);
          setPriceBeforeDiscount(parsed.priceBeforeDiscount || parseFloat(b.car_price || 0));
          setDiscount(parsed.discount || 0);
          setCashToReceive(parsed.cashToReceive || 0);
          setDiscountReason(parsed.discountReason || "");
          setTafweejRequired(parsed.tafweejRequired || false);
          setInternalNotes(parsed.internalNotes || "");
          setExternalNotes(parsed.externalNotes || "");

          // Get customer details
          if (b.customer_id) {
            setCustomer(String(b.customer_id));
            const custRes = await api.getCustomer(b.customer_id);
            if (custRes) {
              setSelectedCustomerObj(custRes.customer || custRes);
            }
          }
        } else {
          showToast("Booking profile not found.", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("Error loading booking details.", "error");
      } finally {
        setLoading(false);
      }
    };

    loadBookingData();
  }, [targetId]);

  // Reset pagination to page 1 whenever the search keyword changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [customerSearch]);

  // Unified Debounced & Paginated API Fetch hook
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      try {
        setLoadingCustomers(true);
        const data = await api.getCustomers(customerSearch, undefined, page, 10);
        
        let newItems: any[] = [];
        if (data && Array.isArray(data)) {
          newItems = data;
        } else if (data && data.data && Array.isArray(data.data)) {
          newItems = data.data;
        }

        if (newItems.length < 10) {
          setHasMore(false);
        }

        setCustomersList((prev) => {
          if (page === 1) {
            return newItems;
          } else {
            const existingIds = new Set(prev.map((item) => item.id));
            const uniqueNewItems = newItems.filter((item) => !existingIds.has(item.id));
            return [...prev, ...uniqueNewItems];
          }
        });
      } catch (err) {
        console.error("Search / Pagination API failed:", err);
      } finally {
        setLoadingCustomers(false);
      }
    }, page === 1 ? 300 : 0);

    return () => clearTimeout(delayDebounceFn);
  }, [customerSearch, page]);

  // Calculate final booking price dynamically
  const finalBookingPrice = Math.max(0, priceBeforeDiscount - discount);

  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      showToast("Customer name is required.", "error");
      return;
    }
    if (!newCustCompany.trim()) {
      showToast("Company/Agent selection is required.", "error");
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

      const res = await api.createCustomer({
        name: newCustName,
        company: newCustCompany,
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
        setNewCustCompany("");
        setNewCustMobile("");
        setNewCustEmail("");
        setNewCustPassport("");
        setNewCustNotes("");
        
        const newCustObj = res.data;
        setCustomer(String(newCustObj.id));
        setSelectedCustomerObj(newCustObj);
        setIsOpen(false);
        
        setPage(1);
        const updatedListRes = await api.getCustomers("", undefined, 1, 10);
        let updatedList: any[] = [];
        if (updatedListRes && Array.isArray(updatedListRes)) {
          updatedList = updatedListRes;
        } else if (updatedListRes && updatedListRes.data && Array.isArray(updatedListRes.data)) {
          updatedList = updatedListRes.data;
        }
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

  const handleEditBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) return;

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

    try {
      setSaving(true);

      let dbStatus = "Pending Check";
      if (bookingStatus === "Confirmed") dbStatus = "Confirmed Booking";
      else if (bookingStatus === "Completed") dbStatus = "Completed";
      else if (bookingStatus === "Cancelled") dbStatus = "Cancelled";

      // Resolve customer details from selection state securely
      const fullName = selectedCustomerObj ? selectedCustomerObj.name : "";
      const whatsappContact = selectedCustomerObj?.phone || selectedCustomerObj?.secondary_phone || selectedCustomerObj?.alternative_phone || "+966567799616";
      const customerEmail = selectedCustomerObj?.email || "";

      const notesField = `Route: ${tripPackage} | Vehicle: ${vehicle} | Passengers: ${Number(adults) + Number(childrenCount)} | Timing Status: ${timingStatus} | Booking Status: ${bookingStatus} | Bags: ${bags} | Price Before Discount: ${priceBeforeDiscount} | Discount: ${discount} | Discount Reason: ${discountReason} | Tafweej Required: ${tafweejRequired ? "Yes" : "No"} | Cash to Receive: ${cashToReceive} | Internal Notes: ${internalNotes} | External Notes: ${externalNotes}`;

      const updatedFields = {
        customer_id: selectedCustomerObj ? selectedCustomerObj.id : null,
        pickup: pickupLocation,
        destination: dropoffLocation,
        date: pickupDate,
        time: pickupTime,
        passengers: `${Number(adults) + Number(childrenCount)} Passengers`,
        car_type: vehicle,
        car_price: finalBookingPrice,
        full_name: fullName,
        email: customerEmail,
        whatsapp: whatsappContact,
        notes: notesField,
        status: dbStatus,
      };

      const res = await api.updateBooking(targetId, updatedFields);
      if (res?.success) {
        showToast("Booking updated successfully!", "success");
        setTimeout(() => {
          router.push(`/admin/bookings/view?id=${targetId}`);
        }, 1500);
      } else {
        showToast(res?.error || "Failed to update booking.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to save changes to booking profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid var(--primary-color)", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

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
          <h2>Edit Booking Details</h2>
          <p>Modify and update transportation booking records.</p>
        </div>
        <button onClick={() => router.push(`/admin/bookings/view?id=${targetId}`)} className="form-btn-back">
          <i className="fas fa-arrow-left"></i>
          <span>Back to View</span>
        </button>
      </div>

      {/* Form Card */}
      <div className="form-card">
        <form onSubmit={handleEditBookingSubmit} className="form-grid">
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

                <div
                  style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}
                  onScroll={(e) => {
                    const target = e.currentTarget;
                    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
                      if (!loadingCustomers && hasMore) {
                        setPage((prev) => prev + 1);
                      }
                    }
                  }}
                >
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
                    }}
                  >
                    <i className="fas fa-plus"></i> Add New Customer...
                  </div>
                  {loadingCustomers && customersList.length === 0 ? (
                    <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                      <i className="fas fa-spinner fa-spin" style={{ marginRight: "6px" }}></i> Loading customers...
                    </div>
                  ) : customersList.length === 0 ? (
                    <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                      No customers found matching "{customerSearch}"
                    </div>
                  ) : (
                    <>
                      {customersList.map((c) => (
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
                          className="customer-dropdown-option"
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
                            <strong style={{ color: "var(--primary-color)" }}>{c.name}</strong>
                            <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "8px" }}>({c.company})</span>
                          </div>
                          <span style={{ fontSize: "11px", background: "#e2e8f0", padding: "2px 6px", borderRadius: "4px", color: "#475569", fontWeight: 600 }}>
                            {c.custom_id}
                          </span>
                        </div>
                      ))}
                      {loadingCustomers && (
                        <div style={{ padding: "8px 12px", textAlign: "center", color: "#94a3b8", fontSize: "12px", borderTop: "1px solid #f1f5f9" }}>
                          <i className="fas fa-spinner fa-spin" style={{ marginRight: "6px" }}></i> Loading more customers...
                        </div>
                      )}
                    </>
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
                    <i className="fas fa-paper-plane" style={{ marginRight: "8px", color: "#b48a1d" }}></i>
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

          {/* Booking Status */}
          <div>
            <label className="form-label">Booking Status *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-chart-simple form-icon"></i>
              <select
                className="form-input form-select"
                value={bookingStatus}
                onChange={(e) => setBookingStatus(e.target.value)}
                required
              >
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
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
                onChange={(e) => {
                  const val = e.target.value;
                  setAdults(val === "" ? "" : parseInt(val) || 0);
                }}
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
                onChange={(e) => {
                  const val = e.target.value;
                  setChildrenCount(val === "" ? "" : parseInt(val) || 0);
                }}
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
                onChange={(e) => {
                  const val = e.target.value;
                  setBags(val === "" ? "" : parseInt(val) || 0);
                }}
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
              onClick={() => router.push(`/admin/bookings/view?id=${targetId}`)}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={saving}>
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            background: "#ffffff", width: "100%", maxWidth: "500px",
            borderRadius: "12px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              background: "linear-gradient(135deg, #1e1e2d 0%, #2d2d3f 100%)",
              padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <h3 style={{ margin: 0, color: "#ffffff", fontSize: "18px", fontWeight: "700" }}>
                <i className="fas fa-user-plus" style={{ color: "#d4af37", marginRight: "8px" }}></i>
                Add New Customer
              </h3>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", color: "#ffffff", fontSize: "20px", cursor: "pointer", outline: "none" }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddCustomerSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px", textAlign: "left" }}>Company / Agent *</label>
                <select
                  required
                  value={newCustCompany}
                  onChange={(e) => setNewCustCompany(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", outline: "none", background: "#ffffff", color: "#000000" }}
                >
                  <option value="">Select Company / Agent...</option>
                  <option value="Walk-in Client">Walk-in Client</option>
                  {companiesList.map((c: any) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
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
                    background: "linear-gradient(135deg, #1e1e2d 0%, #2d2d3f 100%)",
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
      {/* Autocomplete Suggestions hover styling */}
      <style>{`
        .suggestion-item {
          transition: background-color 0.15s ease, color 0.15s ease;
        }
        .suggestion-item:hover {
          background-color: #f8fafc !important;
          color: #b48a1d !important;
        }
      `}</style>
    </div>
  );
}

export default function BookingEditPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid var(--primary-color)", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
      </div>
    }>
      <BookingEditContent />
    </Suspense>
  );
}
