"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { CustomerDirectory } from "@/components/admin/CustomerDirectory";
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

export default function CustomersPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Redirect if unauthorized
  useEffect(() => {
    if (user && user.role !== "SUPER_ADMIN") {
      const userPerms = (user as any).permissions || {};
      const access = userPerms["customers"] || "none";
      if (access === "none") {
        router.push("/admin/hub");
      }
    }
  }, [user, router]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState("All");

  const [custPage, setCustPage] = useState(1);
  const [custPerPage, setCustPerPage] = useState(10);
  const [totalCustCount, setTotalCustCount] = useState(0);
  const [custTotalPages, setCustTotalPages] = useState(1);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  const fetchCustomersList = async () => {
    try {
      const response = await api.getCustomers(searchTerm, companyFilter, custPage, custPerPage);
      if (response) {
        if (response.data && Array.isArray(response.data)) {
          setCustomers(response.data.map((c: any) => ({
            id: c.custom_id || `#CST-${c.id}`,
            rawId: c.id,
            name: c.name,
            company: c.company,
            contact: c.contact,
            registeredBy: c.registered_by || "umrahcab",
            lastUpdate: c.last_update || "No edits"
          })));
          setTotalCustCount(response.total || response.data.length);
          setCustTotalPages(response.last_page || 1);
        } else if (Array.isArray(response)) {
          setCustomers(response.map((c: any) => ({
            id: c.custom_id || `#CST-${c.id}`,
            rawId: c.id,
            name: c.name,
            company: c.company,
            contact: c.contact,
            registeredBy: c.registered_by || "umrahcab",
            lastUpdate: c.last_update || "No edits"
          })));
          setTotalCustCount(response.length);
          setCustTotalPages(1);
        }
      }
    } catch (err) {
      console.error("Failed to load paginated customers", err);
    }
  };

  useEffect(() => {
    fetchCustomersList();
  }, [searchTerm, companyFilter, custPage, custPerPage]);

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

  const triggerExportAlert = () => {
    alert("Export initiated! Your customer roster is being downloaded as CSV.");
  };

  return (
    <CustomerDirectory
      customers={customers}
      companies={companies}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      companyFilter={companyFilter}
      setCompanyFilter={setCompanyFilter}
      custPage={custPage}
      setCustPage={setCustPage}
      custPerPage={custPerPage}
      setCustPerPage={setCustPerPage}
      totalCustCount={totalCustCount}
      custTotalPages={custTotalPages}
      setEditingCustomer={setEditingCustomer}
      triggerExportAlert={triggerExportAlert}
      router={router}
    />
  );
}
