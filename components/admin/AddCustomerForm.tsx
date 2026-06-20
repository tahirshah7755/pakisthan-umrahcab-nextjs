"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/utils/api";

interface CompanyItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  invoice: boolean;
  vouchers: boolean;
  reminders: boolean;
}

interface AddCustomerFormProps {
  // We make it self-contained, but retain props matching page.tsx for backward compatibility or pass empty/optional props
  companies?: CompanyItem[];
  router: any;
}

const mockHotels = [
  { id: "1", hotel_name: "Makkah Clock Royal Tower (Fairmont)", city: "Makkah" },
  { id: "2", hotel_name: "Pullman ZamZam Makkah", city: "Makkah" },
  { id: "3", hotel_name: "Swissôtel Makkah", city: "Makkah" },
  { id: "4", hotel_name: "Hilton Suites Makkah", city: "Makkah" },
  { id: "5", hotel_name: "Anjum Hotel Makkah", city: "Makkah" },
  { id: "6", hotel_name: "Oberoi Madinah", city: "Madinah" },
  { id: "7", hotel_name: "Madinah Hilton", city: "Madinah" },
  { id: "8", hotel_name: "Anwar Al Madinah Mövenpick", city: "Madinah" },
  { id: "9", hotel_name: "Pullman Zamzam Madinah", city: "Madinah" },
  { id: "10", hotel_name: "Dar Al Taqwa Hotel Madinah", city: "Madinah" }
];

const predefinedRoutes = [
  "JEDDAH - MAKKAH - JEDDAH",
  "JEDDAH - MAKKAH - MADINAH - JEDDAH",
  "JEDDAH - MAKKAH - MADINAH - YANBU - JEDDAH",
  "MADINAH - MAKKAH - JEDDAH"
];

