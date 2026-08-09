"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import NotificationBell from "./admin/NotificationBell";

export default function Header() {
  const { sidebarOpen, setSidebarOpen, searchQuery, setSearchQuery, logout, user } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchCategory, setSearchCategory] = useState("All Items");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const router = useRouter();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to bookings list with search query parameter or handle locally
      router.push(`/admin/bookings?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const categories = ["All Items", "Bookings", "Customers", "Services", "Invoices"];

  return (
    <header className="admin-header">
      {/* Left side: Hamburger and Search */}
      <div className="header-left">
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="sidebar-toggle-btn"
          title="Toggle Sidebar"
        >
          <i className="fas fa-bars"></i>
        </button>

        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="header-search-form">
          <div className="search-input-group">
            {/* Category Dropdown */}
            <div className="category-select-wrapper">
              <button
                type="button"
                className="category-btn"
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              >
                <span>{searchCategory}</span>
                <i className="fas fa-chevron-down dropdown-arrow-icon"></i>
              </button>
              
              {categoryDropdownOpen && (
                <div className="category-dropdown">
                  {categories.map((cat, idx) => (
                    <div
                      key={idx}
                      className="category-item"
                      onClick={() => {
                        setSearchCategory(cat);
                        setCategoryDropdownOpen(false);
                      }}
                    >
                      {cat}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input field */}
            <div className="search-input-wrapper">
              <i className="fas fa-search search-icon-inside"></i>
              <input
                type="text"
                placeholder="Quick Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-text-input"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Right side: User Profile Action */}
      <div className="header-right" style={{ gap: "16px", display: "flex", alignItems: "center" }}>
        <NotificationBell />
        <div className="user-profile-wrapper">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="user-profile-btn"
            title="User Settings"
          >
            <i className="fas fa-user-circle"></i>
          </button>

          {profileDropdownOpen && (
            <div className="profile-dropdown-menu">
              <div className="dropdown-header-info">
                <strong>{user?.name || user?.username || "hebacab"}</strong>
                <span className="user-role">Administrator</span>
              </div>
              <hr />
              <button
                onClick={() => {
                  router.push("/admin/extras");
                  setProfileDropdownOpen(false);
                }}
                className="dropdown-item-btn"
              >
                <i className="fas fa-screwdriver-wrench"></i>
                <span>Advanced Utilities</span>
              </button>
              <button
                onClick={() => {
                  logout();
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
