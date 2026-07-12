"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

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

  const handleExportCSV = () => {
    if (customers.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["Customer ID", "Customer Name", "Associated Company", "Contact", "Registered By", "Last Update"];
    const csvContent = [
      headers.join(","),
      ...customers.map((c: any) => [
        `"${(c.id || "").replace(/"/g, '""')}"`,
        `"${(c.name || "").replace(/"/g, '""')}"`,
        `"${(c.company || "").replace(/"/g, '""')}"`,
        `"${(c.contact || "").replace(/"/g, '""')}"`,
        `"${(c.registeredBy || "").replace(/"/g, '""')}"`,
        `"${(c.lastUpdate || "").replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `customers_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV file downloaded successfully!", "success");
  };

  const handleExportExcel = () => {
    if (customers.length === 0) {
      showToast("No data to export!", "error");
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
    
    const excelContent = [
      headers.join("\t"),
      ...textRows.map(r => r.join("\t"))
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + excelContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `customers_${new Date().toISOString().split("T")[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Excel spreadsheet downloaded successfully!", "success");
  };

  const handlePrint = (title: string = "Customer Directory Statement") => {
    if (customers.length === 0) {
      showToast("No data to print!", "error");
      return;
    }
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocked! Please allow pop-ups to print.", "error");
      return;
    }

    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    
    const rowsHtml = customers.map((c: any) => `
      <tr>
        <td style="font-weight: bold; color: #1e3a8a;">${c.id}</td>
        <td style="font-weight: 600;">${c.name || ""}</td>
        <td>${c.company || ""}</td>
        <td>${formatContactForPrint(c.contact)}</td>
        <td>${formatRoutesForPrint(c)}</td>
        <td>${c.registeredBy || ""}</td>
        <td style="color: #64748b;">${c.lastUpdate || ""}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 30px; color: #1e293b; background-color: #ffffff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 25px; }
            .header h1 { margin: 0; color: #1e3a8a; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
            .header p { margin: 6px 0 0 0; color: #475569; font-size: 13px; font-weight: 500; }
            .meta-info { text-align: right; font-size: 13px; color: #334155; line-height: 1.5; }
            .meta-info strong { color: #1e3a8a; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; table-layout: fixed; }
            th { background-color: #f1f5f9; padding: 10px 8px; border-bottom: 2px solid #cbd5e1; text-align: left; text-transform: uppercase; color: #334155; font-weight: 700; font-size: 10px; letter-spacing: 0.5px; }
            td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; line-height: 1.4; color: #334155; word-break: break-word; white-space: normal; }
            tr:nth-child(even) td { background-color: #f8fafc; }
            @media print {
              body { margin: 15px; }
              .header { border-bottom-width: 2px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>${title}</h1>
              <p>Umrah Cab Customer Registry</p>
            </div>
            <div class="meta-info">
              <p><strong>Generated Date:</strong> ${today}</p>
              <p><strong>Total Customers:</strong> ${customers.length}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 10%;">Customer ID</th>
                <th style="width: 14%;">Customer Name</th>
                <th style="width: 13%;">Associated Company</th>
                <th style="width: 23%;">Contact</th>
                <th style="width: 23%;">Route Details</th>
                <th style="width: 11%;">Registered By</th>
                <th style="width: 6%;">Last Update</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
            <button onClick={handleCopy} className="hub-btn hub-btn-list" style={{ padding: "6px 12px", fontSize: "12px" }}>
              Copy
            </button>
            <button onClick={handleExportCSV} className="hub-btn hub-btn-list" style={{ padding: "6px 12px", fontSize: "12px" }}>
              CSV
            </button>
            <button onClick={handleExportExcel} className="hub-btn hub-btn-list" style={{ padding: "6px 12px", fontSize: "12px" }}>
              Excel
            </button>
            <button onClick={() => handlePrint("Customer Directory - PDF Statement")} className="hub-btn hub-btn-list" style={{ padding: "6px 12px", fontSize: "12px" }}>
              PDF
            </button>
            <button onClick={() => handlePrint("Customer Directory Statement")} className="hub-btn hub-btn-list" style={{ padding: "6px 12px", fontSize: "12px" }}>
              Print
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
    </div>
  );
};
