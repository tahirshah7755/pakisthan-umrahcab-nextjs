"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";
import { exportToExcel, exportToCSV, exportToPDF } from "@/utils/exportHelper";

export interface CustomerItem {
  id: string;
  rawId?: number;
  name: string;
  company: string;
  contact: string;
  registeredBy: string;
  lastUpdate: string;
}

export interface CompanyItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  invoice: boolean;
  vouchers: boolean;
  reminders: boolean;
}

const formatContact = (contactStr: string) => {
  if (!contactStr) return "N/A";
  
  let phone = "N/A";
  let email = "";
  
  const mainPart = contactStr.split(" | ")[0] || "";
  if (mainPart && !mainPart.includes("Email:") && !mainPart.includes("Passport:")) {
    phone = mainPart.split(" / ")[0] || "N/A";
  } else {
    const phonePart = contactStr.split(" | Notes: ")[0]?.split(" (P), ")[0];
    if (phonePart) {
      phone = phonePart.split(" / ")[0] || "N/A";
    }
  }

  if (contactStr.includes("Email: ")) {
    const emailPart = contactStr.split("Email: ")[1]?.split(" | ")[0];
    if (emailPart) email = emailPart.trim();
  } else if (contactStr.includes(" (Email)")) {
    const emailPart = contactStr.split(" | Notes: ")[0]?.split(" (P), ")[1]?.replace(" (Email)", "");
    if (emailPart) email = emailPart.trim();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "13px" }}>
        <i className="fas fa-phone" style={{ fontSize: "11px", marginRight: "6px", color: "#0f766e" }}></i>
        {phone}
      </span>
      {email && (
        <span style={{ fontSize: "11px", color: "#64748b" }}>
          <i className="fas fa-envelope" style={{ fontSize: "10px", marginRight: "6px", color: "#ef4444" }}></i>
          {email}
        </span>
      )}
    </div>
  );
};

const formatContactForPrint = (contactStr: string) => {
  if (!contactStr) return "N/A";
  const parts = contactStr.split(" | ");
  return parts.map(part => {
    if (part.startsWith("Email: ")) {
      return `<div style="margin-bottom: 2px; font-size: 11px;"><strong style="color: #475569;">Email:</strong> ${part.substring(7)}</div>`;
    } else if (part.startsWith("Passport: ")) {
      return `<div style="margin-bottom: 2px; font-size: 11px;"><strong style="color: #475569;">Passport:</strong> ${part.substring(10)}</div>`;
    } else if (part.startsWith("Hotel: ")) {
      return `<div style="margin-bottom: 2px; font-size: 11px;"><strong style="color: #475569;">Hotel:</strong> ${part.substring(7)}</div>`;
    } else if (part.startsWith("Notes: ")) {
      return `<div style="margin-bottom: 2px; font-size: 11px;"><strong style="color: #475569;">Notes:</strong> ${part.substring(7)}</div>`;
    } else if (part.includes("Flight (") || part.includes("Train (")) {
      return `<div style="margin-bottom: 2px; font-size: 11px; color: #4b5563;">${part}</div>`;
    } else {
      return `<div style="margin-bottom: 2px; font-weight: bold; color: #0f766e; font-size: 12px;"><i class="fas fa-phone" style="font-size: 10px; margin-right: 4px;"></i>${part}</div>`;
    }
  }).join("");
};

const formatRoutesForPrint = (c: any) => {
  const items: string[] = [];
  if (Array.isArray(c.bookings)) {
    c.bookings.forEach((b: any) => {
      if (b.pickup || b.destination) {
        items.push(`<div style="margin-bottom: 4px; font-size: 11px;"><strong style="color: #475569;">Cab:</strong> ${b.pickup || "N/A"} ➔ ${b.destination || "N/A"}</div>`);
      }
    });
  }
  if (Array.isArray(c.flights)) {
    c.flights.forEach((f: any) => {
      if (f.route) {
        items.push(`<div style="margin-bottom: 4px; font-size: 11px;"><strong style="color: #0284c7;">Flight:</strong> ${f.route}</div>`);
      }
    });
  }
  if (Array.isArray(c.trains)) {
    c.trains.forEach((t: any) => {
      if (t.route) {
        items.push(`<div style="margin-bottom: 4px; font-size: 11px;"><strong style="color: #7c3aed;">Train:</strong> ${t.route}</div>`);
      }
    });
  }
  return items.length > 0 ? items.join("") : '<span style="color: #94a3b8; font-style: italic;">No routes</span>';
};

