"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/utils/api";

function CustomerPrintContent() {
  const searchParams = useSearchParams();
  const targetId = searchParams.get("id") || "";
  const showPriceParam = searchParams.get("showPrice") || "0";
  const showPrice = showPriceParam === "1";
  const userType = searchParams.get("type") || "admin";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [trains, setTrains] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [websiteSettings, setWebsiteSettings] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState<string>("/logo2.png");

  useEffect(() => {
    async function loadData() {
      if (!targetId) {
        setError("No customer ID provided.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Fetch website settings for logo
        try {
          const settings = await api.getWebsiteSettings();
          if (settings) {
            setWebsiteSettings(settings);
            if (settings.website_logo) {
              setLogoUrl(settings.website_logo);
            }
          }
        } catch (err) {
          console.warn("Failed to load website settings", err);
        }

        // Fetch customer profile details
        const data = await api.getCustomer(targetId);
        if (data) {
          setCustomer(data.customer || null);
          setBookings(data.bookings || []);
          setServices(data.services || []);
          setFlights(data.flights || []);
          setTrains(data.trains || []);
          setHotels(data.hotels || []);
        } else {
          setError("Customer not found or access denied.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "An error occurred while loading customer details.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [targetId]);

  // Set page title dynamically
  useEffect(() => {
    if (customer?.name) {
      document.title = `${customer.name} - Travel Itinerary Schedule`;
    }
  }, [customer]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "var(--font-inter), sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #d4af37", borderRadius: "50%", width: "50px", height: "50px", animation: "spin 1s linear infinite", margin: "0 auto 20px" }}></div>
          <p style={{ color: "#475569", fontWeight: "600" }}>Generating printable itinerary...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "20px", fontFamily: "var(--font-inter), sans-serif" }}>
        <div style={{ maxWidth: "480px", width: "100%", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "30px", textAlign: "center", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: "48px", color: "#ef4444", marginBottom: "20px" }}></i>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", marginBottom: "10px" }}>Failed to Load Itinerary</h2>
          <p style={{ color: "#64748b", marginBottom: "24px" }}>{error || "We couldn't retrieve the details for this customer profile."}</p>
          <button onClick={() => window.close()} style={{ background: "#475569", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 20px", fontWeight: "600", cursor: "pointer" }}>Close Window</button>
        </div>
      </div>
    );
  }

  // Parse contact detail fields if they are combined or extract from database fields
  const parsedPhones = [customer.phone, customer.secondary_phone, customer.alternative_phone].filter(Boolean);
  const email = customer.email || "N/A";
  const passport = customer.passport_no || "N/A";
  const hotelInfo = customer.hotel_info || "N/A";
  const notes = customer.notes || "No remarks.";

  // Create combined chronological itinerary timeline
  interface TimelineItem {
    date: string;
    time: string;
    type: "Booking" | "Flight" | "Train" | "Hotel Check-In" | "Hotel Check-Out" | "Service";
    icon: string;
    title: string;
    details: string;
    price?: number;
    badgeColor: string;
  }

  const timelineItems: TimelineItem[] = [];

  // 1. Add Bookings (Cab Transport)
  bookings.forEach((b, idx) => {
    let uiStatus = "Pending";
    if (b.status === "Active Dispatch" || b.status === "Confirmed Booking" || b.status === "Confirmed") uiStatus = "Confirmed";
    else if (b.status === "Completed") uiStatus = "Completed";
    else if (b.status === "Cancelled") uiStatus = "Cancelled";

    timelineItems.push({
      date: b.date || "",
      time: b.time || "00:00",
      type: "Booking",
      icon: "fa-taxi",
      title: `Cab Transfer (${b.booking_code || `#BKG-${b.id}`})`,
      details: `${b.pickup || "N/A"} ➔ ${b.destination || "N/A"} (${b.car_type || "Standard Sedan"}) [${uiStatus}]`,
      price: parseFloat(b.car_price || 0),
      badgeColor: "#f59e0b"
    });
  });

  // 2. Add Flights
  flights.forEach((f) => {
    timelineItems.push({
      date: f.date || "",
      time: f.time || "00:00",
      type: "Flight",
      icon: "fa-plane",
      title: `Flight Depart/Arrive (${f.flight_no})`,
      details: `Leg: ${f.leg || "N/A"} | Route: ${f.route || "N/A"} (${f.status || "Scheduled"})`,
      badgeColor: "#06b6d4"
    });
  });

  // 3. Add Trains
  trains.forEach((t) => {
    timelineItems.push({
      date: t.date || "",
      time: t.time || "00:00",
      type: "Train",
      icon: "fa-train",
      title: `Train Trip (${t.train_no})`,
      details: `Class: ${t.class || "N/A"} | Route: ${t.route || "N/A"} (${t.status || "Scheduled"})`,
      badgeColor: "#f43f5e"
    });
  });

  // 4. Add Hotels (Check-in and Check-out)
  hotels.forEach((h) => {
    if (h.check_in) {
      timelineItems.push({
        date: h.check_in,
        time: "14:00", // Standard check-in
        type: "Hotel Check-In",
        icon: "fa-hotel",
        title: `Hotel Check-In`,
        details: `${h.hotel_name || "N/A"} (Room: ${h.room_no || "Pending Assignment"})`,
        badgeColor: "#7c3aed"
      });
    }
    if (h.check_out) {
      timelineItems.push({
        date: h.check_out,
        time: "12:00", // Standard check-out
        type: "Hotel Check-Out",
        icon: "fa-hotel",
        title: `Hotel Check-Out`,
        details: `${h.hotel_name || "N/A"}`,
        badgeColor: "#4b5563"
      });
    }
  });

  // 5. Add Services
  services.forEach((s) => {
    timelineItems.push({
      date: s.date || "",
      time: s.time || "00:00",
      type: "Service",
      icon: "fa-hand-holding-heart",
      title: `Extra Service: ${s.name}`,
      details: `${s.description || s.details || "N/A"} (${s.type || "Special"})`,
      price: parseFloat(s.base_price || 0),
      badgeColor: "#ec4899"
    });
  });

  // Sort chronologically by date and then time
  timelineItems.sort((a, b) => {
    const dateA = a.date ? new Date(`${a.date}T${a.time.includes(":") ? a.time : "00:00"}`) : new Date(0);
    const dateB = b.date ? new Date(`${b.date}T${b.time.includes(":") ? b.time : "00:00"}`) : new Date(0);
    return dateA.getTime() - dateB.getTime();
  });

  // Calculate pricing totals
  const totalCabs = bookings.reduce((sum, b) => sum + parseFloat(b.car_price || 0), 0);
  const totalServices = services.reduce((sum, s) => sum + parseFloat(s.base_price || 0), 0);
  const grandTotal = totalCabs + totalServices;

  // Format date helper
  const formatDateString = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return dateStr;
    return dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: "var(--font-inter), sans-serif", color: "#1e293b" }}>
      {/* Action Controller bar - visible on screen, hidden on print */}
      <div className="print-controller" style={{
        position: "sticky", top: 0, left: 0, right: 0,
        background: "#ffffff", borderBottom: "1px solid #e2e8f0",
        padding: "12px 24px", display: "flex", justifyContent: "space-between",
        alignItems: "center", zIndex: 1000, boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ background: "#d4af37", color: "#fff", width: "36px", height: "36px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
            <i className="fas fa-print"></i>
          </div>
          <div>
            <h1 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "#0f172a" }}>Customer Schedule Report</h1>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
              {showPrice ? "Detailed Itinerary with Prices" : "Detailed Itinerary (No Prices)"} for {customer.name}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => window.print()} style={{
            background: "#d4af37", color: "#ffffff", border: "none",
            borderRadius: "8px", padding: "10px 18px", fontWeight: "700",
            fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px"
          }}>
            <i className="fas fa-print"></i> Print Report
          </button>
          <button onClick={() => window.close()} style={{
            background: "#ebeef2", color: "#475569", border: "none",
            borderRadius: "8px", padding: "10px 18px", fontWeight: "700",
            fontSize: "13px", cursor: "pointer"
          }}>
            Close
          </button>
        </div>
      </div>

      {/* Main Print Page container */}
      <div className="print-page-layout" style={{
        maxWidth: "920px", margin: "30px auto", background: "#ffffff",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
        borderRadius: "16px", padding: "40px", border: "1px solid #e2e8f0"
      }}>
        {/* Document Header */}
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #e2e8f0", paddingBottom: "25px", marginBottom: "30px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <img src={logoUrl} alt="Logo" style={{ maxHeight: "60px", maxWidth: "160px", objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).src = "/logo2.png"; }} />
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                {websiteSettings?.site_title || "Umrah Cab"}
              </h2>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>High-Performance Transport & Travel Management</p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#d4af37", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>Travel Schedule Report</h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>
              Date: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>Cust ID: {customer.custom_id || `#CST-${customer.id}`}</p>
          </div>
        </div>

        {/* Customer Profile Details Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", background: "#f8fafc", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0", marginBottom: "35px" }}>
          <div>
            <h4 style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "#64748b", margin: "0 0 8px 0", fontWeight: "700" }}>Client Information</h4>
            <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
              <div style={{ fontWeight: "700", fontSize: "16px", color: "#0f172a" }}>{customer.name}</div>
              {parsedPhones.length > 0 && (
                <div><i className="fab fa-whatsapp" style={{ color: "#22c55e", marginRight: "6px" }}></i> {parsedPhones.join(" / ")}</div>
              )}
              {email !== "N/A" && (
                <div><i className="far fa-envelope" style={{ color: "#64748b", marginRight: "6px" }}></i> {email}</div>
              )}
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "#64748b", margin: "0 0 8px 0", fontWeight: "700" }}>Logistics & References</h4>
            <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
              <div><strong>Company:</strong> {customer.company || "Corporate Account"}</div>
              <div><strong>Passport No:</strong> {passport}</div>
              <div><strong>Hotel Stay Info:</strong> {hotelInfo}</div>
            </div>
          </div>
          {notes && notes !== "No remarks." && (
            <div style={{ gridColumn: "span 2", borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "4px" }}>
              <strong>Client Notes / Remarks:</strong>
              <p style={{ margin: "4px 0 0 0", fontStyle: "italic", fontSize: "13px", color: "#475569" }}>{notes}</p>
            </div>
          )}
        </div>

        {/* Unified Chronological Itinerary Section */}
        <div style={{ marginBottom: "40px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "2px solid #f1f5f9", paddingBottom: "8px" }}>
            <i className="far fa-calendar-alt" style={{ color: "#d4af37" }}></i> Unified Chronological Schedule
          </h3>
          {timelineItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", border: "1px dashed #cbd5e1", borderRadius: "8px", color: "#64748b" }}>
              No bookings, flights, trains, hotels, or services found for this customer.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #cbd5e1", background: "#f1f5f9" }}>
                    <th style={{ padding: "10px 12px", fontWeight: "700", color: "#475569" }}>Date</th>
                    <th style={{ padding: "10px 12px", fontWeight: "700", color: "#475569" }}>Time</th>
                    <th style={{ padding: "10px 12px", fontWeight: "700", color: "#475569" }}>Event Type</th>
                    <th style={{ padding: "10px 12px", fontWeight: "700", color: "#475569" }}>Schedule Details</th>
                    {showPrice && <th style={{ padding: "10px 12px", fontWeight: "700", color: "#475569", textAlign: "right" }}>Amount</th>}
                  </tr>
                </thead>
                <tbody>
                  {timelineItems.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0", verticalAlign: "middle" }}>
                      <td style={{ padding: "10px 12px", fontWeight: "600", whiteSpace: "nowrap" }}>
                        {formatDateString(item.date)}
                      </td>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                        {item.time || "N/A"}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "6px",
                          background: `${item.badgeColor}15`, color: item.badgeColor,
                          padding: "4px 8px", borderRadius: "6px", fontWeight: "700", fontSize: "11px"
                        }}>
                          <i className={`fas ${item.icon}`}></i> {item.type}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", color: "#334155" }}>
                        {item.details}
                      </td>
                      {showPrice && (
                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: "600" }}>
                          {item.price !== undefined ? `${item.price.toFixed(2)} SAR` : "—"}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Category breakdown details (for print checklist / detailed reference) */}
        {bookings.length > 0 && (
          <div style={{ marginBottom: "35px", pageBreakBefore: "auto" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "2px solid #f1f5f9", paddingBottom: "8px" }}>
              <i className="fas fa-taxi" style={{ color: "#f59e0b" }}></i> Transport & Cab Bookings
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #cbd5e1", background: "#f8fafc" }}>
                  <th style={{ padding: "8px 10px", fontWeight: "600" }}>Booking ID</th>
                  <th style={{ padding: "8px 10px", fontWeight: "600" }}>Date & Time</th>
                  <th style={{ padding: "8px 10px", fontWeight: "600" }}>Route Details</th>
                  <th style={{ padding: "8px 10px", fontWeight: "600" }}>Vehicle Type</th>
                  <th style={{ padding: "8px 10px", fontWeight: "600" }}>Status</th>
                  {showPrice && <th style={{ padding: "8px 10px", fontWeight: "600", textAlign: "right" }}>Price</th>}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 10px", fontWeight: "700", color: "#475569" }}>{b.booking_code || `#BKG-${b.id}`}</td>
                    <td style={{ padding: "8px 10px" }}>{formatDateString(b.date)} | {b.time || "N/A"}</td>
                    <td style={{ padding: "8px 10px" }}>{b.pickup} ➔ {b.destination}</td>
                    <td style={{ padding: "8px 10px" }}>{b.car_type || "Sedan"}</td>
                    <td style={{ padding: "8px 10px" }}>{b.status}</td>
                    {showPrice && <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "600" }}>{parseFloat(b.car_price || 0).toFixed(2)} SAR</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {flights.length > 0 && (
          <div style={{ marginBottom: "35px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "2px solid #f1f5f9", paddingBottom: "8px" }}>
              <i className="fas fa-plane" style={{ color: "#06b6d4" }}></i> Flight Details
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #cbd5e1", background: "#f8fafc" }}>
                  <th style={{ padding: "8px 10px", fontWeight: "600" }}>Flight No</th>
                  <th style={{ padding: "8px 10px", fontWeight: "600" }}>Leg</th>
                  <th style={{ padding: "8px 10px", fontWeight: "600" }}>Date & Time</th>
                  <th style={{ padding: "8px 10px", fontWeight: "600" }}>Route</th>
                  <th style={{ padding: "8px 10px", fontWeight: "600" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {flights.map((f, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 10px", fontWeight: "700", color: "#475569" }}>{f.flight_no}</td>
                    <td style={{ padding: "8px 10px" }}>{f.leg || "N/A"}</td>
                    <td style={{ padding: "8px 10px" }}>{formatDateString(f.date)} | {f.time || "N/A"}</td>
                    <td style={{ padding: "8px 10px" }}>{f.route || "N/A"}</td>
                    <td style={{ padding: "8px 10px" }}>{f.status || "Scheduled"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {trains.length > 0 && (
          <div style={{ marginBottom: "35px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "2px solid #f1f5f9", paddingBottom: "8px" }}>
              <i className="fas fa-train" style={{ color: "#f43f5e" }}></i> Train Details
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #cbd5e1", background: "#f8fafc" }}>
                  <th style={{ padding: "8px 10px", fontWeight: "600" }}>Train No</th>
                  <th style={{ padding: "8px 10px", fontWeight: "600" }}>Class</th>
                  <th style={{ padding: "8px 10px", fontWeight: "600" }}>Date & Time</th>
                  <th style={{ padding: "8px 10px", fontWeight: "600" }}>Route</th>
                  <th style={{ padding: "8px 10px", fontWeight: "600" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {trains.map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 10px", fontWeight: "700", color: "#475569" }}>{t.train_no}</td>
                    <td style={{ padding: "8px 10px" }}>{t.class || "N/A"}</td>
                    <td style={{ padding: "8px 10px" }}>{formatDateString(t.date)} | {t.time || "N/A"}</td>
                    <td style={{ padding: "8px 10px" }}>{t.route || "N/A"}</td>
                    <td style={{ padding: "8px 10px" }}>{t.status || "Scheduled"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {hotels.length > 0 && (
          <div style={{ marginBottom: "35px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "2px solid #f1f5f9", paddingBottom: "8px" }}>
              <i className="fas fa-hotel" style={{ color: "#7c3aed" }}></i> Hotel stays
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #cbd5e1", background: "#f8fafc" }}>
                  <th style={{ padding: "8px 10px", fontWeight: "600" }}>Hotel Name</th>
                  <th style={{ padding: "8px 10px", fontWeight: "600" }}>Room No</th>
                  <th style={{ padding: "8px 10px", fontWeight: "600" }}>Check-In Date</th>
                  <th style={{ padding: "8px 10px", fontWeight: "600" }}>Check-Out Date</th>
                  <th style={{ padding: "8px 10px", fontWeight: "600" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {hotels.map((h, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 10px", fontWeight: "700", color: "#475569" }}>{h.hotel_name}</td>
                    <td style={{ padding: "8px 10px" }}>{h.room_no || "Pending Assignment"}</td>
                    <td style={{ padding: "8px 10px" }}>{formatDateString(h.check_in)}</td>
                    <td style={{ padding: "8px 10px" }}>{formatDateString(h.check_out)}</td>
                    <td style={{ padding: "8px 10px" }}>{h.status || "Booked"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {services.length > 0 && (
          <div style={{ marginBottom: "35px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "2px solid #f1f5f9", paddingBottom: "8px" }}>
              <i className="fas fa-hand-holding-heart" style={{ color: "#ec4899" }}></i> Extra Services
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #cbd5e1", background: "#f8fafc" }}>
                  <th style={{ padding: "8px 10px", fontWeight: "600" }}>Service Name</th>
                  <th style={{ padding: "8px 10px", fontWeight: "600" }}>Type</th>
                  <th style={{ padding: "8px 10px", fontWeight: "600" }}>Date & Time</th>
                  <th style={{ padding: "8px 10px", fontWeight: "600" }}>Description</th>
                  {showPrice && <th style={{ padding: "8px 10px", fontWeight: "600", textAlign: "right" }}>Cost</th>}
                </tr>
              </thead>
              <tbody>
                {services.map((s, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 10px", fontWeight: "700", color: "#475569" }}>{s.name}</td>
                    <td style={{ padding: "8px 10px" }}>{s.type || "Special"}</td>
                    <td style={{ padding: "8px 10px" }}>{formatDateString(s.date)} | {s.time || "N/A"}</td>
                    <td style={{ padding: "8px 10px" }}>{s.description || s.details || "N/A"}</td>
                    {showPrice && <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "600" }}>{parseFloat(s.base_price || 0).toFixed(2)} SAR</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pricing Summary section (Only visible when showPrice is true) */}
        {showPrice && (
          <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "2px solid #cbd5e1", paddingTop: "20px", marginTop: "30px" }}>
            <div style={{ width: "320px", fontSize: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", color: "#64748b" }}>
                <span>Total Cabs Transport:</span>
                <span style={{ fontWeight: "600", color: "#334155" }}>{totalCabs.toFixed(2)} SAR</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", color: "#64748b", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
                <span>Total Extra Services:</span>
                <span style={{ fontWeight: "600", color: "#334155" }}>{totalServices.toFixed(2)} SAR</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                <span>Grand Total:</span>
                <span style={{ color: "#d4af37" }}>{grandTotal.toFixed(2)} SAR</span>
              </div>
            </div>
          </div>
        )}

        {/* Terms & Conditions / Footer */}
        <div style={{ borderTop: "1px solid #e2e8f0", marginTop: "40px", paddingTop: "20px", textAlign: "center", fontSize: "11px", color: "#94a3b8", lineHeight: "1.6" }}>
          <p style={{ margin: 0 }}>This is an official travel itinerary generated by {websiteSettings?.site_title || "Umrah Cab"}. Please verify all flight and train schedules locally.</p>
          <p style={{ margin: "4px 0 0 0" }}>For any assistance, contact your agent or call our support lines. Thank you for choosing our premium services.</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .print-controller {
            display: none !important;
          }
          .print-page-layout {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          thead {
            display: table-header-group;
          }
          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

export default function CustomerPrintPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "var(--font-inter), sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #d4af37", borderRadius: "50%", width: "50px", height: "50px", animation: "spin 1s linear infinite", margin: "0 auto 20px" }}></div>
          <p style={{ color: "#475569", fontWeight: "600" }}>Loading print layouts...</p>
        </div>
      </div>
    }>
      <CustomerPrintContent />
    </Suspense>
  );
}
