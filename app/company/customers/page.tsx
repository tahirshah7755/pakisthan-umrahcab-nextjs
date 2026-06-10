"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/utils/api";

interface CustomerRecord {
  id: string;
  custom_id: string;
  name: string;
  contact: string;
  registered_by: string;
  last_update: string;
}

export default function CompanyCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add Customer Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustMobile, setNewCustMobile] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPassport, setNewCustPassport] = useState("");
  const [newCustNotes, setNewCustNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      showToast("Customer name is required.", "error");
      return;
    }
    try {
      setSubmitting(true);
      
      const phones = [newCustMobile].filter(Boolean).join(" / ");
      const emailInfo = newCustEmail ? ` | Email: ${newCustEmail}` : "";
      const passportInfo = newCustPassport ? ` | Passport: ${newCustPassport}` : "";
      const notesInfo = newCustNotes ? ` | Notes: ${newCustNotes}` : "";
      const consolidatedContact = `${phones || "N/A"}${emailInfo}${passportInfo}${notesInfo}`;

      const res = await api.createCompanyCustomer({
        name: newCustName,
        contact: consolidatedContact
      });
      if (res.success) {
        showToast("Customer added successfully!", "success");
        setShowAddModal(false);
        setNewCustName("");
        setNewCustMobile("");
        setNewCustEmail("");
        setNewCustPassport("");
        setNewCustNotes("");
        loadCustomers();
      } else {
        showToast(res.error || "Failed to create customer.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("An unexpected error occurred.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.getCompanyCustomers(search);
      setCustomers(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to retrieve corporate customer directory.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {toast.show && (
        <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 9999, background: toast.type === "success" ? "#10b981" : "#ef4444", color: "#ffffff", padding: "12px 24px", borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", fontWeight: "600" }}>
          <i className={toast.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"} style={{ marginRight: "8px" }}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="form-header-card mobile-header-card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>My Customers</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>List of customers associated with your corporate account.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          style={{ 
            background: "linear-gradient(135deg, #d4af37 0%, #b48a1d 100%)", 
            color: "#0f172a", 
            border: "none", 
            borderRadius: "8px", 
            padding: "10px 20px", 
            fontSize: "14px", 
            fontWeight: "700", 
            cursor: "pointer", 
            display: "flex", 
            alignItems: "center", 
            gap: "8px" 
          }}
        >
          <i className="fas fa-plus"></i> Add Customer
        </button>
      </div>

      {/* Customers Table Card */}
      <div className="table-card mobile-card" style={{ padding: "25px", background: "#ffffff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
          <div className="mobile-toolbar" style={{ display: "flex", gap: "6px" }}>
            {["Copy", "CSV", "Excel", "PDF", "Print"].map((fmt) => (
              <button
                key={fmt}
                onClick={() => showToast(`${fmt} Export Triggered!`, "success")}
                style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                {fmt}
              </button>
            ))}
          </div>
          
          <div className="mobile-search-box" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>Search:</span>
            <input
              type="text"
              placeholder="Search by name, contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", width: "220px", outline: "none" }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
            <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #d4af37", borderRadius: "50%", width: "35px", height: "35px", animation: "spin 1s linear infinite" }}></div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="db-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Registered By</th>
                  <th>Last Update</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "#64748b", padding: "30px 10px" }}>No customers associated with this corporate account.</td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700, color: "#1e293b" }}>{c.custom_id}</td>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>{c.contact || "N/A"}</td>
                      <td>{c.registered_by}</td>
                      <td>{c.last_update}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
        @media (max-width: 768px) {
          .mobile-header-card {
            padding: 15px 20px !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 15px !important;
            text-align: center !important;
          }
          .mobile-card {
            padding: 15px !important;
          }
          .mobile-toolbar {
            width: 100% !important;
            justify-content: center !important;
            flex-wrap: wrap !important;
          }
          .mobile-toolbar button {
            flex: 1 !important;
            min-width: 70px !important;
            padding: 6px 10px !important;
            font-size: 11px !important;
          }
          .mobile-search-box {
            width: 100% !important;
            justify-content: space-between !important;
          }
          .mobile-search-box input {
            flex-grow: 1 !important;
            width: auto !important;
          }
        }
      `}</style>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.5)", zIndex: 10000,
          display: "flex", justifyContent: "center", alignItems: "center",
          padding: "20px"
        }}>
          <div style={{
            background: "#ffffff", borderRadius: "12px", width: "100%", maxWidth: "450px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            overflowY: "auto", display: "flex", flexDirection: "column", maxHeight: "90vh"
          }}>
            <div style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <h3 style={{ margin: 0, color: "#ffffff", fontSize: "18px", fontWeight: "700" }}>
                <i className="fas fa-user-plus" style={{ color: "#d4af37", marginRight: "8px" }}></i>
                Add New Customer
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", color: "#ffffff", fontSize: "18px", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddCustomerSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Customer Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Enter full name"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", outline: "none", color: "#000" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>WhatsApp / Mobile</label>
                <input
                  type="text"
                  value={newCustMobile}
                  onChange={(e) => setNewCustMobile(e.target.value)}
                  placeholder="e.g. +966500000000"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", outline: "none", color: "#000" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Email Address</label>
                <input
                  type="email"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  placeholder="customer@example.com"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", outline: "none", color: "#000" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Passport Number</label>
                <input
                  type="text"
                  value={newCustPassport}
                  onChange={(e) => setNewCustPassport(e.target.value)}
                  placeholder="e.g. PK1234567"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", outline: "none", color: "#000" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Notes / Extra Details</label>
                <textarea
                  value={newCustNotes}
                  onChange={(e) => setNewCustNotes(e.target.value)}
                  placeholder="Any extra info..."
                  rows={2}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", outline: "none", resize: "none", color: "#000" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "10px 20px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "10px 20px",
                    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: submitting ? "not-allowed" : "pointer"
                  }}
                >
                  {submitting ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
