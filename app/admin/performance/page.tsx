"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function PerformancePage() {
  const router = useRouter();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)" }}>
        <div>
          <h2>Corporate Performance Analytics</h2>
          <p>Gain insights on total bookings count, branch volumes, and sales metrics.</p>
        </div>
        <button onClick={() => router.push("/admin/hub")} className="form-btn-back">
          <i className="fas fa-arrow-left"></i>
          <span>Back to Hub</span>
        </button>
      </div>

      <div className="form-card">
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#333", marginBottom: "20px" }}>Branch Sales Performance Volumes</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {[
            { name: "Zahid Travels (Jeddah Office)", val: "SR 42,500.00", pct: 75 },
            { name: "Al-Latif Group (Makkah Office)", val: "SR 18,900.00", pct: 35 },
            { name: "Standard Agency Brokerage", val: "SR 8,400.00", pct: 15 }
          ].map((perf, i) => (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>
                <span>{perf.name}</span>
                <span style={{ color: "var(--primary-color)" }}>{perf.val}</span>
              </div>
              <div style={{ width: "100%", background: "#f1f5f9", height: "12px", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ width: `${perf.pct}%`, background: "linear-gradient(90deg, #1f6f8b 0%, #0ea5e9 100%)", height: "100%" }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
