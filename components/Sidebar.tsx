"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";

interface MenuItem {
  name: string;
  icon: string;
  color?: string;
  href?: string;
  permissionKey?: string;
  submenu?: { name: string; href: string }[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, sidebarOpen, user } = useAuth();
  
  // Track open submenu states (Accordion behavior - only one open at a time)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("/logo2.png");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    async function fetchLogo() {
      try {
        const data = await api.getWebsiteSettings();
        if (data && data.website_logo) {
          setLogoUrl(data.website_logo);
        }
      } catch (err) {
        console.error("Failed to load sidebar logo:", err);
      }
    }
    fetchLogo();
  }, []);

  const toggleSubmenu = (name: string) => {
    setOpenSubmenu((prev) => (prev === name ? null : name));
  };

  const menuItems: MenuItem[] = [
    { name: "Central Hub", icon: "fa-house", color: "#3b82f6", href: "/admin/hub" },
    { name: "Dashboard", icon: "fa-gauge-high", color: "#6366f1", href: "/admin/dashboard" },
    { name: "Reminders", icon: "fa-bell", color: "#fbbf24", href: "/admin/reminders", permissionKey: "reminders" },
    {
      name: "Customers",
      icon: "fa-users",
      color: "#10b981",
      permissionKey: "customers",
      submenu: [
        { name: "View All", href: "/admin/customers" },
        { name: "Add New", href: "/admin/customers/add" },
      ],
    },
    {
      name: "Bookings",
      icon: "fa-calendar-check",
      color: "#f59e0b",
      permissionKey: "bookings",
      submenu: [
        { name: "View All", href: "/admin/bookings" },
        { name: "Add New", href: "/admin/bookings/add" },
      ],
    },
    { name: "Individual Orders", icon: "fa-cart-shopping", color: "#38bdf8", href: "/admin/individual-orders" },
    {
      name: "Services",
      icon: "fa-hand-holding-heart",
      color: "#ec4899",
      permissionKey: "services",
      submenu: [
        { name: "View All", href: "/admin/services" },
        { name: "Add New", href: "/admin/services/add" },
        { name: "Service Items Catalogue", href: "/admin/services/items" },
      ],
    },
    { name: "Companies", icon: "fa-building-user", color: "#8b5cf6", href: "/admin/companies", permissionKey: "companies" },
    {
      name: "Drivers Portal",
      icon: "fa-taxi",
      color: "#059669",
      permissionKey: "drivers",
      submenu: [
        { name: "Driver Registry", href: "/admin/drivers" },
        { name: "Daily Logs & Sheets", href: "/admin/driver-entries" },
      ],
    },
    { name: "Security & Clearances", icon: "fa-user-shield", color: "#4f46e5", href: "/admin/sub-admins", permissionKey: "sub_admins" },
    {
      name: "Flights",
      icon: "fa-plane",
      color: "#06b6d4",
      permissionKey: "flights",
      submenu: [
        { name: "View All", href: "/admin/flights" },
        { name: "Flights Check", href: "/admin/flights/check" },
        { name: "Add New", href: "/admin/flights/add" },
      ],
    },
    {
      name: "Trains",
      icon: "fa-train",
      color: "#f43f5e",
      permissionKey: "trains",
      submenu: [
        { name: "View All", href: "/admin/trains" },
        { name: "Add New", href: "/admin/trains/add" },
      ],
    },
    {
      name: "Hotels",
      icon: "fa-hotel",
      color: "#7c3aed",
      permissionKey: "hotels",
      submenu: [
        { name: "Hotel Directory", href: "/admin/hotels" },
        { name: "Customer Stays", href: "/admin/hotels/assignments" },
      ],
    },
    { name: "Agent Follow-ups", icon: "fa-headset", color: "#14b8a6", href: "/admin/agent-followups", permissionKey: "agent_followups" },
    { name: "Chat Support", icon: "fa-comments", color: "#60a5fa", href: "/admin/chat", permissionKey: "chat" },
    { name: "Balance Statement", icon: "fa-file-invoice-dollar", color: "#f97316", href: "/admin/balance", permissionKey: "balance" },
    { name: "Invoices", icon: "fa-file-invoice", color: "#ef4444", href: "/admin/invoices", permissionKey: "invoices" },
    { name: "Ledgers", icon: "fa-book", color: "#d946ef", href: "/admin/ledgers", permissionKey: "ledgers" },
    { name: "General Payments", icon: "fa-money-bill-transfer", color: "#22c55e", href: "/admin/payments", permissionKey: "payments" },
    { name: "Price List", icon: "fa-tags", color: "#fb923c", href: "/admin/extras/price-list", permissionKey: "services" },
    { name: "Company Performance", icon: "fa-chart-pie", color: "#0ea5e9", href: "/admin/performance", permissionKey: "companies" },
    { name: "Upload Documents", icon: "fa-cloud-arrow-up", color: "#ec4899", href: "/admin/documents/upload" },
    { name: "Shortcuts", icon: "fa-keyboard", color: "#475569", href: "/admin/shortcuts" },
    { name: "Website Settings", icon: "fa-globe", color: "#10b981", href: "/admin/website-settings" },
  ];

  // Helper to check if user has permission
  const hasPermission = (item: MenuItem) => {
    if (!user || user.role === "SUPER_ADMIN") return true;
    if (!item.permissionKey) return true;
    
    const userPerms = (user as any).permissions || {};
    const access = userPerms[item.permissionKey] || "none";
    return access !== "none";
  };

  const visibleMenuItems = menuItems.filter(hasPermission);

  // Check if a route is active (exact match or parent of a view/subpage)
  const isRouteActive = (href: string, item?: MenuItem) => {
    if (pathname === href) return true;
    if (pathname.startsWith(href + "/")) {
      // For submenus, ensure we don't match a more specific sibling route
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
    <div className={`admin-sidebar ${!sidebarOpen ? "collapsed" : "mobile-open"}`}>
      {/* Sidebar Top: Logo Block */}
      <div className="sidebar-logo-container">
        <img src={logoUrl} alt="Logo" className="sidebar-logo" onError={(e) => { (e.target as HTMLImageElement).src = "/logo2.png"; }} />
      </div>

      {/* Profile Card */}
      <div className="sidebar-profile-card">
        <div className="profile-info">
          <div className="profile-avatar">
            <i className="fas fa-user-tie"></i>
          </div>
          <span className="profile-name">{isMounted ? (user?.name || user?.username || "umrahcab") : "umrahcab"}</span>
        </div>
        <button onClick={logout} className="logout-btn" title="Sign Out">
          <i className="fas fa-right-from-bracket"></i>
        </button>
      </div>

      {/* Sidebar Navigation Links */}
      <div className="sidebar-nav">
        {visibleMenuItems.map((item, idx) => {
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
                  <div className={`submenu-list ${isOpen ? "open" : ""}`}>
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
                  href={item.href || "/admin/hub"}
                  className={`nav-item ${isActive ? "active" : ""}`}
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
