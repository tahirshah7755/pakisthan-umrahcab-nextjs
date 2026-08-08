"use client";

import React, { useState } from "react";
import { api } from "@/utils/api";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";

interface StatusItem {
  id: string;
  pickup: string;
  destination: string;
  date: string;
  time: string;
  carType: string;
  carPrice: number;
  fullName: string;
  status: string;
}

export default function BookingStatusPage() {
  const { settings: websiteSettings } = useWebsiteSettings();
  const sitePhone = websiteSettings?.contact_phone || "+966 567 799 616";
  const cleanPhone = sitePhone.replace(/[^0-9]/g, "");
  const baseWa = cleanPhone ? `https://wa.me/${cleanPhone}` : "https://wa.me/966567799616";
  let whatsappLink = websiteSettings?.whatsapp_link || `${baseWa}?text=HI`;
  if (whatsappLink && !whatsappLink.startsWith("http://") && !whatsappLink.startsWith("https://")) {
    const cleanNum = whatsappLink.replace(/[^0-9]/g, "");
    if (/^\d+$/.test(cleanNum)) {
      whatsappLink = `https://wa.me/${cleanNum}`;
    } else {
      whatsappLink = `https://${whatsappLink}`;
    }
  }

  let whatsappLinkPak = websiteSettings?.whatsapp_link_pak || "https://wa.me/923219462533?text=HI";
  if (whatsappLinkPak && !whatsappLinkPak.startsWith("http://") && !whatsappLinkPak.startsWith("https://")) {
    const cleanNum = whatsappLinkPak.replace(/[^0-9]/g, "");
    if (/^\d+$/.test(cleanNum)) {
      whatsappLinkPak = `https://wa.me/${cleanNum}`;
    } else {
      whatsappLinkPak = `https://${whatsappLinkPak}`;
    }
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StatusItem[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      alert("Please enter a Booking Reference Code or Mobile Number.");
      return;
    }

    const data = await api.getBookingStatus(query);
    if (data) {
      const mapped = data.map((b: any) => ({
        id: b.booking_code || b.id,
        pickup: b.pickup,
        destination: b.destination,
        date: b.date,
        time: b.time,
        carType: b.car_type || b.carType,
        carPrice: parseFloat(b.car_price || b.carPrice || 0),
        fullName: b.full_name || b.fullName,
        status: b.status
      }));
      setSearchResults(mapped);
    } else {
      setSearchResults([]);
    }
    setSearched(true);
  };

  return (
    <div style={{ minHeight: "80vh", paddingTop: "120px", paddingBottom: "60px", background: "#f6f8fa" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 20px" }}>
        
        {/* Header Block */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span className="uc-section-label">Real-time Tracking</span>
          <h2 className="uc-section-title" style={{ fontSize: "32px" }}>Check Your Booking Status</h2>
          <p className="uc-section-subtitle" style={{ margin: "0 auto" }}>
            Input your Booking Reference Code (e.g. UCB-8736) or registered name to search dispatch status.
          </p>
        </div>

        {/* Search Bar Widget */}
        <div style={{ background: "#fff", border: "2px solid #e1e4e8", borderRadius: "16px", padding: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", marginBottom: "32px" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                placeholder="Enter Booking Reference (UCB-XXXXXX) or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 18px",
                  borderRadius: "10px",
                  border: "1.5px solid #d0d7de",
                  fontSize: "15px",
                  fontFamily: "'Poppins', sans-serif",
                  outline: "none"
                }}
              />
            </div>
            <button type="submit" className="uc-btn-primary" style={{ padding: "14px 36px" }}>
              <i className="fas fa-search"></i> Find Status
            </button>
          </form>
        </div>

        {/* Search Results Display */}
        {searched && (
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#24292e", marginBottom: "16px" }}>
              Search Results ({searchResults.length} Match Found)
            </h3>

            {searchResults.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {searchResults.map((b) => (
                  <div key={b.id} style={{ background: "#fff", border: "1px solid #e1e4e8", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f3f6", paddingBottom: "12px", marginBottom: "16px" }}>
                      <div>
                        <span style={{ fontSize: "12px", color: "var(--uc-muted)" }}>Booking ID</span>
                        <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--uc-primary)" }}>{b.id}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: "12px", color: "var(--uc-muted)", display: "block", textAlign: "right" }}>Status</span>
                        <span style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 700,
                          background: b.status.includes("Active") ? "#ecfdf5" : "#fffbeb",
                          color: b.status.includes("Active") ? "#10b981" : "#d97706",
                          border: `1px solid ${b.status.includes("Active") ? "#a7f3d0" : "#fde68a"}`
                        }}>
                          {b.status}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "14px" }}>
                      <div>
                        <span style={{ color: "var(--uc-muted)", fontSize: "12px" }}>Passenger Name</span>
                        <p style={{ fontWeight: 600, color: "#24292e" }}>{b.fullName}</p>
                      </div>
                      <div>
                        <span style={{ color: "var(--uc-muted)", fontSize: "12px" }}>Selected Vehicle</span>
                        <p style={{ fontWeight: 600, color: "#24292e" }}>{b.carType} ({b.carPrice} SAR)</p>
                      </div>
                      <div>
                        <span style={{ color: "var(--uc-muted)", fontSize: "12px" }}>Pickup Route Trip</span>
                        <p style={{ fontWeight: 600, color: "#24292e" }}>{b.pickup} → {b.destination}</p>
                      </div>
                      <div>
                        <span style={{ color: "var(--uc-muted)", fontSize: "12px" }}>Scheduled Time</span>
                        <p style={{ fontWeight: 600, color: "#24292e" }}>{b.date} @ {b.time}</p>
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid #f0f3f6", marginTop: "16px", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", color: "var(--uc-muted)" }}>* Driver & Vehicle registration plate details will show once active.</span>
                      <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="uc-btn-whatsapp" style={{ fontSize: "12px", padding: "8px 16px" }}>
                        <i className="fab fa-whatsapp"></i> Chat Support
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: "#fff", border: "2px dashed #e1e4e8", borderRadius: "16px", padding: "40px", textAlign: "center", color: "var(--uc-muted)" }}>
                <i className="fas fa-search-minus" style={{ fontSize: "40px", color: "#d0d7de", marginBottom: "16px" }}></i>
                <p>No bookings found matching your search. Please double check the code or contact support.</p>
              </div>
            )}
          </div>
        )}

        {/* Quick Contacts Box */}
        <div style={{ marginTop: "48px", background: "linear-gradient(135deg, #0d1117, #161b22)", borderRadius: "16px", padding: "28px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <h4 style={{ fontSize: "16px", fontWeight: 700, color: "var(--uc-primary)", marginBottom: "4px" }}>Need Immediate Dispatch Assistance?</h4>
            <p style={{ fontSize: "13px", color: "#8b949e" }}>Speak directly with our local dispatcher team for emergency bookings.</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="uc-btn-whatsapp" style={{ fontSize: "13px", padding: "10px 20px" }}>
              <i className="fab fa-whatsapp"></i> KSA Help
            </a>
            <a href={whatsappLinkPak} target="_blank" rel="noopener noreferrer" className="uc-btn-whatsapp" style={{ fontSize: "13px", padding: "10px 20px", background: "#3b82f6" }}>
              <i className="fab fa-whatsapp"></i> PAK Help
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
