"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/umrahcab";
const IMAGE_BASE = API_URL.split("/api/")[0] || "http://localhost:8000";

export default function CompanyHeader() {
  const { sidebarOpen, setSidebarOpen, companyLogout, companyUser } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <header className="admin-header">
      {/* Left side: Hamburger */}
      <div className="header-left">
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="sidebar-toggle-btn"
          title="Toggle Sidebar"
        >
          <i className="fas fa-bars"></i>
        </button>
 
        {/* Portal Indicator */}
        <div style={{ marginLeft: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ background: "rgba(212, 175, 55, 0.15)", color: "#d4af37", border: "1px solid rgba(212, 175, 55, 0.3)", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" }}>
            B2B Portal
          </span>
          <span style={{ color: "#64748b", fontWeight: "600", fontSize: "14px" }}>
            {isMounted && companyUser?.name}
          </span>
        </div>
      </div>
 
      {/* Right side: User Profile Action */}
      <div className="header-right">
        <div className="user-profile-wrapper">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="user-profile-btn"
            title="User Settings"
            style={{ color: "#d4af37", width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", padding: 0 }}
          >
            {(isMounted && companyUser?.logo_path) ? (
              <img src={`${IMAGE_BASE}/${companyUser.logo_path}`} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <i className="fas fa-user-circle" style={{ fontSize: "24px" }}></i>
            )}
          </button>
 
          {profileDropdownOpen && (
            <div className="profile-dropdown-menu">
              <div className="dropdown-header-info">
                <strong>{(isMounted && companyUser?.name) ? companyUser.name : "B2B Agent"}</strong>
                <span className="user-role">Agent Username: {isMounted && companyUser?.agent_username}</span>
              </div>
              <hr />
              <button
                onClick={() => {
                  companyLogout();
                  setProfileDropdownOpen(false);
                }}
                className="dropdown-item-btn logout-item"
              >
                <i className="fas fa-right-from-bracket"></i>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
