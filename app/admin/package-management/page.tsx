"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  useGetPriceListQuery,
  useCreatePriceListMutation,
  useDeletePriceListMutation
} from "@/store/api/priceListApi";
import { api } from "@/utils/api";

// Helper to translate route dynamically to Urdu mapping
const translateToUrdu = (route: string) => {
  let urdu = route
    .replace(/Jeddah/gi, "جدہ")
    .replace(/Airport/gi, "ایئرپورٹ")
    .replace(/Makkah/gi, "مکہ")
    .replace(/Madinah/gi, "مدینہ")
    .replace(/Hotel/gi, "ہوٹل")
    .replace(/to/gi, "سے")
    .replace(/Station/gi, "اسٹیشن")
    .replace(/Mazarat/gi, "مزارات")
    .replace(/Transit/gi, "ٹرانزٹ");
  return urdu;
};

// Helper to generate a code dynamically
const generateRouteCode = (route: string) => {
  const words = route.split(" ");
  const parts = words.map(w => w.substring(0, 3).toUpperCase()).filter(p => p !== "TO");
  return parts.slice(0, 3).join("-");
};

export default function PackageManagementPage() {
  const router = useRouter();
  const { data: routesData, isLoading: routesLoading, refetch: refetchRoutes } = useGetPriceListQuery({ paginate: "false" });
  
  const [createPriceList] = useCreatePriceListMutation();
  const [deletePriceList] = useDeletePriceListMutation();

  // Tab State: 'packages' | 'locations'
  const [activeTab, setActiveTab] = useState<"packages" | "locations">("packages");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  // Route states
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [newRoute, setNewRoute] = useState("");

  // Location states
  const [locations, setLocations] = useState<any[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationType, setNewLocationType] = useState("both");

  // Toast notification state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  // Fetch Locations
  const fetchLocationsList = async () => {
    setLocationsLoading(true);
    try {
      const data = await api.getAdminLocationsList();
      setLocations(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load global locations.", "error");
    } finally {
      setLocationsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "locations") {
      fetchLocationsList();
    }
  }, [activeTab]);

  const handleCreateRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoute.trim()) {
      showToast("Please enter a route name.", "error");
      return;
    }
    try {
      await createPriceList({
        route: newRoute.trim(),
        sedan_price: 300,
        sedan_dates: "2026-06-01 to 2026-08-31",
        suv_price: 700,
        suv_dates: "2026-06-01 to 2026-08-31",
        van_price: 500,
        van_dates: "2026-06-01 to 2026-08-31",
        coach_price: 1200,
        coach_dates: "2026-06-01 to 2026-08-31",
      }).unwrap();
      
      showToast("New route package added successfully!", "success");
      setNewRoute("");
      setShowAddRouteModal(false);
      refetchRoutes();
    } catch (err: any) {
      console.error(err);
      showToast(err?.data?.message || "Failed to add route package.", "error");
    }
  };

  const handleDeleteRoute = async (id: string, routeName: string) => {
    if (!confirm(`Are you sure you want to delete route "${routeName}"?`)) {
      return;
    }
    try {
      await deletePriceList(parseInt(id)).unwrap();
      showToast(`Route "${routeName}" deleted successfully!`, "success");
      refetchRoutes();
    } catch (err: any) {
      console.error(err);
      showToast(err?.data?.message || "Failed to delete route.", "error");
    }
  };

  // Add Location Submit
  const handleCreateLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocationName.trim()) {
      showToast("Please enter a location name.", "error");
      return;
    }
    try {
      const res = await api.createLocation({
        name: newLocationName.trim(),
        type: newLocationType
      });
      if (res.success) {
        showToast("New location added to global database!", "success");
        setNewLocationName("");
        setNewLocationType("both");
        setShowAddLocationModal(false);
        fetchLocationsList();
      } else {
        showToast(res.error || "Failed to add location.", "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast("Failed to add location.", "error");
    }
  };

  // Delete Location
  const handleDeleteLocation = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete location "${name}"?`)) {
      return;
    }
    try {
      const res = await api.deleteLocation(id);
      if (res.success) {
        showToast(`Location "${name}" deleted from database.`, "success");
        fetchLocationsList();
      } else {
        showToast(res.error || "Failed to delete location.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to delete location.", "error");
    }
  };

  let routes: any[] = [];
  if (routesData) {
    if (Array.isArray(routesData)) {
      routes = routesData;
    } else if (typeof routesData === "object") {
      const rootData = (routesData as any).data;
      if (Array.isArray(rootData)) {
        routes = rootData;
      } else if (rootData && Array.isArray(rootData.data)) {
        routes = rootData.data;
      }
    }
  }

  const filteredRoutes = routes.filter((item: any) =>
    !searchTerm.trim() || item.route?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLocations = locations.filter((item: any) =>
    !searchTerm.trim() || item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentItems = activeTab === "packages" ? filteredRoutes : filteredLocations;
  const totalItems = currentItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedRoutes = filteredRoutes.slice(startIndex, startIndex + itemsPerPage);
  const paginatedLocations = filteredLocations.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
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

      {/* Header Card */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #065f46 0%, #059669 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>System Routes & Locations</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Setup standard transportation routes, active location databases, and price maps.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {activeTab === "packages" ? (
            <button 
              onClick={() => setShowAddRouteModal(true)} 
              style={{ background: "#ffffff", color: "#059669", border: "none", borderRadius: "6px", padding: "10px 18px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <i className="fas fa-plus"></i>
              <span>Add Route Package</span>
            </button>
          ) : (
            <button 
              onClick={() => setShowAddLocationModal(true)} 
              style={{ background: "#ffffff", color: "#059669", border: "none", borderRadius: "6px", padding: "10px 18px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <i className="fas fa-plus"></i>
              <span>Add Global Location</span>
            </button>
          )}
          <button 
            onClick={() => router.push("/admin/hub")} 
            style={{ background: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", padding: "10px 18px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <i className="fas fa-arrow-left"></i>
            <span>Back to Hub</span>
          </button>
        </div>
      </div>

      {/* Controls Bar: Tabs Selector + Search Input */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", flexWrap: "wrap", gap: "15px" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={() => setActiveTab("packages")}
            style={{
              padding: "10px 20px", fontWeight: "700", fontSize: "15px", border: "none", background: "none",
              color: activeTab === "packages" ? "#059669" : "#64748b",
              borderBottom: activeTab === "packages" ? "3px solid #059669" : "none",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            <i className="fas fa-route"></i>
            <span>Route Trip Packages</span>
            <span style={{ background: activeTab === "packages" ? "#dcfce7" : "#f1f5f9", color: activeTab === "packages" ? "#15803d" : "#64748b", padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>
              {routes.length}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab("locations")}
            style={{
              padding: "10px 20px", fontWeight: "700", fontSize: "15px", border: "none", background: "none",
              color: activeTab === "locations" ? "#059669" : "#64748b",
              borderBottom: activeTab === "locations" ? "3px solid #059669" : "none",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            <i className="fas fa-location-dot"></i>
            <span>Global Locations Database</span>
            <span style={{ background: activeTab === "locations" ? "#dcfce7" : "#f1f5f9", color: activeTab === "locations" ? "#15803d" : "#64748b", padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>
              {locations.length}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: "relative", minWidth: "260px" }}>
          <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}></i>
          <input
            type="text"
            placeholder={activeTab === "packages" ? "Search routes..." : "Search locations..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%", padding: "8px 12px 8px 36px", border: "1px solid #cbd5e1", borderRadius: "6px",
              fontSize: "13px", color: "#1e293b", outline: "none"
            }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "packages" ? (
        <div className="table-card" style={{ background: "#ffffff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
          {routesLoading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
              <div className="spinner" style={{ borderTopColor: "#059669" }}></div>
              <span style={{ marginLeft: "12px", color: "#64748b", fontWeight: "600" }}>Loading Routes...</span>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="db-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Route ID</th>
                    <th>English Description</th>
                    <th>Urdu Mapping</th>
                    <th>Unique Code</th>
                    <th>Package Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRoutes.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>
                        {searchTerm ? "No matching routes found." : "No routes registered in the system."}
                      </td>
                    </tr>
                  ) : (
                    paginatedRoutes.map((item: any, idx: number) => (
                      <tr key={item.id || idx}>
                        <td style={{ fontWeight: 700 }}>#PKG-{String(item.id).padStart(2, "0")}</td>
                        <td style={{ fontWeight: 600 }}>{item.route}</td>
                        <td style={{ direction: "rtl", textAlign: "left", fontFamily: "inherit" }}>
                          {translateToUrdu(item.route)}
                        </td>
                        <td>
                          <span className="status-pill active" style={{ background: "#f1f5f9", color: "#334155", padding: "4px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>
                            {generateRouteCode(item.route)}
                          </span>
                        </td>
                        <td>
                          <span className="status-pill completed" style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: "600" }}>
                            Core Route
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button 
                            onClick={() => handleDeleteRoute(item.id, item.route)}
                            title="Delete Route"
                            style={{ background: "#fee2e2", border: "none", borderRadius: "6px", color: "#dc2626", width: "32px", height: "32px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <i className="fas fa-trash-can" style={{ fontSize: "14px" }}></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls for Routes */}
          {filteredRoutes.length > 0 && (
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginTop: "20px", paddingTop: "15px", borderTop: "1px solid #e2e8f0",
              flexWrap: "wrap", gap: "12px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#64748b", fontSize: "13px" }}>
                <span>
                  Showing <strong>{startIndex + 1}</strong> to <strong>{Math.min(startIndex + itemsPerPage, filteredRoutes.length)}</strong> of <strong>{filteredRoutes.length}</strong> routes
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#ffffff", color: "#334155" }}
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1",
                    background: currentPage === 1 ? "#f8fafc" : "#ffffff",
                    color: currentPage === 1 ? "#94a3b8" : "#059669",
                    fontWeight: "600", fontSize: "13px", cursor: currentPage === 1 ? "not-allowed" : "pointer"
                  }}
                >
                  <i className="fas fa-chevron-left" style={{ marginRight: "4px" }}></i> Previous
                </button>

                <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155", padding: "0 8px" }}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  style={{
                    padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1",
                    background: currentPage >= totalPages ? "#f8fafc" : "#ffffff",
                    color: currentPage >= totalPages ? "#94a3b8" : "#059669",
                    fontWeight: "600", fontSize: "13px", cursor: currentPage >= totalPages ? "not-allowed" : "pointer"
                  }}
                >
                  Next <i className="fas fa-chevron-right" style={{ marginLeft: "4px" }}></i>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="table-card" style={{ background: "#ffffff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
          {locationsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
              <div className="spinner" style={{ borderTopColor: "#059669" }}></div>
              <span style={{ marginLeft: "12px", color: "#64748b", fontWeight: "600" }}>Loading Locations Database...</span>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="db-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Location ID</th>
                    <th>Location Name</th>
                    <th>Applicable Usage</th>
                    <th>Created At</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLocations.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>
                        {searchTerm ? "No matching locations found." : "No locations added to database yet."}
                      </td>
                    </tr>
                  ) : (
                    paginatedLocations.map((item: any, idx: number) => (
                      <tr key={item.id || idx}>
                        <td style={{ fontWeight: 700 }}>#LOC-{String(item.id).padStart(3, "0")}</td>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td>
                          <span 
                            className="status-pill" 
                            style={{ 
                              background: item.type === "pickup" ? "#eff6ff" : item.type === "dropoff" ? "#fef2f2" : "#f0fdf4", 
                              color: item.type === "pickup" ? "#1d4ed8" : item.type === "dropoff" ? "#dc2626" : "#166534", 
                              padding: "4px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: "600",
                              textTransform: "capitalize"
                            }}
                          >
                            {item.type === "both" ? "Pickup & Drop-off" : item.type}
                          </span>
                        </td>
                        <td>{new Date(item.created_at).toLocaleDateString()}</td>
                        <td style={{ textAlign: "right" }}>
                          <button 
                            onClick={() => handleDeleteLocation(item.id, item.name)}
                            title="Delete Location"
                            style={{ background: "#fee2e2", border: "none", borderRadius: "6px", color: "#dc2626", width: "32px", height: "32px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <i className="fas fa-trash-can" style={{ fontSize: "14px" }}></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls for Locations */}
          {filteredLocations.length > 0 && (
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginTop: "20px", paddingTop: "15px", borderTop: "1px solid #e2e8f0",
              flexWrap: "wrap", gap: "12px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#64748b", fontSize: "13px" }}>
                <span>
                  Showing <strong>{startIndex + 1}</strong> to <strong>{Math.min(startIndex + itemsPerPage, filteredLocations.length)}</strong> of <strong>{filteredLocations.length}</strong> locations
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#ffffff", color: "#334155" }}
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1",
                    background: currentPage === 1 ? "#f8fafc" : "#ffffff",
                    color: currentPage === 1 ? "#94a3b8" : "#059669",
                    fontWeight: "600", fontSize: "13px", cursor: currentPage === 1 ? "not-allowed" : "pointer"
                  }}
                >
                  <i className="fas fa-chevron-left" style={{ marginRight: "4px" }}></i> Previous
                </button>

                <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155", padding: "0 8px" }}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  style={{
                    padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1",
                    background: currentPage >= totalPages ? "#f8fafc" : "#ffffff",
                    color: currentPage >= totalPages ? "#94a3b8" : "#059669",
                    fontWeight: "600", fontSize: "13px", cursor: currentPage >= totalPages ? "not-allowed" : "pointer"
                  }}
                >
                  Next <i className="fas fa-chevron-right" style={{ marginLeft: "4px" }}></i>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Route Package Modal */}
      {showAddRouteModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "500px", margin: "20px", borderTop: "6px solid #059669", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                <i className="fas fa-route" style={{ marginRight: "8px", color: "#059669" }}></i> Add New Route Package
              </h3>
              <button onClick={() => setShowAddRouteModal(false)} style={{ background: "transparent", border: "none", fontSize: "18px", cursor: "pointer", color: "#94a3b8" }}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateRouteSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label">Route Name *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-map-pin form-icon" style={{ color: "#059669" }}></i>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Jeddah Airport To Makkah Hotel"
                    value={newRoute}
                    onChange={(e) => setNewRoute(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <small style={{ color: "#64748b", display: "block", marginTop: "5px" }}>
                  Example format: <strong>From City To To City</strong> (e.g. Makkah Hotel To Madinah Hotel)
                </small>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddRouteModal(false)}
                  style={{
                    background: "transparent", color: "#64748b", border: "1px solid #cbd5e1",
                    borderRadius: "6px", padding: "8px 20px", fontSize: "13px", fontWeight: "600", cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit" style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)", width: "auto" }}>
                  Add Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {showAddLocationModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "500px", margin: "20px", borderTop: "6px solid #059669", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                <i className="fas fa-location-dot" style={{ marginRight: "8px", color: "#059669" }}></i> Add Global Location
              </h3>
              <button onClick={() => setShowAddLocationModal(false)} style={{ background: "transparent", border: "none", fontSize: "18px", cursor: "pointer", color: "#94a3b8" }}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateLocationSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label">Location Name *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-map-location-dot form-icon" style={{ color: "#059669" }}></i>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Jeddah Airport (JED) - Terminal 1"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Usage / Type *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-filter form-icon" style={{ color: "#059669" }}></i>
                  <select
                    className="form-input"
                    value={newLocationType}
                    onChange={(e) => setNewLocationType(e.target.value)}
                    required
                  >
                    <option value="both">Both (Pickup & Drop-off)</option>
                    <option value="pickup">Pickup Only</option>
                    <option value="dropoff">Drop-off Only</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddLocationModal(false)}
                  style={{
                    background: "transparent", color: "#64748b", border: "1px solid #cbd5e1",
                    borderRadius: "6px", padding: "8px 20px", fontSize: "13px", fontWeight: "600", cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit" style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)", width: "auto" }}>
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
