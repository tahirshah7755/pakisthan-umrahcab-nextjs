"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../utils/api";
import { useAuth } from "../../../context/AuthContext";

// Available modules for permission mapping
const MODULES = [
  { key: "bookings", label: "Bookings & Trips" },
  { key: "customers", label: "Customers Profiles" },
  { key: "companies", label: "B2B Agencies" },
  { key: "fleet", label: "Fleet Inventory" },
  { key: "drivers", label: "Drivers & Daily Logs" },
  { key: "flights", label: "Flights Setup" },
  { key: "trains", label: "Trains Setup" },
  { key: "hotels", label: "Hotels Setup" },
  { key: "services", label: "Services Catalogue" },
  { key: "invoices", label: "Invoicing & Billing" },
  { key: "ledgers", label: "Financial Ledgers" },
  { key: "balance", label: "Balance Statements" },
  { key: "payments", label: "General Payments" },
  { key: "agent_followups", label: "Agent Follow-ups" },
  { key: "chat", label: "Chat Support" },
  { key: "reminders", label: "Reminders & Notices" },
  { key: "scanner", label: "Document Scanner" },
  { key: "sub_admins", label: "Sub-Admins & Permissions" }
];

const ACCESS_LEVELS = [
  { value: "none", label: "No Access", activeStyle: "btn-access-none-active", color: "#64748b" },
  { value: "view", label: "View Only", activeStyle: "btn-access-view-active", color: "#3b82f6" },
  { value: "edit", label: "View & Edit", activeStyle: "btn-access-edit-active", color: "#f59e0b" },
  { value: "delete", label: "Full Control", activeStyle: "btn-access-delete-active", color: "#10b981" }
];

