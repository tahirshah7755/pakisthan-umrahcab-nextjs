"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useGetPriceListQuery } from "@/store/api/priceListApi";

// Helper to translate route dynamically to Urdu mapping
const translateToUrdu = (route: string) => {
  let urdu = route
    .replace(/Jeddah/gi, "جدہ")
    .replace(/Airport/gi, "ایئرپورٹ")
    .replace(/Makkah/gi, "مکہ")
    .replace(/Madinah/gi, "مدینہ")
    .replace(/Hotel/gi, "ہوٹل")
    .replace(/to/gi, "سے")
    .replace(/Station/gi, "اسٹیشن")
    .replace(/Mazarat/gi, "مزارات")
    .replace(/Transit/gi, "ٹرانزٹ");
  return urdu;
};

// Helper to generate a code dynamically
const generateRouteCode = (route: string) => {
  const words = route.split(" ");
  const parts = words.map(w => w.substring(0, 3).toUpperCase()).filter(p => p !== "TO");
  return parts.slice(0, 3).join("-");
};

export default function PackageManagementPage() {
  const router = useRouter();
  const { data: routes = [], isLoading } = useGetPriceListQuery(undefined);

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
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
            <div className="spinner" style={{ borderTopColor: "#059669" }}></div>
            <span style={{ marginLeft: "12px", color: "#64748b", fontWeight: "600" }}>Loading Routes...</span>
          </div>
        ) : (
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
                {routes.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>
                      No routes registered in the system.
                    </td>
                  </tr>
                ) : (
                  routes.map((item: any, idx: number) => (
                    <tr key={item.id || idx}>
                      <td style={{ fontWeight: 700 }}>#PKG-{String(item.id).padStart(2, "0")}</td>
                      <td style={{ fontWeight: 600 }}>{item.route}</td>
                      <td style={{ direction: "rtl", textAlign: "left", fontFamily: "inherit" }}>
                        {translateToUrdu(item.route)}
                      </td>
                      <td>
                        <span className="status-pill active" style={{ background: "#f1f5f9", color: "#334155", padding: "4px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>
                          {generateRouteCode(item.route)}
                        </span>
                      </td>
                      <td>
                        <span className="status-pill completed" style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: "600" }}>
                          Core Route
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
