"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";

interface VehicleOption {
  name: string;
  type: string;
  capacity: string;
  luggage: string;
  price: number;
  icon: string;
}

export default function PublicHomePage() {
  const router = useRouter();

  // Mega Offers Carousel
  const offers = [
    { vehicle: "Sedan", route: "Madinah Hotel to Jeddah Airport", price: 300, icon: "fa-car" },
    { vehicle: "Ford Taurus", route: "Madinah Hotel to Jeddah Airport", price: 400, icon: "fa-car-side" },
    { vehicle: "Hyundai H-1", route: "Madinah Hotel to Makkah Hotel", price: 500, icon: "fa-van-shuttle" },
    { vehicle: "GMC Yukon XL", route: "Makkah Hotel to Madinah Hotel", price: 550, icon: "fa-suv" },
    { vehicle: "Toyota HI ACE", route: "Madinah Hotel to Makkah Hotel", price: 550, icon: "fa-bus" }
  ];

  const [activeOffer, setActiveOffer] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveOffer((prev) => (prev + 1) % offers.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [offers.length]);

  // Booking Wizard State
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    pickup: "",
    destination: "",
    date: "",
    time: "",
    passengers: "1-4",
    carType: "Sedan",
    carPrice: 300,
    fullName: "",
    email: "",
    whatsapp: "",
    flightNo: "",
    notes: ""
  });

  const vehicles: VehicleOption[] = [
    { name: "Sedan", type: "Economy", capacity: "4 Passengers", luggage: "2 Bags", price: 300, icon: "fa-car" },
    { name: "Ford Taurus", type: "Premium Sedan", capacity: "4 Passengers", luggage: "3 Bags", price: 400, icon: "fa-car-side" },
    { name: "Hyundai H-1 / Staria", type: "Family Van", capacity: "7 Passengers", luggage: "5 Bags", price: 500, icon: "fa-van-shuttle" },
    { name: "GMC Yukon XL", type: "Luxury SUV", capacity: "7 Passengers", luggage: "6 Bags", price: 550, icon: "fa-truck-pickup" },
    { name: "Toyota HI ACE", type: "Large Minivan", capacity: "10 Passengers", luggage: "8 Bags", price: 550, icon: "fa-bus" }
  ];

  const handleCarSelect = (name: string, price: number) => {
    setBookingData((prev) => ({ ...prev, carType: name, carPrice: price }));
    setStep(3);
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!bookingData.pickup || !bookingData.destination || !bookingData.date || !bookingData.time) {
        alert("Please fill in all location and timing details.");
        return;
      }
    }
    if (step === 3) {
      if (!bookingData.fullName || !bookingData.whatsapp) {
        alert("Full Name and WhatsApp number are required.");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save to Laravel backend via API wrapper
    const res = await api.createBooking({
      pickup: bookingData.pickup,
      destination: bookingData.destination,
      date: bookingData.date,
      time: bookingData.time,
      passengers: bookingData.passengers,
      car_type: bookingData.carType,
      car_price: bookingData.carPrice,
      full_name: bookingData.fullName,
      email: bookingData.email,
      whatsapp: bookingData.whatsapp,
      flight_no: bookingData.flightNo,
      notes: bookingData.notes
    });

    const bookingCode = res?.data?.booking_code || res?.data?.id || "UCB-" + Math.floor(100000 + Math.random() * 900000);
    
    const whatsappMsg = `Assalamu Alaikum, I would like to book a cab.\n\n*Booking Summary*:\n• Code: ${bookingCode}\n• From: ${bookingData.pickup}\n• To: ${bookingData.destination}\n• Date: ${bookingData.date} @ ${bookingData.time}\n• Vehicle: ${bookingData.carType} (${bookingData.carPrice} SAR)\n• Client: ${bookingData.fullName}\n• WhatsApp: ${bookingData.whatsapp}\n\nPlease confirm my booking.`;
    const encoded = encodeURIComponent(whatsappMsg);

    window.open(`https://wa.me/966567799616?text=${encoded}`, "_blank");
    alert(`Your booking has been compiled successfully! Booking Reference: ${bookingCode}. Redirecting you to WhatsApp for immediate dispatcher assignment.`);
    router.push("/public-site/booking-status");
  };

  return (
    <div>
      {/* ===== HERO BANNER ===== */}
      <section className="uc-hero">
        <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", padding: "0 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "center" }}>
          <div>
            <div className="uc-carousel-wrapper">
              {offers.map((offer, idx) => (
                <div key={idx} className={`uc-slide ${idx === activeOffer ? "active" : ""}`}>
                  <span className="uc-offer-badge">Mega Offer</span>
                  <h1 className="uc-offer-vehicle">{offer.vehicle}</h1>
                  <div className="uc-offer-route">
                    <i className="fas fa-route" style={{ color: "var(--uc-primary)" }}></i>
                    <span>{offer.route}</span>
                  </div>
                  <div className="uc-offer-price">{offer.price} SAR</div>
                  <p className="uc-offer-price-sub">All inclusive price: Toll tax, Fuel & Driver charges.</p>
                  
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <a href="https://wa.me/966567799616?text=HI" target="_blank" rel="noopener noreferrer" className="uc-btn-whatsapp">
                      <i className="fab fa-whatsapp"></i> Book via WhatsApp
                    </a>
                    <button onClick={() => {
                      const routes = offer.route.split(" to ");
                      setBookingData((prev) => ({
                        ...prev,
                        pickup: routes[0],
                        destination: routes[1],
                        carType: offer.vehicle,
                        carPrice: offer.price
                      }));
                      setStep(1);
                      document.getElementById("booking-wizard")?.scrollIntoView({ behavior: "smooth" });
                    }} className="uc-btn-outline">
                      Configure Booking
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Dots navigation */}
            <div style={{ display: "flex", gap: "8px", marginTop: "24px" }}>
              {offers.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveOffer(idx)}
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    border: "none",
                    background: idx === activeOffer ? "var(--uc-primary)" : "#30363d",
                    cursor: "pointer",
                    transition: "background 0.3s"
                  }}
                ></button>
              ))}
            </div>
          </div>

          {/* Intro Box */}
          <div style={{ background: "rgba(22,27,34,0.7)", border: "1px solid #30363d", borderRadius: "20px", padding: "32px", backdropFilter: "blur(8px)" }}>
            <h2 style={{ color: "#fff", fontSize: "24px", fontWeight: 700, marginBottom: "16px" }}>Book now & Pay at Destination</h2>
            <p style={{ color: "#8b949e", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
              Experience smooth and affordable transportation services across Makkah, Madinah, and Jeddah. No credit card required. Cash payment accepted upon arrival.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <i className="fas fa-check-circle" style={{ color: "var(--uc-primary)", fontSize: "18px" }}></i>
                <span style={{ color: "#d0d7de", fontSize: "14px" }}>Experienced, multi-lingual local drivers</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <i className="fas fa-check-circle" style={{ color: "var(--uc-primary)", fontSize: "18px" }}></i>
                <span style={{ color: "#d0d7de", fontSize: "14px" }}>24/7 client dispatch support</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <i className="fas fa-check-circle" style={{ color: "var(--uc-primary)", fontSize: "18px" }}></i>
                <span style={{ color: "#d0d7de", fontSize: "14px" }}>100% sanitized, air-conditioned clean vehicles</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BOOKING WIZARD SECTION ===== */}
      <section id="booking-wizard" className="uc-section" style={{ borderBottom: "1px solid #e1e4e8" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span className="uc-section-label">Ride Booking</span>
          <h2 className="uc-section-title">Schedule Your Vehicle Online</h2>
          <p className="uc-section-subtitle" style={{ margin: "0 auto" }}>Fill in the dynamic form below to configure routes, select private cars, and generate a reservation receipt.</p>
        </div>

        <div className="uc-wizard-wrap">
          {/* Progress Header */}
          <div className="uc-wizard-steps">
            <div className={`uc-wizard-step ${step >= 1 ? "active" : ""}`} onClick={() => setStep(1)}>
              <span className="step-num">1</span>
              <div>Route & Time</div>
            </div>
            <div className={`uc-wizard-step ${step >= 2 ? "active" : ""}`} onClick={() => setStep(2)}>
              <span className="step-num">2</span>
              <div>Vehicle Selection</div>
            </div>
            <div className={`uc-wizard-step ${step >= 3 ? "active" : ""}`} onClick={() => setStep(3)}>
              <span className="step-num">3</span>
              <div>Contact Details</div>
            </div>
            <div className={`uc-wizard-step ${step >= 4 ? "active" : ""}`} onClick={() => setStep(4)}>
              <span className="step-num">4</span>
              <div>Confirm Summary</div>
            </div>
          </div>

          {/* Form Body */}
          <div className="uc-wizard-body">
            {/* Step 1: Locations */}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="uc-form-row">
                  <div className="uc-form-group">
                    <label className="uc-form-label">Pickup Location *</label>
                    <select
                      className="uc-form-input"
                      value={bookingData.pickup}
                      onChange={(e) => setBookingData({ ...bookingData, pickup: e.target.value })}
                    >
                      <option value="">Select location...</option>
                      <option value="Jeddah Airport">Jeddah Airport (JED)</option>
                      <option value="Makkah Hotel">Makkah Hotel</option>
                      <option value="Madinah Hotel">Madinah Hotel</option>
                      <option value="Yanbu Hotel">Yanbu Hotel</option>
                    </select>
                  </div>
                  <div className="uc-form-group">
                    <label className="uc-form-label">Drop-off Destination *</label>
                    <select
                      className="uc-form-input"
                      value={bookingData.destination}
                      onChange={(e) => setBookingData({ ...bookingData, destination: e.target.value })}
                    >
                      <option value="">Select location...</option>
                      <option value="Jeddah Airport">Jeddah Airport (JED)</option>
                      <option value="Makkah Hotel">Makkah Hotel</option>
                      <option value="Madinah Hotel">Madinah Hotel</option>
                      <option value="Yanbu Hotel">Yanbu Hotel</option>
                    </select>
                  </div>
                </div>

                <div className="uc-form-row">
                  <div className="uc-form-group">
                    <label className="uc-form-label">Pickup Date *</label>
                    <input
                      type="date"
                      className="uc-form-input"
                      value={bookingData.date}
                      onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                    />
                  </div>
                  <div className="uc-form-group">
                    <label className="uc-form-label">Pickup Time *</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <div style={{ flex: 1, position: "relative" }}>
                        <select
                          className="uc-form-input"
                          style={{ paddingRight: "30px", appearance: "none" }}
                          value={bookingData.time ? bookingData.time.split(":")[0] : ""}
                          onChange={(e) => {
                            const h = e.target.value;
                            const m = bookingData.time ? bookingData.time.split(":")[1] || "00" : "00";
                            setBookingData({ ...bookingData, time: h ? `${h}:${m}` : "" });
                          }}
                          required
                        >
                          <option value="">Hour</option>
                          {Array.from({ length: 24 }, (_, i) => {
                            const h = i < 10 ? `0${i}` : `${i}`;
                            return (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            );
                          })}
                        </select>
                        <i className="fas fa-chevron-down" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}></i>
                      </div>
                      <div style={{ flex: 1, position: "relative" }}>
                        <select
                          className="uc-form-input"
                          style={{ paddingRight: "30px", appearance: "none" }}
                          value={bookingData.time ? bookingData.time.split(":")[1] : ""}
                          onChange={(e) => {
                            const m = e.target.value;
                            const h = bookingData.time ? bookingData.time.split(":")[0] || "12" : "12";
                            setBookingData({ ...bookingData, time: m ? `${h}:${m}` : "" });
                          }}
                          required
                        >
                          <option value="">Minute</option>
                          {(() => {
                            const currentMin = bookingData.time ? bookingData.time.split(":")[1] : "";
                            const minutes = Array.from({ length: 12 }, (_, i) => {
                              const m = i * 5;
                              return m < 10 ? `0${m}` : `${m}`;
                            });
                            if (currentMin && !minutes.includes(currentMin)) {
                              minutes.push(currentMin);
                              minutes.sort();
                            }
                            return minutes.map((mm) => (
                              <option key={mm} value={mm}>
                                {mm}
                              </option>
                            ));
                          })()}
                        </select>
                        <i className="fas fa-chevron-down" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}></i>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="uc-form-group">
                  <label className="uc-form-label">Number of Passengers</label>
                  <select
                    className="uc-form-input"
                    value={bookingData.passengers}
                    onChange={(e) => setBookingData({ ...bookingData, passengers: e.target.value })}
                  >
                    <option value="1-4">1-4 Passengers</option>
                    <option value="5-7">5-7 Passengers</option>
                    <option value="8-10">8-10 Passengers</option>
                    <option value="10+">More than 10</option>
                  </select>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
                  <button onClick={handleNextStep} className="uc-btn-primary">
                    Select Vehicle <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Car Choice */}
            {step === 2 && (
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px" }}>Select Your Private Ride</h3>
                <div className="uc-vehicles-grid">
                  {vehicles.map((v) => (
                    <div
                      key={v.name}
                      onClick={() => handleCarSelect(v.name, v.price)}
                      className={`uc-vehicle-card ${bookingData.carType === v.name ? "selected" : ""}`}
                    >
                      <span className="uc-vehicle-icon">
                        <i className={`fas ${v.icon}`} style={{ color: "var(--uc-primary)" }}></i>
                      </span>
                      <div className="uc-vehicle-name">{v.name}</div>
                      <div className="uc-vehicle-cap">
                        {v.capacity} • {v.luggage}
                      </div>
                      <div className="uc-vehicle-price">{v.price} SAR</div>
                      <div style={{ fontSize: "11px", color: "var(--uc-muted)", marginTop: "4px" }}>{v.type}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px" }}>
                  <button onClick={handlePrevStep} className="uc-btn-outline">
                    <i className="fas fa-arrow-left"></i> Back
                  </button>
                  <button onClick={handleNextStep} className="uc-btn-primary">
                    Enter Info <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Contact */}
            {step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="uc-form-row">
                  <div className="uc-form-group">
                    <label className="uc-form-label">Full Name *</label>
                    <input
                      type="text"
                      placeholder="Your name..."
                      className="uc-form-input"
                      value={bookingData.fullName}
                      onChange={(e) => setBookingData({ ...bookingData, fullName: e.target.value })}
                    />
                  </div>
                  <div className="uc-form-group">
                    <label className="uc-form-label">WhatsApp Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. +923001234567..."
                      className="uc-form-input"
                      value={bookingData.whatsapp}
                      onChange={(e) => setBookingData({ ...bookingData, whatsapp: e.target.value })}
                    />
                  </div>
                </div>

                <div className="uc-form-row">
                  <div className="uc-form-group">
                    <label className="uc-form-label">Email Address</label>
                    <input
                      type="email"
                      placeholder="email@domain.com..."
                      className="uc-form-input"
                      value={bookingData.email}
                      onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                    />
                  </div>
                  <div className="uc-form-group">
                    <label className="uc-form-label">Flight Carrier No (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. SV-812..."
                      className="uc-form-input"
                      value={bookingData.flightNo}
                      onChange={(e) => setBookingData({ ...bookingData, flightNo: e.target.value })}
                    />
                  </div>
                </div>

                <div className="uc-form-group">
                  <label className="uc-form-label">Special Notes / Requests</label>
                  <textarea
                    rows={3}
                    placeholder="Child seat, wheelchair, extra luggage requests..."
                    className="uc-form-input"
                    value={bookingData.notes}
                    onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
                  <button onClick={handlePrevStep} className="uc-btn-outline">
                    <i className="fas fa-arrow-left"></i> Back
                  </button>
                  <button onClick={handleNextStep} className="uc-btn-primary">
                    Summary <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Summary */}
            {step === 4 && (
              <div>
                <div style={{ background: "#f8f9fa", border: "1px solid #e1e4e8", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: 700, borderBottom: "1px solid #e1e4e8", paddingBottom: "10px", marginBottom: "16px" }}>Booking Reservation Summary</h4>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "14px" }}>
                    <div>
                      <span style={{ color: "var(--uc-muted)" }}>Route Trip:</span>
                      <p style={{ fontWeight: 600 }}>{bookingData.pickup} → {bookingData.destination}</p>
                    </div>
                    <div>
                      <span style={{ color: "var(--uc-muted)" }}>Date & Time:</span>
                      <p style={{ fontWeight: 600 }}>{bookingData.date} @ {bookingData.time}</p>
                    </div>
                    <div>
                      <span style={{ color: "var(--uc-muted)" }}>Vehicle Choice:</span>
                      <p style={{ fontWeight: 600, color: "var(--uc-primary)" }}>{bookingData.carType}</p>
                    </div>
                    <div>
                      <span style={{ color: "var(--uc-muted)" }}>Total Fare Price:</span>
                      <p style={{ fontWeight: 700 }}>{bookingData.carPrice} SAR</p>
                    </div>
                    <div>
                      <span style={{ color: "var(--uc-muted)" }}>Passenger Name:</span>
                      <p style={{ fontWeight: 600 }}>{bookingData.fullName}</p>
                    </div>
                    <div>
                      <span style={{ color: "var(--uc-muted)" }}>WhatsApp Contact:</span>
                      <p style={{ fontWeight: 600 }}>{bookingData.whatsapp}</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px" }}>
                  <button onClick={handlePrevStep} className="uc-btn-outline">
                    <i className="fas fa-arrow-left"></i> Back
                  </button>
                  <button onClick={handleFinalSubmit} className="uc-btn-primary" style={{ background: "#25D366", color: "#fff" }}>
                    <i className="fab fa-whatsapp"></i> Confirm & Book on WhatsApp
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== VEHICLE PRICING SECTION ===== */}
      <section className="uc-section" style={{ borderBottom: "1px solid #e1e4e8" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span className="uc-section-label">Our Fleet</span>
          <h2 className="uc-section-title">Special Fare Route Rates</h2>
          <p className="uc-section-subtitle" style={{ margin: "0 auto" }}>Browse Makkah ↔ Madinah ↔ Jeddah Airport direct transport price listings.</p>
        </div>

        <div className="uc-offers-grid">
          {offers.map((offer, idx) => (
            <div key={idx} className="uc-offer-card">
              <span className="uc-offer-card-badge">Special Promo</span>
              <h3 className="uc-offer-card-vehicle">{offer.vehicle}</h3>
              <div className="uc-offer-card-route">
                <i className="fas fa-map-marker-alt"></i>
                <span>{offer.route}</span>
              </div>
              <div className="uc-offer-card-price">{offer.price} SAR</div>
              <span className="uc-offer-card-sub">Fuel, Driver, and Toll included</span>
              <button
                onClick={() => {
                  const r = offer.route.split(" to ");
                  setBookingData((prev) => ({
                    ...prev,
                    pickup: r[0],
                    destination: r[1],
                    carType: offer.vehicle,
                    carPrice: offer.price
                  }));
                  setStep(1);
                  document.getElementById("booking-wizard")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="uc-btn-outline"
                style={{ width: "100%", justifyContent: "center", fontSize: "13px" }}
              >
                Select Offer
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ===== DOWNLOAD APP SECTION ===== */}
      <section className="uc-app-section">
        <div style={{ maxWidth: "800px", margin: "0 auto", color: "#fff" }}>
          <span className="uc-section-label" style={{ color: "var(--uc-primary)" }}>Mobile Apps</span>
          <h2 style={{ fontSize: "32px", fontWeight: 800, marginTop: "12px", marginBottom: "16px" }}>Download the UMRAH-CAB App Free Today</h2>
          <p style={{ color: "#8b949e", fontSize: "15px", lineHeight: 1.6 }}>
            Access rides, confirm drivers, and download vouchers directly on your mobile device. Compatible with all Android and iOS smartphones.
          </p>

          <div className="uc-app-btns">
            <a href="https://itunes.apple.com/us/app/umrah-cab/id1382524932?ls=1&mt=8" target="_blank" rel="noopener noreferrer" className="uc-app-btn">
              <i className="fab fa-apple uc-app-btn-icon" style={{ color: "#000" }}></i>
              <div style={{ textAlign: "left" }}>
                <span className="uc-app-btn-label">Download on the</span>
                <span className="uc-app-btn-store">App Store</span>
              </div>
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.UmrahCab.UmrahCab" target="_blank" rel="noopener noreferrer" className="uc-app-btn">
              <i className="fab fa-google-play uc-app-btn-icon" style={{ color: "#34A853" }}></i>
              <div style={{ textAlign: "left" }}>
                <span className="uc-app-btn-label">Get it on</span>
                <span className="uc-app-btn-store">Google Play</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ===== CONTACT SECTION ===== */}
      <section id="contact" className="uc-section">
        <div className="uc-contact-grid">
          <div>
            <span className="uc-section-label">Get In Touch</span>
            <h2 className="uc-section-title">We would really love to hear from you</h2>
            <p className="uc-section-subtitle" style={{ marginBottom: "32px" }}>
              Our support team is online 24/7 to solve transport route issues, customize group packages, or provide special VIP executive fleet rates.
            </p>

            <div className="uc-contact-item">
              <div className="uc-contact-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <div>
                <div className="uc-contact-label">Office Address</div>
                <div className="uc-contact-value">Challenge House, Unit 123, 616 Mitcham Road, Thornton Heath, CR0 3AA</div>
              </div>
            </div>

            <div className="uc-contact-item">
              <div className="uc-contact-icon">
                <i className="fas fa-phone-alt"></i>
              </div>
              <div>
                <div className="uc-contact-label">Helpline Numbers</div>
                <div className="uc-contact-value">+966 567 799 616 (WhatsApp & Call)</div>
              </div>
            </div>

            <div className="uc-contact-item">
              <div className="uc-contact-icon">
                <i className="fas fa-envelope"></i>
              </div>
              <div>
                <div className="uc-contact-label">Email Queries</div>
                <div className="uc-contact-value">Info@umrahcab.com</div>
              </div>
            </div>
          </div>

          {/* Web form */}
          <div style={{ background: "#fff", border: "2px solid #e1e4e8", borderRadius: "16px", padding: "32px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>Drop Us a Line</h3>
            <form onSubmit={(e) => { e.preventDefault(); alert("Thank you! Your message has been dispatched to our client support agents."); }} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="uc-form-group">
                <label className="uc-form-label">Full Name</label>
                <input type="text" className="uc-form-input" placeholder="Your name..." required />
              </div>
              <div className="uc-form-group">
                <label className="uc-form-label">Email Address</label>
                <input type="email" className="uc-form-input" placeholder="email@address.com..." required />
              </div>
              <div className="uc-form-group">
                <label className="uc-form-label">Message Details</label>
                <textarea rows={4} className="uc-form-input" placeholder="How can we assist you?" required></textarea>
              </div>
              <button type="submit" className="uc-btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
