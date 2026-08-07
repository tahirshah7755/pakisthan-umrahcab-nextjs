"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../utils/api";
import { useRouter } from "next/navigation";
import { exportToExcel, exportToCSV, exportToPDF } from "../../../utils/exportHelper";

const STANDARD_TRIPS = [
  "Jeddah Airport to Makkah Hotel",
  "Makkah Hotel to Jeddah Airport",
  "Makkah Hotel to Madinah Hotel",
  "Madinah Hotel to Makkah Hotel",
  "Jeddah Airport to Madinah Hotel",
  "Madinah Hotel to Jeddah Airport",
  "Makkah Local Ziyarah",
  "Madinah Local Ziyarah",
  "Madinah Airport to Madinah Hotel",
  "Madinah Hotel to Madinah Airport",
  "Jeddah Hotel to Makkah Hotel",
  "Makkah Hotel to Jeddah Hotel",
];

export default function DriverDashboardPage() {
  const { driverUser, driverLogout } = useAuth();
  const router = useRouter();

  // State
  const [entries, setEntries] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // UI Helper States for Custom Inputs
  const [customTripActive, setCustomTripActive] = useState(false);
  const [customAgentActive, setCustomAgentActive] = useState(false);
  const [customVehicleActive, setCustomVehicleActive] = useState(false);

  // Entry Form State
  const [formData, setFormData] = useState({
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
    pay_to_waqas: 0,
    mic: 0,
    vehicle_id: "",
    manual_vehicle: "",
  });

  // Helpers to hold the select dropdown state separately
  const [selectedTripOpt, setSelectedTripOpt] = useState("");
  const [selectedAgentOpt, setSelectedAgentOpt] = useState("");

  // Edit Modal State
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editCustomTripActive, setEditCustomTripActive] = useState(false);
  const [editCustomAgentActive, setEditCustomAgentActive] = useState(false);
  const [editCustomVehicleActive, setEditCustomVehicleActive] = useState(false);
  const [editSelectedTripOpt, setEditSelectedTripOpt] = useState("");
  const [editSelectedAgentOpt, setEditSelectedAgentOpt] = useState("");

  // Load data on mount
  useEffect(() => {
    if (!driverUser) {
      router.push("/driver/login");
      return;
    }
    loadEntries();
    loadCompanies();
    loadVehicles();
  }, [driverUser]);

  useEffect(() => {
    if (driverUser?.vehicle_id) {
      setFormData(prev => ({ ...prev, vehicle_id: String(driverUser.vehicle_id), manual_vehicle: "" }));
    }
  }, [driverUser]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await api.getMyDriverEntries();
      setEntries(data || []);
    } catch (err) {
      console.error("Failed to load driver entries:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const data = await api.getCompanies();
      setCompanies(data || []);
    } catch (err) {
      console.error("Failed to load companies:", err);
    }
  };

  const loadVehicles = async () => {
    try {
      const data = await api.getFleet();
      setVehicles(data || []);
    } catch (err) {
      console.error("Failed to load fleet vehicles:", err);
    }
  };

  // Formula: (Cash + Waqas Received) - (Fuel + Parking + Wash + Oil + Maint + Mic)
  // Formula: (Cash + Received from Waqas) - (Fuel + Parking + Wash + Oil + Maint + Pay to Waqas + Mic)
  const calculateTotal = (data: typeof formData) => {
    const earnings = Number(data.cash || 0) + Number(data.waqas_received || 0);
    const expenses = Number(data.fuel || 0) + Number(data.parking || 0) + Number(data.wash || 0) + 
                     Number(data.oil_change || 0) + Number(data.car_maintenance || 0) + 
                     Number(data.pay_to_waqas || 0) + Number(data.mic || 0);
    return earnings - expenses;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setEditFormData((prev: any) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value
    }));
  };

  // Trip Dropdown Change Handler
  const handleTripDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedTripOpt(val);
    if (val === "CUSTOM") {
      setCustomTripActive(true);
      setFormData(prev => ({ ...prev, trip: "" }));
    } else {
      setCustomTripActive(false);
      setFormData(prev => ({ ...prev, trip: val }));
    }
  };

  // Agent Dropdown Change Handler
  const handleAgentDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedAgentOpt(val);
    if (val === "CUSTOM") {
      setCustomAgentActive(true);
      setFormData(prev => ({ ...prev, agent: "" }));
    } else {
      setCustomAgentActive(false);
      setFormData(prev => ({ ...prev, agent: val }));
    }
  };

  // Edit Modal Trip Dropdown Change Handler
  const handleEditTripDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setEditSelectedTripOpt(val);
    if (val === "CUSTOM") {
      setEditCustomTripActive(true);
      setEditFormData((prev: any) => ({ ...prev, trip: "" }));
    } else {
      setEditCustomTripActive(false);
      setEditFormData((prev: any) => ({ ...prev, trip: val }));
    }
  };

  // Edit Modal Agent Dropdown Change Handler
  const handleEditAgentDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setEditSelectedAgentOpt(val);
    if (val === "CUSTOM") {
      setEditCustomAgentActive(true);
      setEditFormData((prev: any) => ({ ...prev, agent: "" }));
    } else {
      setEditCustomAgentActive(false);
      setEditFormData((prev: any) => ({ ...prev, agent: val }));
    }
  };

  // Vehicle Dropdown Change Handler
  const handleVehicleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "CUSTOM") {
      setCustomVehicleActive(true);
      setFormData(prev => ({ ...prev, vehicle_id: "", manual_vehicle: "" }));
    } else {
      setCustomVehicleActive(false);
      setFormData(prev => ({ ...prev, vehicle_id: val, manual_vehicle: "" }));
    }
  };

  // Edit Modal Vehicle Dropdown Change Handler
  const handleEditVehicleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "CUSTOM") {
      setEditCustomVehicleActive(true);
      setEditFormData((prev: any) => ({ ...prev, vehicle_id: "", manual_vehicle: "" }));
    } else {
      setEditCustomVehicleActive(false);
      setEditFormData((prev: any) => ({ ...prev, vehicle_id: val, manual_vehicle: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const total = calculateTotal(formData);
    const payload = {
      ...formData,
      total,
      vehicle_id: formData.vehicle_id ? Number(formData.vehicle_id) : null
    };

    try {
      const res = await api.submitDriverEntry(payload);
      if (res.success) {
        setSuccessMessage("Daily sheet submitted successfully! It is now locked.");
        // Reset form except date
        setFormData({
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
          pay_to_waqas: 0,
          mic: 0,
          vehicle_id: driverUser?.vehicle_id ? String(driverUser.vehicle_id) : "",
          manual_vehicle: "",
        });
        setSelectedTripOpt("");
        setSelectedAgentOpt("");
        setCustomTripActive(false);
        setCustomAgentActive(false);
        setCustomVehicleActive(false);
        // Reload history
        loadEntries();
      } else {
        setErrorMessage(res.error || "Failed to submit daily sheet.");
      }
    } catch (err) {
      setErrorMessage("An error occurred during submission.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const openEditModal = (entry: any) => {
    setEditingEntry(entry);
    
    // Set matching options for dropdowns
    const isStandardTrip = STANDARD_TRIPS.includes(entry.trip);
    const isStandardAgent = companies.some(c => c.name === entry.agent) || entry.agent === "Individual / Cash";
    const isCustomVehicle = !entry.vehicle_id && entry.manual_vehicle;

    setEditSelectedTripOpt(entry.trip ? (isStandardTrip ? entry.trip : "CUSTOM") : "");
    setEditCustomTripActive(entry.trip ? !isStandardTrip : false);

    setEditSelectedAgentOpt(entry.agent ? (isStandardAgent ? entry.agent : "CUSTOM") : "");
    setEditCustomAgentActive(entry.agent ? !isStandardAgent : false);
    
    setEditCustomVehicleActive(!!isCustomVehicle);

    setEditFormData({
      date: entry.date.split("T")[0],
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
      pay_to_waqas: entry.pay_to_waqas || 0,
      mic: entry.mic || 0,
      vehicle_id: entry.vehicle_id ? String(entry.vehicle_id) : "",
      manual_vehicle: entry.manual_vehicle || "",
    });
  };

  const closeEditModal = () => {
    setEditingEntry(null);
    setEditFormData(null);
    setEditCustomVehicleActive(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    setEditLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const total = calculateTotal(editFormData);
    const payload = {
      ...editFormData,
      total,
      vehicle_id: editFormData.vehicle_id ? Number(editFormData.vehicle_id) : null
    };

    try {
      const res = await api.updateMyDriverEntry(editingEntry.id, payload);
      if (res.success) {
        setSuccessMessage("Entry updated successfully!");
        closeEditModal();
        loadEntries();
      } else {
        setErrorMessage(res.error || "Failed to update entry. It might be locked.");
      }
    } catch (err) {
      setErrorMessage("An error occurred while updating.");
    } finally {
      setEditLoading(false);
    }
  };

  const showNotification = (msg: string, type: "success" | "error") => {
    if (type === "success") {
      setSuccessMessage(msg);
      setErrorMessage("");
      setTimeout(() => setSuccessMessage(""), 4000);
    } else {
      setErrorMessage(msg);
      setSuccessMessage("");
      setTimeout(() => setErrorMessage(""), 4000);
    }
  };

  const handleCopy = () => {
    if (entries.length === 0) {
      showNotification("No data to copy!", "error");
      return;
    }
    const headers = [
      "Date", "Vehicle Assignment", "Trip Description", "Hotel Drop Off", "Agent / Company", 
      "Rate", "Voucher", "Cash Collected", "Received From Waqas",
      "Fuel / Petrol", "Parking", "Wash", "Oil Change", "Maintenance", "Pay to Waqas", "Miscellaneous",
      "Total Expenses", "Net Total", "Status"
    ];
    const textRows = entries.map((item: any) => {
      const vehicleName = item.vehicle ? `${item.vehicle.model}${item.vehicle.type ? ` (${item.vehicle.type})` : ''}` : (item.manual_vehicle || "—");
      const cash = Number(item.cash || 0);
      const waqasRec = Number(item.waqas_received || 0);
      const waqasPay = Number(item.pay_to_waqas || 0);
      const fuel = Number(item.fuel || 0);
      const parking = Number(item.parking || 0);
      const wash = Number(item.wash || 0);
      const oil = Number(item.oil_change || 0);
      const maint = Number(item.car_maintenance || 0);
      const mic = Number(item.mic || 0);
      const expenses = fuel + parking + wash + oil + maint + waqasPay + mic;
      const isLocked = item.is_locked && !driverUser?.edit_rights;
      return [
        new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        vehicleName,
        item.trip || "—",
        item.hotel_drop_off || "—",
        item.agent || "—",
        item.rate || 0,
        item.voucher || 0,
        cash,
        waqasRec,
        fuel,
        parking,
        wash,
        oil,
        maint,
        waqasPay,
        mic,
        expenses,
        item.total || 0,
        isLocked ? "Locked" : "Editable"
      ];
    });
    const text = [headers.join("\t"), ...textRows.map(r => r.join("\t"))].join("\n");
    navigator.clipboard.writeText(text)
      .then(() => showNotification("Copied daily logs to clipboard!", "success"))
      .catch(() => showNotification("Failed to copy!", "error"));
  };

  const buildDriverExportData = () => {
    const headers = [
      "Date", "Vehicle Assignment", "Trip Description", "Hotel Drop Off", "Agent / Company", 
      "Rate", "Voucher", "Cash Collected", "Received From Waqas",
      "Fuel / Petrol", "Parking", "Wash", "Oil Change", "Maintenance", "Pay to Waqas", "Miscellaneous",
      "Total Expenses", "Net Total", "Status"
    ];

    let sumRate = 0, sumVoucher = 0, sumCash = 0, sumWaqasRec = 0;
    let sumFuel = 0, sumParking = 0, sumWash = 0, sumOil = 0, sumMaint = 0, sumWaqasPay = 0, sumMic = 0;
    let sumTotalExpenses = 0, sumNetTotal = 0;

    const rows = entries.map((item: any) => {
      const vehicleName = item.vehicle ? `${item.vehicle.model}${item.vehicle.type ? ` (${item.vehicle.type})` : ''}` : (item.manual_vehicle || "—");
      const rate = Number(item.rate || 0);
      const voucher = Number(item.voucher || 0);
      const cash = Number(item.cash || 0);
      const waqasRec = Number(item.waqas_received || 0);
      const fuel = Number(item.fuel || 0);
      const parking = Number(item.parking || 0);
      const wash = Number(item.wash || 0);
      const oil = Number(item.oil_change || 0);
      const maint = Number(item.car_maintenance || 0);
      const waqasPay = Number(item.pay_to_waqas || 0);
      const mic = Number(item.mic || 0);
      const expenses = fuel + parking + wash + oil + maint + waqasPay + mic;
      const netTotal = Number(item.total || 0);
      const isLocked = item.is_locked && !driverUser?.edit_rights;

      sumRate += rate;
      sumVoucher += voucher;
      sumCash += cash;
      sumWaqasRec += waqasRec;
      sumFuel += fuel;
      sumParking += parking;
      sumWash += wash;
      sumOil += oil;
      sumMaint += maint;
      sumWaqasPay += waqasPay;
      sumMic += mic;
      sumTotalExpenses += expenses;
      sumNetTotal += netTotal;

      return [
        new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        vehicleName,
        item.trip || "—",
        item.hotel_drop_off || "—",
        item.agent || "—",
        rate,
        voucher,
        cash,
        waqasRec,
        fuel,
        parking,
        wash,
        oil,
        maint,
        waqasPay,
        mic,
        expenses,
        netTotal,
        isLocked ? "Locked" : "Editable"
      ];
    });

    const grandTotalRow = [
      "GRAND TOTAL",
      `(${entries.length} Logs)`,
      "—",
      "—",
      "—",
      sumRate,
      sumVoucher,
      sumCash,
      sumWaqasRec,
      sumFuel,
      sumParking,
      sumWash,
      sumOil,
      sumMaint,
      sumWaqasPay,
      sumMic,
      sumTotalExpenses,
      sumNetTotal,
      "—"
    ];

    return { headers, rows: [...rows, grandTotalRow] };
  };

  const [exportingFmt, setExportingFmt] = useState<string | null>(null);

  const handleExportCSV = async () => {
    setExportingFmt("CSV");
    try {
      if (entries.length === 0) {
        showNotification("No data to export!", "error");
        return;
      }
      const { headers, rows } = buildDriverExportData();
      exportToCSV({
        title: "Driver Daily Sheets & Logs Report",
        filename: "my_driver_logs",
        headers,
        rows
      });
      showNotification(`Exported all ${entries.length} driver logs to CSV!`, "success");
    } finally {
      setExportingFmt(null);
    }
  };

  const handleExportExcel = async () => {
    setExportingFmt("Excel");
    try {
      if (entries.length === 0) {
        showNotification("No data to export!", "error");
        return;
      }
      const { headers, rows } = buildDriverExportData();
      exportToExcel({
        title: `Driver Logs (${driverUser?.name || "Driver"})`,
        filename: "my_driver_logs",
        headers,
        rows,
        companyName: "HEBA CAB",
        summary: [
          { label: "Driver Name", value: driverUser?.name || "—" },
          { label: "Total Logs", value: entries.length }
        ]
      });
      showNotification(`Exported all ${entries.length} driver logs to Excel!`, "success");
    } finally {
      setExportingFmt(null);
    }
  };

  const handlePrint = async (title: string = "My Daily Sheets & Logs Report", fmtType: string = "Print") => {
    setExportingFmt(fmtType);
    try {
      if (entries.length === 0) {
        showNotification("No data to print!", "error");
        return;
      }
      const { headers, rows } = buildDriverExportData();
      await exportToPDF({
        title,
        filename: "my_driver_logs",
        headers,
        rows,
        companyName: "HEBA CAB",
        orientation: "landscape",
        mode: fmtType as any,
        summary: [
          { label: "Driver", value: driverUser?.name || "—" },
          { label: "Total Logs", value: entries.length }
        ]
      });
    } finally {
      setExportingFmt(null);
    }
  };

  // Stats
  const totalSubmissions = entries.length;
  const totalCashCollected = entries.reduce((sum, item) => sum + Number(item.cash || 0) + Number(item.waqas_received || 0), 0);

  return (
    <div className="driver-dashboard-page">
      <style>{`
        .driver-dashboard-page {
          min-height: 100vh;
          background-color: var(--bg-light, #f4f7fa);
          color: var(--dark-color, #2c3e50);
          padding: 30px;
          font-family: var(--font-family-sans), sans-serif;
        }
        
        .dashboard-container {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        /* Gradient Header Banner */
        .dashboard-header-banner {
          background: linear-gradient(135deg, var(--primary-color, #b48a1d) 0%, var(--secondary-color, #1e1e2d) 100%);
          padding: 30px 40px;
          border-radius: 20px;
          color: #ffffff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 10px 25px rgba(180, 138, 29, 0.15);
          border: 1px solid rgba(180, 138, 29, 0.2);
          flex-wrap: wrap;
          gap: 20px;
        }
        
        .profile-area {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .avatar-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background-color: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        
        .avatar-box i {
          color: var(--accent-color, #d4af37);
          font-size: 20px;
        }
        
        .welcome-title {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          letter-spacing: -0.5px;
        }
        
        .welcome-subtitle {
          color: var(--text-muted, #8898aa);
          font-size: 13px;
          margin: 4px 0 0 0;
          font-weight: 500;
        }
        
        .welcome-subtitle span {
          color: #cbd5e1;
        }
        
        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .badge-vehicle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
        }
        
        .vehicle-active {
          background-color: rgba(16, 185, 129, 0.1);
          color: var(--success-color, #10b981);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        
        .vehicle-inactive {
          background-color: rgba(244, 63, 94, 0.1);
          color: var(--danger-color, #f43f5e);
          border: 1px solid rgba(244, 63, 94, 0.2);
        }
        
        .logout-btn {
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
        
        .logout-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }
        
        .alert-success {
          padding: 16px;
          background-color: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: var(--success-color, #10b981);
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .alert-error {
          padding: 16px;
          background-color: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.2);
          color: var(--danger-color, #f43f5e);
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        
        @media (min-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        .stat-card {
          background: var(--light-color, #ffffff);
          border-radius: 20px;
          border: 1px solid var(--border-color, #edf2f9);
          padding: 24px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
        }
        
        .stat-label {
          color: var(--text-muted, #8898aa);
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: 800;
          color: var(--dark-color, #2c3e50);
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .full-width-card {
          background: var(--light-color, #ffffff);
          border-radius: 20px;
          border: 1px solid var(--border-color, #edf2f9);
          padding: 30px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
          width: 100%;
        }
        
        .card-header-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--dark-color, #2c3e50);
          margin-bottom: 28px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid var(--border-color, #edf2f9);
          padding-bottom: 16px;
        }
        
        /* Grid Layouts for Full Width Form Rows */
        .inputs-row-4 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        @media (min-width: 768px) {
          .inputs-row-4 {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .inputs-row-5 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        @media (min-width: 768px) {
          .inputs-row-5 {
            grid-template-columns: repeat(5, 1fr);
          }
        }
        
        .inputs-row-3 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        @media (min-width: 768px) {
          .inputs-row-3 {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
        }
        
        .form-label {
          color: var(--dark-color, #2c3e50);
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .input-wrapper {
          position: relative;
        }
        
        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted, #8898aa);
          font-size: 13px;
          z-index: 10;
        }
        
        /* MATCHES SYSTEM ADMIN FORM INPUT STYLE */
        .form-input {
          width: 100%;
          padding: 12px 14px;
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          color: var(--dark-color, #2c3e50);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, background-color 0.2s, box-shadow 0.2s;
        }
        
        .form-input.has-icon {
          padding-left: 38px;
        }
        
        .form-input:focus {
          background-color: #ffffff;
          border-color: var(--primary-color, #b48a1d);
          box-shadow: 0 0 0 1px var(--primary-color, #b48a1d);
        }
        
        select.form-input {
          appearance: auto;
          cursor: pointer;
        }
        
        .section-divider {
          border-top: 1px solid var(--border-color, #edf2f9);
          margin: 28px 0 20px 0;
          padding-top: 20px;
        }
        
        .section-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-muted, #8898aa);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 16px;
        }
        
        .sub-input-label {
          color: var(--text-muted, #8898aa);
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        
        /* Calc & Submit Footer Section */
        .form-footer-action-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid var(--border-color, #edf2f9);
        }
        
        .calc-summary-box {
          padding: 16px 24px;
          background-color: var(--bg-light, #f4f7fa);
          border: 1px solid var(--border-color, #edf2f9);
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 32px;
          min-width: 280px;
        }
        
        .calc-label-stack {
          display: flex;
          flex-direction: column;
        }
        
        .calc-label {
          color: var(--dark-color, #2c3e50);
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .calc-subtext {
          color: var(--text-muted, #8898aa);
          font-size: 11px;
          margin: 2px 0 0 0;
        }
        
        .calc-val {
          font-size: 22px;
          font-weight: 900;
          margin-left: auto;
        }
        
        .calc-val.positive {
          color: var(--success-color, #10b981);
        }
        
        .calc-val.negative {
          color: var(--danger-color, #f43f5e);
        }
        
        .submit-btn {
          padding: 14px 36px;
          background: var(--primary-color, #b48a1d);
          border: none;
          border-radius: 10px;
          color: #ffffff;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(180, 138, 29, 0.2);
        }
        
        .submit-btn:hover:not(:disabled) {
          background: var(--gradient, linear-gradient(135deg, #b48a1d 0%, #1e1e2d 100%));
          box-shadow: 0 6px 16px rgba(180, 138, 29, 0.3);
          transform: translateY(-1px);
        }
        
        .submit-btn:disabled {
          background: var(--border-color, #edf2f9);
          color: var(--text-muted, #8898aa);
          cursor: not-allowed;
          box-shadow: none;
        }
        
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #ffffff;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .table-responsive {
          width: 100%;
          overflow-x: auto;
        }
        
        .history-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        
        .history-table th {
          background-color: var(--bg-light, #f4f7fa);
          padding: 16px 18px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted, #8898aa);
          border-bottom: 1px solid var(--border-color, #edf2f9);
        }
        
        .history-table td {
          padding: 16px 18px;
          border-bottom: 1px solid var(--border-color, #edf2f9);
          font-size: 14px;
          color: var(--dark-color, #2c3e50);
          vertical-align: middle;
        }
        
        .history-table tr:hover td {
          background-color: var(--bg-light, #f4f7fa);
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }
        
        .status-badge.locked {
          background-color: var(--bg-light, #f4f7fa);
          color: var(--text-muted, #8898aa);
        }
        
        .status-badge.editable {
          background-color: rgba(16, 185, 129, 0.1);
          color: var(--success-color, #10b981);
        }
        
        .action-btn {
          width: 34px;
          height: 34px;
          border: 1px solid var(--border-color, #edf2f9);
          border-radius: 8px;
          background: var(--light-color, #ffffff);
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted, #8898aa);
        }
        
        .action-btn.edit:hover {
          color: var(--success-color, #10b981);
          background-color: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.2);
        }
        
        .action-btn.locked {
          background-color: var(--bg-light, #f4f7fa);
          color: var(--border-color, #edf2f9);
          cursor: not-allowed;
        }
        
        /* Modal Overlay */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(30, 41, 59, 0.4);
          backdrop-filter: blur(4px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        
        .modal-card {
          background-color: var(--light-color, #ffffff);
          border: 1px solid var(--border-color, #edf2f9);
          width: 100%;
          max-width: 768px;
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.1);
          overflow: hidden;
          animation: modalOpen 0.2s ease-out forwards;
        }
        
        @keyframes modalOpen {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color, #edf2f9);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: var(--bg-light, #f4f7fa);
        }
        
        .modal-header-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--dark-color, #2c3e50);
          margin: 0;
        }
        
        .modal-header-subtitle {
          font-size: 12px;
          color: var(--text-muted, #8898aa);
          margin: 2px 0 0 0;
        }
        
        .modal-close-btn {
          width: 32px;
          height: 32px;
          background-color: var(--light-color, #ffffff);
          border: 1px solid var(--border-color, #edf2f9);
          color: var(--text-muted, #8898aa);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .modal-close-btn:hover {
          background-color: var(--bg-light, #f4f7fa);
          color: var(--dark-color, #2c3e50);
        }
        
        .modal-body {
          padding: 24px;
          max-height: 60vh;
          overflow-y: auto;
        }
        
        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid var(--border-color, #edf2f9);
          background-color: var(--bg-light, #f4f7fa);
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
        }
        
        .modal-btn-cancel {
          padding: 10px 20px;
          background-color: var(--light-color, #ffffff);
          border: 1px solid var(--border-color, #edf2f9);
          color: var(--dark-color, #2c3e50);
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .modal-btn-cancel:hover {
          background-color: var(--bg-light, #f4f7fa);
        }
        
        .modal-btn-save {
          padding: 10px 20px;
          background-color: var(--primary-color, #b48a1d);
          border: none;
          color: #ffffff;
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 4px 12px rgba(180, 138, 29, 0.2);
        }
        
        .modal-btn-save:hover {
          background: var(--gradient, linear-gradient(135deg, #b48a1d 0%, #1e1e2d 100%));
        }
      `}</style>

      <div className="dashboard-container">
        {/* Header Dashboard Banner */}
        <header className="dashboard-header-banner">
          <div className="profile-area">
            <div className="avatar-box">
              <i className="fas fa-user"></i>
            </div>
            <div>
              <h1 className="welcome-title">Welcome, {driverUser?.name}</h1>
              <p className="welcome-subtitle">
                Driver Username: <span>{driverUser?.username}</span>
              </p>
            </div>
          </div>

          <div className="header-actions">
            {driverUser?.vehicle_id ? (
              <div className="badge-vehicle vehicle-active">
                <i className="fas fa-car"></i>
                Assigned Vehicle Active
              </div>
            ) : (
              <div className="badge-vehicle vehicle-inactive">
                <i className="fas fa-car"></i>
                No Vehicle Assigned
              </div>
            )}

            <button onClick={driverLogout} className="logout-btn">
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        </header>

        {/* Status messages */}
        {successMessage && (
          <div className="alert-success">
            <i className="fas fa-check-circle" style={{ fontSize: "16px" }}></i>
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="alert-error">
            <i className="fas fa-times-circle" style={{ fontSize: "16px" }}></i>
            {errorMessage}
          </div>
        )}

        {/* Stats Grid */}
        <section className="stats-grid">
          <div className="stat-card">
            <p className="stat-label">Assigned Vehicle</p>
            <p className="stat-value">
              <i className="fas fa-car" style={{ color: "var(--primary-color)" }}></i>
              {driverUser?.vehicle_id ? `Vehicle Stock ID #${driverUser.vehicle_id}` : "None"}
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Total Daily Sheets Logged</p>
            <p className="stat-value">
              <i className="fas fa-calendar-alt" style={{ color: "var(--primary-color)" }}></i>
              {totalSubmissions}
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Total Cash Balance Collected</p>
            <p className="stat-value" style={{ color: "var(--success-color)" }}>
              <i className="fas fa-money-bill-wave"></i>
              {totalCashCollected.toLocaleString()} SAR
            </p>
          </div>
        </section>

        {/* Stacked Full Width sections */}
        
        {/* SECTION 1: Add Daily Log & Expenses Form (Full Width) */}
        <section className="full-width-card">
          <h2 className="card-header-title">
            <i className="fas fa-plus-circle" style={{ color: "var(--primary-color)", fontSize: "20px" }}></i>
            Add Daily Log & Expenses
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Row 1: General Info (5 columns) */}
            <div className="inputs-row-5">
              {/* Date Input */}
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  required
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              {/* Vehicle Select Dropdown */}
              <div className="form-group">
                <label className="form-label">Vehicle Assignment</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <i className="fas fa-car"></i>
                  </span>
                  <select
                    name="vehicle_id"
                    value={customVehicleActive ? "CUSTOM" : formData.vehicle_id}
                    onChange={handleVehicleDropdownChange}
                    className="form-input has-icon"
                    required
                  >
                    <option value="">-- Select Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.model} ({v.type})
                      </option>
                    ))}
                    <option value="CUSTOM">Other (Type manually...)</option>
                  </select>
                </div>
                {customVehicleActive && (
                  <input
                    type="text"
                    required
                    name="manual_vehicle"
                    value={formData.manual_vehicle}
                    onChange={handleInputChange}
                    placeholder="Type vehicle details (e.g. Camry 1234)..."
                    className="form-input"
                    style={{ marginTop: "8px" }}
                  />
                )}
              </div>

              {/* Agent Dropdown */}
              <div className="form-group">
                <label className="form-label">Agent / Company</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <i className="fas fa-building"></i>
                  </span>
                  <select
                    value={selectedAgentOpt}
                    onChange={handleAgentDropdownChange}
                    className="form-input has-icon"
                    required
                  >
                    <option value="">-- Select Agent / Company --</option>
                    {companies.map((comp) => (
                      <option key={comp.id} value={comp.name}>
                        {comp.name}
                      </option>
                    ))}
                    <option value="Individual / Cash">Individual / Cash</option>
                    <option value="CUSTOM">Other (Type manually...)</option>
                  </select>
                </div>
                {customAgentActive && (
                  <input
                    type="text"
                    required
                    name="agent"
                    value={formData.agent}
                    onChange={handleInputChange}
                    placeholder="Type Company Name..."
                    className="form-input"
                    style={{ marginTop: "8px" }}
                  />
                )}
              </div>

              {/* Trip Dropdown */}
              <div className="form-group">
                <label className="form-label">Trip Description</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <i className="fas fa-road"></i>
                  </span>
                  <select
                    value={selectedTripOpt}
                    onChange={handleTripDropdownChange}
                    className="form-input has-icon"
                    required
                  >
                    <option value="">-- Select Trip Route --</option>
                    {STANDARD_TRIPS.map((tr, idx) => (
                      <option key={idx} value={tr}>
                        {tr}
                      </option>
                    ))}
                    <option value="CUSTOM">Other (Type manually...)</option>
                  </select>
                </div>
                {customTripActive && (
                  <input
                    type="text"
                    required
                    name="trip"
                    value={formData.trip}
                    onChange={handleInputChange}
                    placeholder="Type custom trip description..."
                    className="form-input"
                    style={{ marginTop: "8px" }}
                  />
                )}
              </div>

              {/* Hotel Drop Off */}
              <div className="form-group">
                <label className="form-label">Hotel Drop Off</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <i className="fas fa-hotel"></i>
                  </span>
                  <input
                    type="text"
                    name="hotel_drop_off"
                    value={formData.hotel_drop_off}
                    onChange={handleInputChange}
                    placeholder="e.g. Hilton Suites"
                    className="form-input has-icon"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Earnings (SAR) */}
            <div className="section-divider">
              <h3 className="section-title">Earnings (SAR)</h3>
              <div className="inputs-row-4">
                <div className="form-group">
                  <label className="sub-input-label">Rate</label>
                  <input
                    type="number"
                    name="rate"
                    min="0"
                    value={formData.rate || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="sub-input-label">Voucher</label>
                  <input
                    type="number"
                    name="voucher"
                    min="0"
                    value={formData.voucher || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="sub-input-label">Cash</label>
                  <input
                    type="number"
                    name="cash"
                    min="0"
                    value={formData.cash || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="sub-input-label" style={{ color: "#10b981", fontWeight: "700" }}>Received From Waqas</label>
                  <input
                    type="number"
                    name="waqas_received"
                    min="0"
                    value={formData.waqas_received || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Expenses & Petrol (SAR) */}
            <div className="section-divider">
              <h3 className="section-title">Expenses & Petrol (SAR)</h3>
              
              <div className="inputs-row-4">
                <div className="form-group">
                  <label className="sub-input-label">Fuel / Petrol</label>
                  <input
                    type="number"
                    name="fuel"
                    min="0"
                    value={formData.fuel || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="sub-input-label">Parking</label>
                  <input
                    type="number"
                    name="parking"
                    min="0"
                    value={formData.parking || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="sub-input-label">Car Wash</label>
                  <input
                    type="number"
                    name="wash"
                    min="0"
                    value={formData.wash || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="sub-input-label">Oil Change</label>
                  <input
                    type="number"
                    name="oil_change"
                    min="0"
                    value={formData.oil_change || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="inputs-row-3" style={{ marginTop: "16px" }}>
                <div className="form-group">
                  <label className="sub-input-label">Maintenance</label>
                  <input
                    type="number"
                    name="car_maintenance"
                    min="0"
                    value={formData.car_maintenance || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="sub-input-label" style={{ color: "#ef4444", fontWeight: "700" }}>Pay to Waqas</label>
                  <input
                    type="number"
                    name="pay_to_waqas"
                    min="0"
                    value={formData.pay_to_waqas || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="sub-input-label">Miscellaneous</label>
                  <input
                    type="number"
                    name="mic"
                    min="0"
                    value={formData.mic || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Calculations & Submit row */}
            <div className="form-footer-action-row">
              <div className="calc-summary-box">
                <div className="calc-label-stack">
                  <span className="calc-label">Net Daily Total</span>
                  <p className="calc-subtext">Earnings - Expenses</p>
                </div>
                <div className={`calc-val ${calculateTotal(formData) >= 0 ? "positive" : "negative"}`}>
                  {calculateTotal(formData).toFixed(2)} SAR
                </div>
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="submit-btn"
              >
                {submitLoading ? (
                  <div className="spinner"></div>
                ) : (
                  <>
                    <i className="fas fa-lock"></i>
                    Lock & Submit Daily Sheet
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* SECTION 2: Daily Sheet Log History (Full Width) */}
        <section className="full-width-card" style={{ display: "flex", flexDirection: "column", minHeight: "450px" }}>
          <h2 className="card-header-title">
            <i className="fas fa-history" style={{ color: "var(--primary-color)", fontSize: "20px" }}></i>
            Daily Sheet Log History
          </h2>

          {/* Export Toolbar */}
          {!loading && entries.length > 0 && (
            <div style={{ display: "flex", gap: "10px", paddingBottom: "16px", marginBottom: "16px", borderBottom: "1px solid var(--border-color, #edf2f9)", flexWrap: "wrap" }}>
              <button type="button" disabled={!!exportingFmt} onClick={handleCopy} style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: exportingFmt ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}>
                <i className="fas fa-copy"></i> Copy
              </button>
              <button type="button" disabled={!!exportingFmt} onClick={handleExportCSV} style={{ background: "#64748b", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: exportingFmt ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}>
                <i className={exportingFmt === "CSV" ? "fas fa-spinner fa-spin" : "fas fa-file-csv"}></i> CSV
              </button>
              <button type="button" disabled={!!exportingFmt} onClick={handleExportExcel} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: exportingFmt ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}>
                <i className={exportingFmt === "Excel" ? "fas fa-spinner fa-spin" : "fas fa-file-excel"}></i> Excel
              </button>
              <button type="button" disabled={!!exportingFmt} onClick={() => handlePrint("My Driver Logs PDF Report", "PDF")} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: exportingFmt ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}>
                <i className={exportingFmt === "PDF" ? "fas fa-spinner fa-spin" : "fas fa-file-pdf"}></i> PDF
              </button>
              <button type="button" disabled={!!exportingFmt} onClick={() => handlePrint("My Driver Sheets & Logs Report", "Print")} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: exportingFmt ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}>
                <i className={exportingFmt === "Print" ? "fas fa-spinner fa-spin" : "fas fa-print"}></i> Print
              </button>
            </div>
          )}

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center", alignItems: "center", padding: "64px 0" }}>
              <div className="spinner" style={{ border: "2px solid var(--primary-color)", borderTopColor: "transparent", width: "40px", height: "40px", marginBottom: "16px" }} />
              <p style={{ color: "var(--text-muted)", fontSize: "13px", fontWeight: 500 }}>Loading log history...</p>
            </div>
          ) : entries.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center", alignItems: "center", padding: "64px 16px", textAlign: "center", border: "1px dashed var(--border-color)", borderRadius: "16px" }}>
              <i className="fas fa-road" style={{ color: "var(--border-color)", fontSize: "40px", marginBottom: "16px" }}></i>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--dark-color)" }}>No logs submitted yet</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "6px", maxWidth: "320px" }}>
                Your daily logs and expense records will appear here after you submit your first sheet.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Vehicle Assignment</th>
                    <th>Trip</th>
                    <th>Hotel Drop Off</th>
                    <th>Agent / Company</th>
                    <th style={{ textAlign: "right" }}>Rate</th>
                    <th style={{ textAlign: "right" }}>Voucher</th>
                    <th style={{ textAlign: "right" }}>Cash Collected</th>
                    <th style={{ textAlign: "right" }}>Received From Waqas</th>
                    <th style={{ textAlign: "right" }}>Fuel / Petrol</th>
                    <th style={{ textAlign: "right" }}>Pay to Waqas</th>
                    <th style={{ textAlign: "right" }}>Total Expenses</th>
                    <th style={{ textAlign: "right" }}>Net Total</th>
                    <th style={{ textAlign: "center" }}>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((item) => {
                    const isLocked = item.is_locked && !driverUser?.edit_rights;
                    const totalExpenses = Number(item.fuel || 0) + Number(item.parking || 0) + Number(item.wash || 0) + 
                                          Number(item.oil_change || 0) + Number(item.car_maintenance || 0) + 
                                          Number(item.pay_to_waqas || 0) + Number(item.mic || 0);
                    const vehicleName = item.vehicle ? `${item.vehicle.model}${item.vehicle.type ? ` (${item.vehicle.type})` : ''}` : (item.manual_vehicle || "—");
                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600, color: "var(--dark-color)", whiteSpace: "nowrap" }}>
                          {new Date(item.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td style={{ color: "var(--dark-color)", fontWeight: 600, whiteSpace: "nowrap" }}>
                          {vehicleName}
                        </td>
                        <td style={{ color: "var(--dark-color)", whiteSpace: "nowrap" }}>
                          {item.trip || "-"}
                        </td>
                        <td style={{ color: "var(--dark-color)", whiteSpace: "nowrap" }}>
                          {item.hotel_drop_off || "-"}
                        </td>
                        <td style={{ color: "var(--dark-color)", whiteSpace: "nowrap" }}>
                          {item.agent || "-"}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 500, color: "var(--dark-color)", whiteSpace: "nowrap" }}>
                          {Number(item.rate || 0).toFixed(0)} SAR
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 500, color: "var(--dark-color)", whiteSpace: "nowrap" }}>
                          {Number(item.voucher || 0).toFixed(0)} SAR
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 500, color: "var(--dark-color)", whiteSpace: "nowrap" }}>
                          {Number(item.cash || 0).toFixed(0)} SAR
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600, color: "#10b981", whiteSpace: "nowrap" }}>
                          {Number(item.waqas_received || 0).toFixed(0)} SAR
                        </td>
                        <td style={{ textAlign: "right", color: "var(--danger-color)", whiteSpace: "nowrap" }}>
                          {Number(item.fuel || 0).toFixed(0)} SAR
                        </td>
                        <td style={{ textAlign: "right", color: "var(--danger-color)", fontWeight: 600, whiteSpace: "nowrap" }}>
                          {Number(item.pay_to_waqas || 0).toFixed(0)} SAR
                        </td>
                        <td style={{ textAlign: "right", color: "var(--danger-color)", whiteSpace: "nowrap" }}>
                          {totalExpenses.toFixed(0)} SAR
                        </td>
                        <td style={{ textAlign: "right", fontWeight: "bold", whiteSpace: "nowrap" }} className={Number(item.total || 0) >= 0 ? "text-success" : "text-danger"}>
                          {Number(item.total || 0).toFixed(0)} SAR
                        </td>
                        <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                          {isLocked ? (
                            <span className="status-badge locked">
                              <i className="fas fa-lock" style={{ fontSize: "10px", marginRight: "4px" }}></i>
                              Locked
                            </span>
                          ) : (
                            <span className="status-badge editable">
                              <i className="fas fa-unlock" style={{ fontSize: "10px", marginRight: "4px" }}></i>
                              Editable
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            {isLocked ? (
                              <button
                                disabled
                                className="action-btn locked"
                                title="Locked. Contact admin to edit."
                              >
                                <i className="fas fa-lock" style={{ fontSize: "12px" }}></i>
                              </button>
                            ) : (
                              <button
                                onClick={() => openEditModal(item)}
                                className="action-btn edit"
                                title="Edit entry"
                              >
                                <i className="fas fa-edit" style={{ fontSize: "12px" }}></i>
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
        </section>
      </div>

      {/* Edit Modal */}
      {editingEntry && editFormData && (
        <div className="modal-overlay">
          <div className="modal-card">
            {/* Modal Header */}
            <div className="modal-header">
              <div>
                <h3 className="modal-header-title">Edit Daily Log Sheet</h3>
                <p className="modal-header-subtitle">
                  Editing record dated {new Date(editingEntry.date).toLocaleDateString()}
                </p>
              </div>
              <button onClick={closeEditModal} className="modal-close-btn">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                {/* Row 1: General Info */}
                <div className="inputs-row-5">
                  {/* Date */}
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      required
                      name="date"
                      value={editFormData.date}
                      onChange={handleEditInputChange}
                      className="form-input"
                    />
                  </div>

                   {/* Vehicle Select Dropdown */}
                  <div className="form-group">
                    <label className="form-label">Vehicle Assignment</label>
                    <select
                      name="vehicle_id"
                      value={editCustomVehicleActive ? "CUSTOM" : editFormData.vehicle_id}
                      onChange={handleEditVehicleDropdownChange}
                      className="form-input"
                      required
                    >
                      <option value="">-- Select Vehicle --</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.model} ({v.type})
                        </option>
                      ))}
                      <option value="CUSTOM">Other (Type manually...)</option>
                    </select>
                    {editCustomVehicleActive && (
                      <input
                        type="text"
                        required
                        name="manual_vehicle"
                        value={editFormData.manual_vehicle}
                        onChange={handleEditInputChange}
                        placeholder="Type vehicle details (e.g. Camry 1234)..."
                        className="form-input"
                        style={{ marginTop: "8px" }}
                      />
                    )}
                  </div>

                  {/* Edit Agent Dropdown */}
                  <div className="form-group">
                    <label className="form-label">Agent/Company</label>
                    <select
                      value={editSelectedAgentOpt}
                      onChange={handleEditAgentDropdownChange}
                      className="form-input"
                      required
                    >
                      <option value="">-- Select Agent / Company --</option>
                      {companies.map((comp) => (
                        <option key={comp.id} value={comp.name}>
                          {comp.name}
                        </option>
                      ))}
                      <option value="Individual / Cash">Individual / Cash</option>
                      <option value="CUSTOM">Other (Type manually...)</option>
                    </select>
                    {editCustomAgentActive && (
                      <input
                        type="text"
                        required
                        name="agent"
                        value={editFormData.agent}
                        onChange={handleEditInputChange}
                        placeholder="Type Company Name..."
                        className="form-input"
                        style={{ marginTop: "8px" }}
                      />
                    )}
                  </div>

                  {/* Edit Trip Dropdown */}
                  <div className="form-group">
                    <label className="form-label">Trip Description</label>
                    <select
                      value={editSelectedTripOpt}
                      onChange={handleEditTripDropdownChange}
                      className="form-input"
                      required
                    >
                      <option value="">-- Select Trip Route --</option>
                      {STANDARD_TRIPS.map((tr, idx) => (
                        <option key={idx} value={tr}>
                          {tr}
                        </option>
                      ))}
                      <option value="CUSTOM">Other (Type manually...)</option>
                    </select>
                    {editCustomTripActive && (
                      <input
                        type="text"
                        required
                        name="trip"
                        value={editFormData.trip}
                        onChange={handleEditInputChange}
                        placeholder="Type custom trip description..."
                        className="form-input"
                        style={{ marginTop: "8px" }}
                      />
                    )}
                  </div>

                  {/* Hotel Drop Off */}
                  <div className="form-group">
                    <label className="form-label">Hotel Drop Off</label>
                    <input
                      type="text"
                      name="hotel_drop_off"
                      value={editFormData.hotel_drop_off}
                      onChange={handleEditInputChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="section-divider">
                  <h4 className="section-title">Earnings (SAR)</h4>
                  <div className="inputs-row-3">
                    <div className="form-group">
                      <label className="sub-input-label">Rate</label>
                      <input
                        type="number"
                        name="rate"
                        min="0"
                        value={editFormData.rate}
                        onChange={handleEditInputChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="sub-input-label">Voucher</label>
                      <input
                        type="number"
                        name="voucher"
                        min="0"
                        value={editFormData.voucher}
                        onChange={handleEditInputChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="sub-input-label">Cash</label>
                      <input
                        type="number"
                        name="cash"
                        min="0"
                        value={editFormData.cash}
                        onChange={handleEditInputChange}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="inputs-row-3" style={{ marginTop: "16px" }}>
                    <div className="form-group">
                      <label className="sub-input-label">Pay to Waqas / Received From Waqas</label>
                      <input
                        type="number"
                        name="waqas_received"
                        min="0"
                        value={editFormData.waqas_received || ""}
                        onChange={handleEditInputChange}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="section-divider">
                  <h4 className="section-title">Expenses & Petrol (SAR)</h4>
                  <div className="inputs-row-4">
                    <div className="form-group">
                      <label className="sub-input-label">Fuel / Petrol</label>
                      <input
                        type="number"
                        name="fuel"
                        min="0"
                        value={editFormData.fuel}
                        onChange={handleEditInputChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="sub-input-label">Parking</label>
                      <input
                        type="number"
                        name="parking"
                        min="0"
                        value={editFormData.parking}
                        onChange={handleEditInputChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="sub-input-label">Car Wash</label>
                      <input
                        type="number"
                        name="wash"
                        min="0"
                        value={editFormData.wash}
                        onChange={handleEditInputChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="sub-input-label">Oil Change</label>
                      <input
                        type="number"
                        name="oil_change"
                        min="0"
                        value={editFormData.oil_change}
                        onChange={handleEditInputChange}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="inputs-row-3" style={{ marginTop: "16px" }}>
                    <div className="form-group">
                      <label className="sub-input-label">Maintenance</label>
                      <input
                        type="number"
                        name="car_maintenance"
                        min="0"
                        value={editFormData.car_maintenance}
                        onChange={handleEditInputChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="sub-input-label">Pay to Waqas / Miscellaneous</label>
                      <input
                        type="number"
                        name="mic"
                        min="0"
                        value={editFormData.mic}
                        onChange={handleEditInputChange}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="calc-summary-card" style={{ marginBottom: 0 }}>
                  <span className="calc-label">Recalculated Total</span>
                  <div className={`calc-val ${calculateTotal(editFormData) >= 0 ? "positive" : "negative"}`}>
                    {calculateTotal(editFormData).toFixed(2)} SAR
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="modal-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="modal-btn-save"
                >
                  {editLoading ? (
                    <div className="spinner" style={{ border: "2px solid #ffffff", borderTopColor: "transparent" }}></div>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
