"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { exportToExcel, exportToCSV, exportToPDF } from "@/utils/exportHelper";

interface CompanyItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  vouchers: boolean;
  reminders: boolean;
  invoice: boolean;
}

export default function CompaniesPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Determine permissions
  const getPermission = () => {
    if (!user) return "none";
    if (user.role === "SUPER_ADMIN") return "full";
    const userPerms = (user as any).permissions || {};
    return userPerms["companies"] || "none";
  };

  const permission = getPermission();
  const canEdit = permission === "edit" || permission === "full";

  // Redirect if unauthorized
  useEffect(() => {
    if (user && user.role !== "SUPER_ADMIN") {
      const userPerms = (user as any).permissions || {};
      const access = userPerms["companies"] || "none";
      if (access === "none") {
        router.push("/admin/hub");
      }
    }
  }, [user, router]);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Search States
  const [comPage, setComPage] = useState(1);
  const [comPerPage] = useState(10);
  const [comSearch, setComSearch] = useState("");

  // Toast notification
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
    if (filteredCompanies.length === 0) {
      showToast("No data to copy!", "error");
      return;
    }
    const headers = ["ID", "Company Name", "Contact Email", "Phone", "Address"];
    const textRows = filteredCompanies.map((c: any) => [
      c.id,
      c.name || "",
      c.email || "",
      c.phone || "",
      c.address || ""
    ]);
    const text = [headers.join("\t"), ...textRows.map(r => r.join("\t"))].join("\n");
    navigator.clipboard.writeText(text)
      .then(() => showToast("Copied companies list to clipboard!", "success"))
      .catch(() => showToast("Failed to copy!", "error"));
  };

  const [exportingFmt, setExportingFmt] = useState<string | null>(null);

  const buildAdminCompaniesExportData = () => {
    const headers = ["ID", "Company Name", "Contact Email", "Phone", "Address"];
    const rows = filteredCompanies.map((c: any) => [
      c.id,
      c.name || "",
      c.email || "",
      c.phone || "",
      c.address || ""
    ]);
    return { headers, rows };
  };

  const handleExportCSV = async () => {
    setExportingFmt("CSV");
    try {
      if (filteredCompanies.length === 0) {
        showToast("No data to export!", "error");
        return;
      }
      const { headers, rows } = buildAdminCompaniesExportData();
      exportToCSV({
        title: "Corporate Directory Registry",
        filename: "companies_report",
        headers,
        rows
      });
      showToast(`Exported all ${filteredCompanies.length} companies to CSV!`, "success");
    } finally {
      setExportingFmt(null);
    }
  };

  const handleExportExcel = async () => {
    setExportingFmt("Excel");
    try {
      if (filteredCompanies.length === 0) {
        showToast("No data to export!", "error");
        return;
      }
      const { headers, rows } = buildAdminCompaniesExportData();
      exportToExcel({
        title: "Corporate Directory Registry",
        filename: "companies_report",
        headers,
        rows,
        companyName: "HEBA CAB",
        summary: [
          { label: "Total Companies", value: filteredCompanies.length }
        ]
      });
      showToast(`Exported all ${filteredCompanies.length} companies to Excel!`, "success");
    } finally {
      setExportingFmt(null);
    }
  };

  const handlePrint = async (title: string = "Corporate Account Statement", fmtType: string = "Print") => {
    setExportingFmt(fmtType);
    try {
      if (filteredCompanies.length === 0) {
        showToast("No data to print!", "error");
        return;
      }
      const { headers, rows } = buildAdminCompaniesExportData();
      await exportToPDF({
        title,
        filename: "companies_report",
        headers,
        rows,
        companyName: "HEBA CAB",
        orientation: "landscape",
        summary: [
          { label: "Total Companies", value: filteredCompanies.length }
        ]
      });
    } finally {
      setExportingFmt(null);
    }
  };

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        const list = await api.getCompanies();
        if (list) {
          setCompanies(list.map((c: any) => ({
            id: c.custom_id || `#COM-${c.id}`,
            name: c.name,
            email: c.email || "N/A",
            phone: c.phone || "N/A",
            address: c.address || "N/A",
            vouchers: !!c.vouchers,
            reminders: !!c.reminders,
            invoice: !!c.invoice
          })));
        } else {
          // Fallback corporate list
          setCompanies([
            { id: "#COM-1", name: "Zahid Travels", email: "zahid@travels.com", phone: "+966501234567", address: "Jeddah", vouchers: true, reminders: true, invoice: true },
            { id: "#COM-2", name: "Al-Latif Group", email: "contact@allatif.com", phone: "+966549876543", address: "Makkah", vouchers: true, reminders: false, invoice: true }
          ]);
        }
      } catch (err) {
        console.error(err);
        showToast("Failed to fetch corporate directory.", "error");
      } finally {
        setLoading(false);
      }
    };
    loadCompanies();
  }, []);

  const filteredCompanies = companies.filter(c => {
    const query = comSearch.toLowerCase().trim();
    if (!query) return true;
    return (
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.phone.toLowerCase().includes(query) ||
      c.id.toLowerCase().includes(query)
    );
  });

  // Pagination calculation
  const totalItems = filteredCompanies.length;
  const totalPages = Math.ceil(totalItems / comPerPage) || 1;
  const startIndex = (comPage - 1) * comPerPage;
  const endIndex = Math.min(startIndex + comPerPage, totalItems);
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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

      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #c2410c 0%, #ea580c 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Company Management</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Manage and track all companies under your organization.</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => router.push("/admin/companies/add")} 
            style={{
              background: "#1d4ed8",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "10px 18px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <i className="fas fa-plus"></i>
            <span>Register New Company</span>
          </button>
        )}
      </div>

      <div className="table-card" style={{ padding: "25px", background: "#ffffff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        {/* Toolbar Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            <button disabled={!!exportingFmt} onClick={handleCopy} style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: exportingFmt ? "not-allowed" : "pointer" }}>
              Copy
            </button>
            <button disabled={!!exportingFmt} onClick={handleExportCSV} style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: exportingFmt ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              {exportingFmt === "CSV" && <i className="fas fa-spinner fa-spin"></i>}
              <span>CSV</span>
            </button>
            <button disabled={!!exportingFmt} onClick={handleExportExcel} style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor exportingFmt ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              {exportingFmt === "Excel" && <i className="fas fa-spinner fa-spin"></i>}
              <span>Excel</span>
            </button>
            <button disabled={!!exportingFmt} onClick={() => handlePrint("Corporate Registry - PDF Statement", "PDF")} style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: exportingFmt ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              {exportingFmt === "PDF" && <i className="fas fa-spinner fa-spin"></i>}
              <span>PDF</span>
            </button>
            <button disabled={!!exportingFmt} onClick={() => handlePrint("Corporate Registry Statement", "Print")} style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: exportingFmt ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              {exportingFmt === "Print" && <i className="fas fa-spinner fa-spin"></i>}
              <span>Print</span>
            </button>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>Search:</span>
            <input
              type="text"
              placeholder="Quick search..."
              value={comSearch}
              onChange={(e) => setComSearch(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                fontSize: "14px",
                width: "220px",
                outline: "none"
              }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
            <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #ea580c", borderRadius: "50%", width: "35px", height: "35px", animation: "spin 1s linear infinite" }}></div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="db-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>ID</th>
                  <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Company Name</th>
                  <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Contact Email</th>
                  <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Registered By</th>
                  <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Last Update</th>
                  <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "#64748b", padding: "30px 10px" }}>No matching companies found.</td>
                  </tr>
                ) : (
                  paginatedCompanies.map((c) => {
                    const rawId = c.id.replace("#COM-", "").replace("#CMP-", "");
                    const displayId = `#CMP-${rawId}`;
                    return (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 700, color: "#1e293b" }}>{displayId}</td>
                        <td>
                          <button
                            onClick={() => router.push(`/admin/companies/view?id=${rawId}`)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#2563eb",
                              fontWeight: "600",
                              textDecoration: "underline",
                              cursor: "pointer",
                              padding: 0,
                              textAlign: "left"
                            }}
                          >
                            {c.name}
                          </button>
                        </td>
                        <td style={{ color: "#64748b", fontWeight: "500" }}>{c.email && c.email !== "N/A" ? c.email : ""}</td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: "600", color: "#475569", fontSize: "13px" }}>umrahcab</span>
                            <span style={{ color: "#94a3b8", fontSize: "11px" }}>23-May-2026</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ color: "#94a3b8", fontSize: "13px", fontStyle: "italic" }}>No edits</span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button 
                              onClick={() => router.push(`/admin/companies/view?id=${rawId}`)} 
                              title="View Company Details" 
                              style={{ 
                                background: "#f0fdf4", 
                                border: "none", 
                                borderRadius: "6px", 
                                width: "30px", 
                                height: "30px", 
                                cursor: "pointer", 
                                color: "#16a34a", 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center" 
                              }}
                            >
                              <i className="fas fa-eye" style={{ fontSize: "12px" }}></i>
                            </button>
                            {canEdit && (
                              <button 
                                onClick={() => router.push(`/admin/companies/edit?id=${rawId}`)} 
                                title="Edit" 
                                style={{ 
                                  background: "#eff6ff", 
                                  border: "none", 
                                  borderRadius: "6px", 
                                  width: "30px", 
                                  height: "30px", 
                                  cursor: "pointer", 
                                  color: "#2563eb", 
                                  display: "flex", 
                                  alignItems: "center", 
                                  justifyContent: "center" 
                                }}
                              >
                                <i className="fas fa-pencil" style={{ fontSize: "12px" }}></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && totalItems > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", borderTop: "1px solid #f1f5f9", paddingTop: "15px" }}>
            <span style={{ fontSize: "14px", color: "#64748b" }}>
              Showing {startIndex + 1} to {endIndex} of {totalItems} entries
            </span>
            
            <div style={{ display: "flex", gap: "5px" }}>
              <button
                disabled={comPage === 1}
                onClick={() => setComPage(p => Math.max(1, p - 1))}
                style={{
                  background: comPage === 1 ? "#f1f5f9" : "#ffffff",
                  color: comPage === 1 ? "#cbd5e1" : "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  cursor: comPage === 1 ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: "600"
                }}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setComPage(pg)}
                  style={{
                    background: comPage === pg ? "#2563eb" : "#ffffff",
                    color: comPage === pg ? "#ffffff" : "#475569",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600"
                  }}
                >
                  {pg}
                </button>
              ))}
              <button
                disabled={comPage === totalPages}
                onClick={() => setComPage(p => Math.min(totalPages, p + 1))}
                style={{
                  background: comPage === totalPages ? "#f1f5f9" : "#ffffff",
                  color: comPage === totalPages ? "#cbd5e1" : "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  cursor: comPage === totalPages ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: "600"
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
}
