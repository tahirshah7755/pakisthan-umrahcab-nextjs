"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/utils/api";

export default function WebsiteSettingsPage() {
  const [settings, setSettings] = useState<any>({
    site_title: "",
    meta_description: "",
    meta_keywords: "",
    contact_email: "",
    contact_phone: "",
    contact_address: "",
    whatsapp_link: "",
    whatsapp_link_pak: "",
    facebook_link: "",
    instagram_link: "",
    twitter_link: "",
    ride_notification_enabled: "1",
    hero_title: "",
    hero_desc: "",
    feature_1: "",
    feature_2: "",
    feature_3: "",
    booking_title: "",
    booking_subtitle: "",
    app_title: "",
    app_desc: "",
    app_store_link: "",
    play_store_link: "",
    contact_title: "",
    contact_desc: "",
    homepage_offers: "[]",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [heroBgFile, setHeroBgFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [faviconPreview, setFaviconPreview] = useState<string>("");
  const [heroBgPreview, setHeroBgPreview] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"general" | "contact" | "social" | "notifications" | "homepage" | "offers">("general");
  const [offersList, setOffersList] = useState<any[]>([]);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await api.getWebsiteSettings();
        if (data) {
          setSettings({
            site_title: data.site_title || "",
            meta_description: data.meta_description || "",
            meta_keywords: data.meta_keywords || "",
            contact_email: data.contact_email || "",
            contact_phone: data.contact_phone || "",
            contact_address: data.contact_address || "",
            whatsapp_link: data.whatsapp_link || "",
            whatsapp_link_pak: data.whatsapp_link_pak || "",
            facebook_link: data.facebook_link || "",
            instagram_link: data.instagram_link || "",
            twitter_link: data.twitter_link || "",
            ride_notification_enabled: data.ride_notification_enabled !== undefined ? String(data.ride_notification_enabled) : "1",
            hero_title: data.hero_title || "",
            hero_desc: data.hero_desc || "",
            feature_1: data.feature_1 || "",
            feature_2: data.feature_2 || "",
            feature_3: data.feature_3 || "",
            booking_title: data.booking_title || "",
            booking_subtitle: data.booking_subtitle || "",
            app_title: data.app_title || "",
            app_desc: data.app_desc || "",
            app_store_link: data.app_store_link || "",
            play_store_link: data.play_store_link || "",
            contact_title: data.contact_title || "",
            contact_desc: data.contact_desc || "",
            homepage_offers: data.homepage_offers || "[]",
          });
          if (data.website_logo) setLogoPreview(data.website_logo);
          if (data.favicon) setFaviconPreview(data.favicon);
          if (data.hero_bg_image) setHeroBgPreview(data.hero_bg_image);
          
          try {
            setOffersList(JSON.parse(data.homepage_offers || "[]"));
          } catch (e) {
            setOffersList([]);
          }
        }
      } catch (err) {
        setErrorMessage("Failed to load website settings.");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "favicon" | "hero_bg") => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (type === "logo") {
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
      } else if (type === "favicon") {
        setFaviconFile(file);
        setFaviconPreview(URL.createObjectURL(file));
      } else if (type === "hero_bg") {
        setHeroBgFile(file);
        setHeroBgPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const formData = new FormData();
      Object.keys(settings).forEach((key) => {
        if (key === "homepage_offers") {
          formData.append("homepage_offers", JSON.stringify(offersList));
        } else {
          formData.append(key, settings[key]);
        }
      });

      if (logoFile) {
        formData.append("website_logo", logoFile);
      }
      if (faviconFile) {
        formData.append("favicon", faviconFile);
      }
      if (heroBgFile) {
        formData.append("hero_bg_image", heroBgFile);
      }

      const res = await api.updateWebsiteSettings(formData);
      if (res.success) {
        setSuccessMessage("Website settings updated successfully! Changes are applied immediately.");
        // Refresh settings
        const refreshed = await api.getWebsiteSettings();
        if (refreshed) {
          setSettings({
            site_title: refreshed.site_title || "",
            meta_description: refreshed.meta_description || "",
            meta_keywords: refreshed.meta_keywords || "",
            contact_email: refreshed.contact_email || "",
            contact_phone: refreshed.contact_phone || "",
            contact_address: refreshed.contact_address || "",
            whatsapp_link: refreshed.whatsapp_link || "",
            whatsapp_link_pak: refreshed.whatsapp_link_pak || "",
            facebook_link: refreshed.facebook_link || "",
            instagram_link: refreshed.instagram_link || "",
            twitter_link: refreshed.twitter_link || "",
            ride_notification_enabled: refreshed.ride_notification_enabled !== undefined ? String(refreshed.ride_notification_enabled) : "1",
            hero_title: refreshed.hero_title || "",
            hero_desc: refreshed.hero_desc || "",
            feature_1: refreshed.feature_1 || "",
            feature_2: refreshed.feature_2 || "",
            feature_3: refreshed.feature_3 || "",
            booking_title: refreshed.booking_title || "",
            booking_subtitle: refreshed.booking_subtitle || "",
            app_title: refreshed.app_title || "",
            app_desc: refreshed.app_desc || "",
            app_store_link: refreshed.app_store_link || "",
            play_store_link: refreshed.play_store_link || "",
            contact_title: refreshed.contact_title || "",
            contact_desc: refreshed.contact_desc || "",
            homepage_offers: refreshed.homepage_offers || "[]",
          });
          if (refreshed.website_logo) setLogoPreview(refreshed.website_logo);
          if (refreshed.favicon) setFaviconPreview(refreshed.favicon);
          if (refreshed.hero_bg_image) setHeroBgPreview(refreshed.hero_bg_image);
          try {
            setOffersList(JSON.parse(refreshed.homepage_offers || "[]"));
          } catch (e) {
            setOffersList([]);
          }
        }
        // Auto dismiss success msg after 5s
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        setErrorMessage(res.error || "Failed to save website settings.");
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred while saving settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <style>{`
          @keyframes spin { 
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{ width: "45px", height: "45px", border: "4px solid #10b981", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: "16px" }} />
        <span style={{ color: "#64748b", fontSize: "14px", fontWeight: "600" }}>Loading site configurations...</span>
      </div>
    );
  }

  return (
    <div className="website-settings-page">
      <style>{`
        .website-settings-page {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .settings-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        
        .settings-header i {
          font-size: 28px;
          color: #10b981;
        }

        .settings-header h1 {
          font-size: 22px;
          font-weight: 800;
          color: #1e293b;
          margin: 0;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 24px;
        }

        @media (max-width: 968px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
        }

        .card-panel {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          padding: 24px;
          height: fit-content;
        }

        .branding-preview-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          text-align: center;
        }

        .logo-box {
          width: 100%;
          min-height: 120px;
          border: 2px dashed #cbd5e1;
          border-radius: 8px;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #f8fafc;
          position: relative;
          overflow: hidden;
          padding: 12px;
        }

        .logo-box img {
          max-height: 100px;
          object-fit: contain;
        }

        .favicon-box {
          width: 80px;
          height: 80px;
          border: 2px dashed #cbd5e1;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #f8fafc;
          position: relative;
          overflow: hidden;
        }

        .favicon-box img {
          width: 48px;
          height: 48px;
          object-fit: contain;
        }

        .upload-label {
          font-size: 12px;
          color: #4f46e5;
          font-weight: 700;
          cursor: pointer;
          margin-top: 6px;
          display: inline-block;
        }

        .upload-label:hover {
          text-decoration: underline;
        }

        .settings-tabs {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 24px;
        }

        .tab-btn {
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          border: none;
          background: transparent;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }

        .tab-btn.active {
          color: #10b981;
        }

        .tab-btn.active::after {
          content: "";
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2.5px;
          background-color: #10b981;
          border-radius: 2px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 6px;
        }

        .form-input {
          width: 100%;
          padding: 10px 12px;
          font-size: 13px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          background-color: #ffffff;
          color: #1e293b;
          outline: none;
          transition: border-color 0.15s ease-in-out;
        }

        .form-input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .form-textarea {
          width: 100%;
          min-height: 80px;
          padding: 10px 12px;
          font-size: 13px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          background-color: #ffffff;
          color: #1e293b;
          outline: none;
          resize: vertical;
          transition: border-color 0.15s ease-in-out;
        }

        .form-textarea:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 500;
        }

        .alert-success {
          background-color: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .alert-error {
          background-color: #fef2f2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }

        .save-btn {
          background-color: #10b981;
          color: #ffffff;
          font-weight: 700;
          font-size: 13px;
          padding: 10px 24px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .save-btn:hover:not(:disabled) {
          background-color: #059669;
        }

        .save-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>

      <div className="settings-header">
        <i className="fas fa-globe"></i>
        <h1>Website Global Settings</h1>
      </div>

      {successMessage && (
        <div className="alert alert-success">
          <i className="fas fa-circle-check"></i>
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-error">
          <i className="fas fa-circle-xmark"></i>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="settings-grid">
        {/* Left Column: Branding Assets */}
        <div className="card-panel">
          <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: 800, color: "#1e293b" }}>Branding Assets</h3>
          <div className="branding-preview-container">
            {/* Logo Section */}
            <div style={{ width: "100%" }}>
              <span className="form-label">Website Logo</span>
              <div className="logo-box">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Site Logo"
                    onError={() => setLogoPreview("")}
                  />
                ) : (
                  <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                    <i className="fas fa-image" style={{ fontSize: "28px", display: "block", marginBottom: "6px" }}></i>
                    No logo uploaded
                  </div>
                )}
              </div>
              <input 
                type="file" 
                id="logo-input" 
                accept="image/*" 
                onChange={(e) => handleFileChange(e, "logo")} 
                style={{ display: "none" }} 
              />
              <label htmlFor="logo-input" className="upload-label">
                <i className="fas fa-upload" style={{ marginRight: "4px" }}></i>
                Upload Logo Image
              </label>
            </div>

            {/* Favicon Section */}
            <div style={{ width: "100%", borderTop: "1px solid #f1f5f9", paddingTop: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span className="form-label" style={{ width: "100%", textAlign: "left" }}>Browser Favicon</span>
              <div className="favicon-box">
                {faviconPreview ? (
                  <img
                    src={faviconPreview}
                    alt="Site Favicon"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div style={{ color: "#94a3b8", fontSize: "11px" }}>
                    <i className="fas fa-star" style={{ fontSize: "20px" }}></i>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                id="favicon-input" 
                accept="image/x-icon,image/png" 
                onChange={(e) => handleFileChange(e, "favicon")} 
                style={{ display: "none" }} 
              />
              <label htmlFor="favicon-input" className="upload-label">
                <i className="fas fa-upload" style={{ marginRight: "4px" }}></i>
                Upload Favicon
              </label>
            </div>

            {/* Hero Slider Background Image Section */}
            <div style={{ width: "100%", borderTop: "1px solid #f1f5f9", paddingTop: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span className="form-label" style={{ width: "100%", textAlign: "left" }}>Header Slider Background Image</span>
              <div className="logo-box" style={{ minHeight: "100px", background: "#0d1117" }}>
                {heroBgPreview ? (
                  <img
                    src={heroBgPreview}
                    alt="Hero Background"
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px" }}
                    onError={() => setHeroBgPreview("")}
                  />
                ) : (
                  <div style={{ color: "#94a3b8", fontSize: "12px", textAlign: "center" }}>
                    <i className="fas fa-panorama" style={{ fontSize: "24px", display: "block", marginBottom: "4px" }}></i>
                    Default Dark Gradient
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                <input 
                  type="file" 
                  id="hero-bg-input" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, "hero_bg")} 
                  style={{ display: "none" }} 
                />
                <label htmlFor="hero-bg-input" className="upload-label">
                  <i className="fas fa-upload" style={{ marginRight: "4px" }}></i>
                  Upload Background
                </label>
                {heroBgPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setHeroBgFile(null);
                      setHeroBgPreview("");
                      setSettings((prev: any) => ({ ...prev, hero_bg_image: "" }));
                    }}
                    style={{
                      fontSize: "11px",
                      color: "#dc2626",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "700",
                      padding: 0
                    }}
                  >
                    <i className="fas fa-trash"></i> Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Configuration Options */}
        <div className="card-panel" style={{ display: "flex", flexDirection: "column" }}>
          {/* Navigation Tabs */}
          <div className="settings-tabs" style={{ flexWrap: "wrap" }}>
            <button 
              type="button" 
              className={`tab-btn ${activeTab === "general" ? "active" : ""}`}
              onClick={() => setActiveTab("general")}
            >
              <i className="fas fa-sliders" style={{ marginRight: "6px" }}></i>
              General & SEO Meta
            </button>
            <button 
              type="button" 
              className={`tab-btn ${activeTab === "contact" ? "active" : ""}`}
              onClick={() => setActiveTab("contact")}
            >
              <i className="fas fa-address-book" style={{ marginRight: "6px" }}></i>
              Contact Info
            </button>
            <button 
              type="button" 
              className={`tab-btn ${activeTab === "social" ? "active" : ""}`}
              onClick={() => setActiveTab("social")}
            >
              <i className="fas fa-hashtag" style={{ marginRight: "6px" }}></i>
              Social Links
            </button>
            <button 
              type="button" 
              className={`tab-btn ${activeTab === "notifications" ? "active" : ""}`}
              onClick={() => setActiveTab("notifications")}
            >
              <i className="fas fa-bell" style={{ marginRight: "6px" }}></i>
              Notifications
            </button>
            <button 
              type="button" 
              className={`tab-btn ${activeTab === "homepage" ? "active" : ""}`}
              onClick={() => setActiveTab("homepage")}
            >
              <i className="fas fa-house" style={{ marginRight: "6px" }}></i>
              Homepage Content
            </button>
            <button 
              type="button" 
              className={`tab-btn ${activeTab === "offers" ? "active" : ""}`}
              onClick={() => setActiveTab("offers")}
            >
              <i className="fas fa-tags" style={{ marginRight: "6px" }}></i>
              Offers & Pricing
            </button>
          </div>

          {/* Tab 1: General & SEO Meta */}
          {activeTab === "general" && (
            <div style={{ flexGrow: 1 }}>
              <div className="form-group">
                <label className="form-label">Meta Site Title</label>
                <input 
                  type="text" 
                  name="site_title" 
                  value={settings.site_title} 
                  onChange={handleChange} 
                  className="form-input" 
                  placeholder="e.g. UmrahCab - Luxury B2B & Retail Transportation"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Meta Description</label>
                <textarea 
                  name="meta_description" 
                  value={settings.meta_description} 
                  onChange={handleChange} 
                  className="form-textarea" 
                  placeholder="Enter a brief summary of the website for Google search engine results..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Meta Keywords (Comma Separated)</label>
                <input 
                  type="text" 
                  name="meta_keywords" 
                  value={settings.meta_keywords} 
                  onChange={handleChange} 
                  className="form-input" 
                  placeholder="e.g. umrah cab, jeddah to makkah taxi, saudi transport, b2b umrah"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Contact Info */}
          {activeTab === "contact" && (
            <div style={{ flexGrow: 1 }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contact Hotline Phone</label>
                  <input 
                    type="text" 
                    name="contact_phone" 
                    value={settings.contact_phone} 
                    onChange={handleChange} 
                    className="form-input" 
                    placeholder="e.g. +966 50 000 0000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Support Email</label>
                  <input 
                    type="email" 
                    name="contact_email" 
                    value={settings.contact_email} 
                    onChange={handleChange} 
                    className="form-input" 
                    placeholder="e.g. info@umrahcab.com"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">WhatsApp Direct Link (KSA/Primary Help)</label>
                <input 
                  type="text" 
                  name="whatsapp_link" 
                  value={settings.whatsapp_link} 
                  onChange={handleChange} 
                  className="form-input" 
                  placeholder="e.g. https://wa.me/966500000000"
                />
              </div>
              <div className="form-group">
                <label className="form-label">WhatsApp Direct Link (Pakistan Help)</label>
                <input 
                  type="text" 
                  name="whatsapp_link_pak" 
                  value={settings.whatsapp_link_pak} 
                  onChange={handleChange} 
                  className="form-input" 
                  placeholder="e.g. https://wa.me/923219462533"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Office Address</label>
                <textarea 
                  name="contact_address" 
                  value={settings.contact_address} 
                  onChange={handleChange} 
                  className="form-textarea" 
                  placeholder="Enter the physical office location address..."
                />
              </div>
            </div>
          )}

          {/* Tab 3: Social Media Links */}
          {activeTab === "social" && (
            <div style={{ flexGrow: 1 }}>
              <div className="form-group">
                <label className="form-label">Facebook Profile Link</label>
                <input 
                  type="text" 
                  name="facebook_link" 
                  value={settings.facebook_link} 
                  onChange={handleChange} 
                  className="form-input" 
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Instagram Handle Link</label>
                <input 
                  type="text" 
                  name="instagram_link" 
                  value={settings.instagram_link} 
                  onChange={handleChange} 
                  className="form-input" 
                  placeholder="https://instagram.com/yourhandle"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Twitter / X Profile Link</label>
                <input 
                  type="text" 
                  name="twitter_link" 
                  value={settings.twitter_link} 
                  onChange={handleChange} 
                  className="form-input" 
                  placeholder="https://x.com/yourprofile"
                />
              </div>
            </div>
          )}

          {/* Tab 4: Notifications Settings */}
          {activeTab === "notifications" && (
            <div style={{ flexGrow: 1 }}>
              <div className="form-group" style={{ background: "#f8fafc", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px" }}>
                  <div style={{ flex: 1 }}>
                     <label className="form-label" style={{ margin: 0, fontSize: "14px", fontWeight: 800 }}>Ride Notification Alerts (24 Hours Before)</label>
                     <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                       Enable/disable the dashboard ride notification alerts and real-time popups that warn when a ride starts in less than 24 hours without any driver assigned.
                     </p>
                  </div>
                  <div>
                    <select
                      name="ride_notification_enabled"
                      value={settings.ride_notification_enabled}
                      onChange={handleChange}
                      className="form-input"
                      style={{ width: "130px", fontWeight: "bold" }}
                    >
                      <option value="1">Enabled</option>
                      <option value="0">Disabled</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Homepage Content */}
          {activeTab === "homepage" && (
            <div style={{ flexGrow: 1 }}>
              <h3 style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "8px", marginBottom: "16px", fontSize: "14px", fontWeight: "bold", color: "#334155" }}>Hero & Features Section</h3>
              <div className="form-group">
                <label className="form-label">Hero Title</label>
                <input 
                  type="text" 
                  name="hero_title" 
                  value={settings.hero_title} 
                  onChange={handleChange} 
                  className="form-input" 
                  placeholder="e.g. Book now & Pay at Destination"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Hero Description</label>
                <textarea 
                  name="hero_desc" 
                  value={settings.hero_desc} 
                  onChange={handleChange} 
                  className="form-textarea" 
                  placeholder="e.g. Experience smooth and affordable transportation services..."
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Key Feature 1</label>
                  <input 
                    type="text" 
                    name="feature_1" 
                    value={settings.feature_1} 
                    onChange={handleChange} 
                    className="form-input" 
                    placeholder="e.g. Experienced, multi-lingual local drivers"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Key Feature 2</label>
                  <input 
                    type="text" 
                    name="feature_2" 
                    value={settings.feature_2} 
                    onChange={handleChange} 
                    className="form-input" 
                    placeholder="e.g. 24/7 client dispatch support"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Key Feature 3</label>
                <input 
                  type="text" 
                  name="feature_3" 
                  value={settings.feature_3} 
                  onChange={handleChange} 
                  className="form-input" 
                  placeholder="e.g. 100% sanitized, air-conditioned clean vehicles"
                />
              </div>

              <h3 style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "8px", marginTop: "24px", marginBottom: "16px", fontSize: "14px", fontWeight: "bold", color: "#334155" }}>Booking Form Header</h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Booking Section Title</label>
                  <input 
                    type="text" 
                    name="booking_title" 
                    value={settings.booking_title} 
                    onChange={handleChange} 
                    className="form-input" 
                    placeholder="e.g. Schedule Your Vehicle Online"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Booking Section Subtitle</label>
                  <input 
                    type="text" 
                    name="booking_subtitle" 
                    value={settings.booking_subtitle} 
                    onChange={handleChange} 
                    className="form-input" 
                    placeholder="e.g. Fill in the dynamic form below..."
                  />
                </div>
              </div>

              <h3 style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "8px", marginTop: "24px", marginBottom: "16px", fontSize: "14px", fontWeight: "bold", color: "#334155" }}>App Store Downloads Section</h3>
              <div className="form-group">
                <label className="form-label">App Section Title</label>
                <input 
                  type="text" 
                  name="app_title" 
                  value={settings.app_title} 
                  onChange={handleChange} 
                  className="form-input" 
                  placeholder="e.g. Download the UMRAH-CAB App Free Today"
                />
              </div>
              <div className="form-group">
                <label className="form-label">App Section Description</label>
                <textarea 
                  name="app_desc" 
                  value={settings.app_desc} 
                  onChange={handleChange} 
                  className="form-textarea" 
                  placeholder="e.g. Access rides, confirm drivers, and download vouchers..."
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Apple App Store URL</label>
                  <input 
                    type="text" 
                    name="app_store_link" 
                    value={settings.app_store_link} 
                    onChange={handleChange} 
                    className="form-input" 
                    placeholder="https://apps.apple.com/..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Google Play Store URL</label>
                  <input 
                    type="text" 
                    name="play_store_link" 
                    value={settings.play_store_link} 
                    onChange={handleChange} 
                    className="form-input" 
                    placeholder="https://play.google.com/..."
                  />
                </div>
              </div>

              <h3 style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "8px", marginTop: "24px", marginBottom: "16px", fontSize: "14px", fontWeight: "bold", color: "#334155" }}>Contact Section Banner</h3>
              <div className="form-group">
                <label className="form-label">Contact Section Title</label>
                <input 
                  type="text" 
                  name="contact_title" 
                  value={settings.contact_title} 
                  onChange={handleChange} 
                  className="form-input" 
                  placeholder="e.g. We would really love to hear from you"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Section Description</label>
                <textarea 
                  name="contact_desc" 
                  value={settings.contact_desc} 
                  onChange={handleChange} 
                  className="form-textarea" 
                  placeholder="e.g. Our support team is online 24/7..."
                />
              </div>
            </div>
          )}

          {/* Tab 6: Offers & Pricing List Builder */}
          {activeTab === "offers" && (
            <div style={{ flexGrow: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "10px", flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#334155", margin: 0 }}>Header Slider & Promo Vehicle Offers</h3>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>Set individual background images, promo routes, and vehicle pricing for each slide in the homepage header slider.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOffersList((prev) => [
                      ...prev,
                      { vehicle: "New Sedan", route: "Pickup to Dropoff", price: 300, icon: "fa-car", bg_image: "" }
                    ]);
                  }}
                  style={{
                    background: "#10b981",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 14px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <i className="fas fa-plus"></i> Add Promo Slide
                </button>
              </div>

              <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left", minWidth: "750px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "12px", fontWeight: 700, color: "#475569", width: "140px" }}>Vehicle / Slide Image</th>
                      <th style={{ padding: "12px", fontWeight: 700, color: "#475569" }}>Vehicle Class</th>
                      <th style={{ padding: "12px", fontWeight: 700, color: "#475569" }}>Route / Destination</th>
                      <th style={{ padding: "12px", fontWeight: 700, color: "#475569", width: "100px" }}>Price (SAR)</th>
                      <th style={{ padding: "12px", fontWeight: 700, color: "#475569", width: "140px" }}>Icon Type</th>
                      <th style={{ padding: "12px", fontWeight: 700, color: "#475569", width: "70px", textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offersList.map((offer, idx) => {
                      const currentBg = offer.bg_image || offer.image || "";
                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          {/* Slide Background Image Upload Column */}
                          <td style={{ padding: "10px 8px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                              <div
                                style={{
                                  width: "110px",
                                  height: "65px",
                                  borderRadius: "6px",
                                  border: "1px solid #cbd5e1",
                                  background: "#f8fafc",
                                  overflow: "hidden",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  position: "relative"
                                }}
                              >
                                {currentBg ? (
                                  <img
                                    src={currentBg}
                                    alt="Slide Background"
                                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                  />
                                ) : (
                                  <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "10px" }}>
                                    <i className="fas fa-image" style={{ fontSize: "16px", display: "block", marginBottom: "2px" }}></i>
                                    Default BG
                                  </div>
                                )}
                              </div>
                              <div style={{ display: "flex", gap: "4px" }}>
                                <input
                                  type="file"
                                  id={`offer-file-${idx}`}
                                  accept="image/*"
                                  style={{ display: "none" }}
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      const file = e.target.files[0];
                                      const reader = new FileReader();
                                      reader.onload = (re) => {
                                        const res = re.target?.result as string;
                                        const newList = [...offersList];
                                        newList[idx].bg_image = res;
                                        newList[idx].image = res;
                                        setOffersList(newList);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`offer-file-${idx}`}
                                  style={{
                                    fontSize: "10px",
                                    color: "#2563eb",
                                    background: "#eff6ff",
                                    border: "1px solid #bfdbfe",
                                    padding: "3px 6px",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontWeight: "600"
                                  }}
                                >
                                  <i className="fas fa-upload"></i> Upload
                                </label>
                                {currentBg && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newList = [...offersList];
                                      newList[idx].bg_image = "";
                                      newList[idx].image = "";
                                      setOffersList(newList);
                                    }}
                                    style={{
                                      fontSize: "10px",
                                      color: "#dc2626",
                                      background: "#fef2f2",
                                      border: "1px solid #fecaca",
                                      padding: "3px 6px",
                                      borderRadius: "4px",
                                      cursor: "pointer"
                                    }}
                                    title="Reset to default background"
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "8px" }}>
                            <input
                              type="text"
                              value={offer.vehicle || ""}
                              onChange={(e) => {
                                const newList = [...offersList];
                                newList[idx].vehicle = e.target.value;
                                setOffersList(newList);
                              }}
                              className="form-input"
                              style={{ padding: "6px 8px" }}
                              placeholder="e.g. Sedan"
                              required
                            />
                          </td>
                          <td style={{ padding: "8px" }}>
                            <input
                              type="text"
                              value={offer.route || ""}
                              onChange={(e) => {
                                const newList = [...offersList];
                                newList[idx].route = e.target.value;
                                setOffersList(newList);
                              }}
                              className="form-input"
                              style={{ padding: "6px 8px" }}
                              placeholder="e.g. Madinah to Jeddah"
                              required
                            />
                          </td>
                          <td style={{ padding: "8px" }}>
                            <input
                              type="number"
                              value={offer.price || 0}
                              onChange={(e) => {
                                const newList = [...offersList];
                                newList[idx].price = Number(e.target.value);
                                setOffersList(newList);
                              }}
                              className="form-input"
                              style={{ padding: "6px 8px" }}
                              required
                            />
                          </td>
                          <td style={{ padding: "8px" }}>
                            <select
                              value={offer.icon || "fa-car"}
                              onChange={(e) => {
                                const newList = [...offersList];
                                newList[idx].icon = e.target.value;
                                setOffersList(newList);
                              }}
                              className="form-input"
                              style={{ padding: "6px 8px", height: "36px" }}
                            >
                              <option value="fa-car">Sedan</option>
                              <option value="fa-car-side">Premium</option>
                              <option value="fa-van-shuttle">Family Van</option>
                              <option value="fa-suv">Luxury SUV</option>
                              <option value="fa-bus">Minivan / Bus</option>
                            </select>
                          </td>
                          <td style={{ padding: "8px", textAlign: "center" }}>
                            <button
                              type="button"
                              onClick={() => {
                                setOffersList((prev) => prev.filter((_, i) => i !== idx));
                              }}
                              style={{
                                background: "#fef2f2",
                                color: "#ef4444",
                                border: "1px solid #fee2e2",
                                borderRadius: "6px",
                                padding: "6px 10px",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                              title="Remove Offer"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {offersList.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
                          No custom promos configured. The site will display default route fares.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "20px", display: "flex", justifyContent: "flex-end" }}>
            <button 
              type="submit" 
              className="save-btn" 
              disabled={saving}
            >
              {saving ? (
                <>
                  <div style={{ width: "16px", height: "16px", border: "2px solid #ffffff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  Saving Changes...
                </>
              ) : (
                <>
                  <i className="fas fa-floppy-disk"></i>
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
