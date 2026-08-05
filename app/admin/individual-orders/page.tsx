"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";

export default function AdminIndividualOrdersPage() {
  const router = useRouter();

  // State Management
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Modal / Editing states
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [editStatus, setEditStatus] = useState("Pending");
  const [editPaymentStatus, setEditPaymentStatus] = useState("Pending");

  // Toast notifications
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success"
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getIndividualOrders({
        page,
        per_page: 10,
        search
      });
      if (res) {
        setOrders(res.data || []);
        setTotalPages(res.last_page || 1);
        setTotalOrders(res.total || 0);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch individual orders.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleOpenDetails = (order: any) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
    setEditPaymentStatus(order.payment_status);
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    try {
      const res = await api.updateIndividualOrderStatus(selectedOrder.id, {
        status: editStatus,
        payment_status: editPaymentStatus
      });
      if (res.success) {
        showToast("Order status successfully updated!", "success");
        setShowDetailModal(false);
        fetchOrders();
      } else {
        showToast(res.error || "Failed to update order status.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating order status.", "error");
    } finally {
      setUpdatingStatus(false);
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
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Individual Orders Dashboard</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Manage standalone, guest-checked bookings and automated invoices independently of agents.</p>
        </div>
        <button 
          onClick={() => router.push("/admin/hub")} 
          style={{ background: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", padding: "10px 18px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <i className="fas fa-arrow-left"></i>
          <span>Back to Hub</span>
        </button>
      </div>

      {/* Search Filter Controls */}
      <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "12px" }}>
          <div className="form-input-wrapper" style={{ flex: 1, margin: 0 }}>
            <i className="fas fa-search form-icon"></i>
            <input
              type="text"
              className="form-input"
              placeholder="Search by Order Code, Customer Name, Email, Phone, Route..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-submit" style={{ width: "auto", padding: "0 24px", background: "#0284c7" }}>
            Search Orders
          </button>
          <button 
            type="button" 
            onClick={() => { setSearch(""); setPage(1); setTimeout(fetchOrders, 50); }}
            style={{ padding: "0 18px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f8fafc", color: "#64748b", fontWeight: "600", cursor: "pointer" }}
          >
            Reset
          </button>
        </form>
      </div>

      {/* Orders Grid Table */}
      <div className="table-card" style={{ background: "#ffffff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
            <div className="spinner" style={{ borderTopColor: "#0284c7" }}></div>
            <span style={{ marginLeft: "12px", color: "#64748b", fontWeight: "600" }}>Retrieving Orders Ledger...</span>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="db-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Order Code</th>
                    <th>Customer Name</th>
                    <th>Date & Time</th>
                    <th>Route / Vehicle</th>
                    <th>Total Fare</th>
                    <th>Order Status</th>
                    <th>Payment</th>
                    <th>Invoice Link</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>
                        No individual orders found matching filters.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id}>
                        <td style={{ fontWeight: 700, color: "#0369a1" }}>{order.order_code}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{order.full_name}</div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>{order.whatsapp}</div>
                        </td>
                        <td>
                          <div>{order.date}</div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>{order.time}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: "13px", fontWeight: "600" }}>{order.pickup} → {order.destination}</div>
                          <div style={{ fontSize: "11px", color: "#0284c7", fontWeight: "600" }}>{order.car_type}</div>
                        </td>
                        <td style={{ fontWeight: 700 }}>{order.car_price} SAR</td>
                        <td>
                          <span className={`status-pill`} style={{
                            background: order.status === "Pending" ? "#fef3c7" : order.status === "Confirmed" ? "#e0f2fe" : order.status === "Paid" ? "#dcfce7" : "#fee2e2",
                            color: order.status === "Pending" ? "#d97706" : order.status === "Confirmed" ? "#0369a1" : order.status === "Paid" ? "#15803d" : "#991b1b",
                            padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: "600"
                          }}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <span className="status-pill" style={{
                            background: order.payment_status === "Paid" ? "#dcfce7" : "#fee2e2",
                            color: order.payment_status === "Paid" ? "#166534" : "#991b1b",
                            padding: "4px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: "600"
                          }}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td>
                          {order.invoice ? (
                            <a 
                              href={`/public-site/invoice/${order.invoice.invoice_code}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: "#0284c7", fontWeight: "600", textDecoration: "underline", fontSize: "13px" }}
                            >
                              {order.invoice.invoice_code}
                            </a>
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: "13px" }}>No invoice</span>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            onClick={() => handleOpenDetails(order)}
                            style={{ background: "#f0f9ff", color: "#0284c7", border: "1px solid #bae6fd", borderRadius: "6px", padding: "6px 12px", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
                <span style={{ fontSize: "14px", color: "#64748b" }}>
                  Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalOrders} total orders)
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    style={{ padding: "8px 16px", border: "1px solid #cbd5e1", borderRadius: "6px", background: page === 1 ? "#f1f5f9" : "#fff", cursor: page === 1 ? "not-allowed" : "pointer", fontWeight: "600", color: "#334155" }}
                  >
                    Previous
                  </button>
                  <button 
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    style={{ padding: "8px 16px", border: "1px solid #cbd5e1", borderRadius: "6px", background: page === totalPages ? "#f1f5f9" : "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", fontWeight: "600", color: "#334155" }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Details & Status Modal */}
      {showDetailModal && selectedOrder && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "600px", margin: "20px", borderTop: "6px solid #0284c7", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                Order Details: <span style={{ color: "#0284c7" }}>#{selectedOrder.order_code}</span>
              </h3>
              <button onClick={() => setShowDetailModal(false)} style={{ background: "transparent", border: "none", fontSize: "18px", cursor: "pointer", color: "#94a3b8" }}>
                &times;
              </button>
            </div>

            {/* Read-only details grid */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", marginBottom: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "14px" }}>
              <div>
                <span style={{ color: "#64748b", fontSize: "12px" }}>Customer Name:</span>
                <p style={{ fontWeight: "600", margin: "2px 0 0 0" }}>{selectedOrder.full_name}</p>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "12px" }}>WhatsApp Contact:</span>
                <p style={{ fontWeight: "600", margin: "2px 0 0 0" }}>{selectedOrder.whatsapp}</p>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "12px" }}>Email Address:</span>
                <p style={{ fontWeight: "600", margin: "2px 0 0 0" }}>{selectedOrder.email}</p>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "12px" }}>Flight Carrier No:</span>
                <p style={{ fontWeight: "600", margin: "2px 0 0 0" }}>{selectedOrder.flight_no || "N/A"}</p>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <span style={{ color: "#64748b", fontSize: "12px" }}>Selected Route:</span>
                <p style={{ fontWeight: "700", margin: "2px 0 0 0", color: "#0369a1" }}>{selectedOrder.pickup} → {selectedOrder.destination}</p>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "12px" }}>Vehicle Choice:</span>
                <p style={{ fontWeight: "600", margin: "2px 0 0 0" }}>{selectedOrder.car_type} ({selectedOrder.passengers} Passengers)</p>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: "12px" }}>Total Fare Rate:</span>
                <p style={{ fontWeight: "700", margin: "2px 0 0 0" }}>{selectedOrder.car_price} SAR</p>
              </div>
              {selectedOrder.notes && (
                <div style={{ gridColumn: "span 2" }}>
                  <span style={{ color: "#64748b", fontSize: "12px" }}>Client Remarks:</span>
                  <p style={{ fontWeight: "600", margin: "2px 0 0 0", fontStyle: "italic" }}>{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            {/* Status updates Form */}
            <form onSubmit={handleUpdateStatus} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label className="form-label">Order Lifecycle Status</label>
                  <select
                    className="form-input"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Paid">Paid</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Payment Clearance Status</label>
                  <select
                    className="form-input"
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "15px" }}>
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  style={{
                    background: "transparent", color: "#64748b", border: "1px solid #cbd5e1",
                    borderRadius: "6px", padding: "8px 20px", fontSize: "13px", fontWeight: "600", cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button type="submit" disabled={updatingStatus} className="btn-submit" style={{ background: "#0284c7", width: "auto" }}>
                  {updatingStatus ? "Saving Changes..." : "Save Modifications"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
