"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/utils/api";

export interface WebsiteSettings {
  site_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  whatsapp_link?: string;
  whatsapp_link_pak?: string;
  facebook_link?: string;
  instagram_link?: string;
  twitter_link?: string;
  website_logo?: string;
  favicon?: string;
  ride_notification_enabled?: string;
  hero_title?: string;
  hero_desc?: string;
  feature_1?: string;
  feature_2?: string;
  feature_3?: string;
  booking_title?: string;
  booking_subtitle?: string;
  app_title?: string;
  app_desc?: string;
  app_store_link?: string;
  play_store_link?: string;
  contact_title?: string;
  contact_desc?: string;
  homepage_offers?: string;
  hero_bg_image?: string;
}

interface WebsiteSettingsContextType {
  settings: WebsiteSettings | null;
  loading: boolean;
  refetchSettings: () => Promise<void>;
}

const WebsiteSettingsContext = createContext<WebsiteSettingsContextType>({
  settings: null,
  loading: true,
  refetchSettings: async () => {},
});

export const WebsiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await api.getWebsiteSettings();
      if (data) {
        setSettings(data);
        if (typeof window !== "undefined") {
          (window as any).__WEBSITE_SETTINGS__ = data;
        }
      }
    } catch (err) {
      console.warn("Could not fetch website settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Dynamically update document title, favicon, and SEO meta tags globally across all pages
  useEffect(() => {
    if (typeof window !== "undefined" && settings) {
      if (settings.site_title) {
        document.title = settings.site_title;
      }
      if (settings.favicon) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = settings.favicon;
      }
      if (settings.meta_description) {
        let metaDesc = document.querySelector("meta[name='description']") as HTMLMetaElement;
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.name = 'description';
          document.getElementsByTagName('head')[0].appendChild(metaDesc);
        }
        metaDesc.content = settings.meta_description;
      }
      if (settings.meta_keywords) {
        let metaKw = document.querySelector("meta[name='keywords']") as HTMLMetaElement;
        if (!metaKw) {
          metaKw = document.createElement('meta');
          metaKw.name = 'keywords';
          document.getElementsByTagName('head')[0].appendChild(metaKw);
        }
        metaKw.content = settings.meta_keywords;
      }
    }
  }, [settings]);

  return (
    <WebsiteSettingsContext.Provider value={{ settings, loading, refetchSettings: fetchSettings }}>
      {loading ? (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "#0d1117",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999999,
            fontFamily: "'Inter', 'Public Sans', system-ui, sans-serif",
          }}
        >
          <div style={{ position: "relative", width: "64px", height: "64px", marginBottom: "20px" }}>
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                border: "4px solid rgba(212, 175, 55, 0.15)",
                borderRadius: "50%",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                border: "4px solid transparent",
                borderTopColor: "#d4af37",
                borderRadius: "50%",
                animation: "spinGlobalSettings 1s linear infinite",
              }}
            />
          </div>
          <h3
            style={{
              color: "#d4af37",
              fontSize: "18px",
              fontWeight: 700,
              margin: "0 0 6px 0",
              letterSpacing: "0.5px",
            }}
          >
            Loading System Settings...
          </h3>
          <p style={{ color: "#8b949e", fontSize: "12px", margin: 0, letterSpacing: "0.3px" }}>
            Initializing system configuration & brand assets
          </p>
          <style>{`
            @keyframes spinGlobalSettings {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        children
      )}
    </WebsiteSettingsContext.Provider>
  );
};

export const useWebsiteSettings = () => useContext(WebsiteSettingsContext);
