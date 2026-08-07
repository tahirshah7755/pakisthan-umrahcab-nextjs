"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from "@/store/api/usersApi";
import { useGetCompaniesQuery } from "@/store/api/companiesApi";
import { exportToCSV, exportToExcel, exportToPDF } from "@/utils/exportHelper";

export default function UsersManagementPage() {
  const router = useRouter();

  // Queries & Mutations
  const { data: usersData, isLoading: usersLoading, isFetching } = useGetUsersQuery(undefined);
  const { data: companiesData } = useGetCompaniesQuery(undefined);
  
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const companies = Array.isArray(companiesData)
    ? companiesData
    : (Array.isArray((companiesData as any)?.data) ? (companiesData as any).data : []);

  const usersList = Array.isArray(usersData) ? usersData : [];

  // Local UI States
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState<any>(null); // holds user object to reset password

  // Form States for New User
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newUserType, setNewUserType] = useState("COMPANIES"); // ADMIN or COMPANIES
  const [newCompanyId, setNewCompanyId] = useState("");

  // Form States for Password Reset
  const [resetPasswordVal, setResetPasswordVal] = useState("");

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

  const handleCopy = () => {
    if (filteredUsers.length === 0) {
      showToast("No data to copy!", "error");
      return;
    }
    const headers = ["User ID", "Username", "User Role Badge", "Associated Company", "Registered On"];
    const textRows = filteredUsers.map((u: any) => [
      `#${u.id}`,
      u.username || "",
      u.user_type || "",
      u.company ? u.company.name : "System Operator (No Company)",
      u.created_at ? new Date(u.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "--"
    ]);
    const text = [headers.join("\t"), ...textRows.map(r => r.join("\t"))].join("\n");
    navigator.clipboard.writeText(text)
      .then(() => showToast("Copied users list to clipboard!", "success"))
      .catch(() => showToast("Failed to copy!", "error"));
  };

  const [exportingFmt, setExportingFmt] = useState<string | null>(null);

  const handleExportCSV = async () => {
    setExportingFmt("CSV");
    try {
      if (filteredUsers.length === 0) {
        showToast("No data to export!", "error");
        return;
      }
      const headers = ["User ID", "Username", "User Role Badge", "Associated Company", "Registered On"];
      const textRows = filteredUsers.map((u: any) => [
        `#${u.id}`,
        u.username || "",
        u.user_type || "",
        u.company ? u.company.name : "System Operator (No Company)",
        u.created_at ? new Date(u.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "--"
      ]);
      exportToCSV({
        title: "User Registry Report",
        filename: "users_report",
        headers,
        rows: textRows
      });
      showToast(`Exported all ${filteredUsers.length} users to CSV!`, "success");
    } finally {
      setExportingFmt(null);
    }
  };

  const handleExportExcel = async () => {
    setExportingFmt("Excel");
    try {
      if (filteredUsers.length === 0) {
        showToast("No data to export!", "error");
        return;
      }
      const headers = ["User ID", "Username", "User Role Badge", "Associated Company", "Registered On"];
      const textRows = filteredUsers.map((u: any) => [
        `#${u.id}`,
        u.username || "",
        u.user_type || "",
        u.company ? u.company.name : "System Operator (No Company)",
        u.created_at ? new Date(u.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "--"
      ]);
      exportToExcel({
        title: "User Registry Report",
        headers,
        rows: textRows,
        filename: "users_report",
        companyName: "HEBA CAB",
        summary: [
          { label: "Total Users", value: filteredUsers.length }
        ]
      });
      showToast(`Exported all ${filteredUsers.length} users to Excel!`, "success");
    } finally {
      setExportingFmt(null);
    }
  };

  const handlePrint = async (title: string = "User Accounts Directory", fmtType: string = "Print") => {
    setExportingFmt(fmtType);
    try {
      if (filteredUsers.length === 0) {
        showToast("No data to print!", "error");
        return;
      }
      const headers = ["User ID", "Username", "User Role Badge", "Associated Company", "Registered On"];
      const textRows = filteredUsers.map((u: any) => [
        `#${u.id}`,
        u.username || "",
        u.user_type || "",
        u.company ? u.company.name : "System Operator (No Company)",
        u.created_at ? new Date(u.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "--"
      ]);
      await exportToPDF({
        title,
        filename: "users_report",
        headers,
        rows: textRows,
        companyName: "HEBA CAB",
        orientation: "landscape",
        summary: [
          { label: "Total Users", value: filteredUsers.length }
        ]
      });
    } finally {
      setExportingFmt(null);
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      showToast("Please enter a username.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }
    if (newUserType === "COMPANIES" && !newCompanyId) {
      showToast("Please select an associated company for company type user.", "error");
      return;
    }

    try {
      const payload = {
        username: newUsername,
        password: newPassword,
        user_type: newUserType,
        company_id: newUserType === "COMPANIES" ? parseInt(newCompanyId) : null,
      };

      await createUser(payload).unwrap();
      showToast("New platform user registered successfully!", "success");
      
      // Reset form & close modal
      setNewUsername("");
      setNewPassword("");
      setNewUserType("COMPANIES");
      setNewCompanyId("");
      setShowAddModal(false);
    } catch (err: any) {
      console.error(err);
      showToast(err?.data?.message || "Failed to create user.", "error");
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPasswordVal.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }

    try {
      await updateUser({
        id: showResetModal.id,
        username: showResetModal.username,
        password: resetPasswordVal,
        user_type: showResetModal.user_type,
        company_id: showResetModal.company_id,
      }).unwrap();

      showToast(`Password updated for user '${showResetModal.username}'!`, "success");
      setResetPasswordVal("");
      setShowResetModal(null);
    } catch (err: any) {
      console.error(err);
      showToast(err?.data?.message || "Failed to update password.", "error");
    }
  };

  const handleDeleteUser = async (id: number, username: string) => {
    if (!confirm(`Are you sure you want to permanently delete user '${username}'?`)) {
      return;
    }

    try {
      await deleteUser(id).unwrap();
      showToast(`User '${username}' deleted successfully.`, "success");
    } catch (err: any) {
      console.error(err);
      showToast(err?.data?.message || "Failed to delete user.", "error");
    }
  };

  // Filter users
  const filteredUsers = usersList.filter((u: any) => {
    const s = search.toLowerCase();
    const matchUser = String(u.username || "").toLowerCase().includes(s);
    const matchComp = String(u.company?.name || "").toLowerCase().includes(s);
    return matchUser || matchComp;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "10px" }}>
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

      {/* Header Banner */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #475569 0%, #334155 100%)", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
        <div>
          <h2>User Accounts Management</h2>
          <p>Register administrative operators, audit login roles, and reset client agency passwords.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={() => setShowAddModal(true)} className="form-btn-back" style={{ background: "#ffffff", color: "#334155", fontWeight: "700", border: "1px solid #cbd5e1" }}>
            <i className="fas fa-user-plus" style={{ color: "#334155" }}></i>
            <span>Register New User</span>
          </button>
          <button onClick={() => router.push("/admin/hub")} className="form-btn-back">
            <i className="fas fa-arrow-left"></i>
            <span>Back to Hub</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="matrix-search-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", flexWrap: "wrap", gap: "15px" }}>
        <div className="matrix-search-input-wrapper" style={{ flex: 1, maxWidth: "400px", marginBottom: 0 }}>
          <i className="fas fa-search matrix-search-icon" style={{ color: "#475569" }}></i>
          <input
            type="text"
            className="matrix-search-input"
            placeholder="Search users by name or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button disabled={!!exportingFmt} onClick={handleCopy} style={{ background: "#475569", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: exportingFmt ? "not-allowed" : "pointer", transition: "all 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "#334155"} onMouseLeave={(e) => e.currentTarget.style.background = "#475569"}>
            Copy
          </button>
          <button disabled={!!exportingFmt} onClick={handleExportCSV} style={{ background: "#475569", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: exportingFmt ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px", transition: "all 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "#334155"} onMouseLeave={(e) => e.currentTarget.style.background = "#475569"}>
            {exportingFmt === "CSV" && <i className="fas fa-spinner fa-spin"></i>}
            <span>CSV</span>
          </button>
          <button disabled={!!exportingFmt} onClick={handleExportExcel} style={{ background: "#475569", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: exportingFmt ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px", transition: "all 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "#334155"} onMouseLeave={(e) => e.currentTarget.style.background = "#475569"}>
            {exportingFmt === "Excel" && <i className="fas fa-spinner fa-spin"></i>}
            <span>Excel</span>
          </button>
          <button disabled={!!exportingFmt} onClick={() => handlePrint("User Accounts Registry - PDF Report", "PDF")} style={{ background: "#475569", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: exportingFmt ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px", transition: "all 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "#334155"} onMouseLeave={(e) => e.currentTarget.style.background = "#475569"}>
            {exportingFmt === "PDF" && <i className="fas fa-spinner fa-spin"></i>}
            <span>PDF</span>
          </button>
          <button disabled={!!exportingFmt} onClick={() => handlePrint("User Accounts Directory", "Print")} style={{ background: "#475569", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: exportingFmt ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px", transition: "all 0.15s ease" }} onMouseEnter={(e) => e.currentTarget.style.background = "#334155"} onMouseLeave={(e) => e.currentTarget.style.background = "#475569"}>
            {exportingFmt === "Print" && <i className="fas fa-spinner fa-spin"></i>}
            <span>Print</span>
          </button>
          {isFetching && (
            <span style={{ fontSize: "12px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px", marginLeft: "10px" }}>
              <div className="spinner" style={{ width: "12px", height: "12px", borderWidth: "2px", borderTopColor: "#475569" }}></div>
              Updating...
            </span>
          )}
        </div>
      </div>

      {/* Users List Table */}
      <div className="table-card" style={{ padding: 0, overflow: "hidden" }}>
        {usersLoading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
            <div className="spinner" style={{ borderTopColor: "#475569" }}></div>
            <span style={{ marginLeft: "12px", color: "#64748b", fontWeight: "600" }}>Loading User Directory...</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="db-table" style={{ margin: 0, fontSize: "13px" }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: "16px" }}>User ID</th>
                  <th>Username</th>
                  <th>User Role Badge</th>
                  <th>Associated Company</th>
                  <th>Registered On</th>
                  <th style={{ paddingRight: "16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                      No user accounts found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u: any) => (
                    <tr key={u.id}>
                      <td style={{ paddingLeft: "16px", color: "#64748b", fontWeight: "700" }}>
                        #{u.id}
                      </td>
                      <td style={{ fontWeight: "700", color: "#1e293b" }}>
                        {u.username}
                      </td>
                      <td>
                        <span
                          className="status-pill"
                          style={{
                            background: u.user_type === "ADMIN" ? "#fee2e2" : "#dbeafe",
                            color: u.user_type === "ADMIN" ? "#dc2626" : "#2563eb",
                            border: u.user_type === "ADMIN" ? "1px solid #fee2e2" : "1px solid #dbeafe",
                            fontSize: "11px",
                            fontWeight: "800",
                            padding: "3px 8px"
                          }}
                        >
                          {u.user_type}
                        </span>
                      </td>
                      <td style={{ fontWeight: "600", color: "#475569" }}>
                        {u.company ? (
                          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <i className="fas fa-building" style={{ color: "#94a3b8" }}></i>
                            {u.company.name}
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontStyle: "italic" }}>System Operator (No Company)</span>
                        )}
                      </td>
                      <td>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "--"}
                      </td>
                      <td style={{ paddingRight: "16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px" }}>
                          <button
                            title="Reset Password"
                            onClick={() => setShowResetModal(u)}
                            style={{ background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <i className="fas fa-key"></i>
                          </button>
                          <button
                            title="Delete User Account"
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            disabled={isDeleting}
                            style={{ background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <i className="fas fa-trash-can"></i>
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

      {/* Add User Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "500px", margin: "20px", borderTop: "6px solid #475569", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                <i className="fas fa-user-plus" style={{ marginRight: "8px", color: "#475569" }}></i> Register Operator Account
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "transparent", border: "none", fontSize: "18px", cursor: "pointer", color: "#94a3b8" }}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateUserSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label">Username *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-user form-icon"></i>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter login username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Password * (Min 6 Characters)</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-lock form-icon"></i>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">User Role / System Type *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-shield-halved form-icon"></i>
                  <select
                    className="form-input form-select"
                    value={newUserType}
                    onChange={(e) => setNewUserType(e.target.value)}
                    required
                  >
                    <option value="COMPANIES">COMPANIES (Client Company Branch Access)</option>
                    <option value="ADMIN">ADMIN (Central System Admin)</option>
                  </select>
                  <i className="fas fa-chevron-down select-arrow"></i>
                </div>
              </div>

              {newUserType === "COMPANIES" && (
                <div>
                  <label className="form-label">Associated Company *</label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-building form-icon"></i>
                    <select
                      className="form-input form-select"
                      value={newCompanyId}
                      onChange={(e) => setNewCompanyId(e.target.value)}
                      required
                    >
                      <option value="">Select associated corporate branch...</option>
                      {companies.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <i className="fas fa-chevron-down select-arrow"></i>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background: "transparent", color: "#64748b", border: "1px solid #cbd5e1",
                    borderRadius: "6px", padding: "8px 20px", fontSize: "13px", fontWeight: "600", cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isCreating} className="btn-submit" style={{ background: "linear-gradient(135deg, #475569 0%, #334155 100%)", width: "auto" }}>
                  {isCreating ? "Saving Operator..." : "Create Operator Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "450px", margin: "20px", borderTop: "6px solid #475569", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                <i className="fas fa-key" style={{ marginRight: "8px", color: "#475569" }}></i> Reset User Password
              </h3>
              <button onClick={() => setShowResetModal(null)} style={{ background: "transparent", border: "none", fontSize: "18px", cursor: "pointer", color: "#94a3b8" }}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleResetPasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                You are updating the login credentials for user: <strong style={{ color: "#1e293b" }}>{showResetModal.username}</strong>
              </p>

              <div>
                <label className="form-label">New Password * (Min 6 Characters)</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-lock form-icon"></i>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={resetPasswordVal}
                    onChange={(e) => setResetPasswordVal(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowResetModal(null)}
                  style={{
                    background: "transparent", color: "#64748b", border: "1px solid #cbd5e1",
                    borderRadius: "6px", padding: "8px 20px", fontSize: "13px", fontWeight: "600", cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isUpdating} className="btn-submit" style={{ background: "linear-gradient(135deg, #475569 0%, #334155 100%)", width: "auto" }}>
                  {isUpdating ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", color: "#94a3b8", fontSize: "12px" }}>
        <span>&copy; 2026 Umrah Cab. User Management Portal.</span>
        <span>v2.0</span>
      </div>
    </div>
  );
}
