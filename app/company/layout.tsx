"use client";

import React, { useState, useEffect } from "react";
import CompanySidebar from "@/components/CompanySidebar";
import CompanyHeader from "@/components/CompanyHeader";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { api } from "@/utils/api";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen, setSidebarOpen } = useAuth();
  const pathname = usePathname();
  const [websiteSettings, setWebsiteSettings] = useState<any>(null);

  // Fetch website settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const data = await api.getWebsiteSettings();
        if (data) {
          setWebsiteSettings(data);
        }
      } catch (err) {
        console.warn("Could not load dynamic website settings in company", err);
      }
    }
    fetchSettings();
  }, []);

  // Dynamically update document title & favicon
  useEffect(() => {
    if (websiteSettings?.site_title) {
      document.title = `${websiteSettings.site_title} - Agent Portal`;
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

  // Route transition states
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setLoading(true);
    setProgress(30);

    const timer1 = setTimeout(() => setProgress(60), 150);
    const timer2 = setTimeout(() => setProgress(85), 350);
    const timer3 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 150);
    }, 550);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pathname]);

  if (pathname === "/company/login") {
    return <>{children}</>;
  }

  return (
    <div className="admin-layout" style={{ display: "flex", minHeight: "100vh", position: "relative" }}>
      {/* Top progress bar loader */}
      {loading && (
        <div
          className="route-loader-bar"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "3px",
            background: "linear-gradient(90deg, #b48a1d 0%, #d4af37 50%, #b48a1d 100%)",
            zIndex: 99999,
            width: `${progress}%`,
            transition: "width 0.2s ease, opacity 0.1s ease",
            boxShadow: "0 0 8px rgba(212, 175, 55, 0.6)",
          }}
        />
      )}

      {/* Sidebar navigation */}
      <CompanySidebar />

      {/* Main panel */}
      <div
        className="admin-main"
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          minWidth: 0,
        }}
      >
        {/* Top Header */}
        <CompanyHeader />

        {/* Dynamic page content */}
        <main className="admin-content-area" style={{ position: "relative" }}>
          {loading && (
            <div className="page-transition-loader">
              <div className="spinner-gold"></div>
            </div>
          )}
          <div style={{ opacity: loading ? 0.35 : 1, transition: "opacity 0.25s ease" }}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="mobile-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
