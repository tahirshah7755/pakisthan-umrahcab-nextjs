"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/utils/api";
import { formatDateOnly, formatTimeOnly } from "@/utils/formatters";

function parseNotes(notesStr: string, carPrice: number) {
  const result = {
    tripPackage: "",
    vehicle: "",
    adults: 0,
    childrenCount: 0,
    timingStatus: "Confirmed",
    bags: 0,
    priceBeforeDiscount: carPrice,
    discount: 0,
    discountReason: "",
    tafweejRequired: false,
    cashToReceive: 0,
    paymentMethod: "Credit",
    receivedAmount: "",
    pendingAmount: "",
    internalNotes: "",
    externalNotes: "",
    documents: [] as { name: string; url: string }[],
  };

  if (!notesStr) return result;

  const parts = notesStr.split(" | ");
  let matchedCount = 0;

  parts.forEach((part) => {
    const cleanPart = part.trim();
    if (cleanPart.startsWith("Route:")) {
      result.tripPackage = cleanPart.substring("Route:".length).trim();
      matchedCount++;
    } else if (cleanPart.startsWith("Vehicle:")) {
      result.vehicle = cleanPart.substring("Vehicle:".length).trim();
      matchedCount++;
    } else if (cleanPart.startsWith("Passengers:")) {
      const pStr = cleanPart.substring("Passengers:".length).trim();
      result.adults = parseInt(pStr) || 0;
      matchedCount++;
    } else if (cleanPart.startsWith("Timing Status:")) {
      result.timingStatus = cleanPart.substring("Timing Status:".length).trim();
      matchedCount++;
    } else if (cleanPart.startsWith("Bags:")) {
      result.bags = parseInt(cleanPart.substring("Bags:".length).trim()) || 0;
      matchedCount++;
    } else if (cleanPart.startsWith("Price Before Discount:")) {
      result.priceBeforeDiscount = parseFloat(cleanPart.substring("Price Before Discount:".length).trim()) || 0;
      matchedCount++;
    } else if (cleanPart.startsWith("Discount:")) {
      result.discount = parseFloat(cleanPart.substring("Discount:".length).trim()) || 0;
      matchedCount++;
    } else if (cleanPart.startsWith("Discount Reason:")) {
      result.discountReason = cleanPart.substring("Discount Reason:".length).trim();
      matchedCount++;
    } else if (cleanPart.startsWith("Tafweej Required:")) {
      result.tafweejRequired = cleanPart.substring("Tafweej Required:".length).trim().toLowerCase() === "yes";
      matchedCount++;
    } else if (cleanPart.startsWith("Cash to Receive:")) {
      result.cashToReceive = parseFloat(cleanPart.substring("Cash to Receive:".length).trim()) || 0;
      matchedCount++;
    } else if (cleanPart.startsWith("Payment Method:")) {
      result.paymentMethod = cleanPart.substring("Payment Method:".length).trim();
      matchedCount++;
    } else if (cleanPart.startsWith("Received Amount:")) {
      result.receivedAmount = cleanPart.substring("Received Amount:".length).trim();
      matchedCount++;
    } else if (cleanPart.startsWith("Pending Amount:")) {
      result.pendingAmount = cleanPart.substring("Pending Amount:".length).trim();
      matchedCount++;
    } else if (cleanPart.startsWith("Internal Notes:")) {
      result.internalNotes = cleanPart.substring("Internal Notes:".length).trim();
      matchedCount++;
    } else if (cleanPart.startsWith("External Notes:")) {
      result.externalNotes = cleanPart.substring("External Notes:".length).trim();
      matchedCount++;
    } else if (cleanPart.startsWith("Documents:")) {
      const docStr = cleanPart.substring("Documents:".length).trim();
      if (docStr) {
        result.documents = docStr.split(",").map(d => {
          const idx = d.lastIndexOf("::");
          if (idx !== -1) {
            return { name: d.substring(0, idx), url: d.substring(idx + 2) };
          }
          return { name: "Document", url: d };
        }).filter(d => d.url);
      }
      matchedCount++;
    }
  });

  if (matchedCount < 2) {
    result.externalNotes = notesStr;
  }

  return result;
}

