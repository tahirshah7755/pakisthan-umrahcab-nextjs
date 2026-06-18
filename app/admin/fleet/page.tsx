"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useGetFleetQuery, useUpdateFleetMutation } from "@/store/api/fleetApi";

export default function FleetManagementPage() {
  const router = useRouter();
  const { data: fleetResponse, isLoading } = useGetFleetQuery(undefined);
  const [updateFleet] = useUpdateFleetMutation();

  const fleetList = Array.isArray(fleetResponse)
    ? fleetResponse
    : (fleetResponse && typeof fleetResponse === "object" && Array.isArray((fleetResponse as any).data)
        ? (fleetResponse as any).data
        : []);

  // Toast state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  // Edit Modal state
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
  const [editCount, setEditCount] = useState<number>(0);
  const [editActive, setEditActive] = useState<number>(0);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleEditClick = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setEditCount(vehicle.count || 0);
    setEditActive(vehicle.active || 0);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;

    if (editActive > editCount) {
      showToast("Currently Dispatched units cannot exceed Total Inventory Size!", "error");
      return;
    }

    try {
      await updateFleet({
        id: editingVehicle.id,
        count: editCount,
        active: editActive,
      }).unwrap();
      showToast(`${editingVehicle.model} allocation updated successfully!`, "success");
      setEditingVehicle(null);
    } catch (err: any) {
      console.error(err);
      showToast(err?.data?.message || "Failed to update fleet allocation.", "error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "#ffffff", padding: "12px 24px", borderRadius: "8px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", fontWeight: "600",
          fontSize: "14px", display: "flex", alignItems: "center", gap: "10px",
        }}>
          <i className={toast.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Haramain Fleet Management</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Maintain active transport vehicle stock, driver capacities, and dynamic logs.</p>
        </div>
        <button 
          onClick={() => router.push("/admin/hub")} 
          style={{ background: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", padding: "10px 18px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <i className="fas fa-arrow-left"></i>
          <span>Back to Hub</span>
        </button>
      </div>

      {/* Allocation Matrix Card */}
      <div className="form-card" style={{ background: "#ffffff", padding: "35px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "20px" }}>Active Transport Allocation Matrix</h3>
        
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
            <div className="spinner" style={{ borderTopColor: "#312e81" }}></div>
            <span style={{ marginLeft: "12px", color: "#64748b", fontWeight: "600" }}>Loading Fleet Data...</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="db-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Vehicle Model</th>
                  <th>Total Inventory Size</th>
                  <th>Currently Dispatched</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fleetList.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>
                      No fleet records found.
                    </td>
                  </tr>
                ) : (
                  fleetList.map((f: any, i: number) => (
                    <tr key={f.id || i}>
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
                      <td style={{ textAlign: "right" }}>
                        <button 
                          onClick={() => handleEditClick(f)}
                          className="btn-submit" 
                          style={{ width: "auto", background: "#312e81", height: "32px", fontSize: "12px", padding: "0 15px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                          <i className="fas fa-pen-to-square"></i>
                          <span>Edit Allocation</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Allocation Modal */}
      {editingVehicle && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "500px", margin: "20px", borderTop: "6px solid #312e81", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                <i className="fas fa-bus" style={{ marginRight: "8px", color: "#312e81" }}></i> Edit Fleet: {editingVehicle.model}
              </h3>
              <button onClick={() => setEditingVehicle(null)} style={{ background: "transparent", border: "none", fontSize: "18px", cursor: "pointer", color: "#94a3b8" }}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleUpdateSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label">Total Inventory Size (Units)</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-warehouse form-icon" style={{ color: "#312e81" }}></i>
                  <input
                    type="number"
                    className="form-input"
                    value={editCount}
                    onChange={(e) => setEditCount(Number(e.target.value))}
                    min={0}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Currently Dispatched (Units)</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-route form-icon" style={{ color: "#312e81" }}></i>
                  <input
                    type="number"
                    className="form-input"
                    value={editActive}
                    onChange={(e) => setEditActive(Number(e.target.value))}
                    min={0}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  style={{
                    background: "transparent", color: "#64748b", border: "1px solid #cbd5e1",
                    borderRadius: "6px", padding: "8px 20px", fontSize: "13px", fontWeight: "600", cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit" style={{ background: "linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)", width: "auto" }}>
                  Save Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
