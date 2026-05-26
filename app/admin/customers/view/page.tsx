"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/utils/api";
import { CustomerProfileView } from "@/components/admin/CustomerProfileView";

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
          setDbCustomer(customerProfile);
        }

        // 2. Fetch all customers list (for fallback and search)
        const allCustomers = await api.getCustomers();
        if (allCustomers && Array.isArray(allCustomers)) {
          setCustomers(allCustomers.map((c: any) => ({
            id: c.custom_id || `#CST-${c.id}`,
            rawId: c.id,
            name: c.name,
            company: c.company,
            contact: c.contact,
            registeredBy: c.registered_by || "umrahcab",
            lastUpdate: c.last_update || "No edits"
          })));
        } else if (allCustomers && Array.isArray(allCustomers.data)) {
          setCustomers(allCustomers.data.map((c: any) => ({
            id: c.custom_id || `#CST-${c.id}`,
            rawId: c.id,
            name: c.name,
            company: c.company,
            contact: c.contact,
            registeredBy: c.registered_by || "umrahcab",
            lastUpdate: c.last_update || "No edits"
          })));
        }

        // 3. Fetch related Bookings
        const bkgList = await api.getBookings();
        if (bkgList) {
          setBookings(bkgList.map((b: any, idx: number) => ({
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
            customerId: b.customer_id ? `#CST-${b.customer_id}` : `#CST-1`
          })));
        }

        // 4. Fetch related Services
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

        // 5. Fetch Flights
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

        // 6. Fetch Trains
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
        <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #7c3aed", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  // Look up customer record
  const selectedCust = dbCustomer || customers.find(c => String(c.rawId) === targetId || c.id === targetId);

  // Parse contact
  let parsedPhones: string[] = ["N/A"];
  let parsedEmail = "No email provided";
  let parsedNotes = "No external notes.";

  if (selectedCust && selectedCust.contact) {
    const contactStr = selectedCust.contact;
    if (contactStr.includes(" | Notes: ")) {
      const parts = contactStr.split(" | Notes: ");
      parsedNotes = parts[1] || "No external notes.";
    }
    const mainPart = contactStr.split(" | Notes: ")[0];
    const contactParts = mainPart.split(" (P), ");
    if (contactParts[0]) {
      parsedPhones = contactParts[0].split(" / ");
    }
    if (contactParts[1]) {
      parsedEmail = contactParts[1].replace(" (Email)", "").trim();
    }
  }

  const currentProfile = {
    id: selectedCust ? (selectedCust.custom_id || selectedCust.id) : targetId,
    name: selectedCust ? selectedCust.name : "Loading profile...",
    email: selectedCust ? parsedEmail : "No email provided",
    phones: selectedCust ? parsedPhones : ["123456789"],
    company: selectedCust ? selectedCust.company : "Corporate Account",
    meta: {
      registeredBy: selectedCust?.registered_by || selectedCust?.registeredBy || "umrahcab",
      registeredDate: "22 May, 2026 | 08:32 PM",
      lastEditedBy: selectedCust?.registered_by || selectedCust?.registeredBy || "umrahcab",
      lastEditedDate: selectedCust?.last_update || selectedCust?.lastUpdate || "25 May, 2026 | 09:58 AM"
    },
    externalRemarks: selectedCust ? parsedNotes : "No external notes.",
    internalRemarks: "No internal notes."
  };

  // Filter lists down to just this customer's items
  const custRawId = selectedCust?.rawId || 0;
  const filteredBookings = bookings.filter(b => b.customerId === currentProfile.id || String(b.customerId) === String(custRawId));
  const filteredServices = services.filter(s => String(s.customer_id) === String(custRawId));
  const filteredFlights = flights.filter(f => String(f.customer_id) === String(custRawId));
  const filteredTrains = trains.filter(t => String(t.customer_id) === String(custRawId));

  const stats = {
    bookings: filteredBookings.length,
    flights: filteredFlights.length,
    trains: filteredTrains.length,
    services: filteredServices.length
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
