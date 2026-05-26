"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";

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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
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

  useEffect(() => {
    async function loadPrices() {
      try {
        const data = await api.getPriceList();
        if (data && data.length > 0) {
          const mapped = data.map((b: any) => {
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
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (extrasUnlocked) {
      loadPrices();
    }
  }, [extrasUnlocked]);

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

  const applyBulkDates = () => {
    if (!validFrom || !validTo) {
      showToast("Please select both 'Valid From' and 'Valid To' dates.", "error");
      return;
    }

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

    showToast("Date validity applied across the entire pricing matrix!", "success");
  };

  const savePricingMatrix = async () => {
    try {
      for (const pkg of packages) {
        const routeId = parseInt(pkg.id);
        if (isNaN(routeId)) continue;
        
        await api.updatePriceList(routeId, {
          sedan_price: parseFloat(pkg.prices.sedan?.price || "300"),
          sedan_dates: `${pkg.prices.sedan?.from} to ${pkg.prices.sedan?.to}`,
          suv_price: parseFloat(pkg.prices.yukon?.price || "700"),
          suv_dates: `${pkg.prices.yukon?.from} to ${pkg.prices.yukon?.to}`,
          van_price: parseFloat(pkg.prices.staria?.price || "500"),
          van_dates: `${pkg.prices.staria?.from} to ${pkg.prices.staria?.to}`,
          coach_price: parseFloat(pkg.prices.coaster?.price || "1200"),
          coach_dates: `${pkg.prices.coaster?.from} to ${pkg.prices.coaster?.to}`,
        });
      }
      showToast("Standard Price Matrix updated successfully on Laravel backend!", "success");
    } catch (err) {
      console.error(err);
      showToast("Error updating standard matrix.", "error");
    }
  };

  // Filter package rows based on search
  const filteredPackages = packages.filter((pkg) =>
    pkg.englishName.toLowerCase().includes(search.toLowerCase()) ||
    pkg.shortCode.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="matrix-header-banner">
        <div>
          <h2>Standard Price List Setup</h2>
          <p>Update standard pricing for all vehicle models and route packages.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={savePricingMatrix} className="form-btn-back" style={{ background: "#1f6f8b" }}>
            <i className="fas fa-floppy-disk"></i>
            <span>Save Matrix Pricing</span>
          </button>
          <button onClick={() => router.push("/admin/extras")} className="form-btn-back">
            <i className="fas fa-arrow-left"></i>
            <span>Back to Utilities</span>
          </button>
        </div>
      </div>

      {/* Date Validity Tool */}
      <div className="matrix-tool-card">
        <div className="tool-title-group">
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
          <button onClick={applyBulkDates} className="tool-btn-apply">
            <i className="fas fa-circle-check"></i>
            <span>Apply Period to Entire Matrix</span>
          </button>
        </div>
        <div className="tool-help-text">
          <i className="fas fa-circle-info"></i> Replaces all dates inside the matrix below.
        </div>
      </div>

      {/* Search Filter */}
      <div className="matrix-search-card">
        <div className="matrix-search-input-wrapper">
          <i className="fas fa-search matrix-search-icon"></i>
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
        <div className="matrix-table-wrapper">
          <table className="matrix-table">
            <thead>
              <tr>
                <th>Route Package</th>
                {VEHICLES.map((vehicle) => (
                  <th key={vehicle.id} className={vehicle.isCore ? "col-header-core" : ""}>
                    <span>{vehicle.name}</span>
                    {vehicle.isCore && (
                      <span className="core-badge">
                        <i className="fas fa-star"></i>Core Vehicle
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPackages.map((pkg) => (
                <tr key={pkg.id}>
                  {/* Sticky leftmost column */}
                  <td>
                    <div className="package-name-cell">
                      <span className="package-english">{pkg.englishName}</span>
                      <span className="package-short">{pkg.shortCode}</span>
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
                            <span style={{ fontSize: "11px", position: "absolute", left: "6px", fontWeight: "700", color: "#64748b" }}>SR</span>
                            <input
                              type="text"
                              className="cell-price-input"
                              value={priceCell.price}
                              onChange={(e) => handlePriceChange(pkg.id, vehicle.id, e.target.value)}
                              style={{ paddingLeft: "24px" }}
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
              {filteredPackages.length === 0 && (
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
      </div>
    </div>
  );
}
