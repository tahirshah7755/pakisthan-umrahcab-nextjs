"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";

interface HotelItem {
  id: number;
  name: string;
  city: string;
  active: number;
  created_at?: string;
  updated_at?: string;
}

export default function HotelsDirectory() {
  const router = useRouter();
  const [hotels, setHotels] = useState<HotelItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<HotelItem | null>(null);
  const [hotelName, setHotelName] = useState("");
  const [hotelCity, setHotelCity] = useState("Makkah");
  const [hotelActive, setHotelActive] = useState(1);

  // Toast notifications
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const data = await api.getHotels(undefined, searchQuery);
      if (data) {
        setHotels(data);
      }
    } catch (err) {
      console.error("Failed to load hotels list:", err);
      showToast("Failed to load hotel properties.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, [searchQuery]);

  const handleOpenAddModal = () => {
    setEditingHotel(null);
    setHotelName("");
    setHotelCity("Makkah");
    setHotelActive(1);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (hotel: HotelItem) => {
    setEditingHotel(hotel);
    setHotelName(hotel.name);
    setHotelCity(hotel.city);
    setHotelActive(hotel.active);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelName.trim()) {
      showToast("Hotel name is required.", "error");
      return;
    }

    try {
      const payload = {
        name: hotelName,
        city: hotelCity,
        active: hotelActive,
      };

      let res;
      if (editingHotel) {
        res = await api.updateHotel(editingHotel.id, payload);
      } else {
        res = await api.createHotel(payload);
      }

      if (res && res.success) {
        showToast(
          editingHotel ? "Hotel updated successfully!" : "Hotel added successfully!",
          "success"
        );
        setIsModalOpen(false);
        fetchHotels();
      } else {
        showToast(res?.error || "Failed to save hotel.", "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast("An error occurred while saving.", "error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this hotel property? This cannot be undone.")) return;
    try {
      const res = await api.deleteHotel(id);
      if (res && res.success) {
        showToast("Hotel property deleted successfully.", "success");
        fetchHotels();
      } else {
        showToast(res.error || "Failed to delete hotel.", "error");
      }
    } catch (e: any) {
      showToast(e.message || "An error occurred.", "error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Toast Alert */}
      {toast.show && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 9999,
          background: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "#ffffff",
          padding: "12px 24px",
          borderRadius: "8px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          fontWeight: "600",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          animation: "slideIn 0.3s ease-out"
        }}>
          <i className={toast.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4338ca 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "28px", fontWeight: "700" }}>Hotel Accommodations</h2>
          <p style={{ opacity: 0.9 }}>Configure and manage the directory of properties available in Makkah, Madinah, and Jeddah.</p>
        </div>
        <button 
          onClick={handleOpenAddModal} 
          style={{
            background: "#ffffff",
            color: "#4338ca",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            fontWeight: "700",
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
          }}
        >
          <i className="fas fa-plus"></i>
          <span>New Hotel</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px", marginTop: "10px" }}>
        <div></div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px", color: "#475569", fontWeight: "500" }}>Search:</span>
          <input
            type="text"
            placeholder="Search hotel or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              outline: "none",
              fontSize: "14px",
              width: "250px",
              background: "#ffffff"
            }}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="table-card" style={{ padding: "20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div className="table-responsive">
          <table className="db-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "80px" }}>ID</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Property Name</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>City / Area</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Status</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "120px", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }}></i> Loading properties...
                  </td>
                </tr>
              ) : hotels.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                    No hotel records found.
                  </td>
                </tr>
              ) : (
                hotels.map((h) => (
                  <tr key={h.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ fontWeight: 600, color: "#64748b" }}>#HTL-{h.id}</td>
                    <td style={{ fontWeight: 700, color: "#0f172a" }}>
                      <i className="fa-solid fa-hotel" style={{ color: "#7c3aed", marginRight: "10px" }}></i>
                      {h.name}
                    </td>
                    <td>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: h.city === "Makkah" ? "#fee2e2" : h.city === "Madinah" ? "#dcfce7" : "#e0f2fe",
                        color: h.city === "Makkah" ? "#991b1b" : h.city === "Madinah" ? "#166534" : "#075985",
                        padding: "4px 10px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "700"
                      }}>
                        <i className="fa-solid fa-city" style={{ fontSize: "10px" }}></i>
                        {h.city}
                      </span>
                    </td>
                    <td>
                      {h.active === 1 ? (
                        <span className="status-pill completed" style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: "600" }}>
                          Active
                        </span>
                      ) : (
                        <span className="status-pill cancelled" style={{ background: "#fee2e2", color: "#991b1b", padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: "600" }}>
                          Inactive
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                        <button
                          onClick={() => handleOpenEditModal(h)}
                          style={{
                            background: "#3b82f6",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            width: "28px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 2px 4px rgba(59,130,246,0.2)"
                          }}
                          title="Edit Property"
                        >
                          <i className="far fa-edit" style={{ fontSize: "12px" }}></i>
                        </button>
                        <button
                          onClick={() => handleDelete(h.id)}
                          style={{
                            background: "#ef4444",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            width: "28px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 2px 4px rgba(239,68,68,0.2)"
                          }}
                          title="Delete Property"
                        >
                          <i className="far fa-trash-alt" style={{ fontSize: "12px" }}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Hotel Modal */}
      {isModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "500px", margin: "20px", borderTop: "6px solid #7c3aed", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)", background: "#ffffff", padding: "30px", borderRadius: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                <i className="fa-solid fa-hotel" style={{ marginRight: "8px", color: "#7c3aed" }}></i> 
                {editingHotel ? "Edit Hotel Property" : "Add Hotel Property"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", color: "#94a3b8" }}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label" style={{ color: "#475569", fontWeight: "600", fontSize: "13px" }}>Hotel / Property Name *</label>
                <div className="form-input-wrapper" style={{ position: "relative" }}>
                  <i className="fa-solid fa-hotel form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}></i>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Hilton Suites Makkah"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    style={{ paddingLeft: "42px", width: "100%" }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ color: "#475569", fontWeight: "600", fontSize: "13px" }}>City / Area *</label>
                <div className="form-input-wrapper" style={{ position: "relative" }}>
                  <i className="fa-solid fa-city form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}></i>
                  <select
                    className="form-input form-select"
                    value={hotelCity}
                    onChange={(e) => setHotelCity(e.target.value)}
                    style={{ paddingLeft: "42px", width: "100%" }}
                    required
                  >
                    <option value="Makkah">Makkah Mukarramah</option>
                    <option value="Madinah">Madinah Munawwarah</option>
                    <option value="Jeddah">Jeddah</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ color: "#475569", fontWeight: "600", fontSize: "13px" }}>Status *</label>
                <div className="form-input-wrapper" style={{ position: "relative" }}>
                  <i className="fa-solid fa-circle-info form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}></i>
                  <select
                    className="form-input form-select"
                    value={hotelActive}
                    onChange={(e) => setHotelActive(Number(e.target.value))}
                    style={{ paddingLeft: "42px", width: "100%" }}
                    required
                  >
                    <option value={1}>Active Property</option>
                    <option value={0}>Inactive Property</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "15px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: "transparent", color: "#64748b", border: "1px solid #cbd5e1",
                    borderRadius: "6px", padding: "8px 20px", fontSize: "13px", fontWeight: "600", cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4338ca 100%)", width: "auto", color: "#ffffff", padding: "8px 20px", borderRadius: "6px", border: "none", fontWeight: "700", cursor: "pointer" }}>
                  {editingHotel ? "Save Changes" : "Add Hotel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