function serializeNotes(parsed: any, documents: { name: string; url: string }[]) {
  const parts = [];
  if (parsed.tripPackage) parts.push(`Route: ${parsed.tripPackage}`);
  if (parsed.vehicle) parts.push(`Vehicle: ${parsed.vehicle}`);
  if (parsed.adults) parts.push(`Passengers: ${parsed.adults}`);
  if (parsed.timingStatus) parts.push(`Timing Status: ${parsed.timingStatus}`);
  if (parsed.bags) parts.push(`Bags: ${parsed.bags}`);
  if (parsed.priceBeforeDiscount) parts.push(`Price Before Discount: ${parsed.priceBeforeDiscount}`);
  if (parsed.discount !== undefined) parts.push(`Discount: ${parsed.discount}`);
  if (parsed.discountReason) parts.push(`Discount Reason: ${parsed.discountReason}`);
  if (parsed.tafweejRequired) parts.push(`Tafweej Required: ${parsed.tafweejRequired ? "yes" : "no"}`);
  if (parsed.cashToReceive) parts.push(`Cash to Receive: ${parsed.cashToReceive}`);
  if (parsed.paymentMethod) parts.push(`Payment Method: ${parsed.paymentMethod}`);
  if (parsed.receivedAmount) parts.push(`Received Amount: ${parsed.receivedAmount}`);
  if (parsed.pendingAmount) parts.push(`Pending Amount: ${parsed.pendingAmount}`);
  if (parsed.internalNotes) parts.push(`Internal Notes: ${parsed.internalNotes}`);
  if (parsed.externalNotes) parts.push(`External Notes: ${parsed.externalNotes}`);
  if (documents && documents.length > 0) {
    const docStr = documents.map(d => `${d.name.replace(/::/g, "").replace(/,/g, "")}::${d.url}`).join(",");
    parts.push(`Documents: ${docStr}`);
  }
  return parts.join(" | ");
}

function BookingViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetId = searchParams.get("id") || "";

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any | null>(null);
  const [customerObj, setCustomerObj] = useState<any | null>(null);

  // Customer activity lists
  const [activeTab, setActiveTab] = useState("overview");
  const [custBookings, setCustBookings] = useState<any[]>([]);
  const [custFlights, setCustFlights] = useState<any[]>([]);
  const [custTrains, setCustTrains] = useState<any[]>([]);
  const [custHotels, setCustHotels] = useState<any[]>([]);
  const [custServices, setCustServices] = useState<any[]>([]);

  // Document scanning/upload states
  const [cameraActive, setCameraActive] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [uploading, setUploading] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    const loadBookingData = async () => {
      if (!targetId) return;
      try {
        setLoading(true);
        const result = await api.getBooking(targetId);
        if (result) {
          setBooking(result);
          if (result.customer_id) {
            const custRes = await api.getCustomer(result.customer_id);
            if (custRes) {
              if (custRes.customer) {
                setCustomerObj(custRes.customer);
                setCustBookings(Array.isArray(custRes.bookings) ? custRes.bookings : []);
                setCustFlights(Array.isArray(custRes.flights) ? custRes.flights : []);
                setCustTrains(Array.isArray(custRes.trains) ? custRes.trains : []);
                setCustHotels(Array.isArray(custRes.hotels) ? custRes.hotels : []);
                setCustServices(Array.isArray(custRes.services) ? custRes.services : []);
              } else {
                setCustomerObj(custRes);
              }
            }
          }
        } else {
          showToast("Booking details not found.", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("Error loading booking details.", "error");
      } finally {
        setLoading(false);
      }
    };

    loadBookingData();
  }, [targetId]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #d4af37", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!booking) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h3 style={{ color: "#0f172a" }}>Booking Details Not Found</h3>
        <button onClick={() => router.push("/company/bookings")} className="form-btn-back" style={{ marginTop: "15px", background: "#d4af37", color: "#0f172a", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>
          Back to Bookings
        </button>
      </div>
    );
  }

  const parsed = parseNotes(booking.notes, parseFloat(booking.car_price || 0));

  // Start Camera
  const startCamera = async () => {
    try {
      setCameraActive(true);
      setTimeout(async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        }
      }, 300);
    } catch (err) {
      console.error("Camera access failed:", err);
      showToast("Could not access camera. Please upload file instead.", "error");
      setCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Capture Photo
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const name = documentName.trim() || "Scanned Document";
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `${name.toLowerCase().replace(/\s+/g, "_")}.jpg`, { type: "image/jpeg" });
          stopCamera();
          await uploadFile(file, name);
        }
      }, "image/jpeg", 0.9);
    }
  };

  // File Upload
  const handleFileUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const name = documentName.trim() || file.name;
    await uploadFile(file, name);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadFile = async (file: File, name: string) => {
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      
      const res = await api.uploadCompanyDocument(fd);
      if (res && res.success) {
        showToast("Document uploaded and attached successfully!", "success");
        setDocumentName("");
        
        const currentDocs = parsed.documents || [];
        const newDocs = [...currentDocs, { name, url: res.url }];
        const newNotes = serializeNotes(parsed, newDocs);
        
        const updateRes = await api.updateBooking(booking.id, {
          ...booking,
          notes: newNotes
        });
        
        if (updateRes.success) {
          setBooking((prev: any) => ({ ...prev, notes: newNotes }));
        } else {
          showToast("Failed to link document to booking.", "error");
        }
      } else {
        showToast(res?.message || "Failed to upload document to server.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error uploading file.", "error");
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (indexToDelete: number) => {
    try {
      setUploading(true);
      const currentDocs = parsed.documents || [];
      const newDocs = currentDocs.filter((_, idx) => idx !== indexToDelete);
      const newNotes = serializeNotes(parsed, newDocs);
      
      const updateRes = await api.updateBooking(booking.id, {
        ...booking,
        notes: newNotes
      });
      
      if (updateRes.success) {
        setBooking((prev: any) => ({ ...prev, notes: newNotes }));
        showToast("Document removed successfully.", "success");
      } else {
        showToast("Failed to update booking.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error removing document.", "error");
    } finally {
      setUploading(false);
    }
  };

  const getStatusClass = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("completed")) return "completed";
    if (s.includes("cancel")) return "cancelled";
    if (s.includes("pending")) return "pending";
    return "active";
  };

  const isBookingEditable = (booking.status || "").toLowerCase().includes("pending");
  const rawCustomerId = booking.customer_id || (customerObj ? customerObj.id : "");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "1100px", margin: "0 auto", padding: "10px" }}>
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

      {/* Header Banner */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>
            <i className="fas fa-file-invoice" style={{ marginRight: "10px", color: "#d4af37" }}></i> Booking Details (Agent Panel)
          </h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>
            Viewing details for booking code: <strong style={{ color: "#d4af37" }}>{booking.booking_code || booking.id}</strong> {customerObj?.name ? `(${customerObj.name})` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button 
            onClick={() => {
              if (isBookingEditable) {
                router.push(`/company/bookings/edit?id=${booking.id || booking.booking_code}`);
              } else {
                showToast("Confirmed bookings cannot be edited.", "error");
              }
            }}
            disabled={!isBookingEditable}
            title={isBookingEditable ? "Edit Booking" : "Editing locked for confirmed bookings"}
            className="btn-submit"
            style={{
              padding: "10px 18px",
              fontWeight: "700",
              cursor: isBookingEditable ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: isBookingEditable ? "linear-gradient(135deg, #d4af37 0%, #b48a1d 100%)" : "#475569",
              opacity: isBookingEditable ? 1 : 0.6,
              border: "none",
              color: isBookingEditable ? "#0f172a" : "#cbd5e1",
              borderRadius: "8px"
            }}
          >
            <i className={isBookingEditable ? "fas fa-edit" : "fas fa-lock"}></i>
            <span>{isBookingEditable ? "Edit Booking" : "Editing Locked"}</span>
          </button>

          <button 
            onClick={() => router.push("/company/bookings")} 
            className="form-btn-back"
            style={{ background: "rgba(255, 255, 255, 0.15)", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: "8px", padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <i className="fas fa-arrow-left"></i>
            <span>Back to List</span>
          </button>
        </div>
      </div>

      {/* Activity Summary Bar & Quick Actions */}
      <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <i className="fas fa-chart-line" style={{ color: "#d4af37", marginRight: "8px" }}></i> Customer Activity Summary & Actions
          </h4>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button 
              onClick={() => {
                if (isBookingEditable) {
                  router.push(rawCustomerId ? `/company/bookings/add?customer_id=${rawCustomerId}` : `/company/bookings/add`);
                } else {
                  showToast("Booking is complete or confirmed by admin. Cannot add new booking, flight, hotel, ride or train.", "error");
                }
              }}
              style={{ background: isBookingEditable ? "#0f172a" : "#64748b", color: "#ffffff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: "700", cursor: isBookingEditable ? "pointer" : "not-allowed", opacity: isBookingEditable ? 1 : 0.65, display: "flex", alignItems: "center", gap: "5px" }}
              title={isBookingEditable ? "Add Booking" : "Locked for completed/confirmed booking"}
            >
              <i className="fas fa-plus"></i> Add Booking
            </button>
            <button 
              onClick={() => {
                if (isBookingEditable) {
                  router.push(`/company/flights/add${rawCustomerId ? `?customer_id=${rawCustomerId}` : ''}`);
                } else {
                  showToast("Booking is complete or confirmed by admin. Cannot add new booking, flight, hotel, ride or train.", "error");
                }
              }}
              style={{ background: isBookingEditable ? "#0284c7" : "#64748b", color: "#ffffff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: "700", cursor: isBookingEditable ? "pointer" : "not-allowed", opacity: isBookingEditable ? 1 : 0.65, display: "flex", alignItems: "center", gap: "5px" }}
              title={isBookingEditable ? "Add Flight" : "Locked for completed/confirmed booking"}
            >
              <i className="fas fa-plane"></i> Add Flight
            </button>
            <button 
              onClick={() => {
                if (isBookingEditable) {
                  router.push(`/company/trains/add${rawCustomerId ? `?customer_id=${rawCustomerId}` : ''}`);
                } else {
                  showToast("Booking is complete or confirmed by admin. Cannot add new booking, flight, hotel, ride or train.", "error");
                }
              }}
              style={{ background: isBookingEditable ? "#059669" : "#64748b", color: "#ffffff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: "700", cursor: isBookingEditable ? "pointer" : "not-allowed", opacity: isBookingEditable ? 1 : 0.65, display: "flex", alignItems: "center", gap: "5px" }}
              title={isBookingEditable ? "Add Train" : "Locked for completed/confirmed booking"}
            >
              <i className="fas fa-train"></i> Add Train
            </button>
            <button 
              onClick={() => {
                if (isBookingEditable) {
                  router.push(`/company/hotels/assignments/add${rawCustomerId ? `?customer_id=${rawCustomerId}` : ''}`);
                } else {
                  showToast("Booking is complete or confirmed by admin. Cannot add new booking, flight, hotel, ride or train.", "error");
                }
              }}
              style={{ background: isBookingEditable ? "#d97706" : "#64748b", color: "#ffffff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: "700", cursor: isBookingEditable ? "pointer" : "not-allowed", opacity: isBookingEditable ? 1 : 0.65, display: "flex", alignItems: "center", gap: "5px" }}
              title={isBookingEditable ? "Add Hotel" : "Locked for completed/confirmed booking"}
            >
              <i className="fas fa-hotel"></i> Add Hotel
            </button>
            <button 
              onClick={() => {
                if (isBookingEditable) {
                  router.push(`/company/services/add${rawCustomerId ? `?customer_id=${rawCustomerId}` : ''}`);
                } else {
                  showToast("Booking is complete or confirmed by admin. Cannot add new booking, flight, hotel, ride or train.", "error");
                }
              }}
              style={{ background: isBookingEditable ? "#7c3aed" : "#64748b", color: "#ffffff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: "700", cursor: isBookingEditable ? "pointer" : "not-allowed", opacity: isBookingEditable ? 1 : 0.65, display: "flex", alignItems: "center", gap: "5px" }}
              title={isBookingEditable ? "Add Service" : "Locked for completed/confirmed booking"}
            >
              <i className="fas fa-concierge-bell"></i> Add Service
            </button>
          </div>
        </div>

        {/* Counters Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
          <div 
            onClick={() => setActiveTab("bookings")}
            style={{ background: activeTab === "bookings" ? "#eff6ff" : "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${activeTab === "bookings" ? "#3b82f6" : "#e2e8f0"}`, cursor: "pointer", textAlign: "center" }}
          >
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", display: "block" }}>Total Bookings</span>
            <span style={{ fontSize: "20px", fontWeight: "800", color: "#1e293b" }}>{custBookings.length || 1}</span>
          </div>
          <div 
            onClick={() => setActiveTab("flights")}
            style={{ background: activeTab === "flights" ? "#e0f2fe" : "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${activeTab === "flights" ? "#0284c7" : "#e2e8f0"}`, cursor: "pointer", textAlign: "center" }}
          >
            <span style={{ fontSize: "11px", color: "#0369a1", fontWeight: "700", display: "block" }}>Total Flights</span>
            <span style={{ fontSize: "20px", fontWeight: "800", color: "#0369a1" }}>{custFlights.length}</span>
          </div>
          <div 
            onClick={() => setActiveTab("trains")}
            style={{ background: activeTab === "trains" ? "#d1fae5" : "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${activeTab === "trains" ? "#059669" : "#e2e8f0"}`, cursor: "pointer", textAlign: "center" }}
          >
            <span style={{ fontSize: "11px", color: "#047857", fontWeight: "700", display: "block" }}>Total Trains</span>
            <span style={{ fontSize: "20px", fontWeight: "800", color: "#047857" }}>{custTrains.length}</span>
          </div>
          <div 
            onClick={() => setActiveTab("hotels")}
            style={{ background: activeTab === "hotels" ? "#fef3c7" : "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${activeTab === "hotels" ? "#d97706" : "#e2e8f0"}`, cursor: "pointer", textAlign: "center" }}
          >
            <span style={{ fontSize: "11px", color: "#b45309", fontWeight: "700", display: "block" }}>Hotel Stays</span>
            <span style={{ fontSize: "20px", fontWeight: "800", color: "#b45309" }}>{custHotels.length}</span>
          </div>
          <div 
            onClick={() => setActiveTab("services")}
            style={{ background: activeTab === "services" ? "#f3e8ff" : "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${activeTab === "services" ? "#7c3aed" : "#e2e8f0"}`, cursor: "pointer", textAlign: "center" }}
          >
            <span style={{ fontSize: "11px", color: "#6d28d9", fontWeight: "700", display: "block" }}>Services</span>
            <span style={{ fontSize: "20px", fontWeight: "800", color: "#6d28d9" }}>{custServices.length}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px", flexWrap: "wrap" }}>
        {[
          { id: "overview", label: "Overview (Current Booking)", icon: "fa-car", badge: null },
          { id: "bookings", label: "All Routes & Bookings", icon: "fa-route", badge: custBookings.length },
          { id: "flights", label: "Flights", icon: "fa-plane", badge: custFlights.length },
          { id: "trains", label: "Trains", icon: "fa-train", badge: custTrains.length },
          { id: "hotels", label: "Hotels", icon: "fa-hotel", badge: custHotels.length },
          { id: "services", label: "Services", icon: "fa-concierge-bell", badge: custServices.length },
          { id: "documents", label: "Documents", icon: "fa-file-shield", badge: parsed.documents?.length || 0 }
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: isSelected ? "#0f172a" : "#ffffff",
                color: isSelected ? "#ffffff" : "#475569",
                border: `1px solid ${isSelected ? "#0f172a" : "#cbd5e1"}`,
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: isSelected ? "0 4px 6px rgba(15, 23, 42, 0.15)" : "none",
                transition: "all 0.15s"
              }}
            >
              <i className={`fas ${tab.icon}`} style={{ color: isSelected ? "#d4af37" : "#64748b" }}></i>
              <span>{tab.label}</span>
              {tab.badge !== null && tab.badge > 0 && (
                <span style={{
                  background: isSelected ? "#d4af37" : "#f1f5f9",
                  color: isSelected ? "#0f172a" : "#475569",
                  borderRadius: "10px",
                  padding: "1px 6px",
                  fontSize: "11px",
                  fontWeight: "800"
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT PANELS */}

      {/* 1. OVERVIEW TAB: Main Booking Details Grid */}
      {(activeTab === "overview" || activeTab === "documents") && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "25px" }}>
          
          {/* Left Side: General Info & Route & Passengers */}
          <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            
            {/* Card 1: Route & Schedule */}
            <div className="form-card" style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
              <h3 style={{ margin: "0 0 20px 0", color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px", fontSize: "16px", fontWeight: "700" }}>
                <i className="fas fa-route" style={{ color: "#d4af37", marginRight: "8px" }}></i>
                Route & Schedule
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", display: "block", textTransform: "uppercase", fontWeight: "700", marginBottom: "4px" }}>Pickup Location</span>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{booking.pickup || "N/A"}</span>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", display: "block", textTransform: "uppercase", fontWeight: "700", marginBottom: "4px" }}>Dropoff Destination</span>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{booking.destination || "N/A"}</span>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", display: "block", textTransform: "uppercase", fontWeight: "700", marginBottom: "4px" }}>Package / Route Description</span>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#b48a1d" }}>{parsed.tripPackage || "N/A"}</span>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", display: "block", textTransform: "uppercase", fontWeight: "700", marginBottom: "4px" }}>Pickup Date</span>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}><i className="fas fa-calendar" style={{ marginRight: "6px", color: "#64748b" }}></i> {booking.date ? formatDateOnly(booking.date) : "N/A"}</span>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", display: "block", textTransform: "uppercase", fontWeight: "700", marginBottom: "4px" }}>Pickup Time</span>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}><i className="fas fa-clock" style={{ marginRight: "6px", color: "#64748b" }}></i> {booking.time ? formatTimeOnly(booking.time) : "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Vehicle & Passengers */}
            <div className="form-card" style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
              <h3 style={{ margin: "0 0 20px 0", color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px", fontSize: "16px", fontWeight: "700" }}>
                <i className="fas fa-car" style={{ color: "#d4af37", marginRight: "8px" }}></i>
                Vehicle & Passenger Details
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", display: "block", textTransform: "uppercase", fontWeight: "700", marginBottom: "4px" }}>Vehicle Model</span>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{parsed.vehicle || booking.car_type || "N/A"}</span>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", display: "block", textTransform: "uppercase", fontWeight: "700", marginBottom: "4px" }}>Bags Count</span>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}><i className="fas fa-briefcase" style={{ marginRight: "6px", color: "#64748b" }}></i> {parsed.bags || 0} Bags</span>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", display: "block", textTransform: "uppercase", fontWeight: "700", marginBottom: "4px" }}>Passengers Info</span>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}><i className="fas fa-users" style={{ marginRight: "6px", color: "#64748b" }}></i> {booking.passengers || `${parsed.adults} Passengers`}</span>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", display: "block", textTransform: "uppercase", fontWeight: "700", marginBottom: "4px" }}>Is Tafweej Required?</span>
                  <span style={{
                    fontSize: "12px", fontWeight: "700", display: "inline-block", padding: "4px 8px", borderRadius: "6px",
                    background: parsed.tafweejRequired ? "#fee2e2" : "#f1f5f9",
                    color: parsed.tafweejRequired ? "#991b1b" : "#475569"
                  }}>
                    {parsed.tafweejRequired ? "YES" : "NO"}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Notes & Comments */}
            <div className="form-card" style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
              <h3 style={{ margin: "0 0 20px 0", color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px", fontSize: "16px", fontWeight: "700" }}>
                <i className="fas fa-comment-dots" style={{ color: "#d4af37", marginRight: "8px" }}></i>
                Notes / Special Instructions
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", display: "block", textTransform: "uppercase", fontWeight: "700", marginBottom: "4px" }}>Private Internal Notes (Agency Private)</span>
                  <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", color: "#334155", minHeight: "50px" }}>
                    {parsed.internalNotes || "No internal notes recorded."}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", display: "block", textTransform: "uppercase", fontWeight: "700", marginBottom: "4px" }}>Public External Notes</span>
                  <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", color: "#334155", minHeight: "50px" }}>
                    {parsed.externalNotes || "No external notes provided."}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Documents & Scanning */}
            <div className="form-card" style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
              <h3 style={{ margin: "0 0 20px 0", color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px", fontSize: "16px", fontWeight: "700" }}>
                <i className="fas fa-file-shield" style={{ color: "#d4af37", marginRight: "8px" }}></i>
                Document Scanning & Files
              </h3>
              
              {/* List of uploaded documents */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                {(!parsed.documents || parsed.documents.length === 0) ? (
                  <div style={{ padding: "15px", textAlign: "center", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1", fontSize: "13px", color: "#64748b" }}>
                    No documents attached to this booking. Use the fields below to upload or scan passenger passports, visas, or tickets.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {parsed.documents.map((doc, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
                          <i className="fas fa-file-pdf" style={{ color: "#ef4444", fontSize: "16px", flexShrink: 0 }}></i>
                          <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{doc.name}</span>
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{
                              background: "#e0f2fe", color: "#0369a1", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px"
                            }}
                          >
                            <i className="fas fa-eye"></i> View
                          </a>
                          <button 
                            onClick={() => deleteDocument(idx)}
                            disabled={uploading}
                            style={{
                              background: "#fee2e2", color: "#b91c1c", border: "none", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px"
                            }}
                          >
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Document Actions Form */}
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ fontSize: "12px", color: "#475569", fontWeight: "700", display: "block", marginBottom: "6px", textTransform: "uppercase" }}>Document Label / Type</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Passport - Ahmed, Umrah Visa, E-Ticket..." 
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", outline: "none" }}
                  />
                </div>

                {/* Upload & Scan buttons */}
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      flex: 1, background: "#0f172a", color: "#ffffff", border: "none", padding: "10px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px"
                    }}
                  >
                    <i className="fas fa-upload"></i> Upload File
                  </button>
                  <button
                    type="button"
                    onClick={cameraActive ? stopCamera : startCamera}
                    disabled={uploading}
                    style={{
                      flex: 1, background: "#d4af37", color: "#0f172a", border: "none", padding: "10px", borderRadius: "6px", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px"
                    }}
                  >
                    <i className="fas fa-camera"></i> {cameraActive ? "Close Camera" : "Scan via Camera"}
                  </button>
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUploadChange} 
                  style={{ display: "none" }} 
                  accept="image/*,application/pdf"
                />

                {/* Live camera scanning interface */}
                {cameraActive && (
                  <div style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "10px", background: "#000", padding: "10px", borderRadius: "8px", overflow: "hidden" }}>
                    <video 
                      ref={videoRef} 
                      style={{ width: "100%", borderRadius: "6px", background: "#222" }} 
                      playsInline 
                      muted 
                    />
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        type="button"
                        onClick={capturePhoto}
                        style={{
                          flex: 1, background: "#10b981", color: "#ffffff", border: "none", padding: "10px", borderRadius: "6px", fontSize: "13px", fontWeight: "700", cursor: "pointer"
                        }}
                      >
                        Capture & Save Document
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        style={{
                          background: "#ef4444", color: "#ffffff", border: "none", padding: "10px 15px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                    <canvas ref={canvasRef} style={{ display: "none" }} />
                  </div>
                )}

                {uploading && (
                  <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#b48a1d", fontWeight: "600" }}>
                    <i className="fas fa-circle-notch fa-spin"></i> Processing & saving document...
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Side: Customer info & Status & Payment */}
          <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            
            {/* Card A: Status & Tracking */}
            <div className="form-card" style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
              <h3 style={{ margin: "0 0 20px 0", color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px", fontSize: "16px", fontWeight: "700" }}>
                <i className="fas fa-clock-rotate-left" style={{ color: "#d4af37", marginRight: "8px" }}></i>
                Status
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", fontWeight: "700", marginBottom: "4px" }}>Booking Status</span>
                  <span className={`status-pill ${getStatusClass(booking.status)}`} style={{ display: "inline-block", fontSize: "12px", fontWeight: "700" }}>{booking.status}</span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", fontWeight: "700", marginBottom: "4px" }}>Timing Status</span>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                    <i className="fas fa-circle-check" style={{ color: "#10b981", marginRight: "6px" }}></i>
                    {parsed.timingStatus || "Confirmed"}
                  </span>
                </div>
              </div>
            </div>

            {/* Card B: Customer Profile */}
            <div className="form-card" style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
              <h3 style={{ margin: "0 0 20px 0", color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px", fontSize: "16px", fontWeight: "700" }}>
                <i className="fas fa-user-tie" style={{ color: "#d4af37", marginRight: "8px" }}></i>
                Customer Profile
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", fontWeight: "700" }}>Full Name</span>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>{booking.full_name || customerObj?.name || "Guest Customer"}</span>
                </div>
                {customerObj && (
                  <>
                    <div>
                      <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", fontWeight: "700" }}>Agency / Company</span>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>{customerObj.company || "Walk-in"}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", fontWeight: "700" }}>Custom ID</span>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#b48a1d" }}>{customerObj.custom_id || `CST-${customerObj.id}`}</span>
                    </div>
                  </>
                )}
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", fontWeight: "700" }}>WhatsApp Contact</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}><i className="fab fa-whatsapp" style={{ color: "#10b981", marginRight: "6px" }}></i> {booking.whatsapp || customerObj?.phone || "N/A"}</span>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#64748b", display: "block", textTransform: "uppercase", fontWeight: "700" }}>Email Address</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}><i className="fas fa-envelope" style={{ color: "#64748b", marginRight: "6px" }}></i> {booking.email || customerObj?.email || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Card C: Fare & Financials */}
            <div className="form-card" style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
              <h3 style={{ margin: "0 0 20px 0", color: "#0f172a", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px", fontSize: "16px", fontWeight: "700" }}>
                <i className="fas fa-file-invoice-dollar" style={{ color: "#d4af37", marginRight: "8px" }}></i>
                Fare & Financials
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#64748b" }}>Before Discount:</span>
                  <span style={{ fontWeight: "600", color: "#334155" }}>SR {parsed.priceBeforeDiscount.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#64748b" }}>Discount Applied:</span>
                  <span style={{ fontWeight: "600", color: "#ef4444" }}>- SR {parsed.discount.toFixed(2)}</span>
                </div>
                {parsed.discountReason && (
                  <div style={{ background: "#fef2f2", padding: "6px 10px", borderRadius: "6px", fontSize: "11px", color: "#991b1b", border: "1px solid #fee2e2" }}>
                    <strong>Reason: </strong> {parsed.discountReason}
                  </div>
                )}
                <hr style={{ border: 0, borderTop: "1px solid #f1f5f9", margin: "5px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                  <span style={{ fontWeight: "700", color: "#0f172a" }}>Final Booking Fare:</span>
                  <span style={{ fontWeight: "800", color: "#10b981", fontSize: "16px" }}>SR {parseFloat(booking.car_price || 0).toFixed(2)}</span>
                </div>
                <hr style={{ border: 0, borderTop: "1px solid #f1f5f9", margin: "5px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#64748b" }}>Payment Method:</span>
                  <span style={{ fontWeight: "700", color: "#3b82f6" }}>{booking.payment_method || parsed.paymentMethod || "Credit"}</span>
                </div>

                {(booking.payment_method === "Cash" || parsed.paymentMethod === "Cash") && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ color: "#64748b" }}>Received Amount:</span>
                      <span style={{ fontWeight: "700", color: "#10b981" }}>SR {parseFloat(booking.received_amount || parsed.receivedAmount || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ color: "#64748b" }}>Pending Amount:</span>
                      <span style={{ fontWeight: "700", color: "#ef4444" }}>SR {parseFloat(booking.pending_amount || parsed.pendingAmount || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 2. ALL BOOKINGS / ROUTES TAB */}
      {activeTab === "bookings" && (
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#0f172a", fontSize: "16px", fontWeight: "700" }}>
            <i className="fas fa-route" style={{ color: "#d4af37", marginRight: "8px" }}></i>
            All Routes & Cab Bookings for {customerObj?.name || booking.full_name || "Customer"}
          </h3>
          {custBookings.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
              No additional cab bookings recorded for this customer.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="custom-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px" }}>Booking Code</th>
                    <th style={{ padding: "10px 12px" }}>Pickup → Dropoff</th>
                    <th style={{ padding: "10px 12px" }}>Date & Time</th>
                    <th style={{ padding: "10px 12px" }}>Vehicle</th>
                    <th style={{ padding: "10px 12px" }}>Price</th>
                    <th style={{ padding: "10px 12px" }}>Status</th>
                    <th style={{ padding: "10px 12px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {custBookings.map((b: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 12px", fontWeight: "700", color: "#b48a1d" }}>{b.booking_code || `#HCB-${b.id}`}</td>
                      <td style={{ padding: "10px 12px", fontWeight: "600" }}>{b.pickup || "Jeddah"} → {b.destination || "Makkah"}</td>
                      <td style={{ padding: "10px 12px" }}>{b.date || "N/A"} {b.time || ""}</td>
                      <td style={{ padding: "10px 12px" }}>{b.car_type || b.vehicle || "Cab"}</td>
                      <td style={{ padding: "10px 12px", fontWeight: "700", color: "#10b981" }}>SR {parseFloat(b.car_price || 0).toFixed(2)}</td>
                      <td style={{ padding: "10px 12px" }}><span className={`status-pill ${getStatusClass(b.status)}`}>{b.status || "Pending"}</span></td>
                      <td style={{ padding: "10px 12px" }}>
                        <button 
                          onClick={() => router.push(`/company/bookings/view?id=${b.id}`)}
                          style={{ background: "#e0f2fe", color: "#0369a1", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                        >
                          <i className="fas fa-eye"></i> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. FLIGHTS TAB */}
      {activeTab === "flights" && (
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#0f172a", fontSize: "16px", fontWeight: "700" }}>
            <i className="fas fa-plane" style={{ color: "#0284c7", marginRight: "8px" }}></i>
            Flight Bookings & Records
          </h3>
          {custFlights.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
              No flight bookings found for this customer.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="custom-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px" }}>Flight ID</th>
                    <th style={{ padding: "10px 12px" }}>Flight No</th>
                    <th style={{ padding: "10px 12px" }}>Leg</th>
                    <th style={{ padding: "10px 12px" }}>Date & Time</th>
                    <th style={{ padding: "10px 12px" }}>Route</th>
                    <th style={{ padding: "10px 12px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {custFlights.map((f: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 12px", fontWeight: "700", color: "#0284c7" }}>{f.custom_id || `#FLT-${f.id}`}</td>
                      <td style={{ padding: "10px 12px", fontWeight: "700" }}>{f.flight_no || f.flightNo || "N/A"}</td>
                      <td style={{ padding: "10px 12px" }}>{f.leg || "Arrival"}</td>
                      <td style={{ padding: "10px 12px" }}>{f.date || "N/A"} {f.time || ""}</td>
                      <td style={{ padding: "10px 12px" }}>{f.route || "N/A"}</td>
                      <td style={{ padding: "10px 12px" }}><span style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>{f.status || "Scheduled"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. TRAINS TAB */}
      {activeTab === "trains" && (
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#0f172a", fontSize: "16px", fontWeight: "700" }}>
            <i className="fas fa-train" style={{ color: "#059669", marginRight: "8px" }}></i>
            Haramain Train Bookings
          </h3>
          {custTrains.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
              No train bookings found for this customer.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="custom-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px" }}>Train ID</th>
                    <th style={{ padding: "10px 12px" }}>Train No</th>
                    <th style={{ padding: "10px 12px" }}>Class / Leg</th>
                    <th style={{ padding: "10px 12px" }}>Date & Time</th>
                    <th style={{ padding: "10px 12px" }}>Route</th>
                    <th style={{ padding: "10px 12px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {custTrains.map((t: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 12px", fontWeight: "700", color: "#059669" }}>{t.custom_id || `#TRN-${t.id}`}</td>
                      <td style={{ padding: "10px 12px", fontWeight: "700" }}>{t.train_no || t.trainNo || "N/A"}</td>
                      <td style={{ padding: "10px 12px" }}>{t.class || t.leg || "Economy"}</td>
                      <td style={{ padding: "10px 12px" }}>{t.date || "N/A"} {t.time || ""}</td>
                      <td style={{ padding: "10px 12px" }}>{t.route || "N/A"}</td>
                      <td style={{ padding: "10px 12px" }}><span style={{ background: "#d1fae5", color: "#047857", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>{t.status || "Confirmed"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. HOTELS TAB */}
      {activeTab === "hotels" && (
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#0f172a", fontSize: "16px", fontWeight: "700" }}>
            <i className="fas fa-hotel" style={{ color: "#d97706", marginRight: "8px" }}></i>
            Hotel Accommodation Details
          </h3>
          {custHotels.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
              No hotel accommodations registered for this customer.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="custom-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px" }}>Hotel Name</th>
                    <th style={{ padding: "10px 12px" }}>City</th>
                    <th style={{ padding: "10px 12px" }}>Room No</th>
                    <th style={{ padding: "10px 12px" }}>Check In</th>
                    <th style={{ padding: "10px 12px" }}>Check Out</th>
                    <th style={{ padding: "10px 12px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {custHotels.map((h: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 12px", fontWeight: "700", color: "#b45309" }}>{h.hotel_name || h.name || "Hotel Stay"}</td>
                      <td style={{ padding: "10px 12px" }}>{h.city || "Makkah"}</td>
                      <td style={{ padding: "10px 12px" }}>{h.room_no || "N/A"}</td>
                      <td style={{ padding: "10px 12px" }}>{h.check_in || "N/A"}</td>
                      <td style={{ padding: "10px 12px" }}>{h.check_out || "N/A"}</td>
                      <td style={{ padding: "10px 12px" }}><span style={{ background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>{h.status || "Reserved"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. SERVICES TAB */}
      {activeTab === "services" && (
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#0f172a", fontSize: "16px", fontWeight: "700" }}>
            <i className="fas fa-concierge-bell" style={{ color: "#7c3aed", marginRight: "8px" }}></i>
            Additional Services
          </h3>
          {custServices.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
              No extra services registered for this customer.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="custom-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px" }}>Service ID</th>
                    <th style={{ padding: "10px 12px" }}>Name / Type</th>
                    <th style={{ padding: "10px 12px" }}>Pickup Location</th>
                    <th style={{ padding: "10px 12px" }}>Date & Time</th>
                    <th style={{ padding: "10px 12px" }}>Base Price</th>
                    <th style={{ padding: "10px 12px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {custServices.map((s: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 12px", fontWeight: "700", color: "#7c3aed" }}>{s.custom_id || `#SRV-${s.id}`}</td>
                      <td style={{ padding: "10px 12px", fontWeight: "700" }}>{s.name || s.type || "Service"}</td>
                      <td style={{ padding: "10px 12px" }}>{s.pickup || "N/A"}</td>
                      <td style={{ padding: "10px 12px" }}>{s.date || "N/A"} {s.time || ""}</td>
                      <td style={{ padding: "10px 12px", fontWeight: "700", color: "#10b981" }}>SR {parseFloat(s.base_price || 0).toFixed(2)}</td>
                      <td style={{ padding: "10px 12px" }}><span style={{ background: "#f3e8ff", color: "#6d28d9", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>{s.status || "Active"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default function BookingViewPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #d4af37", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
      </div>
    }>
      <BookingViewContent />
    </Suspense>
  );
}