const formatRoutesForScreen = (c: any) => {
  const items: React.ReactNode[] = [];
  if (Array.isArray(c.bookings)) {
    c.bookings.forEach((b: any, idx: number) => {
      if (b.pickup || b.destination) {
        items.push(
          <div key={`b-${idx}`} style={{ fontSize: "11px", marginBottom: "2px", lineHeight: "1.3" }}>
            <strong style={{ color: "#475569" }}>Cab:</strong> {b.pickup || "N/A"} ➔ {b.destination || "N/A"}
          </div>
        );
      }
    });
  }
  if (Array.isArray(c.flights)) {
    c.flights.forEach((f: any, idx: number) => {
      if (f.route) {
        items.push(
          <div key={`f-${idx}`} style={{ fontSize: "11px", marginBottom: "2px", lineHeight: "1.3" }}>
            <strong style={{ color: "#0284c7" }}>Flight:</strong> {f.route}
          </div>
        );
      }
    });
  }
  if (Array.isArray(c.trains)) {
    c.trains.forEach((t: any, idx: number) => {
      if (t.route) {
        items.push(
          <div key={`t-${idx}`} style={{ fontSize: "11px", marginBottom: "2px", lineHeight: "1.3" }}>
            <strong style={{ color: "#7c3aed" }}>Train:</strong> {t.route}
          </div>
        );
      }
    });
  }
  return items.length > 0 ? (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>{items}</div>
  ) : (
    <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "11px" }}>No routes</span>
  );
};

