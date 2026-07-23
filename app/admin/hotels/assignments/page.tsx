"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";

interface AssignmentItem {
  id: number;
  customer_id?: number;
  custom_id?: string;
  customer?: any;
  name: string;
  city: string;
  active: number;
  check_in?: string;
  check_out?: string;
  created_at?: string;
  updated_at?: string;
  driver_id?: number | null;
  driver?: any;
  driver_trip_status?: string | null;
}

export default function HotelAssignmentsList() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedShareHotel, setSelectedShareHotel] = useState<AssignmentItem | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    async function loadDrivers() {
      try {
        const res = await api.getDrivers();
        if (Array.isArray(res)) setDrivers(res);
      } catch (err) {
        console.warn("Could not load drivers in hotel assignments", err);
      }
    }
    loadDrivers();
  }, []);

  const handleInlineDriverChange = async (assignmentId: number, driverId: string) => {
    try {
      setLoading(true);
      const assignment = assignments.find(h => h.id === assignmentId);
      if (!assignment) return;

      const payload = {
        customer_id: assignment.customer_id,
        driver_id: driverId ? parseInt(driverId) : null,
        name: assignment.name,
        city: assignment.city,
        active: assignment.active,
        check_in: assignment.check_in,
        check_out: assignment.check_out,
        type: "assignment",
        driver_trip_status: assignment.driver_trip_status || null
      };

      const res = await api.updateHotel(assignmentId, payload);
      if (res && res.success) {
        showToast("Driver assignment updated successfully!", "success");
        fetchAssignments();
      } else {
        showToast(res?.error || "Failed to update driver assignment.", "error");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating driver assignment.", "error");
      setLoading(false);
    }
  };

  const handleInlineDriverTripStatusChange = async (assignmentId: number, tripStatus: string) => {
    try {
      setLoading(true);
      const assignment = assignments.find(h => h.id === assignmentId);
      if (!assignment) return;

      const payload = {
        customer_id: assignment.customer_id,
        driver_id: assignment.driver_id || null,
        name: assignment.name,
        city: assignment.city,
        active: assignment.active,
        check_in: assignment.check_in,
        check_out: assignment.check_out,
        type: "assignment",
        driver_trip_status: tripStatus || null
      };

      const res = await api.updateHotel(assignmentId, payload);
      if (res && res.success) {
        showToast("Driver trip status updated successfully!", "success");
        fetchAssignments();
      } else {
        showToast(res?.error || "Failed to update driver trip status.", "error");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating driver trip status.", "error");
      setLoading(false);
    }
  };

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

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const data = await api.getHotels(undefined, searchQuery, "assignments");
      if (data) {
        setAssignments(data);
      }
    } catch (err) {
      console.error("Failed to load assignments list:", err);
      showToast("Failed to load customer stays.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [searchQuery]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this stay assignment? This cannot be undone.")) return;
    try {
      const res = await api.deleteHotel(id);
      if (res && res.success) {
        showToast("Stay assignment deleted successfully.", "success");
        fetchAssignments();
      } else {
        showToast(res.error || "Failed to delete assignment.", "error");
      }
    } catch (e: any) {
      showToast(e.message || "An error occurred.", "error");
    }
  };

  const GOLD_COLOR = "#b48a1d";

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
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #b48a1d 0%, #8c6b12 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "28px", fontWeight: "700" }}>Customer Hotel Stays</h2>
          <p style={{ opacity: 0.9 }}>Assign hotels and properties to customers with check-in and check-out tracking.</p>
        </div>
        <button 
          onClick={() => router.push("/admin/hotels/assignments/add")} 
          style={{
            background: "#ffffff",
            color: GOLD_COLOR,
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
          <span>Assign Hotel</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px", marginTop: "10px" }}>
        <div></div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px", color: "#475569", fontWeight: "500" }}>Search:</span>
          <input
            type="text"
            placeholder="Search hotel, customer or city..."
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
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "100px" }}>ID</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Property Name</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Customer</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "130px" }}>City / Area</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "120px" }}>Check-In</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "120px" }}>Check-Out</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "150px" }}>Driver</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "180px" }}>Driver Trip Status</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "100px" }}>Status</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "120px", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }}></i> Loading stays...
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                    No customer hotel stays assigned.
                  </td>
                </tr>
              ) : (
                assignments.map((h) => (
                  <tr key={h.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ fontWeight: 600, color: "#64748b" }}>{h.custom_id || `#HTL-${h.id}`}</td>
                    <td style={{ fontWeight: 700, color: "#0f172a" }}>
                      <i className="fa-solid fa-hotel" style={{ color: GOLD_COLOR, marginRight: "10px" }}></i>
                      {h.name}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{h.customer ? h.customer.name : "N/A"}</div>
                      {h.customer && h.customer.company && (
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{h.customer.company}</div>
                      )}
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
                      <div style={{ fontWeight: 600, color: "#475569" }}>{h.check_in || "—"}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "#475569" }}>{h.check_out || "—"}</div>
                    </td>
                    <td>
                      <select
                        value={h.driver_id || ""}
                        onChange={(e) => handleInlineDriverChange(h.id, e.target.value)}
                        style={{
                          padding: "4px 8px",
                          fontSize: "12px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          width: "140px",
                          color: h.driver_id ? "#1e293b" : "#94a3b8",
                          fontWeight: h.driver_id ? "600" : "normal",
                          outline: "none"
                        }}
                      >
                        <option value="">-- No Driver --</option>
                        {drivers.map((d: any) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <select
                          value={(h as any).driver_trip_status || ""}
                          onChange={(e) => handleInlineDriverTripStatusChange(h.id, e.target.value)}
                          style={{
                            padding: "4px 8px",
                            fontSize: "12px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            width: "155px",
                            color: (h as any).driver_trip_status ? "#1e293b" : "#94a3b8",
                            fontWeight: (h as any).driver_trip_status ? "600" : "normal",
                            outline: "none"
                          }}
                        >
                          <option value="">Select Status</option>
                          <option value="Assigned">Assigned</option>
                          <option value="Guest In Contact">Guest In Contact</option>
                          <option value="No Reply From Guest">No Reply From Guest</option>
                          <option value="On The Way">On The Way</option>
                          <option value="Reached At Location">Reached At Location</option>
                          <option value="Pickup Done">Pickup Done</option>
                          <option value="Ride End">Ride End</option>
                          <option value="Ride Cancelled">Ride Cancelled</option>
                          <option value="Ride Miss">Ride Miss</option>
                          <option value="No Show">No Show</option>
                          <option value="Driver Copy Shared">Driver Copy Shared</option>
                        </select>
                        <button
                          onClick={() => {
                            setSelectedShareHotel(h);
                            setShowShareModal(true);
                          }}
                          style={{
                            border: "none",
                            background: "#e0f2fe",
                            color: GOLD_COLOR,
                            borderRadius: "50%",
                            width: "24px",
                            height: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: "12px"
                          }}
                          title="Share template messages"
                        >
                          <i className="fas fa-info-circle"></i>
                        </button>
                      </div>
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
                          onClick={() => router.push(`/admin/hotels/assignments/edit?id=${h.id}`)}
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
                          title="Edit Stay Details"
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
                          title="Delete Stay"
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

      {showShareModal && selectedShareHotel && (
        <ShareTemplateModal
          booking={selectedShareHotel}
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedShareHotel(null);
          }}
          GOLD_COLOR={GOLD_COLOR}
        />
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

function ShareTemplateModal({ booking, isOpen, onClose, GOLD_COLOR }: { booking: any; isOpen: boolean; onClose: () => void; GOLD_COLOR: string }) {
  const [activeTab, setActiveTab] = useState<"driver" | "agent" | "client">("driver");
  const [copied, setCopied] = useState(false);

  if (!isOpen || !booking) return null;

  const getDriverCopy = (b: any) => {
    return `*UMRAH CAB HOTEL ASSIGNMENT DETAILS (DRIVER COPY)*\n---------------------------------\n*Stay Code:* ${b.custom_id || `#HTL-${b.id}`}\n*Hotel/Property:* ${b.name}\n*City:* ${b.city}\n*Guest Name:* ${b.customer ? b.customer.name : "N/A"}\n*Guest Phone:* ${b.customer ? b.customer.contact : "N/A"}\n*Check-In:* ${b.check_in || "N/A"}\n*Check-Out:* ${b.check_out || "N/A"}`;
  };

  const getAgentCopy = (b: any) => {
    const dName = b.driver ? b.driver.name : "None";
    const dPhone = b.driver ? b.driver.phone : "";
    return `*UMRAH CAB STATUS UPDATE (AGENT COPY)*\n---------------------------------\n*Stay Code:* ${b.custom_id || `#HTL-${b.id}`}\n*Hotel/Property:* ${b.name}\n*Guest Name:* ${b.customer ? b.customer.name : "N/A"}\n*Driver Assigned:* ${dName} ${dPhone ? `(${dPhone})` : ""}\n*Trip Status:* ${b.driver_trip_status || "Not Set"}`;
  };

  const getClientCopy = (b: any) => {
    const dName = b.driver ? b.driver.name : "TBD";
    const dPhone = b.driver ? b.driver.phone : "TBD";
    return `*UMRAH CAB STATUS UPDATE (CLIENT COPY)*\n---------------------------------\nDear *${b.customer ? b.customer.name : "Guest"}*,\n\nYour driver's status has been updated for your hotel stay assignment:\n*Status:* ${b.driver_trip_status || "Assigned"}\n*Driver Name:* ${dName}\n*Driver Phone:* ${dPhone}\n\nThank you for choosing Umrah Cab!`;
  };

  const textMap = {
    driver: getDriverCopy(booking),
    agent: getAgentCopy(booking),
    client: getClientCopy(booking),
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(textMap[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    let phone = "";
    if (activeTab === "driver") {
      phone = booking.driver ? booking.driver.phone : "";
    } else if (activeTab === "client") {
      phone = booking.customer ? booking.customer.contact : "";
    }
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const encodedText = encodeURIComponent(textMap[activeTab]);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, "_blank");
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 }}>
      <div style={{ background: "#ffffff", borderRadius: "16px", width: "500px", maxWidth: "90%", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>Share Booking / Trip Details</h3>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "20px", color: "#64748b" }}>&times;</button>
        </div>
        
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "2px solid #f1f5f9", marginBottom: "16px", gap: "16px" }}>
          {(["driver", "agent", "client"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 4px",
                fontWeight: "600",
                fontSize: "14px",
                border: "none",
                background: "none",
                cursor: "pointer",
                borderBottom: activeTab === tab ? `2px solid ${GOLD_COLOR}` : "2px solid transparent",
                color: activeTab === tab ? GOLD_COLOR : "#64748b",
                textTransform: "capitalize",
                marginBottom: "-2px"
              }}
            >
              {tab} Copy
            </button>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          readOnly
          value={textMap[activeTab]}
          style={{
            width: "100%",
            height: "180px",
            padding: "12px",
            fontFamily: "monospace",
            fontSize: "13px",
            lineHeight: "1.5",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            color: "#334155",
            resize: "none",
            outline: "none"
          }}
        />

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
          <button
            onClick={handleCopy}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <i className={copied ? "fas fa-check text-green-500" : "fas fa-copy"}></i>
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={handleSendWhatsApp}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              background: "#25d366",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <i className="fab fa-whatsapp"></i>
            Send via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
