"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/umrahcab";
const IMAGE_BASE = API_URL.split("/api/")[0] || "http://localhost:8000";

interface MenuItem {
  name: string;
  icon: string;
  color?: string;
  href?: string;
  submenu?: { name: string; href: string }[];
}

export default function CompanySidebar() {
  const pathname = usePathname();
  const { companyLogout, sidebarOpen, companyUser } = useAuth();
  
  // Track open submenu states (Accordion behavior - only one open at a time)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const toggleSubmenu = (name: string) => {
    setOpenSubmenu((prev) => (prev === name ? null : name));
  };

  const menuItems: MenuItem[] = [
    { name: "Agent Dashboard", icon: "fa-gauge-high", color: "#6366f1", href: "/company/dashboard" },
    {
      name: "My Bookings",
      icon: "fa-calendar-check",
      color: "#f59e0b",
      submenu: [
        { name: "Create Booking", href: "/company/bookings/add" },
        { name: "View All Bookings", href: "/company/bookings" },
        { name: "Current Bookings", href: "/company/bookings?filter=current" },
        { name: "Upcoming Bookings", href: "/company/bookings?filter=upcoming" },
        { name: "Cancelled Bookings", href: "/company/bookings?filter=cancelled" },
      ],
    },
    {
      name: "My Customers",
      icon: "fa-users",
      color: "#10b981",
      submenu: [
        { name: "View All", href: "/company/customers" },
      ],
    },
    {
      name: "Fares & Rates",
      icon: "fa-tags",
      color: "#d4af37",
      submenu: [
        { name: "Routes & Fare List", href: "/company/routes-fare" },
        { name: "Calendar Routes Fare", href: "/company/calendar-fare" },
      ],
    },
    { name: "Invoices", icon: "fa-file-invoice", color: "#ef4444", href: "/company/invoices" },
    { name: "Ledgers", icon: "fa-book", color: "#d946ef", href: "/company/ledger" },
    { name: "Payments", icon: "fa-money-bill-transfer", color: "#22c55e", href: "/company/payments" },
    { name: "Agent Report", icon: "fa-chart-line", color: "#3b82f6", href: "/company/reports" },
  ];

  // Check if a route is active
  const isRouteActive = (href: string, item?: MenuItem) => {
    if (pathname === href) return true;
    if (pathname.startsWith(href + "/")) {
      if (item?.submenu) {
        const hasBetterMatch = item.submenu.some(
          (sub) => sub.href !== href && (pathname === sub.href || pathname.startsWith(sub.href + "/"))
        );
        if (hasBetterMatch) return false;
      }
      return true;
    }
    return false;
  };

  // Auto-open submenu based on current pathname
  useEffect(() => {
    let activeItemName: string | null = null;
    menuItems.forEach((item) => {
      if (item.submenu) {
        const hasActiveChild = item.submenu.some((sub) =>
          isRouteActive(sub.href, item)
        );
        if (hasActiveChild) {
          activeItemName = item.name;
        }
      }
    });
    if (activeItemName) {
      setOpenSubmenu(activeItemName);
    }
  }, [pathname]);

  return (
    <div className={`admin-sidebar ${!sidebarOpen ? "collapsed" : "mobile-open"}`} style={{ background: "#0f172a" }}>
      {/* Sidebar Top: Logo Block */}
      <div className="sidebar-logo-container" style={{ borderBottom: "1px solid #1e293b" }}>
        <img src="/logo2.png" alt="Logo" className="sidebar-logo" />
        <span style={{ color: "#d4af37", fontWeight: "700", fontSize: "14px", marginLeft: "10px" }}>B2B Agent</span>
      </div>

      {/* Profile Card */}
      <div className="sidebar-profile-card" style={{ background: "#1e293b", margin: "15px", borderRadius: "10px" }}>
        <div className="profile-info">
          <div className="profile-avatar" style={{ background: companyUser?.logo_path ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #d4af37 0%, #b48a1d 100%)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {companyUser?.logo_path ? (
              <img src={`${IMAGE_BASE}/${companyUser.logo_path}`} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <i className="fas fa-handshake" style={{ color: "#0f172a" }}></i>
            )}
          </div>
          <span className="profile-name" style={{ color: "#ffffff" }}>{companyUser?.name || "B2B Agent"}</span>
        </div>
        <button onClick={companyLogout} className="logout-btn" title="Sign Out" style={{ color: "#f43f5e" }}>
          <i className="fas fa-right-from-bracket"></i>
        </button>
      </div>

      {/* Sidebar Navigation Links */}
      <div className="sidebar-nav">
        {menuItems.map((item, idx) => {
          const hasSubmenu = !!item.submenu;
          const isOpen = openSubmenu === item.name;
          const isActive = item.href ? isRouteActive(item.href, item) : false;
          const hasActiveChild = item.submenu?.some((sub) =>
            isRouteActive(sub.href, item)
          );

          return (
            <div key={idx} className="nav-item-group">
              {hasSubmenu ? (
                <>
                  <div
                    onClick={() => toggleSubmenu(item.name)}
                    className={`nav-item ${isOpen ? "submenu-open" : ""} ${
                      hasActiveChild ? "active" : ""
                    }`}
                    style={{ color: "#94a3b8" }}
                  >
                    <div className="nav-item-left">
                      <i
                        className={`fa-solid ${item.icon} nav-icon`}
                        style={item.color ? { color: item.color } : undefined}
                      ></i>
                      <span className="nav-item-text">{item.name}</span>
                    </div>
                    <i
                      className={`fas fa-chevron-down nav-arrow ${
                        isOpen ? "rotated" : ""
                      }`}
                    ></i>
                  </div>
                  <div className={`submenu-list ${isOpen ? "open" : ""}`} style={{ background: "#1e293b" }}>
                    <div className="submenu-wrapper">
                      {item.submenu?.map((sub, sIdx) => {
                        const isSubActive = isRouteActive(sub.href, item);
                        return (
                          <Link
                            key={sIdx}
                            href={sub.href}
                            className={`submenu-item ${
                              isSubActive ? "active" : ""
                            }`}
                            style={{ color: isSubActive ? "#ffffff" : "#94a3b8" }}
                          >
                            {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <Link
                  href={item.href || "/company/dashboard"}
                  className={`nav-item ${isActive ? "active" : ""}`}
                  style={{ color: isActive ? "#ffffff" : "#94a3b8" }}
                >
                  <div className="nav-item-left">
                    <i
                      className={`fa-solid ${item.icon} nav-icon`}
                      style={item.color ? { color: item.color } : undefined}
                    ></i>
                    <span className="nav-item-text">{item.name}</span>
                  </div>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
