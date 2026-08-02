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

        /* ===== LOGIN DROPDOWN ===== */
        .uc-dropdown {
          position: relative;
          display: inline-block;
        }
        .uc-dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: #161b22;
          border: 1px solid rgba(200, 168, 75, 0.4);
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.6);
          min-width: 210px;
          padding: 8px 0;
          display: none;
          z-index: 1001;
        }
        .uc-dropdown:hover .uc-dropdown-menu,
        .uc-dropdown:focus-within .uc-dropdown-menu {
          display: block;
        }
        .uc-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          color: #d0d7de;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          transition: background 0.2s, color 0.2s;
        }
        .uc-dropdown-item:hover {
          background: rgba(200, 168, 75, 0.15);
          color: var(--uc-primary);
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

        /* ===== CAROUSEL & SLIDER ===== */
        .uc-carousel-wrapper {
          position: relative;
          width: 100%;
          overflow: hidden;
          touch-action: pan-y;
        }
        .uc-slide {
          display: none;
          animation: fadeInSlide 0.5s ease-out;
        }
        .uc-slide.active { display: block; }
        @keyframes fadeInSlide {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .uc-slider-nav-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(22, 27, 34, 0.8);
          border: 1px solid rgba(200, 168, 75, 0.4);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
        }
        .uc-slider-nav-btn:hover {
          background: var(--uc-primary);
          color: #000;
          border-color: var(--uc-primary);
        }
        .uc-slide-pill {
          height: 8px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
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

        /* ===== FULL MOBILE & TABLET RESPONSIVENESS ===== */
        .uc-mobile-toggle {
          display: none;
          background: none;
          border: none;
          color: var(--uc-primary);
          font-size: 22px;
          cursor: pointer;
          padding: 8px;
        }

        .uc-mobile-menu {
          position: fixed;
          top: 70px;
          left: 0;
          right: 0;
          background: rgba(13, 17, 23, 0.98);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(200, 168, 75, 0.3);
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 999;
          box-shadow: 0 15px 35px rgba(0,0,0,0.6);
          animation: slideDown 0.25s ease-out;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .uc-mobile-menu .uc-nav-link {
          font-size: 15px;
          padding: 10px 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
        }

        .uc-mobile-login-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 10px;
          padding-top: 14px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        @media (max-width: 992px) {
          .uc-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
            padding: 0 20px !important;
          }
          .uc-contact-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }

        @media (max-width: 768px) {
          .uc-nav { padding: 0 16px; }
          .uc-nav-links { display: none; }
          .uc-mobile-toggle { display: block; }
          .uc-hero {
            padding-top: 80px;
            min-height: auto;
            padding-bottom: 40px;
          }
          .uc-section { padding: 32px 16px; }
          .uc-section-title { font-size: 22px !important; }
          .uc-section-subtitle { font-size: 13px !important; margin-bottom: 20px !important; }
          .uc-form-row { grid-template-columns: 1fr; }
          .uc-footer-grid { grid-template-columns: 1fr 1fr; gap: 24px; }
          .uc-footer { padding: 36px 20px 20px; }
          .uc-wizard-wrap {
            border-radius: 16px;
            margin: 0 4px;
          }
          .uc-wizard-body { padding: 16px; }
          .uc-wizard-steps {
            display: flex;
            flex-wrap: nowrap;
            overflow-x: auto;
            background: #0d1117;
            border-bottom: 1px solid rgba(200, 168, 75, 0.3);
            padding: 6px;
            gap: 4px;
          }
          .uc-wizard-step {
            flex: 1;
            padding: 8px 4px;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 5px;
            font-size: 11px;
            font-weight: 600;
            color: #8b949e;
            border-radius: 8px;
            border-bottom: none;
            white-space: nowrap;
            transition: all 0.2s ease;
          }
          .uc-wizard-step.active {
            color: #000;
            background: var(--uc-primary);
            border-bottom-color: transparent;
            font-weight: 700;
            box-shadow: 0 2px 10px rgba(200,168,75,0.3);
          }
          .uc-wizard-step .step-num {
            width: 18px;
            height: 18px;
            font-size: 10px;
            margin-bottom: 0;
            background: rgba(255,255,255,0.2);
            color: inherit;
          }
          .uc-wizard-step.active .step-num {
            background: #000;
            color: var(--uc-primary);
          }
          .uc-summary-grid {
            grid-template-columns: 1fr !important;
          }
          .uc-status-box {
            padding: 20px;
            margin: 0 16px;
          }
        }

        /* ===== NATIVE MOBILE APP BOTTOM TAB BAR ===== */
        .uc-mobile-bottom-nav {
          display: none;
        }

        @media (max-width: 768px) {
          .uc-mobile-bottom-nav {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 64px;
            background: rgba(13, 17, 23, 0.96);
            backdrop-filter: blur(20px);
            border-top: 1px solid rgba(200, 168, 75, 0.35);
            z-index: 9999;
            justify-content: space-around;
            align-items: center;
            box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.5);
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
          .uc-mobile-tab {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            color: #8b949e;
            text-decoration: none;
            font-size: 10px;
            font-weight: 600;
            flex: 1;
            height: 100%;
            transition: all 0.2s ease;
            border: none;
            background: none;
            cursor: pointer;
          }
          .uc-mobile-tab i {
            font-size: 18px;
            transition: transform 0.2s ease, color 0.2s ease;
          }
          .uc-mobile-tab.active, .uc-mobile-tab:hover {
            color: var(--uc-primary);
          }
          .uc-mobile-tab.active i {
            transform: translateY(-2px);
            color: var(--uc-primary);
          }
          main {
            padding-bottom: 70px;
          }
          .uc-floating-wa {
            bottom: 78px !important;
            right: 18px !important;
            width: 48px !important;
            height: 48px !important;
            font-size: 22px !important;
            box-shadow: 0 6px 20px rgba(37,211,102,0.5) !important;
          }
        }

        @media (max-width: 480px) {
          .uc-footer-grid { grid-template-columns: 1fr; }
          .uc-nav-logo-text { font-size: 16px; }
          .uc-nav-logo img { height: 36px; width: 36px; }
          .uc-wizard-step {
            flex: 1 1 100%;
          }
          .uc-offer-vehicle {
            font-size: 26px;
          }
          .uc-offer-price {
            font-size: 34px;
          }
          .uc-app-btns {
            flex-direction: column;
          }
        }
      `}</style>

      {/* ===== NAVBAR ===== */}
      <nav className={`uc-nav ${scrolled ? "scrolled" : ""}`} style={{ background: scrolled ? undefined : "linear-gradient(180deg, rgba(13,17,23,0.9) 0%, transparent 100%)" }}>
        <div className="uc-nav-inner">
          <Link href="/" className="uc-nav-logo">
            <img src={siteLogo} alt={siteTitle} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <span className="uc-nav-logo-text">{siteTitle}</span>
          </Link>

          <ul className="uc-nav-links">
            <li>
              <Link href="/" className={`uc-nav-link ${pathname === "/" || pathname === "/public-site" ? "active" : ""}`}>
                Home
              </Link>
            </li>
            <li>
              <Link href="/public-site/booking-status" className={`uc-nav-link ${pathname === "/public-site/booking-status" ? "active" : ""}`}>
                Booking Status
              </Link>
            </li>
            <li>
              <Link href="/#contact" className="uc-nav-link">
                Contact Us
              </Link>
            </li>
            <li>
              <Link href="/public-site/signup" className={`uc-nav-link ${pathname === "/public-site/signup" ? "active" : ""}`}>
                Members
              </Link>
            </li>
            <li className="uc-dropdown">
              <button className="uc-nav-link uc-nav-cta" style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", border: "none" }}>
                <i className="fas fa-sign-in-alt"></i> Login Portals <i className="fas fa-chevron-down" style={{ fontSize: "10px" }}></i>
              </button>
              <div className="uc-dropdown-menu">
                <Link href="/login" className="uc-dropdown-item">
                  <i className="fas fa-shield-alt" style={{ color: "#c8a84b", width: "16px" }}></i>
                  <span>Admin Login</span>
                </Link>
                <Link href="/company/login" className="uc-dropdown-item">
                  <i className="fas fa-building" style={{ color: "#3b82f6", width: "16px" }}></i>
                  <span>B2B Agent Login</span>
                </Link>
                <Link href="/driver/login" className="uc-dropdown-item">
                  <i className="fas fa-car" style={{ color: "#10b981", width: "16px" }}></i>
                  <span>Driver Login</span>
                </Link>
              </div>
            </li>
          </ul>

          {/* Mobile Hamburger Toggle */}
          <button
            className="uc-mobile-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            <i className={menuOpen ? "fas fa-times" : "fas fa-bars"}></i>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Navigation Menu */}
      {menuOpen && (
        <div className="uc-mobile-menu">
          <Link href="/" onClick={() => setMenuOpen(false)} className={`uc-nav-link ${pathname === "/" || pathname === "/public-site" ? "active" : ""}`}>
            <i className="fas fa-home" style={{ marginRight: "10px", color: "var(--uc-primary)" }}></i> Home
          </Link>
          <Link href="/public-site/booking-status" onClick={() => setMenuOpen(false)} className={`uc-nav-link ${pathname === "/public-site/booking-status" ? "active" : ""}`}>
            <i className="fas fa-search" style={{ marginRight: "10px", color: "var(--uc-primary)" }}></i> Booking Status
          </Link>
          <Link href="/#contact" onClick={() => setMenuOpen(false)} className="uc-nav-link">
            <i className="fas fa-envelope" style={{ marginRight: "10px", color: "var(--uc-primary)" }}></i> Contact Us
          </Link>
          <Link href="/public-site/signup" onClick={() => setMenuOpen(false)} className={`uc-nav-link ${pathname === "/public-site/signup" ? "active" : ""}`}>
            <i className="fas fa-user-plus" style={{ marginRight: "10px", color: "var(--uc-primary)" }}></i> Members Signup
          </Link>

          <div className="uc-mobile-login-box">
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--uc-primary)", textTransform: "uppercase", letterSpacing: "1px", paddingLeft: "10px" }}>
              Portal Logins
            </span>
            <Link href="/login" onClick={() => setMenuOpen(false)} className="uc-dropdown-item">
              <i className="fas fa-shield-alt" style={{ color: "#c8a84b", width: "16px" }}></i>
              <span>Admin Login</span>
            </Link>
            <Link href="/company/login" onClick={() => setMenuOpen(false)} className="uc-dropdown-item">
              <i className="fas fa-building" style={{ color: "#3b82f6", width: "16px" }}></i>
              <span>B2B Agent Login</span>
            </Link>
            <Link href="/driver/login" onClick={() => setMenuOpen(false)} className="uc-dropdown-item">
              <i className="fas fa-car" style={{ color: "#10b981", width: "16px" }}></i>
              <span>Driver Login</span>
            </Link>
          </div>
        </div>
      )}

      {/* Page content */}
      <main>{children}</main>

      {/* ===== NATIVE MOBILE APP BOTTOM TAB BAR ===== */}
      <div className="uc-mobile-bottom-nav">
        <Link href="/" className={`uc-mobile-tab ${pathname === "/" || pathname === "/public-site" ? "active" : ""}`}>
          <i className="fas fa-home"></i>
          <span>Home</span>
        </Link>
        <a href="/#booking-wizard" className="uc-mobile-tab">
          <i className="fas fa-taxi"></i>
          <span>Book Ride</span>
        </a>
        <Link href="/public-site/booking-status" className={`uc-mobile-tab ${pathname === "/public-site/booking-status" ? "active" : ""}`}>
          <i className="fas fa-search-location"></i>
          <span>Status</span>
        </Link>
        <button className="uc-mobile-tab" onClick={() => setMenuOpen(!menuOpen)}>
          <i className="fas fa-key"></i>
          <span>Logins</span>
        </button>
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="uc-mobile-tab" style={{ color: "#25D366" }}>
          <i className="fab fa-whatsapp"></i>
          <span>WhatsApp</span>
        </a>
      </div>

      {/* Floating WhatsApp button */}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="uc-floating-wa"
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
            <Link href="/" className="uc-footer-link">Home</Link>
            <Link href="/public-site/booking-status" className="uc-footer-link">Booking Status</Link>
            <Link href="/#contact" className="uc-footer-link">Contact Us</Link>
            <Link href="/public-site/signup" className="uc-footer-link">Members</Link>
          </div>
          <div>
            <div className="uc-footer-heading">Portal Logins</div>
            <Link href="/login" className="uc-footer-link">Admin Login</Link>
            <Link href="/company/login" className="uc-footer-link">B2B Agent Login</Link>
            <Link href="/driver/login" className="uc-footer-link">Driver Login</Link>
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
