"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  useGetPriceListQuery,
  useUpdatePriceListMutation,
  useApplyBulkPriceListMutation,
  useCreatePriceListMutation,
  useDeletePriceListMutation,
} from "@/store/api/priceListApi";
import { useGetFleetQuery } from "@/store/api/fleetApi";

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

function getVehiclePriceInfo(b: any, key: string) {
  let price = 0;
  let dates = "2026-06-01 to 2026-08-31";
  
  if (key === "sedan") {
    price = b.sedan_price ?? 300;
    dates = b.sedan_dates || "2026-06-01 to 2026-08-31";
  } else if (key === "van") {
    price = b.van_price ?? 500;
    dates = b.van_dates || "2026-06-01 to 2026-08-31";
  } else if (key === "suv") {
    price = b.suv_price ?? 700;
    dates = b.suv_dates || "2026-06-01 to 2026-08-31";
  } else if (key === "coach") {
    price = b.coach_price ?? 1200;
    dates = b.coach_dates || "2026-06-01 to 2026-08-31";
  }
  
  const parts = dates.split(" to ");
  return {
    price: String(price),
    from: parts[0] || "2026-06-01",
    to: parts[1] || "2026-08-31"
  };
}

export default function PriceListMatrix() {
  const { extrasUnlocked } = useAuth();
  const router = useRouter();

  const { data: fleetResponse } = useGetFleetQuery(undefined);
  const fleetList = Array.isArray(fleetResponse)
    ? fleetResponse
    : (fleetResponse && typeof fleetResponse === "object" && Array.isArray((fleetResponse as any).data)
        ? (fleetResponse as any).data
        : []);

  const activeVehicles = React.useMemo(() => {
    if (fleetList.length > 0) {
      return fleetList.map((f: any) => {
        const modelLower = f.model.toLowerCase();
        let dbField = "sedan";
        if (modelLower.includes("staria") || modelLower.includes("starex") || modelLower.includes("hiace") || modelLower.includes("van")) {
          dbField = "van";
        } else if (modelLower.includes("yukon") || modelLower.includes("suv") || modelLower.includes("gmc")) {
          dbField = "suv";
        } else if (modelLower.includes("coaster") || modelLower.includes("bus") || modelLower.includes("coach")) {
          dbField = "coach";
        } else if (modelLower.includes("sedan")) {
          dbField = "sedan";
        }
        
        return {
          id: String(f.id),
          key: dbField,
          name: f.model,
          isCore: true
        };
      });
    }
    
    return [
      { id: "sedan", key: "sedan", name: "Sedan (Core)", isCore: true },
      { id: "staria", key: "van", name: "Hyundai Staria (Core)", isCore: true },
      { id: "starex", key: "van", name: "Hyundai Starex (Core)", isCore: true },
      { id: "yukon", key: "suv", name: "GMC XL Yukon (Core)", isCore: true },
      { id: "hiace", key: "van", name: "Hiace Grand Cabin (Core)", isCore: true },
      { id: "coaster", key: "coach", name: "Coaster (Core)", isCore: true },
      { id: "bus", key: "coach", name: "Bus (Core)", isCore: true },
      { id: "luxury_bus", key: "coach", name: "Luxury Bus (Core)", isCore: true },
    ];
  }, [fleetList]);

  // Redirect if extras not unlocked
  useEffect(() => {
    const savedExtras = typeof window !== "undefined" ? localStorage.getItem("umrahcab_extras_unlocked") : null;
    if (!extrasUnlocked && savedExtras !== "true") {
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
  const [createPriceList] = useCreatePriceListMutation();
  const [deletePriceList] = useDeletePriceListMutation();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoute, setNewRoute] = useState("");

  const handleCreateRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoute.trim()) {
      showToast("Please enter a route name.", "error");
      return;
    }
    try {
      await createPriceList({
        route: newRoute.trim(),
        sedan_price: 300,
        sedan_dates: "2026-06-01 to 2026-08-31",
        suv_price: 700,
        suv_dates: "2026-06-01 to 2026-08-31",
        van_price: 500,
        van_dates: "2026-06-01 to 2026-08-31",
        coach_price: 1200,
        coach_dates: "2026-06-01 to 2026-08-31",
      }).unwrap();
      
      showToast("New route package added successfully!", "success");
      setNewRoute("");
      setShowAddModal(false);
    } catch (err: any) {
      console.error(err);
      showToast(err?.data?.message || "Failed to add route package.", "error");
    }
  };

  const handleDeleteRoute = async (id: string, routeName: string) => {
    if (!confirm(`Are you sure you want to delete route "${routeName}"?`)) {
      return;
    }
    try {
      await deletePriceList(parseInt(id)).unwrap();
      showToast(`Route "${routeName}" deleted successfully!`, "success");
    } catch (err: any) {
      console.error(err);
      showToast(err?.data?.message || "Failed to delete route.", "error");
    }
  };

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
        const prices: Record<string, PriceCell> = {};
        
        activeVehicles.forEach((vehicle: any) => {
          prices[vehicle.id] = getVehiclePriceInfo(b, vehicle.key);
        });

        return {
          id: String(b.id),
          englishName: b.route,
          urduName: b.route.includes("Airport") ? "ایئرپورٹ ٹرانسپورٹ" : "ہوٹل ٹرانسپورٹ",
          shortCode: b.route.split(" To ").map((s: string) => s.substring(0, 3).toUpperCase()).join("-"),
          prices
        };
      });
      setPackages(mapped);
      setTotalRecords(total);
      setLastPage(lastPg);
    }
  }, [priceListData, activeVehicles]);

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
        
        const updatePayload: any = { id: routeId };
        
        activeVehicles.forEach((vehicle: any) => {
          const priceCell = pkg.prices[vehicle.id];
          if (priceCell) {
            if (vehicle.key === "sedan") {
              updatePayload.sedan_price = parseFloat(priceCell.price || "300");
              updatePayload.sedan_dates = `${priceCell.from} to ${priceCell.to}`;
            } else if (vehicle.key === "van") {
              updatePayload.van_price = parseFloat(priceCell.price || "500");
              updatePayload.van_dates = `${priceCell.from} to ${priceCell.to}`;
            } else if (vehicle.key === "suv") {
              updatePayload.suv_price = parseFloat(priceCell.price || "700");
              updatePayload.suv_dates = `${priceCell.from} to ${priceCell.to}`;
            } else if (vehicle.key === "coach") {
              updatePayload.coach_price = parseFloat(priceCell.price || "1200");
              updatePayload.coach_dates = `${priceCell.from} to ${priceCell.to}`;
            }
          }
        });

        await updatePriceList(updatePayload).unwrap();
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
          <button onClick={() => setShowAddModal(true)} className="form-btn-back" style={{ background: "#10b981", color: "#ffffff", fontWeight: "700", border: "none" }}>
            <i className="fas fa-plus"></i>
            <span>Add Route Package</span>
          </button>
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
                  {activeVehicles.map((vehicle: any) => (
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
                      <div className="package-name-cell" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", width: "100%" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span className="package-english" style={{ color: "#2563eb", fontWeight: "700" }}>{pkg.englishName}</span>
                          <span className="package-short" style={{ background: "#e5e7eb", color: "#4b5563", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", display: "inline-block", width: "fit-content" }}>{pkg.shortCode}</span>
                          <span className="package-urdu">{pkg.urduName}</span>
                        </div>
                        <button 
                           onClick={() => handleDeleteRoute(pkg.id, pkg.englishName)}
                           title="Delete Route"
                           style={{ background: "#fee2e2", border: "none", borderRadius: "6px", color: "#dc2626", width: "26px", height: "26px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <i className="fas fa-trash-can" style={{ fontSize: "12px" }}></i>
                        </button>
                      </div>
                    </td>

                    {/* Pricing and Date cells */}
                    {activeVehicles.map((vehicle: any) => {
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
                      colSpan={activeVehicles.length + 1}
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
      {/* Add Route Package Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "500px", margin: "20px", borderTop: "6px solid #2563eb", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                <i className="fas fa-route" style={{ marginRight: "8px", color: "#2563eb" }}></i> Add New Route Package
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "transparent", border: "none", fontSize: "18px", cursor: "pointer", color: "#94a3b8" }}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateRouteSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label">Route Name *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-map-pin form-icon" style={{ color: "#2563eb" }}></i>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Jeddah Airport To Makkah Hotel"
                    value={newRoute}
                    onChange={(e) => setNewRoute(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <small style={{ color: "#64748b", display: "block", marginTop: "5px" }}>
                  Example format: <strong>From City To To City</strong> (e.g. Makkah Hotel To Madinah Hotel)
                </small>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background: "transparent", color: "#64748b", border: "1px solid #cbd5e1",
                    borderRadius: "6px", padding: "8px 20px", fontSize: "13px", fontWeight: "600", cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit" style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", width: "auto" }}>
                  Add Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
