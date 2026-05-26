"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/utils/api";
import { CustomerDirectory } from "@/components/admin/CustomerDirectory";
import { AddCustomerForm } from "@/components/admin/AddCustomerForm";
import { CustomerProfileView } from "@/components/admin/CustomerProfileView";

// Interface Definitions
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

interface FlightItem {
  id: string;
  custom_id?: string;
  flightNo: string;
  leg: "Arrival" | "Departure" | "Both Legs";
  date: string;
  time: string;
  route: string;
  status: string;
  customer_id?: string | number;
  customer?: any;
}

interface TrainItem {
  id: string;
  dateTime?: string;
  route: string;
  allocation?: string;
  classType?: string;
  pricing?: string;
  status: string;
  trainNo?: string;
  leg?: string;
  date?: string;
  time?: string;
  customer_id?: string | number;
  customer?: any;
  rawId?: number;
}

interface FollowupItem {
  id: string;
  title: string;
  agent: string;
  contact: string;
  date: string;
  status: "Pending" | "In Progress" | "Closed";
  notes: string;
}

interface InvoiceItem {
  id: string;
  customer: string;
  date: string;
  amount: number;
  balance: number;
  status: "Paid" | "Unpaid" | "Overdue";
}

interface LedgerItem {
  id: string;
  company: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

interface PaymentItem {
  id: string;
  company: string;
  date: string;
  method: string;
  amount: number;
  currency: string;
  status: "Verified" | "Pending" | "Rejected";
}

interface NoticeItem {
  id: string;
  title: string;
  date: string;
  priority: "High" | "Medium" | "Low";
  target: "Admin" | "Agent";
  content: string;
}

export default function DynamicWorkspace() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || "";

