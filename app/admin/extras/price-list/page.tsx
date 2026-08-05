"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/utils/api";
import {
  useGetPriceListQuery,
  useGetPriceGroupsQuery,
  useUpdatePriceListMutation,
  useApplyBulkPriceListMutation,
  useCreatePriceListMutation,
  useDeletePriceListMutation,
} from "@/store/api/priceListApi";
import { useGetFleetQuery } from "@/store/api/fleetApi";
import { useGetCompaniesQuery, useUpdateCompanyMutation } from "@/store/api/companiesApi";

interface PriceCell {
  price: string;
  from: string;
  to: string;
}

interface PackageRow {
  id: string;
  englishName: string;
  urduName: string;
  shortCode: string;
  prices: Record<string, PriceCell>; // Key is vehicle ID
  custom_prices?: any;
}

function getVehiclePriceInfo(b: any, key: string) {
  let price = 0;
  let dates = "2026-06-01 to 2026-08-31";
  
  // Try to resolve custom vehicle-specific price first
  if (b.custom_prices && typeof b.custom_prices === 'object') {
    const custom = b.custom_prices[key];
    if (custom && typeof custom === 'object') {
      price = parseFloat(custom.price) || 0;
      dates = `${custom.from || "2026-06-01"} to ${custom.to || "2026-08-31"}`;
      const parts = dates.split(" to ");
      return {
        price: String(price),
        from: parts[0] || "2026-06-01",
        to: parts[1] || "2026-08-31"
      };
    }
  }

  // Parse category as fallback
  const modelLower = key.toLowerCase();
  let category = "sedan";
  if (modelLower.includes("taurus")) {
    category = "taurus";
  } else if (modelLower.includes("staria") || modelLower.includes("starex") || modelLower.includes("hiace") || modelLower.includes("van")) {
    category = "van";
  } else if (modelLower.includes("yukon") || modelLower.includes("suv") || modelLower.includes("gmc")) {
    category = "suv";
  } else if (modelLower.includes("coaster") || modelLower.includes("bus") || modelLower.includes("coach")) {
    category = "coach";
  }

  if (category === "taurus") {
    price = b.custom_prices?.taurus_price ?? b.custom_prices?.["Ford Taurus"]?.price ?? (b.sedan_price ? b.sedan_price + 100 : 400);
    dates = b.sedan_dates || "2026-06-01 to 2026-08-31";
  } else if (category === "sedan") {
    price = b.sedan_price ?? 300;
    dates = b.sedan_dates || "2026-06-01 to 2026-08-31";
  } else if (category === "van") {
    price = b.van_price ?? 500;
    dates = b.van_dates || "2026-06-01 to 2026-08-31";
  } else if (category === "suv") {
    price = b.suv_price ?? 700;
    dates = b.suv_dates || "2026-06-01 to 2026-08-31";
  } else if (category === "coach") {
    price = b.coach_price ?? 1200;
    dates = b.coach_dates || "2026-06-01 to 2026-08-31";
  }
  
  const parts = dates.split(" to ");
  return {
    price: String(price),
    from: parts[0] || "2026-06-01",
    to: parts[1] || "2026-08-31"
  };
}

