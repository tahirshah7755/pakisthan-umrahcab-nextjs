"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "../../utils/api";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [websiteSettings, setWebsiteSettings] = useState<any>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fetch website settings from the public API
  useEffect(() => {
    async function fetchSettings() {
      try {
        const data = await api.getWebsiteSettings();
        if (data) {
          setWebsiteSettings(data);
        }
      } catch (err) {
        console.warn("Could not load dynamic website settings", err);
      }
    }
    fetchSettings();
  }, []);

  // Dynamically update document title & favicon
  useEffect(() => {
    if (websiteSettings?.site_title) {
      document.title = websiteSettings.site_title;
    }
    if (websiteSettings?.favicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = websiteSettings.favicon;
    }
  }, [websiteSettings]);

  const navLinks = [
    { label: "Home", href: "/public-site" },
    { label: "Booking Status", href: "/public-site/booking-status" },
    { label: "Contact Us", href: "/public-site#contact" },
    { label: "Members", href: "/public-site/signup" },
  ];

  // Fallbacks
  const siteLogo = websiteSettings?.website_logo || "/logo2.png";
  const siteTitle = websiteSettings?.site_title || "UmrahCab";
  const sitePhone = websiteSettings?.contact_phone || "+966 567 799 616";
  const siteEmail = websiteSettings?.contact_email || "Info@umrahcab.com";
  const siteAddress = websiteSettings?.contact_address || "Challenge House, Unit 123, 616 Mitcham Road, Thornton Heath, CR0 3AA";
  const whatsappLink = websiteSettings?.whatsapp_link || "https://wa.me/966567799616?text=HI";

  return (
    <div style={{ fontFamily: "'Poppins', 'Inter', sans-serif", minHeight: "100vh", background: "#fff", color: "#222" }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --uc-primary: #c8a84b;
          --uc-primary-dark: #a0822f;
          --uc-dark: #0d1117;
          --uc-dark2: #161b22;
          --uc-text: #24292e;
          --uc-muted: #656d76;
          --uc-white: #ffffff;
          --uc-yellow: #f5d020;
          --uc-shadow: 0 4px 24px rgba(0,0,0,0.10);
        }

        /* ===== NAVBAR ===== */
        .uc-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 1000;
          transition: all 0.3s ease;
          padding: 0 40px;
        }
        .uc-nav.scrolled {
          background: rgba(13,17,23,0.97);
          backdrop-filter: blur(12px);
          box-shadow: 0 2px 20px rgba(0,0,0,0.3);
        }
        .uc-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 70px;
        }
        .uc-nav-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }
        .uc-nav-logo img {
          height: 48px;
          width: 48px;
          object-fit: contain;
          border-radius: 8px;
        }
        .uc-nav-logo-text {
          font-size: 20px;
          font-weight: 800;
          color: var(--uc-primary);
          letter-spacing: -0.5px;
        }
        .uc-nav-links {
          display: flex;
          align-items: center;
          gap: 8px;
          list-style: none;
        }
        .uc-nav-link {
          padding: 8px 16px;
          border-radius: 8px;
          color: #d0d7de;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s;
        }
        .uc-nav-link:hover, .uc-nav-link.active {
          color: var(--uc-primary);
          background: rgba(200, 168, 75, 0.1);
        }
        .uc-nav-cta {
          background: var(--uc-primary);
          color: #000 !important;
          border-radius: 8px;
          padding: 8px 20px !important;
          font-weight: 700 !important;
          transition: all 0.2s !important;
        }
        .uc-nav-cta:hover {
          background: var(--uc-primary-dark) !important;
          transform: translateY(-1px);
        }

        /* ===== HERO ===== */
        .uc-hero {
          min-height: 100vh;
          background: linear-gradient(135deg, #0d1117 0%, #161b22 50%, #1c2128 100%);
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
          padding-top: 70px;
        }
        .uc-hero::before {
          content: '';
          position: absolute;
          top: -200px; right: -200px;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(200,168,75,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .uc-hero::after {
          content: '';
          position: absolute;
          bottom: -100px; left: -100px;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(200,168,75,0.05) 0%, transparent 70%);
          pointer-events: none;
        }

        /* ===== CAROUSEL ===== */
        .uc-carousel-wrapper {
          position: relative;
          width: 100%;
          overflow: hidden;
        }
        .uc-slide {
          display: none;
          animation: fadeInSlide 0.6s ease;
        }
        .uc-slide.active { display: block; }
        @keyframes fadeInSlide {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ===== OFFER CARD ===== */
        .uc-offer-badge {
          display: inline-block;
          background: var(--uc-primary);
          color: #000;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          padding: 4px 14px;
          border-radius: 20px;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .uc-offer-vehicle {
          font-size: clamp(2rem, 5vw, 4rem);
          font-weight: 800;
          color: #fff;
          line-height: 1.1;
          margin-bottom: 12px;
        }
        .uc-offer-route {
          font-size: 16px;
          color: #8b949e;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .uc-offer-price {
          font-size: clamp(2.5rem, 6vw, 5rem);
          font-weight: 900;
          color: var(--uc-primary);
          line-height: 1;
          margin-bottom: 8px;
        }
        .uc-offer-price-sub {
          font-size: 14px;
          color: #656d76;
          margin-bottom: 32px;
        }

        /* ===== BUTTONS ===== */
        .uc-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--uc-primary);
          color: #000;
          font-weight: 700;
          font-size: 15px;
          padding: 14px 32px;
          border-radius: 10px;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Poppins', sans-serif;
        }
        .uc-btn-primary:hover {
          background: var(--uc-primary-dark);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(200,168,75,0.3);
        }
        .uc-btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: var(--uc-primary);
          font-weight: 600;
          font-size: 15px;
          padding: 13px 28px;
          border-radius: 10px;
          text-decoration: none;
          border: 2px solid var(--uc-primary);
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Poppins', sans-serif;
        }
        .uc-btn-outline:hover {
          background: rgba(200,168,75,0.1);
          transform: translateY(-2px);
        }
        .uc-btn-whatsapp {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #25D366;
          color: #fff;
          font-weight: 700;
          font-size: 15px;
          padding: 14px 28px;
          border-radius: 10px;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .uc-btn-whatsapp:hover {
          background: #128C7E;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(37,211,102,0.3);
        }

        /* ===== SECTION ===== */
        .uc-section {
          padding: 80px 40px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .uc-section-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--uc-primary);
          margin-bottom: 12px;
        }
        .uc-section-title {
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          font-weight: 800;
          color: #0d1117;
          margin-bottom: 12px;
          line-height: 1.2;
        }
        .uc-section-subtitle {
          font-size: 16px;
          color: #656d76;
          max-width: 600px;
          line-height: 1.7;
        }

        /* ===== BOOKING WIZARD ===== */
        .uc-wizard-wrap {
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.12);
          overflow: hidden;
          max-width: 800px;
          margin: 0 auto;
        }
        .uc-wizard-steps {
          display: flex;
          background: #f6f8fa;
          border-bottom: 1px solid #e1e4e8;
        }
        .uc-wizard-step {
          flex: 1;
          padding: 16px 12px;
          text-align: center;
          font-size: 12px;
          font-weight: 600;
          color: #8b949e;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
        }
        .uc-wizard-step.active {
          color: var(--uc-primary);
          border-bottom-color: var(--uc-primary);
          background: rgba(200,168,75,0.05);
        }
        .uc-wizard-step .step-num {
          display: inline-flex;
          width: 24px; height: 24px;
          border-radius: 50%;
          background: #e1e4e8;
          color: #8b949e;
          font-size: 11px;
          font-weight: 700;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }
        .uc-wizard-step.active .step-num {
          background: var(--uc-primary);
          color: #000;
        }
        .uc-wizard-body {
          padding: 32px;
        }
        .uc-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .uc-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .uc-form-group.full { grid-column: 1/-1; }
        .uc-form-label {
          font-size: 12px;
          font-weight: 600;
          color: #24292e;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .uc-form-input {
          padding: 12px 14px;
          border: 1.5px solid #d0d7de;
          border-radius: 8px;
          font-size: 14px;
          font-family: 'Poppins', sans-serif;
          color: #24292e;
          background: #fff;
          transition: border-color 0.2s;
          outline: none;
        }
        .uc-form-input:focus {
          border-color: var(--uc-primary);
          box-shadow: 0 0 0 3px rgba(200,168,75,0.1);
        }

        /* ===== VEHICLE CARDS ===== */
        .uc-vehicles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 20px;
        }
        .uc-vehicle-card {
          background: #fff;
          border: 2px solid #e1e4e8;
          border-radius: 16px;
          padding: 24px 20px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          position: relative;
        }
        .uc-vehicle-card:hover, .uc-vehicle-card.selected {
          border-color: var(--uc-primary);
          box-shadow: 0 8px 32px rgba(200,168,75,0.15);
          transform: translateY(-4px);
        }
        .uc-vehicle-card.selected::before {
          content: '✓';
          position: absolute;
          top: -10px; right: -10px;
          width: 28px; height: 28px;
          background: var(--uc-primary);
          color: #000;
          font-weight: 900;
          font-size: 13px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .uc-vehicle-icon {
          font-size: 3rem;
          margin-bottom: 12px;
          display: block;
        }
        .uc-vehicle-name {
          font-size: 16px;
          font-weight: 700;
          color: #24292e;
          margin-bottom: 4px;
        }
        .uc-vehicle-cap {
          font-size: 12px;
          color: #8b949e;
          margin-bottom: 12px;
        }
        .uc-vehicle-price {
          font-size: 22px;
          font-weight: 800;
          color: var(--uc-primary);
        }

        /* ===== OFFERS GRID ===== */
        .uc-offers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        .uc-offer-card {
          background: linear-gradient(135deg, #161b22, #1c2128);
          border: 1px solid #30363d;
          border-radius: 16px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
        }
        .uc-offer-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--uc-primary), var(--uc-primary-dark));
        }
        .uc-offer-card:hover {
          border-color: var(--uc-primary);
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(200,168,75,0.15);
        }
        .uc-offer-card-badge {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
          color: var(--uc-primary);
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .uc-offer-card-vehicle {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 6px;
        }
        .uc-offer-card-route {
          font-size: 13px;
          color: #8b949e;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .uc-offer-card-price {
          font-size: 32px;
          font-weight: 900;
          color: var(--uc-primary);
          margin-bottom: 16px;
        }
        .uc-offer-card-sub {
          font-size: 11px;
          color: #656d76;
          display: block;
          margin-top: -8px;
          margin-bottom: 16px;
        }

        /* ===== APP SECTION ===== */
        .uc-app-section {
          background: linear-gradient(135deg, #0d1117, #161b22);
          padding: 80px 40px;
          text-align: center;
        }
        .uc-app-btns {
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 32px;
        }
        .uc-app-btn {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: #fff;
          color: #000;
          padding: 12px 24px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s;
          border: 2px solid #e1e4e8;
        }
        .uc-app-btn:hover {
          border-color: var(--uc-primary);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }
        .uc-app-btn-icon { font-size: 28px; }
        .uc-app-btn-label { font-size: 11px; color: #8b949e; display: block; }
        .uc-app-btn-store { font-size: 16px; font-weight: 700; display: block; }

        /* ===== CONTACT ===== */
        .uc-contact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
        }
        .uc-contact-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 24px;
        }
        .uc-contact-icon {
          width: 48px; height: 48px;
          background: rgba(200,168,75,0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--uc-primary);
          font-size: 18px;
          flex-shrink: 0;
        }
        .uc-contact-label { font-size: 12px; color: #8b949e; margin-bottom: 2px; }
        .uc-contact-value { font-size: 15px; font-weight: 600; color: #24292e; }

        /* ===== FOOTER ===== */
        .uc-footer {
          background: #0d1117;
          color: #8b949e;
          padding: 48px 40px 24px;
        }
        .uc-footer-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        .uc-footer-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .uc-footer-logo img { height: 40px; border-radius: 6px; }
        .uc-footer-logo-text { font-size: 18px; font-weight: 800; color: var(--uc-primary); }
        .uc-footer-desc { font-size: 14px; line-height: 1.7; color: #656d76; }
        .uc-footer-heading { font-size: 13px; font-weight: 700; color: #d0d7de; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
        .uc-footer-link { display: block; color: #656d76; text-decoration: none; font-size: 14px; margin-bottom: 8px; transition: color 0.2s; }
        .uc-footer-link:hover { color: var(--uc-primary); }
        .uc-footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding-top: 24px;
          border-top: 1px solid #21262d;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          flex-wrap: wrap;
          gap: 10px;
        }

        /* ===== STATUS PAGE ===== */
        .uc-status-box {
          background: #fff;
          border: 2px solid #e1e4e8;
          border-radius: 16px;
          padding: 32px;
          max-width: 600px;
          margin: 0 auto;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          .uc-nav { padding: 0 20px; }
          .uc-nav-links { display: none; }
          .uc-section { padding: 60px 20px; }
          .uc-form-row { grid-template-columns: 1fr; }
          .uc-contact-grid { grid-template-columns: 1fr; }
          .uc-footer-grid { grid-template-columns: 1fr 1fr; }
          .uc-wizard-body { padding: 20px; }
        }
        @media (max-width: 480px) {
          .uc-footer-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ===== NAVBAR ===== */}
      <nav className={`uc-nav ${scrolled ? "scrolled" : ""}`} style={{ background: scrolled ? undefined : "linear-gradient(180deg, rgba(13,17,23,0.9) 0%, transparent 100%)" }}>
        <div className="uc-nav-inner">
          <Link href="/public-site" className="uc-nav-logo">
            <img src={siteLogo} alt={siteTitle} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <span className="uc-nav-logo-text">{siteTitle}</span>
          </Link>

          <ul className="uc-nav-links">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`uc-nav-link ${l.label === "Members" ? "uc-nav-cta" : ""} ${pathname === l.href ? "active" : ""}`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* WhatsApp CTA */}
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="uc-btn-whatsapp" style={{ fontSize: "13px", padding: "8px 16px", display: "none" }}>
            <i className="fab fa-whatsapp"></i> WhatsApp
          </a>
        </div>
      </nav>

      {/* Page content */}
      <main>{children}</main>

      {/* Floating WhatsApp button */}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "fixed",
          bottom: "28px",
          right: "28px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "#25D366",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "26px",
          boxShadow: "0 8px 32px rgba(37,211,102,0.4)",
          zIndex: 9999,
          textDecoration: "none",
          transition: "transform 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <i className="fab fa-whatsapp"></i>
      </a>

      {/* Footer */}
      <footer className="uc-footer">
        <div className="uc-footer-grid">
          <div>
            <div className="uc-footer-logo">
              <img src={siteLogo} alt={siteTitle} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <span className="uc-footer-logo-text">{siteTitle}</span>
            </div>
            <p className="uc-footer-desc">
              Book your Umrah cab online. Cheap, reliable transport services across Saudi Arabia — Jeddah Airport to Makkah, Madinah, and beyond.
            </p>
          </div>
          <div>
            <div className="uc-footer-heading">Quick Links</div>
            <Link href="/public-site" className="uc-footer-link">Home</Link>
            <Link href="/public-site/booking-status" className="uc-footer-link">Booking Status</Link>
            <Link href="/public-site#contact" className="uc-footer-link">Contact Us</Link>
            <Link href="/public-site/signup" className="uc-footer-link">Members</Link>
          </div>
          <div>
            <div className="uc-footer-heading">Services</div>
            <span className="uc-footer-link">Jeddah Airport Transfers</span>
            <span className="uc-footer-link">Makkah ↔ Madinah</span>
            <span className="uc-footer-link">Ziyarah Tours</span>
            <span className="uc-footer-link">VIP Vehicles</span>
          </div>
          <div>
            <div className="uc-footer-heading">Contact</div>
            <span className="uc-footer-link">{sitePhone}</span>
            <span className="uc-footer-link">{siteEmail}</span>
            <span className="uc-footer-link" style={{ fontSize: "12px" }}>{siteAddress}</span>
          </div>
        </div>
        <div className="uc-footer-bottom">
          <span>Copyright © 2018–2026 {siteTitle}. All Rights Reserved.</span>
          <span>Powered by UmrahCab Platform v2.0</span>
        </div>
      </footer>
    </div>
  );
}
