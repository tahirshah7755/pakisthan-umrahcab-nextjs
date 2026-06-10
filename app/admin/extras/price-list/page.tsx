"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  useGetPriceListQuery,
  useUpdatePriceListMutation,
  useApplyBulkPriceListMutation,
} from "@/store/api/priceListApi";

interface PriceCell {
  price: string;
  from: string;
  to: string;
}

interface PackageRow {
  id: string;
  englishName: string;
  urduName: string;
  shortCode: string;
  prices: Record<string, PriceCell>; // Key is vehicle ID
}

const VEHICLES = [
  { id: "sedan", name: "Sedan (Core)", isCore: true },
  { id: "staria", name: "Hyundai Staria (Core)", isCore: true },
  { id: "starex", name: "Hyundai Starex (Core)", isCore: true },
  { id: "yukon", name: "GMC XL Yukon (Core)", isCore: true },
  { id: "hiace", name: "Hiace Grand Cabin (Core)", isCore: true },
  { id: "coaster", name: "Coaster (Core)", isCore: true },
  { id: "bus", name: "Bus (Core)", isCore: true },
  { id: "luxury_bus", name: "Luxury Bus (Core)", isCore: true },
];

export default function PriceListMatrix() {
  const { extrasUnlocked } = useAuth();
  const router = useRouter();

  // Redirect if extras not unlocked
  useEffect(() => {
    if (!extrasUnlocked) {
      router.push("/admin/extras");
    }
  }, [extrasUnlocked, router]);

  // Pricing State
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [search, setSearch] = useState("");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  // Reset page on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Date Tool State
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");

  // Toast State
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const { data: priceListData, isLoading: isFetching } = useGetPriceListQuery({
    page: currentPage,
    per_page: itemsPerPage,
    search: search
  }, {
    skip: !extrasUnlocked,
  });

  const [updatePriceList, { isLoading: isUpdating }] = useUpdatePriceListMutation();
  const [applyBulkPriceList, { isLoading: isApplyingBulk }] = useApplyBulkPriceListMutation();

  useEffect(() => {
    if (!priceListData) return;

    let rawData: any[] = [];
    let total = 0;
    let lastPg = 1;

    // Handle nested data envelope
    const rootData = priceListData.data !== undefined ? priceListData.data : priceListData;

    if (rootData) {
      if (Array.isArray(rootData)) {
        rawData = rootData;
        total = rootData.length;
        lastPg = 1;
      } else if (rootData.data && Array.isArray(rootData.data)) {
        // Laravel LengthAwarePaginator structure
        rawData = rootData.data;
        total = rootData.total || 0;
        lastPg = rootData.last_page || 1;
      }
    }

    if (Array.isArray(rawData)) {
      const mapped = rawData.map((b: any) => {
        const sedanDates = b.sedan_dates || "2026-06-01 to 2026-08-31";
        const parts = sedanDates.split(" to ");
        const fromDate = parts[0] || "2026-06-01";
        const toDate = parts[1] || "2026-08-31";
        
        return {
          id: String(b.id),
          englishName: b.route,
          urduName: b.route.includes("Airport") ? "ایئرپورٹ ٹرانسپورٹ" : "ہوٹل ٹرانسپورٹ",
          shortCode: b.route.split(" To ").map((s: string) => s.substring(0, 3).toUpperCase()).join("-"),
          prices: {
            sedan: { price: String(b.sedan_price || 300), from: fromDate, to: toDate },
            staria: { price: String(b.van_price || 500), from: fromDate, to: toDate },
            starex: { price: String(b.van_price || 450), from: fromDate, to: toDate },
            yukon: { price: String(b.suv_price || 700), from: fromDate, to: toDate },
            hiace: { price: String(b.van_price || 600), from: fromDate, to: toDate },
            coaster: { price: String(b.coach_price || 1200), from: fromDate, to: toDate },
            bus: { price: String(b.coach_price || 1800), from: fromDate, to: toDate },
            luxury_bus: { price: String(b.coach_price || 2400), from: fromDate, to: toDate },
          }
        };
      });
      setPackages(mapped);
      setTotalRecords(total);
      setLastPage(lastPg);
    }
  }, [priceListData]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const handlePriceChange = (pkgId: string, vehicleId: string, val: string) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id !== pkgId) return pkg;
        return {
          ...pkg,
          prices: {
            ...pkg.prices,
            [vehicleId]: {
              ...pkg.prices[vehicleId],
              price: val,
            },
          },
        };
      })
    );
  };

  const handleDateChange = (pkgId: string, vehicleId: string, type: "from" | "to", val: string) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id !== pkgId) return pkg;
        return {
          ...pkg,
          prices: {
            ...pkg.prices,
            [vehicleId]: {
              ...pkg.prices[vehicleId],
              [type]: val,
            },
          },
        };
      })
    );
  };

  const applyBulkDates = async () => {
    if (!validFrom || !validTo) {
      showToast("Please select both 'Valid From' and 'Valid To' dates.", "error");
      return;
    }

    try {
      await applyBulkPriceList({
        start_date: validFrom,
        end_date: validTo,
      }).unwrap();

      setPackages((prev) =>
        prev.map((pkg) => {
          const updatedPrices = { ...pkg.prices };
          Object.keys(updatedPrices).forEach((vehicleId) => {
            updatedPrices[vehicleId] = {
              ...updatedPrices[vehicleId],
              from: validFrom,
              to: validTo,
            };
          });
          return {
            ...pkg,
            prices: updatedPrices,
          };
        })
      );
      showToast("Date validity applied and saved across standard pricing matrix!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to apply bulk dates to database.", "error");
    }
  };

  const savePricingMatrix = async () => {
    try {
      for (const pkg of packages) {
        const routeId = parseInt(pkg.id);
        if (isNaN(routeId)) continue;
        
        await updatePriceList({
          id: routeId,
          sedan_price: parseFloat(pkg.prices.sedan?.price || "300"),
          sedan_dates: `${pkg.prices.sedan?.from} to ${pkg.prices.sedan?.to}`,
          suv_price: parseFloat(pkg.prices.yukon?.price || "700"),
          suv_dates: `${pkg.prices.yukon?.from} to ${pkg.prices.yukon?.to}`,
          van_price: parseFloat(pkg.prices.staria?.price || "500"),
          van_dates: `${pkg.prices.staria?.from} to ${pkg.prices.staria?.to}`,
          coach_price: parseFloat(pkg.prices.coaster?.price || "1200"),
          coach_dates: `${pkg.prices.coaster?.from} to ${pkg.prices.coaster?.to}`,
        }).unwrap();
      }
      showToast("Standard Price Matrix updated successfully on Laravel backend!", "success");
    } catch (err) {
      console.error(err);
      showToast("Error updating standard matrix.", "error");
    }
  };

  // Pagination calculation
  const totalPages = lastPage;
  const paginatedPackages = packages;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  if (!extrasUnlocked) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Toast notifications */}
      {toast.show && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            <i
              className={`fas ${
                toast.type === "success"
                  ? "fa-circle-check text-success"
                  : "fa-circle-xmark text-danger"
              }`}
            ></i>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="matrix-header-banner" style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" }}>
        <div>
          <h2>Vehicle Price List</h2>
          <p>Update standard pricing for all vehicle models and route packages.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={savePricingMatrix} disabled={isUpdating} className="form-btn-back" style={{ background: "#ffffff", color: "#1d4ed8", fontWeight: "700", border: "1px solid #cbd5e1" }}>
            <i className="fas fa-floppy-disk" style={{ color: "#1d4ed8" }}></i>
            <span>{isUpdating ? "Saving Matrix..." : "Save Matrix Pricing"}</span>
          </button>
          <button onClick={() => router.push("/admin/extras")} className="form-btn-back">
            <i className="fas fa-arrow-left"></i>
            <span>Back to Utilities</span>
          </button>
        </div>
      </div>

      {/* Date Validity Tool */}
      <div className="matrix-tool-card" style={{ borderLeft: "5px solid #2563eb" }}>
        <div className="tool-title-group" style={{ color: "#2563eb" }}>
          <i className="fas fa-clock-rotate-left"></i>
          <span>Global Period Tool</span>
        </div>
        <div className="tool-input-group">
          <div className="tool-field">
            <label>Valid From</label>
            <input
              type="date"
              className="tool-date-input"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
            />
          </div>
          <div className="tool-field">
            <label>Valid To</label>
            <input
              type="date"
              className="tool-date-input"
              value={validTo}
              onChange={(e) => setValidTo(e.target.value)}
            />
          </div>
          <button onClick={applyBulkDates} disabled={isApplyingBulk} className="tool-btn-apply" style={{ background: "#2563eb" }}>
            <i className="fas fa-circle-check"></i>
            <span>{isApplyingBulk ? "Applying Period..." : "Apply Period to Entire Matrix"}</span>
          </button>
        </div>
        <div className="tool-help-text">
          <i className="fas fa-circle-info"></i> Replaces all dates inside the matrix below and saves changes.
        </div>
      </div>

      {/* Search Filter */}
      <div className="matrix-search-card">
        <div className="matrix-search-input-wrapper">
          <i className="fas fa-search matrix-search-icon" style={{ color: "#2563eb" }}></i>
          <input
            type="text"
            className="matrix-search-input"
            placeholder="Search route packages by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Matrix Table */}
      <div className="matrix-container-card">
        {isFetching ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#64748b" }}>
            <div className="spinner" style={{ borderTopColor: "#2563eb" }}></div>
            <p style={{ marginTop: "12px", fontWeight: "600" }}>Loading standard matrix pricing...</p>
          </div>
        ) : (
          <>
            <div className="matrix-table-wrapper">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th style={{ background: "#2563eb", color: "#ffffff" }}>Route Package</th>
                  {VEHICLES.map((vehicle) => (
                    <th key={vehicle.id} className={vehicle.isCore ? "col-header-core" : ""}>
                      <span>{vehicle.name}</span>
                      {vehicle.isCore && (
                        <span className="core-badge" style={{ background: "#eff6ff", color: "#2563eb" }}>
                          <i className="fas fa-star" style={{ color: "#2563eb" }}></i>Core Vehicle
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedPackages.map((pkg) => (
                  <tr key={pkg.id}>
                    {/* Sticky leftmost column */}
                    <td>
                      <div className="package-name-cell">
                        <span className="package-english" style={{ color: "#2563eb" }}>{pkg.englishName}</span>
                        <span className="package-short" style={{ background: "#e5e7eb", color: "#4b5563", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", display: "inline-block", width: "fit-content" }}>{pkg.shortCode}</span>
                        <span className="package-urdu">{pkg.urduName}</span>
                      </div>
                    </td>

                    {/* Pricing and Date cells */}
                    {VEHICLES.map((vehicle) => {
                      const priceCell = pkg.prices[vehicle.id] || { price: "", from: "", to: "" };
                      return (
                        <td key={vehicle.id}>
                          <div className="cell-price-block">
                            <div className="cell-price-input-wrapper">
                              <span style={{ fontSize: "11px", position: "absolute", left: "6px", fontWeight: "700", color: "#16a34a" }}>SR</span>
                              <input
                                type="text"
                                className="cell-price-input"
                                value={priceCell.price}
                                onChange={(e) => handlePriceChange(pkg.id, vehicle.id, e.target.value)}
                                style={{ paddingLeft: "24px", color: "#16a34a", fontWeight: "700" }}
                              />
                            </div>

                            <div className="cell-date-field">
                              <label>From</label>
                              <input
                                type="date"
                                className="cell-date-input"
                                value={priceCell.from}
                                onChange={(e) => handleDateChange(pkg.id, vehicle.id, "from", e.target.value)}
                              />
                            </div>

                            <div className="cell-date-field">
                              <label>To</label>
                              <input
                                type="date"
                                className="cell-date-input"
                                value={priceCell.to}
                                onChange={(e) => handleDateChange(pkg.id, vehicle.id, "to", e.target.value)}
                              />
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {packages.length === 0 && (
                  <tr>
                    <td
                      colSpan={VEHICLES.length + 1}
                      style={{
                        textAlign: "center",
                        padding: "40px",
                        color: "#94a3b8",
                        fontWeight: 500,
                      }}
                    >
                      No packages found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              borderTop: "1px solid #f1f5f9",
              background: "#ffffff",
              flexWrap: "wrap",
              gap: "12px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#64748b" }}>
                <span>Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    background: "#ffffff",
                    outline: "none",
                    cursor: "pointer"
                  }}
                >
                  {[5, 10, 20, 50].map((num) => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
                <span>entries</span>
                <span style={{ marginLeft: "12px" }}>
                  Showing {totalRecords === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords} entries
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    background: currentPage === 1 ? "#f8fafc" : "#ffffff",
                    color: currentPage === 1 ? "#94a3b8" : "#2563eb",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <i className="fas fa-chevron-left"></i> Prev
                </button>

                {getPageNumbers().map((pageNum, idx) => {
                  if (pageNum === "...") {
                    return (
                      <span key={`dots-${idx}`} style={{ padding: "0 8px", color: "#64748b" }}>
                        ...
                      </span>
                    );
                  }
                  const isSelected = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(Number(pageNum))}
                      style={{
                        width: "36px",
                        height: "36px",
                        border: isSelected ? "none" : "1px solid #cbd5e1",
                        borderRadius: "6px",
                        background: isSelected ? "#2563eb" : "#ffffff",
                        color: isSelected ? "#ffffff" : "#334155",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "700"
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    background: currentPage === totalPages ? "#f8fafc" : "#ffffff",
                    color: currentPage === totalPages ? "#94a3b8" : "#2563eb",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  Next <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}