export default function PriceListMatrix() {
  const { extrasUnlocked } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: fleetResponse } = useGetFleetQuery(undefined);
  const fleetList = Array.isArray(fleetResponse)
    ? fleetResponse
    : (fleetResponse && typeof fleetResponse === "object" && Array.isArray((fleetResponse as any).data)
        ? (fleetResponse as any).data
        : []);

  const activeVehicles = React.useMemo(() => {
    if (fleetList.length > 0) {
      return fleetList.map((f: any) => {
        const modelLower = f.model.toLowerCase();
        let dbField = "sedan";
        if (modelLower.includes("taurus")) {
          dbField = "taurus";
        } else if (modelLower.includes("staria") || modelLower.includes("starex") || modelLower.includes("hiace") || modelLower.includes("van")) {
          dbField = "van";
        } else if (modelLower.includes("yukon") || modelLower.includes("suv") || modelLower.includes("gmc")) {
          dbField = "suv";
        } else if (modelLower.includes("coaster") || modelLower.includes("bus") || modelLower.includes("coach")) {
          dbField = "coach";
        }

        return {
          id: String(f.id),
          key: dbField,
          name: f.model,
          isCore: false
        };
      });
    }

    return [];
  }, [fleetList]);

  // Redirect if extras not unlocked
  useEffect(() => {
    const savedExtras = typeof window !== "undefined" ? localStorage.getItem("umrahcab_extras_unlocked") : null;
    if (!extrasUnlocked && savedExtras !== "true") {
      router.push("/admin/extras");
    }
  }, [extrasUnlocked, router]);

  // Pricing State
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [search, setSearch] = useState("");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  // Reset page on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Date Tool State
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");

  // Toast State
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  // Groups State
  const { data: priceGroupsFromApi, refetch: refetchGroups } = useGetPriceGroupsQuery(undefined, {
    skip: !extrasUnlocked,
  });
  const [localGroups, setLocalGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("Standard");

  const priceGroups = React.useMemo(() => {
    let apiList: string[] = [];
    if (Array.isArray(priceGroupsFromApi)) {
      apiList = priceGroupsFromApi;
    } else if (priceGroupsFromApi && typeof priceGroupsFromApi === "object") {
      if (Array.isArray((priceGroupsFromApi as any).data)) {
        apiList = (priceGroupsFromApi as any).data;
      }
    }
    if (apiList.length === 0) {
      apiList = ["Standard"];
    }
    const merged = Array.from(new Set([...apiList, ...localGroups]));
    if (!merged.includes("Standard")) merged.unshift("Standard");
    return merged;
  }, [priceGroupsFromApi, localGroups]);

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newGroupName.trim();
    if (!trimmed) {
      showToast("Group name cannot be empty", "error");
      return;
    }
    if (priceGroups.includes(trimmed)) {
      showToast("Group already exists", "error");
      return;
    }
    setLocalGroups((prev) => [...prev, trimmed]);
    setSelectedGroup(trimmed);
    setNewGroupName("");
    setShowGroupModal(false);
    showToast(`Price group "${trimmed}" created! Edit rates below and save.`, "success");
  };

  const { data: priceListData, isLoading: isFetching } = useGetPriceListQuery({
    page: currentPage,
    per_page: itemsPerPage,
    search: search,
    group_name: selectedGroup
  }, {
    skip: !extrasUnlocked,
  });

  const [updatePriceList, { isLoading: isUpdating }] = useUpdatePriceListMutation();
  const [applyBulkPriceList, { isLoading: isApplyingBulk }] = useApplyBulkPriceListMutation();
  const [createPriceList] = useCreatePriceListMutation();
  const [deletePriceList] = useDeletePriceListMutation();

  const [showAddModal, setShowAddModal] = useState(false);

  // Companies (B2B Agents) for tagging
  const { data: companiesData, refetch: refetchCompanies } = useGetCompaniesQuery(undefined, {
    skip: !extrasUnlocked,
  });
  const [updateCompany] = useUpdateCompanyMutation();
  const [companyToAssign, setCompanyToAssign] = useState("");

  const assignedCompanies = React.useMemo(() => {
    if (!companiesData) return [];
    const list = Array.isArray(companiesData) ? companiesData : (companiesData as any).data || [];
    return list.filter((c: any) => c.price_group === selectedGroup);
  }, [companiesData, selectedGroup]);

  const unassignedCompanies = React.useMemo(() => {
    if (!companiesData) return [];
    const list = Array.isArray(companiesData) ? companiesData : (companiesData as any).data || [];
    return list.filter((c: any) => c.price_group !== selectedGroup);
  }, [companiesData, selectedGroup]);

  const handleAssignCompany = async () => {
    if (!companyToAssign) return;
    try {
      const comp = (Array.isArray(companiesData) ? companiesData : (companiesData as any).data || []).find((c: any) => String(c.id) === companyToAssign);
      if (comp) {
        await updateCompany({ ...comp, price_group: selectedGroup }).unwrap();
        setCompanyToAssign("");
        showToast(`Agent "${comp.name}" successfully assigned to "${selectedGroup}"!`, "success");
        refetchCompanies();
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to assign agent.", "error");
    }
  };

  const handleUnassignCompany = async (comp: any) => {
    try {
      await updateCompany({ ...comp, price_group: "Standard" }).unwrap();
      showToast(`Agent "${comp.name}" unassigned from "${selectedGroup}".`, "success");
      refetchCompanies();
    } catch (err) {
      console.error(err);
      showToast("Failed to unassign agent.", "error");
    }
  };
  const [newRoute, setNewRoute] = useState("");
  const [locationsList, setLocationsList] = useState<string[]>([]);
  const [pickupLoc, setPickupLoc] = useState("");
  const [dropoffLoc, setDropoffLoc] = useState("");

  // Inline location creator states
  const [showInlineAddLoc, setShowInlineAddLoc] = useState(false);
  const [quickLocName, setQuickLocName] = useState("");
  const [quickLocTarget, setQuickLocTarget] = useState<"pickup" | "dropoff">("pickup");
  const [isAddingLoc, setIsAddingLoc] = useState(false);

  useEffect(() => {
    async function loadLocs() {
      try {
        const data = await api.getLocations();
        setLocationsList(data || []);
      } catch (e) {
        console.error("Failed to load locations for modal:", e);
      }
    }
    loadLocs();
  }, []);

  const handleQuickAddLocation = async () => {
    const trimmed = quickLocName.trim();
    if (!trimmed) {
      showToast("Location name cannot be empty", "error");
      return;
    }
    setIsAddingLoc(true);
    try {
      const res = await api.createLocation({ name: trimmed, type: "both" });
      if (res.success) {
        showToast(`Location "${trimmed}" added successfully!`, "success");
        const fresh = await api.getLocations();
        setLocationsList(fresh || []);
        
        if (quickLocTarget === "pickup") {
          setPickupLoc(trimmed);
          if (dropoffLoc) setNewRoute(`${trimmed} To ${dropoffLoc}`);
          else setNewRoute(`${trimmed} To ...`);
        } else {
          setDropoffLoc(trimmed);
          if (pickupLoc) setNewRoute(`${pickupLoc} To ${trimmed}`);
          else setNewRoute(`... To ${trimmed}`);
        }
        
        setQuickLocName("");
        setShowInlineAddLoc(false);
      } else {
        showToast(res.error || "Failed to add location", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to add location", "error");
    } finally {
      setIsAddingLoc(false);
    }
  };

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
      setPickupLoc("");
      setDropoffLoc("");
      setShowAddModal(false);
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
    } catch (err: any) {
      console.error(err);
      showToast(err?.data?.message || "Failed to delete route.", "error");
    }
  };

  useEffect(() => {
    if (!priceListData) return;

    let rawData: any[] = [];
    let total = 0;
    let lastPg = 1;

    // Handle nested data envelope
    const rootData = priceListData.data !== undefined ? priceListData.data : priceListData;

    if (rootData) {
      if (Array.isArray(rootData)) {
        rawData = rootData;
        total = rootData.length;
        lastPg = 1;
      } else if (rootData.data && Array.isArray(rootData.data)) {
        // Laravel LengthAwarePaginator structure
        rawData = rootData.data;
        total = rootData.total || 0;
        lastPg = rootData.last_page || 1;
      }
    }

    if (Array.isArray(rawData)) {
      const mapped = rawData.map((b: any) => {
        const prices: Record<string, PriceCell> = {};
        
        activeVehicles.forEach((vehicle: any) => {
          prices[vehicle.id] = getVehiclePriceInfo(b, vehicle.name);
        });

        return {
          id: String(b.id),
          englishName: b.route,
          urduName: b.route.includes("Airport") ? "ایئرپورٹ ٹرانسپورٹ" : "ہوٹل ٹرانسپورٹ",
          shortCode: b.route.split(" To ").map((s: string) => s.substring(0, 3).toUpperCase()).join("-"),
          prices,
          custom_prices: b.custom_prices
        };
      });
      setPackages(mapped);
      setTotalRecords(total);
      setLastPage(lastPg);
    }
  }, [priceListData, activeVehicles]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const handlePriceChange = (pkgId: string, vehicleId: string, val: string) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id !== pkgId) return pkg;
        return {
          ...pkg,
          prices: {
            ...pkg.prices,
            [vehicleId]: {
              ...pkg.prices[vehicleId],
              price: val,
            },
          },
        };
      })
    );
  };

  const handleDateChange = (pkgId: string, vehicleId: string, type: "from" | "to", val: string) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id !== pkgId) return pkg;
        return {
          ...pkg,
          prices: {
            ...pkg.prices,
            [vehicleId]: {
              ...pkg.prices[vehicleId],
              [type]: val,
            },
          },
        };
      })
    );
  };

  const applyBulkDates = async () => {
    if (!validFrom || !validTo) {
      showToast("Please select both 'Valid From' and 'Valid To' dates.", "error");
      return;
    }

    try {
      await applyBulkPriceList({
        start_date: validFrom,
        end_date: validTo,
        group_name: selectedGroup,
      }).unwrap();

      setPackages((prev) =>
        prev.map((pkg) => {
          const updatedPrices = { ...pkg.prices };
          Object.keys(updatedPrices).forEach((vehicleId) => {
            updatedPrices[vehicleId] = {
              ...updatedPrices[vehicleId],
              from: validFrom,
              to: validTo,
            };
          });
          return {
            ...pkg,
            prices: updatedPrices,
          };
        })
      );
      showToast("Date validity applied and saved across standard pricing matrix!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to apply bulk dates to database.", "error");
    }
  };

  const savePricingMatrix = async () => {
    try {
      for (const pkg of packages) {
        const routeId = parseInt(pkg.id);
        if (isNaN(routeId)) continue;
        
        const updatePayload: any = { 
          id: routeId,
          group_name: selectedGroup
        };
        
        const customPrices: Record<string, any> = pkg.custom_prices ? { ...pkg.custom_prices } : {};
        
        activeVehicles.forEach((vehicle: any) => {
          const priceCell = pkg.prices[vehicle.id];
          if (priceCell) {
            // Save vehicle-specific price dynamically
            customPrices[vehicle.name] = {
              price: parseFloat(priceCell.price) || 0,
              from: priceCell.from || "2026-06-01",
              to: priceCell.to || "2026-08-31"
            };

            // Maintain fallback categories for backward compatibility
            const modelLower = vehicle.name.toLowerCase();
            let category = "sedan";
            if (modelLower.includes("taurus")) {
              category = "taurus";
            } else if (modelLower.includes("staria") || modelLower.includes("starex") || modelLower.includes("hiace") || modelLower.includes("van")) {
              category = "van";
            } else if (modelLower.includes("yukon") || modelLower.includes("suv") || modelLower.includes("gmc")) {
              category = "suv";
            } else if (modelLower.includes("coaster") || modelLower.includes("bus") || modelLower.includes("coach")) {
              category = "coach";
            }

            if (category === "taurus") {
              customPrices["taurus_price"] = parseFloat(priceCell.price || "400");
              customPrices["Ford Taurus"] = {
                price: parseFloat(priceCell.price) || 0,
                from: priceCell.from || "2026-06-01",
                to: priceCell.to || "2026-08-31"
              };
            } else if (category === "sedan") {
              updatePayload.sedan_price = parseFloat(priceCell.price || "300");
              updatePayload.sedan_dates = `${priceCell.from} to ${priceCell.to}`;
            } else if (category === "van") {
              updatePayload.van_price = parseFloat(priceCell.price || "500");
              updatePayload.van_dates = `${priceCell.from} to ${priceCell.to}`;
            } else if (category === "suv") {
              updatePayload.suv_price = parseFloat(priceCell.price || "700");
              updatePayload.suv_dates = `${priceCell.from} to ${priceCell.to}`;
            } else if (category === "coach") {
              updatePayload.coach_price = parseFloat(priceCell.price || "1200");
              updatePayload.coach_dates = `${priceCell.from} to ${priceCell.to}`;
            }
          }
        });

        updatePayload.custom_prices = customPrices;

        await updatePriceList(updatePayload).unwrap();
      }
      refetchGroups();
      showToast(`Price Matrix for "${selectedGroup}" updated successfully!`, "success");
    } catch (err) {
      console.error(err);
      showToast("Error updating matrix pricing.", "error");
    }
  };

  // Pagination calculation
  const totalPages = lastPage;
  const paginatedPackages = packages;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  if (!isMounted || !extrasUnlocked) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Toast notifications */}
      {toast.show && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            <i
              className={`fas ${
                toast.type === "success"
                  ? "fa-circle-check text-success"
                  : "fa-circle-xmark text-danger"
              }`}
            ></i>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="matrix-header-banner" style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" }}>
        <div>
          <h2>Vehicle Price List</h2>
          <p>Update standard pricing for all vehicle models and route packages.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setShowAddModal(true)} className="form-btn-back" style={{ background: "#10b981", color: "#ffffff", fontWeight: "700", border: "none" }}>
            <i className="fas fa-plus"></i>
            <span>Add Route Package</span>
          </button>
          <button onClick={savePricingMatrix} disabled={isUpdating} className="form-btn-back" style={{ background: "#ffffff", color: "#1d4ed8", fontWeight: "700", border: "1px solid #cbd5e1" }}>
            <i className="fas fa-floppy-disk" style={{ color: "#1d4ed8" }}></i>
            <span>{isUpdating ? "Saving Matrix..." : "Save Matrix Pricing"}</span>
          </button>
          <button onClick={() => router.push("/admin/extras")} className="form-btn-back">
            <i className="fas fa-arrow-left"></i>
            <span>Back to Utilities</span>
          </button>
        </div>
      </div>

      {/* Group Selector & Management Card */}
      <div className="matrix-tool-card" style={{ borderLeft: "5px solid #10b981", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ background: "#e0f2fe", color: "#0284c7", borderRadius: "50%", width: "45px", height: "45px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            <i className="fas fa-tags"></i>
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>Pricing Group Tier</h4>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>Select or create a distinct pricing tier for specific B2B agents.</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <select 
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#334155", fontSize: "14px", fontWeight: "600", minWidth: "220px", height: "44px" }}
          >
            {priceGroups.map((g) => (
              <option key={g} value={g}>{g === "Standard" ? "Standard (Default Tier)" : g}</option>
            ))}
          </select>
          <button 
            onClick={() => setShowGroupModal(true)} 
            style={{ display: "flex", alignItems: "center", gap: "8px", background: "#0ea5e9", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 18px", fontWeight: "600", cursor: "pointer", height: "44px", fontSize: "14px" }}
          >
            <i className="fas fa-folder-plus"></i>
            <span>Create Pricing Group</span>
          </button>
        </div>
      </div>

      {/* B2B Agent Tagging & Assignment Section */}
      {selectedGroup !== "Standard" && (
        <div className="matrix-tool-card" style={{ borderLeft: "5px solid #8b5cf6", display: "flex", flexDirection: "column", gap: "15px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <i className="fas fa-building-user" style={{ color: "#8b5cf6", fontSize: "20px" }}></i>
              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                B2B Agents Assigned to "{selectedGroup}"
              </h4>
            </div>
            <span style={{ fontSize: "12px", background: "#f5f3ff", color: "#8b5cf6", fontWeight: "700", padding: "4px 10px", borderRadius: "12px" }}>
              {assignedCompanies.length} Agents
            </span>
          </div>
          
          {assignedCompanies.length === 0 ? (
            <p style={{ margin: 0, fontSize: "14px", color: "#64748b", fontStyle: "italic" }}>
              No B2B agents currently assigned to this pricing tier.
            </p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {assignedCompanies.map((c: any) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: "20px", padding: "6px 14px", fontSize: "13px", fontWeight: "600", color: "#6d28d9" }}>
                  <span>{c.name}</span>
                  <button 
                    onClick={() => handleUnassignCompany(c)}
                    title="Remove from group"
                    style={{ background: "none", border: "none", color: "#9e77ed", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", padding: 0 }}
                  >
                    <i className="fas fa-circle-xmark" style={{ color: "#a78bfa" }}></i>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "5px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Assign Agent to this Tier:</span>
            <select
              value={companyToAssign}
              onChange={(e) => setCompanyToAssign(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", minWidth: "200px" }}
            >
              <option value="">-- Choose B2B Agent --</option>
              {unassignedCompanies.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.price_group && c.price_group !== "Standard" ? `(Currently: ${c.price_group})` : ""}
                </option>
              ))}
            </select>
            <button
              onClick={handleAssignCompany}
              disabled={!companyToAssign}
              style={{ background: "#8b5cf6", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}
            >
              Assign Agent
            </button>
          </div>
        </div>
      )}

      {/* Date Validity Tool */}
      <div className="matrix-tool-card" style={{ borderLeft: "5px solid #2563eb" }}>
        <div className="tool-title-group" style={{ color: "#2563eb" }}>
          <i className="fas fa-clock-rotate-left"></i>
          <span>Global Period Tool</span>
        </div>
        <div className="tool-input-group">
          <div className="tool-field">
            <label>Valid From</label>
            <input
              type="date"
              className="tool-date-input"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
            />
          </div>
          <div className="tool-field">
            <label>Valid To</label>
            <input
              type="date"
              className="tool-date-input"
              value={validTo}
              onChange={(e) => setValidTo(e.target.value)}
            />
          </div>
          <button onClick={applyBulkDates} disabled={isApplyingBulk} className="tool-btn-apply" style={{ background: "#2563eb" }}>
            <i className="fas fa-circle-check"></i>
            <span>{isApplyingBulk ? "Applying Period..." : "Apply Period to Entire Matrix"}</span>
          </button>
        </div>
        <div className="tool-help-text">
          <i className="fas fa-circle-info"></i> Replaces all dates inside the matrix below and saves changes.
        </div>
      </div>

      {/* Search Filter */}
      <div className="matrix-search-card">
        <div className="matrix-search-input-wrapper">
          <i className="fas fa-search matrix-search-icon" style={{ color: "#2563eb" }}></i>
          <input
            type="text"
            className="matrix-search-input"
            placeholder="Search route packages by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Matrix Table */}
      <div className="matrix-container-card">
        {isFetching ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#64748b" }}>
            <div className="spinner" style={{ borderTopColor: "#2563eb" }}></div>
            <p style={{ marginTop: "12px", fontWeight: "600" }}>Loading standard matrix pricing...</p>
          </div>
        ) : (
          <>
            <div className="matrix-table-wrapper">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th style={{ background: "#2563eb", color: "#ffffff" }}>Route Package</th>
                  {activeVehicles.map((vehicle: any) => (
                    <th key={vehicle.id} className={vehicle.isCore ? "col-header-core" : ""}>
                      <span>{vehicle.name}</span>
                      {vehicle.isCore && (
                        <span className="core-badge" style={{ background: "#eff6ff", color: "#2563eb" }}>
                          <i className="fas fa-star" style={{ color: "#2563eb" }}></i>Core Vehicle
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedPackages.map((pkg) => (
                  <tr key={pkg.id}>
                    {/* Sticky leftmost column */}
                    <td>
                      <div className="package-name-cell" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", width: "100%" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span className="package-english" style={{ color: "#2563eb", fontWeight: "700" }}>{pkg.englishName}</span>
                          <span className="package-short" style={{ background: "#e5e7eb", color: "#4b5563", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", display: "inline-block", width: "fit-content" }}>{pkg.shortCode}</span>
                          <span className="package-urdu">{pkg.urduName}</span>
                        </div>
                        <button 
                           onClick={() => handleDeleteRoute(pkg.id, pkg.englishName)}
                           title="Delete Route"
                           style={{ background: "#fee2e2", border: "none", borderRadius: "6px", color: "#dc2626", width: "26px", height: "26px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <i className="fas fa-trash-can" style={{ fontSize: "12px" }}></i>
                        </button>
                      </div>
                    </td>

                    {/* Pricing and Date cells */}
                    {activeVehicles.map((vehicle: any) => {
                      const priceCell = pkg.prices[vehicle.id] || { price: "", from: "", to: "" };
                      return (
                        <td key={vehicle.id}>
                          <div className="cell-price-block">
                            <div className="cell-price-input-wrapper">
                              <span style={{ fontSize: "11px", position: "absolute", left: "6px", fontWeight: "700", color: "#16a34a" }}>SR</span>
                              <input
                                type="text"
                                className="cell-price-input"
                                value={priceCell.price}
                                onChange={(e) => handlePriceChange(pkg.id, vehicle.id, e.target.value)}
                                style={{ paddingLeft: "24px", color: "#16a34a", fontWeight: "700" }}
                              />
                            </div>

                            <div className="cell-date-field">
                              <label>From</label>
                              <input
                                type="date"
                                className="cell-date-input"
                                value={priceCell.from}
                                onChange={(e) => handleDateChange(pkg.id, vehicle.id, "from", e.target.value)}
                              />
                            </div>

                            <div className="cell-date-field">
                              <label>To</label>
                              <input
                                type="date"
                                className="cell-date-input"
                                value={priceCell.to}
                                onChange={(e) => handleDateChange(pkg.id, vehicle.id, "to", e.target.value)}
                              />
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {packages.length === 0 && (
                  <tr>
                    <td
                      colSpan={activeVehicles.length + 1}
                      style={{
                        textAlign: "center",
                        padding: "40px",
                        color: "#94a3b8",
                        fontWeight: 500,
                      }}
                    >
                      No packages found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              borderTop: "1px solid #f1f5f9",
              background: "#ffffff",
              flexWrap: "wrap",
              gap: "12px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#64748b" }}>
                <span>Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    background: "#ffffff",
                    outline: "none",
                    cursor: "pointer"
                  }}
                >
                  {[5, 10, 20, 50].map((num) => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
                <span>entries</span>
                <span style={{ marginLeft: "12px" }}>
                  Showing {totalRecords === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords} entries
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    background: currentPage === 1 ? "#f8fafc" : "#ffffff",
                    color: currentPage === 1 ? "#94a3b8" : "#2563eb",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <i className="fas fa-chevron-left"></i> Prev
                </button>

                {getPageNumbers().map((pageNum, idx) => {
                  if (pageNum === "...") {
                    return (
                      <span key={`dots-${idx}`} style={{ padding: "0 8px", color: "#64748b" }}>
                        ...
                      </span>
                    );
                  }
                  const isSelected = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(Number(pageNum))}
                      style={{
                        width: "36px",
                        height: "36px",
                        border: isSelected ? "none" : "1px solid #cbd5e1",
                        borderRadius: "6px",
                        background: isSelected ? "#2563eb" : "#ffffff",
                        color: isSelected ? "#ffffff" : "#334155",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "700"
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    background: currentPage === totalPages ? "#f8fafc" : "#ffffff",
                    color: currentPage === totalPages ? "#94a3b8" : "#2563eb",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  Next <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>
      {/* Add Route Package Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "500px", margin: "20px", borderTop: "6px solid #2563eb", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                <i className="fas fa-route" style={{ marginRight: "8px", color: "#2563eb" }}></i> Add New Route Package
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "transparent", border: "none", fontSize: "18px", cursor: "pointer", color: "#94a3b8" }}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateRouteSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Pickup & Destination Selectors */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label className="form-label" style={{ fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", margin: 0 }}>
                        1. Pickup Location
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setQuickLocTarget("pickup");
                          setShowInlineAddLoc(true);
                        }}
                        style={{
                          background: "#eff6ff",
                          color: "#2563eb",
                          border: "1px solid #bfdbfe",
                          borderRadius: "14px",
                          padding: "3px 10px",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          boxShadow: "0 1px 2px rgba(37, 99, 235, 0.08)"
                        }}
                        title="Add a new location to database"
                      >
                        <i className="fas fa-plus-circle" style={{ color: "#2563eb" }}></i>
                        <span>+ Add Location</span>
                      </button>
                    </div>
                    <select
                      className="form-input"
                      value={pickupLoc}
                      onChange={(e) => {
                        const p = e.target.value;
                        setPickupLoc(p);
                        if (p && dropoffLoc) {
                          setNewRoute(`${p} To ${dropoffLoc}`);
                        } else if (p) {
                          setNewRoute(`${p} To ...`);
                        }
                      }}
                      style={{ fontSize: "12px", padding: "8px" }}
                    >
                      <option value="">-- Select Pickup --</option>
                      {locationsList.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label className="form-label" style={{ fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", margin: 0 }}>
                        2. Drop-off Destination
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setQuickLocTarget("dropoff");
                          setShowInlineAddLoc(true);
                        }}
                        style={{
                          background: "#eff6ff",
                          color: "#2563eb",
                          border: "1px solid #bfdbfe",
                          borderRadius: "14px",
                          padding: "3px 10px",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          boxShadow: "0 1px 2px rgba(37, 99, 235, 0.08)"
                        }}
                        title="Add a new location to database"
                      >
                        <i className="fas fa-plus-circle" style={{ color: "#2563eb" }}></i>
                        <span>+ Add Location</span>
                      </button>
                    </div>
                    <select
                      className="form-input"
                      value={dropoffLoc}
                      onChange={(e) => {
                        const d = e.target.value;
                        setDropoffLoc(d);
                        if (pickupLoc && d) {
                          setNewRoute(`${pickupLoc} To ${d}`);
                        } else if (d) {
                          setNewRoute(`... To ${d}`);
                        }
                      }}
                      style={{ fontSize: "12px", padding: "8px" }}
                    >
                      <option value="">-- Select Drop-off --</option>
                      {locationsList.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Inline Quick Add Location Form */}
                {showInlineAddLoc && (
                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "10px 12px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#1e40af" }}>
                        <i className="fas fa-location-dot" style={{ marginRight: "4px" }}></i>
                        Add New Location ({quickLocTarget === "pickup" ? "For Pickup" : "For Drop-off"})
                      </span>
                      <button type="button" onClick={() => setShowInlineAddLoc(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "14px" }}>&times;</button>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Type new location name (e.g. Al Taif Hotel)..."
                        value={quickLocName}
                        onChange={(e) => setQuickLocName(e.target.value)}
                        style={{ fontSize: "12px", background: "#ffffff", padding: "6px 10px" }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleQuickAddLocation}
                        disabled={isAddingLoc}
                        style={{
                          background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px",
                          padding: "6px 14px", fontSize: "12px", fontWeight: "600", cursor: "pointer",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {isAddingLoc ? "Saving..." : "Save Location"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label className="form-label" style={{ margin: 0 }}>Route Name (Auto-Generated)</label>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", background: "#e2e8f0", padding: "2px 8px", borderRadius: "4px" }}>
                    <i className="fas fa-lock" style={{ marginRight: "4px", color: "#64748b" }}></i> Read Only
                  </span>
                </div>
                <div className="form-input-wrapper">
                  <i className="fas fa-map-pin form-icon" style={{ color: "#2563eb" }}></i>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Select Pickup & Drop-off locations above..."
                    value={newRoute}
                    readOnly
                    style={{ background: "#f1f5f9", cursor: "not-allowed", fontWeight: "600", color: "#334155" }}
                    required
                  />
                </div>
                <small style={{ color: "#64748b", display: "block", marginTop: "5px" }}>
                  🔒 Auto-generated from selected locations above to prevent typing errors.
                </small>
              </div>

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
                <button type="submit" className="btn-submit" style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", width: "auto" }}>
                  Add Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Pricing Group Modal */}
      {showGroupModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#ffffff", borderRadius: "12px", width: "450px", padding: "30px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>Create New Pricing Group</h3>
              <button onClick={() => setShowGroupModal(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "18px" }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleCreateGroupSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>Group Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Pakistan Promo, Special Agents" 
                  value={newGroupName} 
                  onChange={(e) => setNewGroupName(e.target.value)} 
                  required 
                  style={{ width: "100%", height: "44px", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "0 12px", fontSize: "14px" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowGroupModal(false)} style={{ background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "6px", padding: "10px 16px", fontWeight: "600", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" style={{ background: "#0ea5e9", color: "#ffffff", border: "none", borderRadius: "6px", padding: "10px 16px", fontWeight: "600", cursor: "pointer" }}>
                  Create & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
