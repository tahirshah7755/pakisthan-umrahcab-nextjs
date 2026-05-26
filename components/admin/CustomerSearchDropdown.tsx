"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/utils/api";

interface CustomerSearchDropdownProps {
  selectedCustomer: any | null;
  onSelectCustomer: (customer: any) => void;
  label?: string;
  required?: boolean;
  themeColor?: string;
  placeholder?: string;
}

export default function CustomerSearchDropdown({
  selectedCustomer,
  onSelectCustomer,
  label = "Search Customer",
  required = true,
  themeColor = "#7c3aed",
  placeholder = "Search for a customer...",
}: CustomerSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [search]);

  // Fetch customers
  useEffect(() => {
    if (!isOpen) return;

    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const data = await api.getCustomers(search, undefined, page, 10);
        let newItems: any[] = [];
        if (data && Array.isArray(data)) {
          newItems = data;
        } else if (data && data.data && Array.isArray(data.data)) {
          newItems = data.data;
        }

        if (newItems.length < 10) {
          setHasMore(false);
        }

        setCustomersList((prev) => {
          if (page === 1) {
            return newItems;
          } else {
            const existingIds = new Set(prev.map((item) => item.id));
            const uniqueNewItems = newItems.filter((item) => !existingIds.has(item.id));
            return [...prev, ...uniqueNewItems];
          }
        });
      } catch (err) {
        console.error("Autocomplete customer search failed:", err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(fetchCustomers, page === 1 ? 300 : 0);
    return () => clearTimeout(delayDebounceFn);
  }, [search, page, isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "flex", flexDirection: "column", gap: "8px" }}>
      <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "14px", color: "#475569" }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      <div className="form-input-wrapper">
        <i className="fas fa-user form-icon" style={{ zIndex: 10, color: selectedCustomer ? themeColor : "#94a3b8" }}></i>
        <div
          className="form-input"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            background: "#fff",
            minHeight: "45px",
            paddingLeft: "45px",
            paddingRight: "15px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px"
          }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span style={{ color: selectedCustomer ? "#0f172a" : "#94a3b8", fontWeight: selectedCustomer ? "600" : "400" }}>
            {selectedCustomer
              ? `${selectedCustomer.name} (${selectedCustomer.company} - ${selectedCustomer.custom_id || `#CST-${selectedCustomer.id}`})`
              : placeholder}
          </span>
          <i className={`fas fa-chevron-${isOpen ? "up" : "down"}`} style={{ color: "#94a3b8", fontSize: "12px" }}></i>
        </div>
      </div>

      {isOpen && (
        <div
          className="dropdown-panel"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
            zIndex: 100,
            marginTop: "5px",
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}
        >
          <div style={{ position: "relative" }}>
            <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "14px" }}></i>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: "35px", height: "38px" }}
              placeholder="Type name, company, ID to search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div
            style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}
            onScroll={(e) => {
              const target = e.currentTarget;
              if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
                if (!loading && hasMore) {
                  setPage((prev) => prev + 1);
                }
              }
            }}
          >
            {loading && customersList.length === 0 ? (
              <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: "6px" }}></i> Loading customers...
              </div>
            ) : customersList.length === 0 ? (
              <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                No customers found matching "{search}"
              </div>
            ) : (
              <>
                {customersList.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      background: selectedCustomer && String(c.id) === String(selectedCustomer.id) ? "#f1f5f9" : "transparent",
                      color: "#1e293b",
                      fontSize: "13px",
                      fontWeight: "500"
                    }}
                    onClick={() => {
                      onSelectCustomer(c);
                      setIsOpen(false);
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={(e) => e.currentTarget.style.background = selectedCustomer && String(c.id) === String(selectedCustomer.id) ? "#f1f5f9" : "transparent"}
                  >
                    <div style={{ fontWeight: "700" }}>{c.name}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                      {c.company} • {c.custom_id || `#CST-${c.id}`} • {c.contact}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ padding: "8px 12px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: "6px" }}></i> Loading more...
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
