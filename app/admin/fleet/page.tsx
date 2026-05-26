"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function FleetManagementPage() {
  const router = useRouter();

  const [fleetList, setFleetList] = useState([
    { model: "Sedan (Core)", count: 25, active: 20 },
    { model: "Hyundai Staria (Core)", count: 15, active: 12 },
    { model: "GMC XL Yukon (Core)", count: 10, active: 8 },
    { model: "Coaster (Core)", count: 5, active: 4 },
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px", maxWidth: "1000px", margin: "0 auto", padding: "10px" }}>
      {/* Header Card */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Haramain Fleet Management</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Maintain active transport vehicle stock, driver capacities, and dynamic logs.</p>
        </div>
        <button 
          onClick={() => router.push("/admin/extras")} 
          style={{ background: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", padding: "10px 18px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <i className="fas fa-arrow-left"></i>
          <span>Back to Utilities</span>
        </button>
      </div>

      {/* Allocation Matrix Card */}
      <div className="form-card" style={{ background: "#ffffff", padding: "35px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "20px" }}>Active Transport Allocation Matrix</h3>
        
        <div className="table-responsive">
          <table className="db-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Vehicle Model</th>
                <th>Total Inventory Size</th>
                <th>Currently Dispatched</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {fleetList.map((f, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>
                    <i className="fas fa-bus" style={{ color: "#312e81", marginRight: "10px" }}></i>
                    {f.model}
                  </td>
                  <td style={{ fontWeight: 700 }}>{f.count} Units</td>
                  <td style={{ color: "#10b981", fontWeight: 700 }}>{f.active} Units</td>
                  <td>
                    <span className="status-pill completed" style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: "600" }}>
                      Active Operational
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
