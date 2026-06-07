"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface MenuItem {
  name: string;
  icon: string;
  color?: string;
  href?: string;
  submenu?: { name: string; href: string }[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, sidebarOpen, user } = useAuth();
  
  // Track open submenu states
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    Customers: false,
    Bookings: false,
    Services: false,
    Flights: false,
    Trains: false,
  });

  const toggleSubmenu = (name: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const menuItems: MenuItem[] = [
    { name: "Central Hub", icon: "fa-house", color: "#3b82f6", href: "/admin/hub" },
    { name: "Dashboard", icon: "fa-gauge-high", color: "#6366f1", href: "/admin/dashboard" },
    { name: "Reminders", icon: "fa-bell", color: "#fbbf24", href: "/admin/reminders" },
    {
      name: "Customers",
      icon: "fa-users",
      color: "#10b981",
      submenu: [
        { name: "View All", href: "/admin/customers" },
        { name: "Add New", href: "/admin/customers/add" },
      ],
    },
    {
      name: "Bookings",
      icon: "fa-calendar-check",
      color: "#f59e0b",
      submenu: [
        { name: "View All", href: "/admin/bookings" },
        { name: "Add New", href: "/admin/bookings/add" },
      ],
    },
    {
      name: "Services",
      icon: "fa-hand-holding-heart",
      color: "#ec4899",
      submenu: [
        { name: "View All", href: "/admin/services" },
        { name: "Add New", href: "/admin/services/add" },
        { name: "Service Items Catalogue", href: "/admin/services/items" },
      ],
    },
    { name: "Companies", icon: "fa-building-user", color: "#8b5cf6", href: "/admin/companies" },
    {
      name: "Flights",
      icon: "fa-plane",
      color: "#06b6d4",
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
      submenu: [
        { name: "View All", href: "/admin/trains" },
        { name: "Add New", href: "/admin/trains/add" },
      ],
    },
    { name: "Agent Follow-ups", icon: "fa-headset", color: "#14b8a6", href: "/admin/agent-followups" },
    { name: "Balance Statement", icon: "fa-file-invoice-dollar", color: "#f97316", href: "/admin/balance" },
    { name: "Invoices", icon: "fa-file-invoice", color: "#ef4444", href: "/admin/invoices" },
    { name: "Ledgers", icon: "fa-book", color: "#d946ef", href: "/admin/ledgers" },
    { name: "General Payments", icon: "fa-money-bill-transfer", color: "#22c55e", href: "/admin/payments" },
    { name: "Price List", icon: "fa-tags", color: "#fb923c", href: "/admin/extras/price-list" },
    { name: "Company Performance", icon: "fa-chart-pie", color: "#0ea5e9", href: "/admin/performance" },
    { name: "Document Scanner", icon: "fa-file-export", color: "#3b82f6", href: "/admin/scanner" },
    { name: "Shortcuts", icon: "fa-keyboard", color: "#475569", href: "/admin/shortcuts" },
  ];

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
    setOpenSubmenus((prev) => {
      const updated = { ...prev };
      let changed = false;
      menuItems.forEach((item) => {
        if (item.submenu) {
          const hasActiveChild = item.submenu.some((sub) =>
            isRouteActive(sub.href, item)
          );
          if (hasActiveChild && !prev[item.name]) {
            updated[item.name] = true;
            changed = true;
          }
        }
      });
      return changed ? updated : prev;
    });
  }, [pathname]);

  return (
    <div className={`admin-sidebar ${!sidebarOpen ? "collapsed" : "mobile-open"}`}>
      {/* Sidebar Top: Logo Block */}
      <div className="sidebar-logo-container">
        <img src="/logo2.png" alt="Logo" className="sidebar-logo" />
      </div>

      {/* Profile Card */}
      <div className="sidebar-profile-card">
        <div className="profile-info">
          <div className="profile-avatar">
            <i className="fas fa-user-tie"></i>
          </div>
          <span className="profile-name">{user?.name || user?.username || "umrahcab"}</span>
        </div>
        <button onClick={logout} className="logout-btn" title="Sign Out">
          <i className="fas fa-right-from-bracket"></i>
        </button>
      </div>

      {/* Sidebar Navigation Links */}
      <div className="sidebar-nav">
        {menuItems.map((item, idx) => {
          const hasSubmenu = !!item.submenu;
          const isOpen = openSubmenus[item.name] || false;
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
                  {isOpen && (
                    <div className="submenu-list">
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
                  )}
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
