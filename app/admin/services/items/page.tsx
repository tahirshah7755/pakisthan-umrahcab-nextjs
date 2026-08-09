"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

interface CatalogueItem {
  id: number;
  custom_id: string;
  name: string;
  entryBy: string;
  entryDate: string;
  editedBy: string;
  editedDate: string;
}

export default function ServicesItemsCatalogue() {
  const router = useRouter();
  const { user } = useAuth();

  const [serviceCatalogue, setServiceCatalogue] = useState<CatalogueItem[]>([]);
  const [catalogItemsPage, setCatalogItemsPage] = useState(1);
  const [catalogItemsPerPage, setCatalogItemsPerPage] = useState(10);
  const [catalogItemsSearch, setCatalogItemsSearch] = useState("");
  const [catalogItemName, setCatalogItemName] = useState("");
  const [creatingCatalogItem, setCreatingCatalogItem] = useState(false);
  const [editingCatalogItem, setEditingCatalogItem] = useState<CatalogueItem | null>(null);
  const [loading, setLoading] = useState(false);

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

  const fetchCatalogueList = async () => {
    try {
      setLoading(true);
      const srvList = await api.getServices();
      if (srvList) {
        const dataArr = srvList.data || srvList;
        if (Array.isArray(dataArr)) {
          const catalogueItems = dataArr.filter((s: any) => s.type === "Catalogue");
          setServiceCatalogue(
            catalogueItems.map((s: any) => {
              const desc = s.description || "";
              const entryByMatch = desc.match(/Entry By:\s*([^|]+)/i);
              const entryDateMatch = desc.match(/Entry Date:\s*([^|]+)/i);
              const editedByMatch = desc.match(/Edited By:\s*([^|]+)/i);
              const editedDateMatch = desc.match(/Edited Date:\s*([^|]+)/i);

              return {
                id: s.id,
                custom_id: s.custom_id || `#CAT-${s.id}`,
                name: s.name,
                entryBy: entryByMatch ? (entryByMatch[1].trim().includes("umrahcab") ? entryByMatch[1].trim().replace(/umrahcab/gi, user?.name || user?.username || "hebacab") : entryByMatch[1].trim()) : (user?.name || user?.username || "hebacab"),
                entryDate: entryDateMatch
                  ? entryDateMatch[1].trim()
                  : new Date(s.created_at || Date.now()).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }),
                editedBy: editedByMatch ? editedByMatch[1].trim() : "N/A",
                editedDate: editedDateMatch ? editedDateMatch[1].trim() : "N/A",
              };
            })
          );
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast("Failed to load supplementary catalogue items.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogueList();
  }, []);

  const handleDeleteItem = async (itemId: number, itemName: string) => {
    if (window.confirm(`Are you sure you want to remove catalog item "${itemName}"?`)) {
      try {
        const res = await api.deleteService(itemId.toString());
        if (res?.success) {
          showToast(`Removed catalog item: ${itemName}`, "success");
          fetchCatalogueList();
        } else {
          showToast("Failed to delete catalog item.", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("Error deleting catalog item", "error");
      }
    }
  };

  const handleSaveCreateCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogItemName.trim()) {
      showToast("Service item name is required.", "error");
      return;
    }
    const entryBy = user?.name || user?.username || "hebacab";
    const entryDate = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const res = await api.createService({
      name: catalogItemName.trim(),
      type: "Catalogue",
      description: `Entry By: ${entryBy} | Entry Date: ${entryDate} | Edited By: N/A | Edited Date: N/A`,
      base_price: 0.00,
    });
    if (res?.success) {
      showToast(`Registered catalog item: ${catalogItemName}`, "success");
      setCatalogItemName("");
      setCreatingCatalogItem(false);
      fetchCatalogueList();
    } else {
      showToast("Failed to create catalog item.", "error");
    }
  };

  const handleSaveUpdateCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCatalogItem || !catalogItemName.trim()) return;

    const editedBy = user?.name || user?.username || "hebacab";
    const editedDate = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

    const res = await api.updateService(editingCatalogItem.id.toString(), {
      name: catalogItemName.trim(),
      description: `Entry By: ${editingCatalogItem.entryBy} | Entry Date: ${editingCatalogItem.entryDate} | Edited By: ${editedBy} | Edited Date: ${editedDate}`,
    });

    if (res?.success) {
      showToast("Updated catalogue item name!", "success");
      setEditingCatalogItem(null);
      setCatalogItemName("");
      fetchCatalogueList();
    } else {
      showToast("Failed to update catalog item.", "error");
    }
  };

  const filteredCatalogue = serviceCatalogue.filter(
    (item) =>
      item.name.toLowerCase().includes(catalogItemsSearch.toLowerCase()) ||
      item.entryBy.toLowerCase().includes(catalogItemsSearch.toLowerCase())
  );

  const totalItems = filteredCatalogue.length;
  const totalPages = Math.ceil(totalItems / catalogItemsPerPage);
  const indexOfLastItem = catalogItemsPage * catalogItemsPerPage;
  const indexOfFirstItem = indexOfLastItem - catalogItemsPerPage;
  const currentItems = filteredCatalogue.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Toast Alert */}
      {toast.show && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 9999,
          background: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "#ffffff",
          padding: "12px 24px",
          borderRadius: "8px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          fontWeight: "600",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          animation: "slideIn 0.3s ease-out"
        }}>
          <i className={toast.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>Additional Service Items</h2>
          <p>Manage the list of service items available for auxiliary operational registrations.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => router.push("/admin/services")} className="form-btn-back" style={{ background: "rgba(255, 255, 255, 0.15)", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.25)" }}>
            <i className="fas fa-arrow-left"></i>
            <span>Back to Services</span>
          </button>
          <button
            onClick={() => {
              setCatalogItemName("");
              setCreatingCatalogItem(true);
            }}
            className="form-btn-back"
            style={{ background: "#ffffff", color: "#5b21b6" }}
          >
            <i className="fas fa-plus"></i>
            <span>New Service Item</span>
          </button>
        </div>
      </div>

      {/* Table Toolbar Search */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "15px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px", color: "#64748b" }}>Show</span>
          <select
            className="form-input"
            style={{ width: "80px", padding: "6px", height: "auto" }}
            value={catalogItemsPerPage}
            onChange={(e) => {
              setCatalogItemsPerPage(parseInt(e.target.value));
              setCatalogItemsPage(1);
            }}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span style={{ fontSize: "14px", color: "#64748b" }}>entries</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px", color: "#475569", fontWeight: "600" }}>Search:</span>
          <input
            type="text"
            placeholder="Search catalogue..."
            value={catalogItemsSearch}
            onChange={(e) => {
              setCatalogItemsSearch(e.target.value);
              setCatalogItemsPage(1);
            }}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              outline: "none",
              fontSize: "14px",
              width: "200px",
              background: "#ffffff"
            }}
          />
        </div>
      </div>

      {/* Grid/Table Card */}
      <div className="table-card" style={{ padding: "20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
        <div className="table-responsive">
          <table className="db-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Service Item</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Entry By</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Entry Date</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Edited By</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Edited Date</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }}></i> Loading catalogue items...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                    No catalogue items found.
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 700, color: "#1e293b" }}>{item.name}</td>
                    <td style={{ color: "#64748b", fontWeight: "500" }}>{item.entryBy}</td>
                    <td>{item.entryDate}</td>
                    <td style={{ color: "#94a3b8" }}>{item.editedBy}</td>
                    <td style={{ color: "#94a3b8" }}>{item.editedDate}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                        <button
                          onClick={() => {
                            setEditingCatalogItem(item);
                            setCatalogItemName(item.name);
                          }}
                          title="Edit Service"
                          style={{
                            background: "#f1f5f9",
                            border: "none",
                            borderRadius: "6px",
                            width: "30px",
                            height: "30px",
                            cursor: "pointer",
                            color: "#4f46e5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <i className="fas fa-pencil" style={{ fontSize: "12px" }}></i>
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          title="Delete Service"
                          style={{
                            background: "#fee2e2",
                            border: "none",
                            borderRadius: "6px",
                            width: "30px",
                            height: "30px",
                            cursor: "pointer",
                            color: "#ef4444",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <i className="fas fa-trash-alt" style={{ fontSize: "12px" }}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", flexWrap: "wrap", gap: "10px" }}>
          <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>
            Showing {currentItems.length} of {totalItems} entries
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setCatalogItemsPage(prev => Math.max(1, prev - 1))}
              style={{
                background: catalogItemsPage === 1 ? "#f1f5f9" : "#f5f3ff",
                color: catalogItemsPage === 1 ? "#94a3b8" : "#7c3aed",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                fontWeight: "600",
                cursor: catalogItemsPage === 1 ? "not-allowed" : "pointer"
              }}
              disabled={catalogItemsPage === 1}
            >
              Previous
            </button>
            <span style={{ display: "flex", alignItems: "center", padding: "0 10px", fontSize: "14px", fontWeight: "600", color: "#475569" }}>
              Page {catalogItemsPage} of {totalPages || 1}
            </span>
            <button
              onClick={() => setCatalogItemsPage(prev => Math.min(totalPages, prev + 1))}
              style={{
                background: catalogItemsPage >= totalPages ? "#f1f5f9" : "#f5f3ff",
                color: catalogItemsPage >= totalPages ? "#94a3b8" : "#7c3aed",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                fontWeight: "600",
                cursor: catalogItemsPage >= totalPages ? "not-allowed" : "pointer"
              }}
              disabled={catalogItemsPage >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Popups and Modals */}
      {creatingCatalogItem && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "450px", margin: "20px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", background: "#ffffff", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "15px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#7c3aed", display: "flex", alignItems: "center", gap: "8px" }}><i className="fas fa-plus"></i> Add New Service Item</h3>
              <button onClick={() => { setCreatingCatalogItem(false); setCatalogItemName(""); }} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>&times;</button>
            </div>
            
            <form onSubmit={handleSaveCreateCatalogItem} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label className="form-label" style={{ fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px", display: "block" }}>Service Item Name *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-suitcase form-icon" style={{ color: "#94a3b8" }}></i>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. VIP Lounge Access" 
                    value={catalogItemName} 
                    onChange={(e) => setCatalogItemName(e.target.value)} 
                    required 
                    style={{ width: "100%", paddingLeft: "35px" }}
                  />
                </div>
              </div>

              <div className="form-group-full" style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                <button type="submit" className="btn-submit" style={{ flex: 1, background: "#7c3aed", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px", fontWeight: "600", cursor: "pointer" }}>Save Item</button>
                <button type="button" onClick={() => { setCreatingCatalogItem(false); setCatalogItemName(""); }} className="form-btn-back" style={{ flex: 1, justifyContent: "center", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", padding: "10px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingCatalogItem && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "450px", margin: "20px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", background: "#ffffff", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "15px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#7c3aed", display: "flex", alignItems: "center", gap: "8px" }}><i className="fas fa-pencil"></i> Edit Service Item</h3>
              <button onClick={() => { setEditingCatalogItem(null); setCatalogItemName(""); }} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>&times;</button>
            </div>
            
            <form onSubmit={handleSaveUpdateCatalogItem} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label className="form-label" style={{ fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px", display: "block" }}>Service Item Name *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-suitcase form-icon" style={{ color: "#94a3b8" }}></i>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. VIP Lounge Access" 
                    value={catalogItemName} 
                    onChange={(e) => setCatalogItemName(e.target.value)} 
                    required 
                    style={{ width: "100%", paddingLeft: "35px" }}
                  />
                </div>
              </div>

              <div className="form-group-full" style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                <button type="submit" className="btn-submit" style={{ flex: 1, background: "#7c3aed", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px", fontWeight: "600", cursor: "pointer" }}>Save Changes</button>
                <button type="button" onClick={() => { setEditingCatalogItem(null); setCatalogItemName(""); }} className="form-btn-back" style={{ flex: 1, justifyContent: "center", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", padding: "10px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
