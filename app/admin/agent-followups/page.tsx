"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useGetFollowupsQuery, useDeleteFollowupMutation } from "@/store/api/followupsApi";
import { useGetCompaniesQuery } from "@/store/api/companiesApi";

interface RatingSelectorProps {
  rating: number;
}

const RatingStars: React.FC<RatingSelectorProps> = ({ rating }) => {
  return (
    <div style={{ display: "flex", gap: "6px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={star <= rating ? "fas fa-star" : "far fa-star"}
          style={{
            color: star <= rating ? "#ffc107" : "#cbd5e1",
            fontSize: "14px",
          }}
        />
      ))}
    </div>
  );
};

const STATUS_MAP: Record<string, { bg: string; fg: string }> = {
  "Pending":           { bg: "rgba(249,115,22,0.1)",  fg: "#f97316" },
  "Awaiting FeedBack": { bg: "rgba(234,179,8,0.1)",   fg: "#eab308" },
  "Not Followed":      { bg: "rgba(244,63,94,0.1)",   fg: "#f43f5e" },
  "Followed Up":       { bg: "rgba(111,66,193,0.1)",  fg: "#6f42c1" },
  "Done":              { bg: "rgba(16,185,129,0.1)",  fg: "#10b981" },
};

export default function AgentFollowupsPage() {
  const router = useRouter();

  // Filter + pagination state — all sent to backend
  const [search,      setSearch]      = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterStatus,  setFilterStatus]  = useState("");
  const [startDate,   setStartDate]   = useState("");
  const [endDate,     setEndDate]     = useState("");
  const [datePreset,  setDatePreset]  = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Toast
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false, message: "", type: "success",
  });
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  const resetPage = () => setCurrentPage(1);

  // RTK Query — server-side pagination + filters
  const { data: response, isLoading, isFetching } = useGetFollowupsQuery({
    page:       currentPage,
    per_page:   rowsPerPage,
    search:     search     || undefined,
    company:    filterCompany || undefined,
    status:     filterStatus  || undefined,
    start_date: startDate  || undefined,
    end_date:   endDate    || undefined,
  });

  const { data: companiesData } = useGetCompaniesQuery(undefined);
  const [deleteFollowup] = useDeleteFollowupMutation();

  // The global API middleware wraps the response: { data: { ...paginator }, Message, isError }
  // So the Laravel paginator lives at response.data, and items at response.data.data
  const paginator   = response?.data;
  const followups   = Array.isArray(paginator?.data) ? paginator.data : [];
  const totalRows   = paginator?.total       ?? 0;
  const totalPages  = paginator?.last_page   ?? 1;
  const fromRow     = paginator?.from        ?? 0;
  const toRow       = paginator?.to          ?? 0;

  const companies = Array.isArray(companiesData)
    ? companiesData
    : (Array.isArray((companiesData as any)?.data) ? (companiesData as any).data : []);

  const handleDelete = async (id: number | string) => {
    if (confirm("Are you sure you want to delete this follow-up entry?")) {
      try {
        await deleteFollowup(id).unwrap();
        showToast("Follow-up deleted successfully!", "success");
      } catch {
        showToast("Failed to delete follow-up.", "error");
      }
    }
  };

  const getNotesMeta = (notesStr: string) => {
    try {
      if (notesStr && (notesStr.startsWith("{") || notesStr.startsWith("["))) {
        const parsed = JSON.parse(notesStr);
        return { rating: Number(parsed.rating || 5), company: parsed.company || "" };
      }
    } catch {}
    return { rating: 5, company: "" };
  };

  const handlePresetClick = (preset: string) => {
    setDatePreset(preset);
    const today = new Date().toISOString().split("T")[0];
    if (preset === "today") {
      setStartDate(today); setEndDate(today);
    } else if (preset === "yesterday") {
      const d = new Date(); d.setDate(d.getDate() - 1);
      const s = d.toISOString().split("T")[0];
      setStartDate(s); setEndDate(s);
    } else if (preset === "tomorrow") {
      const d = new Date(); d.setDate(d.getDate() + 1);
      const s = d.toISOString().split("T")[0];
      setStartDate(s); setEndDate(s);
    } else {
      setStartDate(""); setEndDate("");
    }
    resetPage();
  };

  // Visible page numbers (±2 around current)
  const getPageNumbers = () => {
    const range: number[] = [];
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
      range.push(i);
    }
    return range;
  };

  const btnBase = (active: boolean, disabled: boolean) => ({
    border: `1px solid ${active ? "#1e5cff" : "#e2e8f0"}`,
    borderRadius: "6px", padding: "6px 12px",
    fontSize: "13px", fontWeight: "700" as const,
    background: active ? "#1e5cff" : disabled ? "#f1f5f9" : "#ffffff",
    color: active ? "#ffffff" : disabled ? "#cbd5e1" : "#475569",
    cursor: disabled ? "not-allowed" as const : "pointer" as const,
    minWidth: "36px", transition: "all 0.15s ease",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Toast */}
      {toast.show && (
        <div style={{
          position: "fixed", top: "25px", right: "25px", zIndex: 99999,
          background: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "#ffffff", padding: "14px 28px", borderRadius: "10px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)", fontWeight: "600",
          fontSize: "14px", display: "flex", alignItems: "center", gap: "10px",
        }}>
          <i className={toast.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #1e5cff 0%, #0040e6 100%)", padding: "24px 30px", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Follow-up Directory</h2>
          <p style={{ color: "rgba(255,255,255,0.8)", margin: "6px 0 0 0", fontSize: "14px" }}>
            Advanced search and tracking for agent interactions.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => router.push("/admin/agent-followups/add")}
            style={{ background: "#ffffff", color: "#0040e6", border: "none", borderRadius: "8px", padding: "10px 20px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <i className="fas fa-plus"></i>
            <span>Add Follow-up</span>
          </button>
          <button onClick={() => router.push("/admin/hub")} className="form-btn-back">
            <i className="fas fa-arrow-left"></i>
            <span>Return to Hub</span>
          </button>
        </div>
      </div>

      {/* Quick Preset Date Filters */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", margin: "5px 0" }}>
        {["all", "today", "yesterday", "tomorrow"].map((preset) => (
          <button
            key={preset}
            onClick={() => handlePresetClick(preset)}
            style={{
              background: datePreset === preset ? "#1e5cff" : "#ffffff",
              color: datePreset === preset ? "#ffffff" : "#475569",
              border: `1px solid ${datePreset === preset ? "#1e5cff" : "#e2e8f0"}`,
              borderRadius: "9999px", padding: "8px 18px", fontSize: "13px", fontWeight: "600", cursor: "pointer",
            }}
          >
            {preset === "all" ? "Show All" : preset === "today" ? "Today" : preset === "yesterday" ? "Yesterday" : "Tomorrow (Scheduled)"}
          </button>
        ))}
      </div>

      {/* Filters Panel */}
      <div className="form-card" style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "15px", alignItems: "end" }}>
        <div>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "6px", display: "block" }}>Filter by Company</label>
          <select className="form-input" style={{ width: "100%" }} value={filterCompany} onChange={(e) => { setFilterCompany(e.target.value); resetPage(); }}>
            <option value="">All Companies</option>
            {companies.map((c: any) => (<option key={c.id} value={c.name}>{c.name}</option>))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "6px", display: "block" }}>Follow-up Status</label>
          <select className="form-input" style={{ width: "100%" }} value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); resetPage(); }}>
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Awaiting FeedBack">Awaiting FeedBack</option>
            <option value="Not Followed">Not Followed</option>
            <option value="Followed Up">Followed Up</option>
            <option value="Done">Done</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "6px", display: "block" }}>Start Date</label>
          <input type="date" className="form-input" style={{ width: "100%" }} value={startDate} onChange={(e) => { setStartDate(e.target.value); setDatePreset("custom"); resetPage(); }} />
        </div>
        <div>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "6px", display: "block" }}>End Date</label>
          <input type="date" className="form-input" style={{ width: "100%" }} value={endDate} onChange={(e) => { setEndDate(e.target.value); setDatePreset("custom"); resetPage(); }} />
        </div>
        <div>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "6px", display: "block" }}>Search keywords</label>
          <input type="text" className="form-input" style={{ width: "100%" }} placeholder="Search subjects/phones..." value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} />
        </div>
      </div>

      {/* Table Card */}
      <div className="table-card" style={{ padding: "0px", overflow: "hidden" }}>
        {isLoading || isFetching ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
            <div className="spinner" style={{ borderTopColor: "#1e5cff" }}></div>
            <span style={{ marginLeft: "12px", color: "#64748b", fontWeight: "600" }}>
              {isFetching && !isLoading ? "Updating..." : "Loading interactions..."}
            </span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="db-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: "24px" }}># ID</th>
                  <th>Date</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Rating</th>
                  <th>Phone / Contact</th>
                  <th>Subject</th>
                  <th style={{ paddingRight: "24px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {followups.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                      No follow-up interactions match the filters.
                    </td>
                  </tr>
                ) : (
                  followups.map((item: any) => {
                    const meta = getNotesMeta(item.notes);
                    const displayCompany = meta.company || item.agent;
                    const s = item.status || "Pending";
                    const { bg, fg } = STATUS_MAP[s] || { bg: "rgba(100,116,139,0.1)", fg: "#64748b" };
                    return (
                      <tr key={item.id}>
                        <td style={{ paddingLeft: "24px", fontWeight: 700, color: "#1e293b" }}>{item.custom_id || `#FLP-${item.id}`}</td>
                        <td style={{ fontWeight: "600", color: "#475569" }}>{item.date}</td>
                        <td style={{ fontWeight: "700", color: "#1e5cff" }}>{displayCompany}</td>
                        <td>
                          <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "9999px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", background: bg, color: fg }}>
                            {s}
                          </span>
                        </td>
                        <td><RatingStars rating={meta.rating} /></td>
                        <td style={{ fontFamily: "monospace", fontSize: "13px" }}>{item.contact}</td>
                        <td style={{ fontWeight: "600", color: "#334155", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.title}
                        </td>
                        <td style={{ paddingRight: "24px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button onClick={() => router.push(`/admin/agent-followups/view?id=${item.id}`)} title="View" style={{ border: "none", width: "32px", height: "32px", borderRadius: "50%", background: "rgba(25,135,84,0.1)", color: "#198754", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <i className="fas fa-eye" style={{ fontSize: "12px" }}></i>
                            </button>
                            <button onClick={() => router.push(`/admin/agent-followups/edit?id=${item.id}`)} title="Edit" style={{ border: "none", width: "32px", height: "32px", borderRadius: "50%", background: "rgba(13,110,253,0.1)", color: "#0d6efd", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <i className="fas fa-pen" style={{ fontSize: "12px" }}></i>
                            </button>
                            <button onClick={() => handleDelete(item.id)} title="Delete" style={{ border: "none", width: "32px", height: "32px", borderRadius: "50%", background: "rgba(220,53,69,0.1)", color: "#dc3545", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <i className="fas fa-trash" style={{ fontSize: "12px" }}></i>
                            </button>
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

        {/* Pagination Footer */}
        {!isLoading && totalRows > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", borderTop: "1px solid #f1f5f9", flexWrap: "wrap", gap: "12px" }}>
            {/* Left: summary + rows-per-page */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>
                Showing {fromRow}–{toRow} of {totalRows} records
              </span>
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); resetPage(); }}
                style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "5px 10px", fontSize: "13px", fontWeight: "600", color: "#475569", background: "#f8fafc", cursor: "pointer" }}
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>

            {/* Right: page buttons */}
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <button onClick={() => setCurrentPage(1)}                                   disabled={currentPage === 1}          style={btnBase(false, currentPage === 1)}>«</button>
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}           disabled={currentPage === 1}          style={btnBase(false, currentPage === 1)}>‹</button>

              {getPageNumbers().map((pg) => (
                <button key={pg} onClick={() => setCurrentPage(pg)} style={btnBase(pg === currentPage, false)}>{pg}</button>
              ))}

              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}  disabled={currentPage === totalPages} style={btnBase(false, currentPage === totalPages)}>›</button>
              <button onClick={() => setCurrentPage(totalPages)}                           disabled={currentPage === totalPages} style={btnBase(false, currentPage === totalPages)}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