export const AddCustomerForm: React.FC<AddCustomerFormProps> = ({
  companies: initialCompanies,
  router,
}) => {
  const [activeStep, setActiveStep] = useState(1);
  const [companiesList, setCompaniesList] = useState<CompanyItem[]>(initialCompanies || []);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  // Step 1 States: Customer Setup
  const [custCompany, setCustCompany] = useState("");
  const [custName, setCustName] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custSecondaryPhone, setCustSecondaryPhone] = useState("");
  const [custAltPhone, setCustAltPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");

  // Step 2 States: Route setup
  const [bookingRoute, setBookingRoute] = useState("");
  const [paxCount, setPaxCount] = useState<number | "">(1);
  const [vehicleType, setVehicleType] = useState("GMC SUV");
  const [bookingCost, setBookingCost] = useState("");

  // Step 3 States: Flight Setup
  const [requireFlight, setRequireFlight] = useState(false);
  const [fltLeg, setFltLeg] = useState<"Arrival" | "Departure" | "Both Legs">("Arrival");
  const [fltArrFlightNo, setFltArrFlightNo] = useState("");
  const [fltArrPlace, setFltArrPlace] = useState("");
  const [fltArrDate, setFltArrDate] = useState("");
  const [fltArrTime, setFltArrTime] = useState("");
  const [fltDepFlightNo, setFltDepFlightNo] = useState("");
  const [fltDepPlace, setFltDepPlace] = useState("");
  const [fltDepDate, setFltDepDate] = useState("");
  const [fltDepTime, setFltDepTime] = useState("");

  // Step 4 States: Train Setup
  const [requireTrain, setRequireTrain] = useState(false);
  const [trnLeg, setTrnLeg] = useState<"Arrival" | "Departure" | "Both Legs">("Arrival");
  const [trnArrTrainNo, setTrnArrTrainNo] = useState("");
  const [trnArrStation, setTrnArrStation] = useState("");
  const [trnArrDate, setTrnArrDate] = useState("");
  const [trnArrTime, setTrnArrTime] = useState("");
  const [trnDepTrainNo, setTrnDepTrainNo] = useState("");
  const [trnDepStation, setTrnDepStation] = useState("");
  const [trnDepDate, setTrnDepDate] = useState("");
  const [trnDepTime, setTrnDepTime] = useState("");
  const [trainClass, setTrainClass] = useState("Economy");

  // Step 5 States: Hotel Setup
  const [requireHotel, setRequireHotel] = useState(false);
  const [hotelCity, setHotelCity] = useState("");
  const [hotelId, setHotelId] = useState("");
  const [hotelCheckin, setHotelCheckin] = useState("");
  const [hotelCheckout, setHotelCheckout] = useState("");
  const [custNotes, setCustNotes] = useState("");

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  };

  useEffect(() => {
    if (!initialCompanies || initialCompanies.length === 0) {
      const fetchCompaniesList = async () => {
        try {
          const response = await api.getCompanies();
          if (response) {
            setCompaniesList(response.map((c: any) => ({
              id: c.custom_id || `#CMP-${c.id}`,
              name: c.name,
              phone: c.phone || "N/A",
              email: c.email || "N/A",
              website: c.website || "N/A",
              address: c.address || "N/A",
              invoice: !!c.invoice,
              vouchers: !!c.vouchers,
              reminders: !!c.reminders
            })));
          }
        } catch (err) {
          console.error("Failed to load companies list", err);
        }
      };
      fetchCompaniesList();
    }
  }, [initialCompanies]);

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!custName || !custCompany) {
        showToast("Please fill all required customer fields (Agent & Name).", "error");
        return false;
      }
    }
    if (step === 2) {
      if (!bookingRoute || !paxCount || Number(paxCount) < 1) {
        showToast("Please select Route and enter valid Passengers count.", "error");
        return false;
      }
    }
    if (step === 3) {
      if (requireFlight) {
        if (fltLeg === "Arrival" || fltLeg === "Both Legs") {
          if (!fltArrFlightNo || !fltArrPlace || !fltArrDate || !fltArrTime) {
            showToast("Please fill in all Arrival flight details.", "error");
            return false;
          }
        }
        if (fltLeg === "Departure" || fltLeg === "Both Legs") {
          if (!fltDepFlightNo || !fltDepPlace || !fltDepDate || !fltDepTime) {
            showToast("Please fill in all Departure flight details.", "error");
            return false;
          }
        }
      }
    }
    if (step === 4) {
      if (requireTrain) {
        if (trnLeg === "Arrival" || trnLeg === "Both Legs") {
          if (!trnArrTrainNo || !trnArrStation || !trnArrDate || !trnArrTime) {
            showToast("Please fill in all Arrival train details.", "error");
            return false;
          }
        }
        if (trnLeg === "Departure" || trnLeg === "Both Legs") {
          if (!trnDepTrainNo || !trnDepStation || !trnDepDate || !trnDepTime) {
            showToast("Please fill in all Departure train details.", "error");
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handlePrev = () => {
    setActiveStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!validateStep(1) || !validateStep(2)) {
      return;
    }

    setLoading(true);

    try {
      // 1. Prepare consolidated contact details
      const phones = [custPhone, custSecondaryPhone, custAltPhone].filter(Boolean).join(" / ");
      const emailInfo = custEmail ? ` | Email: ${custEmail}` : "";
      const passportInfo = passportNo ? ` | Passport: ${passportNo}` : "";
      
      let flightInfoStr = "";
      if (requireFlight) {
        flightInfoStr = ` | Flight (${fltLeg}): ` +
          (fltLeg === "Arrival" || fltLeg === "Both Legs" ? `Arr: ${fltArrFlightNo} [${fltArrPlace} on ${fltArrDate}]` : "") +
          (fltLeg === "Both Legs" ? " & " : "") +
          (fltLeg === "Departure" || fltLeg === "Both Legs" ? `Dep: ${fltDepFlightNo} [${fltDepPlace} on ${fltDepDate}]` : "");
      }
      
      let trainInfoStr = "";
      if (requireTrain) {
        trainInfoStr = ` | Train (${trnLeg}): ` +
          (trnLeg === "Arrival" || trnLeg === "Both Legs" ? `Arr: ${trnArrTrainNo} [${trnArrStation} on ${trnArrDate}]` : "") +
          (trnLeg === "Both Legs" ? " & " : "") +
          (trnLeg === "Departure" || trnLeg === "Both Legs" ? `Dep: ${trnDepTrainNo} [${trnDepStation} on ${trnDepDate}]` : "") +
          ` Class: ${trainClass}`;
      }
      
      const hotelInfoStr = requireHotel ? ` | Hotel: ${mockHotels.find((h) => h.id === hotelId)?.hotel_name || hotelId} in ${hotelCity} (In: ${hotelCheckin}, Out: ${hotelCheckout})` : "";
      const notesInfo = custNotes ? ` | Notes: ${custNotes}` : "";

      const consolidatedContact = `${phones || "N/A"}${emailInfo}${passportInfo}${flightInfoStr}${trainInfoStr}${hotelInfoStr}${notesInfo}`;

      const newCust = {
        name: custName,
        company: custCompany,
        contact: consolidatedContact,
        phone: custPhone || null,
        secondary_phone: custSecondaryPhone || null,
        alternative_phone: custAltPhone || null,
        email: custEmail || null,
        passport_no: passportNo || null,
        hotel_info: requireHotel ? `${mockHotels.find((h) => h.id === hotelId)?.hotel_name || hotelId} in ${hotelCity} (In: ${hotelCheckin}, Out: ${hotelCheckout})` : null,
        notes: custNotes || null,
        registered_by: "umrahcab (Today)",
        last_update: "No edits",
      };

      // 2. Call Customer Creation API
      const custRes = await api.createCustomer(newCust);
      if (!custRes || !custRes.success) {
        showToast("Failed to register customer record.", "error");
        setLoading(false);
        return;
      }

      const createdCustomer = custRes.data;
      const customerId = createdCustomer.id;

      // 3. Create Booking Record
      const routeParts = bookingRoute.split(" - ");
      const pickup = routeParts[0] || bookingRoute;
      const destination = routeParts.slice(1).join(" - ") || bookingRoute;

      const todayStr = new Date().toISOString().split("T")[0];
      const timeStr = new Date().toTimeString().split(" ")[0].slice(0, 5);

      let bookingFlightNo = null;
      if (requireFlight) {
        if (fltLeg === "Arrival") bookingFlightNo = fltArrFlightNo;
        else if (fltLeg === "Departure") bookingFlightNo = fltDepFlightNo;
        else bookingFlightNo = `${fltArrFlightNo} / ${fltDepFlightNo}`;
      }

      const bookingData = {
        customer_id: customerId,
        pickup: pickup,
        destination: destination,
        date: todayStr,
        time: timeStr,
        passengers: String(paxCount),
        car_type: vehicleType,
        car_price: Number(bookingCost) || 0,
        full_name: custName,
        email: custEmail || null,
        whatsapp: custPhone || "N/A",
        flight_no: bookingFlightNo,
        notes: `Route: ${bookingRoute} | Vehicle: ${vehicleType} | Passengers: ${paxCount}${notesInfo}`,
      };

      const bookingRes = await api.createBooking(bookingData);
      if (!bookingRes || !bookingRes.success) {
        showToast("Customer created, but failed to create booking file.", "error");
        setLoading(false);
        return;
      }

      // 4. Create Flight (if requireFlight is active)
      if (requireFlight) {
        if (fltLeg === "Arrival" || fltLeg === "Both Legs") {
          const flightData = {
            customer_id: customerId,
            flight_no: fltArrFlightNo,
            leg: "Arrival",
            date: fltArrDate || todayStr,
            time: fltArrTime || "12:00",
            route: fltArrPlace,
            status: "On Time"
          };
          await api.createFlight(flightData);
        }
        if (fltLeg === "Departure" || fltLeg === "Both Legs") {
          const flightData = {
            customer_id: customerId,
            flight_no: fltDepFlightNo,
            leg: "Departure",
            date: fltDepDate || todayStr,
            time: fltDepTime || "12:00",
            route: fltDepPlace,
            status: "On Time"
          };
          await api.createFlight(flightData);
        }
      }

      // 5. Create Train (if requireTrain is active)
      if (requireTrain) {
        if (trnLeg === "Arrival" || trnLeg === "Both Legs") {
          const trainData = {
            customer_id: customerId,
            train_no: trnArrTrainNo,
            leg: "Arrival",
            date: trnArrDate || todayStr,
            time: trnArrTime || "12:00",
            route: trnArrStation,
            status: "Scheduled"
          };
          await api.createTrain(trainData);
        }
        if (trnLeg === "Departure" || trnLeg === "Both Legs") {
          const trainData = {
            customer_id: customerId,
            train_no: trnDepTrainNo,
            leg: "Departure",
            date: trnDepDate || todayStr,
            time: trnDepTime || "12:00",
            route: trnDepStation,
            status: "Scheduled"
          };
          await api.createTrain(trainData);
        }
      }

      showToast("Unified Umrah File Created Successfully!", "success");
      setTimeout(() => {
        router.push("/admin/customers");
      }, 1500);

    } catch (err) {
      console.error(err);
      showToast("System Failure: Could not finalize the unified file record.", "error");
      setLoading(false);
    }
  };

  // Filter Hotels dynamically based on selected city
  const filteredHotels = mockHotels.filter(
    (h) => !hotelCity || h.city.toLowerCase() === hotelCity.toLowerCase()
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
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

      {/* Header Banner */}
      <div className="form-header-card" style={{ 
        background: "linear-gradient(135deg, #b48a1d 0%, #1e1e2d 100%)",
        padding: "20px 30px", 
        borderRadius: "12px", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center"
      }}>
        <div>
          <span style={{ fontSize: "11px", background: "rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: "12px", display: "inline-block", marginBottom: "8px", fontWeight: "600" }}>
            <i className="fas fa-layer-group" style={{ marginRight: "5px" }}></i> Unified Booking Engine
          </span>
          <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#fff", margin: 0 }}>Premium Multi-Step Booking</h2>
          <p style={{ color: "rgba(255,255,255,0.85)", margin: "5px 0 0 0" }}>Register a customer and build their complete transport & lodging file.</p>
        </div>
        <button type="button" onClick={() => router.push("/admin/customers")} className="form-btn-back" style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          <i className="fas fa-arrow-left"></i>
          <span>Back to List</span>
        </button>
      </div>

      {/* Step Indicator Top Tracker */}
      <div className="wizard-steps" style={{ marginTop: "10px", position: "relative" }}>
        <div 
          className="wizard-steps-progress" 
          style={{ 
            position: "absolute", 
            top: "20px", 
            left: "10%", 
            height: "3px", 
            background: "#b48a1d", 
            zIndex: 1, 
            width: `${((activeStep - 1) / 4) * 80}%`,
            transition: "width 0.4s ease"
          }} 
        />
        
        <div className={`step-item ${activeStep >= 1 ? "active" : ""} ${activeStep > 1 ? "completed" : ""}`}>
          <div className="step-circle">
            {activeStep > 1 ? <i className="fas fa-check" style={{ fontSize: "12px" }}></i> : "1"}
          </div>
          <div className="step-label">Customer</div>
        </div>
        <div className={`step-item ${activeStep >= 2 ? "active" : ""} ${activeStep > 2 ? "completed" : ""}`}>
          <div className="step-circle">
            {activeStep > 2 ? <i className="fas fa-check" style={{ fontSize: "12px" }}></i> : "2"}
          </div>
          <div className="step-label">Route Setup</div>
        </div>
        <div className={`step-item ${activeStep >= 3 ? "active" : ""} ${activeStep > 3 ? "completed" : ""}`}>
          <div className="step-circle">
            {activeStep > 3 ? <i className="fas fa-check" style={{ fontSize: "12px" }}></i> : "3"}
          </div>
          <div className="step-label">Flight Details</div>
        </div>
        <div className={`step-item ${activeStep >= 4 ? "active" : ""} ${activeStep > 4 ? "completed" : ""}`}>
          <div className="step-circle">
            {activeStep > 4 ? <i className="fas fa-check" style={{ fontSize: "12px" }}></i> : "4"}
          </div>
          <div className="step-label">Train Tickets</div>
        </div>
        <div className={`step-item ${activeStep >= 5 ? "active" : ""} ${activeStep > 5 ? "completed" : ""}`}>
          <div className="step-circle">
            {activeStep > 5 ? <i className="fas fa-check" style={{ fontSize: "12px" }}></i> : "5"}
          </div>
          <div className="step-label">Hotel Booking</div>
        </div>
      </div>

      {/* Unified Form container */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
        <div className="form-card" style={{ width: "100%", padding: "35px", borderRadius: "16px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* ==================== TAB 1: CUSTOMER SETUP ==================== */}
            {activeStep === 1 && (
              <div>
                <div style={{ borderBottom: "1px solid #edf2f9", marginBottom: "20px", paddingBottom: "10px" }}>
                  <h3 style={{ color: "var(--dark-color)", margin: 0, fontSize: "18px", fontWeight: "700" }}>
                    <i className="fa-solid fa-user-plus" style={{ marginRight: "10px", color: "var(--primary-color)" }}></i> Step 1: Passenger / Agent Setup
                  </h3>
                </div>

                <div className="form-grid">
                  <div>
                    <label className="form-label">Select B2B Agent *</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fas fa-building form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <select className="form-input form-select" value={custCompany} onChange={(e) => setCustCompany(e.target.value)} required style={{ paddingLeft: "42px", width: "100%" }}>
                        <option value="">Select a Company</option>
                        {companiesList.map((com) => (
                          <option key={com.id} value={com.name}>
                            {com.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Customer Name *</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fas fa-user form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <input type="text" className="form-input" placeholder="Primary Passenger Name" value={custName} onChange={(e) => setCustName(e.target.value)} required style={{ paddingLeft: "42px", width: "100%" }} />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Passport Number</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fas fa-passport form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <input type="text" className="form-input" placeholder="e.g. PK123456" value={passportNo} onChange={(e) => setPassportNo(e.target.value)} style={{ paddingLeft: "42px", width: "100%" }} />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Contact Mobile</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fas fa-phone form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <input type="text" className="form-input" placeholder="WhatsApp Number" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} style={{ paddingLeft: "42px", width: "100%" }} />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Secondary Phone</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fas fa-phone form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <input type="text" className="form-input" placeholder="e.g. +9665XXXXXXXX" value={custSecondaryPhone} onChange={(e) => setCustSecondaryPhone(e.target.value)} style={{ paddingLeft: "42px", width: "100%" }} />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Alternative Phone</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fas fa-phone form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <input type="text" className="form-input" placeholder="e.g. +9665XXXXXXXX" value={custAltPhone} onChange={(e) => setCustAltPhone(e.target.value)} style={{ paddingLeft: "42px", width: "100%" }} />
                    </div>
                  </div>

                  <div className="form-group-full">
                    <label className="form-label">Email Address</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fas fa-envelope form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <input type="email" className="form-input" placeholder="customer@example.com" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} style={{ paddingLeft: "42px", width: "100%" }} />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "30px", display: "flex", justifyContent: "flex-end" }}>
                  <button type="button" className="btn-submit" onClick={handleNext} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>Next Step</span> <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* ==================== TAB 2: ROUTE BOOKING ==================== */}
            {activeStep === 2 && (
              <div>
                <div style={{ borderBottom: "1px solid #edf2f9", marginBottom: "20px", paddingBottom: "10px" }}>
                  <h3 style={{ color: "var(--dark-color)", margin: 0, fontSize: "18px", fontWeight: "700" }}>
                    <i className="fa-solid fa-route" style={{ marginRight: "10px", color: "var(--primary-color)" }}></i> Step 2: Transport Route & Sector Selection
                  </h3>
                </div>

                <div className="form-grid">
                  <div>
                    <label className="form-label">Select Route / Sector *</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fa-solid fa-map-location-dot form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <select className="form-input form-select" value={bookingRoute} onChange={(e) => setBookingRoute(e.target.value)} required style={{ paddingLeft: "42px", width: "100%" }}>
                        <option value="">-- Select Predefined Route --</option>
                        {predefinedRoutes.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Total Passengers (Pax) *</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fa-solid fa-users form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <input 
                        type="number" 
                        className="form-input" 
                        min={1} 
                        value={paxCount} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setPaxCount(val === "" ? "" : Number(val));
                        }} 
                        required 
                        style={{ paddingLeft: "42px", width: "100%" }} 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Vehicle Category</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fa-solid fa-car form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <select className="form-input form-select" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} style={{ paddingLeft: "42px", width: "100%" }}>
                        <option value="GMC SUV">GMC / Luxury SUV</option>
                        <option value="Hyundai H1">Hyundai H1 / HiAce Van</option>
                        <option value="Coaster">Coaster / Bus</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Total Route Price (SAR)</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fa-solid fa-money-bill-wave form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <input type="number" className="form-input" placeholder="0.00" value={bookingCost} onChange={(e) => setBookingCost(e.target.value)} style={{ paddingLeft: "42px", width: "100%" }} />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "30px", display: "flex", justifyContent: "space-between" }}>
                  <button type="button" className="btn-cancel" onClick={handlePrev} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa-solid fa-arrow-left"></i> <span>Previous</span>
                  </button>
                  <button type="button" className="btn-submit" onClick={handleNext} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>Next Step</span> <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* ==================== TAB 3: FLIGHT SETUP ==================== */}
            {activeStep === 3 && (
              <div>
                <div style={{ borderBottom: "1px solid #edf2f9", marginBottom: "20px", paddingBottom: "10px" }}>
                  <h3 style={{ color: "var(--dark-color)", margin: 0, fontSize: "18px", fontWeight: "700" }}>
                    <i className="fa-solid fa-plane-departure" style={{ marginRight: "10px", color: "var(--primary-color)" }}></i> Step 3: Flight Information
                  </h3>
                </div>

                <div className="optional-toggle-box">
                  <label className="form-switch">
                    <input type="checkbox" checked={requireFlight} onChange={(e) => setRequireFlight(e.target.checked)} style={{ display: "none" }} />
                    <span className="switch-slider"></span>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--dark-color)" }}>Does this customer require Flight Management?</span>
                  </label>
                </div>

                {requireFlight && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "fadeIn 0.3s ease-in-out" }}>
                    {/* Leg Type Tab Buttons */}
                    <div style={{ display: "flex", gap: "10px" }}>
                      {(["Arrival", "Departure", "Both Legs"] as const).map((leg) => (
                        <button
                          key={leg}
                          type="button"
                          onClick={() => setFltLeg(leg)}
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            fontWeight: "600",
                            fontSize: "13px",
                            cursor: "pointer",
                            border: fltLeg === leg ? "none" : "1px solid #cbd5e1",
                            background: fltLeg === leg ? "#0284c7" : "#ffffff",
                            color: fltLeg === leg ? "#ffffff" : "#64748b",
                            boxShadow: fltLeg === leg ? `0 4px 6px -1px rgba(2, 132, 199, 0.25)` : "none",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <i className={leg === "Arrival" ? "fas fa-plane-arrival" : leg === "Departure" ? "fas fa-plane-departure" : "fas fa-arrows-left-right"}></i>
                          <span>{leg}</span>
                        </button>
                      ))}
                    </div>

                    {/* Arrival details */}
                    {(fltLeg === "Arrival" || fltLeg === "Both Legs") && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "15px", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", background: "#f8fafc" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
                          <i className="fas fa-plane-arrival" style={{ color: "#0284c7" }}></i>
                          <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>Arrival Flight Details</span>
                        </div>
                        <div className="form-grid">
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Flight Number *</label>
                            <div className="form-input-wrapper">
                              <i className="fas fa-plane form-icon"></i>
                              <input type="text" className="form-input" placeholder="e.g. SV-3720" value={fltArrFlightNo} onChange={(e) => setFltArrFlightNo(e.target.value)} required={fltLeg === "Arrival" || fltLeg === "Both Legs"} />
                            </div>
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Arrival Airport / City *</label>
                            <div className="form-input-wrapper">
                              <i className="fas fa-location-dot form-icon"></i>
                              <input type="text" className="form-input" placeholder="e.g. JED" value={fltArrPlace} onChange={(e) => setFltArrPlace(e.target.value)} required={fltLeg === "Arrival" || fltLeg === "Both Legs"} />
                            </div>
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Arrival Date *</label>
                            <input type="date" className="form-input" value={fltArrDate} onChange={(e) => setFltArrDate(e.target.value)} required={fltLeg === "Arrival" || fltLeg === "Both Legs"} style={{ paddingLeft: "15px" }} />
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Arrival Time *</label>
                            <input type="time" className="form-input" value={fltArrTime} onChange={(e) => setFltArrTime(e.target.value)} required={fltLeg === "Arrival" || fltLeg === "Both Legs"} style={{ paddingLeft: "15px" }} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Departure details */}
                    {(fltLeg === "Departure" || fltLeg === "Both Legs") && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "15px", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", background: "#f8fafc" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
                          <i className="fas fa-plane-departure" style={{ color: "#0284c7" }}></i>
                          <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>Departure Flight Details</span>
                        </div>
                        <div className="form-grid">
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Flight Number *</label>
                            <div className="form-input-wrapper">
                              <i className="fas fa-plane form-icon"></i>
                              <input type="text" className="form-input" placeholder="e.g. SV-3721" value={fltDepFlightNo} onChange={(e) => setFltDepFlightNo(e.target.value)} required={fltLeg === "Departure" || fltLeg === "Both Legs"} />
                            </div>
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Departure Airport / City *</label>
                            <div className="form-input-wrapper">
                              <i className="fas fa-location-dot form-icon"></i>
                              <input type="text" className="form-input" placeholder="e.g. MED" value={fltDepPlace} onChange={(e) => setFltDepPlace(e.target.value)} required={fltLeg === "Departure" || fltLeg === "Both Legs"} />
                            </div>
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Departure Date *</label>
                            <input type="date" className="form-input" value={fltDepDate} onChange={(e) => setFltDepDate(e.target.value)} required={fltLeg === "Departure" || fltLeg === "Both Legs"} style={{ paddingLeft: "15px" }} />
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Departure Time *</label>
                            <input type="time" className="form-input" value={fltDepTime} onChange={(e) => setFltDepTime(e.target.value)} required={fltLeg === "Departure" || fltLeg === "Both Legs"} style={{ paddingLeft: "15px" }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ marginTop: "30px", display: "flex", justifyContent: "space-between" }}>
                  <button type="button" className="btn-cancel" onClick={handlePrev} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa-solid fa-arrow-left"></i> <span>Previous</span>
                  </button>
                  <button type="button" className="btn-submit" onClick={handleNext} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>Next Step</span> <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* ==================== TAB 4: TRAIN SETUP ==================== */}
            {activeStep === 4 && (
              <div>
                <div style={{ borderBottom: "1px solid #edf2f9", marginBottom: "20px", paddingBottom: "10px" }}>
                  <h3 style={{ color: "var(--dark-color)", margin: 0, fontSize: "18px", fontWeight: "700" }}>
                    <i className="fa-solid fa-train" style={{ marginRight: "10px", color: "var(--primary-color)" }}></i> Step 4: Haramain Train Integration
                  </h3>
                </div>

                <div className="optional-toggle-box">
                  <label className="form-switch">
                    <input type="checkbox" checked={requireTrain} onChange={(e) => setRequireTrain(e.target.checked)} style={{ display: "none" }} />
                    <span className="switch-slider"></span>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--dark-color)" }}>Does this customer have Haramain Train Tickets?</span>
                  </label>
                </div>

                {requireTrain && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "fadeIn 0.3s ease-in-out" }}>
                    
                    {/* Train Class Select Box */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label className="form-label">Train Ticket Class Type</label>
                      <select className="form-input form-select" value={trainClass} onChange={(e) => setTrainClass(e.target.value)} style={{ paddingLeft: "15px" }}>
                        <option value="Economy">Economy Class Ticket</option>
                        <option value="Business">Business Class Ticket</option>
                      </select>
                    </div>

                    {/* Leg Type Tab Buttons */}
                    <div style={{ display: "flex", gap: "10px" }}>
                      {(["Arrival", "Departure", "Both Legs"] as const).map((leg) => (
                        <button
                          key={leg}
                          type="button"
                          onClick={() => setTrnLeg(leg)}
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            fontWeight: "600",
                            fontSize: "13px",
                            cursor: "pointer",
                            border: trnLeg === leg ? "none" : "1px solid #cbd5e1",
                            background: trnLeg === leg ? "#7c3aed" : "#ffffff",
                            color: trnLeg === leg ? "#ffffff" : "#64748b",
                            boxShadow: trnLeg === leg ? `0 4px 6px -1px rgba(124, 58, 237, 0.25)` : "none",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <i className={leg === "Arrival" ? "fas fa-train" : leg === "Departure" ? "fas fa-train" : "fas fa-arrows-left-right"}></i>
                          <span>{leg}</span>
                        </button>
                      ))}
                    </div>

                    {/* Arrival details */}
                    {(trnLeg === "Arrival" || trnLeg === "Both Legs") && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "15px", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", background: "#f8fafc" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
                          <i className="fas fa-train" style={{ color: "#7c3aed" }}></i>
                          <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>Arrival Train Details</span>
                        </div>
                        <div className="form-grid">
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Train Number *</label>
                            <div className="form-input-wrapper">
                              <i className="fas fa-train form-icon"></i>
                              <input type="text" className="form-input" placeholder="e.g. HHR-5" value={trnArrTrainNo} onChange={(e) => setTrnArrTrainNo(e.target.value)} required={trnLeg === "Arrival" || trnLeg === "Both Legs"} />
                            </div>
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Arrival Station *</label>
                            <div className="form-input-wrapper">
                              <i className="fas fa-location-dot form-icon"></i>
                              <input type="text" className="form-input" placeholder="e.g. Makkah Station" value={trnArrStation} onChange={(e) => setTrnArrStation(e.target.value)} required={trnLeg === "Arrival" || trnLeg === "Both Legs"} />
                            </div>
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Arrival Date *</label>
                            <input type="date" className="form-input" value={trnArrDate} onChange={(e) => setTrnArrDate(e.target.value)} required={trnLeg === "Arrival" || trnLeg === "Both Legs"} style={{ paddingLeft: "15px" }} />
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Arrival Time *</label>
                            <input type="time" className="form-input" value={trnArrTime} onChange={(e) => setTrnArrTime(e.target.value)} required={trnLeg === "Arrival" || trnLeg === "Both Legs"} style={{ paddingLeft: "15px" }} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Departure details */}
                    {(trnLeg === "Departure" || trnLeg === "Both Legs") && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "15px", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", background: "#f8fafc" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
                          <i className="fas fa-train" style={{ color: "#7c3aed" }}></i>
                          <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>Departure Train Details</span>
                        </div>
                        <div className="form-grid">
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Train Number *</label>
                            <div className="form-input-wrapper">
                              <i className="fas fa-train form-icon"></i>
                              <input type="text" className="form-input" placeholder="e.g. HHR-10" value={trnDepTrainNo} onChange={(e) => setTrnDepTrainNo(e.target.value)} required={trnLeg === "Departure" || trnLeg === "Both Legs"} />
                            </div>
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Departure Station *</label>
                            <div className="form-input-wrapper">
                              <i className="fas fa-location-dot form-icon"></i>
                              <input type="text" className="form-input" placeholder="e.g. Medina Station" value={trnDepStation} onChange={(e) => setTrnDepStation(e.target.value)} required={trnLeg === "Departure" || trnLeg === "Both Legs"} />
                            </div>
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Departure Date *</label>
                            <input type="date" className="form-input" value={trnDepDate} onChange={(e) => setTrnDepDate(e.target.value)} required={trnLeg === "Departure" || trnLeg === "Both Legs"} style={{ paddingLeft: "15px" }} />
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Departure Time *</label>
                            <input type="time" className="form-input" value={trnDepTime} onChange={(e) => setTrnDepTime(e.target.value)} required={trnLeg === "Departure" || trnLeg === "Both Legs"} style={{ paddingLeft: "15px" }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ marginTop: "30px", display: "flex", justifyContent: "space-between" }}>
                  <button type="button" className="btn-cancel" onClick={handlePrev} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa-solid fa-arrow-left"></i> <span>Previous</span>
                  </button>
                  <button type="button" className="btn-submit" onClick={handleNext} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>Next Step</span> <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* ==================== TAB 5: NEW HOTEL BOOKING SETUP ==================== */}
            {activeStep === 5 && (
              <div>
                <div style={{ borderBottom: "1px solid #edf2f9", marginBottom: "20px", paddingBottom: "10px" }}>
                  <h3 style={{ color: "var(--dark-color)", margin: 0, fontSize: "18px", fontWeight: "700" }}>
                    <i className="fa-solid fa-hotel" style={{ marginRight: "10px", color: "var(--primary-color)" }}></i> Step 5: Umrah Hotel Accommodations
                  </h3>
                </div>

                <div className="optional-toggle-box">
                  <label className="form-switch">
                    <input type="checkbox" checked={requireHotel} onChange={(e) => setRequireHotel(e.target.checked)} style={{ display: "none" }} />
                    <span className="switch-slider"></span>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--dark-color)" }}>Include Hotel Reservation for this file?</span>
                  </label>
                </div>

                {requireHotel && (
                  <div className="form-grid" style={{ animation: "fadeIn 0.3s ease-in-out", marginBottom: "20px" }}>
                    <div>
                      <label className="form-label">Select Destination Area/City</label>
                      <div className="form-input-wrapper" style={{ position: "relative" }}>
                        <i className="fa-solid fa-city form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                        <select className="form-input form-select" value={hotelCity} onChange={(e) => { setHotelCity(e.target.value); setHotelId(""); }} style={{ paddingLeft: "42px", width: "100%" }}>
                          <option value="">-- Choose City --</option>
                          <option value="Makkah">Makkah Mukarramah</option>
                          <option value="Madinah">Madinah Munawwarah</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="form-label">Available Property / Hotel</label>
                      <div className="form-input-wrapper" style={{ position: "relative" }}>
                        <i className="fa-solid fa-building-circle-check form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                        <select className="form-input form-select" value={hotelId} onChange={(e) => setHotelId(e.target.value)} style={{ paddingLeft: "42px", width: "100%" }}>
                          <option value="">-- Select Hotel --</option>
                          {filteredHotels.map((h) => (
                            <option key={h.id} value={h.id}>
                              [{h.city.toUpperCase()}] {h.hotel_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="form-label">Check-In Date</label>
                      <input type="date" className="form-input" value={hotelCheckin} onChange={(e) => setHotelCheckin(e.target.value)} style={{ paddingLeft: "15px" }} />
                    </div>

                    <div>
                      <label className="form-label">Check-Out Date</label>
                      <input type="date" className="form-input" value={hotelCheckout} onChange={(e) => setHotelCheckout(e.target.value)} style={{ paddingLeft: "15px" }} />
                    </div>
                  </div>
                )}

                <div className="form-group-full" style={{ marginTop: "10px" }}>
                  <label className="form-label">External Notes</label>
                  <div className="form-input-wrapper" style={{ position: "relative" }}>
                    <i className="fas fa-comment form-icon" style={{ position: "absolute", left: "14px", top: "16px", color: "#9ca3af" }}></i>
                    <textarea 
                      className="form-input" 
                      placeholder="Notes that might be shared or visible to relevant parties..." 
                      value={custNotes} 
                      onChange={(e) => setCustNotes(e.target.value)} 
                      rows={3} 
                      style={{ paddingLeft: "42px", width: "100%", height: "auto", resize: "vertical", paddingTop: "12px" }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: "30px", display: "flex", justifyContent: "space-between" }}>
                  <button type="button" className="btn-cancel" onClick={handlePrev} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa-solid fa-arrow-left"></i> <span>Previous</span>
                  </button>
                  <button type="submit" className="btn-submit" disabled={loading} style={{ background: "var(--primary-color)", color: "#1e1e2d", display: "flex", alignItems: "center", gap: "8px", fontWeight: "700" }}>
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-circle-check"></i>
                        <span>Complete Process & Save File</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>
      </div>

      {/* Scoped CSS Styles for stepper tabs */}
      <style>{`
        .wizard-steps {
          display: flex !important;
          justify-content: space-between !important;
          margin-bottom: 30px !important;
          position: relative !important;
          max-width: 100% !important;
          width: 100% !important;
          padding: 0 10px !important;
        }
        
        .wizard-steps::before {
          content: '' !important;
          position: absolute !important;
          top: 20px !important;
          left: 10% !important;
          width: 80% !important;
          height: 3px !important;
          background: #cbd5e1 !important;
          z-index: 1 !important;
        }

        .step-item {
          position: relative !important;
          z-index: 2 !important;
          text-align: center !important;
          flex: 1 !important;
        }
        
        .step-circle {
          width: 40px !important;
          height: 40px !important;
          border-radius: 50% !important;
          background: #ffffff !important;
          border: 3px solid #cbd5e1 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0 auto 10px auto !important;
          font-weight: 700 !important;
          color: #94a3b8 !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05) !important;
        }
        
        .step-item.active .step-circle {
          border-color: #b48a1d !important;
          background: #1e1e2d !important;
          color: #b48a1d !important;
          box-shadow: 0 0 0 6px rgba(180, 138, 29, 0.15) !important;
          transform: scale(1.1);
        }
        
        .step-item.completed .step-circle {
          background: #b48a1d !important;
          border-color: #b48a1d !important;
          color: #ffffff !important;
        }
        
        .step-label {
          font-size: 13px !important;
          font-weight: 600 !important;
          color: #94a3b8 !important;
          transition: color 0.3s ease !important;
          margin-top: 5px !important;
          white-space: nowrap !important;
        }
        
        .step-item.active .step-label {
          color: #1e1e2d !important;
          font-weight: 700 !important;
        }
        
        .step-item.completed .step-label {
          color: #b48a1d !important;
          font-weight: 700 !important;
        }
      `}</style>
    </div>
  );
};
