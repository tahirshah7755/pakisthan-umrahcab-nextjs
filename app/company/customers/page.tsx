"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { exportToExcel } from "@/utils/excelHelper";
import { CountryCodeSelector } from "@/components/CountryCodeSelector";

const defaultCountryCodes = [
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+92", flag: "🇵🇰", name: "Pakistan" },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+1", flag: "🇺🇸", name: "US/Canada" },
];

const formatPhoneNumber = (code: string, number: string) => {
  if (!number) return "";
  const cleaned = number.trim();
  if (cleaned.startsWith("+") || cleaned.startsWith("00")) return cleaned;
  return `${code}${cleaned}`;
};

interface CustomerRecord {
  id: string;
  custom_id: string;
  name: string;
  contact: string;
  registered_by: string;
  last_update: string;
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

export default function CompanyCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Add Customer Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustMobile, setNewCustMobile] = useState("");
  const [newCustMobileCode, setNewCustMobileCode] = useState("+966");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPassport, setNewCustPassport] = useState("");
  const [newCustNotes, setNewCustNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [countryCodes, setCountryCodes] = useState(defaultCountryCodes);

  useEffect(() => {
    async function loadCountryCodes() {
      const list = await api.getCountryCodes();
      if (list && list.length > 0) {
        setCountryCodes(list);
      }
    }
    loadCountryCodes();
  }, []);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleExportExcel = () => {
    if (customers.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["Customer ID", "Name", "Contact Details", "Registered By", "Last Update"];
    const textRows = customers.map((c: any) => [
      c.custom_id || "",
      c.name || "",
      c.contact || "",
      c.registered_by || "",
      c.last_update || ""
    ]);
    
    exportToExcel({
      title: "Agent Corporate Customers Directory",
      headers,
      rows: textRows,
      filename: `customers_${new Date().toISOString().split("T")[0]}.xls`
    });
  };

  const handleCopy = () => {
    if (customers.length === 0) {
      showToast("No data to copy!", "error");
      return;
    }
    const headers = ["Customer ID", "Name", "Contact Details", "Registered By", "Last Update"];
    const textRows = customers.map((c: any) => [
      c.custom_id || "",
      c.name || "",
      c.contact || "",
      c.registered_by || "",
      c.last_update || ""
    ]);
    const text = [headers.join("\t"), ...textRows.map(r => r.join("\t"))].join("\n");
    navigator.clipboard.writeText(text)
      .then(() => showToast("Copied customer list to clipboard!", "success"))
      .catch(() => showToast("Failed to copy!", "error"));
  };

  const handleExportCSV = () => {
    if (customers.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = ["Customer ID", "Name", "Contact Details", "Registered By", "Last Update"];
    const csvContent = [
      headers.join(","),
      ...customers.map((c: any) => [
        `"${(c.custom_id || "").replace(/"/g, '""')}"`,
        `"${(c.name || "").replace(/"/g, '""')}"`,
        `"${(c.contact || "").replace(/"/g, '""')}"`,
        `"${(c.registered_by || "").replace(/"/g, '""')}"`,
        `"${(c.last_update || "").replace(/"/g, '""')}"`
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

  const handlePrint = (title: string = "Agent Corporate Customers Directory") => {
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
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1e293b;">${c.custom_id}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${c.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${c.contact || "N/A"}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${c.registered_by}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${c.last_update}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; margin: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #b48a1d; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #b48a1d; font-size: 24px; }
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
              <p>Umrah Cab B2B Agent Corporate Customers Directory</p>
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
                <th>Name</th>
                <th>Contact Details</th>
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

  const handleButtonClick = (fmt: string) => {
    if (fmt === "Copy") handleCopy();
    else if (fmt === "CSV") handleExportCSV();
    else if (fmt === "Excel") handleExportExcel();
    else if (fmt === "PDF" || fmt === "Print") handlePrint(fmt === "PDF" ? "Customers Directory - PDF Report" : "Customers Directory");
  };

  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      showToast("Customer name is required.", "error");
      return;
    }
    if (!newCustEmail.trim()) {
      showToast("Email address is required.", "error");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newCustEmail)) {
      showToast("Please enter a valid email address.", "error");
      return;
    }
    try {
      setSubmitting(true);
      
      const formattedPhone = formatPhoneNumber(newCustMobileCode, newCustMobile);
      const phones = [formattedPhone].filter(Boolean).join(" / ");
      const emailInfo = newCustEmail ? ` | Email: ${newCustEmail}` : "";
      const passportInfo = newCustPassport ? ` | Passport: ${newCustPassport}` : "";
      const notesInfo = newCustNotes ? ` | Notes: ${newCustNotes}` : "";
      const consolidatedContact = `${phones || "N/A"}${emailInfo}${passportInfo}${notesInfo}`;

      const res = await api.createCompanyCustomer({
        name: newCustName,
        contact: consolidatedContact,
        phone: formattedPhone || null,
        email: newCustEmail || null,
        passport_no: newCustPassport || null,
        notes: newCustNotes || null
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

  // Paginate customers
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = customers.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(customers.length / entriesPerPage);

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
          onClick={() => router.push("/company/customers/add")}
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
      <div className="table-card mobile-card" style={{ padding: "25px" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
          <div className="mobile-toolbar" style={{ display: "flex", gap: "8px" }}>
            {["Copy", "CSV", "Excel", "PDF", "Print"].map((fmt) => (
              <button
                key={fmt}
                onClick={() => handleButtonClick(fmt)}
                className="hub-btn hub-btn-list"
                style={{ padding: "6px 12px", fontSize: "12px", margin: 0 }}
              >
                {fmt}
              </button>
            ))}
          </div>
          
          <div className="mobile-search-box" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>Search:</span>
            <input
              type="text"
              placeholder="Search customers..."
              className="matrix-search-input"
              style={{ width: "220px", height: "35px" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
            <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #d4af37", borderRadius: "50%", width: "35px", height: "35px", animation: "spin 1s linear infinite" }}></div>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="db-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Customer Name</th>
                    <th>Contact</th>
                    <th>Registered By</th>
                    <th>Last Update</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "#64748b", padding: "30px 10px" }}>No customers associated with this corporate account.</td>
                    </tr>
                  ) : (
                    currentEntries.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 700, color: "var(--primary-color)" }}>{c.custom_id}</td>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td>{formatContact(c.contact)}</td>
                        <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{c.registered_by}</td>
                        <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{c.last_update}</td>
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
                  value={entriesPerPage} 
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
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
                Showing {customers.length === 0 ? 0 : indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, customers.length)} of {customers.length} entries
              </span>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button 
                  className="form-btn-back" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ 
                    background: currentPage === 1 ? "#f1f5f9" : "var(--primary-color)", 
                    color: currentPage === 1 ? "#94a3b8" : "#ffffff", 
                    border: "none",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    padding: "6px 12px",
                    fontWeight: "600",
                    borderRadius: "6px",
                    margin: 0
                  }}
                >
                  Previous
                </button>
                <span style={{ display: "flex", alignItems: "center", padding: "0 10px", fontSize: "13px", fontWeight: "700", color: "#334155" }}>
                  Page {currentPage} of {totalPages || 1}
                </span>
                <button 
                  className="form-btn-back" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  style={{ 
                    background: (currentPage === totalPages || totalPages === 0) ? "#f1f5f9" : "var(--primary-color)", 
                    color: (currentPage === totalPages || totalPages === 0) ? "#94a3b8" : "#ffffff", 
                    border: "none",
                    cursor: (currentPage === totalPages || totalPages === 0) ? "not-allowed" : "pointer",
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
          </>
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
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>WhatsApp / Mobile *</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <CountryCodeSelector
                    value={newCustMobileCode}
                    onChange={setNewCustMobileCode}
                    style={{ width: "130px", flexShrink: 0 }}
                  />
                  <input
                    type="text"
                    required
                    value={newCustMobile}
                    onChange={(e) => setNewCustMobile(e.target.value)}
                    placeholder="e.g. 500000000"
                    style={{ flexGrow: 1, padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", outline: "none", color: "#000" }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>Email Address *</label>
                <input
                  type="email"
                  required
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
