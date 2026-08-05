"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useGetFleetQuery, useAddFleetMutation, useUpdateFleetMutation, useDeleteFleetMutation } from "@/store/api/fleetApi";

export default function FleetManagementPage() {
  const router = useRouter();
  const { data: fleetResponse, isLoading } = useGetFleetQuery(undefined);
  const [addFleet] = useAddFleetMutation();
  const [updateFleet] = useUpdateFleetMutation();
  const [deleteFleet] = useDeleteFleetMutation();

  const fleetList = Array.isArray(fleetResponse)
    ? fleetResponse
    : (fleetResponse && typeof fleetResponse === "object" && Array.isArray((fleetResponse as any).data)
        ? (fleetResponse as any).data
        : []);

  // Summary Metrics
  const totalFleetUnits = fleetList.reduce((sum: number, f: any) => sum + (Number(f.count) || 0), 0);
  const activeDispatchedUnits = fleetList.reduce((sum: number, f: any) => sum + (Number(f.active) || 0), 0);

  // Toast state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  // Add Modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newModel, setNewModel] = useState("");
  const [newCount, setNewCount] = useState<number>(10);
  const [newActive, setNewActive] = useState<number>(5);
  const [newCapacity, setNewCapacity] = useState<number>(4);
  const [newLuggage, setNewLuggage] = useState<number>(2);

  // Edit Modal state
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
  const [editCount, setEditCount] = useState<number>(0);
  const [editActive, setEditActive] = useState<number>(0);
  const [editCapacity, setEditCapacity] = useState<number>(4);
  const [editLuggage, setEditLuggage] = useState<number>(2);

  // Delete Confirmation state
  const [deletingVehicle, setDeletingVehicle] = useState<any | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleEditClick = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setEditCount(vehicle.count || 0);
    setEditActive(vehicle.active || 0);
    setEditCapacity(vehicle.capacity || 4);
    setEditLuggage(vehicle.luggage || 2);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModel.trim()) {
      showToast("Vehicle Model is required!", "error");
      return;
    }
    if (newActive > newCount) {
      showToast("Currently Dispatched units cannot exceed Total Inventory Size!", "error");
      return;
    }

    try {
      await addFleet({
        model: newModel,
        count: newCount,
        active: newActive,
        capacity: newCapacity,
        luggage: newLuggage,
      }).unwrap();
      showToast(`${newModel} added to fleet successfully!`, "success");
      setIsAddOpen(false);
      setNewModel("");
      setNewCount(10);
      setNewActive(5);
      setNewCapacity(4);
      setNewLuggage(2);
    } catch (err: any) {
      console.error(err);
      showToast(err?.data?.message || "Failed to add vehicle to fleet.", "error");
    }
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
        capacity: editCapacity,
        luggage: editLuggage,
      }).unwrap();
      showToast(`${editingVehicle.model} allocation updated successfully!`, "success");
      setEditingVehicle(null);
    } catch (err: any) {
      console.error(err);
      showToast(err?.data?.message || "Failed to update fleet allocation.", "error");
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingVehicle) return;
    try {
      await deleteFleet(deletingVehicle.id).unwrap();
      showToast(`${deletingVehicle.model} removed from fleet successfully!`, "success");
      setDeletingVehicle(null);
    } catch (err: any) {
      console.error(err);
      showToast(err?.data?.message || "Failed to remove vehicle from fleet.", "error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: toast.type === "success" ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
          color: "#ffffff", padding: "14px 24px", borderRadius: "10px",
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", gap: "10px",
          fontWeight: "600", fontSize: "14px"
        }}>
          <i className={toast.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"}></i>
          {toast.message}
        </div>
      )}

      {/* Hero Header Card */}
      <div style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)",
        padding: "28px 32px", borderRadius: "16px",
        boxShadow: "0 10px 25px -5px rgba(49, 46, 129, 0.3)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(212, 175, 55, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#d4af37", fontSize: "20px" }}>
              <i className="fas fa-bus"></i>
            </div>
            <h1 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "800", letterSpacing: "-0.5px" }}>
              Haramain Fleet Management
            </h1>
          </div>
          <p style={{ color: "#c7d2fe", margin: "8px 0 0 0", fontSize: "14px" }}>
            Control transport models, seating capacities, luggage specs, and operational route dispatch status.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <button 
            onClick={() => setIsAddOpen(true)} 
            style={{ 
              background: "linear-gradient(135deg, #d4af37 0%, #b48a1d 100%)", 
              color: "#0f172a", border: "none", borderRadius: "8px", 
              padding: "11px 22px", fontWeight: "700", cursor: "pointer", 
              display: "flex", alignItems: "center", gap: "8px", fontSize: "14px",
              boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)", transition: "all 0.2s" 
            }}
          >
            <i className="fas fa-plus-circle"></i>
            <span>Add New Vehicle</span>
          </button>
          <button 
            onClick={() => router.push("/admin/extras/price-list")} 
            style={{ 
              background: "rgba(255,255,255,0.12)", color: "#ffffff", 
              border: "1px solid rgba(255,255,255,0.25)", borderRadius: "8px", 
              padding: "11px 18px", fontWeight: "600", cursor: "pointer", 
              display: "flex", alignItems: "center", gap: "8px", fontSize: "14px",
              backdropFilter: "blur(4px)" 
            }}
          >
            <i className="fas fa-tags"></i>
            <span>View Price List</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
        {/* Card 1: Total Fleet Models */}
        <div style={{ background: "#ffffff", padding: "20px 24px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#e0e7ff", color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            <i className="fas fa-car-side"></i>
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Vehicle Models</div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>{fleetList.length} Models</div>
          </div>
        </div>

        {/* Card 2: Total Units */}
        <div style={{ background: "#ffffff", padding: "20px 24px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            <i className="fas fa-warehouse"></i>
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Inventory</div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>{totalFleetUnits} Units</div>
          </div>
        </div>

        {/* Card 3: Active Dispatched */}
        <div style={{ background: "#ffffff", padding: "20px 24px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#dcfce7", color: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            <i className="fas fa-route"></i>
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Active Dispatched</div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#15803d", marginTop: "2px" }}>{activeDispatchedUnits} Units</div>
          </div>
        </div>
      </div>

      {/* Fleet Table Card */}
      <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", background: "#fafafa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="fas fa-layer-group" style={{ color: "#312e81" }}></i>
            Fleet Inventory & Seating Matrix
          </h2>
          <span style={{ fontSize: "12px", fontWeight: "600", background: "#e2e8f0", color: "#475569", padding: "4px 10px", borderRadius: "9999px" }}>
            {fleetList.length} Active Records
          </span>
        </div>

        {isLoading ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#64748b" }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: "28px", color: "#312e81", marginBottom: "12px" }}></i>
            <p style={{ margin: 0, fontWeight: "600" }}>Loading fleet allocation records...</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: "700" }}>
                  <th style={{ padding: "14px 20px" }}>Vehicle Model</th>
                  <th style={{ padding: "14px 20px" }}>Max Passengers</th>
                  <th style={{ padding: "14px 20px" }}>Luggage Capacity</th>
                  <th style={{ padding: "14px 20px" }}>Total Inventory</th>
                  <th style={{ padding: "14px 20px" }}>Currently Dispatched</th>
                  <th style={{ padding: "14px 20px" }}>Status</th>
                  <th style={{ padding: "14px 20px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fleetList.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "45px", color: "#94a3b8" }}>
                      No fleet records found. Click <strong>Add New Vehicle</strong> to add one.
                    </td>
                  </tr>
                ) : (
                  fleetList.map((f: any, i: number) => (
                    <tr key={f.id || i} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}>
                      <td style={{ padding: "16px 20px", fontWeight: "700", color: "#0f172a" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#312e81" }}>
                            <i className="fas fa-car-side"></i>
                          </div>
                          <span>{f.model}</span>
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px", fontWeight: "700", color: "#312e81" }}>
                        <span style={{ background: "#e0e7ff", color: "#3730a3", padding: "4px 12px", borderRadius: "6px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <i className="fas fa-users"></i>
                          {f.capacity || 4} Passengers
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", fontWeight: "600", color: "#475569" }}>
                        <span style={{ background: "#fef3c7", color: "#92400e", padding: "4px 12px", borderRadius: "6px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <i className="fas fa-suitcase-rolling"></i>
                          {f.luggage || 2} Bags
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", fontWeight: "700", color: "#0f172a" }}>
                        {f.count} Units
                      </td>
                      <td style={{ padding: "16px 20px", fontWeight: "700", color: "#166534" }}>
                        {f.active} Units
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <i className="fas fa-check-circle"></i>
                          Active Operational
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button 
                            onClick={() => handleEditClick(f)}
                            style={{ 
                              width: "34px", height: "34px", 
                              background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", 
                              color: "#ffffff", border: "none", borderRadius: "8px", 
                              fontWeight: "600", cursor: "pointer", 
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              boxShadow: "0 2px 6px rgba(59, 130, 246, 0.25)"
                            }}
                            title="Edit Fleet Specs & Capacity"
                          >
                            <i className="fas fa-pen-to-square"></i>
                          </button>
                          <button 
                            onClick={() => setDeletingVehicle(f)}
                            style={{ 
                              width: "34px", height: "34px", 
                              borderRadius: "8px", border: "1px solid #fca5a5", 
                              background: "#fef2f2", color: "#dc2626", cursor: "pointer", 
                              display: "inline-flex", alignItems: "center", justifyContent: "center"
                            }}
                            title="Delete Vehicle Model"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Vehicle Modal */}
      {isAddOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px"
        }}>
          <div style={{
            background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "520px",
            borderTop: "6px solid #d4af37", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", overflow: "hidden"
          }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafafa" }}>
              <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fas fa-plus-circle" style={{ color: "#d4af37" }}></i> Add New Fleet Vehicle
              </h3>
              <button onClick={() => setIsAddOpen(false)} style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", color: "#94a3b8" }}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>Vehicle Model Name *</label>
                <div style={{ position: "relative" }}>
                  <i className="fas fa-car-side" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}></i>
                  <input
                    type="text"
                    style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                    placeholder="e.g. Ford Taurus, GMC Yukon XL, Camry"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>Max Passengers *</label>
                  <div style={{ position: "relative" }}>
                    <i className="fas fa-users" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}></i>
                    <input
                      type="number"
                      style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                      value={newCapacity}
                      onChange={(e) => setNewCapacity(Number(e.target.value))}
                      min={1}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>Luggage Capacity (Bags) *</label>
                  <div style={{ position: "relative" }}>
                    <i className="fas fa-suitcase-rolling" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}></i>
                    <input
                      type="number"
                      style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                      value={newLuggage}
                      onChange={(e) => setNewLuggage(Number(e.target.value))}
                      min={0}
                      required
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>Total Inventory Units *</label>
                  <div style={{ position: "relative" }}>
                    <i className="fas fa-warehouse" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}></i>
                    <input
                      type="number"
                      style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                      value={newCount}
                      onChange={(e) => setNewCount(Number(e.target.value))}
                      min={0}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>Active Dispatched Units *</label>
                  <div style={{ position: "relative" }}>
                    <i className="fas fa-route" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}></i>
                    <input
                      type="number"
                      style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                      value={newActive}
                      onChange={(e) => setNewActive(Number(e.target.value))}
                      min={0}
                      required
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  style={{ background: "transparent", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ background: "linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", padding: "10px 22px", fontSize: "14px" }}
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {editingVehicle && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px"
        }}>
          <div style={{
            background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "520px",
            borderTop: "6px solid #312e81", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", overflow: "hidden"
          }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafafa" }}>
              <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fas fa-pen-to-square" style={{ color: "#312e81" }}></i> Edit Fleet Specs: {editingVehicle.model}
              </h3>
              <button onClick={() => setEditingVehicle(null)} style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", color: "#94a3b8" }}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleUpdateSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>Max Passengers (Capacity)</label>
                  <div style={{ position: "relative" }}>
                    <i className="fas fa-users" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}></i>
                    <input
                      type="number"
                      style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                      value={editCapacity}
                      onChange={(e) => setEditCapacity(Number(e.target.value))}
                      min={1}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>Luggage Capacity (Bags)</label>
                  <div style={{ position: "relative" }}>
                    <i className="fas fa-suitcase-rolling" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}></i>
                    <input
                      type="number"
                      style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                      value={editLuggage}
                      onChange={(e) => setEditLuggage(Number(e.target.value))}
                      min={0}
                      required
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>Total Inventory Units</label>
                  <div style={{ position: "relative" }}>
                    <i className="fas fa-warehouse" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}></i>
                    <input
                      type="number"
                      style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                      value={editCount}
                      onChange={(e) => setEditCount(Number(e.target.value))}
                      min={0}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>Currently Dispatched Units</label>
                  <div style={{ position: "relative" }}>
                    <i className="fas fa-route" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}></i>
                    <input
                      type="number"
                      style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                      value={editActive}
                      onChange={(e) => setEditActive(Number(e.target.value))}
                      min={0}
                      required
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  style={{ background: "transparent", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ background: "linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", padding: "10px 22px", fontSize: "14px" }}
                >
                  Update Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingVehicle && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px"
        }}>
          <div style={{
            background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "420px",
            borderTop: "6px solid #ef4444", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", padding: "24px", textAlign: "center"
          }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#fef2f2", color: "#ef4444", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "24px", marginBottom: "16px" }}>
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "0 0 8px 0" }}>Delete Fleet Model?</h3>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px 0", lineHeight: "1.5" }}>
              Are you sure you want to remove <strong>{deletingVehicle.model}</strong> from the active fleet? This action cannot be undone.
            </p>
            
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => setDeletingVehicle(null)}
                style={{ background: "transparent", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
              >
                Keep Vehicle
              </button>
              <button 
                onClick={handleDeleteSubmit} 
                style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 22px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}
              >
                Delete Model
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
