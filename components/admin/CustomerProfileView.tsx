"use client";

import React, { useState, useEffect } from "react";
import { CustomerItem } from "./CustomerDirectory";
import { api } from "@/utils/api";
import { formatDateTime, formatDateOnly, formatTimeOnly } from "@/utils/formatters";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/umrahcab";
const IMAGE_BASE = API_URL.split("/api/")[0] || "http://localhost:8000";

const getFileUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}/view-file?path=${encodeURIComponent(cleanPath)}`;
};

interface CustomerProfileViewProps {
  currentProfile: {
    id: string;
    dbId?: string | number;
    name: string;
    email: string;
    company: string;
    phones: string[];
    passportNo?: string;
    hotelInfo?: string;
    externalRemarks?: string;
    internalRemarks?: string;
    meta: {
      registeredBy: string;
      registeredDate: string;
      lastEditedBy: string;
      lastEditedDate: string;
    };
  };
  stats: {
    bookings: number;
    flights: number;
    trains: number;
    services: number;
    hotels: number;
  };
  activeProfileTab: string;
  setActiveProfileTab: (tab: string) => void;
  custBookings: any[];
  custServices: any[];
  custFlights: any[];
  custTrains: any[];
  custHotels: any[];
  customers: CustomerItem[];
  setEditingCustomer: (c: CustomerItem) => void;
  router: any;
  showToast: (msg: string, type: "success" | "error") => void;
  triggerExportAlert: (fmt: string) => void;
  isCompany?: boolean;
}

export const CustomerProfileView: React.FC<CustomerProfileViewProps> = ({
  currentProfile,
  stats,
  activeProfileTab,
  setActiveProfileTab,
  custBookings,
  custServices,
  custFlights,
  custTrains,
  custHotels,
  customers,
  setEditingCustomer,
  router,
  showToast,
  triggerExportAlert,
  isCompany = false,
}) => {
  const [selectedProfileBooking, setSelectedProfileBooking] = useState<any>(null);
  const [selectedProfileFlight, setSelectedProfileFlight] = useState<any>(null);
  const [selectedProfileTrain, setSelectedProfileTrain] = useState<any>(null);
  const [selectedProfileHotel, setSelectedProfileHotel] = useState<any>(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelBooking, setSelectedCancelBooking] = useState<any>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedApproveBooking, setSelectedApproveBooking] = useState<any>(null);

  const basePath = isCompany ? "/company" : "/admin";
  const rawId = currentProfile.dbId ? String(currentProfile.dbId) : currentProfile.id.replace("#CST-", "").replace("#Cst-", "").replace("#cst-", "");

  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Viewer states
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<any | null>(null);

  // Delete states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<number | null>(null);

  const downloadFile = (filePath: string) => {
    const downloadUrl = `${API_URL}/download-file?path=${encodeURIComponent(filePath)}`;
    window.location.href = downloadUrl;
  };

  const loadDocuments = async () => {
    if (!rawId) return;
    try {
      setLoadingDocs(true);
      const res = await api.getCustomerDocuments(rawId, isCompany);
      if (res && Array.isArray(res)) {
        setDocuments(res);
      } else {
        setDocuments([]);
      }
    } catch (err) {
      console.error("Error loading documents in profile:", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [rawId]);

  const handleDeleteDoc = async (id: number) => {
    try {
      const res = await api.deleteCustomerDocument(id, isCompany);
      if (res) {
        showToast("Document deleted successfully", "success");
        loadDocuments();
      } else {
        showToast("Failed to delete document", "error");
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      showToast("An error occurred while deleting document", "error");
    }
  };

  const [showDeleteCustomerModal, setShowDeleteCustomerModal] = useState(false);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);

  const confirmDeleteCustomerProfile = async () => {
    setIsDeletingProfile(true);
    try {
      await api.deleteCustomer(rawId);
      showToast(`Customer deleted successfully!`, "success");
      setShowDeleteCustomerModal(false);
      router.push(isCompany ? "/company/customers" : "/admin/customers");
    } catch (err) {
      console.error("Failed to delete customer:", err);
      showToast("Failed to delete customer.", "error");
    } finally {
      setIsDeletingProfile(false);
    }
  };

  const handleActionClick = (actionName: string) => {
    showToast(`Triggered simulated customer action: ${actionName}`, "success");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
      
      {/* Header Panel Card (Teal/Emerald Green Gradient - Restored original colors) */}
      <div 
        style={{ 
          background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)", 
          borderRadius: "16px", 
          padding: "24px 30px",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          boxShadow: "0 10px 25px -5px rgba(15, 118, 110, 0.3)"
        }}
      >
        {/* Profile Basic Summary Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.2)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "24px", fontWeight: "700"
          }}>
            {currentProfile.name ? currentProfile.name.charAt(0).toUpperCase() : "C"}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700" }}>{currentProfile.name}</h2>
              <span style={{
                background: "rgba(255, 255, 255, 0.2)", color: "#ffffff",
                padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700"
              }}>
                {currentProfile.id}
              </span>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", opacity: 0.9 }}>
              <i className="fas fa-building" style={{ marginRight: "6px" }}></i>
              {currentProfile.company}
            </p>
          </div>
        </div>
        
        {/* Header Action Buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => router.push(isCompany ? "/company/customers" : "/admin/customers")}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              borderRadius: "8px",
              padding: "10px 18px",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s"
            }}
          >
            <i className="fas fa-list"></i>
            <span>List</span>
          </button>
          {!isCompany && (
            <>
              <button
                onClick={() => {
                  router.push(`/admin/customers/edit?id=${rawId}`);
                }}
                style={{
                  background: "#ffffff",
                  color: "#0f766e",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 18px",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.08)",
                  transition: "all 0.2s"
                }}
              >
                <i className="fas fa-pencil"></i>
                <span>Edit</span>
              </button>
              <button
                onClick={() => setShowDeleteCustomerModal(true)}
                style={{
                  background: "#ef4444",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 18px",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.08)",
                  transition: "all 0.2s"
                }}
              >
                <i className="fas fa-trash-can"></i>
                <span>Delete</span>
              </button>
            </>
          )}
          <button 
            onClick={() => {
              const url = `/print/customer?id=${rawId}&showPrice=0${isCompany ? '&type=company' : ''}`;
              window.open(url, '_blank');
            }} 
            style={{ 
              background: "#475569", 
              color: "#ffffff", 
              border: "none", 
              borderRadius: "8px", 
              padding: "10px 18px", 
              fontWeight: "700", 
              fontSize: "13px", 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              gap: "6px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.08)",
              transition: "all 0.2s"
            }}
          >
            <i className="fas fa-print"></i>
            <span>Print Detail</span>
          </button>
          <button 
            onClick={() => {
              const url = `/print/customer?id=${rawId}&showPrice=1${isCompany ? '&type=company' : ''}`;
              window.open(url, '_blank');
            }} 
            style={{ 
              background: "#f97316", 
              color: "#ffffff", 
              border: "none", 
              borderRadius: "8px", 
              padding: "10px 18px", 
              fontWeight: "700", 
              fontSize: "13px", 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              gap: "6px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.08)",
              transition: "all 0.2s"
            }}
          >
            <i className="fas fa-print"></i>
            <span>Print with Price</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div 
        style={{ 
          display: "flex", 
          gap: "8px", 
          borderBottom: "2px solid #e2e8f0", 
          paddingBottom: "10px", 
          flexWrap: "wrap" 
        }}
      >
        {[
          { id: "overview", label: "Overview", badge: null },
          { id: "bookings", label: "Bookings", badge: stats.bookings },
          { id: "flights", label: "Flights", badge: stats.flights },
          { id: "trains", label: "Trains", badge: stats.trains },
          { id: "hotels", label: "Hotels", badge: stats.hotels },
          { id: "services", label: "Services", badge: stats.services },
          { id: "documents", label: "Documents", badge: documents.length }
        ].map((tab) => {
          const isSelected = activeProfileTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveProfileTab(tab.id);
                showToast(`Loaded tab: ${tab.label}`, "success");
              }}
              style={{
                background: isSelected ? "#3b82f6" : "#ffffff",
                color: isSelected ? "#ffffff" : "#475569",
                border: `1px solid ${isSelected ? "#2563eb" : "#cbd5e1"}`,
                borderRadius: "8px",
                padding: "8px 18px",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: isSelected ? "0 4px 10px rgba(59, 130, 246, 0.25)" : "none",
                transition: "all 0.15s"
              }}
            >
              <span>{tab.label}</span>
              {tab.badge !== null && (
                <span 
                  style={{ 
                    background: isSelected ? "rgba(255,255,255,0.25)" : "#f1f5f9", 
                    color: isSelected ? "#ffffff" : "#475569", 
                    borderRadius: "10px", 
                    padding: "2px 6px", 
                    fontSize: "11px", 
                    fontWeight: "800" 
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* MAIN TAB PANELS */}
      {activeProfileTab === "overview" && (
        /* FIXED LAYOUT PROBLEM: Locked left column width to 320px to prevent excessive horizontal stretching on widescreen monitors */
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "25px", alignItems: "start" }}>
          
          {/* Left Column: Customer Details Card */}
          <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            
            {/* Profile Card */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "20px" }}>
                <div 
                  style={{ 
                    width: "80px", 
                    height: "80px", 
                    borderRadius: "16px", 
                    background: "#3b82f6", 
                    color: "#ffffff", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    fontSize: "36px",
                    boxShadow: "0 8px 16px rgba(59, 130, 246, 0.2)" 
                  }}
                >
                  <i className="fas fa-user"></i>
                </div>
                <h3 style={{ margin: "10px 0 0 0", fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
                  {currentProfile.name}
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                  Joined: {currentProfile.meta.registeredDate ? formatDateOnly(currentProfile.meta.registeredDate) : "22 May, 2026"}
                </span>
              </div>

              {/* Contact listings */}
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.5px" }}>Primary Phone</span>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                      <i className="fas fa-phone" style={{ color: "#0f766e", marginRight: "8px" }}></i>
                      {currentProfile.phones[0]}
                    </span>
                    <button onClick={() => { navigator.clipboard.writeText(currentProfile.phones[0]); showToast("Copied phone!", "success"); }} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer" }}>
                      <i className="fas fa-copy"></i>
                    </button>
                  </div>
                </div>
                
                {currentProfile.phones[1] && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.5px" }}>Secondary Phone</span>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                        <i className="fas fa-phone-volume" style={{ color: "#3b82f6", marginRight: "8px" }}></i>
                        {currentProfile.phones[1]}
                      </span>
                      <button onClick={() => { navigator.clipboard.writeText(currentProfile.phones[1]); showToast("Copied phone!", "success"); }} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer" }}>
                        <i className="fas fa-copy"></i>
                      </button>
                    </div>
                  </div>
                )}

                {currentProfile.phones[2] && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.5px" }}>Alternative Phone</span>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                        <i className="fas fa-phone-flip" style={{ color: "#8b5cf6", marginRight: "8px" }}></i>
                        {currentProfile.phones[2]}
                      </span>
                      <button onClick={() => { navigator.clipboard.writeText(currentProfile.phones[2]); showToast("Copied phone!", "success"); }} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer" }}>
                        <i className="fas fa-copy"></i>
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "4px", borderTop: "1px solid #f1f5f9", paddingTop: "15px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.5px" }}>Email Address</span>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                    <i className="fas fa-envelope" style={{ color: "#ef4444", marginRight: "8px" }}></i>
                    {currentProfile.email === "No email provided" ? "N/A" : currentProfile.email}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.5px" }}>Linked Company</span>
                  {isCompany ? (
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                      <i className="fas fa-building" style={{ fontSize: "12px", color: "#64748b" }}></i>
                      {currentProfile.company}
                    </span>
                  ) : (
                    <a onClick={() => router.push("/admin/companies")} style={{ fontSize: "14px", fontWeight: "700", color: "#2563eb", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                      <i className="fas fa-building" style={{ fontSize: "12px" }}></i>
                      {currentProfile.company}
                    </a>
                  )}
                </div>

                {currentProfile.passportNo && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", borderTop: "1px solid #f1f5f9", paddingTop: "15px" }}>
                    <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.5px" }}>Passport Number</span>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                      <i className="fas fa-passport" style={{ color: "#eab308", marginRight: "8px" }}></i>
                      {currentProfile.passportNo}
                    </span>
                  </div>
                )}

                {currentProfile.hotelInfo && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "700", letterSpacing: "0.5px" }}>Hotel / Stay Info</span>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>
                      <i className="fas fa-hotel" style={{ color: "#3b82f6", marginRight: "8px" }}></i>
                      {currentProfile.hotelInfo}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* System Audit */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <h4 style={{ fontSize: "12px", textTransform: "uppercase", color: "#475569", fontWeight: "700", letterSpacing: "0.5px", margin: 0, paddingBottom: "8px", borderBottom: "1px solid #f1f5f9" }}>
                <i className="fas fa-shield-halved" style={{ marginRight: "6px" }}></i> System Audit
              </h4>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                <span style={{ fontWeight: "600", display: "block" }}>REGISTERED BY:</span>
                <span style={{ fontWeight: "700", color: "#1e293b" }}>
                  <i className="fas fa-user-circle" style={{ marginRight: "4px" }}></i> {currentProfile.meta.registeredBy}
                </span>
                <span style={{ display: "block", fontSize: "11px", color: "#94a3b8" }}>{currentProfile.meta.registeredDate}</span>
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", borderTop: "1px solid #f8fafc", paddingTop: "8px" }}>
                <span style={{ fontWeight: "600", display: "block" }}>LAST PROFILE UPDATE:</span>
                <span style={{ fontWeight: "700", color: "#1e293b" }}>
                  <i className="fas fa-user-pen" style={{ marginRight: "4px" }}></i> {currentProfile.meta.lastEditedBy}
                </span>
                <span style={{ display: "block", fontSize: "11px", color: "#94a3b8" }}>{currentProfile.meta.lastEditedDate}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Activity stats & Remarks Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            
            {/* Activity Summary Stats */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fas fa-chart-pie" style={{ color: "#3b82f6" }}></i> Activity Summary
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px" }}>
                {[
                  { label: "Total Bookings", val: stats.bookings, bg: "#eff6ff", text: "#1e40af", icon: "fa-calendar-days" },
                  { label: "Total Flights", val: stats.flights, bg: "#ecfeff", text: "#0891b2", icon: "fa-plane" },
                  { label: "Total Trains", val: stats.trains, bg: "#faf5ff", text: "#6b21a8", icon: "fa-train" },
                  { label: "Hotel Stays", val: stats.hotels, bg: "#fff7ed", text: "#c2410c", icon: "fa-hotel" },
                  { label: "Total Services", val: stats.services, bg: "#f0fdf4", text: "#166534", icon: "fa-bell" }
                ].map((stat, idx) => (
                  <div key={idx} style={{ background: stat.bg, borderRadius: "12px", padding: "15px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                    <i className={`fas ${stat.icon}`} style={{ color: stat.text, fontSize: "18px" }}></i>
                    <span style={{ fontSize: "22px", fontWeight: "800", color: stat.text }}>{stat.val}</span>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>{stat.label}</span>
                  </div>
                ))}
              </div>

              {/* Status Trackers (Linear indicators) */}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "15px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px" }}>
                {[
                  { label: "Pending", count: custBookings.filter(b => (b.status || "").toLowerCase() === "pending").length, color: "#d97706", bg: "#f59e0b" },
                  { label: "Confirmed", count: custBookings.filter(b => (b.status || "").toLowerCase() === "confirmed").length, color: "#2563eb", bg: "#3b82f6" },
                  { label: "Completed", count: custBookings.filter(b => (b.status || "").toLowerCase() === "completed").length, color: "#16a34a", bg: "#22c55e" },
                  { label: "Cancelled", count: custBookings.filter(b => (b.status || "").toLowerCase() === "cancelled").length, color: "#dc2626", bg: "#ef4444" }
                ].map((tracker, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "4px", height: "30px", background: tracker.bg, borderRadius: "2px" }}></div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>{tracker.label}</span>
                      <span style={{ fontSize: "13px", fontWeight: "800", color: tracker.color }}>{tracker.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Remarks Card */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fas fa-comment-dots" style={{ color: "#8b5cf6" }}></i> Account Remarks
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#94a3b8", display: "block", marginBottom: "6px" }}>External Notes</span>
                  <div style={{ background: "#f8fafc", padding: "12px 15px", borderRadius: "8px", border: "1px solid #f1f5f9", minHeight: "60px", fontSize: "13px", color: "#64748b" }}>
                    {currentProfile.externalRemarks || "No external notes linked."}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#ef4444", display: "block", marginBottom: "6px" }}>Internal Notes (Admin Only)</span>
                  <div style={{ background: "#fef2f2", padding: "12px 15px", borderRadius: "8px", border: "1px solid #fee2e2", minHeight: "60px", fontSize: "13px", color: "#b91c1c", fontWeight: "500" }}>
                    {currentProfile.internalRemarks || "No internal notes linked."}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* LISTS VIEW BY TAB */}
      {activeProfileTab !== "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          
          {/* Main List Table Widescreen Card */}
          <div className="table-card" style={{ padding: "20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", marginTop: 0, marginBottom: "15px", textTransform: "capitalize" }}>
              Registered {activeProfileTab} Details for {currentProfile.name}
            </h3>
            
            <div className="table-responsive">
              
              {activeProfileTab === "bookings" && (() => {
                const profileBookings = custBookings;
                return (
                  <table className="db-table" style={{ width: "100%" }}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Date & Time</th>
                        <th>Route</th>
                        <th>Vehicle</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profileBookings.length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>No bookings found for this customer.</td></tr>
                      ) : profileBookings.map((b: any) => (
                        <tr key={b.id}>
                          <td style={{ fontWeight: 700, color: "var(--primary-color)" }}>{b.id}</td>
                          <td>{formatDateTime(b.date, b.time)}</td>
                          <td style={{ fontWeight: 600 }}>{b.details}</td>
                          <td><span className="status-pill active" style={{ background: "#ecfeff", color: "#0891b2" }}>{b.vehicle}</span></td>
                          <td>
                            <span className={`status-pill ${
                              b.status === "Confirmed" || b.status === "confirmed" || b.status === "Completed" || b.status === "completed" ? "completed" :
                              b.status === "Cancelled" || b.status === "cancelled" ? "cancelled" : "pending"
                            }`}>
                              {(b.status || "PENDING").toUpperCase()}
                            </span>
                          </td>
                           <td>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                onClick={() => setSelectedProfileBooking({
                                  id: b.id,
                                  customerName: currentProfile.name,
                                  pickupDate: b.date,
                                  pickupTime: b.time,
                                  pickupLocation: b.details.split(" → ")[0] || "N/A",
                                  dropoffLocation: b.details.split(" → ")[1] || "N/A",
                                  vehicle: b.vehicle,
                                  finalPrice: b.finalPrice || 0,
                                  status: b.status || "Pending"
                                })}
                                title="View Details"
                                style={{ background: "#f1f5f9", border: "none", borderRadius: "6px", width: "30px", height: "30px", color: "#2563eb", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                              >
                                <i className="fas fa-eye" style={{ fontSize: "12px" }}></i>
                              </button>
                              {!isCompany && b.status === "Pending" && (
                                <button
                                  onClick={() => {
                                    setSelectedApproveBooking({
                                      id: b.id,
                                      customerName: currentProfile.name,
                                      pickupLocation: b.details.split(" → ")[0] || "N/A",
                                      dropoffLocation: b.details.split(" → ")[1] || "N/A",
                                      finalPrice: b.finalPrice || 0
                                    });
                                    setShowApproveModal(true);
                                  }}
                                  title="Confirm & Approve Booking"
                                  style={{ background: "#dcfce7", border: "none", borderRadius: "6px", width: "30px", height: "30px", color: "#16a34a", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                                >
                                  <i className="fas fa-check" style={{ fontSize: "12px" }}></i>
                                </button>
                              )}
                              {!isCompany && b.status !== "Cancelled" && (
                                <button
                                  onClick={() => {
                                    setSelectedCancelBooking({
                                      id: b.id,
                                      customerName: currentProfile.name,
                                      pickupLocation: b.details.split(" → ")[0] || "N/A",
                                      dropoffLocation: b.details.split(" → ")[1] || "N/A",
                                      finalPrice: b.finalPrice || 0
                                    });
                                    setShowCancelModal(true);
                                  }}
                                  title="Cancel & Refund Booking"
                                  style={{ background: "#fee2e2", border: "none", borderRadius: "6px", width: "30px", height: "30px", color: "#ef4444", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                                >
                                  <i className="fas fa-ban" style={{ fontSize: "12px" }}></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}

              {activeProfileTab === "flights" && (
                <table className="db-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Flight ID</th>
                      <th>Type</th>
                      <th>Flight #</th>
                      <th>Route</th>
                      <th>Date & Time</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {custFlights.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>No flights found for this customer.</td></tr>
                    ) : custFlights.map((f: any) => (
                      <tr key={f.id}>
                        <td style={{ fontWeight: 700 }}>{f.id}</td>
                        <td><span className="status-pill active" style={{ background: "#eff6ff", color: "#1e40af" }}>{f.leg}</span></td>
                        <td style={{ fontWeight: 700 }}>{f.flightNo}</td>
                        <td style={{ fontWeight: 600 }}>{f.route}</td>
                        <td>{formatDateTime(f.date, f.time)}</td>
                        <td>
                          <span className={`status-pill ${f.status === "On Time" || f.status === "on time" ? "completed" : "pending"}`}>
                            {(f.status || "SCHEDULED").toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => setSelectedProfileFlight({
                              id: f.id,
                              type: f.leg,
                              flightNo: f.flightNo,
                              airline: "N/A",
                              sector: f.route,
                              dateTime: formatDateTime(f.date, f.time),
                              status: f.status
                            })}
                            style={{ background: "#f1f5f9", border: "none", borderRadius: "6px", width: "30px", height: "30px", color: "#3b82f6", cursor: "pointer" }}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeProfileTab === "trains" && (
                <table className="db-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Train ID</th>
                      <th>Date & Time</th>
                      <th>Route</th>
                      <th>Train # / Leg</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {custTrains.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>No trains found for this customer.</td></tr>
                    ) : custTrains.map((t: any) => {
                      const trainDateTime = t.dateTime || (t.date ? formatDateTime(t.date, t.time) : "N/A");
                      const trainAllocation = t.allocation || (t.train_no ? `${t.train_no}${t.class ? ` (${t.class})` : t.leg ? ` (${t.leg})` : ""}` : "N/A");
                      return (
                        <tr key={t.id}>
                          <td style={{ fontWeight: 700 }}>{t.id}</td>
                          <td>{trainDateTime}</td>
                          <td style={{ fontWeight: 600 }}>{t.route}</td>
                          <td>{trainAllocation}</td>
                          <td>
                            <span className={`status-pill ${t.status === "Confirmed" || t.status === "confirmed" ? "completed" : "pending"}`}>
                              {(t.status || "SCHEDULED").toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => setSelectedProfileTrain({
                                id: t.id,
                                dateTime: trainDateTime,
                                route: t.route,
                                allocation: trainAllocation,
                                classType: t.classType || t.class || "Standard",
                                pricing: t.pricing || "SAR 0.00",
                                status: t.status
                              })}
                              style={{ background: "#f1f5f9", border: "none", borderRadius: "6px", width: "30px", height: "30px", color: "#8b5cf6", cursor: "pointer" }}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {activeProfileTab === "services" && (() => {
                const profileServices = custServices;
                return (
                  <table className="db-table" style={{ width: "100%" }}>
                    <thead>
                      <tr>
                        <th>Service ID</th>
                        <th>Service Date</th>
                        <th>Service Name</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profileServices.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>No services found for this customer.</td></tr>
                      ) : profileServices.map((s: any) => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 700 }}>{s.id}</td>
                          <td>{formatDateOnly(s.date)}</td>
                          <td style={{ fontWeight: 600 }}>{s.details}</td>
                          <td>
                            <span className={`status-pill ${s.status === "Active" || s.status === "active" ? "completed" : "pending"}`}>
                              {(s.status || "PENDING").toUpperCase()}
                            </span>
                          </td>
                          <td>
                            {!isCompany && (
                              <button
                                onClick={() => router.push(`/admin/services/view?id=${s.id}`)}
                                style={{ background: "#e0f2fe", border: "none", borderRadius: "6px", width: "30px", height: "30px", color: "#0284c7", cursor: "pointer" }}
                                title="View Details"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}

              {activeProfileTab === "hotels" && (() => {
                const profileHotels = custHotels || [];
                return (
                  <table className="db-table" style={{ width: "100%" }}>
                    <thead>
                      <tr>
                        <th>Hotel ID</th>
                        <th>Hotel Name</th>
                        <th>City</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profileHotels.length === 0 ? (
                        <tr><td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>No hotel stays found for this customer.</td></tr>
                      ) : profileHotels.map((h: any) => {
                        const checkInVal = h.checkIn || h.check_in;
                        const checkOutVal = h.checkOut || h.check_out;
                        const checkInFormatted = checkInVal ? formatDateOnly(checkInVal) : "N/A";
                        const checkOutFormatted = checkOutVal ? formatDateOnly(checkOutVal) : "N/A";
                        return (
                          <tr key={h.id}>
                            <td style={{ fontWeight: 700 }}>{h.id}</td>
                            <td style={{ fontWeight: 700 }}>{h.name || h.hotel_name || "N/A"}</td>
                            <td style={{ fontWeight: 600 }}>{h.city || "N/A"}</td>
                            <td>{checkInFormatted}</td>
                            <td>{checkOutFormatted}</td>
                            <td>
                              <span className={`status-pill ${h.active || h.status === "Active" || h.status === "ACTIVE" ? "completed" : "pending"}`}>
                                {h.active || h.status === "Active" || h.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => setSelectedProfileHotel({
                                  id: h.id,
                                  name: h.name || h.hotel_name || "N/A",
                                  city: h.city || "N/A",
                                  checkIn: checkInFormatted,
                                  checkOut: checkOutFormatted,
                                  status: h.active || h.status === "Active" || h.status === "ACTIVE" ? "Active" : "Inactive"
                                })}
                                style={{ background: "#eff6ff", border: "none", borderRadius: "6px", width: "30px", height: "30px", color: "#f97316", cursor: "pointer" }}
                                title="View Details"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}

              {activeProfileTab === "documents" && (() => {
                return (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                      <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#475569" }}>
                         Pilgrim Documents &amp; Identity Scans
                      </h4>
                      <button
                        onClick={() => router.push(`${basePath}/documents/upload?customerId=${rawId}`)}
                        style={{
                          background: isCompany ? "linear-gradient(135deg, #d4af37 0%, #b48a1d 100%)" : "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                          color: isCompany ? "#0f172a" : "#ffffff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 16px",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        <i className="fas fa-plus"></i> Upload New Document
                      </button>
                    </div>

                    {loadingDocs ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px" }}>
                        <div className="spinner" style={{ width: "32px", height: "32px", borderWidth: "3px", borderTopColor: isCompany ? "#d4af37" : "#7c3aed", marginBottom: "12px" }}></div>
                        <span style={{ fontSize: "13px", color: "#64748b" }}>Loading documents...</span>
                      </div>
                    ) : documents.length === 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", color: "#64748b", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
                        <i className="fas fa-folder-open" style={{ fontSize: "36px", color: "#cbd5e1", marginBottom: "12px" }}></i>
                        <span style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>No documents uploaded for this pilgrim yet.</span>
                        <p style={{ fontSize: "12px", color: "#94a3b8", margin: "4px 0 0 0" }}>Upload visa, passport copies, or vouchers directly under this customer.</p>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        {documents.map((doc: any) => {
                          const isPdf = doc.file_type?.toLowerCase() === "pdf";
                          const docUrl = getFileUrl(doc.file_path);
                          return (
                            <div
                              key={doc.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "14px 18px",
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                                transition: "all 0.15s"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{
                                  width: "42px",
                                  height: "42px",
                                  borderRadius: "6px",
                                  background: isPdf ? "#fee2e2" : "#e0f2fe",
                                  color: isPdf ? "#ef4444" : "#0284c7",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "20px"
                                }}>
                                  <i className={isPdf ? "fas fa-file-pdf" : "fas fa-file-image"}></i>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>{doc.title}</span>
                                  <span style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                    Uploaded by {doc.uploaded_by || "User"} • {new Date(doc.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewerDoc(doc);
                                    setViewerOpen(true);
                                  }}
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "6px",
                                    background: "#ffffff",
                                    border: "1px solid #e2e8f0",
                                    color: "#475569",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    transition: "all 0.15s"
                                  }}
                                  title="View Document"
                                >
                                  <i className="fas fa-eye" style={{ fontSize: "12px" }}></i>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    downloadFile(doc.file_path);
                                  }}
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "6px",
                                    background: "#ffffff",
                                    border: "1px solid #e2e8f0",
                                    color: "#059669",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    transition: "all 0.15s"
                                  }}
                                  title="Download"
                                >
                                  <i className="fas fa-download" style={{ fontSize: "12px" }}></i>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDocToDelete(doc.id);
                                    setDeleteConfirmOpen(true);
                                  }}
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "6px",
                                    background: "#fee2e2",
                                    border: "1px solid #fecaca",
                                    color: "#dc2626",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    transition: "all 0.15s"
                                  }}
                                  title="Delete"
                                >
                                  <i className="fas fa-trash-can" style={{ fontSize: "12px" }}></i>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          </div>
        </div>
      )}

      {/* Bottom Quick Action Panel */}
      <div 
        style={{ 
          display: "flex", 
          gap: "10px", 
          background: "#ffffff", 
          border: "1px solid #e2e8f0", 
          borderRadius: "16px", 
          padding: "15px 20px", 
          flexWrap: "wrap",
          justifyContent: "space-between",
          boxShadow: "0 4px 10px rgba(0,0,0,0.02)",
          marginBottom: "25px"
        }}
      >
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={() => handleActionClick("Welcome Message")} style={{ background: "#22c55e", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 15px", fontWeight: "700", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="fab fa-whatsapp"></i> Welcome Message
          </button>
          <button onClick={() => router.push(`${basePath}/bookings/add?customerId=${rawId}`)} style={{ background: "#3b82f6", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 15px", fontWeight: "700", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="fas fa-calendar-plus"></i> Add Booking
          </button>
          <button onClick={() => router.push(`${basePath}/flights/add?customerId=${rawId}`)} style={{ background: "#0ea5e9", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 15px", fontWeight: "700", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="fas fa-plane"></i> Add Flight
          </button>
          <button onClick={() => router.push(`${basePath}/trains/add?customerId=${rawId}`)} style={{ background: "#a855f7", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 15px", fontWeight: "700", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="fas fa-train"></i> Add Train
          </button>
          <button onClick={() => router.push(`${basePath}/hotels/assignments/add?customerId=${rawId}`)} style={{ background: "#f97316", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 15px", fontWeight: "700", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="fas fa-hotel"></i> Add Hotel
          </button>
          <button onClick={() => router.push(`${basePath}/services/add?customerId=${rawId}`)} style={{ background: "#8b5cf6", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 15px", fontWeight: "700", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="fas fa-bell"></i> Add Service
          </button>
          <button onClick={() => router.push(`${basePath}/documents/upload?customerId=${rawId}`)} style={{ background: "#ec4899", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 15px", fontWeight: "700", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="fas fa-file-arrow-up"></i> Upload Document
          </button>
        </div>
        
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={() => {
            const url = `/print/customer?id=${rawId}&showPrice=0${isCompany ? '&type=company' : ''}`;
            window.open(url, '_blank');
          }} style={{ background: "#475569", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 15px", fontWeight: "700", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="fas fa-print"></i> Print Detail
          </button>
          <button onClick={() => {
            const url = `/print/customer?id=${rawId}&showPrice=1${isCompany ? '&type=company' : ''}`;
            window.open(url, '_blank');
          }} style={{ background: "#f97316", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 15px", fontWeight: "700", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="fas fa-print"></i> Print with Price
          </button>
        </div>
      </div>

      {/* Global Audit Trail for Customer View */}
      <div className="table-card" style={{ padding: "20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#1e293b", margin: "0 0 15px 0", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
          <i className="fas fa-history" style={{ color: "#64748b", marginRight: "6px" }}></i> Audit Trail & Activity History
        </h3>
        <div className="table-responsive">
          <table className="db-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700" }}>Datetime</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700" }}>Action By</th>
                <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700" }}>Remark</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>22 May, 2026 09:59 PM</td>
                <td style={{ fontWeight: 600 }}>{currentProfile.meta.lastEditedBy || "hebacab"}</td>
                <td style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span>Updated customer profile: {currentProfile.name}</span>
                  <span onClick={() => showToast("Loading detailed audit log changeset...", "success")} style={{ color: "#2563eb", cursor: "pointer", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <i className="fas fa-circle-info"></i> View Detailed Changes
                  </span>
                </td>
              </tr>
              <tr>
                <td>22 May, 2026 08:32 PM</td>
                <td style={{ fontWeight: 600 }}>{currentProfile.meta.registeredBy || "hebacab"}</td>
                <td>Added new customer: {currentProfile.name} ({currentProfile.phones[0]})</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* View Haramain Booking Details Modal */}
      {selectedProfileBooking && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "550px", margin: "20px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "15px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--primary-color)", margin: 0 }}><i className="fas fa-file-invoice"></i> Haramain Booking Details ({selectedProfileBooking.id})</h3>
              <button onClick={() => setSelectedProfileBooking(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>&times;</button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Customer Name</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileBooking.customerName}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Car/Vehicle Model</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileBooking.vehicle}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Pickup Date</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileBooking.pickupDate}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Pickup Time</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileBooking.pickupTime}</span>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Route Mapping</span>
                <span style={{ fontSize: "14px", fontWeight: "600" }}>{selectedProfileBooking.pickupLocation} &rarr; {selectedProfileBooking.dropoffLocation}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Billing Value</span>
                <span style={{ fontSize: "15px", fontWeight: "700", color: "#16a34a" }}>SAR {selectedProfileBooking.finalPrice.toFixed(2)}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Tracking Status</span>
                <span className={`status-pill ${selectedProfileBooking.status.toLowerCase()}`}>{selectedProfileBooking.status}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-color)", paddingTop: "15px" }}>
              <button onClick={() => setSelectedProfileBooking(null)} className="form-btn-back" style={{ background: "#f1f5f9", color: "#475569", width: "120px", justifyContent: "center" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* View Flight Details Modal */}
      {selectedProfileFlight && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "550px", margin: "20px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "15px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--primary-color)", margin: 0 }}><i className="fas fa-plane"></i> Flight Details ({selectedProfileFlight.id})</h3>
              <button onClick={() => setSelectedProfileFlight(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>&times;</button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Flight Number</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileFlight.flightNo}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Leg / Type</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileFlight.type}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Airline</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileFlight.airline}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Sector / Route</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileFlight.sector}</span>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Scheduled Date & Time</span>
                <span style={{ fontSize: "14px", fontWeight: "600" }}>{selectedProfileFlight.dateTime}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Tracking Status</span>
                <span className={`status-pill ${selectedProfileFlight.status === "ON TIME" ? "completed" : "pending"}`}>{selectedProfileFlight.status}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-color)", paddingTop: "15px" }}>
              <button onClick={() => setSelectedProfileFlight(null)} className="form-btn-back" style={{ background: "#f1f5f9", color: "#475569", width: "120px", justifyContent: "center" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* View Train Details Modal */}
      {selectedProfileTrain && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "550px", margin: "20px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "15px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--primary-color)", margin: 0 }}><i className="fas fa-train"></i> Train Ticket Details ({selectedProfileTrain.id})</h3>
              <button onClick={() => setSelectedProfileTrain(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>&times;</button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Scheduled Date & Time</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileTrain.dateTime}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Sector / Route</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileTrain.route}</span>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Train # / Car / Seats</span>
                <span style={{ fontSize: "14px", fontWeight: "600" }}>{selectedProfileTrain.allocation}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Class</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileTrain.classType}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Pricing</span>
                <span style={{ fontSize: "15px", fontWeight: "700", color: "#16a34a" }}>{selectedProfileTrain.pricing}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Status</span>
                <span className={`status-pill ${selectedProfileTrain.status === "CONFIRMED" ? "completed" : "pending"}`}>{selectedProfileTrain.status}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-color)", paddingTop: "15px" }}>
              <button onClick={() => setSelectedProfileTrain(null)} className="form-btn-back" style={{ background: "#f1f5f9", color: "#475569", width: "120px", justifyContent: "center" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* View Hotel Details Modal */}
      {selectedProfileHotel && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "550px", margin: "20px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "15px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--primary-color)", margin: 0 }}>
                <i className="fas fa-hotel"></i> Hotel Stay Details ({selectedProfileHotel.id})
              </h3>
              <button onClick={() => setSelectedProfileHotel(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>&times;</button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div style={{ gridColumn: "span 2" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Hotel Name</span>
                <span style={{ fontSize: "16px", fontWeight: "700" }}>{selectedProfileHotel.name}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>City</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileHotel.city}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Status</span>
                <span className={`status-pill ${selectedProfileHotel.status === "Active" ? "completed" : "pending"}`}>{selectedProfileHotel.status}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Check-in Date</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileHotel.checkIn || "N/A"}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Check-out Date</span>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedProfileHotel.checkOut || "N/A"}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-color)", paddingTop: "15px" }}>
              <button onClick={() => setSelectedProfileHotel(null)} className="form-btn-back" style={{ background: "#f1f5f9", color: "#475569", width: "120px", justifyContent: "center" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Confirm & Approve Modal */}
      {showApproveModal && selectedApproveBooking && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "90%",
            maxWidth: "480px",
            padding: "24px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            border: "1px solid #e2e8f0",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{
                background: "#dcfce7",
                color: "#16a34a",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}>
                <i className="fas fa-check-circle"></i>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                Approve &amp; Confirm Booking
              </h3>
            </div>

            <div style={{ fontSize: "14px", color: "#475569", marginBottom: "20px", lineHeight: "1.5" }}>
              <p style={{ margin: "0 0 12px 0" }}>
                Are you sure you want to approve booking <strong style={{ color: "#0f172a" }}>{selectedApproveBooking.id}</strong> for <strong style={{ color: "#0f172a" }}>{selectedApproveBooking.customerName}</strong>?
              </p>
              <div style={{
                background: "#f8fafc",
                borderRadius: "8px",
                padding: "12px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Route:</span>
                  <span style={{ fontWeight: "600" }}>{selectedApproveBooking.pickupLocation} → {selectedApproveBooking.dropoffLocation}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Fare Price:</span>
                  <span style={{ fontWeight: "600" }}>SAR {Number(selectedApproveBooking.finalPrice).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedApproveBooking(null);
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#334155",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
              >
                No, Keep Pending
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setShowApproveModal(false);
                    const res = await api.updateBooking(selectedApproveBooking.id, { status: "Confirmed Booking" });
                    if (res?.success) {
                      showToast(`Booking ${selectedApproveBooking.id} approved & confirmed successfully!`, "success");
                      setTimeout(() => {
                        window.location.reload();
                      }, 1000);
                    } else {
                      showToast(res?.error || "Failed to approve booking.", "error");
                    }
                  } catch (err) {
                    console.error(err);
                    showToast("Error approving booking.", "error");
                  } finally {
                    setSelectedApproveBooking(null);
                  }
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#16a34a",
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
              >
                Yes, Approve &amp; Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Cancel & Refund Modal */}
      {showCancelModal && selectedCancelBooking && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "90%",
            maxWidth: "480px",
            padding: "24px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            border: "1px solid #e2e8f0",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{
                background: "#fee2e2",
                color: "#ef4444",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}>
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                Cancel &amp; Refund Booking
              </h3>
            </div>

            <div style={{ fontSize: "14px", color: "#475569", marginBottom: "20px", lineHeight: "1.5" }}>
              <p style={{ margin: "0 0 12px 0" }}>
                Are you sure you want to cancel booking <strong style={{ color: "#0f172a" }}>{selectedCancelBooking.id}</strong>? This action will automatically refund the B2B agent's ledger.
              </p>
              <div style={{
                background: "#f8fafc",
                borderRadius: "8px",
                padding: "12px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Route:</span>
                  <span style={{ fontWeight: "600" }}>{selectedCancelBooking.pickupLocation} → {selectedCancelBooking.dropoffLocation}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Refund Amount:</span>
                  <span style={{ fontWeight: "700", color: "#16a34a" }}>SAR {Number(selectedCancelBooking.finalPrice).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedCancelBooking(null);
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#334155",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
              >
                No, Keep Booking
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setShowCancelModal(false);
                    const res = await api.updateBooking(selectedCancelBooking.id, { status: "Cancelled" });
                    if (res?.success) {
                      showToast(`Booking ${selectedCancelBooking.id} cancelled & refunded successfully!`, "success");
                      setTimeout(() => {
                        window.location.reload();
                      }, 1000);
                    } else {
                      showToast(res?.error || "Failed to cancel booking.", "error");
                    }
                  } catch (err) {
                    console.error(err);
                    showToast("Error cancelling booking.", "error");
                  } finally {
                    setSelectedCancelBooking(null);
                  }
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#ef4444",
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
              >
                Yes, Cancel &amp; Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {viewerOpen && viewerDoc && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "90%",
            maxWidth: "800px",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "16px 24px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#f8fafc"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: viewerDoc.file_type?.toLowerCase() === "pdf" ? "#fee2e2" : "#e0f2fe",
                  color: viewerDoc.file_type?.toLowerCase() === "pdf" ? "#ef4444" : "#0284c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px"
                }}>
                  <i className={viewerDoc.file_type?.toLowerCase() === "pdf" ? "fas fa-file-pdf" : "fas fa-file-image"}></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>{viewerDoc.title}</h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#64748b" }}>
                    Type: {viewerDoc.file_type?.toUpperCase()} • Uploaded by {viewerDoc.uploaded_by || "User"}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    downloadFile(viewerDoc.file_path);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#10b981",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 14px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                >
                  <i className="fas fa-download"></i> Download
                </button>
                <button
                  type="button"
                  onClick={() => { setViewerOpen(false); setViewerDoc(null); }}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "8px",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: "24px",
              overflowY: "auto",
              background: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              minHeight: "350px"
            }}>
              {(() => {
                const ext = viewerDoc.file_type?.toLowerCase();
                const url = getFileUrl(viewerDoc.file_path);

                if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
                  return (
                    <img
                      src={url}
                      alt={viewerDoc.title}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "65vh",
                        objectFit: "contain",
                        borderRadius: "8px",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
                      }}
                    />
                  );
                } else if (ext === "pdf") {
                  return (
                    <iframe
                      src={url}
                      style={{
                        width: "100%",
                        height: "65vh",
                        border: "none",
                        borderRadius: "8px",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
                      }}
                    />
                  );
                } else {
                  return (
                    <div style={{
                      background: "#ffffff",
                      borderRadius: "12px",
                      padding: "30px 40px",
                      textAlign: "center",
                      maxWidth: "400px",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
                    }}>
                      <div style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        background: "#fef3c7",
                        color: "#d97706",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        margin: "0 auto 16px auto"
                      }}>
                        <i className="fas fa-file-lines"></i>
                      </div>
                      <h4 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "16px", fontWeight: "700" }}>
                        Preview Not Available
                      </h4>
                      <p style={{ margin: "0 0 20px 0", color: "#64748b", fontSize: "13px", lineHeight: "1.5" }}>
                        Direct preview is not supported for <strong>.{ext.toUpperCase()}</strong> files. Please download the file to view it on your device.
                      </p>
                      <button
                        type="button"
                        onClick={() => downloadFile(viewerDoc.file_path)}
                        style={{
                          background: isCompany ? "#d4af37" : "#7c3aed",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "10px 20px",
                          fontSize: "13px",
                          fontWeight: "700",
                          cursor: "pointer",
                          width: "100%",
                          boxShadow: isCompany ? "0 4px 10px rgba(212, 175, 55, 0.3)" : "0 4px 10px rgba(124, 58, 237, 0.3)"
                        }}
                      >
                        <i className="fas fa-download" style={{ marginRight: "8px" }}></i> Download Document
                      </button>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}

      {deleteConfirmOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          padding: "20px"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "90%",
            maxWidth: "420px",
            padding: "24px",
            textAlign: "center",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "#fee2e2",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              margin: "0 auto 16px auto"
            }}>
              <i className="fas fa-triangle-exclamation"></i>
            </div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
              Delete Document?
            </h3>
            <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>
              Are you sure you want to permanently delete this document? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDocToDelete(null);
                }}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#475569",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "background 0.15s"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (docToDelete) {
                    await handleDeleteDoc(docToDelete);
                  }
                  setDeleteConfirmOpen(false);
                  setDocToDelete(null);
                }}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#ef4444",
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  boxShadow: "0 4px 10px rgba(239, 68, 68, 0.2)"
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Customer Profile Confirmation Modal */}
      {showDeleteCustomerModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          padding: "20px"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "90%",
            maxWidth: "420px",
            padding: "28px 24px",
            textAlign: "center",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            borderTop: "6px solid #ef4444"
          }}>
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "#fee2e2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
              margin: "0 auto 16px auto"
            }}>
              <i className="fas fa-triangle-exclamation"></i>
            </div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "19px", fontWeight: "700", color: "#0f172a" }}>
              Delete Customer Profile?
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>
              Are you sure you want to delete customer <strong style={{ color: "#1e293b" }}>"{currentProfile?.name || 'this customer'}"</strong>? This action cannot be undone.
            </p>
            <div style={{
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              borderRadius: "10px",
              padding: "14px 16px",
              margin: "0 0 24px 0",
              textAlign: "left",
              display: "flex",
              gap: "12px"
            }}>
              <i className="fas fa-circle-exclamation" style={{ color: "#e11d48", fontSize: "18px", marginTop: "2px" }}></i>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontWeight: "700", color: "#9f1239", fontSize: "13px" }}>
                  All Associated Data Will Be Removed
                </span>
                <span style={{ color: "#e11d48", fontSize: "12px", lineHeight: "1.4" }}>
                  This will permanently delete all bookings, flights, hotels, trains, services, and invoices linked to this customer.
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setShowDeleteCustomerModal(false)}
                disabled={isDeletingProfile}
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCustomerProfile}
                disabled={isDeletingProfile}
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  color: "#ffffff",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: isDeletingProfile ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 6px -1px rgba(239, 68, 68, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                {isDeletingProfile ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash-can"></i>
                    <span>Delete Customer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
