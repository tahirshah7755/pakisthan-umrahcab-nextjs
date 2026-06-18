"use client";

import React from "react";

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

    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    
    const rowsHtml = customers.map((c: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1e3a8a;">${c.id}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${c.name || ""}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${c.company || ""}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${c.contact || ""}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${c.registeredBy || ""}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${c.lastUpdate || ""}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; margin: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #1e3a8a; font-size: 24px; }
            .header p { margin: 5px 0 0 0; color: #64748b; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background-color: #f8fafc; padding: 12px 10px; border-bottom: 2px solid #e2e8f0; text-align: left; text-transform: uppercase; color: #475569; font-weight: 700; }
            @media print {
              body { margin: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>${title}</h1>
              <p>Umrah Cab Customer Registry</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Generated Date:</strong> ${today}</p>
              <p><strong>Total Customers:</strong> ${customers.length}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Customer Name</th>
                <th>Associated Company</th>
                <th>Contact</th>
                <th>Registered By</th>
                <th>Last Update</th>
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
        <button onClick={() => router.push("/admin/customers/add")} className="form-btn-back">
          <i className="fas fa-plus"></i>
          <span>Add New Customer</span>
        </button>
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
                <th>Registered By</th>
                <th>Last Update</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)", fontWeight: "500" }}>
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
                    <td>{c.contact}</td>
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
                        <button
                          onClick={() => setEditingCustomer(c)}
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
