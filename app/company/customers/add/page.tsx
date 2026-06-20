"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AddCustomerForm } from "@/components/admin/AddCustomerForm";

export default function CompanyAddCustomerPage() {
  const router = useRouter();

  return (
    <div className="admin-content-area" style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Onboard Unified Customer</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Create a customer profile and dynamically link bookings, flights, trains and hotel files.</p>
        </div>
        <button 
          onClick={() => router.push("/company/customers")} 
          style={{
            background: "transparent",
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <i className="fas fa-arrow-left"></i>
          <span>Back to List</span>
        </button>
      </div>

      <AddCustomerForm router={router} />
    </div>
  );
}
