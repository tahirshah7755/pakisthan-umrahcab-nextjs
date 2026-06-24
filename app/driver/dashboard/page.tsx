"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../utils/api";
import { useRouter } from "next/navigation";

export default function DriverDashboardPage() {
  const { driverUser, driverLogout } = useAuth();
  const router = useRouter();

  // State
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
    mic: 0,
  });

  // Edit Modal State
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Load entries on mount
  useEffect(() => {
    if (!driverUser) {
      router.push("/driver/login");
      return;
    }
    loadEntries();
  }, [driverUser]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await api.getMyDriverEntries();
      setEntries(data || []);
    } catch (err) {
      console.error("Failed to load driver entries:", err);
    } fill: {
      setLoading(false);
    }
  };

  // Formula: (Rate + Voucher + Cash) - (Fuel + Parking + Wash + Oil + Maint + Mic)
  const calculateTotal = (data: typeof formData) => {
    const earnings = Number(data.rate) + Number(data.voucher) + Number(data.cash);
    const expenses = Number(data.fuel) + Number(data.parking) + Number(data.wash) + 
                     Number(data.oil_change) + Number(data.car_maintenance) + Number(data.mic);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const total = calculateTotal(formData);
    const payload = { ...formData, total };

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
          mic: 0,
        });
        // Reload history
        loadEntries();
      } else {
        setErrorMessage(res.error || "Failed to submit daily sheet.");
      }
    } catch (err) {
      setErrorMessage("An error occurred during submission.");
    } fill: {
      setSubmitLoading(false);
    }
  };

  const openEditModal = (entry: any) => {
    setEditingEntry(entry);
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
      mic: entry.mic || 0,
    });
  };

  const closeEditModal = () => {
    setEditingEntry(null);
    setEditFormData(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    setEditLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const total = calculateTotal(editFormData);
    const payload = { ...editFormData, total };

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
    } fill: {
      setEditLoading(false);
    }
  };

  // Stats
  const totalSubmissions = entries.length;
  const totalCashCollected = entries.reduce((sum, item) => sum + Number(item.cash || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 md:px-8 py-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-10 left-1/3 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/3 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Dashboard */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <i className="fas fa-user text-emerald-400"></i>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
                  Welcome, {driverUser?.name}
                </h1>
                <p className="text-slate-400 text-xs mt-0.5">
                  Driver Username: <span className="text-slate-200">{driverUser?.username}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            {driverUser?.vehicle_id ? (
              <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-2 text-xs text-slate-300">
                <i className="fas fa-car text-emerald-400"></i>
                Assigned Vehicle Active
              </div>
            ) : (
              <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs text-red-400">
                <i className="fas fa-car"></i>
                No Vehicle Assigned
              </div>
            )}

            <button
              onClick={driverLogout}
              className="px-4 py-2 bg-slate-900/60 hover:bg-red-950/20 border border-slate-800 hover:border-red-500/30 text-slate-300 hover:text-red-400 rounded-xl transition duration-200 flex items-center gap-2 text-xs font-semibold"
            >
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        </header>

        {/* Status messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded-2xl text-sm font-medium flex items-center gap-3">
            <i className="fas fa-check flex-shrink-0"></i>
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm font-medium flex items-center gap-3">
            <i className="fas fa-times flex-shrink-0"></i>
            {errorMessage}
          </div>
        )}

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-850 p-6 rounded-2xl shadow-lg shadow-black/20">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Assigned Vehicle</p>
            <p className="text-2xl font-extrabold text-white mt-2 flex items-center gap-3">
              <i className="fas fa-car text-emerald-400"></i>
              {driverUser?.vehicle_id ? `Vehicle Stock ID #${driverUser.vehicle_id}` : "None"}
            </p>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-850 p-6 rounded-2xl shadow-lg shadow-black/20">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Daily Sheets Logged</p>
            <p className="text-2xl font-extrabold text-white mt-2 flex items-center gap-3">
              <i className="fas fa-calendar-alt text-teal-400"></i>
              {totalSubmissions}
            </p>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-850 p-6 rounded-2xl shadow-lg shadow-black/20">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Cash Balance Collected</p>
            <p className="text-2xl font-extrabold text-emerald-400 mt-2 flex items-center gap-2">
              <i className="fas fa-money-bill-wave"></i>
              {totalCashCollected.toLocaleString()} SAR
            </p>
          </div>
        </section>

        {/* Two-Column Grid: Form and History */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Daily Log Entry Form (Column Span 5) */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-850 p-6 rounded-3xl shadow-xl">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <i className="fas fa-plus text-emerald-400 text-sm"></i>
                Add Daily Log & Expenses
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1.5">Date</label>
                    <input
                      type="date"
                      required
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1.5">Agent/Company</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-650">
                        <i className="fas fa-building text-xs"></i>
                      </span>
                      <input
                        type="text"
                        name="agent"
                        value={formData.agent}
                        onChange={handleInputChange}
                        placeholder="e.g. Al-Fajr"
                        className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1.5">Trip Description</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-655">
                        <i className="fas fa-road text-xs"></i>
                      </span>
                      <input
                        type="text"
                        name="trip"
                        value={formData.trip}
                        onChange={handleInputChange}
                        placeholder="e.g. Makkah to Jeddah"
                        className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1.5">Hotel Drop Off</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-655">
                        <i className="fas fa-hotel text-xs"></i>
                      </span>
                      <input
                        type="text"
                        name="hotel_drop_off"
                        value={formData.hotel_drop_off}
                        onChange={handleInputChange}
                        placeholder="e.g. Hilton Suites"
                        className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-850 my-4 pt-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Earnings (SAR)</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-500 text-[10px] font-semibold mb-1">Rate</label>
                      <input
                        type="number"
                        name="rate"
                        min="0"
                        value={formData.rate || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-semibold mb-1">Voucher</label>
                      <input
                        type="number"
                        name="voucher"
                        min="0"
                        value={formData.voucher || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-semibold mb-1">Cash</label>
                      <input
                        type="number"
                        name="cash"
                        min="0"
                        value={formData.cash || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-855 my-4 pt-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Expenses & Petrol (SAR)</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-500 text-[10px] font-semibold mb-1">Fuel / Petrol</label>
                      <input
                        type="number"
                        name="fuel"
                        min="0"
                        value={formData.fuel || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-white text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-semibold mb-1">Parking</label>
                      <input
                        type="number"
                        name="parking"
                        min="0"
                        value={formData.parking || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-white text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-semibold mb-1">Car Wash</label>
                      <input
                        type="number"
                        name="wash"
                        min="0"
                        value={formData.wash || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                      <label className="block text-slate-500 text-[10px] font-semibold mb-1">Oil Change</label>
                      <input
                        type="number"
                        name="oil_change"
                        min="0"
                        value={formData.oil_change || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-white text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-semibold mb-1">Maintenance</label>
                      <input
                        type="number"
                        name="car_maintenance"
                        min="0"
                        value={formData.car_maintenance || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-white text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-semibold mb-1">Miscellaneous</label>
                      <input
                        type="number"
                        name="mic"
                        min="0"
                        value={formData.mic || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 mt-3">
                    <div>
                      <label className="block text-slate-555 text-[10px] font-semibold mb-1">Waqas Received</label>
                      <input
                        type="number"
                        name="waqas_received"
                        min="0"
                        value={formData.waqas_received || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Calculation summary */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wide">Net Daily Total</span>
                    <p className="text-slate-500 text-[10px] mt-0.5">Earnings - Expenses</p>
                  </div>
                  <div className={`text-lg font-black ${calculateTotal(formData) >= 0 ? "text-emerald-450" : "text-red-400"}`}>
                    {calculateTotal(formData).toFixed(2)} SAR
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitLoading || !driverUser?.vehicle_id}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 disabled:from-slate-800 disabled:to-slate-800 text-slate-950 disabled:text-slate-500 font-bold rounded-xl hover:from-emerald-400 hover:to-teal-400 shadow-lg hover:shadow-emerald-500/10 active:scale-[0.99] transition duration-150 flex items-center justify-center gap-2 text-sm"
                >
                  {submitLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {!driverUser?.vehicle_id ? "Awaiting Vehicle Assignment" : "Lock & Submit Sheet"}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* History / Recent Submissions (Column Span 7) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-850 p-6 rounded-3xl shadow-xl flex-grow flex flex-col">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <i className="fas fa-road text-teal-400 text-sm"></i>
                Daily Sheet Log History
              </h2>

              {loading ? (
                <div className="flex-grow flex flex-col justify-center items-center py-16">
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-slate-400 text-xs font-medium">Loading history...</p>
                </div>
              ) : entries.length === 0 ? (
                <div className="flex-grow flex flex-col justify-center items-center py-16 text-center border border-dashed border-slate-800 rounded-2xl">
                  <i className="fas fa-road text-slate-700 text-3xl mb-3"></i>
                  <h3 className="text-sm font-bold text-slate-300">No logs submitted yet</h3>
                  <p className="text-slate-500 text-xs mt-1 max-w-xs">
                    Your daily logs and expense records will appear here after you submit your first sheet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto flex-grow">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-450 text-xs font-bold uppercase tracking-wider">
                        <th className="pb-3 pr-2">Date</th>
                        <th className="pb-3 px-2">Trip</th>
                        <th className="pb-3 px-2">Agent</th>
                        <th className="pb-3 px-2 text-right">Cash</th>
                        <th className="pb-3 px-2 text-right">Net Total</th>
                        <th className="pb-3 px-2 text-center">Status</th>
                        <th className="pb-3 pl-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-sm">
                      {entries.map((item) => {
                        const isLocked = item.is_locked && !driverUser?.edit_rights;
                        return (
                          <tr key={item.id} className="hover:bg-slate-850/30 transition duration-150">
                            <td className="py-4 pr-2 font-medium text-slate-300 whitespace-nowrap">
                              {new Date(item.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </td>
                            <td className="py-4 px-2 text-slate-400 max-w-[120px] truncate" title={item.trip}>
                              {item.trip || "N/A"}
                            </td>
                            <td className="py-4 px-2 text-slate-400 max-w-[100px] truncate" title={item.agent}>
                              {item.agent || "N/A"}
                            </td>
                            <td className="py-4 px-2 text-right font-medium text-slate-300">
                              {Number(item.cash || 0).toFixed(0)}
                            </td>
                            <td className={`py-4 px-2 text-right font-bold ${Number(item.total || 0) >= 0 ? "text-emerald-450" : "text-red-400"}`}>
                              {Number(item.total || 0).toFixed(0)}
                            </td>
                            <td className="py-4 px-2 text-center whitespace-nowrap">
                              {isLocked ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-950 border border-slate-800 text-slate-500 rounded-lg text-[10px] font-extrabold uppercase">
                                  <i className="fas fa-lock text-[9px]"></i>
                                  Locked
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-extrabold uppercase">
                                  <i className="fas fa-unlock text-[9px]"></i>
                                  Editable
                                </span>
                              )}
                            </td>
                            <td className="py-4 pl-2 text-right whitespace-nowrap">
                              {isLocked ? (
                                <button
                                  disabled
                                  className="p-2 bg-slate-900 text-slate-700 rounded-lg cursor-not-allowed border border-slate-800/20"
                                  title="Locked. Contact admin to edit."
                                >
                                  <i className="fas fa-lock text-xs"></i>
                                </button>
                              ) : (
                                <button
                                  onClick={() => openEditModal(item)}
                                  className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition duration-150 border border-emerald-500/10 hover:border-emerald-500/30"
                                  title="Edit entry"
                                >
                                  <i className="fas fa-edit text-xs"></i>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Edit Modal (Glassmorphic Backdrop) */}
      {editingEntry && editFormData && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-800/60 flex items-center justify-between bg-slate-950/40">
              <div>
                <h3 className="text-lg font-extrabold text-white">Edit Daily Log Sheet</h3>
                <p className="text-xs text-slate-400 mt-0.5">Editing record dated {new Date(editingEntry.date).toLocaleDateString()}</p>
              </div>
              <button 
                onClick={closeEditModal}
                className="p-2 bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition duration-155"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdate}>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1.5">Date</label>
                    <input
                      type="date"
                      required
                      name="date"
                      value={editFormData.date}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1.5">Agent/Company</label>
                    <input
                      type="text"
                      name="agent"
                      value={editFormData.agent}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1.5">Trip Description</label>
                    <input
                      type="text"
                      name="trip"
                      value={editFormData.trip}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1.5">Hotel Drop Off</label>
                    <input
                      type="text"
                      name="hotel_drop_off"
                      value={editFormData.hotel_drop_off}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-850 pt-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Earnings (SAR)</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-500 text-[10px] font-semibold mb-1">Rate</label>
                      <input
                        type="number"
                        name="rate"
                        min="0"
                        value={editFormData.rate}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-white text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-semibold mb-1">Voucher</label>
                      <input
                        type="number"
                        name="voucher"
                        min="0"
                        value={editFormData.voucher}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-white text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-semibold mb-1">Cash</label>
                      <input
                        type="number"
                        name="cash"
                        min="0"
                        value={editFormData.cash}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-850 pt-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Expenses & Petrol (SAR)</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-500 text-[10px] font-semibold mb-1">Fuel / Petrol</label>
                      <input
                        type="number"
                        name="fuel"
                        min="0"
                        value={editFormData.fuel}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-white text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-semibold mb-1">Parking</label>
                      <input
                        type="number"
                        name="parking"
                        min="0"
                        value={editFormData.parking}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-white text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-semibold mb-1">Car Wash</label>
                      <input
                        type="number"
                        name="wash"
                        min="0"
                        value={editFormData.wash}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                      <label className="block text-slate-500 text-[10px] font-semibold mb-1">Oil Change</label>
                      <input
                        type="number"
                        name="oil_change"
                        min="0"
                        value={editFormData.oil_change}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-white text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-semibold mb-1">Maintenance</label>
                      <input
                        type="number"
                        name="car_maintenance"
                        min="0"
                        value={editFormData.car_maintenance}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-white text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] font-semibold mb-1">Miscellaneous</label>
                      <input
                        type="number"
                        name="mic"
                        min="0"
                        value={editFormData.mic}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 mt-3">
                    <div>
                      <label className="block text-slate-500 text-[10px] font-semibold mb-1">Waqas Received</label>
                      <input
                        type="number"
                        name="waqas_received"
                        min="0"
                        value={editFormData.waqas_received}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wide">Recalculated Total</span>
                  <div className={`text-lg font-black ${calculateTotal(editFormData) >= 0 ? "text-emerald-450" : "text-red-400"}`}>
                    {calculateTotal(editFormData).toFixed(2)} SAR
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-800/60 bg-slate-950/40 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition duration-150 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-xl hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/10 transition duration-150 flex items-center gap-2 text-sm"
                >
                  {editLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Save Changes
                    </>
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
