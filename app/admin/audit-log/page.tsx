"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useGetAuditsQuery } from "@/store/api/auditsApi";

interface AuditItem {
  id: number | string;
  custom_id?: string;
  user_session?: string;
  ip_location?: string;
  performed_action: string;
  created_at: string;
}

export default function AuditTrailPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  // RTK Query hook with page params
  const { data: auditsResponse, isLoading } = useGetAuditsQuery({ page: currentPage, perPage });

  // Robust parsing of nested data structure
  const paginator = auditsResponse && typeof auditsResponse === "object" && "data" in auditsResponse && auditsResponse.data && !Array.isArray(auditsResponse.data)
    ? auditsResponse.data
    : auditsResponse;

  const auditsList: AuditItem[] = paginator && typeof paginator === "object" && Array.isArray(paginator.data)
    ? paginator.data
    : Array.isArray(paginator)
      ? paginator
      : [];

  const totalPages = paginator && typeof paginator === "object" && paginator.last_page
    ? paginator.last_page
    : 1;

  const totalItems = paginator && typeof paginator === "object" && paginator.total
    ? paginator.total
    : auditsList.length;

  const formatTimestamp = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      return dateStr.substring(0, 19).replace("T", " ");
    } catch (e) {
      return dateStr;
    }
  };

  // Professional sliding window pagination logic
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }
      
      if (start > 2) {
        pages.push("ellipsis-start");
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push("ellipsis-end");
      }
      
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
      {/* Header Card */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #374151 0%, #1f2937 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>System Security Audit Trail</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Track administrator dashboard log-ins, pricing updates, and booking registrations.</p>
        </div>
        <button 
          onClick={() => router.push("/admin/hub")} 
          style={{ background: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", padding: "10px 18px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <i className="fas fa-arrow-left"></i>
          <span>Back to Hub</span>
        </button>
      </div>

      {/* Main Table Panel */}
      <div className="table-card" style={{ background: "#ffffff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
            <div className="spinner" style={{ borderTopColor: "#374151" }}></div>
            <span style={{ marginLeft: "12px", color: "#64748b", fontWeight: "600" }}>Loading Audit Logs...</span>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="db-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Audit ID</th>
                    <th>User Session</th>
                    <th>IP Location</th>
                    <th>Performed Action</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {auditsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                        No audit log records found in the database.
                      </td>
                    </tr>
                  ) : (
                    auditsList.map((a) => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 700 }}>{a.custom_id || `#AUD-${a.id}`}</td>
                        <td style={{ fontWeight: 600 }}>{a.user_session || "umrahcab"}</td>
                        <td>{a.ip_location || "127.0.0.1"}</td>
                        <td style={{ 
                          color: a.performed_action.includes("Unlocked") ? "#10b981" : 
                                 a.performed_action.includes("Registered") ? "#3b82f6" : "#1e293b", 
                          fontWeight: "600" 
                        }}>
                          {a.performed_action}
                        </td>
                        <td>{formatTimestamp(a.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {!isLoading && totalPages > 1 && (
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginTop: "20px", padding: "20px 0 0 0", borderTop: "1px solid #e2e8f0"
              }}>
                <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>
                  Showing <strong style={{ color: "#334155" }}>{((currentPage - 1) * perPage) + 1}</strong> to <strong style={{ color: "#334155" }}>{Math.min(currentPage * perPage, totalItems)}</strong> of <strong style={{ color: "#334155" }}>{totalItems}</strong> entries
                </span>
                
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    style={{
                      height: "38px", padding: "0 14px", background: currentPage === 1 ? "#f8fafc" : "#ffffff",
                      border: "1px solid #cbd5e1", borderRadius: "6px", cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      color: currentPage === 1 ? "#94a3b8" : "#475569", fontWeight: "600", fontSize: "13px",
                      display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s"
                    }}
                    className="pagination-btn"
                  >
                    <i className="fas fa-chevron-left" style={{ fontSize: "10px" }}></i>
                    <span>Prev</span>
                  </button>
                  
                  {/* Page Numbers */}
                  {getPageNumbers().map((p, idx) => {
                    if (p === "ellipsis-start" || p === "ellipsis-end") {
                      return (
                        <span 
                          key={`ellipsis-${idx}`} 
                          style={{ padding: "0 10px", color: "#94a3b8", fontWeight: "600", fontSize: "14px" }}
                        >
                          ...
                        </span>
                      );
                    }
                    
                    const isPageActive = currentPage === p;
                    return (
                      <button
                        key={`page-${p}`}
                        onClick={() => setCurrentPage(Number(p))}
                        style={{
                          height: "38px", width: "38px",
                          background: isPageActive ? "#15803d" : "#ffffff",
                          color: isPageActive ? "#ffffff" : "#475569",
                          border: isPageActive ? "1px solid #15803d" : "1px solid #cbd5e1", 
                          borderRadius: "6px", cursor: "pointer",
                          fontWeight: "600", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.2s"
                        }}
                        className={`pagination-number-btn ${isPageActive ? "active" : ""}`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  
                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    style={{
                      height: "38px", padding: "0 14px", background: currentPage === totalPages ? "#f8fafc" : "#ffffff",
                      border: "1px solid #cbd5e1", borderRadius: "6px", cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                      color: currentPage === totalPages ? "#94a3b8" : "#475569", fontWeight: "600", fontSize: "13px",
                      display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s"
                    }}
                    className="pagination-btn"
                  >
                    <span>Next</span>
                    <i className="fas fa-chevron-right" style={{ fontSize: "10px" }}></i>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Dynamic CSS styles for Pagination Buttons Hover effects */}
      <style>{`
        .pagination-btn:not(:disabled):hover {
          background-color: #f1f5f9 !important;
          border-color: #94a3b8 !important;
          color: #1e293b !important;
        }
        .pagination-number-btn:not(.active):hover {
          background-color: #f1f5f9 !important;
          border-color: #94a3b8 !important;
          color: #1e293b !important;
        }
      `}</style>
    </div>
  );
}