  // ----------------------------------------------------
  // Toast State & Notifications
  // ----------------------------------------------------
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  // ----------------------------------------------------
  // Initial datasets
  // ----------------------------------------------------
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);

  // Customers Pagination State
  const [custPage, setCustPage] = useState(1);
  const [custPerPage, setCustPerPage] = useState(10);
  const [totalCustCount, setTotalCustCount] = useState(0);
  const [custTotalPages, setCustTotalPages] = useState(1);
  const [flights, setFlights] = useState<FlightItem[]>([]);
  // Flights Pagination & Filter State
  const [fltPage, setFltPage] = useState(1);
  const [fltPerPage, setFltPerPage] = useState(10);
  const [totalFltCount, setTotalFltCount] = useState(0);
  const [fltTotalPages, setFltTotalPages] = useState(1);
  const [fltSearch, setFltSearch] = useState("");
  const [fltLegFilter, setFltLegFilter] = useState("All");
  const [fltStatusFilter, setFltStatusFilter] = useState("All");
  const [fltStartDate, setFltStartDate] = useState("");
  const [fltEndDate, setFltEndDate] = useState("");
  const [fltHasSearched, setFltHasSearched] = useState(false);
  // Flights Customer Selection State
  const [fltCustomerSearch, setFltCustomerSearch] = useState("");
  const [fltCustomerIsOpen, setFltCustomerIsOpen] = useState(false);
  const [fltCustomerPage, setFltCustomerPage] = useState(1);
  const [fltCustomerHasMore, setFltCustomerHasMore] = useState(true);
  const [fltCustomersList, setFltCustomersList] = useState<any[]>([]);
  const [fltSelectedCustomerObj, setFltSelectedCustomerObj] = useState<any | null>(null);
  const [fltLoadingCustomers, setFltLoadingCustomers] = useState(false);
  // Flight Edit/View Modal States
  const [fltSelected, setFltSelected] = useState<any>(null);
  const [fltShowView, setFltShowView] = useState(false);
  const [fltShowEdit, setFltShowEdit] = useState(false);
  const [editFltNo, setEditFltNo] = useState("");
  const [editFltDate, setEditFltDate] = useState("");
  const [editFltTime, setEditFltTime] = useState("");
  const [editFltLeg, setEditFltLeg] = useState("Arrival");
  const [editFltRoute, setEditFltRoute] = useState("");
  const [editFltStatus, setEditFltStatus] = useState("On Time");
  const [editFltCustomerId, setEditFltCustomerId] = useState("");
  const [editFltCustomerName, setEditFltCustomerName] = useState("");
  const [editFltCustomerSearch, setEditFltCustomerSearch] = useState("");
  const [editFltCustomerIsOpen, setEditFltCustomerIsOpen] = useState(false);
  const [editFltCustomerPage, setEditFltCustomerPage] = useState(1);
  const [editFltCustomerHasMore, setEditFltCustomerHasMore] = useState(true);
  const [editFltCustomersList, setEditFltCustomersList] = useState<any[]>([]);
  const [editFltLoadingCustomers, setEditFltLoadingCustomers] = useState(false);

  // Single Flight View Page States
  const searchParams = useSearchParams();
  const queryId = searchParams ? searchParams.get("id") : null;
  const [singleFlt, setSingleFlt] = useState<any | null>(null);
  const [singleFltAudits, setSingleFltAudits] = useState<any[]>([]);
  const [singleFltLoading, setSingleFltLoading] = useState(false);
  const [singleFltError, setSingleFltError] = useState("");

  const formatScheduleDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formatTime12h = (timeStr: string) => {
    if (!timeStr) return "";
    try {
      const [hours, minutes] = timeStr.split(":");
      const h = parseInt(hours, 10);
      const ampm = h >= 12 ? "PM" : "AM";
      const formattedHours = h % 12 || 12;
      const pad = (n: number) => n < 10 ? `0${n}` : n;
      return `${pad(formattedHours)}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  // Fetch flight details for single flight view or edit page
  useEffect(() => {
    if ((slug !== "flights-view" && slug !== "flights-edit") || !queryId) return;

    const fetchSingleFlight = async () => {
      try {
        setSingleFltLoading(true);
        setSingleFltError("");
        const res = await api.getFlight(queryId);
        if (res && res.flight) {
          setSingleFlt(res.flight);
          setSingleFltAudits(res.audits || []);
          
          // Prepopulate edit states if slug is flights-edit
          if (slug === "flights-edit") {
            const f = res.flight;
            setEditFltNo(f.flight_no || "");
            setEditFltDate(f.date || "");
            setEditFltTime(f.time ? f.time.substring(0, 5) : "");
            setEditFltLeg(f.leg || "Arrival");
            setEditFltRoute(f.route || "");
            setEditFltStatus(f.status || "On Time");
            setEditFltCustomerId(f.customer_id ? String(f.customer_id) : "");
            setEditFltCustomerName(f.customer ? f.customer.name : "");
            setFltSelected(f);
          }
        } else {
          setSingleFltError("Failed to load flight details.");
        }
      } catch (err: any) {
        console.error("Failed to load flight details:", err);
        setSingleFltError(err.message || "An error occurred while loading flight details.");
      } finally {
        setSingleFltLoading(false);
      }
    };

    fetchSingleFlight();
  }, [slug, queryId]);

  // Single Train View Page States
  const [singleTrn, setSingleTrn] = useState<any | null>(null);
  const [singleTrnAudits, setSingleTrnAudits] = useState<any[]>([]);
  const [singleTrnLoading, setSingleTrnLoading] = useState(false);
  const [singleTrnError, setSingleTrnError] = useState("");

  // Edit train states
  const [editTrnNo, setEditTrnNo] = useState("");
  const [editTrnDate, setEditTrnDate] = useState("");
  const [editTrnTime, setEditTrnTime] = useState("");
  const [editTrnLeg, setEditTrnLeg] = useState("Arrival");
  const [editTrnRoute, setEditTrnRoute] = useState("");
  const [editTrnStatus, setEditTrnStatus] = useState("Confirmed");
  const [editTrnCustomerId, setEditTrnCustomerId] = useState("");
  const [editTrnCustomerName, setEditTrnCustomerName] = useState("");
  const [editTrnCustomerSearch, setEditTrnCustomerSearch] = useState("");
  const [editTrnCustomerIsOpen, setEditTrnCustomerIsOpen] = useState(false);
  const [editTrnCustomerPage, setEditTrnCustomerPage] = useState(1);
  const [editTrnCustomerHasMore, setEditTrnCustomerHasMore] = useState(true);
  const [editTrnCustomersList, setEditTrnCustomersList] = useState<any[]>([]);
  const [editTrnLoadingCustomers, setEditTrnLoadingCustomers] = useState(false);
  const [trnSelected, setTrnSelected] = useState<any | null>(null);

  // Fetch train details for single train view or edit page
  useEffect(() => {
    if ((slug !== "trains-view" && slug !== "trains-edit") || !queryId) return;

    const fetchSingleTrain = async () => {
      try {
        setSingleTrnLoading(true);
        setSingleTrnError("");
        const res = await api.getTrain(queryId);
        if (res && res.id) {
          setSingleTrn(res);
          setSingleTrnAudits(res.audits || []);
          
          if (slug === "trains-edit") {
            const t = res;
            setTrnSelectedCustomerObj(t.customer || null);
            setTrnLeg(t.leg || "Arrival");
            setEditTrnStatus(t.status || "Confirmed");
            
            if (t.leg === "Arrival" || t.leg === "Both Legs") {
              setTrnArrTrainNo(t.train_no || "");
              setTrnArrStation(t.route || "");
              setTrnArrDate(t.date || "");
              setTrnArrTime(t.time ? t.time.substring(0, 5) : "");
            }
            if (t.leg === "Departure" || t.leg === "Both Legs") {
              setTrnDepTrainNo(t.train_no || "");
              setTrnDepStation(t.route || "");
              setTrnDepDate(t.date || "");
              setTrnDepTime(t.time ? t.time.substring(0, 5) : "");
            }
            setTrnSelected(t);
          }
        } else {
          setSingleTrnError("Failed to load train details.");
        }
      } catch (err: any) {
        console.error("Failed to load train details:", err);
        setSingleTrnError(err.message || "An error occurred while loading train details.");
      } finally {
        setSingleTrnLoading(false);
      }
    };

    fetchSingleTrain();
  }, [slug, queryId]);

  const [trains, setTrains] = useState<TrainItem[]>([]);
  // Trains Pagination & Filter State
  const [trnPage, setTrnPage] = useState(1);
  const [trnPerPage, setTrnPerPage] = useState(10);
  const [totalTrnCount, setTotalTrnCount] = useState(0);
  const [trnTotalPages, setTrnTotalPages] = useState(1);
  const [trnSearch, setTrnSearch] = useState("");
  const [trnLegFilter, setTrnLegFilter] = useState("All");
  const [trnStatusFilter, setTrnStatusFilter] = useState("All");
  const [trnStartDate, setTrnStartDate] = useState("");
  const [trnEndDate, setTrnEndDate] = useState("");
  // Trains Customer Selection State
  const [trnCustomerSearch, setTrnCustomerSearch] = useState("");
  const [trnCustomerIsOpen, setTrnCustomerIsOpen] = useState(false);
  const [trnCustomerPage, setTrnCustomerPage] = useState(1);
  const [trnCustomerHasMore, setTrnCustomerHasMore] = useState(true);
  const [trnCustomersList, setTrnCustomersList] = useState<any[]>([]);
  const [trnSelectedCustomerObj, setTrnSelectedCustomerObj] = useState<any | null>(null);
  const [trnLoadingCustomers, setTrnLoadingCustomers] = useState(false);
  const [followups, setFollowups] = useState<FollowupItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [ledgers, setLedgers] = useState<LedgerItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);

  // Services Pagination & Filter State
  const [srvPage, setSrvPage] = useState(1);
  const [srvPerPage, setSrvPerPage] = useState(10);
  const [totalSrvCount, setTotalSrvCount] = useState(0);
  const [srvTotalPages, setSrvTotalPages] = useState(1);
  const [srvSearch, setSrvSearch] = useState("");
  const [srvStatusFilter, setSrvStatusFilter] = useState("All");

  // Service Items Catalog Pagination & Search State
  const [catalogItemsPage, setCatalogItemsPage] = useState(1);
  const [catalogItemsPerPage, setCatalogItemsPerPage] = useState(25);
  const [catalogItemsSearch, setCatalogItemsSearch] = useState("");

  // Companies Pagination & Search State
  const [comPage, setComPage] = useState(1);
  const [comPerPage, setComPerPage] = useState(10);
  const [comSearch, setComSearch] = useState("");

  // Single Service Details Loader State
  const [singleService, setSingleService] = useState<any>(null);
  const [loadingSingleService, setLoadingSingleService] = useState(true);
  const [activeSrvTab, setActiveSrvTab] = useState("Dispatch Details");

  // Edit form states
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);
  const [editingCompany, setEditingCompany] = useState<CompanyItem | null>(null);
  const [viewingCompany, setViewingCompany] = useState<CompanyItem | null>(null);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [viewingService, setViewingService] = useState<any | null>(null);
  const [selectedProfileBooking, setSelectedProfileBooking] = useState<any | null>(null);
  const [selectedProfileFlight, setSelectedProfileFlight] = useState<any | null>(null);
  const [selectedProfileTrain, setSelectedProfileTrain] = useState<any | null>(null);

  // Catalogue Items states
  const [editingCatalogItem, setEditingCatalogItem] = useState<any | null>(null);
  const [creatingCatalogItem, setCreatingCatalogItem] = useState<boolean>(false);
  const [catalogItemName, setCatalogItemName] = useState("");

  // Reminders workspace filter state hooks
  const [reminderDate, setReminderDate] = useState("2026-05-25");
  const [reminderSearch, setReminderSearch] = useState("");
  const [reminderLimit, setReminderLimit] = useState(100);
  const [bookings, setBookings] = useState<any[]>([]);
  const [copiedReminders, setCopiedReminders] = useState<Record<string, boolean>>({});
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [flpTitle, setFlpTitle] = useState("");
  const [flpAgent, setFlpAgent] = useState("umrahcab");
  const [flpContact, setFlpContact] = useState("");
  const [flpDate, setFlpDate] = useState("2026-05-25");
  const [flpNotes, setFlpNotes] = useState("");

  // Service form fields
  const [srvName, setSrvName] = useState("");
  const [srvType, setSrvType] = useState("Visa");
  const [srvDesc, setSrvDesc] = useState("");
  const [srvPrice, setSrvPrice] = useState("");
  const [srvPickupLocation, setSrvPickupLocation] = useState("");
  const [srvStatus, setSrvStatus] = useState("Pending");
  const [srvDriverCash, setSrvDriverCash] = useState("");
  const [srvDate, setSrvDate] = useState("");
  const [srvTime, setSrvTime] = useState("");
  const [srvRemarks, setSrvRemarks] = useState("");
  const [srvCustomerSearch, setSrvCustomerSearch] = useState("");
  const [srvCustomerIsOpen, setSrvCustomerIsOpen] = useState(false);
  const [srvSelectedCustomerObj, setSrvSelectedCustomerObj] = useState<any>(null);
  const [srvCustomerPage, setSrvCustomerPage] = useState(1);
  const [srvCustomerHasMore, setSrvCustomerHasMore] = useState(true);
  const [srvCustomersList, setSrvCustomersList] = useState<any[]>([]);
  const [srvLoadingCustomers, setSrvLoadingCustomers] = useState(true);
  const [srvCatalogSearch, setSrvCatalogSearch] = useState("");
  const [srvCatalogIsOpen, setSrvCatalogIsOpen] = useState(false);
  const [srvSelectedCatalogObj, setSrvSelectedCatalogObj] = useState<any>(null);
  const [srvCatalogPage, setSrvCatalogPage] = useState(1);
  const [srvCatalogHasMore, setSrvCatalogHasMore] = useState(true);
  const [srvCatalogList, setSrvCatalogList] = useState<any[]>([]);
  const [srvLoadingCatalog, setSrvLoadingCatalog] = useState(true);

  // Reset catalog pagination to page 1 whenever the search keyword changes
  useEffect(() => {
    setSrvCatalogPage(1);
    setSrvCatalogHasMore(true);
  }, [srvCatalogSearch]);

  // Reset pagination to page 1 whenever the search keyword changes
  useEffect(() => {
    setSrvCustomerPage(1);
    setSrvCustomerHasMore(true);
  }, [srvCustomerSearch]);

  // Reset flights customer pagination when search keyword changes
  useEffect(() => {
    setFltCustomerPage(1);
    setFltCustomerHasMore(true);
  }, [fltCustomerSearch]);

  // Fetch customers list for fltCustomerDropdown paginated/searched
  useEffect(() => {
    if (slug !== "flights-add" && slug !== "flights-edit") return;
    const delayDebounceFn = setTimeout(async () => {
      try {
        setFltLoadingCustomers(true);
        const data = await api.getCustomers(fltCustomerSearch, undefined, fltCustomerPage, 10);
        let newItems: any[] = [];
        if (data && Array.isArray(data)) {
          newItems = data;
        } else if (data && data.data && Array.isArray(data.data)) {
          newItems = data.data;
        }

        if (newItems.length < 10) {
          setFltCustomerHasMore(false);
        }

        setFltCustomersList((prev) => {
          if (fltCustomerPage === 1) {
            return newItems;
          } else {
            const existingIds = new Set(prev.map((item) => item.id));
            const uniqueNewItems = newItems.filter((item) => !existingIds.has(item.id));
            return [...prev, ...uniqueNewItems];
          }
        });
      } catch (err) {
        console.error("Flights Search / Pagination API failed:", err);
      } finally {
        setFltLoadingCustomers(false);
      }
    }, fltCustomerPage === 1 ? 300 : 0);

    return () => clearTimeout(delayDebounceFn);
  }, [fltCustomerSearch, fltCustomerPage, slug]);

  // Fetch customers list for editFltCustomerDropdown paginated/searched
  useEffect(() => {
    setEditFltCustomerPage(1);
    setEditFltCustomerHasMore(true);
  }, [editFltCustomerSearch]);

  useEffect(() => {
    if (slug !== "flights-check" || !fltShowEdit) return;
    const delayDebounceFn = setTimeout(async () => {
      try {
        setEditFltLoadingCustomers(true);
        const data = await api.getCustomers(editFltCustomerSearch, undefined, editFltCustomerPage, 10);
        let newItems: any[] = [];
        if (data && Array.isArray(data)) {
          newItems = data;
        } else if (data && data.data && Array.isArray(data.data)) {
          newItems = data.data;
        }

        if (newItems.length < 10) {
          setEditFltCustomerHasMore(false);
        }

        setEditFltCustomersList((prev) => {
          if (editFltCustomerPage === 1) {
            return newItems;
          } else {
            const existingIds = new Set(prev.map((item) => item.id));
            const uniqueNewItems = newItems.filter((item) => !existingIds.has(item.id));
            return [...prev, ...uniqueNewItems];
          }
        });
      } catch (err) {
        console.error("Flights Edit Customer search failed:", err);
      } finally {
        setEditFltLoadingCustomers(false);
      }
    }, editFltCustomerPage === 1 ? 300 : 0);

    return () => clearTimeout(delayDebounceFn);
  }, [editFltCustomerSearch, editFltCustomerPage, fltShowEdit, slug]);

  // Reset trains customer pagination when search keyword changes
  useEffect(() => {
    setTrnCustomerPage(1);
    setTrnCustomerHasMore(true);
  }, [trnCustomerSearch]);

  // Fetch customers list for trnCustomerDropdown paginated/searched
  useEffect(() => {
    if (slug !== "trains-add" && slug !== "trains-edit") return;
    const delayDebounceFn = setTimeout(async () => {
      try {
        setTrnLoadingCustomers(true);
        const data = await api.getCustomers(trnCustomerSearch, undefined, trnCustomerPage, 10);
        let newItems: any[] = [];
        if (data && Array.isArray(data)) {
          newItems = data;
        } else if (data && data.data && Array.isArray(data.data)) {
          newItems = data.data;
        }
        if (newItems.length < 10) {
          setTrnCustomerHasMore(false);
        }
        setTrnCustomersList((prev) => {
          if (trnCustomerPage === 1) {
            return newItems;
          } else {
            const existingIds = new Set(prev.map((item) => item.id));
            const uniqueNewItems = newItems.filter((item) => !existingIds.has(item.id));
            return [...prev, ...uniqueNewItems];
          }
        });
      } catch (err) {
        console.error("Trains Search / Pagination API failed:", err);
      } finally {
        setTrnLoadingCustomers(false);
      }
    }, trnCustomerPage === 1 ? 300 : 0);
    return () => clearTimeout(delayDebounceFn);
  }, [trnCustomerSearch, trnCustomerPage, slug]);

  // Reset companies pagination to page 1 whenever search query changes
  useEffect(() => {
    setComPage(1);
  }, [comSearch]);

  // Global click listener to close custom dropdowns on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".form-input-wrapper") && !target.closest(".dropdown-menu")) {
        setSrvCustomerIsOpen(false);
        setSrvCatalogIsOpen(false);
        setFltCustomerIsOpen(false);
        setTrnCustomerIsOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  // Fetch customers list for srvCustomerDropdown paginated/searched
  useEffect(() => {
    if (slug !== "services-add") return;
    const delayDebounceFn = setTimeout(async () => {
      try {
        setSrvLoadingCustomers(true);
        const data = await api.getCustomers(srvCustomerSearch, undefined, srvCustomerPage, 10);
        let newItems: any[] = [];
        if (data && Array.isArray(data)) {
          newItems = data;
        } else if (data && data.data && Array.isArray(data.data)) {
          newItems = data.data;
        }

        if (newItems.length < 10) {
          setSrvCustomerHasMore(false);
        }

        setSrvCustomersList((prev) => {
          if (srvCustomerPage === 1) {
            return newItems;
          } else {
            const existingIds = new Set(prev.map((item) => item.id));
            const uniqueNewItems = newItems.filter((item) => !existingIds.has(item.id));
            return [...prev, ...uniqueNewItems];
          }
        });
      } catch (err) {
        console.error("Search / Pagination API failed:", err);
      } finally {
        setSrvLoadingCustomers(false);
      }
    }, srvCustomerPage === 1 ? 300 : 0);

    return () => clearTimeout(delayDebounceFn);
  }, [srvCustomerSearch, srvCustomerPage, slug]);

  // Fetch service catalogue list for srvCatalogDropdown paginated/searched
  useEffect(() => {
    if (slug !== "services-add") return;
    const delayDebounceFn = setTimeout(async () => {
      try {
        setSrvLoadingCatalog(true);
        const data = await api.getServices(srvCatalogSearch, undefined, srvCatalogPage, 10, undefined, true);
        let newItems: any[] = [];
        if (data && Array.isArray(data)) {
          newItems = data;
        } else if (data && data.data && Array.isArray(data.data)) {
          newItems = data.data;
        }

        if (newItems.length < 10) {
          setSrvCatalogHasMore(false);
        }

        setSrvCatalogList((prev) => {
          if (srvCatalogPage === 1) {
            return newItems;
          } else {
            const existingIds = new Set(prev.map((item) => item.id));
            const uniqueNewItems = newItems.filter((item) => !existingIds.has(item.id));
            return [...prev, ...uniqueNewItems];
          }
        });
      } catch (err) {
        console.error("Error fetching services catalog for services-add:", err);
      } finally {
        setSrvLoadingCatalog(false);
      }
    }, srvCatalogPage === 1 ? 300 : 0);

    return () => clearTimeout(delayDebounceFn);
  }, [srvCatalogSearch, srvCatalogPage, slug]);

  const [activeProfileTab, setActiveProfileTab] = useState("overview");
  const [serviceCatalogue, setServiceCatalogue] = useState<any[]>([]);
  const [showCatModal, setShowCatModal] = useState(false);
  const [catModalMode, setCatModalMode] = useState<"add" | "edit">("add");
  const [catItemName, setCatItemName] = useState("");
  const [editingCatItem, setEditingCatItem] = useState<any | null>(null);
  const [catSearch, setCatSearch] = useState("");
  const [selectedCustomerProfile, setSelectedCustomerProfile] = useState<any | null>(null);

  // Load datasets dynamically based on current page slug
  useEffect(() => {
    async function loadBackendData() {
      try {
        if (slug === "customers-all" || slug === "customers-add") {
          const comList = await api.getCompanies();
          if (comList) {
            setCompanies(comList.map((com: any) => ({
              id: com.custom_id || `#COM-${com.id}`,
              name: com.name,
              phone: com.phone,
              email: com.email,
              website: com.website,
              address: com.address,
              invoice: com.invoice === 1 || com.invoice === true,
              vouchers: com.vouchers === 1 || com.vouchers === true,
              reminders: com.reminders === 1 || com.reminders === true
            })));
          }
        }
        else if (slug === "customers-view") {
          const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
          const targetId = searchParams?.get("id");
          if (targetId) {
            const resData = await api.getCustomer(targetId);
            
            if (resData) {
              const singleCust = resData.customer;
              const bkList = resData.bookings || [];
              const srvList = resData.services || [];
              const fltList = resData.flights || [];
              const trnList = resData.trains || [];

              if (singleCust) {
                setSelectedCustomerProfile({
                  id: singleCust.custom_id || `#CST-${singleCust.id}`,
                  rawId: singleCust.id,
                  name: singleCust.name,
                  company: singleCust.company,
                  contact: singleCust.contact,
                  registeredBy: singleCust.registered_by || "umrahcab",
                  lastUpdate: singleCust.last_update || "No edits"
                });
              }
              if (bkList) {
                setBookings(bkList.map((b: any, idx: number) => ({
                  id: b.booking_code || `#BKG-87${idx + 10}`,
                  rawId: b.id ? String(b.id) : `87${idx + 10}`,
                  type: "BKG",
                  date: b.date || "2026-05-25",
                  time: b.time || "10:30 AM",
                  customerName: b.full_name || b.fullName || "Guest",
                  companyName: b.company || "Zahid Travels",
                  details: `${b.pickup || "Jeddah Airport"} → ${b.destination || "Makkah Hotel"}`,
                  vehicle: b.car_type || b.carType || "Sedan (Standard)",
                  phones: [b.whatsapp],
                  customerId: singleCust ? (singleCust.custom_id || `#CST-${singleCust.id}`) : `#CST-1`
                })));
              }
              if (srvList) {
                setServices(srvList.map((s: any, idx: number) => ({
                  id: s.custom_id || `#SRV-${s.id}`,
                  rawId: s.id ? String(s.id) : `00${idx + 1}`,
                  type: "SRV",
                  date: s.date || "2026-05-25",
                  time: s.time || "12:00 AM",
                  customerName: singleCust ? singleCust.name : "Guest",
                  companyName: singleCust ? singleCust.company : "Zahid Travels",
                  details: `${s.name} (${s.description || "Service Details"})`,
                  vehicle: "N/A",
                  phones: [],
                  customerId: singleCust ? (singleCust.custom_id || `#CST-${singleCust.id}`) : `#CST-3`
                })));
              }
              if (fltList) {
                setFlights(fltList.map((f: any) => ({
                  id: String(f.id),
                  custom_id: f.custom_id || `#FLT-${f.id}`,
                  flightNo: f.flight_no,
                  leg: f.leg,
                  date: f.date,
                  time: f.time,
                  route: f.route,
                  status: f.status,
                  customer_id: f.customer_id,
                  customer: f.customer
                })));
              }
              if (trnList) {
                setTrains(trnList.map((t: any) => ({
                  id: t.custom_id || `#TRN-${t.id}`,
                  dateTime: `${t.date} ${t.time}`,
                  route: t.route,
                  allocation: `${t.train_no} / Leg: ${t.leg}`,
                  classType: "Standard",
                  pricing: "SAR 350.00",
                  status: t.status
                })));
              }
            }
          }
        }

        else if (slug === "companies" || slug === "companies-add" || slug === "companies-view" || slug === "companies-edit") {
          const comList = await api.getCompanies();
          if (comList) {
            setCompanies(comList.map((com: any) => ({
              id: com.custom_id || `#COM-${com.id}`,
              name: com.name,
              phone: com.phone,
              email: com.email,
              website: com.website,
              address: com.address,
              invoice: com.invoice === 1 || com.invoice === true,
              vouchers: com.vouchers === 1 || com.vouchers === true,
              reminders: com.reminders === 1 || com.reminders === true,
              ledger_frequency: com.ledger_frequency || "Monday",
              tomorrow_reminder: com.tomorrow_reminder === 1 || com.tomorrow_reminder === true,
              exempt_bulk_lock: com.exempt_bulk_lock === 1 || com.exempt_bulk_lock === true,
              remarks: com.remarks || "",
              logo_path: com.logo_path || ""
            })));
          }
        }

        else if (slug === "flights-add") {
          const fltList = await api.getFlights();
          if (fltList) {
            setFlights(fltList.map((f: any) => ({
              id: String(f.id),
              custom_id: f.custom_id || `#FLT-${f.id}`,
              flightNo: f.flight_no,
              leg: f.leg,
              date: f.date,
              time: f.time ? f.time.substring(0, 5) : "",
              route: f.route,
              status: f.status,
              customer_id: f.customer_id,
              customer: f.customer
            })));
          }
        }

        else if (slug === "trains-add") {
          const trnList = await api.getTrains();
          if (trnList) {
            setTrains(trnList.map((t: any) => ({
              id: t.custom_id || `#TRN-${t.id}`,
              trainNo: t.train_no,
              leg: t.leg,
              date: t.date,
              time: t.time ? t.time.substring(0, 5) : "",
              route: t.route,
              status: t.status
            })));
          }
        }

        else if (slug === "invoices") {
          const invList = await api.getInvoices();
          if (invList) {
            setInvoices(invList.map((i: any) => ({
              id: i.invoice_code || `INV-${i.id}`,
              customer: i.customer,
              date: i.date,
              amount: parseFloat(i.amount),
              balance: parseFloat(i.balance),
              status: i.status
            })));
          }
        }

        else if (slug === "ledgers") {
          const ledgList = await api.getLedgers();
          if (ledgList) {
            setLedgers(ledgList.map((l: any) => ({
              id: l.custom_id || `LED-${l.id}`,
              company: l.company,
              date: l.date,
              description: l.description,
              debit: parseFloat(l.debit),
              credit: parseFloat(l.credit),
              balance: parseFloat(l.balance)
            })));
          }
        }

        else if (slug === "payments" || slug === "payments-add") {
          const [payList, comList] = await Promise.all([
            api.getPayments(),
            api.getCompanies()
          ]);
          if (payList) {
            setPayments(payList.map((p: any) => ({
              id: p.custom_id || `PAY-${p.id}`,
              company: p.company,
              date: p.date,
              method: p.method,
              amount: parseFloat(p.amount),
              currency: p.currency,
              status: p.status
            })));
          }
          if (comList) {
            setCompanies(comList.map((com: any) => ({
              id: com.custom_id || `#COM-${com.id}`,
              name: com.name,
              phone: com.phone,
              email: com.email,
              website: com.website,
              address: com.address,
              invoice: com.invoice === 1 || com.invoice === true,
              vouchers: com.vouchers === 1 || com.vouchers === true,
              reminders: com.reminders === 1 || com.reminders === true
            })));
          }
        }

        else if (slug === "admin-notices" || slug === "agent-notices" || slug === "notices-add") {
          const notList = await api.getNotices();
          if (notList) {
            setNotices(notList.map((n: any) => ({
              id: n.custom_id || `NTC-${n.id}`,
              title: n.title,
              date: n.date,
              priority: n.priority,
              target: n.target,
              content: n.content
            })));
          }
        }

        else if (slug === "fleet") {
          const fltFleet = await api.getFleet();
          if (fltFleet) {
            setFleetList(fltFleet.map((f: any) => ({
              id: f.id,
              model: f.model,
              count: parseInt(f.count),
              active: parseInt(f.active)
            })));
          }
        }
        else if (slug === "audit-log") {
          const audList = await api.getAudits();
          if (audList) {
            setAudits(audList.map((a: any) => ({
              id: a.custom_id || `#AUD-${a.id}`,
              user_session: a.user_session || "umrahcab",
              ip_location: a.ip_location || "127.0.0.1",
              performed_action: a.performed_action,
              created_at: a.created_at || new Date().toISOString()
            })));
          }
        }
        else if (slug === "services-items") {
          const srvList = await api.getServices();
          if (srvList) {
            const catalogueItems = srvList.filter((s: any) => s.type === "Catalogue");
            setServiceCatalogue(catalogueItems.map((s: any) => {
              const desc = s.description || "";
              const entryByMatch = desc.match(/Entry By:\s*([^|]+)/i);
              const entryDateMatch = desc.match(/Entry Date:\s*([^|]+)/i);
              const editedByMatch = desc.match(/Edited By:\s*([^|]+)/i);
              const editedDateMatch = desc.match(/Edited Date:\s*([^|]+)/i);

              return {
                id: s.id,
                custom_id: s.custom_id,
                name: s.name,
                entryBy: entryByMatch ? entryByMatch[1].trim() : "umrahcab",
                entryDate: entryDateMatch ? entryDateMatch[1].trim() : new Date(s.created_at || Date.now()).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
                editedBy: editedByMatch ? editedByMatch[1].trim() : "N/A",
                editedDate: editedDateMatch ? editedDateMatch[1].trim() : "N/A"
              };
            }));
          }
        }
        else if (slug === "services-add" || slug === "services-view") {
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
              time: s.time
            })));

            // Eager-load catalogue items for the service dropdown
            const catalogueItems = srvList.filter((s: any) => s.type === "Catalogue" || s.customer_id === null);
            setServiceCatalogue(catalogueItems.map((s: any) => ({
              id: s.id,
              custom_id: s.custom_id,
              name: s.name,
              type: s.type,
              base_price: parseFloat(s.base_price || 0)
            })));
          }
        }
        else if (slug === "agent-followups") {
          const flpList = await api.getFollowups();
          if (flpList) {
            setFollowups(flpList.map((f: any) => ({
              id: f.custom_id || `#FLP-${f.id}`,
              title: f.title,
              agent: f.agent,
              contact: f.contact,
              date: f.date,
              status: f.status,
              notes: f.notes
            })));
          }
        }
        else if (slug === "reminders") {
          const [bkList, srvList, custList] = await Promise.all([
            api.getBookings(),
            api.getServices(),
            api.getCustomers()
          ]);
          
          if (bkList) {
            setBookings(bkList.map((b: any, idx: number) => {
              const matchedCust = custList ? custList.find((c: any) => c.name === b.fullName) : null;
              return {
                id: b.booking_code || `#BKG-87${idx + 10}`,
                rawId: b.id ? String(b.id) : `87${idx + 10}`,
                type: "BKG",
                date: b.date || "2026-05-25",
                time: b.time || "10:30 AM",
                customerName: b.fullName || "Guest",
                companyName: matchedCust ? matchedCust.company : "Zahid Travels",
                details: `${b.pickup || "Jeddah Airport"} → ${b.destination || "Makkah Hotel"}`,
                vehicle: b.carType || "Sedan (Standard)",
                phones: matchedCust && matchedCust.contact ? [matchedCust.contact.split(" ")[0]] : ["+966501234567"],
                customerId: matchedCust ? (matchedCust.custom_id || `#CST-${matchedCust.id}`) : `#CST-1`
              };
            }));
          }
          
          if (srvList) {
            setServices(srvList.map((s: any, idx: number) => {
              const matchedCust = custList ? custList.find((c: any) => c.company === "Zahid Travels" || c.company === "Al-Latif Group") : null;
              return {
                id: s.custom_id || `#SRV-${s.id}`,
                rawId: s.id ? String(s.id) : `00${idx + 1}`,
                type: "SRV",
                date: s.date || "2026-05-25",
                time: s.time || "12:00 AM",
                customerName: matchedCust ? matchedCust.name : "Zubair Ahmad",
                companyName: matchedCust ? matchedCust.company : "Zahid Travels",
                details: `${s.name} (${s.description || "Service Details"})`,
                vehicle: "N/A",
                phones: matchedCust && matchedCust.contact ? [matchedCust.contact.split(" ")[0]] : ["+966549876543"],
                customerId: matchedCust ? (matchedCust.custom_id || `#CST-${matchedCust.id}`) : `#CST-3`
              };
            }));
          }
        }
      } catch (err) {
        console.error("Failed loading backend datasets for slug: " + slug, err);
      }
    }
    loadBackendData();
  }, [slug]);


  // ----------------------------------------------------
  // Search & Filter State
  // ----------------------------------------------------
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState("All");

  // Fetch paginated customers from Laravel API
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

  // Dedicated useEffect to load paginated/filtered customers
  useEffect(() => {
    if (slug !== "customers-all") return;
    
    const timer = setTimeout(() => {
      fetchCustomersList();
    }, 200); // 200ms debounce to prevent spamming queries while typing

    return () => clearTimeout(timer);
  }, [slug, searchTerm, companyFilter, custPage, custPerPage]);

  // Fetch paginated services from Laravel API
  const fetchServicesList = async () => {
    try {
      const response = await api.getServices(srvSearch, undefined, srvPage, srvPerPage, srvStatusFilter);
      if (response) {
        if (response.data && Array.isArray(response.data)) {
          setServices(response.data.map((s: any) => ({
            id: s.custom_id || `#SRV-${s.id}`,
            rawId: s.id,
            name: s.name,
            type: s.type,
            description: s.description,
            basePrice: parseFloat(s.base_price || 0),
            status: s.status || "Active",
            customerName: s.customer ? s.customer.name : "Guest",
            companyName: s.customer ? s.customer.company : "Walk-in",
            pickup: s.pickup,
            driverCash: parseFloat(s.driver_cash || 0),
            date: s.date,
            time: s.time
          })));
          setTotalSrvCount(response.total || response.data.length);
          setSrvTotalPages(response.last_page || 1);
        } else if (Array.isArray(response)) {
          setServices(response.map((s: any) => ({
            id: s.custom_id || `#SRV-${s.id}`,
            rawId: s.id,
            name: s.name,
            type: s.type,
            description: s.description,
            basePrice: parseFloat(s.base_price || 0),
            status: s.status || "Active",
            customerName: s.customer ? s.customer.name : "Guest",
            companyName: s.customer ? s.customer.company : "Walk-in",
            pickup: s.pickup,
            driverCash: parseFloat(s.driver_cash || 0),
            date: s.date,
            time: s.time
          })));
          setTotalSrvCount(response.length);
          setSrvTotalPages(1);
        }
      }
    } catch (err) {
      console.error("Failed to load paginated services", err);
    }
  };

  // Dedicated useEffect to load paginated/filtered services
  useEffect(() => {
    if (slug !== "services-all") return;
    
    const timer = setTimeout(() => {
      fetchServicesList();
    }, 200); // 200ms debounce to prevent spamming queries while typing

    return () => clearTimeout(timer);
  }, [slug, srvSearch, srvStatusFilter, srvPage, srvPerPage]);

  // Fetch paginated trains from Laravel API
  const fetchTrainsList = async () => {
    try {
      const response = await api.getTrains(trnSearch, trnLegFilter, trnPage, trnPerPage, trnStatusFilter, trnStartDate, trnEndDate);
      if (response) {
        if (response.data && Array.isArray(response.data)) {
          setTrains(response.data.map((t: any) => ({
            id: t.custom_id || `#TRN-${t.id}`,
            rawId: t.id,
            trainNo: t.train_no,
            leg: t.leg,
            date: t.date,
            time: t.time ? t.time.substring(0, 5) : "",
            route: t.route,
            status: t.status,
            customer_id: t.customer_id,
            customer: t.customer
          })));
          setTotalTrnCount(response.total || response.data.length);
          setTrnTotalPages(response.last_page || 1);
        } else if (Array.isArray(response)) {
          setTrains(response.map((t: any) => ({
            id: t.custom_id || `#TRN-${t.id}`,
            rawId: t.id,
            trainNo: t.train_no,
            leg: t.leg,
            date: t.date,
            time: t.time ? t.time.substring(0, 5) : "",
            route: t.route,
            status: t.status,
            customer_id: t.customer_id,
            customer: t.customer
          })));
          setTotalTrnCount(response.length);
          setTrnTotalPages(1);
        }
      }
    } catch (err) {
      console.error("Failed to load paginated trains", err);
    }
  };

  // Dedicated useEffect to load paginated/filtered trains
  useEffect(() => {
    if (slug !== "trains-all") return;
    
    const timer = setTimeout(() => {
      fetchTrainsList();
    }, 200); // 200ms debounce to prevent spamming queries while typing

    return () => clearTimeout(timer);
  }, [slug, trnSearch, trnLegFilter, trnStatusFilter, trnStartDate, trnEndDate, trnPage, trnPerPage]);

  // Fetch paginated flights from Laravel API
  const fetchFlightsList = async () => {
    try {
      const response = await api.getFlights(fltSearch, fltLegFilter, fltPage, fltPerPage, fltStatusFilter, fltStartDate, fltEndDate);
      if (response) {
        if (response.data && Array.isArray(response.data)) {
          setFlights(response.data.map((f: any) => ({
            id: String(f.id),
            custom_id: f.custom_id || `#FLT-${f.id}`,
            flightNo: f.flight_no,
            leg: f.leg,
            date: f.date,
            time: f.time ? f.time.substring(0, 5) : "",
            route: f.route,
            status: f.status,
            customer_id: f.customer_id,
            customer: f.customer
          })));
          setTotalFltCount(response.total || response.data.length);
          setFltTotalPages(response.last_page || 1);
        } else if (Array.isArray(response)) {
          setFlights(response.map((f: any) => ({
            id: String(f.id),
            custom_id: f.custom_id || `#FLT-${f.id}`,
            flightNo: f.flight_no,
            leg: f.leg,
            date: f.date,
            time: f.time ? f.time.substring(0, 5) : "",
            route: f.route,
            status: f.status,
            customer_id: f.customer_id,
            customer: f.customer
          })));
          setTotalFltCount(response.length);
          setFltTotalPages(1);
        }
      }
    } catch (err) {
      console.error("Failed to load paginated flights", err);
    }
  };

  // Dedicated useEffect to load paginated/filtered flights
  useEffect(() => {
    if (slug !== "flights-all") return;
    
    const timer = setTimeout(() => {
      fetchFlightsList();
    }, 200); // 200ms debounce to prevent spamming queries while typing

    return () => clearTimeout(timer);
  }, [slug, fltSearch, fltLegFilter, fltStatusFilter, fltStartDate, fltEndDate, fltPage, fltPerPage]);

  // Reset search state on slug transitions for flights check
  useEffect(() => {
    if (slug === "flights-check") {
      setFltHasSearched(false);
      setFltSearch("");
      setFltLegFilter("All");
      setFltStatusFilter("All");
      setFltStartDate("");
      setFltEndDate("");
      setFlights([]);
    }
  }, [slug]);

  // Dedicated useEffect to load paginated/filtered flights for check
  useEffect(() => {
    if (slug !== "flights-check") return;
    if (!fltHasSearched) return;
    
    const timer = setTimeout(() => {
      fetchFlightsList();
    }, 200);

    return () => clearTimeout(timer);
  }, [slug, fltHasSearched, fltSearch, fltLegFilter, fltStatusFilter, fltStartDate, fltEndDate, fltPage, fltPerPage]);

  const currentSearch = typeof window !== "undefined" ? window.location.search : "";

  // Fetch single service by real database ID for services-view slug
  useEffect(() => {
    if (slug !== "services-view") return;

    const searchParams = new URLSearchParams(currentSearch);
    const targetId = searchParams.get("id") || "";

    if (!targetId) {
      setLoadingSingleService(false);
      return;
    }

    async function loadSingleService() {
      try {
        setLoadingSingleService(true);
        const res = await api.getService(targetId);
        if (res) {
          setSingleService(res);
        }
      } catch (err) {
        console.error("Failed to load single service details:", err);
      } finally {
        setLoadingSingleService(false);
      }
    }

    loadSingleService();
  }, [slug, currentSearch]);

  // Populate edit company states when slug is companies-edit
  useEffect(() => {
    if (slug === "companies-edit") {
      const searchParams = new URLSearchParams(currentSearch);
      const targetId = searchParams.get("id") || "";
      const selected = companies.find(c => c.id.replace("#COM-", "").replace("#CMP-", "") === targetId);
      if (selected) {
        setCompName(selected.name || "");
        setCompPhone(selected.phone || "");
        setCompEmail(selected.email || "");
        setCompWeb(selected.website || "");
        setCompAddress(selected.address || "");
        setCompInvoice(selected.invoice);
        setCompVouchers(selected.vouchers);
        setCompReminders(selected.reminders);
        setCompLedgerFrequency((selected as any).ledger_frequency || "Monday");
        setCompTomorrowReminder((selected as any).tomorrow_reminder || false);
        setCompExemptBulkLock((selected as any).exempt_bulk_lock || false);
        setCompRemarks((selected as any).remarks || "");
        setCompLogoName((selected as any).logo_path || "");
      }
    }
  }, [slug, currentSearch, companies]);

  // ----------------------------------------------------
  // Form Inputs State
  // ----------------------------------------------------
  const [custName, setCustName] = useState("");
  const [custCompany, setCustCompany] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custSecondaryPhone, setCustSecondaryPhone] = useState("");
  const [custAltPhone, setCustAltPhone] = useState("");
  const [custNotes, setCustNotes] = useState("");
  
  const [compName, setCompName] = useState("");
  const [compPhone, setCompPhone] = useState("");
  const [compEmail, setCompEmail] = useState("");
  const [compWeb, setCompWeb] = useState("");
  const [compAddress, setCompAddress] = useState("");
  const [compInvoice, setCompInvoice] = useState(true);
  const [compVouchers, setCompVouchers] = useState(true);
  const [compReminders, setCompReminders] = useState(true);
  const [compLedgerFrequency, setCompLedgerFrequency] = useState("Monday");
  const [compTomorrowReminder, setCompTomorrowReminder] = useState(false);
  const [compExemptBulkLock, setCompExemptBulkLock] = useState(false);
  const [compRemarks, setCompRemarks] = useState("");
  const [compLogoName, setCompLogoName] = useState("");

  // Flight Leg Type: "Arrival" | "Departure" | "Both Legs"
  const [fltLeg, setFltLeg] = useState<"Arrival" | "Departure" | "Both Legs">("Arrival");

  // Arrival Details
  const [fltArrFlightNo, setFltArrFlightNo] = useState("");
  const [fltArrPlace, setFltArrPlace] = useState("");
  const [fltArrDate, setFltArrDate] = useState("");
  const [fltArrTime, setFltArrTime] = useState("");

  // Departure Details
  const [fltDepFlightNo, setFltDepFlightNo] = useState("");
  const [fltDepPlace, setFltDepPlace] = useState("");
  const [fltDepDate, setFltDepDate] = useState("");
  const [fltDepTime, setFltDepTime] = useState("");

  // Train Leg Type: "Arrival" | "Departure" | "Both Legs"
  const [trnLeg, setTrnLeg] = useState<"Arrival" | "Departure" | "Both Legs">("Arrival");

  // Arrival Leg Details
  const [trnArrTrainNo, setTrnArrTrainNo] = useState("");
  const [trnArrStation, setTrnArrStation] = useState("");
  const [trnArrDate, setTrnArrDate] = useState("");
  const [trnArrTime, setTrnArrTime] = useState("");

  // Departure Leg Details
  const [trnDepTrainNo, setTrnDepTrainNo] = useState("");
  const [trnDepStation, setTrnDepStation] = useState("");
  const [trnDepDate, setTrnDepDate] = useState("");
  const [trnDepTime, setTrnDepTime] = useState("");

  const [pmtCompany, setPmtCompany] = useState("");
  const [pmtMethod, setPmtMethod] = useState("Bank Transfer");
  const [pmtAmount, setPmtAmount] = useState(0);
  const [pmtCurrency, setPmtCurrency] = useState("SAR");

  const [ntcTitle, setNtcTitle] = useState("");
  const [ntcTarget, setNtcTarget] = useState<"Admin" | "Agent">("Admin");
  const [ntcPriority, setNtcPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [ntcContent, setNtcContent] = useState("");

  // Bulk downloads state
  const [dlBookings, setDlBookings] = useState(true);
  const [dlCustomers, setDlCustomers] = useState(false);
  const [dlPayments, setDlPayments] = useState(false);
  const [exportProgress, setExportProgress] = useState(-1);

  // Fleet management state
  const [fleetList, setFleetList] = useState([
    { model: "Sedan (Core)", count: 25, active: 20 },
    { model: "Hyundai Staria (Core)", count: 15, active: 12 },
    { model: "GMC XL Yukon (Core)", count: 10, active: 8 },
    { model: "Coaster (Core)", count: 5, active: 4 },
  ]);

  // Global exports simulations
  const handleBulkExport = (e: React.FormEvent) => {
    e.preventDefault();
    setExportProgress(0);
    const interval = setInterval(() => {
      setExportProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          showToast("Export download completed successfully!", "success");
          return -1;
        }
        return p + 20;
      });
    }, 300);
  };

  // Generic Export Headers Action Click
  const triggerExportAlert = (format: string) => {
    showToast(`Data exported as ${format} to downloads directory!`, "success");
  };

  // ----------------------------------------------------
  // Route Form Submissions
  // ----------------------------------------------------
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
    await api.createCustomer(newCust);
    showToast("Customer registered successfully!", "success");
    setCustName(""); 
    setCustPhone(""); 
    setCustEmail("");
    setCustSecondaryPhone("");
    setCustAltPhone("");
    setCustNotes("");

    fetchCustomersList();
    router.push("/admin/mock/customers-all");
  };

  const handleAddFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flpTitle || !flpContact) {
      showToast("Please enter a subject and contact number.", "error");
      return;
    }
    const newFlp = {
      title: flpTitle,
      agent: flpAgent,
      contact: flpContact,
      date: flpDate,
      notes: flpNotes
    };
    const res = await api.createFollowup(newFlp);
    if (res.success) {
      showToast("Followup logged successfully in database!", "success");
      setFlpTitle("");
      setFlpContact("");
      setFlpNotes("");
      setShowFollowupModal(false);
      
      // Reload followups
      const flpList = await api.getFollowups();
      if (flpList) {
        setFollowups(flpList.map((f: any) => ({
          id: f.custom_id || `#FLP-${f.id}`,
          title: f.title,
          agent: f.agent,
          contact: f.contact,
          date: f.date,
          status: f.status,
          notes: f.notes
        })));
      }
    } else {
      showToast("Failed to save followup to database.", "error");
    }
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName) {
      showToast("Company Name is required.", "error");
      return;
    }
    const newComp = {
      name: compName,
      phone: compPhone || "N/A",
      email: compEmail || "N/A",
      website: compWeb || "N/A",
      address: compAddress || "N/A",
      invoice: compInvoice ? 1 : 0,
      vouchers: compVouchers ? 1 : 0,
      reminders: compReminders ? 1 : 0,
      ledger_frequency: compLedgerFrequency,
      tomorrow_reminder: compTomorrowReminder ? 1 : 0,
      exempt_bulk_lock: compExemptBulkLock ? 1 : 0,
      remarks: compRemarks || "",
      logo_path: compLogoName || ""
    };
    await api.createCompany(newComp);
    showToast("Company registered successfully!", "success");
    setCompName(""); setCompPhone(""); setCompEmail(""); setCompWeb(""); setCompAddress("");
    setCompInvoice(true); setCompVouchers(true); setCompReminders(true);
    setCompLedgerFrequency("Monday"); setCompTomorrowReminder(false); setCompExemptBulkLock(false);
    setCompRemarks(""); setCompLogoName("");

    const comList = await api.getCompanies();
    if (comList) {
      setCompanies(comList.map((com: any) => ({
        id: com.custom_id || `#COM-${com.id}`,
        name: com.name,
        phone: com.phone,
        email: com.email,
        website: com.website,
        address: com.address,
        invoice: com.invoice === 1 || com.invoice === true,
        vouchers: com.vouchers === 1 || com.vouchers === true,
        reminders: com.reminders === 1 || com.reminders === true
      })));
    }
    router.push("/admin/mock/companies");
  };

  const handleEditCompanyFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const searchParams = new URLSearchParams(currentSearch);
    const targetId = searchParams.get("id") || "";
    if (!targetId) return;
    
    const updated = {
      name: compName,
      phone: compPhone || "N/A",
      email: compEmail || "N/A",
      website: compWeb || "N/A",
      address: compAddress || "N/A",
      invoice: compInvoice ? 1 : 0,
      vouchers: compVouchers ? 1 : 0,
      reminders: compReminders ? 1 : 0,
      ledger_frequency: compLedgerFrequency,
      tomorrow_reminder: compTomorrowReminder ? 1 : 0,
      exempt_bulk_lock: compExemptBulkLock ? 1 : 0,
      remarks: compRemarks || "",
      logo_path: compLogoName || ""
    };
    
    await api.updateCompany(targetId, updated);
    showToast("Company profile updated successfully!", "success");
    
    // Refresh list
    const comList = await api.getCompanies();
    if (comList) {
      setCompanies(comList.map((com: any) => ({
        id: com.custom_id || `#COM-${com.id}`,
        name: com.name,
        phone: com.phone,
        email: com.email,
        website: com.website,
        address: com.address,
        invoice: com.invoice === 1 || com.invoice === true,
        vouchers: com.vouchers === 1 || com.vouchers === true,
        reminders: com.reminders === 1 || com.reminders === true,
        ledger_frequency: com.ledger_frequency || "Monday",
        tomorrow_reminder: com.tomorrow_reminder === 1 || com.tomorrow_reminder === true,
        exempt_bulk_lock: com.exempt_bulk_lock === 1 || com.exempt_bulk_lock === true,
        remarks: com.remarks || "",
        logo_path: com.logo_path || ""
      })));
    }
    router.push("/admin/mock/companies");
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    const numId = editingCustomer.rawId ? String(editingCustomer.rawId) : editingCustomer.id.replace("#CST-", "");
    const updated = {
      name: editingCustomer.name,
      company: editingCustomer.company,
      contact: editingCustomer.contact
    };
    await api.updateCustomer(numId, updated);
    showToast("Customer profile updated!", "success");
    setEditingCustomer(null);
    fetchCustomersList();
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;
    const numId = editingCompany.id.replace("#COM-", "");
    const updated = {
      name: editingCompany.name,
      phone: editingCompany.phone,
      email: editingCompany.email,
      website: editingCompany.website,
      address: editingCompany.address,
      invoice: editingCompany.invoice ? 1 : 0,
      vouchers: editingCompany.vouchers ? 1 : 0,
      reminders: editingCompany.reminders ? 1 : 0
    };
    await api.updateCompany(numId, updated);
    showToast("Company profile updated!", "success");
    setEditingCompany(null);
    const comList = await api.getCompanies();
    if (comList) {
      setCompanies(comList.map((com: any) => ({
        id: com.custom_id || `#COM-${com.id}`,
        name: com.name,
        phone: com.phone,
        email: com.email,
        website: com.website,
        address: com.address,
        invoice: com.invoice === 1 || com.invoice === true,
        vouchers: com.vouchers === 1 || com.vouchers === true,
        reminders: com.reminders === 1 || com.reminders === true
      })));
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!srvSelectedCustomerObj) {
      showToast("Please select a customer.", "error");
      return;
    }
    if (!srvName) {
      showToast("Service Description is required.", "error");
      return;
    }
    const newSrv = {
      customer_id: srvSelectedCustomerObj.id,
      name: srvName,
      type: srvType || "Service",
      base_price: parseFloat(srvPrice) || 0,
      pickup: srvPickupLocation || null,
      status: srvStatus || "Pending",
      driver_cash: parseFloat(srvDriverCash) || 0,
      date: srvDate || null,
      time: srvTime || null,
      description: srvRemarks || null
    };

    await api.createService(newSrv);
    showToast("Additional Service registered successfully!", "success");
    
    // Reset all form fields
    setSrvName(""); 
    setSrvType("Visa");
    setSrvDesc(""); 
    setSrvPrice("");
    setSrvPickupLocation("");
    setSrvStatus("Pending");
    setSrvDriverCash("");
    setSrvDate("");
    setSrvTime("");
    setSrvRemarks("");
    setSrvSelectedCustomerObj(null);
    setSrvCustomerSearch("");
    setSrvCatalogSearch("");
    setSrvSelectedCatalogObj(null);

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
        customerName: s.customer ? s.customer.name : "Guest",
        companyName: s.customer ? s.customer.company : "Walk-in"
      })));
    }
    router.push("/admin/mock/services-all");
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    const numId = editingService.rawId || editingService.id.replace("#SRV-", "");
    const updated = {
      name: editingService.name,
      type: editingService.type,
      description: editingService.description,
      base_price: parseFloat(editingService.basePrice) || 0,
      status: editingService.status,
      pickup: editingService.pickup,
      driver_cash: parseFloat(editingService.driverCash) || 0,
      date: editingService.date,
      time: editingService.time
    };
    await api.updateService(numId, updated);
    showToast("Service details updated!", "success");
    setEditingService(null);
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
        time: s.time
      })));
    }
  };

  const handleSaveCreateCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogItemName.trim()) {
      showToast("Service item name is required.", "error");
      return;
    }
    const entryBy = "umrahcab";
    const entryDate = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const res = await api.createService({
      name: catalogItemName.trim(),
      type: "Catalogue",
      description: `Entry By: ${entryBy} | Entry Date: ${entryDate} | Edited By: N/A | Edited Date: N/A`,
      base_price: 0.00
    });
    if (res?.success) {
      const srvList = await api.getServices();
      if (srvList) {
        const catalogueItems = srvList.filter((s: any) => s.type === "Catalogue");
        setServiceCatalogue(catalogueItems.map((s: any) => {
          const desc = s.description || "";
          const entryByMatch = desc.match(/Entry By:\s*([^|]+)/i);
          const entryDateMatch = desc.match(/Entry Date:\s*([^|]+)/i);
          const editedByMatch = desc.match(/Edited By:\s*([^|]+)/i);
          const editedDateMatch = desc.match(/Edited Date:\s*([^|]+)/i);

          return {
            id: s.id,
            custom_id: s.custom_id,
            name: s.name,
            entryBy: entryByMatch ? entryByMatch[1].trim() : "umrahcab",
            entryDate: entryDateMatch ? entryDateMatch[1].trim() : new Date(s.created_at || Date.now()).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
            editedBy: editedByMatch ? editedByMatch[1].trim() : "N/A",
            editedDate: editedDateMatch ? editedDateMatch[1].trim() : "N/A"
          };
        }));
      }
      showToast(`Registered catalog item: ${catalogItemName}`, "success");
      setCatalogItemName("");
      setCreatingCatalogItem(false);
    } else {
      showToast("Failed to create catalog item.", "error");
    }
  };

  const handleSaveUpdateCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCatalogItem || !catalogItemName.trim()) return;

    const editedBy = "umrahcab";
    const editedDate = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    
    const res = await api.updateService(editingCatalogItem.id.toString(), {
      name: catalogItemName.trim(),
      description: `Entry By: ${editingCatalogItem.entryBy} | Entry Date: ${editingCatalogItem.entryDate} | Edited By: ${editedBy} | Edited Date: ${editedDate}`
    });

    if (res?.success) {
      const srvList = await api.getServices();
      if (srvList) {
        const catalogueItems = srvList.filter((s: any) => s.type === "Catalogue");
        setServiceCatalogue(catalogueItems.map((s: any) => {
          const desc = s.description || "";
          const entryByMatch = desc.match(/Entry By:\s*([^|]+)/i);
          const entryDateMatch = desc.match(/Entry Date:\s*([^|]+)/i);
          const editedByMatch = desc.match(/Edited By:\s*([^|]+)/i);
          const editedDateMatch = desc.match(/Edited Date:\s*([^|]+)/i);

          return {
            id: s.id,
            custom_id: s.custom_id,
            name: s.name,
            entryBy: entryByMatch ? entryByMatch[1].trim() : "umrahcab",
            entryDate: entryDateMatch ? entryDateMatch[1].trim() : new Date(s.created_at || Date.now()).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
            editedBy: editedByMatch ? editedByMatch[1].trim() : "N/A",
            editedDate: editedDateMatch ? editedDateMatch[1].trim() : "N/A"
          };
        }));
      }
      showToast("Updated catalogue item name!", "success");
      setEditingCatalogItem(null);
      setCatalogItemName("");
    } else {
      showToast("Failed to update catalog item.", "error");
    }
  };

  const handleAddFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fltSelectedCustomerObj) {
      showToast("Please select a customer first.", "error");
      return;
    }

    if (fltLeg === "Arrival") {
      if (!fltArrFlightNo || !fltArrDate || !fltArrTime || !fltArrPlace) {
        showToast("Please fill in all Arrival details.", "error");
        return;
      }
      const res = await api.createFlight({
        customer_id: fltSelectedCustomerObj.id,
        flight_no: fltArrFlightNo,
        leg: "Arrival",
        date: fltArrDate,
        time: fltArrTime,
        route: fltArrPlace,
        status: "On Time"
      });
      if (!res?.success) {
        showToast(res?.error || "Failed to save flight details.", "error");
        return;
      }
    } else if (fltLeg === "Departure") {
      if (!fltDepFlightNo || !fltDepDate || !fltDepTime || !fltDepPlace) {
        showToast("Please fill in all Departure details.", "error");
        return;
      }
      const res = await api.createFlight({
        customer_id: fltSelectedCustomerObj.id,
        flight_no: fltDepFlightNo,
        leg: "Departure",
        date: fltDepDate,
        time: fltDepTime,
        route: fltDepPlace,
        status: "On Time"
      });
      if (!res?.success) {
        showToast(res?.error || "Failed to save flight details.", "error");
        return;
      }
    } else if (fltLeg === "Both Legs") {
      if (
        !fltArrFlightNo || !fltArrDate || !fltArrTime || !fltArrPlace ||
        !fltDepFlightNo || !fltDepDate || !fltDepTime || !fltDepPlace
      ) {
        showToast("Please fill in both Arrival and Departure details.", "error");
        return;
      }
      const res1 = await api.createFlight({
        customer_id: fltSelectedCustomerObj.id,
        flight_no: fltArrFlightNo,
        leg: "Arrival",
        date: fltArrDate,
        time: fltArrTime,
        route: fltArrPlace,
        status: "On Time"
      });
      const res2 = await api.createFlight({
        customer_id: fltSelectedCustomerObj.id,
        flight_no: fltDepFlightNo,
        leg: "Departure",
        date: fltDepDate,
        time: fltDepTime,
        route: fltDepPlace,
        status: "On Time"
      });
      if (!res1?.success || !res2?.success) {
        showToast("Failed to save some flight details.", "error");
        return;
      }
    }

    showToast("Flight tracking details saved!", "success");
    
    // Clear inputs
    setFltArrFlightNo("");
    setFltArrPlace("");
    setFltArrDate("");
    setFltArrTime("");
    setFltDepFlightNo("");
    setFltDepPlace("");
    setFltDepDate("");
    setFltDepTime("");
    const targetCustId = fltSelectedCustomerObj.id;
    setFltSelectedCustomerObj(null);

    // Refresh flights list
    const fltList = await api.getFlights();
    if (fltList) {
      setFlights(fltList.map((f: any) => ({
        id: String(f.id),
        custom_id: f.custom_id || `#FLT-${f.id}`,
        flightNo: f.flight_no,
        leg: f.leg,
        date: f.date,
        time: f.time ? f.time.substring(0, 5) : "",
        route: f.route,
        status: f.status,
        customer_id: f.customer_id,
        customer: f.customer
      })));
    }
    router.push(`/admin/mock/customers-view?id=${targetCustId}`);
  };

  const handleAddTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trnSelectedCustomerObj) {
      showToast("Please select a customer first.", "error");
      return;
    }

    if (trnLeg === "Arrival") {
      if (!trnArrTrainNo || !trnArrDate || !trnArrTime || !trnArrStation) {
        showToast("Please fill in all Arrival details.", "error");
        return;
      }
      const res = await api.createTrain({
        customer_id: trnSelectedCustomerObj.id,
        train_no: trnArrTrainNo,
        leg: "Arrival",
        date: trnArrDate,
        time: trnArrTime,
        route: trnArrStation,
        status: "Scheduled"
      });
      if (!res?.success) {
        showToast(res?.error || "Failed to save train details.", "error");
        return;
      }
    } else if (trnLeg === "Departure") {
      if (!trnDepTrainNo || !trnDepDate || !trnDepTime || !trnDepStation) {
        showToast("Please fill in all Departure details.", "error");
        return;
      }
      const res = await api.createTrain({
        customer_id: trnSelectedCustomerObj.id,
        train_no: trnDepTrainNo,
        leg: "Departure",
        date: trnDepDate,
        time: trnDepTime,
        route: trnDepStation,
        status: "Scheduled"
      });
      if (!res?.success) {
        showToast(res?.error || "Failed to save train details.", "error");
        return;
      }
    } else if (trnLeg === "Both Legs") {
      if (
        !trnArrTrainNo || !trnArrDate || !trnArrTime || !trnArrStation ||
        !trnDepTrainNo || !trnDepDate || !trnDepTime || !trnDepStation
      ) {
        showToast("Please fill in both Arrival and Departure details.", "error");
        return;
      }
      const res1 = await api.createTrain({
        customer_id: trnSelectedCustomerObj.id,
        train_no: trnArrTrainNo,
        leg: "Arrival",
        date: trnArrDate,
        time: trnArrTime,
        route: trnArrStation,
        status: "Scheduled"
      });
      const res2 = await api.createTrain({
        customer_id: trnSelectedCustomerObj.id,
        train_no: trnDepTrainNo,
        leg: "Departure",
        date: trnDepDate,
        time: trnDepTime,
        route: trnDepStation,
        status: "Scheduled"
      });
      if (!res1?.success || !res2?.success) {
        showToast("Failed to save some train details.", "error");
        return;
      }
    }

    showToast("Train journey details saved!", "success");

    // Clear inputs
    setTrnArrTrainNo(""); setTrnArrStation(""); setTrnArrDate(""); setTrnArrTime("");
    setTrnDepTrainNo(""); setTrnDepStation(""); setTrnDepDate(""); setTrnDepTime("");
    const targetCustId = trnSelectedCustomerObj.id;
    setTrnSelectedCustomerObj(null);

    // Refresh trains list
    const trnList = await api.getTrains();
    if (trnList) {
      setTrains(trnList.map((t: any) => ({
        id: t.custom_id || `#TRN-${t.id}`,
        trainNo: t.train_no,
        leg: t.leg,
        date: t.date,
        time: t.time ? t.time.substring(0, 5) : "",
        route: t.route,
        status: t.status
      })));
    }
    router.push(`/admin/mock/customers-view?id=${targetCustId}`);
  };

  const handleDeleteTrain = async (id: number, customId: string) => {
    if (window.confirm(`Are you sure you want to delete train record ${customId}?`)) {
      try {
        const res = await api.deleteTrain(id);
        if (res.success) {
          showToast(`Train record ${customId} deleted successfully`, "success");
          fetchTrainsList();
        } else {
          showToast("Failed to delete train record", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("Error deleting train record", "error");
      }
    }
  };

  const handleUpdateTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trnSelectedCustomerObj) {
      showToast("Please select a customer first.", "error");
      return;
    }

    let payload: any = {
      customer_id: trnSelectedCustomerObj.id,
      status: editTrnStatus
    };

    if (trnLeg === "Arrival") {
      if (!trnArrTrainNo || !trnArrDate || !trnArrTime || !trnArrStation) {
        showToast("Please fill in all Arrival details.", "error");
        return;
      }
      payload = {
        ...payload,
        train_no: trnArrTrainNo,
        leg: "Arrival",
        date: trnArrDate,
        time: trnArrTime,
        route: trnArrStation
      };
    } else {
      if (!trnDepTrainNo || !trnDepDate || !trnDepTime || !trnDepStation) {
        showToast("Please fill in all Departure details.", "error");
        return;
      }
      payload = {
        ...payload,
        train_no: trnDepTrainNo,
        leg: "Departure",
        date: trnDepDate,
        time: trnDepTime,
        route: trnDepStation
      };
    }

    try {
      const res = await api.updateTrain(Number(queryId), payload);

      if (res && res.success) {
        showToast("Train record updated successfully", "success");
        router.push(`/admin/mock/trains-view?id=${queryId}`);
      } else {
        showToast(res?.error || "Failed to update train record", "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Error updating train record", "error");
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pmtCompany || pmtAmount <= 0) {
      showToast("Invalid payment details.", "error");
      return;
    }
    const newPmt = {
      company: pmtCompany,
      date: new Date().toISOString().split("T")[0],
      method: pmtMethod,
      amount: pmtAmount,
      currency: pmtCurrency,
      status: "Pending"
    };
    await api.createPayment(newPmt);
    showToast("General payment registered! Awaiting audit verification.", "success");
    setPmtAmount(0);

    const payList = await api.getPayments();
    if (payList) {
      setPayments(payList.map((p: any) => ({
        id: p.custom_id || `PAY-${p.id}`,
        company: p.company,
        date: p.date,
        method: p.method,
        amount: parseFloat(p.amount),
        currency: p.currency,
        status: p.status
      })));
    }
    router.push("/admin/mock/payments");
  };

  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ntcTitle || !ntcContent) {
      showToast("Please fill notice fields.", "error");
      return;
    }
    const newNotice = {
      title: ntcTitle,
      date: new Date().toISOString().split("T")[0],
      priority: ntcPriority,
      target: ntcTarget,
      content: ntcContent
    };
    await api.createNotice(newNotice);
    showToast("System announcement published!", "success");
    setNtcTitle(""); setNtcContent("");

    const notList = await api.getNotices();
    if (notList) {
      setNotices(notList.map((n: any) => ({
        id: n.custom_id || `NTC-${n.id}`,
        title: n.title,
        date: n.date,
        priority: n.priority,
        target: n.target,
        content: n.content
      })));
    }
    router.push(ntcTarget === "Admin" ? "/admin/mock/admin-notices" : "/admin/mock/agent-notices");
  };

  const renderDynamicContent = () => {
    // 0.1 ADDITIONAL SERVICE CATALOGUE ITEMS DIRECTORY (Replicating additional_services_items_list.php)
    if (slug === "services-items") {
      const filteredCatalogue = serviceCatalogue.filter(
        (item) => item.name.toLowerCase().includes(catalogItemsSearch.toLowerCase()) ||
                  item.entryBy.toLowerCase().includes(catalogItemsSearch.toLowerCase())
      );

      const totalItems = filteredCatalogue.length;
      const totalPages = Math.ceil(totalItems / catalogItemsPerPage);
      const indexOfLastItem = catalogItemsPage * catalogItemsPerPage;
      const indexOfFirstItem = indexOfLastItem - catalogItemsPerPage;
      const currentItems = filteredCatalogue.slice(indexOfFirstItem, indexOfLastItem);



      const handleDeleteItem = async (itemId: number, itemName: string) => {
        const conf = confirm(`Are you sure you want to remove this catalog item?`);
        if (!conf) return;
        const res = await api.deleteService(itemId.toString());
        if (res?.success) {
          const srvList = await api.getServices();
          if (srvList) {
            const catalogueItems = srvList.filter((s: any) => s.type === "Catalogue");
            setServiceCatalogue(catalogueItems.map((s: any) => {
              const desc = s.description || "";
              const entryByMatch = desc.match(/Entry By:\s*([^|]+)/i);
              const entryDateMatch = desc.match(/Entry Date:\s*([^|]+)/i);
              const editedByMatch = desc.match(/Edited By:\s*([^|]+)/i);
              const editedDateMatch = desc.match(/Edited Date:\s*([^|]+)/i);

              return {
                id: s.id,
                custom_id: s.custom_id,
                name: s.name,
                entryBy: entryByMatch ? entryByMatch[1].trim() : "umrahcab",
                entryDate: entryDateMatch ? entryDateMatch[1].trim() : new Date(s.created_at || Date.now()).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
                editedBy: editedByMatch ? editedByMatch[1].trim() : "N/A",
                editedDate: editedDateMatch ? editedDateMatch[1].trim() : "N/A"
              };
            }));
          }
          showToast(`Removed catalog item: ${itemName}`, "error");
        } else {
          showToast("Failed to delete catalog item.", "error");
        }
      };

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Header Card (Purple Gradient) */}
          <div 
            className="form-header-card" 
            style={{ 
              background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)", 
              borderRadius: "16px", 
              padding: "24px 30px",
              boxShadow: "0 10px 20px rgba(124, 58, 237, 0.15)"
            }}
          >
            <div>
              <h2 style={{ color: "#ffffff", fontSize: "24px", fontWeight: "700", margin: 0 }}>
                Additional Service Items
              </h2>
              <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "14px", marginTop: "4px", marginBottom: 0 }}>
                Manage the list of service items available for additional services.
              </p>
            </div>
            <button
              onClick={() => {
                setCatalogItemName("");
                setCreatingCatalogItem(true);
              }}
              style={{
                background: "#ffffff",
                color: "#5b21b6",
                border: "none",
                borderRadius: "8px",
                padding: "10px 18px",
                fontWeight: "700",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                transition: "all 0.2s"
              }}
            >
              <i className="fas fa-plus"></i>
              <span>New Service Item</span>
            </button>
          </div>

          {/* Table Toolbar Search */}
          <div 
            style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              background: "#ffffff", 
              border: "1px solid #e2e8f0", 
              borderRadius: "12px", 
              padding: "15px 20px" 
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", color: "#64748b" }}>Show</span>
              <select 
                className="form-input" 
                style={{ width: "80px", padding: "6px", height: "auto" }} 
                value={catalogItemsPerPage}
                onChange={(e) => {
                  setCatalogItemsPerPage(parseInt(e.target.value));
                  setCatalogItemsPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span style={{ fontSize: "14px", color: "#64748b" }}>entries</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", color: "#475569", fontWeight: "600" }}>Search:</span>
              <input
                type="text"
                placeholder="Search catalogue..."
                value={catalogItemsSearch}
                onChange={(e) => {
                  setCatalogItemsSearch(e.target.value);
                  setCatalogItemsPage(1);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  outline: "none",
                  fontSize: "14px",
                  width: "200px"
                }}
              />
            </div>
          </div>

          {/* Grid/Table Card */}
          <div className="table-card" style={{ padding: "20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
            <div className="table-responsive">
              <table className="db-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Service Item</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Entry By</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Entry Date</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Edited By</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Edited Date</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, color: "#1e293b" }}>{item.name}</td>
                      <td style={{ color: "#64748b", fontWeight: "500" }}>{item.entryBy}</td>
                      <td>{item.entryDate}</td>
                      <td style={{ color: "#94a3b8" }}>{item.editedBy}</td>
                      <td style={{ color: "#94a3b8" }}>{item.editedDate}</td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => {
                              setEditingCatalogItem(item);
                              setCatalogItemName(item.name);
                            }}
                            title="Edit Catalogue Item"
                            style={{
                              background: "#e0f2fe",
                              border: "none",
                              borderRadius: "6px",
                              width: "30px",
                              height: "30px",
                              cursor: "pointer",
                              color: "#0369a1",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <i className="fas fa-pencil" style={{ fontSize: "12px" }}></i>
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            title="Remove Catalogue Item"
                            style={{
                              background: "#fee2e2",
                              border: "none",
                              borderRadius: "6px",
                              width: "30px",
                              height: "30px",
                              cursor: "pointer",
                              color: "#ef4444",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <i className="fas fa-trash" style={{ fontSize: "12px" }}></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentItems.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                        No records match search criterion.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", borderTop: "1px solid #f1f5f9", paddingTop: "15px" }}>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Showing {totalItems > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} entries
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  onClick={() => setCatalogItemsPage(prev => Math.max(1, prev - 1))}
                  className="form-btn-back" 
                  style={{ 
                    background: catalogItemsPage === 1 ? "#f1f5f9" : "#e0e7ff", 
                    color: catalogItemsPage === 1 ? "#94a3b8" : "#4338ca", 
                    border: "none",
                    cursor: catalogItemsPage === 1 ? "not-allowed" : "pointer"
                  }} 
                  disabled={catalogItemsPage === 1}
                >
                  Previous
                </button>
                <span style={{ display: "flex", alignItems: "center", padding: "0 10px", fontSize: "14px", fontWeight: "600", color: "#475569" }}>
                  Page {catalogItemsPage} of {Math.max(1, totalPages)}
                </span>
                <button 
                  onClick={() => setCatalogItemsPage(prev => Math.min(totalPages, prev + 1))}
                  className="form-btn-back" 
                  style={{ 
                    background: catalogItemsPage >= totalPages ? "#f1f5f9" : "#e0e7ff", 
                    color: catalogItemsPage >= totalPages ? "#94a3b8" : "#4338ca", 
                    border: "none",
                    cursor: catalogItemsPage >= totalPages ? "not-allowed" : "pointer"
                  }} 
                  disabled={catalogItemsPage >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 0.2 DETAILED CUSTOMER PROFILE VIEW (Replicating customers_view.php?id=1&tab=overview)
    if (slug === "customers-view") {
      const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const targetId = searchParams?.get("id") || "#CST-1";

      // Look up customer: first try the single customer fetched via getCustomer API call, then fallback to customers list
      const dbCustomer = (selectedCustomerProfile && (selectedCustomerProfile.id === targetId || String(selectedCustomerProfile.rawId) === targetId || selectedCustomerProfile.name === targetId))
        ? selectedCustomerProfile
        : (customers.find(c => c.id === targetId) || customers.find(c => c.name === targetId) || customers.find(c => c.id.replace("#", "") === targetId.replace("#", "")));

      // Parse the composite contact field: "Primary / Secondary / Alternative (P), email@address.com (Email) | Notes: custom notes"
      let parsedPhones: string[] = ["N/A"];
      let parsedEmail = "No email provided";
      let parsedNotes = "No external notes.";

      if (dbCustomer && dbCustomer.contact) {
        const contactStr = dbCustomer.contact;
        
        // 1. Extract notes if present
        if (contactStr.includes(" | Notes: ")) {
          const parts = contactStr.split(" | Notes: ");
          parsedNotes = parts[1] || "No external notes.";
        }

        // 2. Split phones and email parts
        const mainPart = contactStr.split(" | Notes: ")[0];
        const contactParts = mainPart.split(" (P), ");
        
        // Extract Phones
        if (contactParts[0]) {
          parsedPhones = contactParts[0].split(" / ");
        }

        // Extract Email
        if (contactParts[1]) {
          parsedEmail = contactParts[1].replace(" (Email)", "").trim();
        } else if (contactStr.includes(" (Email)")) {
          const match = contactStr.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
          if (match) parsedEmail = match[0];
        }
      }

      const currentProfile = {
        id: dbCustomer ? dbCustomer.id : targetId,
        name: dbCustomer ? dbCustomer.name : "Loading profile...",
        email: dbCustomer ? parsedEmail : "No email provided",
        phones: dbCustomer ? parsedPhones : ["123456789"],
        company: dbCustomer ? dbCustomer.company : "Zahid Travels - 1",
        meta: {
          registeredBy: dbCustomer ? dbCustomer.registeredBy : "umrahcab",
          registeredDate: "22 May, 2026 | 08:32 PM",
          lastEditedBy: dbCustomer ? dbCustomer.registeredBy : "umrahcab",
          lastEditedDate: dbCustomer ? dbCustomer.lastUpdate : "25 May, 2026 | 09:58 AM"
        },
        externalRemarks: dbCustomer ? parsedNotes : "No external notes.",
        internalRemarks: "No internal notes."
      };

      // Real database-driven statistics counts
      const custBookings = bookings;
      const custServices = services;
      const custFlights = flights;
      const custTrains = trains;

      const stats = {
        bookings: custBookings.length,
        flights: custFlights.length,
        trains: custTrains.length,
        services: custServices.length
      };

      const handleActionClick = (actionName: string) => {
        showToast(`Triggered simulated customer action: ${actionName}`, "success");
      };

      return (
        <CustomerProfileView
          currentProfile={currentProfile}
          stats={stats}
          activeProfileTab={activeProfileTab}
          setActiveProfileTab={setActiveProfileTab}
          custBookings={custBookings}
          custServices={custServices}
          custFlights={custFlights}
          custTrains={custTrains}
          customers={customers}
          setEditingCustomer={setEditingCustomer}
          router={router}
          showToast={showToast}
          triggerExportAlert={triggerExportAlert}
        />
      );
    }

    // 1. CUSTOMERS VIEW ALL
    if (slug === "customers-all") {
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

    // 2. ADD CUSTOMER FORM
    if (slug === "customers-add") {
      return (
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
      );
    }

    // 3. COMPANIES DIRECTORY
    if (slug === "companies") {
      // Filter companies based on comSearch
      const filteredCompanies = companies.filter(c => {
        const query = comSearch.toLowerCase().trim();
        if (!query) return true;
        return (
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.phone.toLowerCase().includes(query) ||
          c.id.toLowerCase().includes(query)
        );
      });

      // Pagination calculation
      const totalItems = filteredCompanies.length;
      const totalPages = Math.ceil(totalItems / comPerPage) || 1;
      const startIndex = (comPage - 1) * comPerPage;
      const endIndex = Math.min(startIndex + comPerPage, totalItems);
      const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #c2410c 0%, #ea580c 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Company Management</h2>
              <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Manage and track all companies under your organization.</p>
            </div>
            <button 
              onClick={() => router.push("/admin/mock/companies-add")} 
              style={{
                background: "#1d4ed8",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "10px 18px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <i className="fas fa-plus"></i>
              <span>Register New Company</span>
            </button>
          </div>

          <div className="table-card" style={{ padding: "25px", background: "#ffffff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            
            {/* Toolbar Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                {["Copy", "CSV", "Excel", "PDF", "Print"].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => showToast(`${fmt} Export Triggered!`, "success")}
                    style={{
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 16px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>Search:</span>
                <input
                  type="text"
                  placeholder="Quick search..."
                  value={comSearch}
                  onChange={(e) => setComSearch(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "14px",
                    width: "220px",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <div className="table-responsive">
              <table className="db-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>ID</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Company Name</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Contact Email</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Registered By</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Last Update</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "#64748b", padding: "30px 10px" }}>No matching companies found.</td>
                    </tr>
                  ) : (
                    paginatedCompanies.map((c) => {
                      const rawId = c.id.replace("#COM-", "").replace("#CMP-", "");
                      const displayId = `#CMP-${rawId}`;
                      return (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 700, color: "#1e293b" }}>{displayId}</td>
                          <td>
                            <button
                              onClick={() => router.push(`/admin/mock/companies-view?id=${rawId}`)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#2563eb",
                                fontWeight: "600",
                                textDecoration: "underline",
                                cursor: "pointer",
                                padding: 0,
                                textAlign: "left"
                              }}
                            >
                              {c.name}
                            </button>
                          </td>
                          <td style={{ color: "#64748b", fontWeight: "500" }}>{c.email && c.email !== "N/A" ? c.email : ""}</td>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontWeight: "600", color: "#475569", fontSize: "13px" }}>umrahcab</span>
                              <span style={{ color: "#94a3b8", fontSize: "11px" }}>23-May-2026</span>
                            </div>
                          </td>
                          <td>
                            <span style={{ color: "#94a3b8", fontSize: "13px", fontStyle: "italic" }}>No edits</span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button 
                                onClick={() => router.push(`/admin/mock/companies-view?id=${rawId}`)} 
                                title="View Company Details" 
                                style={{ 
                                  background: "#f0fdf4", 
                                  border: "none", 
                                  borderRadius: "6px", 
                                  width: "30px", 
                                  height: "30px", 
                                  cursor: "pointer", 
                                  color: "#16a34a", 
                                  display: "flex", 
                                  alignItems: "center", 
                                  justifyContent: "center" 
                                }}
                              >
                                <i className="fas fa-eye" style={{ fontSize: "12px" }}></i>
                              </button>
                              <button 
                                onClick={() => router.push(`/admin/mock/companies-edit?id=${rawId}`)} 
                                title="Edit" 
                                style={{ 
                                  background: "#eff6ff", 
                                  border: "none", 
                                  borderRadius: "6px", 
                                  width: "30px", 
                                  height: "30px", 
                                  cursor: "pointer", 
                                  color: "#2563eb", 
                                  display: "flex", 
                                  alignItems: "center", 
                                  justifyContent: "center" 
                                }}
                              >
                                <i className="fas fa-pencil" style={{ fontSize: "12px" }}></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalItems > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", borderTop: "1px solid #f1f5f9", paddingTop: "15px" }}>
                <span style={{ fontSize: "14px", color: "#64748b" }}>
                  Showing {startIndex + 1} to {endIndex} of {totalItems} entries
                </span>
                
                <div style={{ display: "flex", gap: "5px" }}>
                  <button
                    disabled={comPage === 1}
                    onClick={() => setComPage(p => Math.max(1, p - 1))}
                    style={{
                      background: comPage === 1 ? "#f1f5f9" : "#ffffff",
                      color: comPage === 1 ? "#cbd5e1" : "#475569",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      cursor: comPage === 1 ? "not-allowed" : "pointer",
                      fontSize: "13px",
                      fontWeight: "600"
                    }}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => (
                    <button
                      key={pg}
                      onClick={() => setComPage(pg)}
                      style={{
                        background: comPage === pg ? "#2563eb" : "#ffffff",
                        color: comPage === pg ? "#ffffff" : "#475569",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "600"
                      }}
                    >
                      {pg}
                    </button>
                  ))}
                  <button
                    disabled={comPage === totalPages}
                    onClick={() => setComPage(p => Math.min(totalPages, p + 1))}
                    style={{
                      background: comPage === totalPages ? "#f1f5f9" : "#ffffff",
                      color: comPage === totalPages ? "#cbd5e1" : "#475569",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      cursor: comPage === totalPages ? "not-allowed" : "pointer",
                      fontSize: "13px",
                      fontWeight: "600"
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      );
    }

    // COMPANIES VIEW (SINGLE PROFILE DETAILS SCREEN)
    if (slug === "companies-view") {
      const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const targetId = searchParams?.get("id") || "";
      const c = companies.find(com => com.id.replace("#COM-", "").replace("#CMP-", "") === targetId) || companies[0];

      if (!c) {
        return (
          <div style={{ padding: "20px", textAlign: "center" }}>
            <h3>No company found matching ID {targetId}.</h3>
            <button onClick={() => router.push("/admin/mock/companies")} className="btn-submit" style={{ marginTop: "15px", background: "var(--primary-color)" }}>Back to Directory</button>
          </div>
        );
      }

      const rawId = c.id.replace("#COM-", "").replace("#CMP-", "");
      const displayId = `#CMP-${rawId}`;

      // Filter customers that belong to this company
      const companyCustomers = customers.filter(cust => cust.company && cust.company.toLowerCase() === c.name.toLowerCase());

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          
          {/* Amber Header Card */}
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #c2410c 0%, #ea580c 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "5px" }}>
                <span style={{ background: "rgba(255,255,255,0.2)", color: "#ffffff", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Agent Profile</span>
                <span style={{ color: "#ffedd5", fontSize: "12px", fontWeight: "700" }}>ID: #{rawId}</span>
              </div>
              <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>{c.name}</h2>
              <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Company Profile Overview</p>
            </div>
            
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                onClick={() => router.push("/admin/mock/companies-add")} 
                style={{
                  background: "#4f46e5",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 18px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <i className="fas fa-plus"></i>
                <span>Register New</span>
              </button>
              <button 
                onClick={() => router.push(`/admin/mock/companies-edit?id=${rawId}`)} 
                style={{
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 18px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <i className="fas fa-edit"></i>
                <span>Edit Profile</span>
              </button>
              <button 
                onClick={() => router.push("/admin/mock/companies")} 
                style={{
                  background: "#334155",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 18px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <i className="fas fa-arrow-left"></i>
                <span>Back to List</span>
              </button>
            </div>
          </div>

          {/* Two-Column Details Grid */}
          <div style={{ display: "flex", gap: "25px", flexWrap: "wrap" }}>
            
            {/* Left Card: Profile Summary */}
            <div style={{ width: "320px", background: "#ffffff", padding: "30px 20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{ width: "100px", height: "100px", background: "#f1f5f9", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                <i className="fas fa-building" style={{ fontSize: "40px", color: "#64748b" }}></i>
              </div>
              
              <h3 style={{ margin: "0 0 5px 0", fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>{c.name}</h3>
              <p style={{ margin: "0 0 15px 0", fontSize: "13px", color: "#94a3b8" }}>Entity Since May 2026</p>
              
              <span style={{ background: "#eff6ff", color: "#2563eb", padding: "4px 14px", borderRadius: "9999px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "30px" }}>
                BASIC TIER
              </span>

              <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", gap: "20px", borderTop: "1px solid #f1f5f9", paddingTop: "25px" }}>
                <div>
                  <span style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", marginBottom: "5px" }}>Official Email</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#475569" }}>
                    <i className="fas fa-envelope" style={{ color: "#2563eb", width: "16px" }}></i>
                    <span style={{ fontSize: "14px" }}>{c.email && c.email !== "N/A" ? c.email : "—"}</span>
                  </div>
                </div>

                <div>
                  <span style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", marginBottom: "5px" }}>Contact Number</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#475569" }}>
                    <i className="fas fa-phone" style={{ color: "#2563eb", width: "16px" }}></i>
                    <span style={{ fontSize: "14px" }}>{c.phone && c.phone !== "N/A" ? c.phone : "—"}</span>
                  </div>
                </div>

                <div>
                  <span style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", marginBottom: "5px" }}>Physical Address</span>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", color: "#475569" }}>
                    <i className="fas fa-location-dot" style={{ color: "#2563eb", width: "16px", marginTop: "3px" }}></i>
                    <span style={{ fontSize: "14px" }}>{c.address && c.address !== "N/A" ? c.address : "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Balance, Metrics & Automations */}
            <div style={{ flex: 1, minWidth: "500px", display: "flex", flexDirection: "column", gap: "25px" }}>
              
              {/* Wallet PW Card */}
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "20px 25px", borderRadius: "12px", display: "flex", gap: "20px", alignItems: "center" }}>
                <div style={{ width: "40px", height: "40px", background: "#dcfce7", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#166534" }}>
                  <i className="fas fa-wallet" style={{ fontSize: "18px" }}></i>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "12px", color: "#166534", fontWeight: "600" }}>Wallet Balance (PW)</span>
                  <h4 style={{ margin: "2px 0 0 0", fontSize: "22px", fontWeight: "800", color: "#14532d" }}>SAR 0.00</h4>
                  <span style={{ display: "block", fontSize: "11px", color: "#15803d", marginTop: "3px" }}>
                    VW Balance: <strong>SAR 0.00</strong> (Wallet) | PW: Pick-up Wise | VW: Voucher Wise
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", borderLeft: "4px solid #3b82f6" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>Booking Volume</span>
                  <h5 style={{ margin: "5px 0", fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>0</h5>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>Total Lifetime Bookings</span>
                </div>
                
                <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", borderLeft: "4px solid #f59e0b" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>Database Size</span>
                  <h5 style={{ margin: "5px 0", fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>{companyCustomers.length}</h5>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>Total Unique Customers</span>
                </div>

                <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", borderLeft: "4px solid #64748b" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>Business Volume</span>
                  <h5 style={{ margin: "5px 0", fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>SAR 0</h5>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>Lifetime Gross Revenue</span>
                </div>
              </div>

              {/* Automations & Settings Block */}
              <div style={{ background: "#ffffff", padding: "25px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <h4 style={{ margin: "0 0 20px 0", fontSize: "15px", fontWeight: "700", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="fas fa-cog" style={{ color: "#2563eb" }}></i>
                  <span>Automations & Settings</span>
                </h4>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                    <div>
                      <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>GUEST VOUCHERS</span>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>Auto-voucher delivery</span>
                    </div>
                    <label className="switch">
                      <input type="checkbox" checked={c.vouchers} readOnly />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                    <div>
                      <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>GUEST REMINDERS</span>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>SMS/WhatsApp reminders</span>
                    </div>
                    <label className="switch">
                      <input type="checkbox" checked={c.reminders} readOnly />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                    <div>
                      <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>INVOICING</span>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>Auto-PDF invoices</span>
                    </div>
                    <label className="switch">
                      <input type="checkbox" checked={c.invoice} readOnly />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                    <div>
                      <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>NEXT-DAY REM.</span>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>Pre-arrival check-ins</span>
                    </div>
                    <label className="switch">
                      <input type="checkbox" checked={(c as any).tomorrow_reminder} readOnly />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                    <div>
                      <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>BULK-LOCK EXEMPTION</span>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>Exempt from locks</span>
                    </div>
                    <label className="switch">
                      <input type="checkbox" checked={(c as any).exempt_bulk_lock} readOnly />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                    <div>
                      <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>LEDGER FREQUENCY</span>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>Frequency interval</span>
                    </div>
                    <span style={{ fontWeight: "700", color: "#334155", fontSize: "14px" }}>
                      Every {(c as any).ledger_frequency || "Monday"}
                    </span>
                  </div>
                </div>
              </div>

              {/* System Audit Block */}
              <div style={{ background: "#ffffff", padding: "25px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <h4 style={{ margin: "0 0 20px 0", fontSize: "15px", fontWeight: "700", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="fas fa-shield-alt" style={{ color: "#2563eb" }}></i>
                  <span>System Audit</span>
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <span style={{ color: "#64748b" }}>REGISTERED BY</span>
                    <span style={{ fontWeight: "600", color: "#1e293b" }}>umrahcab <span style={{ color: "#94a3b8", fontWeight: "normal" }}>| 23 May, 2026 | 02:40 PM</span></span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                    <span style={{ color: "#64748b" }}>LAST PROFILE UPDATE</span>
                    <span style={{ fontWeight: "600", color: "#1e293b" }}>umrahcab <span style={{ color: "#94a3b8", fontWeight: "normal" }}>| 23 May, 2026 | 04:06 PM</span></span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Table Rows */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
            
            {/* Associated Customers */}
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", margin: "0 0 15px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fas fa-users" style={{ color: "#2563eb" }}></i>
                <span>Associated Corporate Customers</span>
              </h4>
              <div className="table-responsive">
                <table className="db-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center", color: "#94a3b8", padding: "20px 0" }}>No customers linked yet.</td>
                      </tr>
                    ) : (
                      companyCustomers.map(cust => (
                        <tr key={cust.id}>
                          <td style={{ fontWeight: 700 }}>{cust.id}</td>
                          <td>
                            <button
                              onClick={() => router.push(`/admin/mock/customers-view?id=${cust.id.replace("#CST-","")}`)}
                              style={{ background: "none", border: "none", color: "#2563eb", textDecoration: "underline", cursor: "pointer", padding: 0 }}
                            >
                              {cust.name}
                            </button>
                          </td>
                          <td>{cust.contact}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Payments */}
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", margin: "0 0 15px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fas fa-credit-card" style={{ color: "#2563eb" }}></i>
                <span>Recent Corporate Payments</span>
              </h4>
              <div className="table-responsive" style={{ textAlign: "center", padding: "40px 10px", color: "#94a3b8" }}>
                No recent payment transactions recorded.
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", background: "#f8fafc", padding: "15px", borderRadius: "12px" }}>
            <button onClick={() => router.push("/admin/mock/customers-add")} className="btn-submit" style={{ background: "#4f46e5" }}><i className="fas fa-plus"></i> Add Customer</button>
            <button onClick={() => router.push("/admin/bookings/add")} className="btn-submit" style={{ background: "#2563eb" }}><i className="fas fa-calendar-plus"></i> Add Booking</button>
            <button onClick={() => router.push("/admin/mock/ledgers")} className="btn-submit" style={{ background: "#16a34a" }}><i className="fas fa-file-invoice-dollar"></i> View Ledger</button>
            <button onClick={() => router.push("/admin/mock/payments")} className="btn-submit" style={{ background: "#ea580c" }}><i className="fas fa-cash-register"></i> Payments</button>
          </div>

          {/* Audit Trail */}
          <div style={{ background: "#ffffff", padding: "25px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="fas fa-history" style={{ color: "#2563eb" }}></i>
              <span>Audit Trail & Activity History</span>
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ display: "flex", gap: "15px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                <span style={{ fontSize: "12px", color: "#94a3b8", minWidth: "150px" }}>23 May, 2026 | 04:06 PM</span>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>umrahcab</span>
                <span style={{ fontSize: "13px", color: "#1e293b" }}>Updated company profile for {c.name} ({displayId})</span>
              </div>
              <div style={{ display: "flex", gap: "15px" }}>
                <span style={{ fontSize: "12px", color: "#94a3b8", minWidth: "150px" }}>23 May, 2026 | 02:40 PM</span>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>umrahcab</span>
                <span style={{ fontSize: "13px", color: "#1e293b" }}>Registered new company: {c.name} ({displayId})</span>
              </div>
            </div>
          </div>

        </div>
      );
    }

    // COMPANIES EDIT (SINGLE PROFILE EDIT SCREEN)
    if (slug === "companies-edit") {
      const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const targetId = searchParams?.get("id") || "";
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px", maxWidth: "900px", margin: "0 auto", padding: "10px" }}>
          
          {/* Amber Header Card */}
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #c2410c 0%, #ea580c 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Edit Company Profile</h2>
              <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Modify configuration and preference values for the corporate contract.</p>
            </div>
            <button 
              onClick={() => router.push(`/admin/mock/companies-view?id=${targetId}`)} 
              style={{
                background: "#7c2d12",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "10px 18px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <i className="fas fa-arrow-left"></i>
              <span>Back to View</span>
            </button>
          </div>

          {/* Form Card */}
          <div className="form-card" style={{ background: "#ffffff", padding: "35px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}>
            <form onSubmit={handleEditCompanyFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
              
              {/* Company / Agent Name */}
              <div style={{ width: "100%" }}>
                <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Company / Agent Name *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-building form-icon" style={{ color: "#2563eb" }}></i>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Al-Saudia Travel" 
                    value={compName} 
                    onChange={(e) => setCompName(e.target.value)} 
                    required 
                    style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                  />
                </div>
              </div>

              {/* Row 1: Phone & Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Official Phone</label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-phone form-icon" style={{ color: "#2563eb" }}></i>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="+966XXXXXXXXX" 
                      value={compPhone} 
                      onChange={(e) => setCompPhone(e.target.value)} 
                      style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Official Email</label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-envelope form-icon" style={{ color: "#2563eb" }}></i>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="info@company.com" 
                      value={compEmail} 
                      onChange={(e) => setCompEmail(e.target.value)} 
                      style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Website & Logo */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Company Website</label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-globe form-icon" style={{ color: "#2563eb" }}></i>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="https://example.com" 
                      value={compWeb} 
                      onChange={(e) => setCompWeb(e.target.value)} 
                      style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Company Logo</label>
                  <div className="form-input-wrapper" style={{ position: "relative" }}>
                    <i className="fas fa-image form-icon" style={{ color: "#2563eb", zIndex: 5 }}></i>
                    <input 
                      type="file" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setCompLogoName(file.name);
                      }}
                      style={{ 
                        opacity: 0, 
                        position: "absolute", 
                        top: 0, 
                        left: 0, 
                        width: "100%", 
                        height: "100%", 
                        cursor: "pointer",
                        zIndex: 10 
                      }} 
                    />
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      height: "46px",
                      paddingLeft: "45px",
                      width: "100%",
                      fontSize: "14px",
                      color: "#64748b",
                      background: "#fff"
                    }}>
                      <span style={{ 
                        background: "#f1f5f9", 
                        border: "1px solid #cbd5e1", 
                        borderRadius: "4px", 
                        padding: "4px 10px", 
                        marginRight: "10px",
                        fontWeight: "600",
                        fontSize: "12px",
                        color: "#475569" 
                      }}>Choose File</span>
                      {compLogoName || "No file chosen"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Physical Address */}
              <div style={{ width: "100%" }}>
                <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Physical Address</label>
                <div style={{ position: "relative" }}>
                  <i className="fas fa-location-dot" style={{ position: "absolute", top: "15px", left: "15px", color: "#2563eb", fontSize: "16px" }}></i>
                  <textarea 
                    className="form-input" 
                    placeholder="Full office address..." 
                    value={compAddress} 
                    onChange={(e) => setCompAddress(e.target.value)} 
                    rows={3}
                    style={{ 
                      border: "1px solid #cbd5e1", 
                      borderRadius: "6px", 
                      paddingLeft: "45px", 
                      paddingTop: "12px",
                      height: "100px",
                      width: "100%" 
                    }}
                  />
                </div>
              </div>

              {/* Row 3: Send Vouchers & Send Reminders */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>Send Vouchers to their guests?</span>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>Enable auto-voucher</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={compVouchers} onChange={(e) => setCompVouchers(e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>

                <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>Send Reminders to their guests?</span>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>Enable reminders</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={compReminders} onChange={(e) => setCompReminders(e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              {/* Row 4: Ledger Frequency & Generate Invoice */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Ledger Frequency (Weekly Day)</label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-calendar-alt form-icon" style={{ color: "#2563eb" }}></i>
                    <select 
                      className="form-input form-select" 
                      value={compLedgerFrequency} 
                      onChange={(e) => setCompLedgerFrequency(e.target.value)}
                      style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                    >
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                    <i className="fas fa-chevron-down select-arrow"></i>
                  </div>
                </div>

                <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>Generate Invoice?</span>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>Enable invoices</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={compInvoice} onChange={(e) => setCompInvoice(e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              {/* Row 5: Tomorrow Invoice Reminder & Exempt from Bulk Lock */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>Tomorrow Invoice Reminder?</span>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>Enable reminder</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={compTomorrowReminder} onChange={(e) => setCompTomorrowReminder(e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>

                <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>Exempt from Bulk Lock?</span>
                    <span style={{ fontSize: "11px", color: "#2563eb", fontWeight: "600" }}>{compExemptBulkLock ? "EXEMPTED" : "NOT EXEMPTED"}</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={compExemptBulkLock} onChange={(e) => setCompExemptBulkLock(e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              {/* Internal Remarks */}
              <div style={{ width: "100%" }}>
                <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Internal Remarks</label>
                <div style={{ position: "relative" }}>
                  <i className="fas fa-comment-dots" style={{ position: "absolute", top: "15px", left: "15px", color: "#2563eb", fontSize: "16px" }}></i>
                  <textarea 
                    className="form-input" 
                    placeholder="Any internal notes about this company..." 
                    value={compRemarks} 
                    onChange={(e) => setCompRemarks(e.target.value)} 
                    rows={3}
                    style={{ 
                      border: "1px solid #cbd5e1", 
                      borderRadius: "6px", 
                      paddingLeft: "45px", 
                      paddingTop: "12px",
                      height: "100px",
                      width: "100%" 
                    }}
                  />
                </div>
              </div>

              {/* Submit Row */}
              <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                <button 
                  type="submit" 
                  style={{ 
                    flex: 1,
                    background: "#0f172a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    height: "50px",
                    fontWeight: "600",
                    fontSize: "15px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  <i className="fas fa-save"></i>
                  <span>Save Changes</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => router.push(`/admin/mock/companies-view?id=${targetId}`)} 
                  style={{ 
                    flex: 1,
                    background: "#e2e8f0",
                    color: "#475569",
                    border: "none",
                    borderRadius: "6px",
                    height: "50px",
                    fontWeight: "600",
                    fontSize: "15px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    // 4. REGISTER NEW COMPANY FORM
    if (slug === "companies-add") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px", maxWidth: "900px", margin: "0 auto", padding: "10px" }}>
          
          {/* Amber Header Card */}
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #c2410c 0%, #ea580c 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Register New Company</h2>
              <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Setup a new agent or company profile in the central system.</p>
            </div>
            <button 
              onClick={() => router.push("/admin/mock/companies")} 
              style={{
                background: "#7c2d12",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "10px 18px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <i className="fas fa-arrow-left"></i>
              <span>Back to List</span>
            </button>
          </div>

          {/* Form Card */}
          <div className="form-card" style={{ background: "#ffffff", padding: "35px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}>
            <form onSubmit={handleAddCompany} style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
              
              {/* Company / Agent Name */}
              <div style={{ width: "100%" }}>
                <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Company / Agent Name *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-building form-icon" style={{ color: "#2563eb" }}></i>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Al-Saudia Travel" 
                    value={compName} 
                    onChange={(e) => setCompName(e.target.value)} 
                    required 
                    style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                  />
                </div>
              </div>

              {/* Row 1: Phone & Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Official Phone</label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-phone form-icon" style={{ color: "#2563eb" }}></i>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="+966XXXXXXXXX" 
                      value={compPhone} 
                      onChange={(e) => setCompPhone(e.target.value)} 
                      style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Official Email</label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-envelope form-icon" style={{ color: "#2563eb" }}></i>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="info@company.com" 
                      value={compEmail} 
                      onChange={(e) => setCompEmail(e.target.value)} 
                      style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Website & Logo */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Company Website</label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-globe form-icon" style={{ color: "#2563eb" }}></i>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="https://example.com" 
                      value={compWeb} 
                      onChange={(e) => setCompWeb(e.target.value)} 
                      style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Company Logo</label>
                  <div className="form-input-wrapper" style={{ position: "relative" }}>
                    <i className="fas fa-image form-icon" style={{ color: "#2563eb", zIndex: 5 }}></i>
                    <input 
                      type="file" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setCompLogoName(file.name);
                      }}
                      style={{ 
                        opacity: 0, 
                        position: "absolute", 
                        top: 0, 
                        left: 0, 
                        width: "100%", 
                        height: "100%", 
                        cursor: "pointer",
                        zIndex: 10 
                      }} 
                    />
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      height: "46px",
                      paddingLeft: "45px",
                      width: "100%",
                      fontSize: "14px",
                      color: "#64748b",
                      background: "#fff"
                    }}>
                      <span style={{ 
                        background: "#f1f5f9", 
                        border: "1px solid #cbd5e1", 
                        borderRadius: "4px", 
                        padding: "4px 10px", 
                        marginRight: "10px",
                        fontWeight: "600",
                        fontSize: "12px",
                        color: "#475569" 
                      }}>Choose File</span>
                      {compLogoName || "No file chosen"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Physical Address */}
              <div style={{ width: "100%" }}>
                <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Physical Address</label>
                <div style={{ position: "relative" }}>
                  <i className="fas fa-location-dot" style={{ position: "absolute", top: "15px", left: "15px", color: "#2563eb", fontSize: "16px" }}></i>
                  <textarea 
                    className="form-input" 
                    placeholder="Full office address..." 
                    value={compAddress} 
                    onChange={(e) => setCompAddress(e.target.value)} 
                    rows={3}
                    style={{ 
                      border: "1px solid #cbd5e1", 
                      borderRadius: "6px", 
                      paddingLeft: "45px", 
                      paddingTop: "12px",
                      height: "100px",
                      width: "100%" 
                    }}
                  />
                </div>
              </div>

              {/* Row 3: Send Vouchers & Send Reminders */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>Send Vouchers to their guests?</span>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>Enable auto-voucher</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={compVouchers} onChange={(e) => setCompVouchers(e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>

                <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>Send Reminders to their guests?</span>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>Enable reminders</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={compReminders} onChange={(e) => setCompReminders(e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              {/* Row 4: Ledger Frequency & Generate Invoice */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Ledger Frequency (Weekly Day)</label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-calendar-alt form-icon" style={{ color: "#2563eb" }}></i>
                    <select 
                      className="form-input form-select" 
                      value={compLedgerFrequency} 
                      onChange={(e) => setCompLedgerFrequency(e.target.value)}
                      style={{ border: "1px solid #cbd5e1", borderRadius: "6px", height: "46px" }}
                    >
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                    <i className="fas fa-chevron-down select-arrow"></i>
                  </div>
                </div>

                <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>Generate Invoice?</span>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>Enable invoices</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={compInvoice} onChange={(e) => setCompInvoice(e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              {/* Row 5: Tomorrow Invoice Reminder & Exempt from Bulk Lock */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>Tomorrow Invoice Reminder?</span>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>Enable reminder</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={compTomorrowReminder} onChange={(e) => setCompTomorrowReminder(e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>

                <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569" }}>Exempt from Bulk Lock?</span>
                    <span style={{ fontSize: "11px", color: "#2563eb", fontWeight: "600" }}>{compExemptBulkLock ? "EXEMPTED" : "NOT EXEMPTED"}</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={compExemptBulkLock} onChange={(e) => setCompExemptBulkLock(e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              {/* Internal Remarks */}
              <div style={{ width: "100%" }}>
                <label className="form-label" style={{ fontWeight: "600", color: "#334155", display: "block", marginBottom: "8px", fontSize: "14px" }}>Internal Remarks</label>
                <div style={{ position: "relative" }}>
                  <i className="fas fa-comment-dots" style={{ position: "absolute", top: "15px", left: "15px", color: "#2563eb", fontSize: "16px" }}></i>
                  <textarea 
                    className="form-input" 
                    placeholder="Any internal notes about this company..." 
                    value={compRemarks} 
                    onChange={(e) => setCompRemarks(e.target.value)} 
                    rows={3}
                    style={{ 
                      border: "1px solid #cbd5e1", 
                      borderRadius: "6px", 
                      paddingLeft: "45px", 
                      paddingTop: "12px",
                      height: "100px",
                      width: "100%" 
                    }}
                  />
                </div>
              </div>

              {/* Submit Row */}
              <div style={{ marginTop: "15px" }}>
                <button 
                  type="submit" 
                  style={{ 
                    width: "100%",
                    background: "#0f172a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    height: "50px",
                    fontWeight: "600",
                    fontSize: "15px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  <i className="fas fa-plus"></i>
                  <span>Register Company</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    // 5. FLIGHTS VIEW ALL
    if (slug === "flights-all") {
      const formatDateString = (dateStr: string) => {
        if (!dateStr) return "";
        try {
          const parts = dateStr.split("-");
          if (parts.length === 3) {
            const year = parts[0];
            const monthIndex = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const monthName = months[monthIndex] || parts[1];
            return `${day < 10 ? '0' + day : day} ${monthName}, ${year}`;
          }
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return dateStr;
          const day = d.getDate();
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          return `${day < 10 ? '0' + day : day} ${monthNames[d.getMonth()]}, ${d.getFullYear()}`;
        } catch {
          return dateStr;
        }
      };

      const formatTimeString = (timeStr: string) => {
        if (!timeStr) return "";
        try {
          const parts = timeStr.split(":");
          if (parts.length >= 2) {
            let hours = parseInt(parts[0], 10);
            const minutes = parts[1];
            const ampm = hours >= 12 ? "PM" : "AM";
            hours = hours % 12;
            hours = hours ? hours : 12;
            return `${hours < 10 ? '0' + hours : hours}:${minutes} ${ampm}`;
          }
          return timeStr;
        } catch {
          return timeStr;
        }
      };

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Header Card */}
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "28px", fontWeight: "700" }}>Flight Directory</h2>
              <p style={{ opacity: 0.9 }}>Lookup and manage departure and arrival records for all passengers.</p>
            </div>
            <button 
              onClick={() => router.push("/admin/mock/flights-add")} 
              style={{
                background: "#ffffff",
                color: "#0f172a",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
              }}
            >
              <i className="fas fa-plus"></i>
              <span>New Flight</span>
            </button>
          </div>

          {/* Date & Filter Panel */}
          <div className="form-card" style={{ 
            padding: "20px", 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr auto auto", 
            gap: "15px", 
            alignItems: "end", 
            background: "#ffffff", 
            border: "1px solid #e2e8f0", 
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <div>
              <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>Flight Start Date</label>
              <div className="form-input-wrapper">
                <i className="far fa-calendar form-icon" style={{ color: "#94a3b8" }}></i>
                <input type="date" className="form-input" value={fltStartDate} onChange={(e) => { setFltStartDate(e.target.value); setFltPage(1); }} />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>Flight End Date</label>
              <div className="form-input-wrapper">
                <i className="far fa-calendar form-icon" style={{ color: "#94a3b8" }}></i>
                <input type="date" className="form-input" value={fltEndDate} onChange={(e) => { setFltEndDate(e.target.value); setFltPage(1); }} />
              </div>
            </div>

            <button
              onClick={() => {
                fetchFlightsList();
                showToast("Filters applied", "success");
              }}
              style={{
                background: "#ffffff",
                color: "#1e293b",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                padding: "10px 24px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                height: "42px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#ffffff"}
            >
              <i className="fas fa-filter" style={{ color: "#475569" }}></i>
              <span>Apply Filter</span>
            </button>

            <button
              onClick={() => {
                setFltSearch("");
                setFltStartDate("");
                setFltEndDate("");
                setFltPage(1);
                showToast("Filters reset", "success");
              }}
              style={{
                background: "#cbd5e1",
                color: "#475569",
                border: "none",
                borderRadius: "8px",
                width: "42px",
                height: "42px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#b91c1c"; e.currentTarget.style.color = "#ffffff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#cbd5e1"; e.currentTarget.style.color = "#475569"; }}
              title="Reset Filters"
            >
              <i className="fas fa-undo"></i>
            </button>
          </div>

          {/* Export & Search Toolbar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px", marginTop: "10px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              {["Copy", "CSV", "Excel", "PDF", "Print"].map((exportOpt, idx) => (
                <button
                  key={idx}
                  onClick={() => showToast(`${exportOpt} exported successfully!`, "success")}
                  style={{
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(37,99,235,0.2)"
                  }}
                >
                  {exportOpt}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", color: "#475569", fontWeight: "500" }}>Search:</span>
              <input
                type="text"
                placeholder=""
                value={fltSearch}
                onChange={(e) => {
                  setFltSearch(e.target.value);
                  setFltPage(1);
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  outline: "none",
                  fontSize: "14px",
                  width: "200px",
                  background: "#ffffff"
                }}
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="table-card" style={{ padding: "20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div className="table-responsive">
              <table className="db-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "80px" }}>ID</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Flight #</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Passenger</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Type</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Port / City</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Date</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Time</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "120px", textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {flights.map((f) => (
                    <tr key={f.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ fontWeight: 600, color: "#64748b" }}>{f.custom_id || `#FLT-${f.id}`}</td>
                      <td style={{ fontWeight: 700, color: "#0f172a" }}>{f.flightNo}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{f.customer ? f.customer.name : "Walk-in Passenger"}</div>
                        {f.customer && f.customer.company && (
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{f.customer.company}</div>
                        )}
                      </td>
                      <td>
                        {f.leg === "Departure" ? (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "#dbeafe",
                            color: "#1e40af",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "700"
                          }}>
                            <i className="fas fa-plane-departure" style={{ fontSize: "10px" }}></i>
                            Departure
                          </span>
                        ) : f.leg === "Both Legs" ? (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "#f3e8ff",
                            color: "#6b21a8",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "700"
                          }}>
                            <i className="fas fa-arrows-left-right" style={{ fontSize: "10px" }}></i>
                            Both Legs
                          </span>
                        ) : (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "#dcfce7",
                            color: "#166534",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "700"
                          }}>
                            <i className="fas fa-plane-arrival" style={{ fontSize: "10px" }}></i>
                            Arrival
                          </span>
                        )}
                      </td>
                      <td style={{ color: "#475569", fontSize: "13px" }}>{f.route}</td>
                      <td style={{ color: "#0f172a", fontSize: "13px", fontWeight: "500" }}>{formatDateString(f.date)}</td>
                      <td style={{ color: "#0f172a", fontSize: "13px", fontWeight: "500" }}>{formatTimeString(f.time)}</td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button
                            onClick={() => router.push(`/admin/mock/flights-view?id=${f.id}`)}
                            style={{
                              background: "#10b981",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "6px",
                              width: "28px",
                              height: "28px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              boxShadow: "0 2px 4px rgba(16,185,129,0.2)"
                            }}
                            title="View Details"
                          >
                            <i className="far fa-eye" style={{ fontSize: "12px" }}></i>
                          </button>
                          <button
                            onClick={() => router.push(`/admin/mock/flights-edit?id=${f.id}`)}
                            style={{
                              background: "#3b82f6",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "6px",
                              width: "28px",
                              height: "28px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              boxShadow: "0 2px 4px rgba(59,130,246,0.2)"
                            }}
                            title="Edit Record"
                          >
                            <i className="far fa-edit" style={{ fontSize: "12px" }}></i>
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm("Are you sure you want to delete this flight record?")) {
                                try {
                                  const res = await api.deleteFlight(f.id);
                                  if (res.success) {
                                    showToast("Flight deleted successfully!", "success");
                                    fetchFlightsList();
                                  } else {
                                    showToast(res.error || "Failed to delete flight record", "error");
                                  }
                                } catch (err) {
                                  console.error(err);
                                  showToast("Error deleting flight", "error");
                                }
                              }
                            }}
                            style={{
                              background: "#ef4444",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "6px",
                              width: "28px",
                              height: "28px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              boxShadow: "0 2px 4px rgba(239,68,68,0.2)"
                            }}
                            title="Delete Record"
                          >
                            <i className="far fa-trash-alt" style={{ fontSize: "12px" }}></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {flights.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                        No records available in table
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Segment */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", borderTop: "1px solid #f1f5f9", paddingTop: "15px" }}>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Showing {totalFltCount === 0 ? 0 : (fltPage - 1) * fltPerPage + 1} to {Math.min(fltPage * fltPerPage, totalFltCount)} of {totalFltCount} entries
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setFltPage(prev => Math.max(1, prev - 1))}
                  className="form-btn-back"
                  style={{
                    background: fltPage === 1 ? "#f1f5f9" : "#e0e7ff",
                    color: fltPage === 1 ? "#94a3b8" : "#4338ca",
                    border: "none",
                    cursor: fltPage === 1 ? "not-allowed" : "pointer"
                  }}
                  disabled={fltPage === 1}
                >
                  Previous
                </button>
                <span style={{ display: "flex", alignItems: "center", padding: "0 10px", fontSize: "14px", fontWeight: "600", color: "#475569" }}>
                  Page {fltPage} of {fltTotalPages}
                </span>
                <button
                  onClick={() => setFltPage(prev => Math.min(fltTotalPages, prev + 1))}
                  className="form-btn-back"
                  style={{
                    background: fltPage >= fltTotalPages ? "#f1f5f9" : "#e0e7ff",
                    color: fltPage >= fltTotalPages ? "#94a3b8" : "#4338ca",
                    border: "none",
                    cursor: fltPage >= fltTotalPages ? "not-allowed" : "pointer"
                  }}
                  disabled={fltPage >= fltTotalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 5.25 SINGLE FLIGHT DETAILS VIEW PAGE
    if (slug === "flights-view") {
      if (singleFltLoading) {
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", gap: "15px" }}>
            <div className="spinner" style={{ width: "40px", height: "40px", border: "4px solid #f3f3f3", borderTop: "4px solid #3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
            <p style={{ color: "#64748b", fontWeight: "600" }}>Loading flight details...</p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        );
      }

      if (singleFltError || !singleFlt) {
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="form-header-card" style={{ background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)" }}>
              <div>
                <h2>Flight Details Error</h2>
                <p>{singleFltError || "Flight record could not be found."}</p>
              </div>
              <button onClick={() => router.push("/admin/mock/flights-check")} className="form-btn-back">
                <i className="fas fa-arrow-left"></i>
                <span>Back to Flights Registry</span>
              </button>
            </div>
            <div className="form-card" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              <i className="fas fa-circle-exclamation" style={{ fontSize: "48px", color: "#ef4444", marginBottom: "15px" }}></i>
              <h3>Unable to retrieve flight details</h3>
              <p>The record may have been deleted, or there was a communication issue with the server.</p>
              <button onClick={() => router.push("/admin/mock/flights-check")} className="btn-submit" style={{ marginTop: "15px", background: "#ef4444" }}>
                Return to Registry
              </button>
            </div>
          </div>
        );
      }

      const formattedDate = formatScheduleDate(singleFlt.date);
      const formattedTime = formatTime12h(singleFlt.time);

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Header Card */}
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0 }}>Flight Record: {singleFlt.custom_id || `#FLT-${singleFlt.id}`}</h2>
                <span className={`status-pill ${
                  singleFlt.status === 'On Time' || singleFlt.status === 'Scheduled' || singleFlt.status === 'Completed' ? 'completed' :
                  singleFlt.status === 'Cancelled' ? 'cancelled' : 'pending'
                }`} style={{ padding: "4px 12px", fontSize: "12px", fontWeight: "700" }}>
                  {singleFlt.status || 'On Time'}
                </span>
              </div>
              <p style={{ marginTop: "5px", opacity: 0.9 }}>
                {singleFlt.leg} flight {singleFlt.flightNo} registered on {formattedDate}
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => {
                  router.push(`/admin/mock/flights-edit?id=${singleFlt.id}`);
                }}
                className="form-btn-back"
                style={{ background: "#ffffff", color: "#4f46e5", border: "none", cursor: "pointer" }}
              >
                <i className="far fa-edit"></i>
                <span>Edit Record</span>
              </button>
              <button onClick={() => router.push("/admin/mock/flights-check")} className="form-btn-back">
                <i className="fas fa-arrow-left"></i>
                <span>Back to Registry</span>
              </button>
            </div>
          </div>

          {/* Details Content Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", flexWrap: "wrap" }}>
            
            {/* Flight Schedule Details */}
            <div className="form-card" style={{ background: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fas fa-plane" style={{ color: "#4f46e5" }}></i>
                <span>Flight Logistics & Schedule</span>
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { label: "Flight ID / Ref", value: singleFlt.custom_id, icon: "fa-hashtag" },
                  { label: "Flight / Carrier Number", value: singleFlt.flightNo, icon: "fa-plane-departure" },
                  { label: "Leg Direction", value: singleFlt.leg, icon: "fa-arrow-right-arrow-left" },
                  { label: "Scheduled Date", value: formattedDate, icon: "fa-calendar" },
                  { label: "Scheduled Time", value: formattedTime, icon: "fa-clock" },
                  { label: "Route Mapping", value: singleFlt.route, icon: "fa-location-dot" }
                ].map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid #f8fafc" }}>
                    <span style={{ color: "#64748b", fontWeight: "600", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <i className={`fas ${item.icon}`} style={{ width: "16px", color: "#94a3b8" }}></i>
                      {item.label}
                    </span>
                    <span style={{ color: "#1e293b", fontWeight: "700", fontSize: "14px" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Linked Passenger Details */}
            <div className="form-card" style={{ background: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fas fa-circle-user" style={{ color: "#10b981" }}></i>
                <span>Linked Passenger Profile</span>
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { label: "Passenger Name", value: singleFlt.customer ? singleFlt.customer.name : "N/A", icon: "fa-user" },
                  { label: "Company Registry", value: singleFlt.customer ? singleFlt.customer.company : "Independent", icon: "fa-building" },
                  { label: "Contact Details", value: singleFlt.customer ? singleFlt.customer.contact : "N/A", icon: "fa-phone" },
                  { label: "Last Updated", value: new Date(singleFlt.updated_at || singleFlt.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }), icon: "fa-pen-to-square" }
                ].map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid #f8fafc" }}>
                    <span style={{ color: "#64748b", fontWeight: "600", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <i className={`fas ${item.icon}`} style={{ width: "16px", color: "#94a3b8" }}></i>
                      {item.label}
                    </span>
                    <span style={{ color: "#1e293b", fontWeight: "700", fontSize: "14px" }}>{item.value}</span>
                  </div>
                ))}

                {singleFlt.customer && singleFlt.customer.contact && (
                  <div style={{ marginTop: "12px" }}>
                    <a
                      href={`https://wa.me/${singleFlt.customer.contact.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${singleFlt.customer.name}, checking your flight ${singleFlt.flightNo} status.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        background: "#25d366",
                        color: "#ffffff",
                        padding: "10px 16px",
                        borderRadius: "8px",
                        fontWeight: "600",
                        textDecoration: "none",
                        fontSize: "13px",
                        boxShadow: "0 2px 8px rgba(37,211,102,0.25)",
                        transition: "all 0.2s"
                      }}
                    >
                      <i className="fab fa-whatsapp" style={{ fontSize: "16px" }}></i>
                      <span>Contact Passenger via WhatsApp</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Audit Logs Trail Card */}
          <div className="table-card" style={{ padding: "24px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="fas fa-clock-rotate-left" style={{ color: "#64748b" }}></i>
              <span>Activity Audit Trail</span>
            </h3>

            <div className="table-responsive">
              <table className="db-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", width: "20%" }}>Timestamp</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", width: "45%" }}>Performed Action</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", width: "20%" }}>IP Address</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", width: "15%" }}>Operator</th>
                  </tr>
                </thead>
                <tbody>
                  {singleFltAudits.map((audit) => (
                    <tr key={audit.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>
                        {new Date(audit.created_at || audit.updated_at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                      <td style={{ padding: "12px", fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>
                        {audit.performed_action}
                      </td>
                      <td style={{ padding: "12px", fontSize: "13px", color: "#64748b", fontFamily: "monospace" }}>
                        {audit.ip_location || "127.0.0.1"}
                      </td>
                      <td style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>
                        <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700" }}>
                          {audit.user_session || "system"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {singleFltAudits.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: "30px", color: "#94a3b8", fontSize: "13px" }}>
                        No audit trail records available for this flight.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // 5.5 FLIGHTS CHECK
    if (slug === "flights-check") {
      const formatScheduleDate = (dateStr: string) => {
        if (!dateStr) return "";
        try {
          const date = new Date(dateStr);
          return date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
          });
        } catch (e) {
          return dateStr;
        }
      };

      const formatTime12h = (timeStr: string) => {
        if (!timeStr) return "";
        try {
          const [hours, minutes] = timeStr.split(":");
          const h = parseInt(hours, 10);
          const ampm = h >= 12 ? "PM" : "AM";
          const formattedHours = h % 12 || 12;
          const pad = (n: number) => n < 10 ? `0${n}` : n;
          return `${pad(formattedHours)}:${minutes} ${ampm}`;
        } catch (e) {
          return timeStr;
        }
      };

      const handleQuickDateFilter = (opt: string) => {
        const formatLocal = (d: Date) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${day}`;
        };
        const today = new Date();
        if (opt === "Today") {
          setFltStartDate(formatLocal(today));
          setFltEndDate(formatLocal(today));
        } else if (opt === "Tomorrow") {
          const tomorrow = new Date(Date.now() + 86400000);
          setFltStartDate(formatLocal(tomorrow));
          setFltEndDate(formatLocal(tomorrow));
        } else if (opt === "Next 7 Days") {
          const next7 = new Date(Date.now() + 7 * 86400000);
          setFltStartDate(formatLocal(today));
          setFltEndDate(formatLocal(next7));
        }
        setFltHasSearched(true);
        setFltPage(1);
        showToast(`Filtered for: ${opt}`, "success");
      };

      const handleApply = () => {
        if (!fltStartDate && !fltEndDate && !fltSearch && fltLegFilter === "All") {
          showToast("Please enter search parameters or select dates.", "error");
          return;
        }
        setFltHasSearched(true);
        setFltPage(1);
        showToast("Search filters applied", "success");
      };

      const handleReset = () => {
        setFltSearch("");
        setFltLegFilter("All");
        setFltStartDate("");
        setFltEndDate("");
        setFltHasSearched(false);
        setFlights([]);
        showToast("Reset filters", "success");
      };

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Header Banner */}
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #1084cc 0%, #0284c7 100%)" }}>
            <div>
              <h2>Flight Status Check</h2>
              <p>Monitor incoming and outgoing flights for scheduled passengers.</p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => router.push("/admin/mock/flights-all")} className="form-btn-back" style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255, 255, 255, 0.15)", border: "none", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>
                <i className="fas fa-plane"></i>
                <span>Directory</span>
              </button>
              <button onClick={() => router.push("/admin/mock/flights-add")} className="form-btn-back" style={{ display: "flex", alignItems: "center", gap: "6px", background: "#ffffff", border: "none", color: "#0284c7", padding: "8px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                <i className="fas fa-plus"></i>
                <span>New Flight</span>
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          <div className="form-card" style={{ padding: "20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "15px" }}>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 2fr auto auto", gap: "12px", alignItems: "end" }}>
              <div>
                <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>Start Date</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-calendar form-icon" style={{ color: "#94a3b8" }}></i>
                  <input type="date" className="form-input" value={fltStartDate} onChange={(e) => setFltStartDate(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>End Date</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-calendar form-icon" style={{ color: "#94a3b8" }}></i>
                  <input type="date" className="form-input" value={fltEndDate} onChange={(e) => setFltEndDate(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>Type</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-arrows-spin form-icon" style={{ color: "#94a3b8" }}></i>
                  <select
                    className="form-input form-select"
                    value={fltLegFilter}
                    onChange={(e) => setFltLegFilter(e.target.value)}
                  >
                    <option value="All">All Flights</option>
                    <option value="Arrival">Arrival</option>
                    <option value="Departure">Departure</option>
                    <option value="Both Legs">Both Legs</option>
                  </select>
                  <i className="fas fa-chevron-down select-arrow"></i>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>Search</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-search form-icon" style={{ color: "#94a3b8" }}></i>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Name or Flight #"
                    value={fltSearch}
                    onChange={(e) => setFltSearch(e.target.value)}
                  />
                </div>
              </div>

              <button
                onClick={handleApply}
                className="btn-submit"
                style={{
                  background: "#1e293b",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0 24px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  height: "42px",
                  cursor: "pointer"
                }}
              >
                <i className="fas fa-filter"></i>
                <span>Apply</span>
              </button>

              <button
                onClick={handleReset}
                style={{
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  width: "42px",
                  height: "42px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer"
                }}
                title="Reset Filters"
              >
                <i className="fas fa-sync"></i>
              </button>
            </div>

            {/* Quick Filter Buttons Row */}
            <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
              {["Today", "Tomorrow", "Next 7 Days"].map((filterOpt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickDateFilter(filterOpt)}
                  style={{
                    background: "#ffffff",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <i className={`fas ${filterOpt === "Today" ? "fa-calendar-day" : filterOpt === "Tomorrow" ? "fa-calendar-plus" : "fa-calendar-week"}`}></i>
                  {filterOpt}
                </button>
              ))}
            </div>
          </div>

          {/* Results Area */}
          {!fltHasSearched ? (
            <div className="form-card" style={{ padding: "80px 20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "15px", color: "#64748b" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="fas fa-search" style={{ fontSize: "36px", color: "#94a3b8" }}></i>
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", margin: 0 }}>Search Flight Logistics</h3>
              <p style={{ maxWidth: "450px", textAlign: "center", fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
                Select a date range or use the quick buttons above to view scheduled flights. This helps keep the dashboard clean and fast.
              </p>
            </div>
          ) : (
            <div className="table-card" style={{ padding: "20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
              <div className="table-responsive">
                <table className="db-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "15%" }}>Schedule</th>
                      <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "20%" }}>Flight Number</th>
                      <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "12%" }}>Type</th>
                      <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "23%" }}>Passenger & Company</th>
                      <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "20%" }}>Origin / Destination</th>
                      <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", width: "10%" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flights.map((f: any) => {
                      const isArrival = f.leg === "Arrival" || f.leg === "Both Legs";
                      return (
                        <tr key={f.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          {/* 1. Schedule */}
                          <td style={{ padding: "12px 8px" }}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "13px" }}>{formatScheduleDate(f.date)}</span>
                              <span style={{ color: "#3b82f6", fontSize: "12px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                                <i className="far fa-clock"></i> {formatTime12h(f.time)}
                              </span>
                            </div>
                          </td>
                          
                          {/* 2. Flight Number */}
                          <td style={{ padding: "12px 8px" }}>
                            <div style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              borderRadius: "6px",
                              padding: "4px 8px",
                              gap: "8px",
                              minWidth: "150px"
                            }}>
                              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", color: "#1e293b", fontSize: "13px" }}>
                                <span style={{ color: "#94a3b8" }}>+</span>
                                {f.flightNo}
                              </span>
                              <div style={{ display: "flex", gap: "4px" }}>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(f.flightNo);
                                    showToast(`Copied ${f.flightNo} to clipboard!`, "success");
                                  }}
                                  style={{
                                    background: "#ffffff",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "4px",
                                    width: "24px",
                                    height: "24px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    color: "#64748b"
                                  }}
                                  title="Copy Flight Number"
                                >
                                  <i className="far fa-copy" style={{ fontSize: "11px" }}></i>
                                </button>
                                <a
                                  href={`https://www.google.com/search?q=${encodeURIComponent(f.flightNo)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    background: "#ffffff",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "4px",
                                    width: "24px",
                                    height: "24px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#64748b",
                                    textDecoration: "none"
                                  }}
                                  title="Track Flight"
                                >
                                  <i className="fas fa-external-link-alt" style={{ fontSize: "11px" }}></i>
                                </a>
                              </div>
                            </div>
                          </td>

                          {/* 3. Type */}
                          <td style={{ padding: "12px 8px" }}>
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              background: isArrival ? "#e8f5e9" : "#ffebee",
                              color: isArrival ? "#2e7d32" : "#c62828",
                              borderRadius: "20px",
                              padding: "4px 10px",
                              fontSize: "10px",
                              fontWeight: "700",
                              textTransform: "uppercase"
                            }}>
                              <i className={`fas ${isArrival ? "fa-plane-arrival" : "fa-plane-departure"}`}></i>
                              {isArrival ? "Arrival" : "Departure"}
                            </span>
                          </td>

                          {/* 4. Passenger & Company */}
                          <td style={{ padding: "12px 8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <i className="fas fa-circle-user" style={{ color: "#2e7d32", fontSize: "18px" }}></i>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "13px" }}>
                                  {f.customer ? f.customer.name : "N/A"}
                                </span>
                                <span style={{ color: "#64748b", fontSize: "11px" }}>
                                  {f.customer ? f.customer.company : "Independent"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 5. Origin / Destination */}
                          <td style={{ padding: "12px 8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b" }}>
                              <i className="fas fa-location-dot" style={{ color: "#94a3b8", fontSize: "14px" }}></i>
                              <span style={{ fontSize: "13px", fontWeight: "500" }}>{f.route}</span>
                            </div>
                          </td>

                          {/* 6. Actions */}
                          <td style={{ padding: "12px 8px" }}>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                onClick={() => {
                                  router.push(`/admin/mock/flights-view?id=${f.id}`);
                                }}
                                style={{
                                  background: "#10b981",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: "6px",
                                  width: "28px",
                                  height: "28px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  boxShadow: "0 2px 4px rgba(16,185,129,0.2)"
                                }}
                                title="View Details"
                              >
                                <i className="far fa-eye" style={{ fontSize: "12px" }}></i>
                              </button>
                              <button
                                onClick={() => {
                                  router.push(`/admin/mock/flights-edit?id=${f.id}`);
                                }}
                                style={{
                                  background: "#3b82f6",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: "6px",
                                  width: "28px",
                                  height: "28px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  boxShadow: "0 2px 4px rgba(59,130,246,0.2)"
                                }}
                                title="Edit Flight"
                              >
                                <i className="far fa-edit" style={{ fontSize: "12px" }}></i>
                              </button>
                              <a
                                href={f.customer && f.customer.contact ? `https://wa.me/${f.customer.contact.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${f.customer.name}, checking your flight ${f.flightNo} status.`)}` : "#"}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => {
                                  if (!f.customer || !f.customer.contact) {
                                    e.preventDefault();
                                    showToast("No customer contact number available!", "error");
                                  }
                                }}
                                style={{
                                  background: "#25d366",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: "50%",
                                  width: "26px",
                                  height: "26px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  boxShadow: "0 2px 4px rgba(37,211,102,0.2)"
                                }}
                                title="WhatsApp Passenger"
                              >
                                <i className="fab fa-whatsapp" style={{ fontSize: "12px" }}></i>
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {flights.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                          <i className="fas fa-plane-slash" style={{ fontSize: "24px", display: "block", marginBottom: "10px" }}></i>
                          No flight records found matching the search criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Segment */}
              {flights.length > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", borderTop: "1px solid #f1f5f9", paddingTop: "15px" }}>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>
                    Showing {totalFltCount === 0 ? 0 : (fltPage - 1) * fltPerPage + 1} to {Math.min(fltPage * fltPerPage, totalFltCount)} of {totalFltCount} entries
                  </span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => setFltPage(prev => Math.max(1, prev - 1))}
                      className="form-btn-back"
                      style={{
                        background: fltPage === 1 ? "#f1f5f9" : "#e0e7ff",
                        color: fltPage === 1 ? "#94a3b8" : "#4338ca",
                        border: "none",
                        cursor: fltPage === 1 ? "not-allowed" : "pointer"
                      }}
                      disabled={fltPage === 1}
                    >
                      Previous
                    </button>
                    <span style={{ display: "flex", alignItems: "center", padding: "0 10px", fontSize: "14px", fontWeight: "600", color: "#475569" }}>
                      Page {fltPage} of {fltTotalPages}
                    </span>
                    <button
                      onClick={() => setFltPage(prev => Math.min(fltTotalPages, prev + 1))}
                      className="form-btn-back"
                      style={{
                        background: fltPage >= fltTotalPages ? "#f1f5f9" : "#e0e7ff",
                        color: fltPage >= fltTotalPages ? "#94a3b8" : "#4338ca",
                        border: "none",
                        cursor: fltPage >= fltTotalPages ? "not-allowed" : "pointer"
                      }}
                      disabled={fltPage >= fltTotalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // 6. ADD NEW FLIGHT FORM
    if (slug === "flights-add") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" }}>
            <div>
              <h2>Add Flight Record</h2>
              <p>Register departure and arrival details for a customer flight.</p>
            </div>
            <button onClick={() => router.push("/admin/mock/flights-all")} className="form-btn-back">
              <i className="fas fa-list"></i>
              <span>Flights List</span>
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "center", width: "100%", padding: "10px 0" }}>
            <div className="form-card" style={{ maxWidth: "650px", width: "100%", background: "#ffffff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", padding: "30px", border: "1px solid #e2e8f0" }}>
              <form onSubmit={handleAddFlight} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                
                {/* Search Customer Dropdown */}
                <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "14px", color: "#475569" }}>Search Customer <span style={{ color: "#ef4444" }}>*</span></label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-user form-icon" style={{ zIndex: 10 }}></i>
                    <div
                      className="form-input"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        background: "#fff",
                        minHeight: "45px",
                        paddingLeft: "45px",
                        paddingRight: "15px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px"
                      }}
                      onClick={() => setFltCustomerIsOpen(!fltCustomerIsOpen)}
                    >
                      <span style={{ color: fltSelectedCustomerObj ? "#0f172a" : "#94a3b8", fontWeight: fltSelectedCustomerObj ? "600" : "400" }}>
                        {fltSelectedCustomerObj 
                          ? `${fltSelectedCustomerObj.name} (${fltSelectedCustomerObj.company} - ${fltSelectedCustomerObj.custom_id || `#CST-${fltSelectedCustomerObj.id}`})`
                          : "Search for a customer..."}
                      </span>
                      <i className={`fas fa-chevron-${fltCustomerIsOpen ? "up" : "down"}`} style={{ color: "#94a3b8", fontSize: "12px" }}></i>
                    </div>
                  </div>

                  {fltCustomerIsOpen && (
                    <div
                      className="dropdown-panel"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "#fff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                        zIndex: 100,
                        marginTop: "5px",
                        padding: "10px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px"
                      }}
                    >
                      <div style={{ position: "relative" }}>
                        <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "14px" }}></i>
                        <input
                          type="text"
                          className="form-input"
                          style={{ paddingLeft: "35px", height: "38px" }}
                          placeholder="Type name, company, ID to search..."
                          value={fltCustomerSearch}
                          onChange={(e) => setFltCustomerSearch(e.target.value)}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      <div
                        style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}
                        onScroll={(e) => {
                          const target = e.currentTarget;
                          if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
                            if (!fltLoadingCustomers && fltCustomerHasMore) {
                              setFltCustomerPage((prev) => prev + 1);
                            }
                          }
                        }}
                      >
                        {fltLoadingCustomers && fltCustomersList.length === 0 ? (
                          <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                            <i className="fas fa-spinner fa-spin" style={{ marginRight: "6px" }}></i> Loading customers...
                          </div>
                        ) : fltCustomersList.length === 0 ? (
                          <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                            No customers found matching "{fltCustomerSearch}"
                          </div>
                        ) : (
                          <>
                            {fltCustomersList.map((c) => (
                              <div
                                key={c.id}
                                style={{
                                  padding: "8px 12px",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                  background: fltSelectedCustomerObj && String(c.id) === String(fltSelectedCustomerObj.id) ? "#f1f5f9" : "transparent",
                                  color: "#1e293b",
                                  fontSize: "13px",
                                  fontWeight: "500"
                                }}
                                onClick={() => {
                                  setFltSelectedCustomerObj(c);
                                  setFltCustomerIsOpen(false);
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                                onMouseLeave={(e) => e.currentTarget.style.background = fltSelectedCustomerObj && String(c.id) === String(fltSelectedCustomerObj.id) ? "#f1f5f9" : "transparent"}
                              >
                                <div style={{ fontWeight: "700" }}>{c.name}</div>
                                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                  {c.company} • {c.custom_id || `#CST-${c.id}`} • {c.contact}
                                </div>
                              </div>
                            ))}
                            {fltLoadingCustomers && (
                              <div style={{ padding: "8px 12px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                                <i className="fas fa-spinner fa-spin" style={{ marginRight: "6px" }}></i> Loading more...
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tab selector for legs */}
                <div style={{ display: "flex", gap: "10px", marginTop: "10px", marginBottom: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setFltLeg("Arrival")}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      fontWeight: "600",
                      fontSize: "14px",
                      cursor: "pointer",
                      border: fltLeg === "Arrival" ? "none" : "1px solid #cbd5e1",
                      background: fltLeg === "Arrival" ? "#0284c7" : "#ffffff",
                      color: fltLeg === "Arrival" ? "#ffffff" : "#64748b",
                      boxShadow: fltLeg === "Arrival" ? "0 4px 6px -1px rgba(2, 132, 199, 0.2)" : "none",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <i className="fas fa-plane-arrival"></i>
                    <span>Arrival</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFltLeg("Departure")}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      fontWeight: "600",
                      fontSize: "14px",
                      cursor: "pointer",
                      border: fltLeg === "Departure" ? "none" : "1px solid #cbd5e1",
                      background: fltLeg === "Departure" ? "#0284c7" : "#ffffff",
                      color: fltLeg === "Departure" ? "#ffffff" : "#64748b",
                      boxShadow: fltLeg === "Departure" ? "0 4px 6px -1px rgba(2, 132, 199, 0.2)" : "none",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <i className="fas fa-plane-departure"></i>
                    <span>Departure</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFltLeg("Both Legs")}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      fontWeight: "600",
                      fontSize: "14px",
                      cursor: "pointer",
                      border: fltLeg === "Both Legs" ? "none" : "1px solid #cbd5e1",
                      background: fltLeg === "Both Legs" ? "#0284c7" : "#ffffff",
                      color: fltLeg === "Both Legs" ? "#ffffff" : "#64748b",
                      boxShadow: fltLeg === "Both Legs" ? "0 4px 6px -1px rgba(2, 132, 199, 0.2)" : "none",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <i className="fas fa-arrows-left-right"></i>
                    <span>Both Legs</span>
                  </button>
                </div>

                {/* Arrival details section */}
                {(fltLeg === "Arrival" || fltLeg === "Both Legs") && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "10px 0 5px 0", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                      <i className="fas fa-plane-arrival" style={{ color: "#0284c7" }}></i>
                      <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>Arrival Details</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Arrival Flight Number <span style={{ color: "#ef4444" }}>*</span></label>
                      <div className="form-input-wrapper">
                        <i className="fas fa-plane form-icon"></i>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. EK203"
                          value={fltArrFlightNo}
                          onChange={(e) => setFltArrFlightNo(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Arrival Place</label>
                      <div className="form-input-wrapper">
                        <i className="fas fa-location-dot form-icon"></i>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. King Abdulaziz International Airport (JED)"
                          value={fltArrPlace}
                          onChange={(e) => setFltArrPlace(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "15px" }}>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Arrival Date</label>
                        <div className="form-input-wrapper">
                          <input
                            type="date"
                            className="form-input"
                            value={fltArrDate}
                            onChange={(e) => setFltArrDate(e.target.value)}
                            style={{ paddingLeft: "15px" }}
                          />
                        </div>
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Arrival Time</label>
                        <div className="form-input-wrapper">
                          <input
                            type="time"
                            className="form-input"
                            value={fltArrTime}
                            onChange={(e) => setFltArrTime(e.target.value)}
                            style={{ paddingLeft: "15px" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Departure details section */}
                {(fltLeg === "Departure" || fltLeg === "Both Legs") && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "10px 0 5px 0", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                      <i className="fas fa-plane-departure" style={{ color: "#0284c7" }}></i>
                      <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>Departure Details</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Departure Flight Number <span style={{ color: "#ef4444" }}>*</span></label>
                      <div className="form-input-wrapper">
                        <i className="fas fa-plane form-icon"></i>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. EK202"
                          value={fltDepFlightNo}
                          onChange={(e) => setFltDepFlightNo(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Departure Place</label>
                      <div className="form-input-wrapper">
                        <i className="fas fa-location-dot form-icon"></i>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Dubai International Airport (DXB)"
                          value={fltDepPlace}
                          onChange={(e) => setFltDepPlace(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "15px" }}>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Departure Date</label>
                        <div className="form-input-wrapper">
                          <input
                            type="date"
                            className="form-input"
                            value={fltDepDate}
                            onChange={(e) => setFltDepDate(e.target.value)}
                            style={{ paddingLeft: "15px" }}
                          />
                        </div>
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Departure Time</label>
                        <div className="form-input-wrapper">
                          <input
                            type="time"
                            className="form-input"
                            value={fltDepTime}
                            onChange={(e) => setFltDepTime(e.target.value)}
                            style={{ paddingLeft: "15px" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <div style={{ marginTop: "15px" }}>
                  <button
                    type="submit"
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "8px",
                      background: "#1e293b",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "15px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      transition: "all 0.2s ease",
                      boxShadow: "0 4px 6px -1px rgba(30, 41, 59, 0.2)"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#0f172a"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#1e293b"}
                  >
                    <i className="fas fa-plane"></i>
                    <span>Save Flight Record</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      );
    }

    // 6.5 EDIT FLIGHT FORM (Replaces the modal to match PHP edit flow)
    if (slug === "flights-edit") {
      if (singleFltLoading) {
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="form-header-card" style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" }}>
              <div>
                <h2>Edit Flight Record</h2>
                <p>Modify tracking and schedule details for the flight record.</p>
              </div>
              <button onClick={() => router.push("/admin/mock/flights-check")} className="form-btn-back">
                <i className="fas fa-arrow-left"></i>
                <span>Back to Flights Registry</span>
              </button>
            </div>
            <div className="form-card" style={{ textAlign: "center", padding: "40px", color: "#64748b", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: "40px", color: "var(--primary-color)", marginBottom: "15px" }}></i>
              <h3>Loading Flight Record Details...</h3>
            </div>
          </div>
        );
      }

      if (singleFltError || !fltSelected) {
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="form-header-card" style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" }}>
              <div>
                <h2>Edit Flight Record</h2>
                <p>Modify tracking and schedule details for the flight record.</p>
              </div>
              <button onClick={() => router.push("/admin/mock/flights-check")} className="form-btn-back">
                <i className="fas fa-arrow-left"></i>
                <span>Back to Flights Registry</span>
              </button>
            </div>
            <div className="form-card" style={{ textAlign: "center", padding: "40px", color: "#64748b", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <i className="fas fa-circle-exclamation" style={{ fontSize: "48px", color: "#ef4444", marginBottom: "15px" }}></i>
              <h3>Unable to retrieve flight details</h3>
              <p>{singleFltError || "The record may have been deleted, or there was a communication issue with the server."}</p>
              <button onClick={() => router.push("/admin/mock/flights-check")} className="btn-submit" style={{ marginTop: "15px", background: "#ef4444" }}>
                Return to Registry
              </button>
            </div>
          </div>
        );
      }

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2>Edit Flight Record: {fltSelected.custom_id || `#FLT-${fltSelected.id}`}</h2>
              <p>Update tracking, routing, and status information for this flight schedule.</p>
            </div>
            <button onClick={() => router.push(`/admin/mock/flights-view?id=${fltSelected.id}`)} className="form-btn-back">
              <i className="fas fa-arrow-left"></i>
              <span>Back to Details</span>
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "center", width: "100%", padding: "10px 0" }}>
            <div className="form-card" style={{ maxWidth: "650px", width: "100%", background: "#ffffff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", padding: "30px", border: "1px solid #e2e8f0" }}>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!editFltNo || !editFltDate || !editFltTime || !editFltRoute || !editFltCustomerId) {
                    showToast("Please fill all required fields", "error");
                    return;
                  }
                  try {
                    const payload = {
                      customer_id: editFltCustomerId,
                      flight_no: editFltNo,
                      leg: editFltLeg,
                      date: editFltDate,
                      time: editFltTime,
                      route: editFltRoute,
                      status: editFltStatus
                    };
                    const res = await api.updateFlight(fltSelected.id, payload);
                    if (res.success) {
                      showToast("Flight updated successfully!", "success");
                      router.push(`/admin/mock/flights-view?id=${fltSelected.id}`);
                    } else {
                      showToast("Failed to update flight record", "error");
                    }
                  } catch (err) {
                    console.error("Failed updating flight:", err);
                    showToast("An error occurred while saving flight details", "error");
                  }
                }}
                style={{ display: "flex", flexDirection: "column", gap: "20px" }}
              >
                {/* Search Customer Input & Panel */}
                <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "14px", color: "#475569" }}>Passenger / Customer <span style={{ color: "#ef4444" }}>*</span></label>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "10px 15px",
                    background: "#f8fafc",
                    cursor: "pointer",
                    position: "relative"
                  }}
                    onClick={() => setEditFltCustomerIsOpen(!editFltCustomerIsOpen)}
                  >
                    <i className="fas fa-user" style={{ color: "#4f46e5", marginRight: "10px" }}></i>
                    <span style={{ fontSize: "14px", color: editFltCustomerName ? "#0f172a" : "#94a3b8", fontWeight: editFltCustomerName ? "600" : "400" }}>
                      {editFltCustomerName || "Search and select customer..."}
                    </span>
                    <i className="fas fa-chevron-down" style={{ marginLeft: "auto", fontSize: "12px", color: "#64748b" }}></i>
                  </div>

                  {editFltCustomerIsOpen && (
                    <div
                      className="dropdown-panel"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "#fff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                        zIndex: 100,
                        marginTop: "5px",
                        padding: "10px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px"
                      }}
                    >
                      <div style={{ position: "relative" }}>
                        <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "14px" }}></i>
                        <input
                          type="text"
                          className="form-input"
                          style={{ paddingLeft: "35px", height: "38px" }}
                          placeholder="Type name to search customer..."
                          value={fltCustomerSearch}
                          onChange={(e) => setFltCustomerSearch(e.target.value)}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      <div
                        style={{ maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}
                        onScroll={(e) => {
                          const target = e.currentTarget;
                          if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
                            if (!fltLoadingCustomers && fltCustomerHasMore) {
                              setFltCustomerPage((prev) => prev + 1);
                            }
                          }
                        }}
                      >
                        {fltLoadingCustomers && fltCustomersList.length === 0 ? (
                          <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                            <i className="fas fa-spinner fa-spin" style={{ marginRight: "6px" }}></i> Loading customers...
                          </div>
                        ) : fltCustomersList.length === 0 ? (
                          <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                            No customers found matching "{fltCustomerSearch}"
                          </div>
                        ) : (
                          <>
                            {fltCustomersList.map((c) => (
                              <div
                                key={c.id}
                                style={{
                                  padding: "8px 12px",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                  background: String(c.id) === String(editFltCustomerId) ? "#f1f5f9" : "transparent",
                                  color: "#1e293b",
                                  fontSize: "13px",
                                  fontWeight: "500"
                                }}
                                onClick={() => {
                                  setEditFltCustomerId(String(c.id));
                                  setEditFltCustomerName(c.name);
                                  setEditFltCustomerIsOpen(false);
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                                onMouseLeave={(e) => e.currentTarget.style.background = String(c.id) === String(editFltCustomerId) ? "#f1f5f9" : "transparent"}
                              >
                                <div style={{ fontWeight: "700" }}>{c.name}</div>
                                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                  {c.company} • {c.custom_id || `#CST-${c.id}`}
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Leg Selector */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label className="form-label" style={{ fontWeight: "600", fontSize: "14px", color: "#475569" }}>Leg Type <span style={{ color: "#ef4444" }}>*</span></label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {["Arrival", "Departure", "Both Legs"].map((legType) => (
                      <button
                        key={legType}
                        type="button"
                        onClick={() => setEditFltLeg(legType as any)}
                        style={{
                          flex: 1,
                          padding: "10px 16px",
                          borderRadius: "8px",
                          fontWeight: "600",
                          fontSize: "13px",
                          cursor: "pointer",
                          border: editFltLeg === legType ? "none" : "1px solid #cbd5e1",
                          background: editFltLeg === legType ? "#4f46e5" : "#ffffff",
                          color: editFltLeg === legType ? "#ffffff" : "#64748b",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {legType === "Arrival" && <i className="fas fa-plane-arrival" style={{ marginRight: "6px" }}></i>}
                        {legType === "Departure" && <i className="fas fa-plane-departure" style={{ marginRight: "6px" }}></i>}
                        {legType === "Both Legs" && <i className="fas fa-arrows-left-right" style={{ marginRight: "6px" }}></i>}
                        {legType}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Fields Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: "600", fontSize: "14px", color: "#475569" }}>Flight Number <span style={{ color: "#ef4444" }}>*</span></label>
                    <div className="form-input-wrapper">
                      <i className="fas fa-plane form-icon" style={{ color: "#94a3b8" }}></i>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={editFltNo} 
                        onChange={(e) => setEditFltNo(e.target.value)} 
                        placeholder="e.g. SV-320" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: "600", fontSize: "14px", color: "#475569" }}>Flight Status <span style={{ color: "#ef4444" }}>*</span></label>
                    <div className="form-input-wrapper">
                      <i className="fas fa-info-circle form-icon" style={{ color: "#94a3b8" }}></i>
                      <select 
                        className="form-input form-select" 
                        value={editFltStatus} 
                        onChange={(e) => setEditFltStatus(e.target.value)}
                      >
                        <option value="On Time">On Time</option>
                        <option value="Delay">Delay</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Landed">Landed</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: "600", fontSize: "14px", color: "#475569" }}>Date <span style={{ color: "#ef4444" }}>*</span></label>
                    <div className="form-input-wrapper">
                      <i className="fas fa-calendar-alt form-icon" style={{ color: "#94a3b8" }}></i>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={editFltDate} 
                        onChange={(e) => setEditFltDate(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: "600", fontSize: "14px", color: "#475569" }}>Time <span style={{ color: "#ef4444" }}>*</span></label>
                    <div className="form-input-wrapper">
                      <i className="fas fa-clock form-icon" style={{ color: "#94a3b8" }}></i>
                      <input 
                        type="time" 
                        className="form-input" 
                        value={editFltTime} 
                        onChange={(e) => setEditFltTime(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: "600", fontSize: "14px", color: "#475569" }}>Airport / Route Mapping <span style={{ color: "#ef4444" }}>*</span></label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-map-marker-alt form-icon" style={{ color: "#94a3b8" }}></i>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editFltRoute} 
                      onChange={(e) => setEditFltRoute(e.target.value)} 
                      placeholder="e.g. Jeddah Airport (JED) to Makkah" 
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                  <button
                    type="button"
                    onClick={() => router.push(`/admin/mock/flights-view?id=${fltSelected.id}`)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "8px",
                      background: "#f1f5f9",
                      color: "#475569",
                      border: "none",
                      fontSize: "15px",
                      fontWeight: "600",
                      cursor: "pointer",
                      textAlign: "center"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 2,
                      padding: "12px",
                      borderRadius: "8px",
                      background: "#4f46e5",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "15px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)"
                    }}
                  >
                    <i className="fas fa-save"></i>
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      );
    }

    // 7. TRAINS VIEW ALL
    if (slug === "trains-all") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Header Card */}
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #db2777 0%, #be185d 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2>Train Directory</h2>
              <p>Lookup and manage departure and arrival records for all train passengers.</p>
            </div>
            <button onClick={() => router.push("/admin/mock/trains-add")} className="form-btn-back" style={{ background: "#ffffff", color: "#be185d" }}>
              <i className="fas fa-plus-circle"></i>
              <span>New Train Record</span>
            </button>
          </div>

          {/* Date & Filter Panel */}
          <div className="form-card" style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: "15px", alignItems: "end", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
            <div>
              <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>Journey Start Date</label>
              <div className="form-input-wrapper">
                <i className="fas fa-calendar form-icon" style={{ color: "#94a3b8" }}></i>
                <input type="date" className="form-input" value={trnStartDate} onChange={(e) => { setTrnStartDate(e.target.value); setTrnPage(1); }} />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>Journey End Date</label>
              <div className="form-input-wrapper">
                <i className="fas fa-calendar form-icon" style={{ color: "#94a3b8" }}></i>
                <input type="date" className="form-input" value={trnEndDate} onChange={(e) => { setTrnEndDate(e.target.value); setTrnPage(1); }} />
              </div>
            </div>

            <button
              onClick={() => {
                fetchTrainsList();
                showToast("Filters applied", "success");
              }}
              className="btn-submit"
              style={{
                background: "#ffffff",
                color: "#1e293b",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                padding: "0 24px",
                fontWeight: "600",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                height: "42px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#ffffff"}
            >
              <i className="fas fa-filter"></i>
              <span>Apply Filter</span>
            </button>

            <button
              onClick={() => {
                setTrnSearch("");
                setTrnLegFilter("All");
                setTrnStatusFilter("All");
                setTrnStartDate("");
                setTrnEndDate("");
                setTrnPage(1);
                showToast("Filters reset", "success");
              }}
              style={{
                background: "#f1f5f9",
                color: "#475569",
                border: "none",
                borderRadius: "8px",
                width: "42px",
                height: "42px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#e2e8f0"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#f1f5f9"}
              title="Reset Filters"
            >
              <i className="fas fa-undo"></i>
            </button>
          </div>

          {/* Export & Search Toolbar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px", marginTop: "10px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              {["Copy", "CSV", "Excel", "PDF", "Print"].map((exportOpt, idx) => (
                <button
                  key={idx}
                  onClick={() => showToast(`${exportOpt} exported successfully!`, "success")}
                  style={{
                    background: "#4f46e5",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#4338ca"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#4f46e5"}
                >
                  {exportOpt}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", color: "#475569", fontWeight: "500" }}>Search:</span>
              <input
                type="text"
                placeholder="Search trains..."
                value={trnSearch}
                onChange={(e) => {
                  setTrnSearch(e.target.value);
                  setTrnPage(1);
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  outline: "none",
                  fontSize: "14px",
                  width: "180px",
                  background: "#ffffff"
                }}
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="table-card" style={{ padding: "20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
            <div className="table-responsive">
              <table className="db-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "left" }}>ID</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "left" }}>Train #</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "left" }}>Passenger</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "left" }}>Type</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "left" }}>Station / City</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "left" }}>Date</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "left" }}>Time</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569", padding: "12px 16px", textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {trains.map((t) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#475569" }}>{t.id}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a" }}>
                        <i className="fas fa-train" style={{ marginRight: "6px", color: "#db2777" }}></i>
                        {t.trainNo}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#1e293b" }}>
                          {t.customer ? t.customer.name : "Walk-in Passenger"}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                          {t.customer ? t.customer.company : "UmrahCab Admin"}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {t.leg === "Arrival" ? (
                          <span className="status-pill" style={{ background: "#dcfce7", color: "#15803d", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600", padding: "4px 8px", borderRadius: "12px" }}>
                            <i className="fas fa-train" style={{ fontSize: "10px" }}></i> Arrival
                          </span>
                        ) : t.leg === "Departure" ? (
                          <span className="status-pill" style={{ background: "#dbeafe", color: "#1d4ed8", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600", padding: "4px 8px", borderRadius: "12px" }}>
                            <i className="fas fa-train" style={{ fontSize: "10px" }}></i> Departure
                          </span>
                        ) : (
                          <span className="status-pill" style={{ background: "#f3e8ff", color: "#6b21a8", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600", padding: "4px 8px", borderRadius: "12px" }}>
                            <i className="fas fa-arrows-left-right" style={{ fontSize: "10px" }}></i> Both Legs
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#334155", fontWeight: "500" }}>{t.route}</td>
                      <td style={{ padding: "12px 16px", color: "#334155" }}>
                        {t.date ? formatScheduleDate(t.date) : "N/A"}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#334155" }}>
                        {t.time ? formatTime12h(t.time) : "N/A"}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button
                            onClick={() => router.push(`/admin/mock/trains-view?id=${t.rawId}`)}
                            title="View Details"
                            style={{
                              background: "#10b981",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "4px",
                              width: "28px",
                              height: "28px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              transition: "all 0.15s ease"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#059669"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "#10b981"}
                          >
                            <i className="fas fa-eye" style={{ fontSize: "12px" }}></i>
                          </button>
                          <button
                            onClick={() => router.push(`/admin/mock/trains-edit?id=${t.rawId}`)}
                            title="Edit Record"
                            style={{
                              background: "#3b82f6",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "4px",
                              width: "28px",
                              height: "28px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              transition: "all 0.15s ease"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#2563eb"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "#3b82f6"}
                          >
                            <i className="fas fa-edit" style={{ fontSize: "12px" }}></i>
                          </button>
                          <button
                            onClick={() => handleDeleteTrain(t.rawId || 0, t.id)}
                            title="Delete Record"
                            style={{
                              background: "#ef4444",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "4px",
                              width: "28px",
                              height: "28px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              transition: "all 0.15s ease"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#dc2626"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "#ef4444"}
                          >
                            <i className="fas fa-trash-alt" style={{ fontSize: "12px" }}></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {trains.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontWeight: "500" }}>
                        No train records found for this date range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Segment */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", borderTop: "1px solid #f1f5f9", paddingTop: "15px" }}>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Showing {totalTrnCount === 0 ? 0 : (trnPage - 1) * trnPerPage + 1} to {Math.min(trnPage * trnPerPage, totalTrnCount)} of {totalTrnCount} entries
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setTrnPage(prev => Math.max(1, prev - 1))}
                  className="form-btn-back"
                  style={{
                    background: trnPage === 1 ? "#f1f5f9" : "#e0e7ff",
                    color: trnPage === 1 ? "#94a3b8" : "#4338ca",
                    border: "none",
                    cursor: trnPage === 1 ? "not-allowed" : "pointer"
                  }}
                  disabled={trnPage === 1}
                >
                  Previous
                </button>
                <span style={{ display: "flex", alignItems: "center", padding: "0 10px", fontSize: "14px", fontWeight: "600", color: "#475569" }}>
                  Page {trnPage} of {trnTotalPages}
                </span>
                <button
                  onClick={() => setTrnPage(prev => Math.min(trnTotalPages, prev + 1))}
                  className="form-btn-back"
                  style={{
                    background: trnPage >= trnTotalPages ? "#f1f5f9" : "#e0e7ff",
                    color: trnPage >= trnTotalPages ? "#94a3b8" : "#4338ca",
                    border: "none",
                    cursor: trnPage >= trnTotalPages ? "not-allowed" : "pointer"
                  }}
                  disabled={trnPage >= trnTotalPages}
                >
                  Next
                </button>
              </div>
            </div>

          </div>
        </div>
      );
    }

    // 8. LOG TRAIN RECORD FORM
    if (slug === "trains-add") {
      const TRAIN_PURPLE = "#7c3aed";
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" }}>
            <div>
              <h2>Add Train Record</h2>
              <p>Register departure and arrival details for a customer train journey.</p>
            </div>
            <button onClick={() => router.push("/admin/mock/trains-all")} className="form-btn-back">
              <i className="fas fa-list"></i>
              <span>Trains List</span>
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "center", width: "100%", padding: "10px 0" }}>
            <div className="form-card" style={{ maxWidth: "650px", width: "100%", background: "#ffffff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", padding: "30px", border: "1px solid #e2e8f0" }}>
              <form onSubmit={handleAddTrain} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* Search Customer Dropdown */}
                <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "14px", color: "#475569" }}>Search Customer <span style={{ color: "#ef4444" }}>*</span></label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-user form-icon" style={{ zIndex: 10 }}></i>
                    <div
                      className="form-input"
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", background: "#fff", minHeight: "45px", paddingLeft: "45px", paddingRight: "15px", border: "1px solid #cbd5e1", borderRadius: "8px" }}
                      onClick={() => setTrnCustomerIsOpen(!trnCustomerIsOpen)}
                    >
                      <span style={{ color: trnSelectedCustomerObj ? "#0f172a" : "#94a3b8", fontWeight: trnSelectedCustomerObj ? "600" : "400" }}>
                        {trnSelectedCustomerObj
                          ? `${trnSelectedCustomerObj.name} (${trnSelectedCustomerObj.company} - ${trnSelectedCustomerObj.custom_id || `#CST-${trnSelectedCustomerObj.id}`})`
                          : "Search for a customer..."}
                      </span>
                      <i className={`fas fa-chevron-${trnCustomerIsOpen ? "up" : "down"}`} style={{ color: "#94a3b8", fontSize: "12px" }}></i>
                    </div>
                  </div>

                  {trnCustomerIsOpen && (
                    <div className="dropdown-panel" style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #cbd5e1", borderRadius: "8px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", zIndex: 100, marginTop: "5px", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ position: "relative" }}>
                        <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "14px" }}></i>
                        <input
                          type="text"
                          className="form-input"
                          style={{ paddingLeft: "35px", height: "38px" }}
                          placeholder="Type name, company, ID to search..."
                          value={trnCustomerSearch}
                          onChange={(e) => setTrnCustomerSearch(e.target.value)}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div
                        style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}
                        onScroll={(e) => {
                          const target = e.currentTarget;
                          if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
                            if (!trnLoadingCustomers && trnCustomerHasMore) {
                              setTrnCustomerPage((prev) => prev + 1);
                            }
                          }
                        }}
                      >
                        {trnLoadingCustomers && trnCustomersList.length === 0 ? (
                          <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                            <i className="fas fa-spinner fa-spin" style={{ marginRight: "6px" }}></i> Loading customers...
                          </div>
                        ) : trnCustomersList.length === 0 ? (
                          <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                            No customers found matching "{trnCustomerSearch}"
                          </div>
                        ) : (
                          <>
                            {trnCustomersList.map((c) => (
                              <div
                                key={c.id}
                                style={{ padding: "8px 12px", borderRadius: "6px", cursor: "pointer", transition: "all 0.15s ease", background: trnSelectedCustomerObj && String(c.id) === String(trnSelectedCustomerObj.id) ? "#f1f5f9" : "transparent", color: "#1e293b", fontSize: "13px", fontWeight: "500" }}
                                onClick={() => { setTrnSelectedCustomerObj(c); setTrnCustomerIsOpen(false); }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                                onMouseLeave={(e) => e.currentTarget.style.background = trnSelectedCustomerObj && String(c.id) === String(trnSelectedCustomerObj.id) ? "#f1f5f9" : "transparent"}
                              >
                                <div style={{ fontWeight: "700" }}>{c.name}</div>
                                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                  {c.company} • {c.custom_id || `#CST-${c.id}`} • {c.contact}
                                </div>
                              </div>
                            ))}
                            {trnLoadingCustomers && (
                              <div style={{ padding: "8px 12px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                                <i className="fas fa-spinner fa-spin" style={{ marginRight: "6px" }}></i> Loading more...
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Leg Type Tab Buttons */}
                <div style={{ display: "flex", gap: "10px", marginTop: "10px", marginBottom: "10px" }}>
                  {(["Arrival", "Departure", "Both Legs"] as const).map((leg) => (
                    <button
                      key={leg}
                      type="button"
                      onClick={() => setTrnLeg(leg)}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        fontWeight: "600",
                        fontSize: "13px",
                        cursor: "pointer",
                        border: trnLeg === leg ? "none" : "1px solid #cbd5e1",
                        background: trnLeg === leg ? TRAIN_PURPLE : "#ffffff",
                        color: trnLeg === leg ? "#ffffff" : "#64748b",
                        boxShadow: trnLeg === leg ? `0 4px 6px -1px rgba(124, 58, 237, 0.25)` : "none",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <i className={leg === "Arrival" ? "fas fa-train" : leg === "Departure" ? "fas fa-train-tram" : "fas fa-arrows-left-right"}></i>
                      <span>{leg}</span>
                    </button>
                  ))}
                </div>

                {/* Arrival Details */}
                {(trnLeg === "Arrival" || trnLeg === "Both Legs") && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                      <i className="fas fa-train" style={{ color: TRAIN_PURPLE }}></i>
                      <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>Arrival Details</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Train Serial / Code <span style={{ color: "#ef4444" }}>*</span></label>
                      <div className="form-input-wrapper">
                        <i className="fas fa-train form-icon"></i>
                        <input type="text" className="form-input" placeholder="e.g. HHR-4012" value={trnArrTrainNo} onChange={(e) => setTrnArrTrainNo(e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Arrival Station</label>
                      <div className="form-input-wrapper">
                        <i className="fas fa-location-dot form-icon"></i>
                        <input type="text" className="form-input" placeholder="e.g. Madinah Station" value={trnArrStation} onChange={(e) => setTrnArrStation(e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "15px" }}>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Arrival Date</label>
                        <div className="form-input-wrapper">
                          <input type="date" className="form-input" value={trnArrDate} onChange={(e) => setTrnArrDate(e.target.value)} style={{ paddingLeft: "15px" }} />
                        </div>
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Arrival Time</label>
                        <div className="form-input-wrapper">
                          <input type="time" className="form-input" value={trnArrTime} onChange={(e) => setTrnArrTime(e.target.value)} style={{ paddingLeft: "15px" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Departure Details */}
                {(trnLeg === "Departure" || trnLeg === "Both Legs") && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                      <i className="fas fa-train-tram" style={{ color: TRAIN_PURPLE }}></i>
                      <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>Departure Details</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Train Serial / Code <span style={{ color: "#ef4444" }}>*</span></label>
                      <div className="form-input-wrapper">
                        <i className="fas fa-train form-icon"></i>
                        <input type="text" className="form-input" placeholder="e.g. HHR-4013" value={trnDepTrainNo} onChange={(e) => setTrnDepTrainNo(e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Departure Station</label>
                      <div className="form-input-wrapper">
                        <i className="fas fa-location-dot form-icon"></i>
                        <input type="text" className="form-input" placeholder="e.g. Makkah Station" value={trnDepStation} onChange={(e) => setTrnDepStation(e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "15px" }}>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Departure Date</label>
                        <div className="form-input-wrapper">
                          <input type="date" className="form-input" value={trnDepDate} onChange={(e) => setTrnDepDate(e.target.value)} style={{ paddingLeft: "15px" }} />
                        </div>
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Departure Time</label>
                        <div className="form-input-wrapper">
                          <input type="time" className="form-input" value={trnDepTime} onChange={(e) => setTrnDepTime(e.target.value)} style={{ paddingLeft: "15px" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div style={{ marginTop: "15px" }}>
                  <button
                    type="submit"
                    style={{ width: "100%", padding: "14px", borderRadius: "8px", background: "#1e293b", color: "#ffffff", border: "none", fontSize: "15px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s ease", boxShadow: "0 4px 6px -1px rgba(30, 41, 59, 0.2)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#0f172a"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#1e293b"}
                  >
                    <i className="fas fa-train"></i>
                    <span>Save Train Record</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      );
    }

    // 8.5 SINGLE TRAIN DETAILS VIEW PAGE
    if (slug === "trains-view") {
      if (singleTrnLoading) {
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", gap: "15px" }}>
            <div className="spinner" style={{ width: "40px", height: "40px", border: "4px solid #f3f3f3", borderTop: "4px solid #db2777", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
            <p style={{ color: "#64748b", fontWeight: "600" }}>Loading train logistics details...</p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        );
      }

      if (singleTrnError || !singleTrn) {
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="form-header-card" style={{ background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)" }}>
              <div>
                <h2>Train Record Error</h2>
                <p>{singleTrnError || "Train record could not be found."}</p>
              </div>
              <button onClick={() => router.push("/admin/mock/trains-all")} className="form-btn-back">
                <i className="fas fa-arrow-left"></i>
                <span>Back to Trains Directory</span>
              </button>
            </div>
            <div className="form-card" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              <i className="fas fa-circle-exclamation" style={{ fontSize: "48px", color: "#ef4444", marginBottom: "15px" }}></i>
              <h3>Unable to retrieve train record</h3>
              <p>The record may have been deleted, or there was a communication issue with the server.</p>
              <button onClick={() => router.push("/admin/mock/trains-all")} className="btn-submit" style={{ marginTop: "15px", background: "#ef4444" }}>
                Return to Directory
              </button>
            </div>
          </div>
        );
      }

      const formattedDate = formatScheduleDate(singleTrn.date);
      const formattedTime = formatTime12h(singleTrn.time);

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Header Card */}
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #db2777 0%, #be185d 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0 }}>Train Record: {singleTrn.custom_id || `#TRN-${singleTrn.id}`}</h2>
                <span className={`status-pill ${
                  singleTrn.status === 'Completed' || singleTrn.status === 'Confirmed' || singleTrn.status === 'Scheduled' ? 'completed' :
                  singleTrn.status === 'Cancelled' ? 'cancelled' : 'pending'
                }`} style={{ padding: "4px 12px", fontSize: "12px", fontWeight: "700" }}>
                  {singleTrn.status || 'Confirmed'}
                </span>
              </div>
              <p style={{ marginTop: "5px", opacity: 0.9 }}>
                {singleTrn.leg} train journey {singleTrn.train_no} on {formattedDate}
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => {
                  router.push(`/admin/mock/trains-edit?id=${singleTrn.id}`);
                }}
                className="form-btn-back"
                style={{ background: "#ffffff", color: "#be185d", border: "none", cursor: "pointer" }}
              >
                <i className="far fa-edit"></i>
                <span>Edit Record</span>
              </button>
              <button onClick={() => router.push("/admin/mock/trains-all")} className="form-btn-back">
                <i className="fas fa-arrow-left"></i>
                <span>Back to Directory</span>
              </button>
            </div>
          </div>

          {/* Details Content Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", flexWrap: "wrap" }}>
            
            {/* Train logistics */}
            <div className="form-card" style={{ background: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fas fa-train" style={{ color: "#db2777" }}></i>
                <span>Train Logistics & Schedule</span>
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { label: "Train Record ID", value: singleTrn.custom_id || `#TRN-${singleTrn.id}`, icon: "fa-hashtag" },
                  { label: "Train Number / Code", value: singleTrn.train_no, icon: "fa-train-subway" },
                  { label: "Leg Direction", value: singleTrn.leg, icon: "fa-arrow-right-arrow-left" },
                  { label: "Journey Date", value: formattedDate, icon: "fa-calendar" },
                  { label: "Journey Time", value: formattedTime, icon: "fa-clock" },
                  { label: "Station Mapping / City", value: singleTrn.route, icon: "fa-location-dot" }
                ].map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid #f8fafc" }}>
                    <span style={{ color: "#64748b", fontWeight: "600", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <i className={`fas ${item.icon}`} style={{ width: "16px", color: "#94a3b8" }}></i>
                      {item.label}
                    </span>
                    <span style={{ color: "#1e293b", fontWeight: "700", fontSize: "14px" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Linked Passenger Details */}
            <div className="form-card" style={{ background: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fas fa-circle-user" style={{ color: "#10b981" }}></i>
                <span>Linked Passenger Profile</span>
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { label: "Passenger Name", value: singleTrn.customer ? singleTrn.customer.name : "Walk-in Passenger", icon: "fa-user" },
                  { label: "Company Registry", value: singleTrn.customer ? singleTrn.customer.company : "Independent", icon: "fa-building" },
                  { label: "Contact Details", value: singleTrn.customer ? singleTrn.customer.contact : "N/A", icon: "fa-phone" },
                  { label: "Last Updated", value: new Date(singleTrn.updated_at || singleTrn.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }), icon: "fa-pen-to-square" }
                ].map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid #f8fafc" }}>
                    <span style={{ color: "#64748b", fontWeight: "600", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <i className={`fas ${item.icon}`} style={{ width: "16px", color: "#94a3b8" }}></i>
                      {item.label}
                    </span>
                    <span style={{ color: "#1e293b", fontWeight: "700", fontSize: "14px" }}>{item.value}</span>
                  </div>
                ))}

                {singleTrn.customer && singleTrn.customer.contact && (
                  <div style={{ marginTop: "12px" }}>
                    <a
                      href={`https://wa.me/${singleTrn.customer.contact.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${singleTrn.customer.name}, checking your Haramain Train ${singleTrn.train_no} ticket details.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        background: "#25d366",
                        color: "#ffffff",
                        padding: "10px 16px",
                        borderRadius: "8px",
                        fontWeight: "600",
                        textDecoration: "none",
                        fontSize: "13px",
                        boxShadow: "0 2px 8px rgba(37,211,102,0.25)",
                        transition: "all 0.2s"
                      }}
                    >
                      <i className="fab fa-whatsapp" style={{ fontSize: "16px" }}></i>
                      <span>Contact Passenger via WhatsApp</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Audit Logs Trail Card */}
          <div className="table-card" style={{ padding: "24px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="fas fa-clock-rotate-left" style={{ color: "#64748b" }}></i>
              <span>Activity Audit Trail</span>
            </h3>

            <div className="table-responsive">
              <table className="db-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", width: "20%" }}>Timestamp</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", width: "45%" }}>Performed Action</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", width: "20%" }}>IP Address</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", width: "15%" }}>Operator</th>
                  </tr>
                </thead>
                <tbody>
                  {singleTrnAudits.map((audit) => (
                    <tr key={audit.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>
                        {new Date(audit.created_at || audit.updated_at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                      <td style={{ padding: "12px", fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>
                        {audit.action}
                      </td>
                      <td style={{ padding: "12px", fontSize: "13px", color: "#64748b" }}>
                        <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "12px" }}>{audit.ip_address || "127.0.0.1"}</code>
                      </td>
                      <td style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>
                        <span style={{ fontWeight: "600" }}>{audit.user_name || audit.user_id || "admin"}</span>
                      </td>
                    </tr>
                  ))}
                  {singleTrnAudits.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: "24px", color: "#94a3b8", fontSize: "13px" }}>
                        No audit history logs recorded for this train record.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // 8.75 EDIT TRAIN RECORD FORM PAGE
    if (slug === "trains-edit") {
      if (singleTrnLoading) {
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", gap: "15px" }}>
            <div className="spinner" style={{ width: "40px", height: "40px", border: "4px solid #f3f3f3", borderTop: "4px solid #db2777", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
            <p style={{ color: "#64748b", fontWeight: "600" }}>Loading train details for editing...</p>
          </div>
        );
      }

      if (singleTrnError || !singleTrn) {
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="form-header-card" style={{ background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)" }}>
              <div>
                <h2>Train Record Error</h2>
                <p>Train record could not be loaded.</p>
              </div>
              <button onClick={() => router.push("/admin/mock/trains-all")} className="form-btn-back">
                <i className="fas fa-arrow-left"></i>
                <span>Back to Trains Directory</span>
              </button>
            </div>
          </div>
        );
      }

      const TRAIN_PURPLE = "#7c3aed";

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" }}>
            <div>
              <h2>Edit Train Record</h2>
              <p>Modify train schedules, passenger mapping, and statuses for this ticket entry.</p>
            </div>
            <button onClick={() => router.push(`/admin/mock/trains-view?id=${singleTrn.id}`)} className="form-btn-back">
              <i className="fas fa-arrow-left"></i>
              <span>Back to Details</span>
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "center", width: "100%", padding: "10px 0" }}>
            <div className="form-card" style={{ maxWidth: "650px", width: "100%", background: "#ffffff", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", padding: "30px", border: "1px solid #e2e8f0" }}>
              <form onSubmit={handleUpdateTrain} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* Search Customer Dropdown */}
                <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "14px", color: "#475569" }}>Search Customer <span style={{ color: "#ef4444" }}>*</span></label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-user form-icon" style={{ zIndex: 10 }}></i>
                    <div
                      className="form-input"
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", background: "#fff", minHeight: "45px", paddingLeft: "45px", paddingRight: "15px", border: "1px solid #cbd5e1", borderRadius: "8px" }}
                      onClick={() => setTrnCustomerIsOpen(!trnCustomerIsOpen)}
                    >
                      <span style={{ color: trnSelectedCustomerObj ? "#0f172a" : "#94a3b8", fontWeight: trnSelectedCustomerObj ? "600" : "400" }}>
                        {trnSelectedCustomerObj
                          ? `${trnSelectedCustomerObj.name} (${trnSelectedCustomerObj.company} - ${trnSelectedCustomerObj.custom_id || `#CST-${trnSelectedCustomerObj.id}`})`
                          : "Search for a customer..."}
                      </span>
                      <i className={`fas fa-chevron-${trnCustomerIsOpen ? "up" : "down"}`} style={{ color: "#94a3b8", fontSize: "12px" }}></i>
                    </div>
                  </div>

                  {trnCustomerIsOpen && (
                    <div className="dropdown-panel" style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #cbd5e1", borderRadius: "8px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", zIndex: 100, marginTop: "5px", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ position: "relative" }}>
                        <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "14px" }}></i>
                        <input
                          type="text"
                          className="form-input"
                          style={{ paddingLeft: "35px", height: "38px" }}
                          placeholder="Type name, company, ID to search..."
                          value={trnCustomerSearch}
                          onChange={(e) => setTrnCustomerSearch(e.target.value)}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div
                        style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}
                        onScroll={(e) => {
                          const target = e.currentTarget;
                          if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
                            if (!trnLoadingCustomers && trnCustomerHasMore) {
                              setTrnCustomerPage((prev) => prev + 1);
                            }
                          }
                        }}
                      >
                        {trnLoadingCustomers && trnCustomersList.length === 0 ? (
                          <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                            <i className="fas fa-spinner fa-spin" style={{ marginRight: "6px" }}></i> Loading customers...
                          </div>
                        ) : trnCustomersList.length === 0 ? (
                          <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                            No customers found matching "{trnCustomerSearch}"
                          </div>
                        ) : (
                          <>
                            {trnCustomersList.map((c) => (
                              <div
                                key={c.id}
                                style={{ padding: "8px 12px", borderRadius: "6px", cursor: "pointer", transition: "all 0.15s ease", background: trnSelectedCustomerObj && String(c.id) === String(trnSelectedCustomerObj.id) ? "#f1f5f9" : "transparent", color: "#1e293b", fontSize: "13px", fontWeight: "500" }}
                                onClick={() => { setTrnSelectedCustomerObj(c); setTrnCustomerIsOpen(false); }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                                onMouseLeave={(e) => e.currentTarget.style.background = trnSelectedCustomerObj && String(c.id) === String(trnSelectedCustomerObj.id) ? "#f1f5f9" : "transparent"}
                              >
                                <div style={{ fontWeight: "700" }}>{c.name}</div>
                                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                  {c.company} • {c.custom_id || `#CST-${c.id}`} • {c.contact}
                                </div>
                              </div>
                            ))}
                            {trnLoadingCustomers && (
                              <div style={{ padding: "8px 12px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                                <i className="fas fa-spinner fa-spin" style={{ marginRight: "6px" }}></i> Loading more...
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Leg Type Tab Buttons */}
                <div style={{ display: "flex", gap: "10px", marginTop: "10px", marginBottom: "10px" }}>
                  {(["Arrival", "Departure"] as const).map((leg) => (
                    <button
                      key={leg}
                      type="button"
                      onClick={() => setTrnLeg(leg)}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        fontWeight: "600",
                        fontSize: "13px",
                        cursor: "pointer",
                        border: trnLeg === leg ? "none" : "1px solid #cbd5e1",
                        background: trnLeg === leg ? TRAIN_PURPLE : "#ffffff",
                        color: trnLeg === leg ? "#ffffff" : "#64748b",
                        boxShadow: trnLeg === leg ? `0 4px 6px -1px rgba(124, 58, 237, 0.25)` : "none",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <i className={leg === "Arrival" ? "fas fa-train" : "fas fa-train-tram"}></i>
                      <span>{leg}</span>
                    </button>
                  ))}
                </div>

                {/* Status Dropdown */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Journey Status <span style={{ color: "#ef4444" }}>*</span></label>
                  <div className="form-input-wrapper">
                    <i className="fas fa-info-circle form-icon" style={{ zIndex: 10 }}></i>
                    <select
                      className="form-input form-select"
                      value={editTrnStatus}
                      onChange={(e) => setEditTrnStatus(e.target.value)}
                      style={{ paddingLeft: "45px" }}
                      required
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <i className="fas fa-chevron-down select-arrow"></i>
                  </div>
                </div>

                {/* Arrival Details */}
                {trnLeg === "Arrival" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                      <i className="fas fa-train" style={{ color: TRAIN_PURPLE }}></i>
                      <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>Arrival Details</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Train Serial / Code <span style={{ color: "#ef4444" }}>*</span></label>
                      <div className="form-input-wrapper">
                        <i className="fas fa-train form-icon"></i>
                        <input type="text" className="form-input" placeholder="e.g. HHR-4012" value={trnArrTrainNo} onChange={(e) => setTrnArrTrainNo(e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Arrival Station</label>
                      <div className="form-input-wrapper">
                        <i className="fas fa-location-dot form-icon"></i>
                        <input type="text" className="form-input" placeholder="e.g. Madinah Station" value={trnArrStation} onChange={(e) => setTrnArrStation(e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "15px" }}>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Arrival Date</label>
                        <div className="form-input-wrapper">
                          <input type="date" className="form-input" value={trnArrDate} onChange={(e) => setTrnArrDate(e.target.value)} style={{ paddingLeft: "15px" }} />
                        </div>
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Arrival Time</label>
                        <div className="form-input-wrapper">
                          <input type="time" className="form-input" value={trnArrTime} onChange={(e) => setTrnArrTime(e.target.value)} style={{ paddingLeft: "15px" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Departure Details */}
                {trnLeg === "Departure" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                      <i className="fas fa-train-tram" style={{ color: TRAIN_PURPLE }}></i>
                      <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>Departure Details</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Train Serial / Code <span style={{ color: "#ef4444" }}>*</span></label>
                      <div className="form-input-wrapper">
                        <i className="fas fa-train form-icon"></i>
                        <input type="text" className="form-input" placeholder="e.g. HHR-4013" value={trnDepTrainNo} onChange={(e) => setTrnDepTrainNo(e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Departure Station</label>
                      <div className="form-input-wrapper">
                        <i className="fas fa-location-dot form-icon"></i>
                        <input type="text" className="form-input" placeholder="e.g. Makkah Station" value={trnDepStation} onChange={(e) => setTrnDepStation(e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "15px" }}>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Departure Date</label>
                        <div className="form-input-wrapper">
                          <input type="date" className="form-input" value={trnDepDate} onChange={(e) => setTrnDepDate(e.target.value)} style={{ paddingLeft: "15px" }} />
                        </div>
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label className="form-label" style={{ marginBottom: 0, fontWeight: "600", fontSize: "13px", color: "#475569" }}>Departure Time</label>
                        <div className="form-input-wrapper">
                          <input type="time" className="form-input" value={trnDepTime} onChange={(e) => setTrnDepTime(e.target.value)} style={{ paddingLeft: "15px" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                  <button
                    type="button"
                    onClick={() => router.push(`/admin/mock/trains-view?id=${singleTrn.id}`)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "8px",
                      background: "#f1f5f9",
                      color: "#475569",
                      border: "none",
                      fontSize: "15px",
                      fontWeight: "600",
                      cursor: "pointer",
                      textAlign: "center"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 2,
                      padding: "12px",
                      borderRadius: "8px",
                      background: "#7c3aed",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "15px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 4px 6px -1px rgba(124, 58, 237, 0.2)"
                    }}
                  >
                    <i className="fas fa-save"></i>
                    <span>Save Changes</span>
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      );
    }

    // 9. GENERAL PAYMENTS DIRECTORY & REGISTER FORM
    if (slug === "payments") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #059669 0%, #34d399 100%)" }}>
            <div>
              <h2>General Payments Ledger</h2>
              <p>Log deposits, advance cash payouts, bank transfers, and financial receipts.</p>
            </div>
            <button onClick={() => router.push("/admin/mock/payments-add")} className="form-btn-back">
              <i className="fas fa-plus"></i>
              <span>Register Cash Deposit</span>
            </button>
          </div>

          <div className="table-card" style={{ padding: "25px" }}>
            <div className="table-responsive">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Depositor Company</th>
                    <th>Transaction Date</th>
                    <th>Payment Method</th>
                    <th>Deposited Amount</th>
                    <th>Exchange Currency</th>
                    <th>Audit Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700 }}>{p.id}</td>
                      <td style={{ fontWeight: 600 }}>{p.company}</td>
                      <td>{p.date}</td>
                      <td>{p.method}</td>
                      <td style={{ fontWeight: 700, color: "var(--success-color)" }}>{p.amount.toFixed(2)}</td>
                      <td>{p.currency}</td>
                      <td>
                        <span className={`status-pill ${p.status === "Verified" ? "completed" : "pending"}`}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // 10. REGISTER PAYMENT FORM
    if (slug === "payments-add") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #059669 0%, #34d399 100%)" }}>
            <div>
              <h2>Register Cash Deposit</h2>
              <p>Add cash receipts and bank transfer deposits to accounts ledger.</p>
            </div>
            <button onClick={() => router.push("/admin/mock/payments")} className="form-btn-back">
              <i className="fas fa-arrow-left"></i>
              <span>Back to Payments</span>
            </button>
          </div>

          <div className="form-card">
            <form onSubmit={handleAddPayment} className="form-grid">
              <div>
                <label className="form-label">Depositor Corporate *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-building form-icon"></i>
                  <select className="form-input form-select" value={pmtCompany} onChange={(e) => setPmtCompany(e.target.value)} required>
                    <option value="">Select corporate account...</option>
                    <option value="Zahid Travels">Zahid Travels</option>
                    <option value="Al-Latif Group">Al-Latif Group</option>
                  </select>
                  <i className="fas fa-chevron-down select-arrow"></i>
                </div>
              </div>

              <div>
                <label className="form-label">Payment Gateway Method *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-credit-card form-icon"></i>
                  <select className="form-input form-select" value={pmtMethod} onChange={(e) => setPmtMethod(e.target.value)}>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash Receipt">Cash Deposit (Physical)</option>
                    <option value="Online Gateway">Online Checkout Card</option>
                  </select>
                  <i className="fas fa-chevron-down select-arrow"></i>
                </div>
              </div>

              <div>
                <label className="form-label">Payment Amount *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-coins form-icon"></i>
                  <input type="number" className="form-input" placeholder="0.00" value={pmtAmount || ""} onChange={(e) => setPmtAmount(parseFloat(e.target.value) || 0)} required />
                </div>
              </div>

              <div>
                <label className="form-label">Currency *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-money-bill-1-wave form-icon"></i>
                  <select className="form-input form-select" value={pmtCurrency} onChange={(e) => setPmtCurrency(e.target.value)}>
                    <option value="SAR">Saudi Riyal (SAR)</option>
                    <option value="PKR">Pakistani Rupee (PKR)</option>
                    <option value="USD">US Dollar (USD)</option>
                  </select>
                  <i className="fas fa-chevron-down select-arrow"></i>
                </div>
              </div>

              <div className="form-group-full form-submit-row">
                <button type="submit" className="btn-submit" style={{ background: "#059669" }}>Record Deposit Payment</button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    // 11. BULK DOWNLOADS UTILITY (From Extras)
    if (slug === "bulk-downloads") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)" }}>
            <div>
              <h2>Bulk Downloads & Backups</h2>
              <p>Select directories to compile and download as consolidated database backups.</p>
            </div>
            <button onClick={() => router.push("/admin/extras")} className="form-btn-back">
              <i className="fas fa-arrow-left"></i>
              <span>Back to Utilities</span>
            </button>
          </div>

          <div className="form-card">
            <form onSubmit={handleBulkExport} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#333" }}>Choose Tables for Compression</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px" }}>
                  <input type="checkbox" checked={dlBookings} onChange={(e) => setDlBookings(e.target.checked)} style={{ width: "18px", height: "18px" }} />
                  <span>Transport Bookings Matrix Logs</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px" }}>
                  <input type="checkbox" checked={dlCustomers} onChange={(e) => setDlCustomers(e.target.checked)} style={{ width: "18px", height: "18px" }} />
                  <span>Corporate Customer Account Logs</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px" }}>
                  <input type="checkbox" checked={dlPayments} onChange={(e) => setDlPayments(e.target.checked)} style={{ width: "18px", height: "18px" }} />
                  <span>Deposits & Ledger Records</span>
                </label>
              </div>

              {exportProgress >= 0 && (
                <div style={{ width: "100%", background: "#e2e8f0", borderRadius: "10px", height: "20px", overflow: "hidden", position: "relative" }}>
                  <div style={{ width: `${exportProgress}%`, background: "var(--primary-color)", height: "100%", transition: "width 0.3s" }}></div>
                  <span style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", fontSize: "11px", fontWeight: "bold", color: exportProgress > 50 ? "white" : "black" }}>
                    Compiling Data... {exportProgress}%
                  </span>
                </div>
              )}

              <div>
                <button type="submit" className="btn-submit" style={{ display: "flex", alignItems: "center", gap: "10px" }} disabled={exportProgress >= 0}>
                  <i className="fas fa-file-zipper"></i>
                  <span>Compile and Download Backup</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    // 12. HARAMAIN FLEET MANAGEMENT (From Extras)
    if (slug === "fleet-management") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)" }}>
            <div>
              <h2>Haramain Fleet Management</h2>
              <p>Maintain active transport vehicle stock, driver capacities, and dynamic logs.</p>
            </div>
            <button onClick={() => router.push("/admin/extras")} className="form-btn-back">
              <i className="fas fa-arrow-left"></i>
              <span>Back to Utilities</span>
            </button>
          </div>

          <div className="form-card">
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#333", marginBottom: "15px" }}>Active Transport Allocation Matrix</h3>
            
            <div className="table-responsive">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Vehicle Model</th>
                    <th>Total Inventory Size</th>
                    <th>Currently Dispatched</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fleetList.map((f, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}><i className="fas fa-bus" style={{ color: "#312e81", marginRight: "8px" }}></i>{f.model}</td>
                      <td style={{ fontWeight: 700 }}>{f.count} Units</td>
                      <td style={{ color: "var(--success-color)", fontWeight: 700 }}>{f.active} Units</td>
                      <td>
                        <span className="status-pill completed">Active Operational</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // 13. SYSTEM AUDIT ACTIVITY LOG (From Extras)
    if (slug === "audit-log") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #374151 0%, #1f2937 100%)" }}>
            <div>
              <h2>System Security Audit Trail</h2>
              <p>Track administrator dashboard log-ins, pricing updates, and booking registrations.</p>
            </div>
            <button onClick={() => router.push("/admin/extras")} className="form-btn-back">
              <i className="fas fa-arrow-left"></i>
              <span>Back to Utilities</span>
            </button>
          </div>

          <div className="table-card" style={{ padding: "25px" }}>
            <div className="table-responsive">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Audit ID</th>
                    <th>User Session</th>
                    <th>IP Location</th>
                    <th>Performed Action</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                        No audit log records found in the database.
                      </td>
                    </tr>
                  ) : audits.map((a) => (
                    <tr key={a.id}>
                      <td>{a.id}</td>
                      <td style={{ fontWeight: 600 }}>{a.user_session}</td>
                      <td>{a.ip_location}</td>
                      <td style={{ 
                        color: a.performed_action.includes("Unlocked") ? "var(--success-color)" : 
                               a.performed_action.includes("Registered") ? "var(--primary-color)" : "inherit", 
                        fontWeight: "600" 
                      }}>
                        {a.performed_action}
                      </td>
                      <td>{a.created_at.substring(0, 19).replace("T", " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // 14. ADMIN NOTICES & BROADCAST ANNOUNCEMENTS (From Extras)
    if (slug === "admin-notices" || slug === "agent-notices") {
      const isAgent = slug === "agent-notices";
      const list = notices.filter((n) => n.target === (isAgent ? "Agent" : "Admin"));

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: isAgent ? "linear-gradient(135deg, #ea580c 0%, #f97316 100%)" : "linear-gradient(135deg, #ca8a04 0%, #eab308 100%)" }}>
            <div>
              <h2>{isAgent ? "Agent Announcements Board" : "Administrative Notice Center"}</h2>
              <p>Publish guidelines, system outages, and operational procedures to employees.</p>
            </div>
            <button onClick={() => router.push(isAgent ? "/admin/mock/agent-notices-add" : "/admin/mock/admin-notices-add")} className="form-btn-back">
              <i className="fas fa-plus"></i>
              <span>Create Announcement</span>
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {list.map((n) => (
              <div key={n.id} className="form-card" style={{ borderLeft: `5px solid ${n.priority === "High" ? "var(--danger-color)" : "var(--primary-color)"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "700" }}>{n.title}</h3>
                  <span className={`status-pill ${n.priority === "High" ? "cancelled" : "active"}`}>{n.priority} Priority</span>
                </div>
                <p style={{ fontSize: "14px", color: "#4b5563", lineHeight: 1.6 }}>{n.content}</p>
                <div style={{ borderTop: "1px solid var(--border-color)", marginTop: "15px", paddingTop: "10px", fontSize: "11px", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                  <span>Broadcast ID: {n.id}</span>
                  <span>Published: {n.date}</span>
                </div>
              </div>
            ))}
            {list.length === 0 && (
              <div className="form-card" style={{ textAlign: "center", color: "#94a3b8", padding: "40px" }}>
                No active announcements published on this board.
              </div>
            )}
          </div>
        </div>
      );
    }

    // 15. PUBLISH NOTICE FORM
    if (slug === "admin-notices-add" || slug === "agent-notices-add") {
      const isAgent = slug === "agent-notices-add";
      
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: isAgent ? "linear-gradient(135deg, #ea580c 0%, #f97316 100%)" : "linear-gradient(135deg, #ca8a04 0%, #eab308 100%)" }}>
            <div>
              <h2>Publish Announcement Notice</h2>
              <p>Draft a notice to distribute to the {isAgent ? "Company Agents" : "Administrative staff"}.</p>
            </div>
            <button onClick={() => router.push(isAgent ? "/admin/mock/agent-notices" : "/admin/mock/admin-notices")} className="form-btn-back">
              <i className="fas fa-arrow-left"></i>
              <span>Back to Board</span>
            </button>
          </div>

          <div className="form-card">
            <form
              onSubmit={(e) => {
                // Set correct target state for notices before saving
                setNtcTarget(isAgent ? "Agent" : "Admin");
                handleAddNotice(e);
              }}
              className="form-grid"
            >
              <div className="form-group-full">
                <label className="form-label">Notice Title *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-bullhorn form-icon"></i>
                  <input type="text" className="form-input" placeholder="Announcement subject line..." value={ntcTitle} onChange={(e) => setNtcTitle(e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="form-label">Target Audience Group</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-user-group form-icon"></i>
                  <input type="text" className="form-input form-input-readonly" value={isAgent ? "Company Agents Group" : "Administrators / Headquarters"} readOnly />
                </div>
              </div>

              <div>
                <label className="form-label">Broadcast Priority</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-triangle-exclamation form-icon"></i>
                  <select className="form-input form-select" value={ntcPriority} onChange={(e) => setNtcPriority(e.target.value as any)}>
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority (Red Alert)</option>
                  </select>
                  <i className="fas fa-chevron-down select-arrow"></i>
                </div>
              </div>

              <div className="form-group-full">
                <label className="form-label">Notice Broadcast Body *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-comment form-icon" style={{ top: "16px", transform: "none" }}></i>
                  <textarea className="form-input form-textarea" placeholder="Draft notice content..." value={ntcContent} onChange={(e) => setNtcContent(e.target.value)} required></textarea>
                </div>
              </div>

              <div className="form-group-full form-submit-row">
                <button type="submit" className="btn-submit" style={{ background: isAgent ? "#ea580c" : "#ca8a04" }}>Publish Announcement</button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    // 16. BALANCES STATEMENT REPORT
    if (slug === "balance") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)" }}>
            <div>
              <h2>Accounts Receivable & Balances</h2>
              <p>Monitor company ledger balances, receivables, and net outstanding totals.</p>
            </div>
            <button onClick={() => router.push("/admin/hub")} className="form-btn-back">
              <i className="fas fa-arrow-left"></i>
              <span>Return to Hub</span>
            </button>
          </div>

          <div className="db-stats-row">
            <div className="db-stat-card">
              <div className="db-stat-icon active" style={{ background: "#4f46e5" }}>
                <i className="fas fa-wallet"></i>
              </div>
              <div className="db-stat-info">
                <span className="db-stat-value">SR 12,450.00</span>
                <span className="db-stat-label">Total Receivable</span>
              </div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-icon completed">
                <i className="fas fa-circle-check"></i>
              </div>
              <div className="db-stat-info">
                <span className="db-stat-value">SR 38,900.00</span>
                <span className="db-stat-label">Total Received</span>
              </div>
            </div>
          </div>

          <div className="form-card" style={{ marginTop: "10px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#333", marginBottom: "15px" }}>Outstanding Receivables Ledger</h3>
            <div className="table-responsive">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Net Receivables</th>
                    <th>Net Ledger Balance</th>
                    <th>Invoice count</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Zahid Travels</td>
                    <td style={{ color: "var(--danger-color)", fontWeight: 700 }}>SR 500.00</td>
                    <td style={{ color: "var(--success-color)", fontWeight: 700 }}>SR +3,700.00</td>
                    <td>1 Unpaid</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Al-Latif Group</td>
                    <td style={{ color: "var(--danger-color)", fontWeight: 700 }}>SR 7,800.00</td>
                    <td style={{ color: "var(--danger-color)", fontWeight: 700 }}>SR -7,800.00</td>
                    <td>1 Unpaid</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // 17. LEDGER LOGS
    if (slug === "ledgers") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)" }}>
            <div>
              <h2>System General Ledgers</h2>
              <p>Audit bank deposits, cash withdrawals, and transport trip transactions.</p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => router.push("/admin/mock/ledgers-add")} className="form-btn-back" style={{ background: "var(--success-color)" }}>
                <i className="fas fa-plus"></i>
                <span>Add Ledger Entry</span>
              </button>
              <button onClick={() => router.push("/admin/hub")} className="form-btn-back">
                <i className="fas fa-arrow-left"></i>
                <span>Back to Hub</span>
              </button>
            </div>
          </div>

          <div className="table-card" style={{ padding: "25px" }}>
            <div className="table-responsive">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Ledger ID</th>
                    <th>Company</th>
                    <th>Transaction Date</th>
                    <th>Description</th>
                    <th>Debit (Dr)</th>
                    <th>Credit (Cr)</th>
                    <th>Net Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgers.map((l) => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 700 }}>{l.id}</td>
                      <td style={{ fontWeight: 600 }}>{l.company}</td>
                      <td>{l.date}</td>
                      <td>{l.description}</td>
                      <td style={{ color: l.debit > 0 ? "var(--danger-color)" : "", fontWeight: l.debit > 0 ? 700 : 500 }}>
                        {l.debit > 0 ? `SR ${l.debit.toFixed(2)}` : "-"}
                      </td>
                      <td style={{ color: l.credit > 0 ? "var(--success-color)" : "", fontWeight: l.credit > 0 ? 700 : 500 }}>
                        {l.credit > 0 ? `SR ${l.credit.toFixed(2)}` : "-"}
                      </td>
                      <td style={{ fontWeight: 700, color: "var(--primary-color)" }}>SR {l.balance.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // 18. REMINDERS
    if (slug === "reminders") {
      // Dynamically load active reminders from the API, falling back to beautiful seeded defaults if arrays are empty
      const dbReminders = [...bookings, ...services];
      const allReminders = dbReminders.length > 0 ? dbReminders : [
        // Yesterday (2026-05-24)
        { id: "#BKG-9710", rawId: "9710", type: "BKG", date: "2026-05-24", time: "09:15 AM", customerName: "Zubair Ahmad", companyName: "Zahid Travels", details: "Jeddah Airport → Makkah Hotel", vehicle: "Sedan (Standard)", phones: ["+966501234567", "+923001234567"], customerId: "#CST-1" },
        { id: "#SRV-9711", rawId: "9711", type: "SRV", date: "2026-05-24", time: "11:00 AM", customerName: "Abu Bakar", companyName: "Al-Latif Group", details: "Premium Umrah Visa Service", vehicle: "N/A", phones: ["+966549876543"], customerId: "#CST-3" },

        // Today (2026-05-25)
        { id: "#BKG-9843", rawId: "9843", type: "BKG", date: "2026-05-25", time: "10:30 AM", customerName: "Zubair Ahmad", companyName: "Zahid Travels", details: "Jeddah Airport → Makkah Hotel", vehicle: "Sedan (Standard)", phones: ["+966501234567", "+923001234567"], customerId: "#CST-1" },
        { id: "#SRV-001", rawId: "001", type: "SRV", date: "2026-05-25", time: "12:00 AM", customerName: "Zubair Ahmad", companyName: "Zahid Travels", details: "Premium Umrah Visa Service (Juice, Cake & Lays)", vehicle: "N/A", phones: ["+966501234567"], customerId: "#CST-1" },
        { id: "#SRV-002", rawId: "002", type: "SRV", date: "2026-05-25", time: "02:00 PM", customerName: "Abu Bakar", companyName: "Al-Latif Group", details: "Private Makkah Ziyarah Tour (Guided)", vehicle: "N/A", phones: ["+966549876543"], customerId: "#CST-3" },

        // Tomorrow (2026-05-26)
        { id: "#BKG-9845", rawId: "9845", type: "BKG", date: "2026-05-26", time: "08:00 AM", customerName: "Imran Khan", companyName: "Zahid Travels", details: "Jeddah Airport → Madinah Hotel", vehicle: "Hyundai Staria", phones: ["+966501234567"], customerId: "#CST-1" },
        { id: "#SRV-003", rawId: "003", type: "SRV", date: "2026-05-26", time: "09:30 AM", customerName: "Amjad", companyName: "Zahid Travels", details: "VIP Makkah Meet & Greet (Fast-track)", vehicle: "N/A", phones: ["+923114567890"], customerId: "#CST-2" }
      ];

      // Filtering operations based on active date
      const activeReminders = allReminders.filter(r => r.date === reminderDate);

      // Search operations
      const filteredReminders = activeReminders.filter(r => {
        const s = reminderSearch.toLowerCase();
        return (
          r.id.toLowerCase().includes(s) ||
          r.customerName.toLowerCase().includes(s) ||
          r.companyName.toLowerCase().includes(s) ||
          r.details.toLowerCase().includes(s)
        );
      });

      const handleCopyReminder = (row: any, buttonNo: number) => {
        let message = "";
        if (buttonNo === 1) { // Trip / Service Reminder
          if (row.type === "BKG") {
            const pickup = row.details.split("→")[0]?.trim() || "Airport";
            const dropoff = row.details.split("→")[1]?.trim() || "Hotel";
            message = `🤝 *Reminder Confirmation* 🤝\n\nالسلام عليكم\n\nDear *${row.customerName}*,\n\n✅ We have your confirmed booking for a pickup from *${pickup}* to *${dropoff}* on *${row.date}* at *${row.time}*.\n_________________________\n📅 Pick Up Date: *${row.date}*\n📍 Pick Up Location: *${pickup}*\n⏰ Pick Up Time: *${row.time}*\n🏁 Drop Off Location: *${dropoff}*\n_________________________\n🚗 Vehicle: *${row.vehicle}*\n\n⚠️ *You are requested to please let us know if there is any change in the plan by 3pm today, after that the schedule shall be considered confirmed.*\n📝 *Please acknowledge the pickup time. Thanks and regards*`;
          } else {
            message = `||| 📌 *Service Reminder* |||\n\nالسلام عليكم\n\nDear *${row.customerName}*,\n\n✅ We have your confirmed service: *${row.details}*\n📅 Date: *${row.date}*\n⏰ Time: *${row.time}*\n\nHope to serve you best!`;
          }
        } else if (buttonNo === 2) { // Guest Notice Rules
          message = `📜 *Subject: Guest Notice*,\n\nDear *${row.customerName}*,\n\nالسلام عليكم\n\nFollowing these instructions is mandatory to maintain a smooth travel process.\n\n*1️⃣ Response Time:* Please confirm trip details within 8 hours of reminder.\n*2️⃣ Cancellation:* Must be 3:30 hours prior to pickup window.\n📞 Support: +966504861551.\n✨ *Safe journey and blessings.*`;
        } else if (buttonNo === 3) { // Completion / Partner Alert
          if (row.type === "BKG") {
            const pickup = row.details.split("→")[0]?.trim() || "Airport";
            const dropoff = row.details.split("→")[1]?.trim() || "Hotel";
            message = `🤝 Dear Valuable Partner *${row.companyName}*\n\n👤 Regarding Client *${row.customerName}*\n📍 From *${pickup}* to *${dropoff}*\n🚗 On *${row.vehicle}*\n\n✅ Their Pickup Has Been *Successful.*`;
          } else {
            message = `🤝 Dear Valuable Partner *${row.companyName}*\n\n👤 Regarding Client *${row.customerName}*\n🛠 Service *${row.details}*\n\n✅ Has Been *Successfully Completed.*`;
          }
        }

        navigator.clipboard.writeText(message);
        setCopiedReminders(prev => ({ ...prev, [`${row.id}_${buttonNo}`]: true }));
        showToast(`Template ${buttonNo} copied to clipboard successfully!`, "success");
      };

      const handleCopyPhone = (phone: string) => {
        navigator.clipboard.writeText(phone);
        showToast(`Phone number ${phone} copied to clipboard!`, "success");
      };

      const triggerExport = (format: string) => {
        showToast(`Exported reminders view as ${format}!`, "success");
      };

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          
          {/* Header Banner - Royal Deep Blue Gradient */}
          <div 
            className="form-header-card" 
            style={{ 
              background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)", 
              padding: "25px 35px", 
              borderRadius: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <h2 style={{ margin: 0, color: "#fff", fontSize: "24px", fontWeight: 800 }}>System Reminders</h2>
              <p style={{ margin: "4px 0 0 0", color: "#dbeafe", fontSize: "14px" }}>Quickly copy templates for WhatsApp communication.</p>
            </div>
            
            {/* Dynamic Date pill */}
            <div style={{ background: "#eff6ff", color: "#1e3a8a", fontWeight: 700, padding: "8px 16px", borderRadius: "20px", fontSize: "13px" }}>
              <i className="fas fa-calendar-alt" style={{ marginRight: "6px" }}></i>
              {reminderDate === "2026-05-24" ? "Yesterday (24 May)" : reminderDate === "2026-05-25" ? "Today (25 May)" : reminderDate === "2026-05-26" ? "Tomorrow (26 May)" : reminderDate}
            </div>
          </div>

          {/* 📅 Navigation shortcut filters bar */}
          <div 
            style={{ 
              background: "#ffffff", 
              padding: "15px 25px", 
              borderRadius: "12px", 
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "15px"
            }}
          >
            {/* Shortcut Pills */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                onClick={() => setReminderDate("2026-05-24")}
                style={{ 
                  background: reminderDate === "2026-05-24" ? "#1e3a8a" : "#f1f5f9", 
                  color: reminderDate === "2026-05-24" ? "#ffffff" : "#475569", 
                  padding: "8px 18px", 
                  borderRadius: "20px", 
                  border: "none", 
                  fontWeight: 700, 
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                Yesterday
              </button>
              <button 
                onClick={() => setReminderDate("2026-05-25")}
                style={{ 
                  background: reminderDate === "2026-05-25" ? "#1e3a8a" : "#f1f5f9", 
                  color: reminderDate === "2026-05-25" ? "#ffffff" : "#475569", 
                  padding: "8px 18px", 
                  borderRadius: "20px", 
                  border: "none", 
                  fontWeight: 700, 
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                Today
              </button>
              <button 
                onClick={() => setReminderDate("2026-05-26")}
                style={{ 
                  background: reminderDate === "2026-05-26" ? "#1e3a8a" : "#f1f5f9", 
                  color: reminderDate === "2026-05-26" ? "#ffffff" : "#475569", 
                  padding: "8px 18px", 
                  borderRadius: "20px", 
                  border: "none", 
                  fontWeight: 700, 
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                Tomorrow
              </button>
            </div>

            {/* Custom Date Input selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#475569" }}>Custom Date:</span>
              <input 
                type="date" 
                value={reminderDate} 
                onChange={(e) => setReminderDate(e.target.value)}
                style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", outline: "none", color: "#334155", fontWeight: 600 }}
              />
            </div>
          </div>

          {/* Table Container Grid */}
          <div className="table-card" style={{ padding: "25px", borderRadius: "12px", background: "#ffffff", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
            
            {/* Datatables commands */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "15px" }}>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={() => triggerExport("Excel")} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", padding: "6px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  Excel
                </button>
                <button onClick={() => triggerExport("PDF")} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", padding: "6px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  PDF
                </button>
                <button onClick={() => window.print()} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", padding: "6px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  Print
                </button>
                <select 
                  value={reminderLimit} 
                  onChange={(e) => setReminderLimit(parseInt(e.target.value))}
                  style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", color: "#334155" }}
                >
                  <option value={5}>Show 5 entries</option>
                  <option value={10}>Show 10 entries</option>
                  <option value={100}>Show All entries</option>
                </select>
              </div>

              <div style={{ position: "relative", minWidth: "260px" }}>
                <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}></i>
                <input 
                  type="text" 
                  placeholder="Search reminders..." 
                  value={reminderSearch} 
                  onChange={(e) => setReminderSearch(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px 8px 36px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", color: "#334155", outline: "none" }}
                />
              </div>
            </div>

            {/* Table */}
            <div className="table-responsive">
              <table className="db-table">
                <thead>
                  <tr>
                    <th style={{ width: "110px" }}>TIME</th>
                    <th style={{ width: "100px" }}>TYPE / ID</th>
                    <th>CUSTOMER / AGENT</th>
                    <th>SERVICE DETAILS</th>
                    <th style={{ width: "200px" }}>PHONE NUMBERS</th>
                    <th style={{ width: "160px", textAlign: "center" }}>REMINDERS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReminders.slice(0, reminderLimit).map((row) => (
                    <tr key={row.id}>
                      
                      {/* Scheduled Time */}
                      <td>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e3a8a" }}>
                          <i className="far fa-clock" style={{ marginRight: "4px" }}></i>
                          {row.time}
                        </span>
                      </td>

                      {/* Type Badge & Link ID */}
                      <td>
                        <span 
                          onClick={() => {
                            if (row.type === "BKG") {
                              router.push(`/admin/mock/customers-view?id=${row.customerId}`);
                            } else {
                              router.push(`/admin/mock/services-view?id=${row.id}`);
                            }
                          }}
                          className={`status-pill ${row.type === "BKG" ? "active" : "pending"}`} 
                          style={{ 
                            fontSize: "11px", 
                            fontWeight: 800, 
                            cursor: "pointer", 
                            textDecoration: "underline",
                            background: row.type === "BKG" ? "#dbeafe" : "#fef3c7",
                            color: row.type === "BKG" ? "#1e3a8a" : "#d97706"
                          }}
                        >
                          {row.type} - {row.rawId}
                        </span>
                      </td>

                      {/* Customer / Agent Stack */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span 
                            onClick={() => router.push(`/admin/mock/customers-view?id=${row.customerId}`)}
                            style={{ fontWeight: 700, color: "#1e293b", cursor: "pointer", textDecoration: "underline" }}
                          >
                            {row.customerName}
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                            <i className="fas fa-building" style={{ marginRight: "3px" }}></i>
                            {row.companyName}
                          </span>
                        </div>
                      </td>

                      {/* Details specs */}
                      <td>
                        <span style={{ fontSize: "12px", color: "#475569", fontWeight: 500 }}>
                          {row.details}
                          {row.vehicle !== "N/A" && ` (${row.vehicle})`}
                        </span>
                      </td>

                      {/* stacked phone numbers with individual copy */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {row.phones.map((phone: string, idx: number) => (
                            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f8fafc", padding: "4px 8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569", fontFamily: "monospace" }}>{phone}</span>
                              <button 
                                onClick={() => handleCopyPhone(phone)}
                                title="Copy Phone Number"
                                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
                              >
                                <i className="far fa-copy" style={{ fontSize: "12px" }}></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Template Reminders 1-2-3 Actions Panel */}
                      <td>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          {/* Button 1: Trip / Service Reminder (Green) */}
                          <button 
                            onClick={() => handleCopyReminder(row, 1)}
                            title="Copy Trip / Service Reminder Message"
                            className={copiedReminders[`${row.id}_1`] ? "copied" : ""}
                            style={{ 
                              width: "34px", 
                              height: "34px", 
                              borderRadius: "50%", 
                              border: "none", 
                              background: "#10b981", 
                              color: "#fff", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              cursor: "pointer",
                              boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)",
                              opacity: copiedReminders[`${row.id}_1`] ? 0.45 : 1,
                              transition: "opacity 0.2s"
                            }}
                          >
                            <i className="fas fa-bell" style={{ fontSize: "13px" }}></i>
                          </button>

                          {/* Button 2: Night Notice Rules Reminder (Blue) */}
                          <button 
                            onClick={() => handleCopyReminder(row, 2)}
                            title="Copy Night Notice / Rules Rules Message"
                            className={copiedReminders[`${row.id}_2`] ? "copied" : ""}
                            style={{ 
                              width: "34px", 
                              height: "34px", 
                              borderRadius: "50%", 
                              border: "none", 
                              background: "#3b82f6", 
                              color: "#fff", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              cursor: "pointer",
                              boxShadow: "0 2px 4px rgba(59, 130, 246, 0.2)",
                              opacity: copiedReminders[`${row.id}_2`] ? 0.45 : 1,
                              transition: "opacity 0.2s"
                            }}
                          >
                            <i className="fas fa-moon" style={{ fontSize: "13px" }}></i>
                          </button>

                          {/* Button 3: Dispatch Completion Alert (Teal) */}
                          <button 
                            onClick={() => handleCopyReminder(row, 3)}
                            title="Copy Dispatch / Completion Confirmation Message"
                            className={copiedReminders[`${row.id}_3`] ? "copied" : ""}
                            style={{ 
                              width: "34px", 
                              height: "34px", 
                              borderRadius: "50%", 
                              border: "none", 
                              background: "#0d9488", 
                              color: "#fff", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              cursor: "pointer",
                              boxShadow: "0 2px 4px rgba(13, 148, 136, 0.2)",
                              opacity: copiedReminders[`${row.id}_3`] ? 0.45 : 1,
                              transition: "opacity 0.2s"
                            }}
                          >
                            <i className="fas fa-check" style={{ fontSize: "13px" }}></i>
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}

                  {filteredReminders.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                        <div style={{ fontSize: "24px", marginBottom: "8px" }}><i className="fas fa-calendar-times"></i></div>
                        No system reminders recorded for this date query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      );
    }

    // 19. SERVICES DIRECTORY
    if (slug === "services-all") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Header Banner */}
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", borderRadius: "16px", padding: "24px 30px" }}>
            <div>
              <h2 style={{ color: "#fff", fontSize: "24px", fontWeight: "700" }}>Additional Services</h2>
              <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "14px", marginTop: "4px" }}>
                Manage, track, and export your supplementary service records.
              </p>
            </div>
            <button
              onClick={() => router.push("/admin/mock/services-add")}
              style={{
                background: "#ffffff",
                color: "#1e1b4b",
                border: "none",
                borderRadius: "8px",
                padding: "10px 16px",
                fontWeight: "600",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
              }}
            >
              <i className="fas fa-plus"></i>
              <span>New Service</span>
            </button>
          </div>

          {/* Quick Filter Buttons */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {["Today", "Yesterday", "Last 7 Days", "Next 7 Days"].map((filterOpt, idx) => (
              <button
                key={idx}
                onClick={() => showToast(`Filter updated to: ${filterOpt}`, "success")}
                style={{
                  background: filterOpt === "Last 7 Days" ? "#f5f3ff" : "#ffffff",
                  color: filterOpt === "Last 7 Days" ? "#7c3aed" : "#475569",
                  border: `1px solid ${filterOpt === "Last 7 Days" ? "#7c3aed" : "#cbd5e1"}`,
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <i className={`fas ${filterOpt === "Today" ? "fa-calendar" : filterOpt === "Yesterday" ? "fa-calendar-minus" : filterOpt === "Last 7 Days" ? "fa-history" : "fa-calendar-plus"}`}></i>
                {filterOpt}
              </button>
            ))}
          </div>

          {/* Date & Status Filters Panel */}
          <div className="form-card" style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto auto", gap: "15px", alignItems: "end", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
            <div>
              <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>Start Date (Service Date)</label>
              <div className="form-input-wrapper">
                <i className="fas fa-calendar form-icon" style={{ color: "#94a3b8" }}></i>
                <input type="date" className="form-input" defaultValue="2026-05-19" />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>End Date (Service Date)</label>
              <div className="form-input-wrapper">
                <i className="fas fa-calendar form-icon" style={{ color: "#94a3b8" }}></i>
                <input type="date" className="form-input" defaultValue="2026-05-25" />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>Status</label>
              <div className="form-input-wrapper">
                <i className="fas fa-filter form-icon" style={{ color: "#94a3b8" }}></i>
                <select
                  className="form-input form-select"
                  value={srvStatusFilter}
                  onChange={(e) => {
                    setSrvStatusFilter(e.target.value);
                    setSrvPage(1);
                  }}
                >
                  <option value="All">Search & Select...</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <i className="fas fa-chevron-down select-arrow"></i>
              </div>
            </div>

            <button
              onClick={() => {
                fetchServicesList();
                showToast("Filters applied", "success");
              }}
              className="btn-submit"
              style={{
                background: "#ffffff",
                color: "#1e293b",
                border: "1px solid #cbd5e1",
                padding: "10px 20px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                height: "42px"
              }}
            >
              <i className="fas fa-filter"></i>
              <span>Apply</span>
            </button>

            <button
              onClick={() => {
                setSrvSearch("");
                setSrvStatusFilter("All");
                setSrvPage(1);
                showToast("Filters reset", "success");
              }}
              style={{
                background: "#f1f5f9",
                color: "#475569",
                border: "none",
                borderRadius: "8px",
                width: "42px",
                height: "42px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
              title="Reset Filters"
            >
              <i className="fas fa-undo"></i>
            </button>
          </div>

          {/* Export & Search Toolbar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px", marginTop: "10px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              {["Copy", "CSV", "Excel", "PDF", "Print"].map((exportOpt, idx) => (
                <button
                  key={idx}
                  onClick={() => showToast(`${exportOpt} exported successfully!`, "success")}
                  style={{
                    background: "#0d6efd",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  {exportOpt}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", color: "#475569", fontWeight: "500" }}>Search:</span>
              <input
                type="text"
                placeholder="..."
                value={srvSearch}
                onChange={(e) => {
                  setSrvSearch(e.target.value);
                  setSrvPage(1);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  outline: "none",
                  fontSize: "14px",
                  width: "180px"
                }}
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="table-card" style={{ padding: "20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
            <div className="table-responsive">
              <table className="db-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>ID</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Service Date</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Customer</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Service Type</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Pickup</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Status</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Total (SAR)</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Cash (Driver)</th>
                    <th style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "700", color: "#475569" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((svc) => (
                    <tr key={svc.id}>
                      <td style={{ fontWeight: 700 }}>#{svc.customId || `ADS-${svc.id}`}</td>
                      <td>25 May, 2026</td>
                      <td>
                        <div style={{ fontWeight: "600", color: "#1e293b" }}>{svc.customerName || "Abu Bakar"}</div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{svc.companyName || "Zahid Travels"}</div>
                      </td>
                      <td>
                        <span className="status-pill active" style={{ background: "#e0e7ff", color: "#4338ca", fontWeight: "600" }}>
                          {svc.type}
                        </span>
                      </td>
                      <td>{svc.name}</td>
                      <td>
                        <span className="status-pill pending" style={{ background: "#e2e8f0", color: "#475569", fontWeight: "600" }}>
                          {svc.status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: "#10b981" }}>SAR {svc.basePrice.toFixed(2)}</td>
                      <td style={{ fontWeight: 700, color: "#0ea5e9" }}>SAR 50.00</td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => router.push(`/admin/mock/services-view?id=${svc.rawId}`)}
                            title="View Details"
                            style={{
                              background: "#e0f2fe",
                              border: "none",
                              borderRadius: "6px",
                              width: "30px",
                              height: "30px",
                              cursor: "pointer",
                              color: "#0369a1",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <i className="fas fa-eye" style={{ fontSize: "12px" }}></i>
                          </button>
                          <button
                            onClick={() => setEditingService(svc)}
                            title="Edit Service"
                            style={{
                              background: "#f1f5f9",
                              border: "none",
                              borderRadius: "6px",
                              width: "30px",
                              height: "30px",
                              cursor: "pointer",
                              color: "#4f46e5",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <i className="fas fa-pencil" style={{ fontSize: "12px" }}></i>
                          </button>
                          <button
                            onClick={() => showToast(`Simulated deletion of service: ${svc.name}`, "error")}
                            title="Delete Service"
                            style={{
                              background: "#fee2e2",
                              border: "none",
                              borderRadius: "6px",
                              width: "30px",
                              height: "30px",
                              cursor: "pointer",
                              color: "#ef4444",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <i className="fas fa-trash" style={{ fontSize: "12px" }}></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {services.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                        No records available in table
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Segment */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", borderTop: "1px solid #f1f5f9", paddingTop: "15px" }}>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Showing {totalSrvCount === 0 ? 0 : (srvPage - 1) * srvPerPage + 1} to {Math.min(srvPage * srvPerPage, totalSrvCount)} of {totalSrvCount} entries
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setSrvPage(prev => Math.max(1, prev - 1))}
                  className="form-btn-back"
                  style={{
                    background: srvPage === 1 ? "#f1f5f9" : "#e0e7ff",
                    color: srvPage === 1 ? "#94a3b8" : "#4338ca",
                    border: "none",
                    cursor: srvPage === 1 ? "not-allowed" : "pointer"
                  }}
                  disabled={srvPage === 1}
                >
                  Previous
                </button>
                <span style={{ display: "flex", alignItems: "center", padding: "0 10px", fontSize: "14px", fontWeight: "600", color: "#475569" }}>
                  Page {srvPage} of {srvTotalPages}
                </span>
                <button
                  onClick={() => setSrvPage(prev => Math.min(srvTotalPages, prev + 1))}
                  className="form-btn-back"
                  style={{
                    background: srvPage >= srvTotalPages ? "#f1f5f9" : "#e0e7ff",
                    color: srvPage >= srvTotalPages ? "#94a3b8" : "#4338ca",
                    border: "none",
                    cursor: srvPage >= srvTotalPages ? "not-allowed" : "pointer"
                  }}
                  disabled={srvPage >= srvTotalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 19.5. VIEW DETAILED SERVICE PAGE
    if (slug === "services-view") {
      const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const targetId = searchParams?.get("id") || "";

      if (loadingSingleService) {
        return (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
            <div style={{ border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #7c3aed", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        );
      }

      // Format helper functions for date and time
      const formatDateForDisplay = (dateStr: string) => {
        if (!dateStr) return "";
        if (dateStr.includes(",")) return dateStr;
        try {
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return dateStr;
          return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
        } catch {
          return dateStr;
        }
      };

      const formatTimeForDisplay = (timeStr: string) => {
        if (!timeStr) return "";
        if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;
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

      // Use loaded singleService if available, otherwise fallback
      const currentSvc = singleService ? {
        id: singleService.custom_id || `#SRV-${singleService.id}`,
        rawId: singleService.id,
        name: singleService.name,
        type: singleService.type,
        description: singleService.description || "No description provided.",
        basePrice: parseFloat(singleService.base_price || 0),
        status: singleService.status || "Active",
        created_at: singleService.created_at,
        pickup: singleService.pickup || "",
        driverCash: parseFloat(singleService.driver_cash || 0),
        date: singleService.date || "",
        time: singleService.time || ""
      } : {
        id: "#ADS-1",
        name: "(Juice, Cake & Lays)",
        type: "Food",
        description: "Standard refreshment pack including fresh juice, cake slice, and potato chips for long transport journeys.",
        basePrice: 150.00,
        status: "Pending",
        created_at: new Date().toISOString(),
        pickup: "Makkah",
        driverCash: 50.00,
        date: "2026-05-25",
        time: "12:00"
      };

      const customerObj = singleService?.customer || {
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
          entryBy: singleService?.customer?.registered_by || "umrahcab",
          entryDate: singleService?.customer?.created_at ? new Date(singleService.customer.created_at).toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "25 May, 2026 07:16 AM",
          editedBy: singleService?.customer?.last_update || "umrahcab",
          editedDate: "No edits"
        }
      };

      // Dynamic audit trail list
      const auditTrail = [
        {
          dateTime: currentSvc.created_at ? new Date(currentSvc.created_at).toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "25 May, 2026 07:16 AM",
          actionBy: "umrahcab",
          remark: `Added new additional service ${currentSvc.id}: ${currentSvc.name}`
        }
      ];

      // WhatsApp Dispatch Details message body
      const whatsappMessage = `🛎️ *NEW SERVICE DISPATCH*
ID: *${currentSvc.id}*

👤 Regarding Our Client
*${mockCustomer.name}*
(${mockCustomer.phones[0]})

🛠️ Service: *${currentSvc.name}*
📅 Date: *${currentSvc.date ? formatDateForDisplay(currentSvc.date) : (currentSvc.created_at ? new Date(currentSvc.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "25 May, 2026")}*
⏰ Time: *${currentSvc.time ? formatTimeForDisplay(currentSvc.time) : (currentSvc.created_at ? new Date(currentSvc.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "12:00 AM")}*
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
        if (activeSrvTab === "Service Started") return startedMessage;
        if (activeSrvTab === "Service Completed") return completedMessage;
        return whatsappMessage;
      };

      const handleCopyText = () => {
        navigator.clipboard.writeText(getActiveMessage());
        showToast(`${activeSrvTab || "Dispatch"} details copied to clipboard!`, "success");
      };

      const handleCompleteAndCopy = async () => {
        if (currentSvc.rawId) {
          await api.updateService(String(currentSvc.rawId), { status: "Completed" });
          showToast("Service marked as Completed and Dispatch copied!", "success");
          if (singleService) {
            setSingleService({ ...singleService, status: "Completed" });
          }
        } else {
          showToast("Service marked as Completed (simulated)!", "success");
        }
        navigator.clipboard.writeText(completedMessage);
      };

      const handleDeleteClick = async () => {
        if (currentSvc.rawId) {
          const res = await api.deleteService(String(currentSvc.rawId));
          if (res.success) {
            showToast("Service deleted successfully!", "success");
            setTimeout(() => {
              router.push("/admin/mock/services-all");
            }, 1000);
            return;
          }
        }
        showToast("Service deletion request simulated successfully!", "success");
        setTimeout(() => {
          router.push("/admin/mock/services-all");
        }, 1000);
      };

      const handleTabChange = (tab: any) => {
        showToast(`Switched dispatch state simulation: ${tab}`, "success");
      };

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          
          {/* Header Panel (Vibrant Purple Background) */}
          <div 
            style={{ 
              background: "linear-gradient(135deg, #5c2d91 0%, #4a2175 100%)", 
              borderRadius: "16px", 
              padding: "24px 30px",
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "20px",
              boxShadow: "0 10px 25px -5px rgba(92, 45, 145, 0.3)"
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span 
                  style={{ 
                    background: currentSvc.status === "Pending" ? "#fef08a" : "#dcfce7", 
                    color: currentSvc.status === "Pending" ? "#854d0e" : "#166534", 
                    padding: "4px 10px", 
                    borderRadius: "6px", 
                    fontSize: "11px", 
                    fontWeight: "800",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase"
                  }}
                >
                  {currentSvc.status}
                </span>
                <span 
                  style={{ 
                    background: "rgba(255, 255, 255, 0.15)", 
                    color: "#ffffff", 
                    padding: "4px 10px", 
                    borderRadius: "6px", 
                    fontSize: "11px", 
                    fontWeight: "700" 
                  }}
                >
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
              <button
                onClick={() => router.push("/admin/mock/services-all")}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  padding: "10px 16px",
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
              <button
                onClick={() => router.push("/admin/mock/services-add")}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s"
                }}
              >
                <i className="fas fa-plus"></i>
                <span>New</span>
              </button>
              <button
                onClick={() => router.push("/admin/mock/services-add")}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s"
                }}
              >
                <i className="fas fa-plus-circle"></i>
                <span>Add Another</span>
              </button>
              <button
                onClick={() => showToast("Service Voucher (SV) printed/sent!", "success")}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s"
                }}
              >
                <i className="fas fa-file-invoice"></i>
                <span>Service Voucher (SV)</span>
              </button>
              <button
                onClick={() => setEditingService(currentSvc)}
                style={{
                  background: "#ffffff",
                  color: "#5c2d91",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  transition: "all 0.2s"
                }}
              >
                <i className="fas fa-pencil"></i>
                <span>Edit</span>
              </button>
              <button
                onClick={handleDeleteClick}
                style={{
                  background: "rgba(220, 53, 69, 0.1)",
                  color: "#f87171",
                  border: "1px solid rgba(220, 53, 69, 0.2)",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s"
                }}
              >
                <i className="fas fa-trash"></i>
                <span>Delete</span>
              </button>
              <button
                onClick={handleCompleteAndCopy}
                style={{
                  background: "#22c55e",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 10px rgba(34, 197, 94, 0.3)",
                  transition: "all 0.2s"
                }}
              >
                <i className="fas fa-check-double"></i>
                <span>Complete & Copy Alert</span>
              </button>
            </div>
          </div>

          {/* Two-Column Grid layout */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "25px", alignItems: "start" }}>
            
            {/* Left Card: Customer Information */}
            <div 
              style={{ 
                background: "#ffffff", 
                border: "1px solid #e2e8f0", 
                borderRadius: "16px", 
                padding: "24px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                gap: "20px"
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0, paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
                Customer Information
              </h3>
              
              {/* Profile Avatar Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <div 
                  style={{ 
                    width: "55px", 
                    height: "55px", 
                    borderRadius: "50%", 
                    background: "#e0f2fe", 
                    color: "#0284c7", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    fontSize: "22px" 
                  }}
                >
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

              {/* Detail fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", borderTop: "1px solid #f1f5f9", paddingTop: "15px" }}>
                
                {/* Associated Corporate Company */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600" }}>Associated Corporate Company:</span>
                  <a 
                    onClick={() => router.push("/admin/mock/companies")}
                    style={{ 
                      fontSize: "14px", 
                      color: "#16a34a", 
                      fontWeight: "700", 
                      cursor: "pointer", 
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <i className="fas fa-building" style={{ fontSize: "12px" }}></i>
                    {mockCustomer.company} ({mockCustomer.companyId})
                  </a>
                </div>

                {/* Primary Phone Numbers with Copy Buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600" }}>Official Contact Numbers:</span>
                  {mockCustomer.phones.map((phone, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "14px", color: "#1e293b", fontWeight: "600" }}>
                        <i className="fas fa-phone-volume" style={{ color: "#64748b", marginRight: "8px", fontSize: "12px" }}></i>
                        {phone}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(phone);
                          showToast(`Copied number: ${phone}`, "success");
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#94a3b8",
                          padding: "2px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "4px",
                          transition: "all 0.2s"
                        }}
                        title="Copy phone number"
                      >
                        <i className="fas fa-copy" style={{ fontSize: "12px" }}></i>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Email Address */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600" }}>Email Address:</span>
                  <span style={{ fontSize: "14px", color: "#1e293b", fontWeight: "600" }}>
                    <i className="fas fa-envelope" style={{ color: "#64748b", marginRight: "8px", fontSize: "12px" }}></i>
                    {mockCustomer.email}
                  </span>
                </div>
              </div>

              {/* Metadata log cards */}
              <div 
                style={{ 
                  background: "#f8fafc", 
                  borderRadius: "10px", 
                  padding: "15px", 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "10px",
                  border: "1px solid #f1f5f9"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                  <i className="fas fa-user" style={{ color: "#94a3b8", width: "16px" }}></i>
                  <span style={{ color: "#64748b", fontWeight: "600" }}>Entry By:</span>
                  <span style={{ color: "#1e293b", fontWeight: "700" }}>{mockCustomer.meta.entryBy}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                  <i className="fas fa-calendar" style={{ color: "#94a3b8", width: "16px" }}></i>
                  <span style={{ color: "#64748b", fontWeight: "600" }}>Entry Date:</span>
                  <span style={{ color: "#1e293b", fontWeight: "700" }}>{mockCustomer.meta.entryDate}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "8px" }}>
                  <i className="fas fa-user-pen" style={{ color: "#94a3b8", width: "16px" }}></i>
                  <span style={{ color: "#64748b", fontWeight: "600" }}>Last Edited:</span>
                  <span style={{ color: "#1e293b", fontWeight: "700" }}>{mockCustomer.meta.editedBy}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                  <i className="fas fa-clock" style={{ color: "#94a3b8", width: "16px" }}></i>
                  <span style={{ color: "#64748b", fontWeight: "600" }}>Last Edited Date:</span>
                  <span style={{ color: "#1e293b", fontWeight: "700" }}>{mockCustomer.meta.editedDate}</span>
                </div>
              </div>

              {/* View Customer Profile Button */}
              <button
                onClick={() => router.push(`/admin/mock/customers-view?id=${mockCustomer.rawId || mockCustomer.id}`)}
                style={{
                  background: "#6d28d9",
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
                  transition: "all 0.2s",
                  boxShadow: "0 4px 6px rgba(109, 40, 217, 0.2)"
                }}
              >
                <i className="fas fa-user-circle"></i>
                <span>VIEW CUSTOMER PROFILE</span>
              </button>
            </div>

            {/* Right Column: Service Inclusions, Remarks & Dispatch */}
            <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
              
              {/* Core Details and Remarks */}
              <div 
                style={{ 
                  background: "#ffffff", 
                  border: "1px solid #e2e8f0", 
                  borderRadius: "16px", 
                  padding: "24px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
                }}
              >
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0, paddingBottom: "12px", borderBottom: "1px solid #f1f5f9", marginBottom: "20px" }}>
                  Service Information Details
                </h3>

                {/* Financial Summary & Core Meta Row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
                  <div style={{ background: "#f0fdf4", padding: "15px", borderRadius: "10px", borderLeft: "4px solid #16a34a" }}>
                    <span style={{ fontSize: "11px", color: "#166534", fontWeight: "700", textTransform: "uppercase" }}>Service Price</span>
                    <span style={{ fontSize: "20px", color: "#16a34a", fontWeight: "800", display: "block", marginTop: "4px" }}>
                      SAR {Number(currentSvc.basePrice).toFixed(2)}
                    </span>
                  </div>
                  <div style={{ background: "#eff6ff", padding: "15px", borderRadius: "10px", borderLeft: "4px solid #2563eb" }}>
                    <span style={{ fontSize: "11px", color: "#1e40af", fontWeight: "700", textTransform: "uppercase" }}>Cash Paid (Driver)</span>
                    <span style={{ fontSize: "20px", color: "#2563eb", fontWeight: "800", display: "block", marginTop: "4px" }}>
                      SAR {Number(currentSvc.driverCash || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Date, Time, Location Row */}
                <div 
                  style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(3, 1fr)", 
                    gap: "15px", 
                    borderBottom: "1px solid #f1f5f9", 
                    paddingBottom: "18px", 
                    marginBottom: "18px" 
                  }}
                >
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <i className="fas fa-calendar-day" style={{ color: "#7c3aed", fontSize: "16px" }}></i>
                    <div>
                      <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "600", display: "block" }}>SERVICE DATE</span>
                      <span style={{ fontSize: "13px", color: "#1e293b", fontWeight: "700" }}>
                        {currentSvc.date ? formatDateForDisplay(currentSvc.date) : (currentSvc.created_at ? new Date(currentSvc.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "N/A")}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <i className="fas fa-clock" style={{ color: "#7c3aed", fontSize: "16px" }}></i>
                    <div>
                      <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "600", display: "block" }}>SERVICE TIME</span>
                      <span style={{ fontSize: "13px", color: "#1e293b", fontWeight: "700" }}>
                        {currentSvc.time ? formatTimeForDisplay(currentSvc.time) : (currentSvc.created_at ? new Date(currentSvc.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "N/A")}
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

                {/* Remarks & Notes */}
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                      <i className="fas fa-comment-dots" style={{ color: "#cbd5e1" }}></i> External Remarks:
                    </span>
                    <span style={{ fontSize: "14px", color: "#475569", fontWeight: "500", lineHeight: "1.5" }}>
                      No external remarks.
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", borderTop: "1px dashed #e2e8f0", paddingTop: "12px" }}>
                    <span style={{ fontSize: "12px", color: "#f87171", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                      <i className="fas fa-lock" style={{ color: "#fca5a5" }}></i> Internal Remarks (Admin Only):
                    </span>
                    <span style={{ fontSize: "14px", color: "#475569", fontWeight: "500", lineHeight: "1.5" }}>
                      No internal remarks.
                    </span>
                  </div>
                </div>

              </div>

              {/* Service Dispatch and Whatsapp Template Card */}
              <div 
                style={{ 
                  background: "#ffffff", 
                  border: "1px solid #e2e8f0", 
                  borderRadius: "16px", 
                  padding: "24px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
                }}
              >
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0, paddingBottom: "12px", borderBottom: "1px solid #f1f5f9", marginBottom: "20px" }}>
                  Service Dispatch & Reminders
                </h3>

                {/* Interactive State Tabs */}
                <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", borderRadius: "10px", padding: "4px", marginBottom: "20px" }}>
                  <button
                    onClick={() => {
                      setActiveSrvTab("Dispatch Details");
                      handleTabChange("Dispatch Details");
                    }}
                    style={{
                      flex: 1,
                      background: activeSrvTab === "Dispatch Details" ? "#22c55e" : "transparent",
                      color: activeSrvTab === "Dispatch Details" ? "#ffffff" : "#475569",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "12px",
                      fontWeight: activeSrvTab === "Dispatch Details" ? "700" : "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <i className="fas fa-paper-plane"></i>
                    <span>Dispatch Details</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveSrvTab("Service Started");
                      handleTabChange("Service Started");
                    }}
                    style={{
                      flex: 1,
                      background: activeSrvTab === "Service Started" ? "#3b82f6" : "transparent",
                      color: activeSrvTab === "Service Started" ? "#ffffff" : "#475569",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "12px",
                      fontWeight: activeSrvTab === "Service Started" ? "700" : "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <i className="fas fa-play"></i>
                    <span>Service Started</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveSrvTab("Service Completed");
                      handleTabChange("Service Completed");
                    }}
                    style={{
                      flex: 1,
                      background: activeSrvTab === "Service Completed" ? "#16a34a" : "transparent",
                      color: activeSrvTab === "Service Completed" ? "#ffffff" : "#475569",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "12px",
                      fontWeight: activeSrvTab === "Service Completed" ? "700" : "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <i className="fas fa-check"></i>
                    <span>Service Completed</span>
                  </button>
                </div>

                {/* Whatsapp Text formatted dispatch details */}
                <div style={{ position: "relative" }}>
                  <pre 
                    style={{ 
                      background: "#f8fafc", 
                      border: "1px solid #cbd5e1", 
                      borderRadius: "10px", 
                      padding: "15px", 
                      fontFamily: "monospace", 
                      fontSize: "12px", 
                      lineHeight: "1.6",
                      color: "#334155",
                      whiteSpace: "pre-wrap",
                      margin: 0
                    }}
                  >
                    {getActiveMessage()}
                  </pre>
                </div>

                {/* Copy WhatsApp Dispatch Details Button */}
                <button
                  onClick={handleCopyText}
                  style={{
                    background: activeSrvTab === "Service Started" ? "#3b82f6" : activeSrvTab === "Service Completed" ? "#16a34a" : "#22c55e",
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
                    boxShadow: activeSrvTab === "Service Started" ? "0 4px 6px rgba(59, 130, 246, 0.2)" : activeSrvTab === "Service Completed" ? "0 4px 6px rgba(22, 163, 74, 0.2)" : "0 4px 6px rgba(34, 197, 94, 0.2)",
                    transition: "all 0.2s"
                  }}
                >
                  <i className="fas fa-copy"></i>
                  <span>
                    {activeSrvTab === "Service Started" ? "Copy Started Notification" : activeSrvTab === "Service Completed" ? "Copy Completion Details" : "Copy Dispatch Details"}
                  </span>
                </button>
              </div>

            </div>
          </div>

          {/* Spanned Activity Trail Card */}
          <div 
            style={{ 
              background: "#ffffff", 
              border: "1px solid #e2e8f0", 
              borderRadius: "16px", 
              padding: "24px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0, paddingBottom: "12px", borderBottom: "1px solid #f1f5f9", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="fas fa-history" style={{ color: "#7c3aed" }}></i>
              <span>Audit Trail & Activity History</span>
            </h3>
            
            <div className="table-responsive">
              <table className="db-table" style={{ width: "100%" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", padding: "12px 15px" }}>DATETIME</th>
                    <th style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", padding: "12px 15px" }}>ACTION BY</th>
                    <th style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", padding: "12px 15px" }}>REMARK</th>
                  </tr>
                </thead>
                <tbody>
                  {auditTrail.map((trail, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ fontSize: "13px", color: "#475569", padding: "12px 15px", fontWeight: "500" }}>{trail.dateTime}</td>
                      <td style={{ fontSize: "13px", color: "#1e293b", padding: "12px 15px", fontWeight: "700" }}>
                        <span className="status-pill active" style={{ background: "#f1f5f9", color: "#334155", display: "inline-flex", padding: "3px 8px" }}>
                          {trail.actionBy}
                        </span>
                      </td>
                      <td style={{ fontSize: "13px", color: "#475569", padding: "12px 15px", fontWeight: "500" }}>{trail.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer inside page block */}
          <div 
            style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              borderTop: "1px solid #e2e8f0", 
              paddingTop: "15px",
              marginTop: "10px",
              fontSize: "12px", 
              color: "#94a3b8",
              fontWeight: "600"
            }}
          >
            <span>© 2026 Umrah Cab. All Rights Reserved.</span>
            <span>v2.0</span>
          </div>

        </div>
      );
    }

    // 20. ADD NEW SERVICE FORM
    if (slug === "services-add") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" }}>
            <div>
              <h2>Register Auxiliary Service</h2>
              <p>Add a new auxiliary service category with standard default pricing.</p>
            </div>
            <button onClick={() => router.push("/admin/mock/services-all")} className="form-btn-back">
              <i className="fas fa-arrow-left"></i>
              <span>Back to Catalog</span>
            </button>
          </div>

          <div className="form-card">
            <form onSubmit={handleAddService} className="form-grid">
              {/* Search Customer Dropdown */}
              <div className="form-group-full" style={{ position: "relative" }}>
                <label className="form-label">Search Customer *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-user form-icon" style={{ zIndex: 10 }}></i>
                  <div
                    className="form-input"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      background: "#fff",
                      minHeight: "45px",
                      paddingLeft: "45px",
                      paddingRight: "15px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px"
                    }}
                    onClick={() => setSrvCustomerIsOpen(!srvCustomerIsOpen)}
                  >
                    <span style={{ color: srvSelectedCustomerObj ? "#0f172a" : "#94a3b8", fontWeight: srvSelectedCustomerObj ? "600" : "400" }}>
                      {srvSelectedCustomerObj 
                        ? `${srvSelectedCustomerObj.name} (${srvSelectedCustomerObj.company} - ${srvSelectedCustomerObj.custom_id || `#CST-${srvSelectedCustomerObj.id}`})`
                        : "Search and select a customer..."}
                    </span>
                    <i className={`fas fa-chevron-${srvCustomerIsOpen ? "up" : "down"}`} style={{ color: "#94a3b8", fontSize: "12px" }}></i>
                  </div>
                </div>

                {srvCustomerIsOpen && (
                  <div
                    className="dropdown-panel"
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "#fff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                      zIndex: 100,
                      marginTop: "5px",
                      padding: "10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px"
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "14px" }}></i>
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: "35px", height: "38px" }}
                        placeholder="Type name, company, ID to search..."
                        value={srvCustomerSearch}
                        onChange={(e) => setSrvCustomerSearch(e.target.value)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div
                      style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}
                      onScroll={(e) => {
                        const target = e.currentTarget;
                        if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
                          if (!srvLoadingCustomers && srvCustomerHasMore) {
                            setSrvCustomerPage((prev) => prev + 1);
                          }
                        }
                      }}
                    >
                      {srvLoadingCustomers && srvCustomersList.length === 0 ? (
                        <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                          <i className="fas fa-spinner fa-spin" style={{ marginRight: "6px" }}></i> Loading customers...
                        </div>
                      ) : srvCustomersList.length === 0 ? (
                        <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                          No customers found matching "{srvCustomerSearch}"
                        </div>
                      ) : (
                        <>
                          {srvCustomersList.map((c) => (
                            <div
                              key={c.id}
                              style={{
                                padding: "8px 12px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                background: srvSelectedCustomerObj && String(c.id) === String(srvSelectedCustomerObj.id) ? "#f1f5f9" : "transparent",
                                color: "#1e293b",
                                fontSize: "13px",
                                fontWeight: "500"
                              }}
                              onClick={() => {
                                setSrvSelectedCustomerObj(c);
                                setSrvCustomerIsOpen(false);
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                              onMouseLeave={(e) => e.currentTarget.style.background = srvSelectedCustomerObj && String(c.id) === String(srvSelectedCustomerObj.id) ? "#f1f5f9" : "transparent"}
                            >
                              <div style={{ fontWeight: "700" }}>{c.name}</div>
                              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                {c.company} • {c.custom_id || `#CST-${c.id}`} • {c.contact}
                              </div>
                            </div>
                          ))}
                          {srvLoadingCustomers && (
                            <div style={{ padding: "8px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                              <i className="fas fa-spinner fa-spin"></i> Loading more...
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Service Description Search Selector */}
              <div style={{ position: "relative", marginBottom: "15px" }} className="form-group-full">
                <label className="form-label">Service Description *</label>
                <div 
                  className="form-input-wrapper"
                  onClick={() => setSrvCatalogIsOpen(!srvCatalogIsOpen)}
                  style={{ cursor: "pointer" }}
                >
                  <i className="fas fa-hand-holding-hand form-icon"></i>
                  <div className="form-input" style={{ display: "flex", alignItems: "center", background: "#ffffff", height: "46px" }}>
                    {srvSelectedCatalogObj ? (
                      <span style={{ color: "#1e293b", fontWeight: "600" }}>
                        {srvSelectedCatalogObj.name} {srvSelectedCatalogObj.base_price > 0 ? `(SR ${srvSelectedCatalogObj.base_price})` : ""}
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>Choose a service...</span>
                    )}
                  </div>
                  <i className="fas fa-chevron-down select-arrow" style={{ pointerEvents: "none" }}></i>
                </div>

                {srvCatalogIsOpen && (
                  <div 
                    className="dropdown-menu"
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
                      zIndex: 99,
                      marginTop: "5px",
                      padding: "10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px"
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "14px" }}></i>
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: "35px", height: "38px" }}
                        placeholder="Search service description..."
                        value={srvCatalogSearch}
                        onChange={(e) => setSrvCatalogSearch(e.target.value)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div
                      style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}
                      onScroll={(e) => {
                        const target = e.currentTarget;
                        if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
                          if (!srvLoadingCatalog && srvCatalogHasMore) {
                            setSrvCatalogPage((prev) => prev + 1);
                          }
                        }
                      }}
                    >
                      {srvLoadingCatalog && srvCatalogList.length === 0 ? (
                        <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                          <i className="fas fa-spinner fa-spin" style={{ marginRight: "6px" }}></i> Loading services...
                        </div>
                      ) : srvCatalogList.length === 0 ? (
                        <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                          No matching services found
                        </div>
                      ) : (
                        <>
                          {srvCatalogList.map((item) => (
                            <div
                              key={item.id}
                              style={{
                                padding: "10px 12px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                background: srvSelectedCatalogObj && String(item.id) === String(srvSelectedCatalogObj.id) ? "#f1f5f9" : "transparent",
                                color: "#1e293b",
                                fontSize: "13px",
                                fontWeight: "500",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSrvSelectedCatalogObj(item);
                                setSrvName(item.name);
                                setSrvPrice(item.base_price ? String(item.base_price) : "0");
                                setSrvType(item.type || "Catalogue");
                                setSrvCatalogIsOpen(false);
                                setSrvCatalogSearch(""); 
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                              onMouseLeave={(e) => e.currentTarget.style.background = srvSelectedCatalogObj && String(item.id) === String(srvSelectedCatalogObj.id) ? "#f1f5f9" : "transparent"}
                            >
                              <div style={{ fontWeight: "700" }}>{item.name}</div>
                              {item.base_price > 0 && (
                                <span style={{ fontSize: "11px", background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "10px", fontWeight: "600" }}>
                                  SR {item.base_price}
                                </span>
                              )}
                            </div>
                          ))}
                          {srvLoadingCatalog && (
                            <div style={{ padding: "8px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                              <i className="fas fa-spinner fa-spin"></i> Loading more...
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Pickup Location */}
              <div>
                <label className="form-label">Pickup Location</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-map-marker-alt form-icon"></i>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Type or select location..."
                    value={srvPickupLocation}
                    onChange={(e) => setSrvPickupLocation(e.target.value)}
                  />
                </div>
              </div>

              {/* Service Status */}
              <div>
                <label className="form-label">Service Status *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-chart-line form-icon"></i>
                  <select
                    className="form-input form-select"
                    value={srvStatus}
                    onChange={(e) => setSrvStatus(e.target.value)}
                    required
                  >
                    <option value="Pending">Pending</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <i className="fas fa-chevron-down select-arrow"></i>
                </div>
              </div>

              {/* Service Cost (Base) */}
              <div>
                <label className="form-label">Service Cost (Base)</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-tags form-icon"></i>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="0.00"
                    value={srvPrice}
                    onChange={(e) => setSrvPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Cash to Receive (Driver) */}
              <div>
                <label className="form-label">Cash to Receive (Driver)</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-hand-holding-dollar form-icon"></i>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="0.00"
                    value={srvDriverCash}
                    onChange={(e) => setSrvDriverCash(e.target.value)}
                  />
                </div>
              </div>

              {/* Service Date */}
              <div>
                <label className="form-label">Service Date *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-calendar-alt form-icon"></i>
                  <input
                    type="date"
                    className="form-input"
                    value={srvDate}
                    onChange={(e) => setSrvDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Service Time */}
              <div>
                <label className="form-label">Service Time</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-clock form-icon"></i>
                  <input
                    type="time"
                    className="form-input"
                    value={srvTime}
                    onChange={(e) => setSrvTime(e.target.value)}
                  />
                </div>
              </div>

              {/* External Remarks */}
              <div className="form-group-full">
                <label className="form-label">External Remarks</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-comment-dots form-icon" style={{ top: "16px", transform: "none" }}></i>
                  <textarea
                    className="form-input form-textarea"
                    placeholder="Customer/Driver remarks..."
                    value={srvRemarks}
                    onChange={(e) => setSrvRemarks(e.target.value)}
                  ></textarea>
                </div>
              </div>

              {/* Submit Button */}
              <div className="form-group-full form-submit-row" style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
                <button
                  type="submit"
                  className="btn-submit"
                  style={{
                    width: "100%",
                    maxWidth: "500px",
                    background: "#1e293b",
                    color: "#ffffff",
                    fontWeight: "600",
                    height: "48px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
                    cursor: "pointer",
                    border: "none",
                    fontSize: "15px"
                  }}
                >
                  <i className="fas fa-save"></i>
                  <span>Save Additional Service</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    // 21. AGENT FOLLOW-UPS
    if (slug === "agent-followups") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)" }}>
            <div>
              <h2>Agent & Broker Follow-ups</h2>
              <p>Keep track of pending calls, voucher delivery confirmations, and client feedback requests.</p>
            </div>
            <button onClick={() => setShowFollowupModal(true)} className="form-btn-back">
              <i className="fas fa-plus"></i>
              <span>New Follow-up Task</span>
            </button>
          </div>

          <div className="table-card" style={{ padding: "25px" }}>
            <div className="table-responsive">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Task ID</th>
                    <th>Subject</th>
                    <th>Assigned Agent</th>
                    <th>Phone / Contact</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {followups.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                        No followup records found in the database.
                      </td>
                    </tr>
                  ) : followups.map((f) => (
                    <tr key={f.id}>
                      <td style={{ fontWeight: 700 }}>{f.id}</td>
                      <td style={{ fontWeight: 600 }}>{f.title}</td>
                      <td>{f.agent}</td>
                      <td>{f.contact}</td>
                      <td>{f.date}</td>
                      <td>
                        <span className={`status-pill ${f.status === "Pending" ? "pending" : "completed"}`}>{f.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* New Followup Modal */}
          {showFollowupModal && (
            <div style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 23, 42, 0.6)",
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
                width: "100%",
                maxWidth: "500px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                overflow: "hidden",
                border: "1px solid #e2e8f0"
              }}>
                <div style={{
                  background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
                  padding: "20px",
                  color: "#ffffff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Log New Follow-up Task</h3>
                  <button onClick={() => setShowFollowupModal(false)} style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer", fontSize: "18px" }}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <form onSubmit={handleAddFollowup} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "5px" }}>Subject / Title *</label>
                    <input type="text" className="form-input" style={{ width: "100%" }} required placeholder="e.g. Confirm pickup timing" value={flpTitle} onChange={(e) => setFlpTitle(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "5px" }}>Contact Phone *</label>
                    <input type="text" className="form-input" style={{ width: "100%" }} required placeholder="e.g. 050123456" value={flpContact} onChange={(e) => setFlpContact(e.target.value)} />
                  </div>
                  <div style={{ display: "flex", gap: "15px" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "5px" }}>Assigned Agent</label>
                      <input type="text" className="form-input" style={{ width: "100%" }} value={flpAgent} onChange={(e) => setFlpAgent(e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "5px" }}>Due Date</label>
                      <input type="date" className="form-input" style={{ width: "100%" }} value={flpDate} onChange={(e) => setFlpDate(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "5px" }}>Additional Remarks</label>
                    <textarea className="form-input form-textarea" style={{ width: "100%", height: "80px" }} placeholder="Provide extra detail..." value={flpNotes} onChange={(e) => setFlpNotes(e.target.value)}></textarea>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                    <button type="button" onClick={() => setShowFollowupModal(false)} className="form-btn-back" style={{ background: "#f1f5f9", color: "#475569" }}>Cancel</button>
                    <button type="submit" className="btn-submit" style={{ padding: "10px 20px" }}>Save Task</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 22. CREATE INVOICES FORM
    if (slug === "invoices-add") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)" }}>
            <div>
              <h2>Generate PDF Invoice</h2>
              <p>Generate a new invoice against completed transportation vouchers.</p>
            </div>
            <button onClick={() => router.push("/admin/mock/invoices")} className="form-btn-back">
              <i className="fas fa-arrow-left"></i>
              <span>Back to Invoices</span>
            </button>
          </div>

          <div className="form-card">
            <form onSubmit={(e) => { e.preventDefault(); showToast("Invoice generated and sent to email!", "success"); router.push("/admin/mock/invoices"); }} className="form-grid">
              <div>
                <label className="form-label">Bill To Customer *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-building form-icon"></i>
                  <select className="form-input form-select" required>
                    <option value="">Select corporate customer...</option>
                    <option value="Zahid Travels">Zahid Travels</option>
                    <option value="Al-Latif Group">Al-Latif Group</option>
                  </select>
                  <i className="fas fa-chevron-down select-arrow"></i>
                </div>
              </div>

              <div>
                <label className="form-label">Booking Reference Mapping *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-receipt form-icon"></i>
                  <input type="text" className="form-input" placeholder="e.g. UCB-8736..." required />
                </div>
              </div>

              <div>
                <label className="form-label">Invoice Base Amount *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-coins form-icon"></i>
                  <input type="number" className="form-input" placeholder="0.00" required />
                </div>
              </div>

              <div>
                <label className="form-label">Default Tax Options</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-percent form-icon"></i>
                  <select className="form-input form-select">
                    <option value="15">VAT 15% (Saudi Standard)</option>
                    <option value="0">Zero Tax Rate</option>
                  </select>
                  <i className="fas fa-chevron-down select-arrow"></i>
                </div>
              </div>

              <div className="form-group-full form-submit-row">
                <button type="submit" className="btn-submit">Generate PDF Invoice</button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    // 23. REGISTER LEDGER ENTRY FORM
    if (slug === "ledgers-add") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)" }}>
            <div>
              <h2>Create Ledger Entry</h2>
              <p>Add manual ledger adjustments or cash balance offsets.</p>
            </div>
            <button onClick={() => router.push("/admin/mock/ledgers")} className="form-btn-back">
              <i className="fas fa-arrow-left"></i>
              <span>Back to Ledger</span>
            </button>
          </div>

          <div className="form-card">
            <form onSubmit={(e) => { e.preventDefault(); showToast("Ledger adjustment posted!", "success"); router.push("/admin/mock/ledgers"); }} className="form-grid">
              <div>
                <label className="form-label">Target Corporate Account *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-building form-icon"></i>
                  <select className="form-input form-select" required>
                    <option value="">Select associated account...</option>
                    <option value="Zahid Travels">Zahid Travels</option>
                    <option value="Al-Latif Group">Al-Latif Group</option>
                  </select>
                  <i className="fas fa-chevron-down select-arrow"></i>
                </div>
              </div>

              <div>
                <label className="form-label">Entry Type Mapping *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-arrows-spin form-icon"></i>
                  <select className="form-input form-select" required>
                    <option value="Debit">Debit (Dr) - Reduction</option>
                    <option value="Credit">Credit (Cr) - Addition</option>
                  </select>
                  <i className="fas fa-chevron-down select-arrow"></i>
                </div>
              </div>

              <div>
                <label className="form-label">Amount (SR) *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-coins form-icon"></i>
                  <input type="number" className="form-input" placeholder="0.00" required />
                </div>
              </div>

              <div>
                <label className="form-label">Adjustment Narrative *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-comment form-icon"></i>
                  <input type="text" className="form-input" placeholder="Narrative notes..." required />
                </div>
              </div>

              <div className="form-group-full form-submit-row">
                <button type="submit" className="btn-submit">Post Ledger Entry</button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    // 24. COMPANY/AGENT PERFORMANCE ANALYTICS
    if (slug === "performance") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)" }}>
            <div>
              <h2>Corporate Performance Analytics</h2>
              <p>Gain insights on total bookings count, branch volumes, and sales metrics.</p>
            </div>
            <button onClick={() => router.push("/admin/hub")} className="form-btn-back">
              <i className="fas fa-arrow-left"></i>
              <span>Back to Hub</span>
            </button>
          </div>

          <div className="form-card">
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#333", marginBottom: "20px" }}>Branch Sales Performance Volumes</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {[
                { name: "Zahid Travels (Jeddah Office)", val: "SR 42,500.00", pct: 75 },
                { name: "Al-Latif Group (Makkah Office)", val: "SR 18,900.00", pct: 35 },
                { name: "Standard Agency Brokerage", val: "SR 8,400.00", pct: 15 }
              ].map((perf, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>
                    <span>{perf.name}</span>
                    <span style={{ color: "var(--primary-color)" }}>{perf.val}</span>
                  </div>
                  <div style={{ width: "100%", background: "#f1f5f9", height: "12px", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ width: `${perf.pct}%`, background: "linear-gradient(90deg, #1f6f8b 0%, #0ea5e9 100%)", height: "100%" }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 25. DOCUMENT SCANNER
    if (slug === "scanner") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #090d16 0%, #1e293b 100%)" }}>
            <div>
              <h2>Pilgrim Visa / Passport Document Scanner</h2>
              <p>Simulate document optical scanning. Use this to auto-populate pilgrim bookings.</p>
            </div>
            <button onClick={() => router.push("/admin/hub")} className="form-btn-back">
              <i className="fas fa-arrow-left"></i>
              <span>Back to Hub</span>
            </button>
          </div>

          <div className="form-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", padding: "40px 20px" }}>
            <div style={{ width: "280px", height: "180px", border: "3px dashed #64748b", borderRadius: "12px", position: "relative", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <div style={{ position: "absolute", width: "100%", height: "2px", background: "rgba(34, 197, 94, 0.6)", top: "50%", animation: "scanLine 2s infinite linear" }}></div>
              <i className="fas fa-passport" style={{ fontSize: "3rem", color: "#334155" }}></i>
              <style>{`
                @keyframes scanLine {
                  0% { top: 0%; }
                  50% { top: 100%; }
                  100% { top: 0%; }
                }
              `}</style>
            </div>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#64748b" }}>Align Passport MRZ Zone inside scanner framework</h3>
            <button
              onClick={() => {
                showToast("Scanning Document MRZ Data...", "success");
                setTimeout(() => {
                  showToast("Scan Success! Pilgrim: AMJAD ALI, Passport: EJ9843829", "success");
                }, 1500);
              }}
              className="btn-submit"
            >
              Simulate Scan Capture
            </button>
          </div>
        </div>
      );
    }

    // 26. SHORTCUTS & CONFIG KEYBOARD (From Sidebar)
    if (slug === "shortcuts") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)" }}>
            <div>
              <h2>Keyboard Accessibility Shortcuts</h2>
              <p>Configure quick-access hotkeys to navigate the portal without clicking.</p>
            </div>
            <button onClick={() => router.push("/admin/hub")} className="form-btn-back">
              <i className="fas fa-arrow-left"></i>
              <span>Back to Hub</span>
            </button>
          </div>

          <div className="form-card">
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#333", marginBottom: "15px" }}>Active Portal Shortcuts</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { keys: "Alt + H", action: "Navigate directly to Central Hub" },
                { keys: "Alt + B", action: "Create new transport booking" },
                { keys: "Alt + C", action: "Open customers registry" },
                { keys: "Alt + E", action: "Unlock Advanced Utilities panel" }
              ].map((sc, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "#f8fafc", borderRadius: "6px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "600" }}>{sc.action}</span>
                  <span style={{ background: "#e2e8f0", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace", fontWeight: "700", border: "1px solid #cbd5e1" }}>{sc.keys}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 27. PACKAGE MANAGEMENT ROUTE PACKAGES (From Extras)
    if (slug === "package-management") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #065f46 0%, #059669 100%)" }}>
            <div>
              <h2>Route Trip Packages</h2>
              <p>Setup standard transportation routes, codes, and target statuses.</p>
            </div>
            <button onClick={() => router.push("/admin/extras")} className="form-btn-back">
              <i className="fas fa-arrow-left"></i>
              <span>Back to Utilities</span>
            </button>
          </div>

          <div className="table-card" style={{ padding: "25px" }}>
            <div className="table-responsive">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Route ID</th>
                    <th>English description</th>
                    <th>Urdu Mapping</th>
                    <th>Unique Code</th>
                    <th>Package Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700 }}>#PKG-01</td>
                    <td style={{ fontWeight: 600 }}>Jeddah Airport to Makkah Hotel</td>
                    <td>جدہ ایئرپورٹ سے مکہ ہوٹل</td>
                    <td><span className="status-pill active" style={{ background: "#f1f5f9", color: "#334155" }}>JED-MAK-STD</span></td>
                    <td><span className="status-pill completed">Core Route</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>#PKG-03</td>
                    <td style={{ fontWeight: 600 }}>Jeddah Airport to Madinah Hotel</td>
                    <td>جدہ ایئرپورٹ سے مدینہ ہوٹل</td>
                    <td><span className="status-pill active" style={{ background: "#f1f5f9", color: "#334155" }}>JED-MED-STD</span></td>
                    <td><span className="status-pill completed">Core Route</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // 28. ROUND TRIP DISCOUNTS (From Extras)
    if (slug === "round-trip-discounts") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #15803d 0%, #16a34a 100%)" }}>
            <div>
              <h2>Round Trip Discount Rates</h2>
              <p>Configure percentage or fixed discount offsets dynamically triggered for multi-leg bookings.</p>
            </div>
            <button onClick={() => router.push("/admin/extras")} className="form-btn-back">
              <i className="fas fa-arrow-left"></i>
              <span>Back to Utilities</span>
            </button>
          </div>

          <div className="form-card">
            <form onSubmit={(e) => { e.preventDefault(); showToast("Discount rate configuration updated!", "success"); router.push("/admin/extras"); }} className="form-grid">
              <div>
                <label className="form-label">Minimum Legs Trigger *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-arrows-spin form-icon"></i>
                  <select className="form-input form-select" required>
                    <option value="2">2 Legs (Round Trip standard)</option>
                    <option value="3">3+ Legs (Full Circuit discount)</option>
                  </select>
                  <i className="fas fa-chevron-down select-arrow"></i>
                </div>
              </div>

              <div>
                <label className="form-label">Discount Percentage (%) *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-percent form-icon"></i>
                  <input type="number" className="form-input" placeholder="e.g. 5" defaultValue="5" required />
                </div>
              </div>

              <div className="form-group-full form-submit-row">
                <button type="submit" className="btn-submit" style={{ background: "#15803d" }}>Save Discount Settings</button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    // 29. GLOBAL PERFORMANCE REPORT (From Extras)
    if (slug === "global-report") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)" }}>
            <div>
              <h2>Global Performance Report</h2>
              <p>Consolidated summary statistics and booking volume insights across all companies.</p>
            </div>
            <button onClick={() => router.push("/admin/extras")} className="form-btn-back">
              <i className="fas fa-arrow-left"></i>
              <span>Back to Utilities</span>
            </button>
          </div>

          <div className="db-stats-row">
            <div className="db-stat-card">
              <div className="db-stat-icon active"><i className="fas fa-calendar-check"></i></div>
              <div className="db-stat-info">
                <span className="db-stat-value">12 Bookings</span>
                <span className="db-stat-label">This Month</span>
              </div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-icon completed"><i className="fas fa-file-invoice-dollar"></i></div>
              <div className="db-stat-info">
                <span className="db-stat-value">SR 58,950.00</span>
                <span className="db-stat-label">Gross Value</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 30. INVOICES DIRECTORY
    if (slug === "invoices") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-header-card" style={{ background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)" }}>
            <div>
              <h2>Billing & Invoice Register</h2>
              <p>Review customer billing invoices, paid receipts, and pending accounts.</p>
            </div>
            <button onClick={() => router.push("/admin/mock/invoices-add")} className="form-btn-back">
              <i className="fas fa-plus"></i>
              <span>Create PDF Invoice</span>
            </button>
          </div>

          <div className="table-card" style={{ padding: "25px" }}>
            <div className="table-responsive">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Customer Name</th>
                    <th>Billing Date</th>
                    <th>Base Amount</th>
                    <th>Outstanding Bal</th>
                    <th>Invoice Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 700, color: "var(--primary-color)" }}>{inv.id}</td>
                      <td style={{ fontWeight: 600 }}>{inv.customer}</td>
                      <td>{inv.date}</td>
                      <td style={{ fontWeight: 700 }}>SR {inv.amount.toFixed(2)}</td>
                      <td style={{ fontWeight: 700, color: inv.balance > 0 ? "var(--danger-color)" : "var(--success-color)" }}>
                        SR {inv.balance.toFixed(2)}
                      </td>
                      <td>
                        <span className={`status-pill ${inv.status === "Paid" ? "completed" : "pending"}`}>{inv.status}</span>
                      </td>
                      <td>
                        <button title="View PDF" onClick={() => triggerExportAlert("PDF")} style={{ background: "#f0fdf4", border: "none", borderRadius: "6px", width: "30px", height: "30px", cursor: "pointer", color: "var(--success-color)", marginRight: "5px" }}>
                          <i className="fas fa-file-pdf"></i>
                        </button>
                        <button title="Mark Paid" onClick={() => showToast("Invoice marked as Paid!", "success")} style={{ background: "#f8fafc", border: "none", borderRadius: "6px", width: "30px", height: "30px", cursor: "pointer", color: "var(--primary-color)" }}>
                          <i className="fas fa-check"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // 31. CATCH-ALL ROUTE (Fallback with Construction placeholder matching design system)
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
        <div className="form-header-card" style={{ background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)" }}>
          <div>
            <h2>{slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}</h2>
            <p>This workspace is currently running in a simulated mode.</p>
          </div>
          <button onClick={() => router.push("/admin/hub")} className="form-btn-back">
            <i className="fas fa-arrow-left"></i>
            <span>Back to Hub</span>
          </button>
        </div>

        <div className="form-card" style={{ textAlign: "center", padding: "60px 40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#f1f5f9", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>
            <i className="fas fa-screwdriver-wrench"></i>
          </div>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 600, color: "#333" }}>Workspace Under Construction</h3>
          <p style={{ color: "#64748b", maxWidth: "480px", fontSize: "14px", lineHeight: 1.6 }}>
            The {slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} database and integration API are currently being migrated to the Next.js ecosystem. Real-time updates will be fully functional once backend tables are synchronized.
          </p>
          <button onClick={() => router.push("/admin/hub")} className="btn-submit" style={{ marginTop: "10px" }}>
            Return to Central Hub
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Toast notifications */}
      {toast.show && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            <i className={`fas ${toast.type === "success" ? "fa-circle-check text-success" : "fa-circle-xmark text-danger"}`}></i>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {renderDynamicContent()}

      {editingCustomer && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "500px", margin: "20px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "15px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--primary-color)" }}><i className="fas fa-user-pen"></i> Edit Customer Details</h3>
              <button onClick={() => setEditingCustomer(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>&times;</button>
            </div>
            <form onSubmit={handleUpdateCustomer} className="form-grid" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label className="form-label">Customer Name *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-user form-icon"></i>
                  <input type="text" className="form-input" value={editingCustomer.name} onChange={(e) => setEditingCustomer({...editingCustomer, name: e.target.value})} required />
                </div>
              </div>
              <div>
                <label className="form-label">Assign to Company *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-building form-icon"></i>
                  <select className="form-input form-select" value={editingCustomer.company} onChange={(e) => setEditingCustomer({...editingCustomer, company: e.target.value})} required>
                    {companies.map((com) => (
                      <option key={com.id} value={com.name}>
                        {com.name}
                      </option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down select-arrow"></i>
                </div>
              </div>
              <div>
                <label className="form-label">Contact Details *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-address-book form-icon"></i>
                  <input type="text" className="form-input" value={editingCustomer.contact} onChange={(e) => setEditingCustomer({...editingCustomer, contact: e.target.value})} required />
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "15px" }}>
                <button type="submit" className="btn-submit" style={{ flex: 1 }}>Save Changes</button>
                <button type="button" onClick={() => setEditingCustomer(null)} className="form-btn-back" style={{ flex: 1, justifyContent: "center", background: "#f1f5f9", color: "#475569" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingCompany && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "600px", margin: "20px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "15px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--success-color)" }}><i className="fas fa-building-circle-check"></i> Edit Company Profile</h3>
              <button onClick={() => setEditingCompany(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>&times;</button>
            </div>
            <form onSubmit={handleUpdateCompany} className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <label className="form-label">Company Name *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-building form-icon"></i>
                  <input type="text" className="form-input" value={editingCompany.name} onChange={(e) => setEditingCompany({...editingCompany, name: e.target.value})} required />
                </div>
              </div>
              <div>
                <label className="form-label">Official Phone</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-phone form-icon"></i>
                  <input type="text" className="form-input" value={editingCompany.phone} onChange={(e) => setEditingCompany({...editingCompany, phone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="form-label">Official Email</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-envelope form-icon"></i>
                  <input type="email" className="form-input" value={editingCompany.email} onChange={(e) => setEditingCompany({...editingCompany, email: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="form-label">Website</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-globe form-icon"></i>
                  <input type="text" className="form-input" value={editingCompany.website} onChange={(e) => setEditingCompany({...editingCompany, website: e.target.value})} />
                </div>
              </div>
              <div className="form-group-full">
                <label className="form-label">Physical Location Address</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-location-dot form-icon"></i>
                  <input type="text" className="form-input" value={editingCompany.address} onChange={(e) => setEditingCompany({...editingCompany, address: e.target.value})} />
                </div>
              </div>
              <div className="form-group-full">
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Enable Invoice Generation</span>
                    <label className="switch">
                      <input type="checkbox" checked={editingCompany.invoice} onChange={(e) => setEditingCompany({...editingCompany, invoice: e.target.checked})} />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Enable Vouchers Generation</span>
                    <label className="switch">
                      <input type="checkbox" checked={editingCompany.vouchers} onChange={(e) => setEditingCompany({...editingCompany, vouchers: e.target.checked})} />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Enable Reminders</span>
                    <label className="switch">
                      <input type="checkbox" checked={editingCompany.reminders} onChange={(e) => setEditingCompany({...editingCompany, reminders: e.target.checked})} />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="form-group-full" style={{ display: "flex", gap: "12px", marginTop: "15px" }}>
                <button type="submit" className="btn-submit" style={{ flex: 1, background: "var(--success-color)" }}>Save Changes</button>
                <button type="button" onClick={() => setEditingCompany(null)} className="form-btn-back" style={{ flex: 1, justifyContent: "center", background: "#f1f5f9", color: "#475569" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingService && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "550px", margin: "20px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "15px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--primary-color)" }}><i className="fas fa-suitcase"></i> Edit Service Details</h3>
              <button onClick={() => setEditingService(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>&times;</button>
            </div>
            
            <form onSubmit={handleUpdateService} className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div className="form-group-full">
                <label className="form-label">Service Name *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-suitcase form-icon"></i>
                  <input type="text" className="form-input" value={editingService.name} onChange={(e) => setEditingService({...editingService, name: e.target.value})} required />
                </div>
              </div>

              <div>
                <label className="form-label">Service Type *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-tags form-icon"></i>
                  <select className="form-input form-select" value={editingService.type} onChange={(e) => setEditingService({...editingService, type: e.target.value})} required>
                    <option value="Visa">Visa Processing</option>
                    <option value="Ziyarah">Ziyarah Tours</option>
                    <option value="Luggage">Luggage / Handling</option>
                    <option value="Accommodation">Accommodation Extras</option>
                    <option value="Food">Meals / Catering</option>
                    <option value="Other">Other Services</option>
                  </select>
                  <i className="fas fa-chevron-down select-arrow"></i>
                </div>
              </div>

              <div>
                <label className="form-label">Base Rate Price (SR) *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-money-bill-wave form-icon"></i>
                  <input type="number" step="0.01" className="form-input" value={editingService.basePrice} onChange={(e) => setEditingService({...editingService, basePrice: parseFloat(e.target.value) || 0})} required />
                </div>
              </div>

              <div className="form-group-full">
                <label className="form-label">Service Description</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-file-text form-icon"></i>
                  <input type="text" className="form-input" value={editingService.description || ""} onChange={(e) => setEditingService({...editingService, description: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="form-label">Pickup Location</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-map-marker-alt form-icon"></i>
                  <input type="text" className="form-input" value={editingService.pickup || ""} onChange={(e) => setEditingService({...editingService, pickup: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="form-label">Driver Cash (SAR)</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-hand-holding-dollar form-icon"></i>
                  <input type="number" step="0.01" className="form-input" value={editingService.driverCash || 0} onChange={(e) => setEditingService({...editingService, driverCash: parseFloat(e.target.value) || 0})} />
                </div>
              </div>

              <div>
                <label className="form-label">Service Date</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-calendar-alt form-icon"></i>
                  <input type="date" className="form-input" value={editingService.date || ""} onChange={(e) => setEditingService({...editingService, date: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="form-label">Service Time</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-clock form-icon"></i>
                  <input type="time" className="form-input" value={editingService.time || ""} onChange={(e) => setEditingService({...editingService, time: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="form-label">Service Status *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-info-circle form-icon"></i>
                  <select className="form-input form-select" value={editingService.status} onChange={(e) => setEditingService({...editingService, status: e.target.value})} required>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  <i className="fas fa-chevron-down select-arrow"></i>
                </div>
              </div>

              <div className="form-group-full" style={{ display: "flex", gap: "12px", marginTop: "15px" }}>
                <button type="submit" className="btn-submit" style={{ flex: 1 }}>Save Changes</button>
                <button type="button" onClick={() => setEditingService(null)} className="form-btn-back" style={{ flex: 1, justifyContent: "center", background: "#f1f5f9", color: "#475569" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingService && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "500px", margin: "20px", padding: "30px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", background: "#ffffff", borderRadius: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "15px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#7c3aed", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fas fa-eye"></i> <span>Service Details Viewer</span>
              </h3>
              <button onClick={() => setViewingService(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>&times;</button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f8fafc", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b", fontWeight: "600", fontSize: "13px" }}>Service ID:</span>
                <span style={{ color: "#1e293b", fontWeight: "700" }}>#{viewingService.customId || `ADS-${viewingService.id}`}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f8fafc", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b", fontWeight: "600", fontSize: "13px" }}>Service Name:</span>
                <span style={{ color: "#1e293b", fontWeight: "700" }}>{viewingService.name}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f8fafc", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b", fontWeight: "600", fontSize: "13px" }}>Service Type:</span>
                <span className="status-pill active" style={{ background: "#e0e7ff", color: "#4338ca", fontWeight: "700", fontSize: "11px" }}>
                  {viewingService.type}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f8fafc", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b", fontWeight: "600", fontSize: "13px" }}>Base Price (Total):</span>
                <span style={{ color: "#10b981", fontWeight: "800" }}>SAR {Number(viewingService.basePrice).toFixed(2)}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f8fafc", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b", fontWeight: "600", fontSize: "13px" }}>Driver Cash Amount:</span>
                <span style={{ color: "#0ea5e9", fontWeight: "800" }}>SAR {Number(viewingService.driverCash || 0).toFixed(2)}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f8fafc", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b", fontWeight: "600", fontSize: "13px" }}>Pickup Location:</span>
                <span style={{ color: "#1e293b", fontWeight: "700" }}>{viewingService.pickup || "N/A"}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f8fafc", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b", fontWeight: "600", fontSize: "13px" }}>Service Date:</span>
                <span style={{ color: "#1e293b", fontWeight: "700" }}>{viewingService.date || "N/A"}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f8fafc", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b", fontWeight: "600", fontSize: "13px" }}>Service Time:</span>
                <span style={{ color: "#1e293b", fontWeight: "700" }}>{viewingService.time || "N/A"}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f8fafc", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b", fontWeight: "600", fontSize: "13px" }}>Status Flag:</span>
                <span className="status-pill pending" style={{ background: "#e2e8f0", color: "#475569", fontWeight: "700", fontSize: "11px" }}>
                  {viewingService.status}
                </span>
              </div>

              <div style={{ borderBottom: "1px solid #f8fafc", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b", fontWeight: "600", fontSize: "13px", display: "block", marginBottom: "4px" }}>Description:</span>
                <span style={{ color: "#475569", fontSize: "13px", lineHeight: "1.5" }}>
                  {viewingService.description || "No service detailed description has been registered yet."}
                </span>
              </div>
            </div>

            <div style={{ marginTop: "24px", display: "flex" }}>
              <button
                type="button"
                onClick={() => setViewingService(null)}
                style={{
                  flex: 1,
                  background: "#7c3aed",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 20px",
                  fontWeight: "600",
                  cursor: "pointer",
                  textAlign: "center"
                }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {creatingCatalogItem && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "450px", margin: "20px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", background: "#ffffff", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "15px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#7c3aed", display: "flex", alignItems: "center", gap: "8px" }}><i className="fas fa-plus"></i> Add New Service Item</h3>
              <button onClick={() => { setCreatingCatalogItem(false); setCatalogItemName(""); }} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>&times;</button>
            </div>
            
            <form onSubmit={handleSaveCreateCatalogItem} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label className="form-label" style={{ fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px", display: "block" }}>Service Item Name *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-suitcase form-icon" style={{ color: "#94a3b8" }}></i>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. VIP Lounge Access" 
                    value={catalogItemName} 
                    onChange={(e) => setCatalogItemName(e.target.value)} 
                    required 
                    style={{ width: "100%", paddingLeft: "35px" }}
                  />
                </div>
              </div>

              <div className="form-group-full" style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                <button type="submit" className="btn-submit" style={{ flex: 1, background: "#7c3aed", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px", fontWeight: "600", cursor: "pointer" }}>Save Item</button>
                <button type="button" onClick={() => { setCreatingCatalogItem(false); setCatalogItemName(""); }} className="form-btn-back" style={{ flex: 1, justifyContent: "center", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", padding: "10px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingCatalogItem && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "450px", margin: "20px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", background: "#ffffff", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "15px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#7c3aed", display: "flex", alignItems: "center", gap: "8px" }}><i className="fas fa-pencil"></i> Edit Service Item</h3>
              <button onClick={() => { setEditingCatalogItem(null); setCatalogItemName(""); }} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>&times;</button>
            </div>
            
            <form onSubmit={handleSaveUpdateCatalogItem} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label className="form-label" style={{ fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px", display: "block" }}>Service Item Name *</label>
                <div className="form-input-wrapper">
                  <i className="fas fa-suitcase form-icon" style={{ color: "#94a3b8" }}></i>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. VIP Lounge Access" 
                    value={catalogItemName} 
                    onChange={(e) => setCatalogItemName(e.target.value)} 
                    required 
                    style={{ width: "100%", paddingLeft: "35px" }}
                  />
                </div>
              </div>

              <div className="form-group-full" style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                <button type="submit" className="btn-submit" style={{ flex: 1, background: "#7c3aed", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px", fontWeight: "600", cursor: "pointer" }}>Save Changes</button>
                <button type="button" onClick={() => { setEditingCatalogItem(null); setCatalogItemName(""); }} className="form-btn-back" style={{ flex: 1, justifyContent: "center", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", padding: "10px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingCompany && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
          <div className="form-card" style={{ width: "100%", maxWidth: "550px", margin: "20px", padding: "30px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", background: "#ffffff", borderRadius: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "15px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#10b981", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fas fa-building"></i> <span>Corporate Company Profile</span>
              </h3>
              <button onClick={() => setViewingCompany(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>&times;</button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f8fafc", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b", fontWeight: "600", fontSize: "13px" }}>Company ID:</span>
                <span style={{ color: "#1e293b", fontWeight: "700" }}>#{viewingCompany.id}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f8fafc", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b", fontWeight: "600", fontSize: "13px" }}>Company Name:</span>
                <span style={{ color: "#1e293b", fontWeight: "700" }}>{viewingCompany.name}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f8fafc", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b", fontWeight: "600", fontSize: "13px" }}>Official Phone:</span>
                <span style={{ color: "#1e293b", fontWeight: "700" }}>{viewingCompany.phone || "Not Registered"}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f8fafc", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b", fontWeight: "600", fontSize: "13px" }}>Official Email:</span>
                <span style={{ color: "#1e293b", fontWeight: "700" }}>{viewingCompany.email || "Not Registered"}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f8fafc", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b", fontWeight: "600", fontSize: "13px" }}>Website Address:</span>
                <span style={{ color: "#10b981", fontWeight: "700" }}>
                  {viewingCompany.website ? (
                    <a href={viewingCompany.website.startsWith("http") ? viewingCompany.website : `https://${viewingCompany.website}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "#10b981" }}>
                      {viewingCompany.website} <i className="fas fa-external-link-alt" style={{ fontSize: "10px", marginLeft: "3px" }}></i>
                    </a>
                  ) : "Not Registered"}
                </span>
              </div>

              <div style={{ borderBottom: "1px solid #f8fafc", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b", fontWeight: "600", fontSize: "13px", display: "block", marginBottom: "4px" }}>Registered Address:</span>
                <span style={{ color: "#475569", fontSize: "13px", lineHeight: "1.5" }}>
                  {viewingCompany.address || "No office address registered."}
                </span>
              </div>

              <div>
                <span style={{ color: "#64748b", fontWeight: "600", fontSize: "13px", display: "block", marginBottom: "8px" }}>Billing Settings & Preferences:</span>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <span className={`status-pill ${viewingCompany.invoice ? "completed" : "cancelled"}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "700", padding: "6px 12px" }}>
                    <i className={viewingCompany.invoice ? "fas fa-check" : "fas fa-times"}></i> Invoice: {viewingCompany.invoice ? "Enabled" : "Disabled"}
                  </span>
                  <span className={`status-pill ${viewingCompany.reminders ? "completed" : "cancelled"}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "700", padding: "6px 12px" }}>
                    <i className={viewingCompany.reminders ? "fas fa-check" : "fas fa-times"}></i> Reminders: {viewingCompany.reminders ? "Enabled" : "Disabled"}
                  </span>
                  <span className={`status-pill ${viewingCompany.vouchers ? "completed" : "cancelled"}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "700", padding: "6px 12px" }}>
                    <i className={viewingCompany.vouchers ? "fas fa-check" : "fas fa-times"}></i> Vouchers: {viewingCompany.vouchers ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "24px", display: "flex" }}>
              <button
                type="button"
                onClick={() => setViewingCompany(null)}
                style={{
                  flex: 1,
                  background: "#10b981",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 20px",
                  fontWeight: "600",
                  cursor: "pointer",
                  textAlign: "center"
                }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flight View Modal (Migrated to global scope for flights-view slug compatibility) */}
      {fltShowView && fltSelected && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.6)",
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
            width: "100%",
            maxWidth: "600px",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
            overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{
              background: "linear-gradient(135deg, #1084cc 0%, #0284c7 100%)",
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#ffffff"
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
                  Flight Logistics Details
                </h3>
                <span style={{ fontSize: "11px", opacity: 0.8 }}>
                  Record ID: {fltSelected.custom_id || `#FLT-${fltSelected.id}`}
                </span>
              </div>
              <button
                onClick={() => {
                  setFltShowView(false);
                  setFltSelected(null);
                }}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  color: "#ffffff",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px", maxHeight: "70vh", overflowY: "auto" }}>
              {/* Passenger Info Card */}
              <div style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "15px"
              }}>
                <h4 style={{ margin: "0 0 12px 0", color: "#0284c7", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <i className="fas fa-circle-user" style={{ marginRight: "6px" }}></i>
                  Passenger Details
                </h4>
                {fltSelected.customer ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
                    <div>
                      <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Full Name</span>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>{fltSelected.customer.name}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Company / Org</span>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>{fltSelected.customer.company || "Independent"}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Contact Info</span>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>{fltSelected.customer.contact || "N/A"}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Customer ID</span>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>{fltSelected.customer.custom_id || `#CST-${fltSelected.customer.id}`}</span>
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: "13px", color: "#64748b", fontStyle: "italic" }}>No passenger linked to this flight record.</span>
                )}
              </div>

              {/* Flight Info Card */}
              <div style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "15px"
              }}>
                <h4 style={{ margin: "0 0 12px 0", color: "#0284c7", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <i className="fas fa-plane" style={{ marginRight: "6px" }}></i>
                  Flight Details
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Flight Number</span>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>{fltSelected.flightNo}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Leg Type</span>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      background: fltSelected.leg === "Arrival" || fltSelected.leg === "Both Legs" ? "#e8f5e9" : "#ffebee",
                      color: fltSelected.leg === "Arrival" || fltSelected.leg === "Both Legs" ? "#2e7d32" : "#c62828",
                      borderRadius: "12px",
                      padding: "2px 8px",
                      fontSize: "11px",
                      fontWeight: "700",
                      marginTop: "2px"
                    }}>
                      {fltSelected.leg}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Scheduled Date</span>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>{formatScheduleDate(fltSelected.date)}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Scheduled Time</span>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#3b82f6" }}>
                      <i className="far fa-clock"></i> {formatTime12h(fltSelected.time)}
                    </span>
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Route Mapping</span>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>
                      <i className="fas fa-location-dot" style={{ color: "#94a3b8", marginRight: "6px" }}></i>
                      {fltSelected.route}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Tracking Status</span>
                    <span style={{
                      display: "inline-flex",
                      background: fltSelected.status === 'On Time' || fltSelected.status === 'Scheduled' || fltSelected.status === 'Completed' ? '#e0f2fe' :
                                  fltSelected.status === 'Cancelled' ? '#fee2e2' : '#fef3c7',
                      color: fltSelected.status === 'On Time' || fltSelected.status === 'Scheduled' || fltSelected.status === 'Completed' ? '#0369a1' :
                             fltSelected.status === 'Cancelled' ? '#991b1b' : '#92400e',
                      borderRadius: "12px",
                      padding: "2px 8px",
                      fontSize: "11px",
                      fontWeight: "700",
                      marginTop: "2px"
                    }}>
                      {fltSelected.status || "On Time"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              background: "#f8fafc",
              borderTop: "1px solid #e2e8f0",
              padding: "12px 20px",
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px"
            }}>
              <button
                onClick={() => {
                  setFltShowView(false);
                  setFltSelected(null);
                }}
                style={{
                  background: "#64748b",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Flight Modal (Migrated to global scope for flights-view slug compatibility) */}
      {fltShowEdit && fltSelected && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.6)",
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
            width: "100%",
            maxWidth: "600px",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
            overflow: "visible"
          }}>
            {/* Header */}
            <div style={{
              background: "linear-gradient(135deg, #1084cc 0%, #0284c7 100%)",
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#ffffff"
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
                  Edit Flight Schedule Record
                </h3>
                <span style={{ fontSize: "11px", opacity: 0.8 }}>
                  Modifying Record: {fltSelected.custom_id || `#FLT-${fltSelected.id}`}
                </span>
              </div>
              <button
                onClick={() => {
                  setFltShowEdit(false);
                  setFltSelected(null);
                }}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  color: "#ffffff",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "15px", maxHeight: "65vh", overflowY: "auto" }}>
              {/* Customer Selector */}
              <div style={{ position: "relative" }}>
                <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>
                  Select Passenger / Customer <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  background: "#f8fafc",
                  cursor: "pointer",
                  position: "relative"
                }}
                  onClick={() => setEditFltCustomerIsOpen(!editFltCustomerIsOpen)}
                >
                  <i className="fas fa-circle-user" style={{ color: "#0284c7", marginRight: "8px" }}></i>
                  <span style={{ fontSize: "13px", color: editFltCustomerName ? "#1e293b" : "#94a3b8", fontWeight: editFltCustomerName ? "600" : "400" }}>
                    {editFltCustomerName || "Search and select customer..."}
                  </span>
                  <i className="fas fa-chevron-down" style={{ marginLeft: "auto", fontSize: "12px", color: "#64748b" }}></i>
                </div>

                {editFltCustomerIsOpen && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    zIndex: 99999,
                    marginTop: "4px",
                    padding: "8px"
                  }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Type to filter..."
                      value={editFltCustomerSearch}
                      onChange={(e) => setEditFltCustomerSearch(e.target.value)}
                      style={{ marginBottom: "8px", width: "100%" }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div style={{ maxHeight: "160px", overflowY: "auto" }}>
                      {editFltLoadingCustomers && editFltCustomersList.length === 0 ? (
                        <div style={{ padding: "8px", fontSize: "12px", color: "#64748b" }}>Loading customers...</div>
                      ) : editFltCustomersList.length === 0 ? (
                        <div style={{ padding: "8px", fontSize: "12px", color: "#64748b" }}>No customers found</div>
                      ) : (
                        editFltCustomersList.map((c) => (
                          <div
                            key={c.id}
                            style={{
                              padding: "8px 12px",
                              fontSize: "12px",
                              cursor: "pointer",
                              borderRadius: "4px",
                              background: editFltCustomerId === String(c.id) ? "#eff6ff" : "transparent",
                              color: editFltCustomerId === String(c.id) ? "#0284c7" : "#1e293b",
                              fontWeight: editFltCustomerId === String(c.id) ? "600" : "400"
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditFltCustomerId(String(c.id));
                              setEditFltCustomerName(c.name);
                              setEditFltCustomerIsOpen(false);
                            }}
                            onMouseEnter={(e) => {
                              if (editFltCustomerId !== String(c.id)) {
                                e.currentTarget.style.background = "#f1f5f9";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (editFltCustomerId !== String(c.id)) {
                                e.currentTarget.style.background = "transparent";
                              }
                            }}
                          >
                            {c.name} ({c.company || "Independent"})
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>
                    Flight Number <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFltNo}
                    onChange={(e) => setEditFltNo(e.target.value)}
                    placeholder="e.g. SV-321"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>
                    Leg Type <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    className="form-input"
                    value={editFltLeg}
                    onChange={(e) => setEditFltLeg(e.target.value)}
                  >
                    <option value="Arrival">Arrival</option>
                    <option value="Departure">Departure</option>
                    <option value="Both Legs">Both Legs</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>
                    Date <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={editFltDate}
                    onChange={(e) => setEditFltDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>
                    Time <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="time"
                    className="form-input"
                    value={editFltTime}
                    onChange={(e) => setEditFltTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>
                  Route Mapping <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editFltRoute}
                  onChange={(e) => setEditFltRoute(e.target.value)}
                  placeholder="e.g. JED → MAK"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "6px", display: "block" }}>
                  Tracking Status <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  className="form-input"
                  value={editFltStatus}
                  onChange={(e) => setEditFltStatus(e.target.value)}
                >
                  <option value="On Time">On Time</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Completed">Completed</option>
                  <option value="Scheduled">Scheduled</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              background: "#f8fafc",
              borderTop: "1px solid #e2e8f0",
              padding: "12px 20px",
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px"
            }}>
              <button
                onClick={() => {
                  setFltShowEdit(false);
                  setFltSelected(null);
                }}
                style={{
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!editFltNo || !editFltDate || !editFltTime || !editFltRoute || !editFltCustomerId) {
                    showToast("Please fill all required fields", "error");
                    return;
                  }
                  try {
                    const payload = {
                      customer_id: editFltCustomerId,
                      flight_no: editFltNo,
                      leg: editFltLeg,
                      date: editFltDate,
                      time: editFltTime,
                      route: editFltRoute,
                      status: editFltStatus
                    };
                    const res = await api.updateFlight(fltSelected.id, payload);
                    if (res.success) {
                      showToast("Flight updated successfully!", "success");
                      setFltShowEdit(false);
                      setFltSelected(null);
                      // Refresh current flights list
                      if (slug === "flights-view" && queryId) {
                        const updatedRes = await api.getFlight(queryId);
                        if (updatedRes && updatedRes.flight) {
                          setSingleFlt(updatedRes.flight);
                          setSingleFltAudits(updatedRes.audits || []);
                        }
                      } else {
                        fetchFlightsList();
                      }
                    } else {
                      showToast("Failed to update flight record", "error");
                    }
                  } catch (err) {
                    console.error("Failed updating flight:", err);
                    showToast("An error occurred while saving flight details", "error");
                  }
                }}
                style={{
                  background: "#0284c7",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 20px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
