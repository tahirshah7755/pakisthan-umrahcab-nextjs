"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/utils/api";
import { CustomerProfileView } from "@/components/admin/CustomerProfileView";
import { formatDateTime, formatDateOnly } from "@/utils/formatters";

interface CustomerItem {
  id: string;
  rawId?: number;
  name: string;
  company: string;
  contact: string;
  registeredBy: string;
  lastUpdate: string;
}

function CompanyCustomerViewContent() {
  const router = useRouter();
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
        // 1. Fetch single customer via the company-panel route transparently
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
                details: s.details || `${s.name} (${s.type})`,
                customer_id: s.customer_id
              })));
            }

            // Map flights
            if (Array.isArray(customerProfile.flights)) {
              setFlights(customerProfile.flights.map((f: any) => ({
                id: f.id,
                customer_id: f.customer_id,
                flight_no: f.flight_no,
                leg: f.leg,
                date: f.date,
                time: f.time,
                route: f.route,
                status: f.status
              })));
            }

            // Map trains
            if (Array.isArray(customerProfile.trains)) {
              setTrains(customerProfile.trains.map((t: any) => ({
                id: t.id,
                customer_id: t.customer_id,
                train_no: t.train_no,
                class: t.class,
                date: t.date,
                time: t.time,
                route: t.route,
                status: t.status
              })));
            }

            // Map hotels
            if (Array.isArray(customerProfile.hotels)) {
              setHotels(customerProfile.hotels.map((h: any) => ({
                id: h.id,
                customer_id: h.customer_id,
                hotel_name: h.hotel_name,
                room_no: h.room_no,
                check_in: h.check_in,
                check_out: h.check_out,
                status: h.status
              })));
            }
          }
        }

        // Fetch company customer list for consistency
        const companyCustomers = await api.getCompanyCustomers();
        if (companyCustomers && Array.isArray(companyCustomers)) {
          setCustomers(companyCustomers.map((c: any) => ({
            id: c.custom_id || `#CST-${c.id}`,
            rawId: c.id,
            name: c.name,
            company: c.company,
            contact: c.contact,
            registeredBy: c.registered_by || "umrahcab",
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
        <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #d4af37", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
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
      registeredBy: selectedCust?.registered_by || selectedCust?.registeredBy || "umrahcab",
      registeredDate: selectedCust?.created_at ? formatDateTime(selectedCust.created_at) : "22 May, 2026 08:32 PM",
      lastEditedBy: selectedCust?.registered_by || selectedCust?.registeredBy || "umrahcab",
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
        isCompany={true}
      />
    </div>
  );
}

export default function CompanyCustomerViewPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #d4af37", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <CompanyCustomerViewContent />
    </Suspense>
  );
}
