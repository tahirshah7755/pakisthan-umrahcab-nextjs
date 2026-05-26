"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface MenuItem {
  name: string;
  icon: string;
  href?: string;
  submenu?: { name: string; href: string }[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, sidebarOpen } = useAuth();
  
  // Track open submenu states
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    Customers: false,
    Bookings: true, // Keep Bookings open by default as shown in the screenshot
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
    { name: "Central Hub", icon: "fa-cubes", href: "/admin/hub" },
    { name: "Dashboard", icon: "fa-gauge", href: "/admin/dashboard" },
    { name: "Reminders", icon: "fa-bell", href: "/admin/reminders" },
    {
      name: "Customers",
      icon: "fa-users",
      submenu: [
        { name: "View All", href: "/admin/customers" },
        { name: "Add New", href: "/admin/customers/add" },
      ],
    },
    {
      name: "Bookings",
      icon: "fa-calendar-days",
      submenu: [
        { name: "View All", href: "/admin/bookings" },
        { name: "Add New", href: "/admin/bookings/add" },
      ],
    },
    {
      name: "Services",
      icon: "fa-hand-holding-heart",
      submenu: [
        { name: "View All", href: "/admin/services" },
        { name: "Add New", href: "/admin/services/add" },
        { name: "Service Items Catalogue", href: "/admin/services/items" },
      ],
    },
    { name: "Companies", icon: "fa-building", href: "/admin/companies" },
    {
      name: "Flights",
      icon: "fa-plane-departure",
      submenu: [
        { name: "View All", href: "/admin/flights" },
        { name: "Flights Check", href: "/admin/flights/check" },
        { name: "Add New", href: "/admin/flights/add" },
      ],
    },
    {
      name: "Trains",
      icon: "fa-train",
      submenu: [
        { name: "View All", href: "/admin/trains" },
        { name: "Add New", href: "/admin/trains/add" },
      ],
    },
    { name: "Agent Follow-ups", icon: "fa-headset", href: "/admin/agent-followups" },
    { name: "Balance Statement", icon: "fa-file-invoice-dollar", href: "/admin/balance" },
    { name: "Invoices", icon: "fa-receipt", href: "/admin/invoices" },
    { name: "Ledgers", icon: "fa-book-open", href: "/admin/ledgers" },
    { name: "General Payments", icon: "fa-money-bill-transfer", href: "/admin/payments" },
    { name: "Price List", icon: "fa-tags", href: "/admin/extras/price-list" },
    { name: "Company Performance", icon: "fa-chart-line", href: "/admin/performance" },
    { name: "Document Scanner", icon: "fa-print", href: "/admin/scanner" },
    { name: "Shortcuts", icon: "fa-keyboard", href: "/admin/shortcuts" },
  ];

  if (!sidebarOpen) return null;

  return (
    <div className="admin-sidebar">
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
          <span className="profile-name">umrahcab</span>
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
          const isActive = item.href ? pathname === item.href : false;

          return (
            <div key={idx} className="nav-item-group">
              {hasSubmenu ? (
                <>
                  <div
                    onClick={() => toggleSubmenu(item.name)}
                    className={`nav-item ${isOpen ? "submenu-open" : ""}`}
                  >
                    <div className="nav-item-left">
                      <i className={`fas ${item.icon} nav-icon`}></i>
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
                        const isSubActive = pathname === sub.href;
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
                    <i className={`fas ${item.icon} nav-icon`}></i>
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
