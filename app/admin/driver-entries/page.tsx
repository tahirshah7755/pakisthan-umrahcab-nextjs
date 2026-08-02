"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../utils/api";
import { useAuth } from "@/context/AuthContext";
import { exportToExcel } from "@/utils/excelHelper";

export default function AdminDriverEntriesPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Determine permissions
  const getPermission = () => {
    if (!user) return "none";
    if (user.role === "SUPER_ADMIN") return "full";
    const userPerms = (user as any).permissions || {};
    return userPerms["drivers"] || "none";
  };

  const permission = getPermission();
  const canEdit = permission === "edit" || permission === "full";
  const canDelete = permission === "full";

  // Redirect if unauthorized
  useEffect(() => {
    if (user && user.role !== "SUPER_ADMIN") {
      const userPerms = (user as any).permissions || {};
      const access = userPerms["drivers"] || "none";
      if (access === "none") {
        router.push("/admin/hub");
      }
    }
  }, [user, router]);

  // State
  const [entries, setEntries] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [filterDriver, setFilterDriver] = useState("");
  const [filterVehicle, setFilterVehicle] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Toast notifications
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    driver_id: "",
    vehicle_id: "",
    date: new Date().toISOString().split("T")[0],
    trip: "",
    hotel_drop_off: "",
    agent: "",
    rate: 0,
    voucher: 0,
    cash: 0,
    fuel: 0,
    parking: 0,
    wash: 0,
    oil_change: 0,
    car_maintenance: 0,
    waqas_received: 0,
    mic: 0,
  });

  useEffect(() => {
    loadMetadata();
    loadEntries();
  }, []);

  // Reload logs when filters change
  useEffect(() => {
    loadEntries();
  }, [filterDriver, filterVehicle, filterDate]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  };

  const loadMetadata = async () => {
    try {
      const [driverList, fleetData] = await Promise.all([
        api.getDrivers(),
        api.getFleet()
      ]);
      setDrivers(driverList || []);
      
      const fleetList = Array.isArray(fleetData)
        ? fleetData
        : (fleetData && typeof fleetData === "object" && Array.isArray((fleetData as any).data)
            ? (fleetData as any).data
            : []);
      setVehicles(fleetList);
    } catch (err) {
      console.error("Failed to load filter metadata:", err);
    }
  };

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await api.getDriverEntries({
        driver_id: filterDriver || undefined,
        vehicle_id: filterVehicle || undefined,
        date: filterDate || undefined
      });
      setEntries(data || []);
    } catch (err) {
      showToast("Failed to load driver logs.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Formula: (Cash + Waqas Received) - (Fuel + Parking + Wash + Oil + Maint + Mic)
  const calculateTotal = (data: typeof formData) => {
    const earnings = Number(data.cash || 0) + Number(data.waqas_received || 0);
    const expenses = Number(data.fuel || 0) + Number(data.parking || 0) + Number(data.wash || 0) + 
                     Number(data.oil_change || 0) + Number(data.car_maintenance || 0) + Number(data.mic || 0);
    return earnings - expenses;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value
    }));
  };

  const handleDriverSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dId = e.target.value;
    setFormData(prev => ({
      ...prev,
      driver_id: dId,
      // Vehicle assignment is manual because drivers change vehicles frequently
    }));
  };

  const openAddModal = () => {
    setFormData({
      driver_id: "",
      vehicle_id: "",
      date: new Date().toISOString().split("T")[0],
      trip: "",
      hotel_drop_off: "",
      agent: "",
      rate: 0,
      voucher: 0,
      cash: 0,
      fuel: 0,
      parking: 0,
      wash: 0,
      oil_change: 0,
      car_maintenance: 0,
      waqas_received: 0,
      mic: 0,
    });
    setIsAddOpen(true);
  };

  const openEditModal = (entry: any) => {
    setEditingEntry(entry);
    setFormData({
      driver_id: entry.driver_id ? String(entry.driver_id) : "",
      vehicle_id: entry.vehicle_id ? String(entry.vehicle_id) : "",
      date: entry.date ? entry.date.split("T")[0] : "",
      trip: entry.trip || "",
      hotel_drop_off: entry.hotel_drop_off || "",
      agent: entry.agent || "",
      rate: entry.rate || 0,
      voucher: entry.voucher || 0,
      cash: entry.cash || 0,
      fuel: entry.fuel || 0,
      parking: entry.parking || 0,
      wash: entry.wash || 0,
      oil_change: entry.oil_change || 0,
      car_maintenance: entry.car_maintenance || 0,
      waqas_received: entry.waqas_received || 0,
      mic: entry.mic || 0,
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const total = calculateTotal(formData);
      const payload = {
        ...formData,
        driver_id: Number(formData.driver_id),
        vehicle_id: formData.vehicle_id ? Number(formData.vehicle_id) : null,
        total
      };
      const res = await api.createDriverEntry(payload);
      if (res.success) {
        showToast("Daily sheet logged successfully!", "success");
        setIsAddOpen(false);
        loadEntries();
      } else {
        showToast(res.error || "Failed to log daily sheet.", "error");
      }
    } catch (err) {
      showToast("An unexpected error occurred.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;
    setActionLoading(true);
    try {
      const total = calculateTotal(formData);
      const payload = {
        ...formData,
        driver_id: Number(formData.driver_id),
        vehicle_id: formData.vehicle_id ? Number(formData.vehicle_id) : null,
        total
      };
      const res = await api.updateDriverEntry(editingEntry.id, payload);
      if (res.success) {
        showToast("Daily sheet updated successfully!", "success");
        setEditingEntry(null);
        loadEntries();
      } else {
        showToast(res.error || "Failed to update daily sheet.", "error");
      }
    } catch (err) {
      showToast("An unexpected error occurred.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingEntry) return;
    setActionLoading(true);
    try {
      const res = await api.deleteDriverEntry(deletingEntry.id);
      if (res.success) {
        showToast("Daily sheet deleted successfully!", "success");
        setDeletingEntry(null);
        loadEntries();
      } else {
        showToast(res.error || "Failed to delete sheet.", "error");
      }
    } catch (err) {
      showToast("An unexpected error occurred.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleLock = async (id: string | number) => {
    try {
      const res = await api.toggleDriverEntryLock(id);
      if (res.success) {
        showToast(
          res.data.is_locked 
            ? "Sheet has been locked. Driver cannot edit it." 
            : "Sheet has been unlocked for driver edits.", 
          "success"
        );
        loadEntries();
      } else {
        showToast(res.error || "Failed to toggle lock state.", "error");
      }
    } catch (err) {
      showToast("Failed to connect to security clearance gate.", "error");
    }
  };

  const handleCopy = () => {
    if (entries.length === 0) {
      showToast("No data to copy!", "error");
      return;
    }
    const headers = [
      "Date", "Driver", "Vehicle Model", "Vehicle Type", "Trip Description", 
      "Hotel Drop Off", "Agent / Company", "Rate", "Voucher", "Cash Collected", 
      "Fuel", "Parking", "Wash", "Oil Change", "Maintenance", "Waqas Received", "Misc", "Net Total", "Status"
    ];
    const textRows = entries.map((item: any) => {
      const totalCash = Number(item.cash || 0) + Number(item.waqas_received || 0);
      return [
        new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        item.driver?.name || `Driver ID #${item.driver_id}`,
        item.vehicle?.model || "—",
        item.vehicle?.type || "—",
        item.trip || "—",
        item.hotel_drop_off || "—",
        item.agent || "—",
        item.rate || 0,
        item.voucher || 0,
        totalCash,
        item.fuel || 0,
        item.parking || 0,
        item.wash || 0,
        item.oil_change || 0,
        item.car_maintenance || 0,
        item.waqas_received || 0,
        item.mic || 0,
        item.total || 0,
        item.is_locked ? "Locked" : "Open"
      ];
    });
    const text = [headers.join("\t"), ...textRows.map(r => r.join("\t"))].join("\n");
    navigator.clipboard.writeText(text)
      .then(() => showToast("Copied daily logs report to clipboard!", "success"))
      .catch(() => showToast("Failed to copy!", "error"));
  };

  const handleExportCSV = () => {
    if (entries.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = [
      "Date", "Driver", "Vehicle Model", "Vehicle Type", "Trip Description", 
      "Hotel Drop Off", "Agent / Company", "Rate", "Voucher", "Cash Collected", 
      "Fuel", "Parking", "Wash", "Oil Change", "Maintenance", "Waqas Received", "Misc", "Net Total", "Status"
    ];
    const csvContent = [
      headers.join(","),
      ...entries.map((item: any) => [
        `"${new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}"`,
        `"${(item.driver?.name || `Driver ID #${item.driver_id}`).replace(/"/g, '""')}"`,
        `"${(item.vehicle?.model || "—").replace(/"/g, '""')}"`,
        `"${(item.vehicle?.type || "—").replace(/"/g, '""')}"`,
        `"${(item.trip || "—").replace(/"/g, '""')}"`,
        `"${(item.hotel_drop_off || "—").replace(/"/g, '""')}"`,
        `"${(item.agent || "—").replace(/"/g, '""')}"`,
        item.rate || 0,
        item.voucher || 0,
        Number(item.cash || 0) + Number(item.waqas_received || 0),
        item.fuel || 0,
        item.parking || 0,
        item.wash || 0,
        item.oil_change || 0,
        item.car_maintenance || 0,
        item.waqas_received || 0,
        item.mic || 0,
        item.total || 0,
        item.is_locked ? "Locked" : "Open"
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `driver_logs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV file downloaded successfully!", "success");
  };

  const handleExportExcel = () => {
    if (entries.length === 0) {
      showToast("No data to export!", "error");
      return;
    }
    const headers = [
      "Date", "Driver", "Vehicle Model", "Vehicle Type", "Trip Description", 
      "Hotel Drop Off", "Agent / Company", "Rate", "Voucher", "Cash Collected", 
      "Fuel", "Parking", "Wash", "Oil Change", "Maintenance", "Waqas Received", "Misc", "Net Total", "Status"
    ];
    const textRows = entries.map((item: any) => [
      new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      item.driver?.name || `Driver ID #${item.driver_id}`,
      item.vehicle?.model || "—",
      item.vehicle?.type || "—",
      item.trip || "—",
      item.hotel_drop_off || "—",
      item.agent || "—",
      item.rate || 0,
      item.voucher || 0,
      Number(item.cash || 0) + Number(item.waqas_received || 0),
      item.fuel || 0,
      item.parking || 0,
      item.wash || 0,
      item.oil_change || 0,
      item.car_maintenance || 0,
      item.waqas_received || 0,
      item.mic || 0,
      item.total || 0,
      item.is_locked ? "Locked" : "Open"
    ]);
    
    exportToExcel({
      title: "Driver Sheets & Logs Report",
      headers,
      rows: textRows,
      filename: `driver_logs_${new Date().toISOString().split("T")[0]}.xls`,
      totalsIndices: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
      statusIndex: 18
    });
  };

  const handlePrint = (title: string = "Driver Sheets & Logs Report") => {
    if (entries.length === 0) {
      showToast("No data to print!", "error");
      return;
    }
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocked! Please allow pop-ups to print.", "error");
      return;
    }

    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    
    const rowsHtml = entries.map((item: any) => {
      const totalCash = Number(item.cash || 0) + Number(item.waqas_received || 0);
      const expenses = Number(item.fuel || 0) + Number(item.parking || 0) + Number(item.wash || 0) + 
                       Number(item.oil_change || 0) + Number(item.car_maintenance || 0) + Number(item.mic || 0);
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
            ${new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1e5cff;">
            ${item.driver?.name || `Driver ID #${item.driver_id}`}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
            ${item.vehicle ? `${item.vehicle.model} (${item.vehicle.type})` : "—"}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${item.trip || "—"}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${item.agent || "—"}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${Number(item.rate || 0).toFixed(0)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${Number(item.voucher || 0).toFixed(0)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${totalCash.toFixed(0)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #ef4444;">${expenses.toFixed(0)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: ${Number(item.total || 0) >= 0 ? "#10b981" : "#ef4444"};">
            ${Number(item.total || 0).toFixed(0)}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">
            ${item.is_locked ? "Locked" : "Open"}
          </td>
        </tr>
      `;
    }).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>\${title}</title>
          <style>
            body { font-family: sans-serif; margin: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #312e81; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #312e81; font-size: 24px; }
            .header p { margin: 5px 0 0 0; color: #64748b; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background-color: #f8fafc; padding: 10px 8px; border-bottom: 2px solid #e2e8f0; text-align: left; text-transform: uppercase; color: #475569; font-weight: 700; }
            @media print {
              body { margin: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>\${title}</h1>
              <p>Umrah Cab Driver Sheets & Logs Registry</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Generated Date:</strong> \${today}</p>
              <p><strong>Total Logs:</strong> \${entries.length}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Driver</th>
                <th>Vehicle</th>
                <th>Trip Route</th>
                <th>Agent/B2B</th>
                <th style="text-align: right;">Rate</th>
                <th style="text-align: right;">Voucher</th>
                <th style="text-align: right;">Cash</th>
                <th style="text-align: right;">Expenses</th>
                <th style="text-align: right;">Net Total</th>
                <th style="text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              \${rowsHtml}
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

  // Stats summaries
  const totalCashCollected = entries.reduce((sum, item) => sum + Number(item.cash || 0) + Number(item.waqas_received || 0), 0);
  const totalExpenses = entries.reduce((sum, item) => 
    sum + Number(item.fuel || 0) + Number(item.parking || 0) + Number(item.wash || 0) + 
          Number(item.oil_change || 0) + Number(item.car_maintenance || 0) + Number(item.mic || 0)
  , 0);
  const totalNetBalance = entries.reduce((sum, item) => sum + Number(item.total || 0), 0);

  return (
    <div className="entries-page-container">
      {/* Premium Embedded Styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .entries-page-container {
          padding: 30px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          font-family: 'Inter', sans-serif;
          background-color: #f8fafc;
          min-height: calc(100vh - 70px);
        }
        
        /* Gradient Header Banner */
        .entries-header-banner {
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
          padding: 30px 40px;
          border-radius: 20px;
          color: #ffffff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 10px 25px -5px rgba(30, 27, 75, 0.15);
          flex-wrap: wrap;
          gap: 20px;
        }
        .entries-header-info h1 {
          font-size: 28px;
          font-weight: 800;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }
        .entries-header-info p {
          margin: 0;
          color: #c7d2fe;
          font-size: 14px;
          font-weight: 500;
        }
        .btn-header-back {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 10px 18px;
          border-radius: 10px;
          color: #ffffff;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-header-back:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        /* Stats Summary Panel Grid */
        .stats-panel-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
        }
        @media(max-width: 768px) {
          .stats-panel-grid {
            grid-template-columns: 1fr;
          }
        }
        .stat-summary-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 24px;
          border-radius: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.01);
        }
        .stat-card-left span {
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stat-card-left h2 {
          margin: 8px 0 0 0;
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
        }
        .stat-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
        .stat-icon-cash { background-color: #ecfdf5; color: #059669; }
        .stat-icon-expense { background-color: #fffbeb; color: #d97706; }
        .stat-icon-net { background-color: #eef2ff; color: #4f46e5; }
        .stat-net-negative h2 { color: #ef4444; }

        /* Filter Row Bar */
        .filters-row-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .filters-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .filter-select {
          padding: 8px 12px;
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 13px;
          color: #334155;
          outline: none;
          min-width: 160px;
        }
        .filter-date-input {
          padding: 8px 12px;
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 13px;
          color: #334155;
          outline: none;
          width: 140px;
        }
        .btn-clear-filters {
          padding: 8px 12px;
          background-color: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-clear-filters:hover {
          background-color: #cbd5e1;
          color: #0f172a;
        }
        .btn-log-manual {
          background-color: #4f46e5;
          border: none;
          padding: 11px 20px;
          border-radius: 12px;
          color: #ffffff;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(79,70,229,0.15);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .btn-log-manual:hover {
          background-color: #4338ca;
          transform: translateY(-1px);
        }

        /* Logs Table */
        .logs-table-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
          overflow: hidden;
        }
        .logs-table-responsive {
          overflow-x: auto;
          width: 100%;
        }
        .logs-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .logs-table th {
          background-color: #f8fafc;
          padding: 18px 24px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          border-bottom: 1px solid #e2e8f0;
        }
        .logs-table td {
          padding: 18px 24px;
          font-size: 14px;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .logs-table tr:last-child td {
          border-bottom: none;
        }
        .logs-table tr:hover td {
          background-color: #f8fafc;
        }

        /* Log Date Driver stack */
        .log-meta-stack {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .log-date {
          font-weight: 800;
          color: #0f172a;
          font-size: 14px;
        }
        .log-driver-name {
          font-size: 12px;
          color: #64748b;
          font-weight: 550;
        }

        /* Vehicle display */
        .log-vehicle-stack {
          display: flex;
          flex-direction: column;
        }
        .log-vehicle-model {
          font-weight: 700;
          color: #334155;
        }
        .log-vehicle-type {
          font-size: 11px;
          color: #94a3b8;
        }

        /* Lock state button */
        .btn-lock-toggle {
          border: 1px solid transparent;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .lock-locked {
          background-color: #0f172a;
          color: #ffffff;
          border-color: #0f172a;
        }
        .lock-locked:hover {
          background-color: #1e293b;
        }
        .lock-unlocked {
          background-color: #ecfdf5;
          color: #047857;
          border-color: #a7f3d0;
        }
        .lock-unlocked:hover {
          background-color: #d1fae5;
        }

        /* Action Buttons */
        .actions-btn-group {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
        .btn-action {
          width: 34px;
          height: 34px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
        }
        .btn-action-edit:hover {
          color: #4f46e5;
          background-color: #f5f3ff;
          border-color: #ddd6fe;
        }
        .btn-action-delete:hover {
          color: #ef4444;
          background-color: #fef2f2;
          border-color: #fee2e2;
        }

        /* Modal window */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-window {
          background: #ffffff;
          width: 100%;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          overflow: hidden;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          animation: modalEnter 0.2s ease-out;
        }
        @keyframes modalEnter {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-window-small {
          max-width: 450px;
        }
        .modal-window-large {
          max-width: 700px;
        }
        .modal-header {
          padding: 20px 30px;
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.3px;
        }
        .btn-modal-close {
          background: none;
          border: none;
          width: 30px;
          height: 30px;
          border-radius: 6px;
          cursor: pointer;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }
        .btn-modal-close:hover {
          background-color: #e2e8f0;
          color: #475569;
        }
        .modal-body {
          padding: 30px;
          overflow-y: auto;
          flex-grow: 1;
        }
        .modal-footer {
          padding: 20px 30px;
          background-color: #f8fafc;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        /* Form styling */
        .form-row-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .input-control {
          width: 100%;
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          padding: 9px 12px;
          border-radius: 10px;
          font-size: 13px;
          color: #0f172a;
          transition: border-color 0.2s, background-color 0.2s;
          outline: none;
        }
        .input-control:focus {
          border-color: #6366f1;
          background-color: #ffffff;
        }
        
        /* Section dividers */
        .form-section-title {
          margin: 20px 0 12px 0;
          padding-bottom: 6px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #94a3b8;
        }
        
        /* High-tech Calculator Bar */
        .calculator-banner-card {
          background-color: #0f172a;
          color: #ffffff;
          border-radius: 14px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
          margin-top: 24px;
        }
        .calc-left h5 {
          margin: 0 0 2px 0;
          font-size: 11px;
          font-weight: 700;
          color: #c7d2fe;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .calc-left p {
          margin: 0;
          font-size: 10px;
          color: #64748b;
        }
        .calc-net-value {
          font-size: 20px;
          font-weight: 900;
        }
        .calc-positive { color: #34d399; }
        .calc-negative { color: #f87171; }

        /* Generic modal buttons */
        .btn-modal-cancel {
          background-color: #ffffff;
          border: 1px solid #cbd5e1;
          padding: 10px 18px;
          border-radius: 10px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          font-size: 13px;
        }
        .btn-modal-cancel:hover {
          background-color: #f8fafc;
        }
        .btn-modal-submit {
          background-color: #4f46e5;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 700;
          color: #ffffff;
          cursor: pointer;
          font-size: 13px;
          box-shadow: 0 2px 6px rgba(79,70,229,0.2);
        }
        .btn-modal-submit:hover {
          background-color: #4338ca;
        }
        .btn-modal-delete {
          background-color: #ef4444;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 700;
          color: #ffffff;
          cursor: pointer;
          font-size: 13px;
          box-shadow: 0 2px 6px rgba(239,68,68,0.2);
        }
        .btn-modal-delete:hover {
          background-color: #dc2626;
        }

        /* Spinner */
        .modal-spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid #ffffff;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Delete Confirmation Layout */
        .delete-dialog-content {
          text-align: center;
          padding: 10px 0;
        }
        .delete-warning-icon {
          width: 60px;
          height: 60px;
          background-color: #fee2e2;
          color: #ef4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          margin: 0 auto 16px auto;
        }
        .delete-dialog-content h3 {
          margin: 0 0 10px 0;
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
        }
        .delete-dialog-content p {
          margin: 0;
          font-size: 14px;
          color: #64748b;
          line-height: 1.5;
        }

        /* Toast Popup notification */
        .toast-notify {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 99999;
          padding: 14px 24px;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
          color: #ffffff;
          font-weight: 600;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 10px;
          animation: toastEnter 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .toast-success { background-color: #10b981; }
        .toast-error { background-color: #ef4444; }
        @keyframes toastEnter {
          from { transform: translateY(-15px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />

      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notify ${toast.type === "success" ? "toast-success" : "toast-error"}`}>
          <i className={toast.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header Banner */}
      <div className="entries-header-banner">
        <div className="entries-header-info">
          <h1>Driver Sheets & Daily Logs</h1>
          <p>Master auditing desk for driver sheets, cash balances, fuel expenses, and admin-override lock gates.</p>
        </div>
        <button onClick={() => router.push("/admin/hub")} className="btn-header-back">
          <i className="fas fa-arrow-left"></i>
          Back to Hub
        </button>
      </div>

      {/* Stats Summary Panel */}
      <div className="stats-panel-grid">
        <div className="stat-summary-card">
          <div className="stat-card-left">
            <span>Accumulated Cash Received</span>
            <h2>{totalCashCollected.toLocaleString()} SAR</h2>
          </div>
          <div className="stat-icon-wrapper stat-icon-cash">
            <i className="fas fa-money-bill-wave"></i>
          </div>
        </div>

        <div className="stat-summary-card">
          <div className="stat-card-left">
            <span>Total Route Expenses</span>
            <h2>{totalExpenses.toLocaleString()} SAR</h2>
          </div>
          <div className="stat-icon-wrapper stat-icon-expense">
            <i className="fas fa-gas-pump"></i>
          </div>
        </div>

        <div className={`stat-summary-card ${totalNetBalance < 0 ? "stat-net-negative" : ""}`}>
          <div className="stat-card-left">
            <span>Net Accountable Balance</span>
            <h2>{totalNetBalance.toLocaleString()} SAR</h2>
          </div>
          <div className="stat-icon-wrapper stat-icon-net">
            <i className="fas fa-coins"></i>
          </div>
        </div>
      </div>

      {/* Filters and Actions Bar */}
      <div className="filters-row-card">
        <div className="filters-group">
          {/* Driver filter */}
          <select
            value={filterDriver}
            onChange={e => setFilterDriver(e.target.value)}
            className="filter-select"
          >
            <option value="">All Drivers</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.name} (@{d.username})</option>
            ))}
          </select>

          {/* Vehicle filter */}
          <select
            value={filterVehicle}
            onChange={e => setFilterVehicle(e.target.value)}
            className="filter-select"
          >
            <option value="">All Vehicles</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.model} ({v.type})</option>
            ))}
          </select>

          {/* Date filter */}
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="filter-date-input"
          />

          {/* Reset filter button */}
          {(filterDriver || filterVehicle || filterDate) && (
            <button
              onClick={() => { setFilterDriver(""); setFilterVehicle(""); setFilterDate(""); }}
              className="btn-clear-filters"
            >
              <i className="fas fa-times"></i>
              Clear Filters
            </button>
          )}
        </div>

        {canEdit && (
          <button onClick={openAddModal} className="btn-log-manual">
            <i className="fas fa-plus"></i>
            Log Manual Sheet
          </button>
        )}
      </div>

      {/* Log History Table Card */}
      <div className="logs-table-card">
        {/* Export Toolbar */}
        {!loading && entries.length > 0 && (
          <div style={{ display: "flex", gap: "10px", padding: "16px 24px", borderBottom: "1px solid #f1f5f9", backgroundColor: "#ffffff", flexWrap: "wrap" }}>
            <button onClick={handleCopy} style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}>
              <i className="fas fa-copy"></i> Copy
            </button>
            <button onClick={handleExportCSV} style={{ background: "#64748b", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}>
              <i className="fas fa-file-csv"></i> CSV
            </button>
            <button onClick={handleExportExcel} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}>
              <i className="fas fa-file-excel"></i> Excel
            </button>
            <button onClick={() => handlePrint("Driver Logs PDF Report")} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}>
              <i className="fas fa-file-pdf"></i> PDF
            </button>
            <button onClick={() => handlePrint("Driver Sheets & Logs Report")} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}>
              <i className="fas fa-print"></i> Print
            </button>
          </div>
        )}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px 0" }}>
            <div style={{ width: "40px", height: "40px", border: "4px solid #4f46e5", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite", marginBottom: "16px" }} />
            <span style={{ color: "#64748b", fontSize: "14px", fontWeight: "500" }}>Auditing driver journals...</span>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <i className="fas fa-file-invoice-dollar" style={{ fontSize: "40px", color: "#cbd5e1", marginBottom: "12px" }}></i>
            <h3 style={{ margin: "0 0 6px 0", color: "#475569", fontSize: "16px", fontWeight: "700" }}>No daily sheets found</h3>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
              There are no daily trip and expense records matching the selected filters.
            </p>
          </div>
        ) : (
          <div className="logs-table-responsive">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Date & Driver</th>
                  <th>Assigned Vehicle</th>
                  <th>Trip & Agent</th>
                  <th style={{ textAlign: "right" }}>Cash Received</th>
                  <th style={{ textAlign: "right" }}>Route Expenses</th>
                  <th style={{ textAlign: "right" }}>Net Sheet Total</th>
                  <th style={{ textAlign: "center" }}>Security Lock</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((item) => {
                  const expenses = Number(item.fuel || 0) + Number(item.parking || 0) + Number(item.wash || 0) + 
                                   Number(item.oil_change || 0) + Number(item.car_maintenance || 0) + Number(item.mic || 0);
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="log-meta-stack">
                          <span className="log-date">
                            {new Date(item.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <span className="log-driver-name">
                            {item.driver?.name || `Driver ID #${item.driver_id}`}
                          </span>
                        </div>
                      </td>
                      <td>
                        {item.vehicle ? (
                          <div className="log-vehicle-stack">
                            <span className="log-vehicle-model">{item.vehicle.model}</span>
                            <span className="log-vehicle-type">{item.vehicle.type}</span>
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "13px" }}>No vehicle mapped</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: "600", color: "#334155", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.trip}>
                          {item.trip || "—"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#94a3b8", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.agent}>
                          {item.agent || "—"}
                        </div>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: "700", color: "#0f172a" }}>
                        <div>{(Number(item.cash || 0) + Number(item.waqas_received || 0)).toLocaleString()} SAR</div>
                        {Number(item.waqas_received || 0) > 0 && (
                          <div style={{ fontSize: "10px", color: "#059669", fontWeight: "600" }}>
                            ({Number(item.cash || 0)} + {Number(item.waqas_received || 0)} Waqas)
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: "500", color: "#64748b" }}>
                        {expenses.toLocaleString()} SAR
                      </td>
                      <td style={{ textAlign: "right", fontWeight: "800", color: Number(item.total || 0) >= 0 ? "#059669" : "#ef4444" }}>
                        {Number(item.total || 0).toLocaleString()} SAR
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() => handleToggleLock(item.id)}
                          className={`btn-lock-toggle ${item.is_locked ? "lock-locked" : "lock-unlocked"}`}
                          title={item.is_locked ? "Click to Unlock Sheet for Driver Edits" : "Click to Lock Sheet (Restricts Driver Edits)"}
                          disabled={!canEdit}
                          style={{ opacity: canEdit ? 1 : 0.6, cursor: canEdit ? "pointer" : "not-allowed" }}
                        >
                          <i className={item.is_locked ? "fas fa-lock" : "fas fa-unlock"}></i>
                          {item.is_locked ? "Locked" : "Open Gate"}
                        </button>
                      </td>
                      <td>
                        <div className="actions-btn-group">
                          {canEdit && (
                            <button
                              onClick={() => openEditModal(item)}
                              className="btn-action btn-action-edit"
                              title="Edit Log Journal"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setDeletingEntry(item)}
                              className="btn-action btn-action-delete"
                              title="Delete Daily Record"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Sheet Modal */}
      {(isAddOpen || editingEntry) && (
        <div className="modal-overlay">
          <div className="modal-window modal-window-large">
            
            {/* Modal Header */}
            <div className="modal-header">
              <h3>{isAddOpen ? "Log Driver Daily Sheet" : "Modify Log Journal Details"}</h3>
              <button 
                onClick={() => { setIsAddOpen(false); setEditingEntry(null); }}
                className="btn-modal-close"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={isAddOpen ? handleCreate : handleUpdate}>
              <div className="modal-body">
                
                {/* Meta details */}
                <div className="form-row-3">
                  <div className="form-group">
                    <label>Driver</label>
                    <select
                      name="driver_id"
                      required
                      value={formData.driver_id}
                      onChange={handleDriverSelect}
                      disabled={!isAddOpen}
                      className="input-control"
                      style={{ height: "38px" }}
                    >
                      <option value="">Select Driver</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name} (@{d.username})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Vehicle</label>
                    <select
                      name="vehicle_id"
                      value={formData.vehicle_id}
                      onChange={handleInputChange}
                      className="input-control"
                      style={{ height: "38px" }}
                    >
                      <option value="">Select Vehicle (Optional)</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.model} ({v.type})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      required
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="input-control"
                    />
                  </div>
                </div>

                {/* Trip and Agent details */}
                <div className="form-row-3">
                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label>Trip description</label>
                    <input
                      type="text"
                      name="trip"
                      value={formData.trip}
                      onChange={handleInputChange}
                      placeholder="e.g. Makkah Hotel to Madinah"
                      className="input-control"
                    />
                  </div>

                  <div className="form-group">
                    <label>Agent / B2B Company</label>
                    <input
                      type="text"
                      name="agent"
                      value={formData.agent}
                      onChange={handleInputChange}
                      placeholder="e.g. Al-Fajr"
                      className="input-control"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Hotel Drop Off</label>
                  <input
                    type="text"
                    name="hotel_drop_off"
                    value={formData.hotel_drop_off}
                    onChange={handleInputChange}
                    placeholder="e.g. Hilton Suites Makkah"
                    className="input-control"
                  />
                </div>

                {/* Cash & Earnings */}
                <div className="form-section-title">Earnings & Collection (SAR)</div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label>Trip Rate</label>
                    <input
                      type="number"
                      name="rate"
                      min="0"
                      value={formData.rate || ""}
                      onChange={handleInputChange}
                      className="input-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Voucher Value</label>
                    <input
                      type="number"
                      name="voucher"
                      min="0"
                      value={formData.voucher || ""}
                      onChange={handleInputChange}
                      className="input-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Cash Collected</label>
                    <input
                      type="number"
                      name="cash"
                      min="0"
                      value={formData.cash || ""}
                      onChange={handleInputChange}
                      className="input-control"
                    />
                  </div>
                </div>

                <div className="form-row-3" style={{ marginTop: "12px" }}>
                  <div className="form-group">
                    <label>Received From Waqas</label>
                    <input
                      type="number"
                      name="waqas_received"
                      min="0"
                      value={formData.waqas_received || ""}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="input-control"
                    />
                  </div>
                </div>

                {/* Expenses */}
                <div className="form-section-title">Petrol & Route Expenses (SAR)</div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label>Fuel / Petrol</label>
                    <input
                      type="number"
                      name="fuel"
                      min="0"
                      value={formData.fuel || ""}
                      onChange={handleInputChange}
                      className="input-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Parking</label>
                    <input
                      type="number"
                      name="parking"
                      min="0"
                      value={formData.parking || ""}
                      onChange={handleInputChange}
                      className="input-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Car Wash</label>
                    <input
                      type="number"
                      name="wash"
                      min="0"
                      value={formData.wash || ""}
                      onChange={handleInputChange}
                      className="input-control"
                    />
                  </div>
                </div>

                <div className="form-row-3">
                  <div className="form-group">
                    <label>Oil Change</label>
                    <input
                      type="number"
                      name="oil_change"
                      min="0"
                      value={formData.oil_change || ""}
                      onChange={handleInputChange}
                      className="input-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Maintenance</label>
                    <input
                      type="number"
                      name="car_maintenance"
                      min="0"
                      value={formData.car_maintenance || ""}
                      onChange={handleInputChange}
                      className="input-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Miscellaneous</label>
                    <input
                      type="number"
                      name="mic"
                      min="0"
                      value={formData.mic || ""}
                      onChange={handleInputChange}
                      className="input-control"
                    />
                  </div>
                </div>

                {/* Net Balance Calculator Card */}
                <div className="calculator-banner-card">
                  <div className="calc-left">
                    <h5>Recalculated Net Balance</h5>
                    <p>Calculated as: (Rate + Voucher + Cash) - (All Expenses)</p>
                  </div>
                  <div className={`calc-net-value ${calculateTotal(formData) >= 0 ? "calc-positive" : "calc-negative"}`}>
                    {calculateTotal(formData).toFixed(2)} SAR
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setEditingEntry(null); }}
                  className="btn-modal-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-modal-submit"
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {actionLoading && <div className="modal-spinner"></div>}
                  <span>{isAddOpen ? "Log Daily Sheet" : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEntry && (
        <div className="modal-overlay">
          <div className="modal-window modal-window-small">
            <div className="modal-body" style={{ padding: "30px 20px" }}>
              <div className="delete-dialog-content">
                <div className="delete-warning-icon">
                  <i className="fas fa-trash-alt"></i>
                </div>
                <h3>Delete Daily Sheet</h3>
                <p>
                  Are you sure you want to delete the daily sheet record for <strong>{deletingEntry.driver?.name}</strong> dated <strong>{new Date(deletingEntry.date).toLocaleDateString()}</strong>? 
                  This action is irreversible.
                </p>
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: "center" }}>
              <button
                onClick={() => setDeletingEntry(null)}
                className="btn-modal-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="btn-modal-delete"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {actionLoading && <div className="modal-spinner"></div>}
                <span>Delete Record</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