interface CustomerDirectoryProps {
  customers: CustomerItem[];
  companies: CompanyItem[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  companyFilter: string;
  setCompanyFilter: (val: string) => void;
  custPage: number;
  setCustPage: React.Dispatch<React.SetStateAction<number>>;
  custPerPage: number;
  setCustPerPage: React.Dispatch<React.SetStateAction<number>>;
  totalCustCount: number;
  custTotalPages: number;
  setEditingCustomer: (c: CustomerItem) => void;
  triggerExportAlert: (fmt: string) => void;
  router: any;
  onRefresh?: () => void;
}

export const CustomerDirectory: React.FC<CustomerDirectoryProps> = ({
  customers,
  companies,
  searchTerm,
  setSearchTerm,
  companyFilter,
  setCompanyFilter,
  custPage,
  setCustPage,
  custPerPage,
  setCustPerPage,
  totalCustCount,
  custTotalPages,
  setEditingCustomer,
  triggerExportAlert,
  router,
  onRefresh,
}) => {
  const { user } = useAuth();
  
  // Determine permissions
  const getPermission = () => {
    if (!user) return "none";
    if (user.role === "SUPER_ADMIN") return "full";
    const userPerms = (user as any).permissions || {};
    return userPerms["customers"] || "none";
  };

  const permission = getPermission();
  const canEdit = permission === "edit" || permission === "full";
  const canDelete = permission === "full";

  const [toast, setToast] = React.useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const [customerToDelete, setCustomerToDelete] = React.useState<{ id: number | string; name: string } | null>(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = React.useState(false);

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setIsDeletingCustomer(true);
    try {
      await api.deleteCustomer(customerToDelete.id);
      showToast(`Customer "${customerToDelete.name}" deleted successfully!`, "success");
      setCustomerToDelete(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to delete customer:", err);
      showToast("Failed to delete customer.", "error");
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  const [exportingFmt, setExportingFmt] = React.useState<string | null>(null);

  const handleCopy = () => {
    if (customers.length === 0) {
      showToast("No data to copy!", "error");
      return;
    }
    const headers = ["Customer ID", "Customer Name", "Associated Company", "Contact", "Registered By", "Last Update"];
    const textRows = customers.map((c: any) => [
      c.id,
      c.name || "",
      c.company || "",
      c.contact || "",
      c.registeredBy || "",
      c.lastUpdate || ""
    ]);
    const text = [headers.join("\t"), ...textRows.map(r => r.join("\t"))].join("\n");
    navigator.clipboard.writeText(text)
      .then(() => showToast("Copied customers list to clipboard!", "success"))
      .catch(() => showToast("Failed to copy!", "error"));
  };

  const fetchAllMatchingCustomers = async () => {
    try {
      showToast("Fetching all matching customer records...", "success");
      const res = await api.getCustomers(searchTerm, companyFilter, 1, 10000);
      let rawList: any[] = [];
      if (res && res.data && Array.isArray(res.data)) {
        rawList = res.data;
      } else if (Array.isArray(res)) {
        rawList = res;
      } else {
        rawList = customers;
      }
      return rawList.map((c: any) => ({
        id: c.custom_id || `#CST-${c.id}`,
        name: c.name || "",
        company: c.company || "",
        contact: c.contact || "",
        registeredBy: c.registered_by ? (c.registered_by.includes("umrahcab") ? c.registered_by.replace(/umrahcab/gi, user?.name || user?.username || "hebacab") : c.registered_by) : (user?.name || user?.username || "hebacab"),
        lastUpdate: c.last_update || "No edits"
      }));
    } catch (err) {
      console.error("Error fetching all customers for export:", err);
      return customers;
    }
  };

  const handleExportCSV = async () => {
    setExportingFmt("CSV");
    try {
      const exportList = await fetchAllMatchingCustomers();
      if (exportList.length === 0) {
        showToast("No data to export!", "error");
        return;
      }
      const headers = ["Customer ID", "Customer Name", "Associated Company", "Contact Number", "Registered Agent", "Last Update"];
      const rows = exportList.map((c: any) => [
        c.id,
        c.name,
        c.company,
        c.contact,
        c.registeredBy,
        c.lastUpdate
      ]);
      exportToCSV({
        title: "Customer Directory Statement",
        filename: "customer_directory",
        headers,
        rows
      });
      showToast(`Exported all ${exportList.length} customer records to CSV!`, "success");
    } finally {
      setExportingFmt(null);
    }
  };

  const handleExportExcel = async () => {
    setExportingFmt("Excel");
    try {
      const exportList = await fetchAllMatchingCustomers();
      if (exportList.length === 0) {
        showToast("No data to export!", "error");
        return;
      }
      const headers = ["Customer ID", "Customer Name", "Associated Company", "Contact Number", "Registered Agent", "Last Update"];
      const rows = exportList.map((c: any) => [
        c.id,
        c.name,
        c.company,
        c.contact,
        c.registeredBy,
        c.lastUpdate
      ]);
      exportToExcel({
        title: "Customer Directory Statement",
        filename: "customer_directory",
        headers,
        rows,
        companyName: "HEBA CAB",
        summary: [
          { label: "Total Matching Customers", value: exportList.length }
        ]
      });
      showToast(`Exported all ${exportList.length} customer records to Excel!`, "success");
    } finally {
      setExportingFmt(null);
    }
  };

  const handlePrint = async (title: string = "Customer Directory Statement", fmtType: string = "Print") => {
    setExportingFmt(fmtType);
    try {
      const exportList = await fetchAllMatchingCustomers();
      if (exportList.length === 0) {
        showToast("No data to print!", "error");
        return;
      }
      const headers = ["Customer ID", "Customer Name", "Associated Company", "Contact Number", "Registered Agent", "Last Update"];
      const rows = exportList.map((c: any) => [
        c.id,
        c.name,
        c.company,
        c.contact,
        c.registeredBy,
        c.lastUpdate
      ]);
      exportToPDF({
        title,
        filename: "customer_directory",
        headers,
        rows,
        companyName: "HEBA CAB",
        orientation: "landscape",
        mode: fmtType as any,
        summary: [
          { label: "Total Matching Customers", value: exportList.length }
        ]
      });
    } finally {
      setExportingFmt(null);
    }
  };

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
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)" }}>
        <div>
          <h2>Customer Directory</h2>
          <p>Manage, filter, and track customer contact profiles across all corporate accounts.</p>
        </div>
        {canEdit && (
          <button onClick={() => router.push("/admin/customers/add")} className="form-btn-back">
            <i className="fas fa-plus"></i>
            <span>Add New Customer</span>
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div className="matrix-tool-card" style={{ padding: "20px" }}>
        <div className="tool-title-group">
          <i className="fas fa-filter"></i>
          <span>Filter by Company</span>
        </div>
        <select
          className="tool-date-input"
          value={companyFilter}
          onChange={(e) => {
            setCompanyFilter(e.target.value);
            setCustPage(1); // reset to page 1 on filter change
          }}
          style={{ width: "200px" }}
        >
          <option value="All">All Companies</option>
          {companies.map((com) => (
            <option key={com.id} value={com.name}>
              {com.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table Container */}
      <div className="table-card" style={{ padding: "25px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <button disabled={!!exportingFmt} onClick={handleCopy} className="hub-btn hub-btn-list" style={{ padding: "6px 12px", fontSize: "12px" }}>
              Copy
            </button>
            <button disabled={!!exportingFmt} onClick={handleExportCSV} className="hub-btn hub-btn-list" style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              {exportingFmt === "CSV" && <i className="fas fa-spinner fa-spin"></i>}
              <span>CSV</span>
            </button>
            <button disabled={!!exportingFmt} onClick={handleExportExcel} className="hub-btn hub-btn-list" style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              {exportingFmt === "Excel" && <i className="fas fa-spinner fa-spin"></i>}
              <span>Excel</span>
            </button>
            <button disabled={!!exportingFmt} onClick={() => handlePrint("Customer Directory - PDF Statement", "PDF")} className="hub-btn hub-btn-list" style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              {exportingFmt === "PDF" && <i className="fas fa-spinner fa-spin"></i>}
              <span>PDF</span>
            </button>
            <button disabled={!!exportingFmt} onClick={() => handlePrint("Customer Directory Statement", "Print")} className="hub-btn hub-btn-list" style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              {exportingFmt === "Print" && <i className="fas fa-spinner fa-spin"></i>}
              <span>Print</span>
            </button>
          </div>
          <input
            type="text"
            placeholder="Search customers..."
            className="matrix-search-input"
            style={{ width: "220px", height: "35px" }}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCustPage(1); // reset to page 1 on search
            }}
          />
        </div>

        <div className="table-responsive">
          <table className="db-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Customer Name</th>
                <th>Associated Company</th>
                <th>Contact</th>
                <th>Route Details</th>
                <th>Registered By</th>
                <th>Last Update</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)", fontWeight: "500" }}>
                    No customer profiles found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700, color: "var(--primary-color)" }}>{c.id}</td>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>
                      <span className="status-pill active" style={{ background: "#f1f5f9", color: "#334155" }}>
                        {c.company}
                      </span>
                    </td>
                    <td>{formatContact(c.contact)}</td>
                    <td>{formatRoutesForScreen(c)}</td>
                    <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{c.registeredBy}</td>
                    <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{c.lastUpdate}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => router.push(`/admin/customers/view?id=${c.rawId || c.id}`)}
                          title="View Profile"
                          style={{
                            background: "#e0f2fe",
                            border: "none",
                            borderRadius: "6px",
                            width: "30px",
                            height: "30px",
                            cursor: "pointer",
                            color: "#0369a1",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          <i className="fas fa-eye" style={{ fontSize: "12px" }}></i>
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => router.push(`/admin/customers/edit?id=${c.rawId || c.id}`)}
                            title="Edit"
                            style={{
                              background: "#f1f5f9",
                              border: "none",
                              borderRadius: "6px",
                              width: "30px",
                              height: "30px",
                              cursor: "pointer",
                              color: "var(--primary-color)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <i className="fas fa-pencil" style={{ fontSize: "12px" }}></i>
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setCustomerToDelete({ id: c.rawId || c.id, name: c.name })}
                            title="Delete Profile"
                            style={{
                              background: "#fee2e2",
                              border: "none",
                              borderRadius: "6px",
                              width: "30px",
                              height: "30px",
                              cursor: "pointer",
                              color: "#dc2626",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <i className="fas fa-trash-can" style={{ fontSize: "12px" }}></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Elegant Pagination Controls */}
        <div 
          style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginTop: "20px", 
            borderTop: "1px solid #f1f5f9", 
            paddingTop: "15px",
            flexWrap: "wrap",
            gap: "15px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", color: "#64748b" }}>Show</span>
            <select 
              className="tool-date-input" 
              value={custPerPage} 
              onChange={(e) => {
                setCustPerPage(Number(e.target.value));
                setCustPage(1);
              }}
              style={{ width: "70px", padding: "4px 8px", height: "auto" }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span style={{ fontSize: "13px", color: "#64748b" }}>entries</span>
          </div>

          <span style={{ fontSize: "13px", color: "#64748b" }}>
            Showing {totalCustCount === 0 ? 0 : ((custPage - 1) * custPerPage) + 1} to {Math.min(custPage * custPerPage, totalCustCount)} of {totalCustCount} entries
          </span>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button 
              className="form-btn-back" 
              onClick={() => setCustPage(p => Math.max(1, p - 1))}
              disabled={custPage === 1}
              style={{ 
                background: custPage === 1 ? "#f1f5f9" : "var(--primary-color)", 
                color: custPage === 1 ? "#94a3b8" : "#ffffff", 
                border: "none",
                cursor: custPage === 1 ? "not-allowed" : "pointer",
                padding: "6px 12px",
                fontWeight: "600",
                borderRadius: "6px",
                margin: 0
              }}
            >
              Previous
            </button>
            <span style={{ display: "flex", alignItems: "center", padding: "0 10px", fontSize: "13px", fontWeight: "700", color: "#334155" }}>
              Page {custPage} of {custTotalPages}
            </span>
            <button 
              className="form-btn-back" 
              onClick={() => setCustPage(p => Math.min(custTotalPages, p + 1))}
              disabled={custPage === custTotalPages || custTotalPages === 0}
              style={{ 
                background: (custPage === custTotalPages || custTotalPages === 0) ? "#f1f5f9" : "var(--primary-color)", 
                color: (custPage === custTotalPages || custTotalPages === 0) ? "#94a3b8" : "#ffffff", 
                border: "none",
                cursor: (custPage === custTotalPages || custTotalPages === 0) ? "not-allowed" : "pointer",
                padding: "6px 12px",
                fontWeight: "600",
                borderRadius: "6px",
                margin: 0
              }}
            >
              Next
            </button>
          </div>
        </div>

      </div>

      {/* Delete Customer Confirmation Modal */}
      {customerToDelete && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          padding: "20px"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "90%",
            maxWidth: "420px",
            padding: "28px 24px",
            textAlign: "center",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            borderTop: "6px solid #ef4444"
          }}>
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "#fee2e2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
              margin: "0 auto 16px auto"
            }}>
              <i className="fas fa-triangle-exclamation"></i>
            </div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "19px", fontWeight: "700", color: "#0f172a" }}>
              Delete Customer Profile?
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>
              Are you sure you want to delete customer <strong style={{ color: "#1e293b" }}>"{customerToDelete.name}"</strong>? This action cannot be undone.
            </p>
            <div style={{
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              borderRadius: "10px",
              padding: "14px 16px",
              margin: "0 0 24px 0",
              textAlign: "left",
              display: "flex",
              gap: "12px"
            }}>
              <i className="fas fa-circle-exclamation" style={{ color: "#e11d48", fontSize: "18px", marginTop: "2px" }}></i>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontWeight: "700", color: "#9f1239", fontSize: "13px" }}>
                  All Associated Data Will Be Removed
                </span>
                <span style={{ color: "#e11d48", fontSize: "12px", lineHeight: "1.4" }}>
                  This will permanently delete all bookings, flights, hotels, trains, services, and invoices linked to this customer.
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                disabled={isDeletingCustomer}
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCustomer}
                disabled={isDeletingCustomer}
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  color: "#ffffff",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: isDeletingCustomer ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 6px -1px rgba(239, 68, 68, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                {isDeletingCustomer ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash-can"></i>
                    <span>Delete Customer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