export default function AdminSubAdminsPage() {
  const router = useRouter();
  const { user: currentAdmin } = useAuth();

  // Data State
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Toast notifications
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    role: "SUB_ADMIN",
    permissions: {} as Record<string, string>
  });

  useEffect(() => {
    loadAdmins();
  }, []);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  };

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const data = await api.getSubAdmins();
      setAdmins(data || []);
    } catch (err) {
      showToast("Failed to load admin accounts.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (moduleKey: string, level: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleKey]: level
      }
    }));
  };

  const initializeDefaultPermissions = () => {
    const perms: Record<string, string> = {};
    MODULES.forEach(m => {
      perms[m.key] = "none";
    });
    return perms;
  };

  const openAddModal = () => {
    setFormData({
      name: "",
      email: "",
      username: "",
      password: "",
      role: "SUB_ADMIN",
      permissions: initializeDefaultPermissions()
    });
    setIsAddOpen(true);
  };

  const openEditModal = (admin: any) => {
    setEditingAdmin(admin);
    
    // Parse existing permissions, fallback to defaults if empty
    const currentPerms = admin.permissions || {};
    const formattedPerms: Record<string, string> = {};
    MODULES.forEach(m => {
      formattedPerms[m.key] = currentPerms[m.key] || "none";
    });

    setFormData({
      name: admin.name || "",
      email: admin.email || "",
      username: admin.username || "",
      password: "", // Keep password blank unless changing
      role: admin.role || "SUB_ADMIN",
      permissions: formattedPerms
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = { ...formData };
      if (payload.role === "SUPER_ADMIN") {
        delete (payload as any).permissions;
      }
      const res = await api.createSubAdmin(payload);
      if (res.success) {
        showToast("Administrator registered successfully!", "success");
        setIsAddOpen(false);
        loadAdmins();
      } else {
        showToast(res.error || "Failed to create administrator.", "error");
      }
    } catch (err) {
      showToast("An unexpected error occurred.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    setActionLoading(true);
    try {
      const payload = { ...formData };
      if (!payload.password) {
        delete (payload as any).password;
      }
      if (payload.role === "SUPER_ADMIN") {
        (payload as any).permissions = null;
      }
      const res = await api.updateSubAdmin(editingAdmin.id, payload);
      if (res.success) {
        showToast("Administrator privileges updated successfully!", "success");
        setEditingAdmin(null);
        loadAdmins();
      } else {
        showToast(res.error || "Failed to update administrator.", "error");
      }
    } catch (err) {
      showToast("An unexpected error occurred.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAdmin) return;
    setActionLoading(true);
    try {
      const res = await api.deleteSubAdmin(deletingAdmin.id);
      if (res.success) {
        showToast("Administrator account deleted successfully!", "success");
        setDeletingAdmin(null);
        loadAdmins();
      } else {
        showToast(res.error || "Failed to delete account.", "error");
      }
    } catch (err) {
      showToast("An unexpected error occurred.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="security-page-container">
      {/* Premium Embedded Styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .security-page-container {
          padding: 30px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          font-family: 'Inter', sans-serif;
          background-color: #f8fafc;
          min-height: calc(100vh - 70px);
        }
        
        /* Gradient Header Banner */
        .security-header-banner {
          background: linear-gradient(135deg, #312e81 0%, #1e1b4b 100%);
          padding: 30px 40px;
          border-radius: 20px;
          color: #ffffff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 10px 25px -5px rgba(49, 46, 129, 0.15);
          flex-wrap: wrap;
          gap: 20px;
        }
        .security-header-info h1 {
          font-size: 28px;
          font-weight: 800;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }
        .security-header-info p {
          margin: 0;
          color: #c7d2fe;
          font-size: 14px;
          font-weight: 500;
        }
        .btn-header-back {
          background: rgba(255, 255, 255, 0.12);
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
          background: rgba(255, 255, 255, 0.22);
          transform: translateY(-1px);
        }

        /* Warnings & Alerts */
        .security-alert-card {
          background-color: #fffbeb;
          border: 1px solid #fef3c7;
          border-left: 5px solid #d97706;
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }
        .security-alert-card i {
          color: #d97706;
          font-size: 18px;
          margin-top: 2px;
        }
        .security-alert-info h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 700;
          color: #78350f;
        }
        .security-alert-info p {
          margin: 0;
          font-size: 12px;
          color: #92400e;
          line-height: 1.6;
        }

        /* Top Action Bar */
        .security-actions-bar {
          display: flex;
          justify-content: flex-end;
          align-items: center;
        }
        .btn-add-admin {
          background-color: #4f46e5;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          color: #ffffff;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-add-admin:hover {
          background-color: #4338ca;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(79, 70, 229, 0.35);
        }

        /* Main Registry Table Grid */
        .security-table-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01);
          overflow: hidden;
        }
        .security-table-responsive {
          overflow-x: auto;
          width: 100%;
        }
        .security-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .security-table th {
          background-color: #f8fafc;
          padding: 18px 24px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          border-bottom: 1px solid #e2e8f0;
        }
        .security-table td {
          padding: 18px 24px;
          font-size: 14px;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .security-table tr:last-child td {
          border-bottom: none;
        }
        .security-table tr:hover td {
          background-color: #f8fafc;
        }

        /* User Profile Badge Stack */
        .profile-name-stack {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .profile-display-name {
          font-weight: 700;
          color: #0f172a;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .profile-username {
          font-size: 12px;
          color: #94a3b8;
        }
        .badge-self {
          background-color: #0f172a;
          color: #ffffff;
          font-size: 9px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Role Badges */
        .badge-role {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .role-super {
          background-color: #faf5ff;
          color: #6b21a8;
          border: 1px solid #f3e8ff;
        }
        .role-sub {
          background-color: #eef2ff;
          color: #3730a3;
          border: 1px solid #e0e7ff;
        }

        /* Permissions tags container */
        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          max-width: 380px;
        }
        .tag-permission {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid transparent;
        }
        .tag-view { background-color: #eff6ff; color: #1d4ed8; border-color: #dbeafe; }
        .tag-edit { background-color: #fffbeb; color: #b45309; border-color: #fef3c7; }
        .tag-delete { background-color: #ecfdf5; color: #047857; border-color: #d1fae5; }
        .tag-none { color: #94a3b8; font-style: italic; }

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
        .btn-action-disabled {
          background-color: #f8fafc;
          color: #cbd5e1;
          cursor: not-allowed;
        }

        /* Modal Backdrop */
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
          max-width: 750px;
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

        /* Form Controls */
        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .form-row-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
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
        .input-control {
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 14px;
          color: #0f172a;
          transition: border-color 0.2s, background-color 0.2s;
          outline: none;
        }
        .input-control:focus {
          border-color: #4f46e5;
          background-color: #ffffff;
        }

        /* Permission Matrix Styling */
        .matrix-title-block {
          margin-top: 24px;
          margin-bottom: 14px;
        }
        .matrix-title-block h4 {
          margin: 0 0 4px 0;
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
        }
        .matrix-title-block p {
          margin: 0;
          font-size: 12px;
          color: #64748b;
        }
        .matrix-table-container {
          border: 1px solid #cbd5e1;
          border-radius: 14px;
          overflow: hidden;
        }
        .matrix-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .matrix-table th {
          background-color: #f8fafc;
          padding: 12px 16px;
          font-weight: 700;
          text-transform: uppercase;
          color: #475569;
          border-bottom: 1px solid #cbd5e1;
        }
        .matrix-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: middle;
        }
        .matrix-table tr:last-child td {
          border-bottom: none;
        }
        
        /* Matrix Buttons Grid */
        .access-btn-grid {
          display: flex;
          justify-content: center;
          gap: 6px;
        }
        .btn-access-choice {
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background-color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          color: #64748b;
        }
        .btn-access-choice:hover {
          background-color: #f8fafc;
        }
        
        /* Active matrix state buttons */
        .btn-access-none-active {
          background-color: #64748b;
          color: #ffffff;
          border-color: #64748b;
          box-shadow: 0 2px 4px rgba(100,116,139,0.2);
        }
        .btn-access-view-active {
          background-color: #3b82f6;
          color: #ffffff;
          border-color: #3b82f6;
          box-shadow: 0 2px 4px rgba(59,130,246,0.2);
        }
        .btn-access-edit-active {
          background-color: #f59e0b;
          color: #ffffff;
          border-color: #f59e0b;
          box-shadow: 0 2px 4px rgba(245,158,11,0.2);
        }
        .btn-access-delete-active {
          background-color: #10b981;
          color: #ffffff;
          border-color: #10b981;
          box-shadow: 0 2px 4px rgba(16,185,129,0.2);
        }

        /* Generic modal buttons */
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
          background-color: #4f46e5;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 700;
          color: #ffffff;
          cursor: pointer;
          font-size: 13px;
          box-shadow: 0 2px 6px rgba(79,70,229,0.2);
        }
        .btn-modal-submit:hover {
          background-color: #4338ca;
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

        /* Loader inside modal */
        .modal-spinner {
          width: 18px;
          height: 18px;
          border: 2.5px border #ffffff;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Delete Confirmation Dialog layout */
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

      {/* Page Header Banner */}
      <div className="security-header-banner">
        <div className="security-header-info">
          <h1>Security & Permissions</h1>
          <p>Manage administrative accounts, configure sub-admin staff, and map modular role-based permission matrices.</p>
        </div>
        <button onClick={() => router.push("/admin/hub")} className="btn-header-back">
          <i className="fas fa-arrow-left"></i>
          Back to Hub
        </button>
      </div>

      {/* Warning/Info Alert */}
      <div className="security-alert-card">
        <i className="fas fa-info-circle"></i>
        <div className="security-alert-info">
          <h4>Super Admin Privileges</h4>
          <p>
            Super Admins bypass all modular security gates and have full reading, writing, and deletion rights across the system. 
            Sub-Admins are restricted to views and actions explicitly permitted in their security matrices below.
          </p>
        </div>
      </div>

      {/* Actions Row */}
      <div className="security-actions-bar">
        <button onClick={openAddModal} className="btn-add-admin">
          <i className="fas fa-plus"></i>
          Add Administrator
        </button>
      </div>

      {/* Admins Registry List Table */}
      <div className="security-table-card">
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px 0" }}>
            <div style={{ width: "40px", height: "40px", border: "4px solid #4f46e5", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite", marginBottom: "16px" }} />
            <span style={{ color: "#64748b", fontSize: "14px", fontWeight: "500" }}>Retrieving security clearances...</span>
          </div>
        ) : (
          <div className="security-table-responsive">
            <table className="security-table">
              <thead>
                <tr>
                  <th>Administrator</th>
                  <th>Email Address</th>
                  <th>Role Clearance</th>
                  <th>Permissions Overview</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => {
                  const isSelf = currentAdmin ? currentAdmin.username === admin.username : false;
                  return (
                    <tr key={admin.id}>
                      <td>
                        <div className="profile-name-stack">
                          <div className="profile-display-name">
                            {admin.name}
                            {isSelf && <span className="badge-self">You</span>}
                          </div>
                          <div className="profile-username">@{admin.username}</div>
                        </div>
                      </td>
                      <td style={{ color: "#475569", fontWeight: "500" }}>{admin.email}</td>
                      <td>
                        {admin.role === "SUPER_ADMIN" ? (
                          <span className="badge-role role-super">
                            <i className="fas fa-shield-alt"></i>
                            Super Admin
                          </span>
                        ) : (
                          <span className="badge-role role-sub">
                            <i className="fas fa-user-shield"></i>
                            Sub-Admin
                          </span>
                        )}
                      </td>
                      <td>
                        {admin.role === "SUPER_ADMIN" ? (
                          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "500" }}>
                            Bypasses all checks (Full System Access)
                          </span>
                        ) : (
                          <div className="tags-container">
                            {MODULES.map(m => {
                              const right = admin.permissions?.[m.key] || "none";
                              if (right === "none") return null;
                              return (
                                <span 
                                  key={m.key} 
                                  className={`tag-permission ${
                                    right === "view" ? "tag-view" :
                                    right === "edit" ? "tag-edit" :
                                    "tag-delete"
                                  }`}
                                >
                                  {m.label.split(" ")[0]}: {right}
                                </span>
                              );
                            })}
                            {(!admin.permissions || Object.values(admin.permissions || {}).every(v => v === "none")) && (
                              <span className="tag-none">No modular access granted yet.</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="actions-btn-group">
                          <button
                            onClick={() => openEditModal(admin)}
                            className="btn-action btn-action-edit"
                            title="Configure clearances"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => setDeletingAdmin(admin)}
                            disabled={isSelf}
                            className={`btn-action btn-action-delete ${isSelf ? "btn-action-disabled" : ""}`}
                            title={isSelf ? "Cannot delete yourself" : "Revoke clearance"}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Administrator Modal */}
      {(isAddOpen || editingAdmin) && (
        <div className="modal-overlay">
          <div className="modal-window modal-window-large">
            
            {/* Modal Header */}
            <div className="modal-header">
              <h3>{isAddOpen ? "Add New Administrator" : "Configure Administrator Clearances"}</h3>
              <button 
                onClick={() => { setIsAddOpen(false); setEditingAdmin(null); }}
                className="btn-modal-close"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={isAddOpen ? handleCreate : handleUpdate} style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
              <div className="modal-body">
                
                {/* Basic Details Rows */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Display Name</label>
                    <input
                      type="text"
                      required
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. John Doe"
                      className="input-control"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      required
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@umrahcab.com"
                      className="input-control"
                    />
                  </div>
                </div>

                <div className="form-row-3">
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      required
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="johndoe"
                      className="input-control"
                    />
                  </div>

                  <div className="form-group">
                    <label>{isAddOpen ? "Password" : "Change Password"}</label>
                    <input
                      type="password"
                      required={isAddOpen}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder={isAddOpen ? "••••••" : "Leave blank to keep same"}
                      className="input-control"
                    />
                  </div>

                  <div className="form-group">
                    <label>Clearance Level</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="input-control"
                      style={{ height: "42px" }}
                    >
                      <option value="SUB_ADMIN">Sub-Admin (Restricted Clearance)</option>
                      <option value="SUPER_ADMIN">Super Admin (Bypasses Matrix)</option>
                    </select>
                  </div>
                </div>

                {/* Interactive Permission Matrix (Only for SUB_ADMIN) */}
                {formData.role === "SUB_ADMIN" && (
                  <div className="matrix-title-block">
                    <h4>Modular Access Matrix</h4>
                    <p>Assign view, edit, or full control rights individually for each functional module.</p>
                    
                    <div className="matrix-table-container" style={{ marginTop: "12px" }}>
                      <table className="matrix-table">
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", width: "40%" }}>System Module</th>
                            <th style={{ textAlign: "center" }}>Access Selection</th>
                          </tr>
                        </thead>
                        <tbody>
                          {MODULES.map((mod) => {
                            const activeLevel = formData.permissions[mod.key] || "none";
                            return (
                              <tr key={mod.key}>
                                <td style={{ fontWeight: "700", color: "#334155" }}>{mod.label}</td>
                                <td>
                                  <div className="access-btn-grid">
                                    {ACCESS_LEVELS.map((lvl) => {
                                      const isSelected = activeLevel === lvl.value;
                                      return (
                                        <button
                                          key={lvl.value}
                                          type="button"
                                          onClick={() => handlePermissionChange(mod.key, lvl.value)}
                                          className={`btn-access-choice ${isSelected ? lvl.activeStyle : ""}`}
                                        >
                                          {lvl.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setEditingAdmin(null); }}
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
                  <span>{isAddOpen ? "Register Administrator" : "Save Clearances"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog Modal */}
      {deletingAdmin && (
        <div className="modal-overlay">
          <div className="modal-window modal-window-small">
            <div className="modal-body" style={{ padding: "30px 20px" }}>
              <div className="delete-dialog-content">
                <div className="delete-warning-icon">
                  <i className="fas fa-trash-alt"></i>
                </div>
                <h3>Revoke Clearance</h3>
                <p>
                  Are you sure you want to delete the administrator account for <strong>{deletingAdmin.name}</strong>? 
                  They will immediately lose all access to the administrative dashboard.
                </p>
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: "center" }}>
              <button
                onClick={() => setDeletingAdmin(null)}
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
                <span>Revoke Access</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
