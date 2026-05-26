"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/utils/api";

interface ServiceItem {
  id: string;
  rawId: number;
  name: string;
  type: string;
  description: string;
  basePrice: number;
  status: string;
  created_at?: string;
  pickup: string;
  driverCash: number;
  date: string;
  time: string;
}

function ServiceDetailViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetId = searchParams.get("id") || "";

  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("Dispatch Details");
  const [editingService, setEditingService] = useState<any | null>(null);

  // Edit service form fields
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editPickup, setEditPickup] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editDriverCash, setEditDriverCash] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editRemarks, setEditRemarks] = useState("");

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

  const fetchServiceDetails = async () => {
    if (!targetId) return;
    try {
      setLoading(true);
      const res = await api.getService(targetId);
      if (res) {
        setService(res);
      } else {
        showToast("Service record not found", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to load auxiliary service details.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceDetails();
  }, [targetId]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #7c3aed", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  // Fallback / Format helpers
  const currentSvc = service ? {
    id: service.custom_id || `#SRV-${service.id}`,
    rawId: service.id,
    name: service.name,
    type: service.type || "Service",
    description: service.description || "No description provided.",
    basePrice: parseFloat(service.base_price || 0),
    status: service.status || "Pending",
    created_at: service.created_at,
    pickup: service.pickup || "",
    driverCash: parseFloat(service.driver_cash || 0),
    date: service.date || "",
    time: service.time || ""
  } : {
    id: "#SRV-Mock",
    rawId: 0,
    name: "(Standard Refreshment Pack)",
    type: "Food",
    description: "No details registered yet.",
    basePrice: 150.00,
    status: "Pending",
    created_at: new Date().toISOString(),
    pickup: "Makkah",
    driverCash: 50.00,
    date: "2026-05-25",
    time: "12:00"
  };

  const customerObj = service?.customer || {
    id: 0,
    name: "Abu Bakar",
    custom_id: "#CST-1",
    company: "Zahid Travels",
    contact: "+966567799616 (WhatsApp) customer@zahid.com (Email)"
  };

  const mockCustomer = {
    rawId: customerObj.id,
    name: customerObj.name || "Abu Bakar",
    id: customerObj.custom_id || "#CST-1",
    company: customerObj.company || "Zahid Travels",
    companyId: "#CMP-1",
    phones: [customerObj.contact ? customerObj.contact.split(" (")[0] : "+966567799616"],
    email: customerObj.contact?.includes("@") ? customerObj.contact.split(" (Email)")[0].split("customer").pop() || "N/A" : "N/A",
    meta: {
      entryBy: service?.customer?.registered_by || "umrahcab",
      entryDate: service?.customer?.created_at ? new Date(service.customer.created_at).toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "25 May, 2026 07:16 AM",
      editedBy: service?.customer?.last_update || "umrahcab",
      editedDate: "No edits"
    }
  };

  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const formatTimeForDisplay = (timeStr: string) => {
    if (!timeStr) return "";
    try {
      const [hrsStr, minsStr] = timeStr.split(":");
      const hrs = parseInt(hrsStr, 10);
      const ampm = hrs >= 12 ? "PM" : "AM";
      const displayHrs = hrs % 12 || 12;
      return `${displayHrs}:${minsStr} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  // WhatsApp Alert Formats
  const whatsappMessage = `🛎️ *NEW SERVICE DISPATCH*
ID: *${currentSvc.id}*

👤 Regarding Our Client
*${mockCustomer.name}*
(${mockCustomer.phones[0]})

🛠️ Service: *${currentSvc.name}*
📅 Date: *${currentSvc.date ? formatDateForDisplay(currentSvc.date) : "25 May, 2026"}*
⏰ Time: *${currentSvc.time ? formatTimeForDisplay(currentSvc.time) : "12:00 AM"}*
📍 Location: *${currentSvc.pickup || "Makkah"}*

💵 Cash to Collect: *SAR ${currentSvc.basePrice.toFixed(2)}*

📝 Remarks:
${currentSvc.description || "N/A"}
_Please confirm receipt and coordinate with the client._`;

  const startedMessage = `🚀 *SERVICE STARTED*
ID: *${currentSvc.id}*

👤 Client: *${mockCustomer.name}*
🛠️ Service: *${currentSvc.name}*

*Status:* Service has officially started. Our driver is coordinating with the client.
_Updates will follow._`;

  const completedMessage = `✅ *SERVICE COMPLETED*
ID: *${currentSvc.id}*

👤 Client: *${mockCustomer.name}*
🛠️ Service: *${currentSvc.name}*
💵 Cash Collected: *SAR ${currentSvc.basePrice.toFixed(2)}*

*Status:* Service has been successfully completed. Cash collected and logged.
_Thank you for choosing UmrahCab!_`;

  const getActiveMessage = () => {
    if (activeTab === "Service Started") return startedMessage;
    if (activeTab === "Service Completed") return completedMessage;
    return whatsappMessage;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(getActiveMessage());
    showToast(`${activeTab} details copied to clipboard!`, "success");
  };

  const handleCompleteAndCopy = async () => {
    if (currentSvc.rawId) {
      await api.updateService(String(currentSvc.rawId), { status: "Completed" });
      showToast("Service marked as Completed and Dispatch copied!", "success");
      fetchServiceDetails();
    }
    navigator.clipboard.writeText(completedMessage);
  };

  const handleDeleteClick = async () => {
    if (window.confirm("Are you sure you want to delete this service record?")) {
      if (currentSvc.rawId) {
        const res = await api.deleteService(String(currentSvc.rawId));
        if (res?.success) {
          showToast("Service record deleted successfully!", "success");
          router.push("/admin/services");
        } else {
          showToast("Failed to delete service record", "error");
        }
      }
    }
  };

  const openEditModal = () => {
    setEditName(currentSvc.name);
    setEditType(currentSvc.type);
    setEditPrice(String(currentSvc.basePrice));
    setEditPickup(currentSvc.pickup);
    setEditStatus(currentSvc.status);
    setEditDriverCash(String(currentSvc.driverCash));
    setEditDate(currentSvc.date);
    setEditTime(currentSvc.time);
    setEditRemarks(currentSvc.description);
    setEditingService(currentSvc);
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    try {
      const payload = {
        name: editName,
        type: editType,
        base_price: parseFloat(editPrice) || 0,
        pickup: editPickup,
        status: editStatus,
        driver_cash: parseFloat(editDriverCash) || 0,
        date: editDate,
        time: editTime,
        description: editRemarks,
      };
      const res = await api.updateService(String(editingService.rawId), payload);
      if (res?.success) {
        showToast("Service details updated successfully!", "success");
        setEditingService(null);
        fetchServiceDetails();
      } else {
        showToast("Failed to update service record", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating service record", "error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
      {/* Toast Alert */}
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

      {/* Header Panel */}
      <div style={{ background: "linear-gradient(135deg, #5c2d91 0%, #4a2175 100%)", borderRadius: "16px", padding: "24px 30px", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px", boxShadow: "0 10px 25px -5px rgba(92, 45, 145, 0.3)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ background: currentSvc.status === "Pending" ? "#fef08a" : "#dcfce7", color: currentSvc.status === "Pending" ? "#854d0e" : "#166534", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "800", letterSpacing: "0.5px", textTransform: "uppercase" }}>
              {currentSvc.status}
            </span>
            <span style={{ background: "rgba(255, 255, 255, 0.15)", color: "#ffffff", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>
              ID: {currentSvc.id}
            </span>
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "800", margin: 0, textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
            {currentSvc.name}
          </h2>
          <p style={{ margin: 0, fontSize: "14px", color: "rgba(255, 255, 255, 0.8)", fontWeight: "500" }}>
            For {mockCustomer.name}
          </p>
        </div>
        
        {/* Header Action Buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={() => router.push("/admin/services")} style={{ background: "rgba(255, 255, 255, 0.1)", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: "8px", padding: "10px 16px", fontWeight: "600", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="fas fa-list"></i>
            <span>List</span>
          </button>
          <button onClick={openEditModal} style={{ background: "#ffffff", color: "#5c2d91", border: "none", borderRadius: "8px", padding: "10px 16px", fontWeight: "700", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
            <i className="fas fa-pencil"></i>
            <span>Edit</span>
          </button>
          <button onClick={handleDeleteClick} style={{ background: "rgba(220, 53, 69, 0.1)", color: "#f87171", border: "1px solid rgba(220, 53, 69, 0.2)", borderRadius: "8px", padding: "10px 16px", fontWeight: "600", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="fas fa-trash"></i>
            <span>Delete</span>
          </button>
          <button onClick={handleCompleteAndCopy} style={{ background: "#22c55e", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 16px", fontWeight: "700", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 4px 10px rgba(34, 197, 94, 0.3)" }}>
            <i className="fas fa-check-double"></i>
            <span>Complete & Copy</span>
          </button>
        </div>
      </div>

      {/* Two-Column Grid layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "25px", alignItems: "start" }}>
        {/* Left Column: Customer Info */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0, paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
            Customer Information
          </h3>
          
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div style={{ width: "55px", height: "55px", borderRadius: "50%", background: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
              <i className="fas fa-user-tie"></i>
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
                {mockCustomer.name}
              </h4>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                Customer ID: {mockCustomer.id}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", borderTop: "1px solid #f1f5f9", paddingTop: "15px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600" }}>Associated Corporate Company:</span>
              <div style={{ fontSize: "14px", color: "#16a34a", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                <i className="fas fa-building" style={{ fontSize: "12px" }}></i>
                {mockCustomer.company}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600" }}>Official Contact Numbers:</span>
              {mockCustomer.phones.map((phone, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "14px", color: "#1e293b", fontWeight: "600" }}>
                    <i className="fas fa-phone-volume" style={{ color: "#64748b", marginRight: "8px", fontSize: "12px" }}></i>
                    {phone}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600" }}>Email Address:</span>
              <span style={{ fontSize: "14px", color: "#1e293b", fontWeight: "600" }}>
                <i className="fas fa-envelope" style={{ color: "#64748b", marginRight: "8px", fontSize: "12px" }}></i>
                {mockCustomer.email}
              </span>
            </div>
          </div>

          <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "15px", display: "flex", flexDirection: "column", gap: "10px", border: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
              <i className="fas fa-user" style={{ color: "#94a3b8", width: "16px" }}></i>
              <span style={{ color: "#64748b", fontWeight: "600" }}>Registered By:</span>
              <span style={{ color: "#1e293b", fontWeight: "700" }}>{mockCustomer.meta.entryBy}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
              <i className="fas fa-calendar" style={{ color: "#94a3b8", width: "16px" }}></i>
              <span style={{ color: "#64748b", fontWeight: "600" }}>Registered On:</span>
              <span style={{ color: "#1e293b", fontWeight: "700" }}>{mockCustomer.meta.entryDate}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Service Inclusions & Remarks */}
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0, paddingBottom: "12px", borderBottom: "1px solid #f1f5f9", marginBottom: "20px" }}>
              Service Information Details
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
              <div style={{ background: "#f0fdf4", padding: "15px", borderRadius: "10px", borderLeft: "4px solid #16a34a" }}>
                <span style={{ fontSize: "11px", color: "#166534", fontWeight: "700", textTransform: "uppercase" }}>Service Price</span>
                <span style={{ fontSize: "20px", color: "#16a34a", fontWeight: "800", display: "block", marginTop: "4px" }}>
                  SAR {currentSvc.basePrice.toFixed(2)}
                </span>
              </div>
              <div style={{ background: "#eff6ff", padding: "15px", borderRadius: "10px", borderLeft: "4px solid #2563eb" }}>
                <span style={{ fontSize: "11px", color: "#1e40af", fontWeight: "700", textTransform: "uppercase" }}>Cash Paid (Driver)</span>
                <span style={{ fontSize: "20px", color: "#2563eb", fontWeight: "800", display: "block", marginTop: "4px" }}>
                  SAR {currentSvc.driverCash.toFixed(2)}
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", borderBottom: "1px solid #f1f5f9", paddingBottom: "18px", marginBottom: "18px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <i className="fas fa-calendar-day" style={{ color: "#7c3aed", fontSize: "16px" }}></i>
                <div>
                  <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "600", display: "block" }}>SERVICE DATE</span>
                  <span style={{ fontSize: "13px", color: "#1e293b", fontWeight: "700" }}>
                    {currentSvc.date ? formatDateForDisplay(currentSvc.date) : "N/A"}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <i className="fas fa-clock" style={{ color: "#7c3aed", fontSize: "16px" }}></i>
                <div>
                  <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "600", display: "block" }}>SERVICE TIME</span>
                  <span style={{ fontSize: "13px", color: "#1e293b", fontWeight: "700" }}>
                    {currentSvc.time ? formatTimeForDisplay(currentSvc.time) : "N/A"}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <i className="fas fa-map-location-dot" style={{ color: "#7c3aed", fontSize: "16px" }}></i>
                <div>
                  <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "600", display: "block" }}>PICKUP LOCATION</span>
                  <span style={{ fontSize: "13px", color: "#1e293b", fontWeight: "700" }}>
                    {currentSvc.pickup || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                  <i className="fas fa-comment-dots" style={{ color: "#cbd5e1" }}></i> Description & Remarks:
                </span>
                <span style={{ fontSize: "14px", color: "#475569", fontWeight: "500", lineHeight: "1.5" }}>
                  {currentSvc.description || "No remarks provided."}
                </span>
              </div>
            </div>
          </div>

          {/* Service Dispatch and Whatsapp Template */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0, paddingBottom: "12px", borderBottom: "1px solid #f1f5f9", marginBottom: "20px" }}>
              Service Dispatch Alerts & Templates
            </h3>

            <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", borderRadius: "10px", padding: "4px", marginBottom: "20px" }}>
              {["Dispatch Details", "Service Started", "Service Completed"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    background: activeTab === tab ? (tab === "Service Started" ? "#3b82f6" : tab === "Service Completed" ? "#16a34a" : "#22c55e") : "transparent",
                    color: activeTab === tab ? "#ffffff" : "#475569",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "12px",
                    fontWeight: activeTab === tab ? "700" : "600",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ position: "relative" }}>
              <pre style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "15px", fontFamily: "monospace", fontSize: "12px", lineHeight: "1.6", color: "#334155", whiteSpace: "pre-wrap", margin: 0 }}>
                {getActiveMessage()}
              </pre>
            </div>

            <button
              onClick={handleCopyText}
              style={{
                background: activeTab === "Service Started" ? "#3b82f6" : activeTab === "Service Completed" ? "#16a34a" : "#22c55e",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "12px",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                marginTop: "15px",
                transition: "all 0.2s"
              }}
            >
              <i className="fas fa-copy"></i>
              <span>Copy Dispatch Alert</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editing Service Modal */}
      {editingService && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "550px", margin: "20px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", background: "#ffffff", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "15px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#7c3aed", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fas fa-pencil"></i> Edit Auxiliary Service
              </h3>
              <button onClick={() => setEditingService(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>&times;</button>
            </div>
            
            <form onSubmit={handleUpdateService} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div className="form-group-full" style={{ gridColumn: "span 2" }}>
                <label className="form-label">Service Description *</label>
                <input type="text" className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </div>

              <div>
                <label className="form-label">Service Type</label>
                <input type="text" className="form-input" value={editType} onChange={(e) => setEditType(e.target.value)} />
              </div>

              <div>
                <label className="form-label">Service Status</label>
                <select className="form-input form-select" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  <option value="Pending">Pending</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="form-label">Service Date *</label>
                <input type="date" className="form-input" value={editDate} onChange={(e) => setEditDate(e.target.value)} required />
              </div>

              <div>
                <label className="form-label">Service Time</label>
                <input type="time" className="form-input" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
              </div>

              <div>
                <label className="form-label">Service Price (Base)</label>
                <input type="number" step="0.01" className="form-input" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
              </div>

              <div>
                <label className="form-label">Cash (Driver)</label>
                <input type="number" step="0.01" className="form-input" value={editDriverCash} onChange={(e) => setEditDriverCash(e.target.value)} />
              </div>

              <div className="form-group-full" style={{ gridColumn: "span 2" }}>
                <label className="form-label">Pickup Location</label>
                <input type="text" className="form-input" value={editPickup} onChange={(e) => setEditPickup(e.target.value)} />
              </div>

              <div className="form-group-full" style={{ gridColumn: "span 2" }}>
                <label className="form-label">External Remarks</label>
                <textarea className="form-input form-textarea" value={editRemarks} onChange={(e) => setEditRemarks(e.target.value)}></textarea>
              </div>

              <div className="form-group-full" style={{ gridColumn: "span 2", display: "flex", gap: "12px", marginTop: "10px" }}>
                <button type="submit" className="btn-submit" style={{ flex: 1, background: "#7c3aed", color: "#ffffff", border: "none", borderRadius: "8px", padding: "12px", fontWeight: "600", cursor: "pointer" }}>Save Changes</button>
                <button type="button" onClick={() => setEditingService(null)} className="form-btn-back" style={{ flex: 1, justifyContent: "center", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", padding: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ServiceDetailView() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #7c3aed", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <ServiceDetailViewContent />
    </Suspense>
  );
}
