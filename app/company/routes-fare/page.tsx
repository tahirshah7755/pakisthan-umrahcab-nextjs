"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { useRouter } from "next/navigation";

interface PriceCell {
  price: string;
  from: string;
  to: string;
}

interface VehicleCol {
  id: string;
  name: string;
  model: string;
}

interface PackageRow {
  id: string;
  englishName: string;
  urduName: string;
  shortCode: string;
  prices: Record<string, PriceCell>;
}

const getVehiclePrice = (b: any, modelName: string) => {
  const defaultDates = b.sedan_dates || "2026-06-01 to 2026-10-31";
  
  if (b.custom_prices && typeof b.custom_prices === 'object') {
    const custom = b.custom_prices[modelName] || b.custom_prices[modelName.toLowerCase()];
    if (custom !== undefined && custom !== null) {
      if (typeof custom === 'object') {
        const price = custom.price !== undefined ? custom.price : 0;
        const from = custom.from || defaultDates.split(" to ")[0] || "2026-06-01";
        const to = custom.to || defaultDates.split(" to ")[1] || "2026-10-31";
        return { price: String(price), from, to };
      } else {
        const price = custom;
        const from = defaultDates.split(" to ")[0] || "2026-06-01";
        const to = defaultDates.split(" to ")[1] || "2026-10-31";
        return { price: String(price), from, to };
      }
    }
  }

  const mLower = modelName.toLowerCase();
  let price = 0;
  if (mLower.includes("gmc") || mLower.includes("yukon") || mLower.includes("suv")) {
    price = b.suv_price || 600;
  } else if (mLower.includes("staria") || mLower.includes("starex") || mLower.includes("hiace") || mLower.includes("van")) {
    price = b.van_price || 299;
  } else if (mLower.includes("coaster") || mLower.includes("bus") || mLower.includes("coach")) {
    price = b.coach_price || 549;
  } else {
    price = b.sedan_price || 249;
  }

  const parts = defaultDates.split(" to ");
  return {
    price: String(price),
    from: parts[0] || "2026-06-01",
    to: parts[1] || "2026-10-31"
  };
};

export default function RoutesFarePage() {
  const router = useRouter();
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [vehicles, setVehicles] = useState<VehicleCol[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch dynamic fleet & prices on mount
  useEffect(() => {
    const loadFares = async () => {
      try {
        setLoading(true);
        const [fleetRes, priceListData] = await Promise.all([
          api.getFleet(),
          api.getPriceList()
        ]);

        let resolvedVehicles: VehicleCol[] = [];
        const rawFleet = Array.isArray(fleetRes) ? fleetRes : (fleetRes?.data && Array.isArray(fleetRes.data) ? fleetRes.data : []);
        
        if (rawFleet.length > 0) {
          resolvedVehicles = rawFleet.map((f: any) => ({
            id: (f.model || f.name || "").toLowerCase().replace(/[^a-z0-9]/g, "_"),
            name: f.model || f.name || "Vehicle",
            model: f.model || f.name || "Vehicle"
          }));
        } else {
          resolvedVehicles = [
            { id: "gmc", name: "GMC", model: "GMC" },
            { id: "staria", name: "Hyundai Staria", model: "Hyundai Staria" },
            { id: "hiace", name: "Toyota Hiace", model: "Toyota Hiace" },
            { id: "coaster", name: "Toyota Coaster", model: "Toyota Coaster" },
            { id: "camry", name: "Toyota Camry", model: "Toyota Camry" },
          ];
        }
        setVehicles(resolvedVehicles);

        if (priceListData && Array.isArray(priceListData)) {
          const mapped = priceListData.map((b: any) => {
            const pricesMap: Record<string, PriceCell> = {};
            resolvedVehicles.forEach((v) => {
              pricesMap[v.id] = getVehiclePrice(b, v.model);
            });
            
            return {
              id: String(b.id),
              englishName: b.route,
              urduName: b.route.includes("Airport") ? "ایئرپورٹ ٹرانسپورٹ" : "ہوٹل ٹرانسپورٹ",
              shortCode: b.route.split(" To ").map((s: string) => s.substring(0, 3).toUpperCase()).join("-"),
              prices: pricesMap
            };
          });
          setPackages(mapped);
        }
      } catch (err) {
        console.error("Failed to load prices", err);
      } finally {
        setLoading(false);
      }
    };
    loadFares();
  }, []);

  const filteredPackages = packages.filter((pkg) =>
    pkg.englishName.toLowerCase().includes(search.toLowerCase()) ||
    pkg.shortCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header Banner */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Routes & Fares List</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>View standard pricing and fares for all transport routes and vehicle models.</p>
        </div>
        <button onClick={() => router.push("/company/dashboard")} className="form-btn-back" style={{ background: "#ffffff", color: "#0f172a" }}>
          <i className="fas fa-arrow-left"></i>
          <span>Dashboard</span>
        </button>
      </div>

      {/* Search Filter */}
      <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: "10px" }}>
        <i className="fas fa-search" style={{ color: "#d4af37", fontSize: "18px" }}></i>
        <input
          type="text"
          placeholder="Search routes by name or route code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", outline: "none" }}
        />
      </div>

      {/* Grid Table */}
      <div style={{ background: "#ffffff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#64748b" }}>
            <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #d4af37", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", margin: "0 auto 12px auto" }}></div>
            <p style={{ fontWeight: "600" }}>Loading routes and fares...</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
              <thead>
                <tr style={{ background: "#0f172a", borderBottom: "2px solid #cbd5e1" }}>
                  <th style={{ padding: "16px 20px", textAlign: "left", color: "#ffffff", fontWeight: "700", width: "250px", position: "sticky", left: 0, background: "#0f172a", zIndex: 10 }}>Route Name</th>
                  {vehicles.map((vehicle) => (
                    <th key={vehicle.id} style={{ padding: "16px 20px", textAlign: "center", color: "#ffffff", fontWeight: "700" }}>
                      {vehicle.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPackages.map((pkg) => (
                  <tr key={pkg.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 20px", position: "sticky", left: 0, background: "#ffffff", zIndex: 9, borderRight: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>{pkg.englishName}</span>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <span style={{ background: "rgba(212, 175, 55, 0.1)", color: "#b48a1d", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "700" }}>{pkg.shortCode}</span>
                          <span style={{ color: "#94a3b8", fontSize: "12px" }}>{pkg.urduName}</span>
                        </div>
                      </div>
                    </td>
                    {vehicles.map((vehicle) => {
                      const priceCell = pkg.prices[vehicle.id] || { price: "N/A", from: "", to: "" };
                      return (
                        <td key={vehicle.id} style={{ padding: "16px 20px", textAlign: "center" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                            <span style={{ fontWeight: "700", color: "#16a34a", fontSize: "16px" }}>
                              {priceCell.price !== "N/A" ? `SR ${priceCell.price}` : "N/A"}
                            </span>
                            {priceCell.price !== "N/A" && (
                              <span style={{ fontSize: "10px", color: "#64748b", background: "#f8fafc", padding: "2px 6px", borderRadius: "4px" }}>
                                {priceCell.from} to {priceCell.to}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {filteredPackages.length === 0 && (
                  <tr>
                    <td colSpan={vehicles.length + 1} style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontWeight: "500" }}>
                      No routes found matching search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
}
