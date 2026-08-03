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
  facebook_link?: string;
  instagram_link?: string;
  twitter_link?: string;
  website_logo?: string;
  favicon?: string;
  ride_notification_enabled?: string;
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

  return (
    <WebsiteSettingsContext.Provider value={{ settings, loading, refetchSettings: fetchSettings }}>
      {children}
    </WebsiteSettingsContext.Provider>
  );
};

export const useWebsiteSettings = () => useContext(WebsiteSettingsContext);
