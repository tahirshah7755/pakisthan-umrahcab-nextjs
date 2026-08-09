"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/utils/api";
import { CustomerProfileView } from "@/components/admin/CustomerProfileView";
import { formatDateTime, formatDateOnly } from "@/utils/formatters";
import { useAuth } from "@/context/AuthContext";

interface CustomerItem {
  id: string;
  rawId?: number;
  name: string;
  company: string;
  contact: string;
  registeredBy: string;
  lastUpdate: string;
}

function CustomerViewContent() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const targetId = searchParams.get("id") || "";

  const [loading, setLoading] = useState(true);
  const [dbCustomer, setDbCustomer] = useState<any | null>(null);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [activeProfileTab, setActiveProfileTab] = useState("overview");

  // Related lists for statistics
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [trains, setTrains] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);

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

  const triggerExportAlert = (format: string) => {
    showToast(`Data exported as ${format} to downloads directory!`, "success");
  };

  useEffect(() => {
    const loadProfileData = async () => {
      if (!targetId) return;
      try {
        setLoading(true);
        // 1. Fetch single customer
        const customerProfile = await api.getCustomer(targetId);
        if (customerProfile) {
          if (customerProfile.customer) {
            setDbCustomer(customerProfile.customer);
            
            // Map bookings
            if (Array.isArray(customerProfile.bookings)) {
              setBookings(customerProfile.bookings.map((b: any, idx: number) => {
                let uiStatus = "Pending";
                if (b.status === "Active Dispatch" || b.status === "Confirmed Booking" || b.status === "Confirmed") uiStatus = "Confirmed";
                else if (b.status === "Completed") uiStatus = "Completed";
                else if (b.status === "Cancelled") uiStatus = "Cancelled";

                return {
                  id: b.booking_code || `#BKG-87${idx + 10}`,
                  rawId: b.id ? String(b.id) : `87${idx + 10}`,
                  type: "BKG",
                  date: b.date || "2026-05-25",
                  time: b.time || "10:30 AM",
                  customerName: b.full_name || b.fullName || "Guest",
                  companyName: b.full_name ? "Corporate Account" : "Walk-in",
                  details: `${b.pickup || "Jeddah Airport"} → ${b.destination || "Makkah Hotel"}`,
                  vehicle: b.car_type || b.carType || "Sedan (Standard)",
                  phones: [b.phone || b.whatsapp || "+966501234567"],
                  customerId: b.customer_id ? String(b.customer_id) : "1",
                  status: uiStatus,
                  finalPrice: parseFloat(b.car_price || 0)
                };
              }));
            }
            
            // Map services
            if (Array.isArray(customerProfile.services)) {
              setServices(customerProfile.services.map((s: any) => ({
                id: s.custom_id || `#SRV-${s.id}`,
                rawId: s.id,
                name: s.name,
                type: s.type,
                description: s.description,
                basePrice: parseFloat(s.base_price || 0),
                status: s.status || "Active",
                pickup: s.pickup,
                driverCash: parseFloat(s.driver_cash || 0),
                date: s.date,
                time: s.time,
                customer_id: s.customer_id
              })));
            }

            // Map flights
            if (Array.isArray(customerProfile.flights)) {
              setFlights(customerProfile.flights.map((f: any) => ({
                id: f.custom_id || `#FLT-${f.id}`,
                rawId: f.id,
                flightNo: f.flight_no || "SV-321",
                leg: f.leg || "Arrival",
                date: f.date || "",
                time: f.time || "",
                route: f.route || "JED → MAK",
                status: f.status || "On Time",
                customer_id: f.customer_id
              })));
            }

            // Map trains
            if (Array.isArray(customerProfile.trains)) {
              setTrains(customerProfile.trains.map((t: any) => ({
                id: t.custom_id || `#TRN-${t.id}`,
                rawId: t.id,
                train_no: t.train_no || "HHR-1",
                leg: t.leg || "Departure Only",
                date: t.date || "",
                time: t.time || "",
                route: t.route || "JED → MAK",
                status: t.status || "Arrived",
                customer_id: t.customer_id
              })));
            }

            // Map hotels
            if (Array.isArray(customerProfile.hotels)) {
              setHotels(customerProfile.hotels.map((h: any) => ({
                id: h.custom_id || `#HTL-${h.id}`,
                rawId: h.id,
                name: h.name,
                city: h.city,
                checkIn: h.check_in,
                checkOut: h.check_out,
                active: h.active,
                customer_id: h.customer_id
              })));
            }
          } else {
            setDbCustomer(customerProfile);
            
            // Fallback to fetch all related list if API didn't group them
            const bkgList = await api.getBookings();
            if (bkgList) {
              setBookings(bkgList.map((b: any, idx: number) => {
                let uiStatus = "Pending";
                if (b.status === "Active Dispatch" || b.status === "Confirmed Booking" || b.status === "Confirmed") uiStatus = "Confirmed";
                else if (b.status === "Completed") uiStatus = "Completed";
                else if (b.status === "Cancelled") uiStatus = "Cancelled";

                return {
                  id: b.booking_code || `#BKG-87${idx + 10}`,
                  rawId: b.id ? String(b.id) : `87${idx + 10}`,
                  type: "BKG",
                  date: b.date || "2026-05-25",
                  time: b.time || "10:30 AM",
                  customerName: b.fullName || "Guest",
                  companyName: b.fullName ? "Corporate Account" : "Walk-in",
                  details: `${b.pickup || "Jeddah Airport"} → ${b.destination || "Makkah Hotel"}`,
                  vehicle: b.carType || "Sedan (Standard)",
                  phones: [b.phone || "+966501234567"],
                  customerId: b.customer_id ? String(b.customer_id) : "1",
                  status: uiStatus,
                  finalPrice: parseFloat(b.carPrice || b.car_price || 0)
                };
              }));
            }

            const srvList = await api.getServices();
            if (srvList) {
              setServices(srvList.map((s: any) => ({
                id: s.custom_id || `#SRV-${s.id}`,
                rawId: s.id,
                name: s.name,
                type: s.type,
                description: s.description,
                basePrice: parseFloat(s.base_price || 0),
                status: s.status || "Active",
                pickup: s.pickup,
                driverCash: parseFloat(s.driver_cash || 0),
                date: s.date,
                time: s.time,
                customer_id: s.customer_id
              })));
            }

            const fltList = await api.getFlights();
            if (fltList) {
              setFlights(fltList.map((f: any) => ({
                id: f.custom_id || `#FLT-${f.id}`,
                rawId: f.id,
                flightNo: f.flight_no || "SV-321",
                leg: f.leg || "Arrival",
                date: f.date || "",
                time: f.time || "",
                route: f.route || "JED → MAK",
                status: f.status || "On Time",
                customer_id: f.customer_id
              })));
            }

            const trnList = await api.getTrains();
            if (trnList) {
              setTrains(trnList.map((t: any) => ({
                id: t.custom_id || `#TRN-${t.id}`,
                rawId: t.id,
                train_no: t.train_no || "HHR-1",
                leg: t.leg || "Departure Only",
                date: t.date || "",
                time: t.time || "",
                route: t.route || "JED → MAK",
                status: t.status || "Arrived",
                customer_id: t.customer_id
              })));
            }

            const htlList = await api.getHotels();
            if (htlList) {
              setHotels(htlList.map((h: any) => ({
                id: h.custom_id || `#HTL-${h.id}`,
                rawId: h.id,
                name: h.name,
                city: h.city,
                checkIn: h.check_in,
                checkOut: h.check_out,
                active: h.active,
                customer_id: h.customer_id
              })));
            }
          }
        }

        // Fetch all customers list (for search dropdown, etc.)
        const allCustomers = await api.getCustomers();
        if (allCustomers && Array.isArray(allCustomers)) {
          setCustomers(allCustomers.map((c: any) => ({
            id: c.custom_id || `#CST-${c.id}`,
            rawId: c.id,
            name: c.name,
            company: c.company,
            contact: c.contact,
            registeredBy: c.registered_by ? (c.registered_by.includes("umrahcab") ? c.registered_by.replace(/umrahcab/gi, user?.name || user?.username || "hebacab") : c.registered_by) : (user?.name || user?.username || "hebacab"),
            lastUpdate: c.last_update || "No edits"
          })));
        } else if (allCustomers && Array.isArray(allCustomers.data)) {
          setCustomers(allCustomers.data.map((c: any) => ({
            id: c.custom_id || `#CST-${c.id}`,
            rawId: c.id,
            name: c.name,
            company: c.company,
            contact: c.contact,
            registeredBy: c.registered_by ? (c.registered_by.includes("umrahcab") ? c.registered_by.replace(/umrahcab/gi, user?.name || user?.username || "hebacab") : c.registered_by) : (user?.name || user?.username || "hebacab"),
            lastUpdate: c.last_update || "No edits"
          })));
        }

      } catch (err) {
        console.error(err);
        showToast("Error loading customer profile.", "error");
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [targetId]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #d97706", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  // Look up customer record
  const selectedCust = dbCustomer || customers.find(c => String(c.rawId) === targetId || c.id === targetId);

  // Parse contact
  let parsedPhones: string[] = ["N/A"];
  let parsedEmail = "No email provided";
  let parsedNotes = "No external notes.";
  let parsedPassport = "";
  let parsedHotelInfo = "";

  if (selectedCust) {
    if (selectedCust.phone || selectedCust.secondary_phone || selectedCust.alternative_phone || selectedCust.email || selectedCust.passport_no || selectedCust.notes || selectedCust.hotel_info) {
      parsedPhones = [
        selectedCust.phone,
        selectedCust.secondary_phone,
        selectedCust.alternative_phone
      ].filter(Boolean);
      if (parsedPhones.length === 0) parsedPhones = ["N/A"];
      parsedEmail = selectedCust.email || "No email provided";
      parsedNotes = selectedCust.notes || "No external notes.";
      parsedPassport = selectedCust.passport_no || "";
      parsedHotelInfo = selectedCust.hotel_info || "";
    } else if (selectedCust.contact) {
      const contactStr = selectedCust.contact;
      
      // Extract notes
      if (contactStr.includes(" | Notes: ")) {
        const parts = contactStr.split(" | Notes: ");
        parsedNotes = parts[1] || "No external notes.";
      }
      
      // Extract passport
      if (contactStr.includes(" | Passport: ")) {
        const parts = contactStr.split(" | Passport: ");
        const nextPart = parts[1] || "";
        parsedPassport = nextPart.split(" | ")[0] || "";
      }

      // Extract hotel info
      if (contactStr.includes(" | Hotel: ")) {
        const parts = contactStr.split(" | Hotel: ");
        const nextPart = parts[1] || "";
        parsedHotelInfo = nextPart.split(" | ")[0] || "";
      }

      const mainPart = contactStr.split(" | Notes: ")[0];
      const contactParts = mainPart.split(" (P), ");
      if (contactParts[0]) {
        parsedPhones = contactParts[0].split(" / ");
      }
      if (contactParts[1]) {
        parsedEmail = contactParts[1].replace(" (Email)", "").trim();
      } else {
        const parts = contactStr.split(" | ");
        if (parts[0]) {
          parsedPhones = parts[0].split(" / ");
        }
        const emailPart = parts.find((p: string) => p.startsWith("Email: "));
        if (emailPart) {
          parsedEmail = emailPart.replace("Email: ", "").trim();
        }
      }
    }
  }

  const currentProfile = {
    id: selectedCust ? (selectedCust.custom_id || selectedCust.id) : targetId,
    name: selectedCust ? selectedCust.name : "Loading profile...",
    email: selectedCust ? parsedEmail : "No email provided",
    phones: selectedCust ? parsedPhones : ["123456789"],
    passportNo: parsedPassport || undefined,
    hotelInfo: parsedHotelInfo || undefined,
    company: selectedCust ? selectedCust.company : "Corporate Account",
    meta: {
      registeredBy: (selectedCust?.registered_by || selectedCust?.registeredBy) 
        ? String(selectedCust?.registered_by || selectedCust?.registeredBy).replace(/umrahcab/gi, user?.name || user?.username || "hebacab")
        : (user?.name || user?.username || "hebacab"),
      registeredDate: selectedCust?.created_at ? formatDateTime(selectedCust.created_at) : "22 May, 2026 08:32 PM",
      lastEditedBy: (selectedCust?.registered_by || selectedCust?.registeredBy)
        ? String(selectedCust?.registered_by || selectedCust?.registeredBy).replace(/umrahcab/gi, user?.name || user?.username || "hebacab")
        : (user?.name || user?.username || "hebacab"),
      lastEditedDate: selectedCust?.updated_at ? formatDateTime(selectedCust.updated_at) : (selectedCust?.last_update || selectedCust?.lastUpdate || "No edits")
    },
    externalRemarks: selectedCust ? parsedNotes : "No external notes.",
    internalRemarks: "No internal notes."
  };

  // Filter lists down to just this customer's items
  const custRawId = selectedCust?.rawId || selectedCust?.id || 0;
  const filteredBookings = bookings.filter(b => b.customerId === currentProfile.id || String(b.customerId) === String(custRawId));
  const filteredServices = services.filter(s => String(s.customer_id) === String(custRawId));
  const filteredFlights = flights.filter(f => String(f.customer_id) === String(custRawId));
  const filteredTrains = trains.filter(t => String(t.customer_id) === String(custRawId));
  const filteredHotels = hotels.filter(h => String(h.customer_id) === String(custRawId));

  const stats = {
    bookings: filteredBookings.length,
    flights: filteredFlights.length,
    trains: filteredTrains.length,
    services: filteredServices.length,
    hotels: filteredHotels.length
  };

  return (
    <div>
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
      <CustomerProfileView
        currentProfile={currentProfile}
        stats={stats}
        activeProfileTab={activeProfileTab}
        setActiveProfileTab={setActiveProfileTab}
        custBookings={filteredBookings}
        custServices={filteredServices}
        custFlights={filteredFlights}
        custTrains={filteredTrains}
        custHotels={filteredHotels}
        customers={customers}
        setEditingCustomer={() => {}}
        router={router}
        showToast={showToast}
        triggerExportAlert={triggerExportAlert}
      />
    </div>
  );
}

export default function CustomerViewPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #7c3aed", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <CustomerViewContent />
    </Suspense>
  );
}
