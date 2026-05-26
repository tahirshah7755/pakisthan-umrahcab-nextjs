"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function PackageManagementPage() {
  const router = useRouter();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px", maxWidth: "1000px", margin: "0 auto", padding: "10px" }}>
      {/* Header Card */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #065f46 0%, #059669 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Route Trip Packages</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Setup standard transportation routes, codes, and target statuses.</p>
        </div>
        <button 
          onClick={() => router.push("/admin/extras")} 
          style={{ background: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", padding: "10px 18px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <i className="fas fa-arrow-left"></i>
          <span>Back to Utilities</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="table-card" style={{ background: "#ffffff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
        <div className="table-responsive">
          <table className="db-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Route ID</th>
                <th>English Description</th>
                <th>Urdu Mapping</th>
                <th>Unique Code</th>
                <th>Package Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700 }}>#PKG-01</td>
                <td style={{ fontWeight: 600 }}>Jeddah Airport to Makkah Hotel</td>
                <td style={{ fontFamily: "inherit" }}>جدہ ایئرپورٹ سے مکہ ہوٹل</td>
                <td>
                  <span className="status-pill active" style={{ background: "#f1f5f9", color: "#334155", padding: "4px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>
                    JED-MAK-STD
                  </span>
                </td>
                <td>
                  <span className="status-pill completed" style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: "600" }}>
                    Core Route
                  </span>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>#PKG-03</td>
                <td style={{ fontWeight: 600 }}>Jeddah Airport to Madinah Hotel</td>
                <td style={{ fontFamily: "inherit" }}>جدہ ایئرپورٹ سے مدینہ ہوٹل</td>
                <td>
                  <span className="status-pill active" style={{ background: "#f1f5f9", color: "#334155", padding: "4px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>
                    JED-MED-STD
                  </span>
                </td>
                <td>
                  <span className="status-pill completed" style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: "600" }}>
                    Core Route
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
