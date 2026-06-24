"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../utils/api";

export default function AdminDriversPage() {
  const router = useRouter();

  // State
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Toast notifications
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any | null>(null);
  const [deletingDriver, setDeletingDriver] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    phone: "",
    license_no: "",
    vehicle_id: "",
    edit_rights: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [driverData, fleetData] = await Promise.all([
        api.getDrivers(),
        api.getFleet()
      ]);
      setDrivers(driverData || []);
      
      // Extract fleet array
      const fleetList = Array.isArray(fleetData)
        ? fleetData
        : (fleetData && typeof fleetData === "object" && Array.isArray((fleetData as any).data)
            ? (fleetData as any).data
            : []);
      setVehicles(fleetList);
    } catch (err) {
      showToast("Failed to load drivers and vehicles.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const openAddModal = () => {
    setFormData({
      name: "",
      username: "",
      password: "",
      phone: "",
      license_no: "",
      vehicle_id: "",
      edit_rights: false
    });
    setIsAddOpen(true);
  };

  const openEditModal = (driver: any) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name || "",
      username: driver.username || "",
      password: "", // Empty to keep existing password
      phone: driver.phone || "",
      license_no: driver.license_no || "",
      vehicle_id: driver.vehicle_id ? String(driver.vehicle_id) : "",
      edit_rights: !!driver.edit_rights
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        ...formData,
        vehicle_id: formData.vehicle_id ? Number(formData.vehicle_id) : null
      };
      const res = await api.createDriver(payload);
      if (res.success) {
        showToast("Driver account created successfully!", "success");
        setIsAddOpen(false);
        loadData();
      } else {
        showToast(res.error || "Failed to create driver.", "error");
      }
    } catch (err) {
      showToast("An unexpected error occurred.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver) return;
    setActionLoading(true);
    try {
      const payload = {
        ...formData,
        vehicle_id: formData.vehicle_id ? Number(formData.vehicle_id) : null
      };
      // Remove empty password so it is not updated
      if (!payload.password) {
        delete (payload as any).password;
      }
      const res = await api.updateDriver(editingDriver.id, payload);
      if (res.success) {
        showToast("Driver account updated successfully!", "success");
        setEditingDriver(null);
        loadData();
      } else {
        showToast(res.error || "Failed to update driver.", "error");
      }
    } catch (err) {
      showToast("An unexpected error occurred.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDriver) return;
    setActionLoading(true);
    try {
      const res = await api.deleteDriver(deletingDriver.id);
      if (res.success) {
        showToast("Driver account deleted successfully!", "success");
        setDeletingDriver(null);
        loadData();
      } else {
        showToast(res.error || "Failed to delete driver.", "error");
      }
    } catch (err) {
      showToast("An unexpected error occurred.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered list
  const filteredDrivers = drivers.filter(d => 
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.username?.toLowerCase().includes(search.toLowerCase()) ||
    d.phone?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="drivers-page-container">
      {/* Premium Embedded Styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .drivers-page-container {
          padding: 30px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          font-family: 'Inter', sans-serif;
          background-color: #f8fafc;
          min-height: calc(100vh - 70px);
        }
        
        /* Gradient Header Banner */
        .drivers-header-banner {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          padding: 30px 40px;
          border-radius: 20px;
          color: #ffffff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.15);
          flex-wrap: wrap;
          gap: 20px;
        }
        .drivers-header-info h1 {
          font-size: 28px;
          font-weight: 800;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }
        .drivers-header-info p {
          margin: 0;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
        }
        .btn-header-back {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 10px 18px;
          border-radius: 10px;
          color: #ffffff;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-header-back:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        /* Controls Section */
        .controls-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .search-wrapper {
          position: relative;
          width: 100%;
          max-width: 400px;
        }
        .search-wrapper i {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 14px;
        }
        .search-input {
          width: 100%;
          padding: 11px 16px 11px 40px;
          background-color: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          font-size: 14px;
          outline: none;
          color: #0f172a;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
          transition: border-color 0.2s;
        }
        .search-input:focus {
          border-color: #6366f1;
        }
        .btn-create-driver {
          background-color: #059669;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          color: #ffffff;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-create-driver:hover {
          background-color: #047857;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(5, 150, 105, 0.35);
        }

        /* Drivers Registry Table */
        .drivers-table-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
          overflow: hidden;
        }
        .drivers-table-responsive {
          overflow-x: auto;
          width: 100%;
        }
        .drivers-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .drivers-table th {
          background-color: #f8fafc;
          padding: 18px 24px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          border-bottom: 1px solid #e2e8f0;
        }
        .drivers-table td {
          padding: 18px 24px;
          font-size: 14px;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .drivers-table tr:last-child td {
          border-bottom: none;
        }
        .drivers-table tr:hover td {
          background-color: #f8fafc;
        }

        /* Profile Stack */
        .driver-info-stack {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .driver-display-name {
          font-weight: 700;
          color: #0f172a;
          font-size: 14px;
        }
        .driver-username {
          font-size: 12px;
          color: #94a3b8;
        }

        /* Vehicle Assignment Pill */
        .badge-vehicle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
        }
        .vehicle-active {
          background-color: #ecfdf5;
          color: #047857;
          border: 1px solid #d1fae5;
        }
        .vehicle-inactive {
          background-color: #f8fafc;
          color: #94a3b8;
          border: 1px solid #e2e8f0;
          font-style: italic;
        }

        /* Edit Rights Badge */
        .badge-rights {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .rights-allowed {
          background-color: #ecfdf5;
          color: #047857;
        }
        .rights-restricted {
          background-color: #f1f5f9;
          color: #64748b;
        }

        /* Action Buttons */
        .actions-btn-group {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
        .btn-action {
          width: 34px;
          height: 34px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
        }
        .btn-action-edit:hover {
          color: #4f46e5;
          background-color: #f5f3ff;
          border-color: #ddd6fe;
        }
        .btn-action-delete:hover {
          color: #ef4444;
          background-color: #fef2f2;
          border-color: #fee2e2;
        }

        /* Modal system */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-window {
          background: #ffffff;
          width: 100%;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          overflow: hidden;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          animation: modalEnter 0.2s ease-out;
        }
        @keyframes modalEnter {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-window-small {
          max-width: 450px;
        }
        .modal-window-large {
          max-width: 600px;
        }
        .modal-header {
          padding: 20px 30px;
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.3px;
        }
        .btn-modal-close {
          background: none;
          border: none;
          width: 30px;
          height: 30px;
          border-radius: 6px;
          cursor: pointer;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }
        .btn-modal-close:hover {
          background-color: #e2e8f0;
          color: #475569;
        }
        .modal-body {
          padding: 30px;
          overflow-y: auto;
          flex-grow: 1;
        }
        .modal-footer {
          padding: 20px 30px;
          background-color: #f8fafc;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        /* Form styling */
        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-wrapper i, .input-wrapper span.prefix {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          font-size: 14px;
        }
        .input-wrapper span.prefix {
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
        }
        .input-control {
          width: 100%;
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 14px;
          color: #0f172a;
          transition: border-color 0.2s, background-color 0.2s;
          outline: none;
        }
        .input-with-icon {
          padding-left: 38px;
        }
        .input-control:focus {
          border-color: #6366f1;
          background-color: #ffffff;
        }
        
        /* Edit rights block card */
        .rights-toggle-card {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
        }
        .rights-toggle-info h5 {
          margin: 0 0 2px 0;
          font-size: 13px;
          font-weight: 700;
          color: #334155;
        }
        .rights-toggle-info p {
          margin: 0;
          font-size: 11px;
          color: #64748b;
        }
        .rights-checkbox {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        /* Buttons */
        .btn-modal-cancel {
          background-color: #ffffff;
          border: 1px solid #cbd5e1;
          padding: 10px 18px;
          border-radius: 10px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          font-size: 13px;
        }
        .btn-modal-cancel:hover {
          background-color: #f8fafc;
        }
        .btn-modal-submit {
          background-color: #059669;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 700;
          color: #ffffff;
          cursor: pointer;
          font-size: 13px;
          box-shadow: 0 2px 6px rgba(5,150,105,0.2);
        }
        .btn-modal-submit:hover {
          background-color: #047857;
        }
        .btn-modal-delete {
          background-color: #ef4444;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 700;
          color: #ffffff;
          cursor: pointer;
          font-size: 13px;
          box-shadow: 0 2px 6px rgba(239,68,68,0.2);
        }
        .btn-modal-delete:hover {
          background-color: #dc2626;
        }

        /* Spinner */
        .modal-spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid #ffffff;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Delete Confirmation layout */
        .delete-dialog-content {
          text-align: center;
          padding: 10px 0;
        }
        .delete-warning-icon {
          width: 60px;
          height: 60px;
          background-color: #fee2e2;
          color: #ef4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          margin: 0 auto 16px auto;
        }
        .delete-dialog-content h3 {
          margin: 0 0 10px 0;
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
        }
        .delete-dialog-content p {
          margin: 0;
          font-size: 14px;
          color: #64748b;
          line-height: 1.5;
        }

        /* Toast Popup notification */
        .toast-notify {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 99999;
          padding: 14px 24px;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
          color: #ffffff;
          font-weight: 600;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 10px;
          animation: toastEnter 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .toast-success { background-color: #10b981; }
        .toast-error { background-color: #ef4444; }
        @keyframes toastEnter {
          from { transform: translateY(-15px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />

      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notify ${toast.type === "success" ? "toast-success" : "toast-error"}`}>
          <i className={toast.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="drivers-header-banner">
        <div className="drivers-header-info">
          <h1>Driver Registry</h1>
          <p>Manage driver profiles, license records, dynamic edit rights, and active vehicle assignments.</p>
        </div>
        <button onClick={() => router.push("/admin/hub")} className="btn-header-back">
          <i className="fas fa-arrow-left"></i>
          Back to Hub
        </button>
      </div>

      {/* Controls & Actions */}
      <div className="controls-row">
        <div className="search-wrapper">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search drivers by name, username, or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <button onClick={openAddModal} className="btn-create-driver">
          <i className="fas fa-plus"></i>
          Add New Driver
        </button>
      </div>

      {/* Main Registry Table Card */}
      <div className="drivers-table-card">
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px 0" }}>
            <div style={{ width: "40px", height: "40px", border: "4px solid #059669", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite", marginBottom: "16px" }} />
            <span style={{ color: "#64748b", fontSize: "14px", fontWeight: "500" }}>Retrieving driver registry...</span>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <i className="fas fa-user-slash" style={{ fontSize: "40px", color: "#cbd5e1", marginBottom: "12px" }}></i>
            <h3 style={{ margin: "0 0 6px 0", color: "#475569", fontSize: "16px", fontWeight: "700" }}>No drivers registered</h3>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
              {search ? "No drivers match your search query." : "Register drivers first to assign them vehicles and let them log trips."}
            </p>
          </div>
        ) : (
          <div className="drivers-table-responsive">
            <table className="drivers-table">
              <thead>
                <tr>
                  <th>Name & Username</th>
                  <th>Contact Phone</th>
                  <th>License Number</th>
                  <th>Assigned Vehicle</th>
                  <th style={{ textAlign: "center" }}>Edit Rights</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map((driver) => (
                  <tr key={driver.id}>
                    <td>
                      <div className="driver-info-stack">
                        <span className="driver-display-name">{driver.name}</span>
                        <span className="driver-username">@{driver.username}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: "500", color: "#475569" }}>{driver.phone || "—"}</td>
                    <td style={{ fontWeight: "500", color: "#475569" }}>{driver.license_no || "—"}</td>
                    <td>
                      {driver.vehicle ? (
                        <span className="badge-vehicle vehicle-active">
                          <i className="fas fa-taxi" style={{ fontSize: "10px" }}></i>
                          <strong>{driver.vehicle.model}</strong>
                          <span style={{ fontSize: "10px", opacity: 0.8 }}>({driver.vehicle.type})</span>
                        </span>
                      ) : (
                        <span className="badge-vehicle vehicle-inactive">
                          <i className="fas fa-ban" style={{ fontSize: "10px" }}></i>
                          Not Assigned
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {driver.edit_rights ? (
                        <span className="badge-rights rights-allowed">Yes</span>
                      ) : (
                        <span className="badge-rights rights-restricted">No (Restricted)</span>
                      )}
                    </td>
                    <td>
                      <div className="actions-btn-group">
                        <button
                          onClick={() => openEditModal(driver)}
                          className="btn-action btn-action-edit"
                          title="Edit Profile"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => setDeletingDriver(driver)}
                          className="btn-action btn-action-delete"
                          title="Delete Driver"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(isAddOpen || editingDriver) && (
        <div className="modal-overlay">
          <div className="modal-window modal-window-large">
            
            {/* Modal Header */}
            <div className="modal-header">
              <h3>{isAddOpen ? "Register New Driver" : "Update Driver Profile"}</h3>
              <button 
                onClick={() => { setIsAddOpen(false); setEditingDriver(null); }}
                className="btn-modal-close"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={isAddOpen ? handleCreate : handleUpdate}>
              <div className="modal-body">
                
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Full Name</label>
                    <div className="input-wrapper">
                      <i className="fas fa-user"></i>
                      <input
                        type="text"
                        required
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Driver Name"
                        className="input-control input-with-icon"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Username</label>
                    <div className="input-wrapper">
                      <span className="prefix">@</span>
                      <input
                        type="text"
                        required
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="username"
                        className="input-control"
                        style={{ paddingLeft: "32px" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>{isAddOpen ? "Password" : "Change Password"}</label>
                    <div className="input-wrapper">
                      <i className="fas fa-key"></i>
                      <input
                        type="password"
                        required={isAddOpen}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder={isAddOpen ? "••••••" : "Leave blank to keep current"}
                        className="input-control input-with-icon"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <div className="input-wrapper">
                      <i className="fas fa-phone"></i>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+966 500 000 000"
                        className="input-control input-with-icon"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>License Number</label>
                    <div className="input-wrapper">
                      <i className="fas fa-id-card"></i>
                      <input
                        type="text"
                        name="license_no"
                        value={formData.license_no}
                        onChange={handleInputChange}
                        placeholder="License #"
                        className="input-control input-with-icon"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Vehicle Assignment</label>
                    <div className="input-wrapper">
                      <i className="fas fa-taxi" style={{ zIndex: 5 }}></i>
                      <select
                        name="vehicle_id"
                        value={formData.vehicle_id}
                        onChange={handleInputChange}
                        className="input-control input-with-icon"
                        style={{ height: "42px" }}
                      >
                        <option value="">No Vehicle (Select to assign)</option>
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.model} ({v.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="rights-toggle-card">
                  <div className="rights-toggle-info">
                    <h5>Grant Log Edit Rights</h5>
                    <p>Allows driver to modify locked entries without contacting admin</p>
                  </div>
                  <input
                    type="checkbox"
                    name="edit_rights"
                    checked={formData.edit_rights}
                    onChange={handleInputChange}
                    className="rights-checkbox"
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setEditingDriver(null); }}
                  className="btn-modal-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-modal-submit"
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {actionLoading && <div className="modal-spinner"></div>}
                  <span>{isAddOpen ? "Register Driver" : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDriver && (
        <div className="modal-overlay">
          <div className="modal-window modal-window-small">
            <div className="modal-body" style={{ padding: "30px 20px" }}>
              <div className="delete-dialog-content">
                <div className="delete-warning-icon">
                  <i className="fas fa-trash-alt"></i>
                </div>
                <h3>Delete Driver Account</h3>
                <p>
                  Are you sure you want to delete <strong>{deletingDriver.name}</strong>? 
                  This action is irreversible and will remove all their system credentials.
                </p>
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: "center" }}>
              <button
                onClick={() => setDeletingDriver(null)}
                className="btn-modal-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="btn-modal-delete"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {actionLoading && <div className="modal-spinner"></div>}
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
