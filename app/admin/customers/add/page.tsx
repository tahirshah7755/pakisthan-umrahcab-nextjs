"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { AddCustomerForm } from "@/components/admin/AddCustomerForm";

interface CompanyItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  invoice: boolean;
  vouchers: boolean;
  reminders: boolean;
}

export default function AddCustomerPage() {
  const router = useRouter();
  
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [custCompany, setCustCompany] = useState("");
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custSecondaryPhone, setCustSecondaryPhone] = useState("");
  const [custAltPhone, setCustAltPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custNotes, setCustNotes] = useState("");

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
    const fetchCompaniesList = async () => {
      try {
        const response = await api.getCompanies();
        if (response) {
          setCompanies(response.map((c: any) => ({
            id: c.custom_id || `#CMP-${c.id}`,
            name: c.name,
            phone: c.phone || "N/A",
            email: c.email || "N/A",
            website: c.website || "N/A",
            address: c.address || "N/A",
            invoice: !!c.invoice,
            vouchers: !!c.vouchers,
            reminders: !!c.reminders
          })));
        }
      } catch (err) {
        console.error("Failed to load companies list", err);
      }
    };
    fetchCompaniesList();
  }, []);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custCompany) {
      showToast("Please fill all required customer fields.", "error");
      return;
    }
    const phones = [custPhone, custSecondaryPhone, custAltPhone].filter(Boolean).join(" / ");
    const emailInfo = custEmail ? `${custEmail} (Email)` : "N/A (Email)";
    const notesInfo = custNotes ? ` | Notes: ${custNotes}` : "";
    const newCust = {
      name: custName,
      company: custCompany,
      contact: `${phones || "N/A"} (P), ${emailInfo}${notesInfo}`,
      registered_by: "umrahcab (Today)",
      last_update: "No edits"
    };
    try {
      const res = await api.createCustomer(newCust);
      if (res) {
        showToast("Customer registered successfully!", "success");
        setCustName(""); 
        setCustPhone(""); 
        setCustEmail("");
        setCustSecondaryPhone("");
        setCustAltPhone("");
        setCustNotes("");
        router.push("/admin/customers");
      } else {
        showToast("Failed to register customer.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to register customer.", "error");
    }
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
      <AddCustomerForm
        custCompany={custCompany}
        setCustCompany={setCustCompany}
        custName={custName}
        setCustName={setCustName}
        custPhone={custPhone}
        setCustPhone={setCustPhone}
        custSecondaryPhone={custSecondaryPhone}
        setCustSecondaryPhone={setCustSecondaryPhone}
        custAltPhone={custAltPhone}
        setCustAltPhone={setCustAltPhone}
        custEmail={custEmail}
        setCustEmail={setCustEmail}
        custNotes={custNotes}
        setCustNotes={setCustNotes}
        companies={companies}
        handleAddCustomer={handleAddCustomer}
        router={router}
      />
    </div>
  );
}
