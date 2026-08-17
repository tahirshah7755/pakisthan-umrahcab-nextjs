"use client";

import React, { useState, useEffect } from "react";
import { api, getDefaultPhoneCode, formatPhoneNumber } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { CountryCodeSelector } from "@/components/CountryCodeSelector";
import TimePicker24h from "@/components/admin/TimePicker24h";
import { getSaudiTodayDate } from "@/utils/formatters";

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
  price_group?: string;
}

interface AddCustomerFormProps {
  // We make it self-contained, but retain props matching page.tsx for backward compatibility or pass empty/optional props
  companies?: CompanyItem[];
  router: any;
}

const mockHotels = [
  { id: "1", hotel_name: "Makkah Clock Royal Tower (Fairmont)", city: "Makkah" },
  { id: "2", hotel_name: "Pullman ZamZam Makkah", city: "Makkah" },
  { id: "3", hotel_name: "Swissôtel Makkah", city: "Makkah" },
  { id: "4", hotel_name: "Hilton Suites Makkah", city: "Makkah" },
  { id: "5", hotel_name: "Anjum Hotel Makkah", city: "Makkah" },
  { id: "6", hotel_name: "Oberoi Madinah", city: "Madinah" },
  { id: "7", hotel_name: "Madinah Hilton", city: "Madinah" },
  { id: "8", hotel_name: "Anwar Al Madinah Mövenpick", city: "Madinah" },
  { id: "9", hotel_name: "Pullman Zamzam Madinah", city: "Madinah" },
  { id: "10", hotel_name: "Dar Al Taqwa Hotel Madinah", city: "Madinah" },
  { id: "11", hotel_name: "Jeddah Hilton", city: "Jeddah" },
  { id: "12", hotel_name: "InterContinental Jeddah", city: "Jeddah" },
  { id: "13", hotel_name: "Sheraton Jeddah Hotel", city: "Jeddah" },
  { id: "14", hotel_name: "Rosewood Jeddah", city: "Jeddah" }
];

const predefinedRoutes = [
  "JEDDAH - MAKKAH - JEDDAH",
  "JEDDAH - MAKKAH - MADINAH - JEDDAH",
  "JEDDAH - MAKKAH - MADINAH - YANBU - JEDDAH",
  "MADINAH - MAKKAH - JEDDAH"
];

const defaultCountryCodes = [
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+92", flag: "🇵🇰", name: "Pakistan" },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+1", flag: "🇺🇸", name: "US/Canada" },
];


export const AddCustomerForm: React.FC<AddCustomerFormProps> = ({
  companies: initialCompanies,
  router,
}) => {
  const { companyUser, user } = useAuth();
  const pathname = usePathname();
  const saudiToday = getSaudiTodayDate();
  const isCompanyPanel = pathname?.startsWith("/company");

  const [activeStep, setActiveStep] = useState(1);
  const [companiesList, setCompaniesList] = useState<CompanyItem[]>(initialCompanies || []);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agentBalance, setAgentBalance] = useState<number | null>(null);


  // Step 1 States: Customer Setup
  const [custCompany, setCustCompany] = useState("");
  const [custName, setCustName] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custPhoneCode, setCustPhoneCode] = useState("+966");
  const [custSecondaryPhone, setCustSecondaryPhone] = useState("");
  const [custSecondaryPhoneCode, setCustSecondaryPhoneCode] = useState("+966");
  const [custAltPhone, setCustAltPhone] = useState("");
  const [custAltPhoneCode, setCustAltPhoneCode] = useState("+966");
  const [custEmail, setCustEmail] = useState("");
  const [countryCodes, setCountryCodes] = useState(defaultCountryCodes);

  useEffect(() => {
    async function loadCountryCodes() {
      const list = await api.getCountryCodes();
      if (list && list.length > 0) {
        setCountryCodes(list);
      }
    }
    loadCountryCodes();
  }, []);

  useEffect(() => {
    if (isCompanyPanel && companyUser) {
      const u = companyUser as any;
      setCustCompany(u.name || "");
      const defaultCode = getDefaultPhoneCode(u);
      setCustPhoneCode(defaultCode);
      setCustSecondaryPhoneCode(defaultCode);
      setCustAltPhoneCode(defaultCode);
      setCompaniesList([{
        id: u.id ? String(u.id) : "#CMP-ME",
        name: u.name || "",
        phone: u.phone || "N/A",
        email: u.email || "N/A",
        website: u.website || "N/A",
        address: u.address || "N/A",
        invoice: !!u.invoice,
        vouchers: !!u.vouchers,
        reminders: !!u.reminders,
        price_group: u.price_group
      }]);
    }
  }, [companyUser, isCompanyPanel]);

  useEffect(() => {
    if (isCompanyPanel && companyUser) {
      const fetchBalanceAndChat = async () => {
        try {
          const summary = await api.getCompanyDashboardSummary();
          if (summary && summary.ledger_summary) {
            setAgentBalance(Number(summary.ledger_summary.current_balance));
          }
        } catch (e) {
          console.error("Failed to load agent balance", e);
        }

        try {
          const chatMsgs = await api.getCompanyChatMessages();
          if (Array.isArray(chatMsgs) && chatMsgs.length > 0) {
            const latestMsg = chatMsgs[chatMsgs.length - 1];
            if (latestMsg && latestMsg.message) {
              setCustNotes(latestMsg.message);
            }
          }
        } catch (e) {
          console.error("Failed to load last chat message", e);
        }
      };
      fetchBalanceAndChat();
    }
  }, [companyUser, isCompanyPanel]);

  useEffect(() => {
    if (custCompany && companiesList.length > 0) {
      const matched = companiesList.find((c) => c.name?.trim().toLowerCase() === custCompany?.trim().toLowerCase());
      if (matched && matched.phone && matched.phone !== "N/A") {
        const defaultCode = getDefaultPhoneCode(matched);
        setCustPhoneCode(defaultCode);
        setCustSecondaryPhoneCode(defaultCode);
        setCustAltPhoneCode(defaultCode);
      } else {
        const defaultCode = getDefaultPhoneCode({ name: custCompany });
        setCustPhoneCode(defaultCode);
        setCustSecondaryPhoneCode(defaultCode);
        setCustAltPhoneCode(defaultCode);
      }
    }
  }, [custCompany, companiesList]);

  useEffect(() => {
    async function loadCustomPriceList() {
      if (custCompany) {
        const matched = companiesList.find((c) => c.name?.trim().toLowerCase() === custCompany?.trim().toLowerCase());
        const group = matched?.price_group || "Standard";
        try {
          const prices = await api.getPriceList(group);
          if (prices) {
            let rawList: any[] = [];
            if (Array.isArray(prices)) {
              rawList = prices;
            } else if (prices && Array.isArray(prices.data)) {
              rawList = prices.data;
            }
            setRawPriceList(rawList);
          }
        } catch (err) {
          console.error("Error loading group pricing in AddCustomerForm:", err);
        }
      } else {
        try {
          const prices = await api.getPriceList();
          let rawList: any[] = [];
          if (Array.isArray(prices)) {
            rawList = prices;
          } else if (prices && Array.isArray(prices.data)) {
            rawList = prices.data;
          }
          setRawPriceList(rawList);
        } catch (err) {
          console.error("Error loading default pricing in AddCustomerForm:", err);
        }
      }
    }
    loadCustomPriceList();
  }, [custCompany, companiesList]);

  // Step 2 States: Route setup (Full booking form integration)
  interface RouteItem {
    id: number;
    pickupDate: string;
    pickupTime: string;
    pickupLocation: string;
    dropoffLocation: string;
    timingStatus: string;
    bookingStatus: string;
    adults: number | "";
    childrenCount: number | "";
    bags: number | "";
    vehicle: string;
    tripPackage: string;
    priceBeforeDiscount: number | "";
    discount: number | "";
    cashToReceive: number | "";
    paymentMethod: string;
    receivedAmount: number | "";
    pendingAmount: number | "";
    discountReason: string;
    tafweejRequired: boolean;
    internalNotes: string;
    externalNotes: string;
    showPickupSuggestions?: boolean;
    showDropoffSuggestions?: boolean;
    externalPickupLocations?: string[];
    externalDropoffLocations?: string[];
  }

  const [routes, setRoutes] = useState<RouteItem[]>([
    {
      id: Date.now(),
      pickupDate: "",
      pickupTime: "",
      pickupLocation: "",
      dropoffLocation: "",
      timingStatus: "Confirmed",
      bookingStatus: "Pending",
      adults: 0,
      childrenCount: 0,
      bags: 0,
      vehicle: "",
      tripPackage: "",
      priceBeforeDiscount: "",
      discount: "",
      cashToReceive: "",
      paymentMethod: "Credit",
      receivedAmount: "",
      pendingAmount: "",
      discountReason: "",
      tafweejRequired: false,
      internalNotes: "",
      externalNotes: "",
      showPickupSuggestions: false,
      showDropoffSuggestions: false,
      externalPickupLocations: [],
      externalDropoffLocations: []
    }
  ]);
  const [vehiclesList, setVehiclesList] = useState<string[]>([]);
  const [packagesList, setPackagesList] = useState<string[]>([]);
  const [rawPriceList, setRawPriceList] = useState<any[]>([]);
  const [locationsList, setLocationsList] = useState<string[]>([]);

  const extractedLocations = React.useMemo(() => {
    if (locationsList && locationsList.length > 0) {
      return locationsList;
    }
    return [];
  }, [locationsList]);

  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const updateRouteField = (index: number, field: keyof RouteItem, value: any) => {
    setRoutes((prev) => {
      const updated = [...prev];
      const route = { ...updated[index], [field]: value };
      
      // If package or vehicle changed, resolve price
      if (field === "tripPackage" || field === "vehicle") {
        const pkg = field === "tripPackage" ? value : route.tripPackage;
        const veh = field === "vehicle" ? value : route.vehicle;
        const resolvedPrice = getResolvedPrice(pkg, veh);
        route.priceBeforeDiscount = resolvedPrice;
        
        // Update cashToReceive automatically if priceBeforeDiscount is resolved
        const base = Number(resolvedPrice || 0);
        const disc = Number(route.discount || 0);
        route.cashToReceive = Math.max(0, base - disc);

        // Update received/pending amounts
        const received = Number(route.receivedAmount || 0);
        if (route.paymentMethod === "Cash") {
          route.pendingAmount = Math.max(0, base - disc - received);
        }
      }
      
      // If priceBeforeDiscount, discount, paymentMethod, or receivedAmount changed, update cashToReceive / pendingAmount
      if (field === "priceBeforeDiscount" || field === "discount" || field === "paymentMethod" || field === "receivedAmount") {
        const base = Number(field === "priceBeforeDiscount" ? value : route.priceBeforeDiscount || 0);
        const disc = Number(field === "discount" ? value : route.discount || 0);
        const method = field === "paymentMethod" ? value : route.paymentMethod;
        const received = Number(field === "receivedAmount" ? value : route.receivedAmount || 0);
        
        route.cashToReceive = Math.max(0, base - disc);
        
        if (method === "Cash") {
          route.pendingAmount = Math.max(0, base - disc - received);
        } else {
          route.receivedAmount = "";
          route.pendingAmount = "";
        }
      }
      
      updated[index] = route;
      return updated;
    });
  };

  const handlePickupChange = (index: number, value: string) => {
    updateRouteField(index, "pickupLocation", value);
    updateRouteField(index, "showPickupSuggestions", true);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (!value || value.trim().length < 3) {
      updateRouteField(index, "externalPickupLocations", []);
      return;
    }
    
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await api.searchExternalLocations(value);
      updateRouteField(index, "externalPickupLocations", results || []);
    }, 400);
  };

  const handleDropoffChange = (index: number, value: string) => {
    updateRouteField(index, "dropoffLocation", value);
    updateRouteField(index, "showDropoffSuggestions", true);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (!value || value.trim().length < 3) {
      updateRouteField(index, "externalDropoffLocations", []);
      return;
    }
    
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await api.searchExternalLocations(value);
      updateRouteField(index, "externalDropoffLocations", results || []);
    }, 400);
  };

  const getPickupSuggestions = (route: RouteItem) => {
    const localMatches = extractedLocations.filter((loc) =>
      loc.toLowerCase().includes((route.pickupLocation || "").toLowerCase())
    );
    return Array.from(new Set([...localMatches, ...(route.externalPickupLocations || [])]));
  };

  const getDropoffSuggestions = (route: RouteItem) => {
    const localMatches = extractedLocations.filter((loc) =>
      loc.toLowerCase().includes((route.dropoffLocation || "").toLowerCase())
    );
    return Array.from(new Set([...localMatches, ...(route.externalDropoffLocations || [])]));
  };

  // Step 3 States: Flight Setup
  const [requireFlight, setRequireFlight] = useState(false);
  const [fltLeg, setFltLeg] = useState<"Arrival" | "Departure" | "Both Legs">("Arrival");
  const [fltArrFlightNo, setFltArrFlightNo] = useState("");
  const [fltArrPlace, setFltArrPlace] = useState("");
  const [fltArrDate, setFltArrDate] = useState("");
  const [fltArrTime, setFltArrTime] = useState("");
  const [fltDepFlightNo, setFltDepFlightNo] = useState("");
  const [fltDepPlace, setFltDepPlace] = useState("");
  const [fltDepDate, setFltDepDate] = useState("");
  const [fltDepTime, setFltDepTime] = useState("");

  // Step 4 States: Train Setup
  const [requireTrain, setRequireTrain] = useState(false);
  const [trnLeg, setTrnLeg] = useState<"Arrival" | "Departure" | "Both Legs">("Arrival");
  const [trnArrTrainNo, setTrnArrTrainNo] = useState("");
  const [trnArrStation, setTrnArrStation] = useState("");
  const [trnArrDate, setTrnArrDate] = useState("");
  const [trnArrTime, setTrnArrTime] = useState("");
  const [trnDepTrainNo, setTrnDepTrainNo] = useState("");
  const [trnDepStation, setTrnDepStation] = useState("");
  const [trnDepDate, setTrnDepDate] = useState("");
  const [trnDepTime, setTrnDepTime] = useState("");
  const [trainClass, setTrainClass] = useState("Economy");

  // Step 5 States: Hotel Setup
  const [requireHotel, setRequireHotel] = useState(false);
  const [hotelCity, setHotelCity] = useState("");
  const [hotelId, setHotelId] = useState("");
  const [hotelCheckin, setHotelCheckin] = useState("");
  const [hotelCheckout, setHotelCheckout] = useState("");
  const [custNotes, setCustNotes] = useState("");
  const [hotelsList, setHotelsList] = useState<any[]>([]);

  const DEFAULT_CITIES = React.useMemo(() => ["Makkah", "Madinah", "Jeddah", "Taif", "Riyadh", "Yanbu"], []);
  const dynamicCities = React.useMemo(() => {
    const dbCities = hotelsList.map((h) => h.city).filter(Boolean);
    const combined = Array.from(new Set([...DEFAULT_CITIES, ...dbCities]));
    return combined.sort((a, b) => {
      if (a === "Makkah" || a === "Madinah") return -1;
      if (b === "Makkah" || b === "Madinah") return 1;
      return a.localeCompare(b);
    });
  }, [hotelsList]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [companiesData, fleetData, priceListData, hotelsData, locationsData] = await Promise.all([
          (!isCompanyPanel && (!initialCompanies || initialCompanies.length === 0)) ? api.getCompanies() : Promise.resolve(null),
          api.getFleet(),
          api.getPriceList(),
          api.getHotels(),
          api.getLocations()
        ]);

        if (companiesData) {
          setCompaniesList(companiesData.map((c: any) => ({
            id: c.custom_id || `#CMP-${c.id}`,
            name: c.name,
            phone: c.phone || "N/A",
            email: c.email || "N/A",
            website: c.website || "N/A",
            address: c.address || "N/A",
            invoice: !!c.invoice,
            vouchers: !!c.vouchers,
            reminders: !!c.reminders,
            price_group: c.price_group
          })));
        }

        // Map fleet models dynamically
        if (Array.isArray(fleetData) && fleetData.length > 0) {
          setVehiclesList(fleetData.map((f: any) => f.model));
        } else if (fleetData && Array.isArray(fleetData.data) && fleetData.data.length > 0) {
          setVehiclesList(fleetData.data.map((f: any) => f.model));
        } else {
          setVehiclesList([]);
        }

        // Map price list routes/packages dynamically
        let rawList: any[] = [];
        if (Array.isArray(priceListData)) {
          rawList = priceListData;
        } else if (priceListData && Array.isArray(priceListData.data)) {
          rawList = priceListData.data;
        }
        setRawPriceList(rawList);

        if (locationsData && Array.isArray(locationsData)) {
          setLocationsList(locationsData);
        }

        if (rawList.length > 0) {
          setPackagesList(rawList.map((p: any) => p.route));
        } else {
          setPackagesList([]);
        }

        // Map hotels dynamically
        if (Array.isArray(hotelsData) && hotelsData.length > 0) {
          setHotelsList(hotelsData);
        } else {
          setHotelsList([]);
        }
      } catch (err) {
        console.error("Failed to load dynamic data in AddCustomerForm:", err);
      }
    }
    loadData();
  }, [initialCompanies]);

  const getResolvedPrice = (tripPkg: string, veh: string) => {
    if (!tripPkg || !veh || rawPriceList.length === 0) return "";
    
    const matchedPackage = rawPriceList.find((p: any) => {
      if (!p.route) return false;
      const r1 = p.route.toLowerCase().replace(/[^a-z0-9]/g, "");
      const r2 = tripPkg.toLowerCase().replace(/[^a-z0-9]/g, "");
      return r1 === r2 || r1.includes(r2) || r2.includes(r1);
    });

    if (matchedPackage) {
      // 1. Check custom prices first
      if (matchedPackage.custom_prices && typeof matchedPackage.custom_prices === 'object') {
        const customPriceObj = matchedPackage.custom_prices[veh];
        if (customPriceObj && typeof customPriceObj === 'object' && customPriceObj.price !== undefined) {
          const p = parseFloat(customPriceObj.price);
          if (!isNaN(p)) {
            return p;
          }
        }
      }

      // 2. Fallback to category based pricing
      const name = veh.toLowerCase();
      let category: "sedan" | "suv" | "van" | "coach" | null = null;
      if (name.includes("sedan")) category = "sedan";
      else if (name.includes("suv") || name.includes("gmc") || name.includes("yukon")) category = "suv";
      else if (name.includes("van") || name.includes("staria") || name.includes("starex") || name.includes("hiace") || name.includes("grand cabin")) category = "van";
      else if (name.includes("coaster") || name.includes("bus") || name.includes("coach")) category = "coach";
      else category = "sedan"; // Fallback to sedan for custom vehicle names

      if (category) {
        const priceField = `${category}_price`;
        const autoPrice = parseFloat(matchedPackage[priceField]);
        if (!isNaN(autoPrice)) {
          return autoPrice;
        }
      }
    }
    return "";
  };

  useEffect(() => {
    if (rawPriceList.length === 0) return;
    setRoutes((prev) =>
      prev.map((route) => {
        if (route.tripPackage && route.vehicle && (route.priceBeforeDiscount === "" || route.priceBeforeDiscount === 0)) {
          const resolvedPrice = getResolvedPrice(route.tripPackage, route.vehicle);
          const base = Number(resolvedPrice || 0);
          const disc = Number(route.discount || 0);
          return {
            ...route,
            priceBeforeDiscount: resolvedPrice,
            cashToReceive: Math.max(0, base - disc)
          };
        }
        return route;
      })
    );
  }, [rawPriceList]);

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9\s\-()]{7,18}$/;

    if (step === 1) {
      if (!custCompany.trim()) {
        newErrors.custCompany = "B2B Agent/Company selection is required.";
      }
      if (!custName.trim()) {
        newErrors.custName = "Customer Name is required.";
      } else if (custName.trim().length < 3) {
        newErrors.custName = "Customer Name must be at least 3 characters long.";
      }

      const combinedPhone = formatPhoneNumber(custPhoneCode, custPhone);
      if (!custPhone.trim()) {
        newErrors.custPhone = "Contact Mobile (WhatsApp number) is required.";
      } else if (!phoneRegex.test(combinedPhone)) {
        newErrors.custPhone = "Please enter a valid phone number (minimum 7 digits).";
      }

      if (custSecondaryPhone) {
        const combinedSecondary = formatPhoneNumber(custSecondaryPhoneCode, custSecondaryPhone);
        if (!phoneRegex.test(combinedSecondary)) {
          newErrors.custSecondaryPhone = "Please enter a valid secondary phone number.";
        }
      }

      if (custAltPhone) {
        const combinedAlt = formatPhoneNumber(custAltPhoneCode, custAltPhone);
        if (!phoneRegex.test(combinedAlt)) {
          newErrors.custAltPhone = "Please enter a valid alternative phone number.";
        }
      }

      if (custEmail.trim()) {
        if (!emailRegex.test(custEmail)) {
          newErrors.custEmail = "Please enter a valid email address.";
        }
      }
    }

    const todayStr = saudiToday;

    if (step === 2) {
      routes.forEach((route, idx) => {
        const prefix = `route_${idx}_`;
        if (!route.pickupDate) {
          newErrors[`${prefix}pickupDate`] = `Pick up date is required for Route #${idx + 1}.`;
        } else if (route.pickupDate < todayStr) {
          newErrors[`${prefix}pickupDate`] = `Pick up date cannot be in the past for Route #${idx + 1}.`;
        }
        if (!route.pickupTime) {
          newErrors[`${prefix}pickupTime`] = `Pick up time is required for Route #${idx + 1}.`;
        }
        if (!route.pickupLocation.trim()) {
          newErrors[`${prefix}pickupLocation`] = `Pick up location is required for Route #${idx + 1}.`;
        }
        if (!route.dropoffLocation.trim()) {
          newErrors[`${prefix}dropoffLocation`] = `Drop off location is required for Route #${idx + 1}.`;
        }
        if (!route.vehicle) {
          newErrors[`${prefix}vehicle`] = `Vehicle selection is required for Route #${idx + 1}.`;
        }
        if (!route.tripPackage) {
          newErrors[`${prefix}tripPackage`] = `Package selection is required for Route #${idx + 1}.`;
        }
        if (route.priceBeforeDiscount === "") {
          newErrors[`${prefix}priceBeforeDiscount`] = `Price before discount is required for Route #${idx + 1}.`;
        } else if (Number(route.priceBeforeDiscount) < 0) {
          newErrors[`${prefix}priceBeforeDiscount`] = `Price before discount cannot be negative for Route #${idx + 1}.`;
        }

        if (route.discount !== "" && Number(route.discount) < 0) {
          newErrors[`${prefix}discount`] = `Discount cannot be negative for Route #${idx + 1}.`;
        } else if (route.discount !== "" && Number(route.discount) > (Number(route.priceBeforeDiscount) || 0)) {
          newErrors[`${prefix}discount`] = `Discount cannot exceed the price before discount for Route #${idx + 1}.`;
        }

        if (route.cashToReceive !== "" && Number(route.cashToReceive) < 0) {
          newErrors[`${prefix}cashToReceive`] = `Cash to receive cannot be negative for Route #${idx + 1}.`;
        }

        if (route.adults !== "" && Number(route.adults) < 0) {
          newErrors[`${prefix}adults`] = `Adults count cannot be negative for Route #${idx + 1}.`;
        }
        if (route.childrenCount !== "" && Number(route.childrenCount) < 0) {
          newErrors[`${prefix}childrenCount`] = `Children count cannot be negative for Route #${idx + 1}.`;
        }
        if (route.bags !== "" && Number(route.bags) < 0) {
          newErrors[`${prefix}bags`] = `Bags count cannot be negative for Route #${idx + 1}.`;
        }
      });
    }

    if (step === 3) {
      if (requireFlight) {
        if (fltLeg === "Arrival" || fltLeg === "Both Legs") {
          if (!fltArrFlightNo.trim()) {
            newErrors.fltArrFlightNo = "Arrival flight number is required.";
          }
          if (!fltArrPlace.trim()) {
            newErrors.fltArrPlace = "Arrival airport/city is required.";
          }
          if (!fltArrDate) {
            newErrors.fltArrDate = "Arrival date is required.";
          } else if (fltArrDate < todayStr) {
            newErrors.fltArrDate = "Arrival date cannot be in the past.";
          }
          if (!fltArrTime) {
            newErrors.fltArrTime = "Arrival time is required.";
          }
        }
        if (fltLeg === "Departure" || fltLeg === "Both Legs") {
          if (!fltDepFlightNo.trim()) {
            newErrors.fltDepFlightNo = "Departure flight number is required.";
          }
          if (!fltDepPlace.trim()) {
            newErrors.fltDepPlace = "Departure airport/city is required.";
          }
          if (!fltDepDate) {
            newErrors.fltDepDate = "Departure date is required.";
          } else if (fltDepDate < todayStr) {
            newErrors.fltDepDate = "Departure date cannot be in the past.";
          }
          if (!fltDepTime) {
            newErrors.fltDepTime = "Departure time is required.";
          }
        }
      }
    }

    if (step === 4) {
      if (requireTrain) {
        if (trnLeg === "Arrival" || trnLeg === "Both Legs") {
          if (!trnArrTrainNo.trim()) {
            newErrors.trnArrTrainNo = "Arrival train number is required.";
          }
          if (!trnArrStation.trim()) {
            newErrors.trnArrStation = "Arrival station is required.";
          }
          if (!trnArrDate) {
            newErrors.trnArrDate = "Arrival date is required.";
          } else if (trnArrDate < todayStr) {
            newErrors.trnArrDate = "Arrival date cannot be in the past.";
          }
          if (!trnArrTime) {
            newErrors.trnArrTime = "Arrival time is required.";
          }
        }
        if (trnLeg === "Departure" || trnLeg === "Both Legs") {
          if (!trnDepTrainNo.trim()) {
            newErrors.trnDepTrainNo = "Departure train number is required.";
          }
          if (!trnDepStation.trim()) {
            newErrors.trnDepStation = "Departure station is required.";
          }
          if (!trnDepDate) {
            newErrors.trnDepDate = "Departure date is required.";
          } else if (trnDepDate < todayStr) {
            newErrors.trnDepDate = "Departure date cannot be in the past.";
          }
          if (!trnDepTime) {
            newErrors.trnDepTime = "Departure time is required.";
          }
        }
      }
    }

    if (step === 5) {
      if (requireHotel) {
        if (!hotelCity) {
          newErrors.hotelCity = "Destination area/city is required.";
        }
        if (!hotelId) {
          newErrors.hotelId = "Hotel selection is required.";
        }
        if (!hotelCheckin) {
          newErrors.hotelCheckin = "Check-in date is required.";
        } else if (hotelCheckin < todayStr) {
          newErrors.hotelCheckin = "Check-in date cannot be in the past.";
        }
        if (!hotelCheckout) {
          newErrors.hotelCheckout = "Check-out date is required.";
        } else if (hotelCheckout < todayStr) {
          newErrors.hotelCheckout = "Check-out date cannot be in the past.";
        } else if (hotelCheckin && new Date(hotelCheckout) < new Date(hotelCheckin)) {
          newErrors.hotelCheckout = "Check-out date cannot be before Check-in date.";
        }
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      showToast(firstError, "error");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handlePrev = () => {
    setActiveStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    let allValid = true;
    for (let s = 1; s <= 5; s++) {
      if (!validateStep(s)) {
        setActiveStep(s);
        allValid = false;
        break;
      }
    }
    if (!allValid) return;

    // Check B2B Agent balance
    if (isCompanyPanel && agentBalance !== null) {
      let totalBookingCost = 0;
      routes.forEach((route) => {
        const finalPrice = Math.max(0, (Number(route.priceBeforeDiscount) || 0) - (Number(route.discount) || 0));
        totalBookingCost += finalPrice;
      });

      if (agentBalance < totalBookingCost) {
        showToast(`Insufficient balance! Available balance is SAR ${agentBalance.toFixed(2)}, but this booking requires SAR ${totalBookingCost.toFixed(2)}. Please top up.`, "error");
        return;
      }
    }

    setLoading(true);

    try {
      // 1. Prepare consolidated contact details
      const formattedPhone = formatPhoneNumber(custPhoneCode, custPhone);
      const formattedSecondary = formatPhoneNumber(custSecondaryPhoneCode, custSecondaryPhone);
      const formattedAlt = formatPhoneNumber(custAltPhoneCode, custAltPhone);

      const phones = [formattedPhone, formattedSecondary, formattedAlt].filter(Boolean).join(" / ");
      const emailInfo = custEmail ? ` | Email: ${custEmail}` : "";
      const passportInfo = passportNo ? ` | Passport: ${passportNo}` : "";
      
      let flightInfoStr = "";
      if (requireFlight) {
        flightInfoStr = ` | Flight (${fltLeg}): ` +
          (fltLeg === "Arrival" || fltLeg === "Both Legs" ? `Arr: ${fltArrFlightNo} [${fltArrPlace} on ${fltArrDate}]` : "") +
          (fltLeg === "Both Legs" ? " & " : "") +
          (fltLeg === "Departure" || fltLeg === "Both Legs" ? `Dep: ${fltDepFlightNo} [${fltDepPlace} on ${fltDepDate}]` : "");
      }
      
      let trainInfoStr = "";
      if (requireTrain) {
        trainInfoStr = ` | Train (${trnLeg}): ` +
          (trnLeg === "Arrival" || trnLeg === "Both Legs" ? `Arr: ${trnArrTrainNo} [${trnArrStation} on ${trnArrDate}]` : "") +
          (trnLeg === "Both Legs" ? " & " : "") +
          (trnLeg === "Departure" || trnLeg === "Both Legs" ? `Dep: ${trnDepTrainNo} [${trnDepStation} on ${trnDepDate}]` : "") +
          ` Class: ${trainClass}`;
      }
      
      const hotelObj = hotelsList.find((h) => String(h.id) === String(hotelId));
      const hotelName = hotelObj ? (hotelObj.name || hotelObj.hotel_name) : hotelId;
      const hotelInfoStr = requireHotel ? ` | Hotel: ${hotelName} in ${hotelCity} (In: ${hotelCheckin}, Out: ${hotelCheckout})` : "";
      const notesInfo = custNotes ? ` | Notes: ${custNotes}` : "";

      const consolidatedContact = `${phones || "N/A"}${emailInfo}${passportInfo}${flightInfoStr}${trainInfoStr}${hotelInfoStr}${notesInfo}`;

      const newCust = {
        name: custName,
        company: custCompany,
        contact: consolidatedContact,
        phone: formattedPhone || null,
        secondary_phone: formattedSecondary || null,
        alternative_phone: formattedAlt || null,
        email: custEmail || null,
        passport_no: passportNo || null,
        hotel_info: requireHotel ? `${hotelName} in ${hotelCity} (In: ${hotelCheckin}, Out: ${hotelCheckout})` : null,
        notes: custNotes || null,
        registered_by: `${user?.name || user?.username || companyUser?.name || "hebacab"} (Today)`,
        last_update: "No edits",
      };

      // 2. Call Customer Creation API
      const custRes = isCompanyPanel 
        ? await api.createCompanyCustomer(newCust) 
        : await api.createCustomer(newCust);
      if (!custRes || !custRes.success) {
        showToast("Failed to register customer record.", "error");
        setLoading(false);
        return;
      }

      const createdCustomer = custRes.data;
      const customerId = createdCustomer.id;

      // 3. Create Booking Record per Route
      const todayStr = saudiToday;

      let bookingFlightNo = null;
      if (requireFlight) {
        if (fltLeg === "Arrival") bookingFlightNo = fltArrFlightNo;
        else if (fltLeg === "Departure") bookingFlightNo = fltDepFlightNo;
        else bookingFlightNo = `${fltArrFlightNo} / ${fltDepFlightNo}`;
      }

      for (let idx = 0; idx < routes.length; idx++) {
        const route = routes[idx];
        const finalPrice = Math.max(0, (Number(route.priceBeforeDiscount) || 0) - (Number(route.discount) || 0));

        const bookingData = {
          customer_id: customerId,
          pickup: route.pickupLocation,
          destination: route.dropoffLocation,
          date: route.pickupDate,
          time: route.pickupTime,
          passengers: `${Number(route.adults || 0) + Number(route.childrenCount || 0)} Passengers`,
          car_type: route.vehicle,
          car_price: finalPrice,
          full_name: custName,
          email: custEmail || null,
          whatsapp: formattedPhone || "N/A",
          flight_no: bookingFlightNo,
          notes: `Route: ${route.tripPackage} | Vehicle: ${route.vehicle} | Passengers: ${Number(route.adults || 0) + Number(route.childrenCount || 0)} | Timing Status: ${route.timingStatus} | Booking Status: ${route.bookingStatus} | Bags: ${route.bags || 0} | Discount Reason: ${route.discountReason} | Tafweej Required: ${route.tafweejRequired ? "Yes" : "No"} | Cash to Receive: ${route.cashToReceive || 0} | Internal Notes: ${route.internalNotes} | External Notes: ${route.externalNotes}${notesInfo}`,
          payment_method: route.paymentMethod || "Credit",
          received_amount: route.paymentMethod === "Cash" ? (Number(route.receivedAmount) || 0) : null,
          pending_amount: route.paymentMethod === "Cash" ? (Number(route.pendingAmount) || 0) : null,
          driver_id: null,
        };

        const bookingRes = await api.createBooking(bookingData);
        if (!bookingRes || !bookingRes.success) {
          showToast(`Customer created, but failed to create booking for Route #${idx + 1}.`, "error");
          setLoading(false);
          return;
        }
      }

      // 4. Create Flight (if requireFlight is active)
      if (requireFlight) {
        if (fltLeg === "Arrival" || fltLeg === "Both Legs") {
          const flightData = {
            customer_id: customerId,
            flight_no: fltArrFlightNo,
            leg: "Arrival",
            date: fltArrDate || todayStr,
            time: fltArrTime || "12:00",
            route: fltArrPlace,
            status: "On Time",
            driver_id: null,
          };
          await api.createFlight(flightData);
        }
        if (fltLeg === "Departure" || fltLeg === "Both Legs") {
          const flightData = {
            customer_id: customerId,
            flight_no: fltDepFlightNo,
            leg: "Departure",
            date: fltDepDate || todayStr,
            time: fltDepTime || "12:00",
            route: fltDepPlace,
            status: "On Time",
            driver_id: null,
          };
          await api.createFlight(flightData);
        }
      }

      // 5. Create Train (if requireTrain is active)
      if (requireTrain) {
        if (trnLeg === "Arrival" || trnLeg === "Both Legs") {
          const trainData = {
            customer_id: customerId,
            train_no: trnArrTrainNo,
            leg: "Arrival",
            date: trnArrDate || todayStr,
            time: trnArrTime || "12:00",
            route: trnArrStation,
            status: "Scheduled",
            driver_id: null,
          };
          await api.createTrain(trainData);
        }
        if (trnLeg === "Departure" || trnLeg === "Both Legs") {
          const trainData = {
            customer_id: customerId,
            train_no: trnDepTrainNo,
            leg: "Departure",
            date: trnDepDate || todayStr,
            time: trnDepTime || "12:00",
            route: trnDepStation,
            status: "Scheduled",
            driver_id: null,
          };
          await api.createTrain(trainData);
        }
      }

      // 6. Create Hotel (if requireHotel is active)
      if (requireHotel && hotelId) {
        const hotelData = {
          customer_id: customerId,
          name: hotelId,
          city: hotelCity,
          active: 1,
          check_in: hotelCheckin || null,
          check_out: hotelCheckout || null,
          driver_id: null,
        };
        await api.createHotel(hotelData);
      }

      showToast("Unified Umrah File Created Successfully!", "success");
      setTimeout(() => {
        router.push(isCompanyPanel ? "/company/customers" : "/admin/customers");
      }, 1500);

    } catch (err) {
      console.error(err);
      showToast("System Failure: Could not finalize the unified file record.", "error");
      setLoading(false);
    }
  };

  // Filter Hotels dynamically based on selected city (unique list of names)
  const filteredHotels = React.useMemo(() => {
    // 1. Get all unique hotel names from database for the selected city
    const dbHotelNames = hotelsList
      .filter((h) => h.city?.toLowerCase() === hotelCity?.toLowerCase() && (h.name || h.hotel_name))
      .map((h) => (h.name || h.hotel_name).trim());

    // 2. Get static mock hotels for the selected city
    const mockHotelNames = mockHotels
      .filter((h) => h.city.toLowerCase() === hotelCity?.toLowerCase())
      .map((h) => h.hotel_name.trim());

    // 3. Merge them and deduplicate
    const allNames = Array.from(new Set([...dbHotelNames, ...mockHotelNames]));

    // 4. Map to options
    return allNames.map((name) => ({
      id: name,
      name: name,
      city: hotelCity
    }));
  }, [hotelsList, hotelCity]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
      {/* Toast Notification */}
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
      <div className="form-header-card" style={{ 
        background: "linear-gradient(135deg, #b48a1d 0%, #1e1e2d 100%)",
        padding: "20px 30px", 
        borderRadius: "12px", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center"
      }}>
        <div>
          <span style={{ fontSize: "11px", background: "rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: "12px", display: "inline-block", marginBottom: "8px", fontWeight: "600" }}>
            <i className="fas fa-layer-group" style={{ marginRight: "5px" }}></i> Unified Booking Engine
          </span>
          <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#fff", margin: 0 }}>Premium Multi-Step Booking</h2>
          <p style={{ color: "rgba(255,255,255,0.85)", margin: "5px 0 0 0" }}>Register a customer and build their complete transport & lodging file.</p>
        </div>
        <button type="button" onClick={() => router.push(isCompanyPanel ? "/company/customers" : "/admin/customers")} className="form-btn-back" style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          <i className="fas fa-arrow-left"></i>
          <span>Back to List</span>
        </button>
      </div>

      {/* Step Indicator Top Tracker */}
      <div className="wizard-steps" style={{ marginTop: "10px", position: "relative" }}>
        <div 
          className="wizard-steps-progress" 
          style={{ 
            position: "absolute", 
            top: "20px", 
            left: "10%", 
            height: "3px", 
            background: "#b48a1d", 
            zIndex: 1, 
            width: `${((activeStep - 1) / 4) * 80}%`,
            transition: "width 0.4s ease"
          }} 
        />
        
        <div className={`step-item ${activeStep >= 1 ? "active" : ""} ${activeStep > 1 ? "completed" : ""}`}>
          <div className="step-circle">
            {activeStep > 1 ? <i className="fas fa-check" style={{ fontSize: "12px" }}></i> : "1"}
          </div>
          <div className="step-label">Customer</div>
        </div>
        <div className={`step-item ${activeStep >= 2 ? "active" : ""} ${activeStep > 2 ? "completed" : ""}`}>
          <div className="step-circle">
            {activeStep > 2 ? <i className="fas fa-check" style={{ fontSize: "12px" }}></i> : "2"}
          </div>
          <div className="step-label">Route Setup</div>
        </div>
        <div className={`step-item ${activeStep >= 3 ? "active" : ""} ${activeStep > 3 ? "completed" : ""}`}>
          <div className="step-circle">
            {activeStep > 3 ? <i className="fas fa-check" style={{ fontSize: "12px" }}></i> : "3"}
          </div>
          <div className="step-label">Flight Details</div>
        </div>
        <div className={`step-item ${activeStep >= 4 ? "active" : ""} ${activeStep > 4 ? "completed" : ""}`}>
          <div className="step-circle">
            {activeStep > 4 ? <i className="fas fa-check" style={{ fontSize: "12px" }}></i> : "4"}
          </div>
          <div className="step-label">Train Tickets</div>
        </div>
        <div className={`step-item ${activeStep >= 5 ? "active" : ""} ${activeStep > 5 ? "completed" : ""}`}>
          <div className="step-circle">
            {activeStep > 5 ? <i className="fas fa-check" style={{ fontSize: "12px" }}></i> : "5"}
          </div>
          <div className="step-label">Hotel Booking</div>
        </div>
      </div>

      {/* Unified Form container */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
        <div className="form-card" style={{ width: "100%", padding: "35px", borderRadius: "16px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* ==================== TAB 1: CUSTOMER SETUP ==================== */}
            {activeStep === 1 && (
              <div>
                <div style={{ borderBottom: "1px solid #edf2f9", marginBottom: "20px", paddingBottom: "10px" }}>
                  <h3 style={{ color: "var(--dark-color)", margin: 0, fontSize: "18px", fontWeight: "700" }}>
                    <i className="fa-solid fa-user-plus" style={{ marginRight: "10px", color: "var(--primary-color)" }}></i> Step 1: Passenger / Agent Setup
                  </h3>
                </div>

                <div className="form-grid">
                  <div>
                    <label className="form-label">Select B2B Agent *</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fas fa-building form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      {isCompanyPanel && companyUser ? (
                        <input
                          type="text"
                          className="form-input form-input-readonly"
                          value={custCompany}
                          readOnly
                          style={{ paddingLeft: "42px", width: "100%", background: "#f1f5f9", borderColor: errors.custCompany ? "#ef4444" : undefined }}
                        />
                      ) : (
                        <select className="form-input form-select" value={custCompany} onChange={(e) => setCustCompany(e.target.value)} required style={{ paddingLeft: "42px", width: "100%", borderColor: errors.custCompany ? "#ef4444" : undefined }}>
                          <option value="">Select a Company</option>
                          {companiesList.map((com) => (
                            <option key={com.id} value={com.name}>
                              {com.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    {isCompanyPanel && companyUser && agentBalance !== null && (
                      <div style={{ marginTop: "6px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ color: "#64748b", fontWeight: "600" }}>Available Balance:</span>
                        <span style={{ 
                          color: agentBalance < 0 ? "#ef4444" : "#10b981", 
                          fontWeight: "800",
                          background: agentBalance < 0 ? "#fef2f2" : "#f0fdf4",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          border: `1px solid ${agentBalance < 0 ? "#fee2e2" : "#bbf7d0"}`
                        }}>
                          SAR {agentBalance.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {errors.custCompany && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.custCompany}</span>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Customer Name *</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fas fa-user form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <input type="text" className="form-input" placeholder="Primary Passenger Name" value={custName} onChange={(e) => setCustName(e.target.value)} required style={{ paddingLeft: "42px", width: "100%", borderColor: errors.custName ? "#ef4444" : undefined }} />
                    </div>
                    {errors.custName && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.custName}</span>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Passport Number</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fas fa-passport form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <input type="text" className="form-input" placeholder="e.g. PK123456" value={passportNo} onChange={(e) => setPassportNo(e.target.value)} style={{ paddingLeft: "42px", width: "100%", borderColor: errors.passportNo ? "#ef4444" : undefined }} />
                    </div>
                    {errors.passportNo && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.passportNo}</span>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Contact Mobile *</label>
                    <div className="form-input-wrapper" style={{ display: "flex", gap: "8px", position: "relative" }}>
                      <CountryCodeSelector
                        value={custPhoneCode}
                        onChange={setCustPhoneCode}
                        style={{ width: "130px", flexShrink: 0 }}
                        className="form-input"
                      />
                      <div style={{ position: "relative", flexGrow: 1 }}>
                        <i className="fas fa-phone form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                        <input type="text" className="form-input" placeholder="WhatsApp Number" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} required style={{ paddingLeft: "42px", width: "100%", borderColor: errors.custPhone ? "#ef4444" : undefined }} />
                      </div>
                    </div>
                    {errors.custPhone && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.custPhone}</span>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Secondary Phone</label>
                    <div className="form-input-wrapper" style={{ display: "flex", gap: "8px", position: "relative" }}>
                      <CountryCodeSelector
                        value={custSecondaryPhoneCode}
                        onChange={setCustSecondaryPhoneCode}
                        style={{ width: "130px", flexShrink: 0 }}
                        className="form-input"
                      />
                      <div style={{ position: "relative", flexGrow: 1 }}>
                        <i className="fas fa-phone form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                        <input type="text" className="form-input" placeholder="e.g. 5XXXXXXXX" value={custSecondaryPhone} onChange={(e) => setCustSecondaryPhone(e.target.value)} style={{ paddingLeft: "42px", width: "100%", borderColor: errors.custSecondaryPhone ? "#ef4444" : undefined }} />
                      </div>
                    </div>
                    {errors.custSecondaryPhone && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.custSecondaryPhone}</span>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Alternative Phone</label>
                    <div className="form-input-wrapper" style={{ display: "flex", gap: "8px", position: "relative" }}>
                      <CountryCodeSelector
                        value={custAltPhoneCode}
                        onChange={setCustAltPhoneCode}
                        style={{ width: "130px", flexShrink: 0 }}
                        className="form-input"
                      />
                      <div style={{ position: "relative", flexGrow: 1 }}>
                        <i className="fas fa-phone form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                        <input type="text" className="form-input" placeholder="e.g. 5XXXXXXXX" value={custAltPhone} onChange={(e) => setCustAltPhone(e.target.value)} style={{ paddingLeft: "42px", width: "100%", borderColor: errors.custAltPhone ? "#ef4444" : undefined }} />
                      </div>
                    </div>
                    {errors.custAltPhone && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.custAltPhone}</span>
                    )}
                  </div>

                  <div className="form-group-full">
                    <label className="form-label">Email Address</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fas fa-envelope form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <input type="email" className="form-input" placeholder="customer@example.com" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} style={{ paddingLeft: "42px", width: "100%", borderColor: errors.custEmail ? "#ef4444" : undefined }} />
                    </div>
                    {errors.custEmail && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.custEmail}</span>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: "30px", display: "flex", justifyContent: "flex-end" }}>
                  <button type="button" className="btn-submit" onClick={handleNext} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>Next Step</span> <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* ==================== TAB 2: ROUTE BOOKING ==================== */}
            {activeStep === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ borderBottom: "1px solid #edf2f9", marginBottom: "10px", paddingBottom: "10px" }}>
                  <h3 style={{ color: "var(--dark-color)", margin: 0, fontSize: "18px", fontWeight: "700" }}>
                    <i className="fa-solid fa-route" style={{ marginRight: "10px", color: "var(--primary-color)" }}></i> Step 2: Transport Route & Sector Selection
                  </h3>
                </div>

                {routes.map((route, index) => {
                  const finalPrice = Math.max(0, (Number(route.priceBeforeDiscount) || 0) - (Number(route.discount) || 0));

                  return (
                    <div
                      key={route.id}
                      className="route-card animate-fade-in"
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "24px",
                        backgroundColor: "#fff",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                        position: "relative"
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "20px",
                          borderBottom: "1px solid #f1f5f9",
                          paddingBottom: "12px"
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                          <i className="fa-solid fa-circle" style={{ fontSize: "8px", color: "#b48a1d" }}></i>
                          Route #{index + 1}
                        </span>
                        {routes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setRoutes((prev) => prev.filter((_, i) => i !== index));
                            }}
                            style={{
                              color: "#ef4444",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <i className="fa-solid fa-trash-can"></i> Remove Route
                          </button>
                        )}
                      </div>

                      {/* Form Grid */}
                      <div className="form-grid">
                        {/* Package */}
                        <div className="form-group-full">
                          <label className="form-label">Package *</label>
                          <div className="form-input-wrapper" style={{ position: "relative" }}>
                            <i className="fas fa-box-archive form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                            <select
                              className="form-input form-select"
                              value={route.tripPackage}
                              onChange={(e) => updateRouteField(index, "tripPackage", e.target.value)}
                              required
                              style={{ paddingLeft: "42px", width: "100%", borderColor: errors[`route_${index}_tripPackage`] ? "#ef4444" : undefined }}
                            >
                              <option value="">Choose package...</option>
                              {packagesList.map((p, i) => (
                                <option key={i} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          </div>
                          {errors[`route_${index}_tripPackage`] && (
                            <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors[`route_${index}_tripPackage`]}</span>
                          )}
                        </div>

                        {/* Pickup Date */}
                        <div>
                          <label className="form-label">Pick up Date *</label>
                          <div className="form-input-wrapper" style={{ position: "relative" }}>
                            <i className="fas fa-calendar-day form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                            <input
                              type="date"
                              className="form-input"
                              value={route.pickupDate}
                              onChange={(e) => updateRouteField(index, "pickupDate", e.target.value)}
                              min={saudiToday}
                              required
                              style={{
                                paddingLeft: "42px",
                                width: "100%",
                                borderColor: (errors[`route_${index}_pickupDate`] || (route.pickupDate && route.pickupDate < saudiToday)) ? "#ef4444" : undefined
                              }}
                            />
                          </div>
                          {(errors[`route_${index}_pickupDate`] || (route.pickupDate && route.pickupDate < saudiToday)) && (
                            <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>
                              {errors[`route_${index}_pickupDate`] || "⚠️ Past dates are not allowed. Please select a current or future date."}
                            </span>
                          )}
                        </div>

                        {/* Pickup Time */}
                        <div>
                          <label className="form-label">Pick up Time *</label>
                          <TimePicker24h
                            value={route.pickupTime}
                            onChange={(newTime) => updateRouteField(index, "pickupTime", newTime)}
                            hasError={!!errors[`route_${index}_pickupTime`]}
                          />
                          {errors[`route_${index}_pickupTime`] && (
                            <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors[`route_${index}_pickupTime`]}</span>
                          )}
                        </div>

                        {/* Pickup Location */}
                        <div style={{ position: "relative" }}>
                          <label className="form-label">Pick up Location *</label>
                          <div className="form-input-wrapper" style={{ position: "relative" }}>
                            <i className="fas fa-location-dot form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Type or select location..."
                              value={route.pickupLocation}
                              onChange={(e) => handlePickupChange(index, e.target.value)}
                              onFocus={() => updateRouteField(index, "showPickupSuggestions", true)}
                              onBlur={() => setTimeout(() => updateRouteField(index, "showPickupSuggestions", false), 200)}
                              required
                              style={{ paddingLeft: "42px", width: "100%", borderColor: errors[`route_${index}_pickupLocation`] ? "#ef4444" : undefined }}
                            />
                          </div>
                          {route.showPickupSuggestions && getPickupSuggestions(route).length > 0 && (
                            <div className="suggestions-box" style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              backgroundColor: "#fff",
                              border: "1px solid #cbd5e1",
                              borderRadius: "8px",
                              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                              zIndex: 999,
                              maxHeight: "180px",
                              overflowY: "auto",
                              marginTop: "4px"
                            }}>
                              {getPickupSuggestions(route).map((loc, idx) => (
                                <div
                                  key={idx}
                                  onMouseDown={() => {
                                    updateRouteField(index, "pickupLocation", loc);
                                    updateRouteField(index, "showPickupSuggestions", false);
                                  }}
                                  style={{
                                    padding: "10px 14px",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    color: "#334155",
                                    borderBottom: "1px solid #f1f5f9"
                                  }}
                                  className="suggestion-item"
                                >
                                  <i className="fas fa-location-dot" style={{ marginRight: "8px", color: "#b48a1d" }}></i>
                                  {loc}
                                </div>
                              ))}
                            </div>
                          )}
                          {errors[`route_${index}_pickupLocation`] && (
                            <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors[`route_${index}_pickupLocation`]}</span>
                          )}
                        </div>

                        {/* Dropoff Location */}
                        <div style={{ position: "relative" }}>
                          <label className="form-label">Drop off Location *</label>
                          <div className="form-input-wrapper" style={{ position: "relative" }}>
                            <i className="fas fa-paper-plane form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Type or select location..."
                              value={route.dropoffLocation}
                              onChange={(e) => handleDropoffChange(index, e.target.value)}
                              onFocus={() => updateRouteField(index, "showDropoffSuggestions", true)}
                              onBlur={() => setTimeout(() => updateRouteField(index, "showDropoffSuggestions", false), 200)}
                              required
                              style={{ paddingLeft: "42px", width: "100%", borderColor: errors[`route_${index}_dropoffLocation`] ? "#ef4444" : undefined }}
                            />
                          </div>
                          {route.showDropoffSuggestions && getDropoffSuggestions(route).length > 0 && (
                            <div className="suggestions-box" style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              backgroundColor: "#fff",
                              border: "1px solid #cbd5e1",
                              borderRadius: "8px",
                              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                              zIndex: 999,
                              maxHeight: "180px",
                              overflowY: "auto",
                              marginTop: "4px"
                            }}>
                              {getDropoffSuggestions(route).map((loc, idx) => (
                                <div
                                  key={idx}
                                  onMouseDown={() => {
                                    updateRouteField(index, "dropoffLocation", loc);
                                    updateRouteField(index, "showDropoffSuggestions", false);
                                  }}
                                  style={{
                                    padding: "10px 14px",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    color: "#334155",
                                    borderBottom: "1px solid #f1f5f9"
                                  }}
                                  className="suggestion-item"
                                >
                                  <i className="fas fa-paper-plane" style={{ marginRight: "8px", color: "#b48a1d" }}></i>
                                  {loc}
                                </div>
                              ))}
                            </div>
                          )}
                          {errors[`route_${index}_dropoffLocation`] && (
                            <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors[`route_${index}_dropoffLocation`]}</span>
                          )}
                        </div>

                        {/* Timing Status */}
                        <div>
                          <label className="form-label">Timing Status</label>
                          <div className="form-input-wrapper" style={{ position: "relative" }}>
                            <i className="fas fa-clock-rotate-left form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                            <select
                              className="form-input form-select"
                              value={route.timingStatus}
                              onChange={(e) => updateRouteField(index, "timingStatus", e.target.value)}
                              style={{ paddingLeft: "42px", width: "100%", borderColor: errors[`route_${index}_timingStatus`] ? "#ef4444" : undefined }}
                            >
                              <option value="Confirmed">Confirmed</option>
                              <option value="Delayed">Delayed</option>
                              <option value="On Time">On Time</option>
                            </select>
                          </div>
                          {errors[`route_${index}_timingStatus`] && (
                            <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors[`route_${index}_timingStatus`]}</span>
                          )}
                        </div>

                        {/* Booking Status */}
                        <div>
                          <label className="form-label">Booking Status *</label>
                          <div className="form-input-wrapper" style={{ position: "relative" }}>
                            <i className="fas fa-chart-simple form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                            <select
                              className="form-input form-select"
                              value={route.bookingStatus}
                              onChange={(e) => updateRouteField(index, "bookingStatus", e.target.value)}
                              required
                              style={{ paddingLeft: "42px", width: "100%", borderColor: errors[`route_${index}_bookingStatus`] ? "#ef4444" : undefined }}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                          {errors[`route_${index}_bookingStatus`] && (
                            <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors[`route_${index}_bookingStatus`]}</span>
                          )}
                        </div>



                        {/* Adults */}
                        <div>
                          <label className="form-label">Adults</label>
                          <div className="form-input-wrapper" style={{ position: "relative" }}>
                            <i className="fas fa-user-group form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                            <input
                              type="number"
                              min="0"
                              className="form-input"
                              value={route.adults}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateRouteField(index, "adults", val === "" ? "" : parseInt(val) || 0);
                              }}
                              style={{ paddingLeft: "42px", width: "100%", borderColor: errors[`route_${index}_adults`] ? "#ef4444" : undefined }}
                            />
                          </div>
                          {errors[`route_${index}_adults`] && (
                            <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors[`route_${index}_adults`]}</span>
                          )}
                        </div>

                        {/* Children */}
                        <div>
                          <label className="form-label">Children</label>
                          <div className="form-input-wrapper" style={{ position: "relative" }}>
                            <i className="fas fa-child form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                            <input
                              type="number"
                              min="0"
                              className="form-input"
                              value={route.childrenCount}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateRouteField(index, "childrenCount", val === "" ? "" : parseInt(val) || 0);
                              }}
                              style={{ paddingLeft: "42px", width: "100%", borderColor: errors[`route_${index}_childrenCount`] ? "#ef4444" : undefined }}
                            />
                          </div>
                          {errors[`route_${index}_childrenCount`] && (
                            <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors[`route_${index}_childrenCount`]}</span>
                          )}
                        </div>

                        {/* Bags */}
                        <div>
                          <label className="form-label">Bags</label>
                          <div className="form-input-wrapper" style={{ position: "relative" }}>
                            <i className="fas fa-briefcase form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                            <input
                              type="number"
                              min="0"
                              className="form-input"
                              value={route.bags}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateRouteField(index, "bags", val === "" ? "" : parseInt(val) || 0);
                              }}
                              style={{ paddingLeft: "42px", width: "100%", borderColor: errors[`route_${index}_bags`] ? "#ef4444" : undefined }}
                            />
                          </div>
                          {errors[`route_${index}_bags`] && (
                            <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors[`route_${index}_bags`]}</span>
                          )}
                        </div>

                        {/* Vehicle */}
                        <div>
                          <label className="form-label">Vehicle *</label>
                          <div className="form-input-wrapper" style={{ position: "relative" }}>
                            <i className="fas fa-bus form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                            <select
                              className="form-input form-select"
                              value={route.vehicle}
                              onChange={(e) => updateRouteField(index, "vehicle", e.target.value)}
                              required
                              style={{ paddingLeft: "42px", width: "100%", borderColor: errors[`route_${index}_vehicle`] ? "#ef4444" : undefined }}
                            >
                              <option value="">Choose vehicle...</option>
                              {vehiclesList.map((v, i) => (
                                <option key={i} value={v}>
                                  {v}
                                </option>
                              ))}
                            </select>
                          </div>
                          {errors[`route_${index}_vehicle`] && (
                            <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors[`route_${index}_vehicle`]}</span>
                          )}
                        </div>

                        {/* Price Before Discount */}
                        <div>
                          <label className="form-label">Price Before Discount *</label>
                          <div className="form-input-wrapper" style={{ position: "relative" }}>
                            <i className="fas fa-money-bill-1 form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="form-input"
                              placeholder="0.00"
                              value={route.priceBeforeDiscount}
                              onChange={(e) => updateRouteField(index, "priceBeforeDiscount", e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                              required
                              style={{ paddingLeft: "42px", width: "100%", borderColor: errors[`route_${index}_priceBeforeDiscount`] ? "#ef4444" : undefined }}
                            />
                          </div>
                          {errors[`route_${index}_priceBeforeDiscount`] && (
                            <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors[`route_${index}_priceBeforeDiscount`]}</span>
                          )}
                        </div>

                        {/* Discount */}
                        <div>
                          <label className="form-label">Discount</label>
                          <div className="form-input-wrapper" style={{ position: "relative" }}>
                            <i className="fas fa-scissors form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="form-input"
                              placeholder="0.00"
                              value={route.discount}
                              onChange={(e) => updateRouteField(index, "discount", e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                              style={{ paddingLeft: "42px", width: "100%", borderColor: errors[`route_${index}_discount`] ? "#ef4444" : undefined }}
                            />
                          </div>
                          {errors[`route_${index}_discount`] && (
                            <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors[`route_${index}_discount`]}</span>
                          )}
                        </div>

                        {/* Final Booking Price */}
                        <div>
                          <label className="form-label">Final Booking Price</label>
                          <div className="form-input-wrapper" style={{ position: "relative" }}>
                            <i className="fas fa-calculator form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                            <input
                              type="text"
                              className="form-input form-input-readonly"
                              value={finalPrice.toFixed(2)}
                              readOnly
                              style={{ paddingLeft: "42px", width: "100%", background: "#f1f5f9" }}
                            />
                          </div>
                        </div>

                        {/* Payment Method */}
                        <div>
                          <label className="form-label">Payment Method *</label>
                          <div className="form-input-wrapper" style={{ position: "relative" }}>
                            <i className="fas fa-credit-card form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                            <select
                              className="form-input form-select"
                              value={route.paymentMethod || "Credit"}
                              onChange={(e) => updateRouteField(index, "paymentMethod", e.target.value)}
                              required
                              style={{ paddingLeft: "42px", width: "100%" }}
                            >
                              <option value="Credit">Credit</option>
                              <option value="Cash">Cash</option>
                            </select>
                          </div>
                        </div>

                        {route.paymentMethod === "Cash" && (
                          <>
                            {/* Received Amount */}
                            <div>
                              <label className="form-label">Received Amount *</label>
                              <div className="form-input-wrapper" style={{ position: "relative" }}>
                                <i className="fas fa-money-bill-wave form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="form-input"
                                  placeholder="0.00"
                                  value={route.receivedAmount}
                                  onChange={(e) => updateRouteField(index, "receivedAmount", e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                                  required
                                  style={{ paddingLeft: "42px", width: "100%" }}
                                />
                              </div>
                            </div>

                            {/* Pending Amount */}
                            <div>
                              <label className="form-label">Pending Amount</label>
                              <div className="form-input-wrapper" style={{ position: "relative" }}>
                                <i className="fas fa-clock-rotate-left form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="form-input form-input-readonly"
                                  placeholder="0.00"
                                  value={route.pendingAmount}
                                  readOnly
                                  style={{ paddingLeft: "42px", width: "100%", background: "#f1f5f9" }}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {/* Discount Reason */}
                        <div className="form-group-full">
                          <label className="form-label">Discount Reason</label>
                          <div className="form-input-wrapper" style={{ position: "relative" }}>
                            <i className="fas fa-quote-left form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Reason for applying discount (if any)..."
                              value={route.discountReason}
                              onChange={(e) => updateRouteField(index, "discountReason", e.target.value)}
                              style={{ paddingLeft: "42px", width: "100%" }}
                            />
                          </div>
                        </div>

                        {/* Tafweej Required Toggle */}
                        <div className="form-group-full">
                          <div className="tafweej-box">
                            <div className="tafweej-row">
                              <span className="tafweej-toggle-label">Is Tafweej Required?</span>
                              <label className="switch">
                                <input
                                  type="checkbox"
                                  checked={route.tafweejRequired}
                                  onChange={(e) => updateRouteField(index, "tafweejRequired", e.target.checked)}
                                />
                                <span className="slider"></span>
                              </label>
                            </div>
                            <div className="tafweej-note">
                              <i className="fas fa-circle-exclamation"></i>
                              <span>Tafweej is mandatory if the Umrah visa is obtained on airport arrival.</span>
                            </div>
                          </div>
                        </div>

                        {/* Internal Notes */}
                        <div className="form-group-full">
                          <label className="form-label">Internal Notes</label>
                          <div className="form-input-wrapper" style={{ position: "relative" }}>
                            <i className="fas fa-lock form-icon" style={{ position: "absolute", left: "14px", top: "16px", color: "#9ca3af" }}></i>
                            <textarea
                              className="form-input form-textarea"
                              placeholder="Private internal notes (not visible to customer)..."
                              value={route.internalNotes}
                              onChange={(e) => updateRouteField(index, "internalNotes", e.target.value)}
                              rows={3}
                              style={{ paddingLeft: "42px", width: "100%", height: "auto", resize: "vertical", paddingTop: "12px" }}
                            />
                          </div>
                        </div>

                        {/* External Notes */}
                        <div className="form-group-full">
                          <label className="form-label">External Notes</label>
                          <div className="form-input-wrapper" style={{ position: "relative" }}>
                            <i className="fas fa-comment form-icon" style={{ position: "absolute", left: "14px", top: "16px", color: "#9ca3af" }}></i>
                            <textarea
                              className="form-input form-textarea"
                              placeholder="Notes for customer/driver..."
                              value={route.externalNotes}
                              onChange={(e) => updateRouteField(index, "externalNotes", e.target.value)}
                              rows={3}
                              style={{ paddingLeft: "42px", width: "100%", height: "auto", resize: "vertical", paddingTop: "12px" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add More Route Button */}
                <button
                  type="button"
                  onClick={() => {
                    setRoutes((prev) => [
                      ...prev,
                      {
                        id: Date.now(),
                        pickupDate: "",
                        pickupTime: "",
                        pickupLocation: "",
                        dropoffLocation: "",
                        timingStatus: "Confirmed",
                        bookingStatus: "Pending",
                        adults: 0,
                        childrenCount: 0,
                        bags: 0,
                        vehicle: "",
                        tripPackage: "",
                        priceBeforeDiscount: "",
                        discount: "",
                        cashToReceive: "",
                        paymentMethod: "Credit",
                        receivedAmount: "",
                        pendingAmount: "",
                        discountReason: "",
                        tafweejRequired: false,
                        internalNotes: "",
                        externalNotes: "",
                        showPickupSuggestions: false,
                        showDropoffSuggestions: false,
                        externalPickupLocations: [],
                        externalDropoffLocations: [],
                        driverId: ""
                      }
                    ]);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "16px",
                    border: "2px dashed #b48a1d",
                    borderRadius: "12px",
                    color: "#b48a1d",
                    backgroundColor: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                    width: "100%",
                    transition: "all 0.2s",
                    fontSize: "14px"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#fffbeb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#fff";
                  }}
                >
                  <i className="fa-solid fa-circle-plus" style={{ fontSize: "16px" }}></i> Add More Route
                </button>

                <div style={{ marginTop: "30px", display: "flex", justifyContent: "space-between" }}>
                  <button type="button" className="btn-cancel" onClick={handlePrev} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa-solid fa-arrow-left"></i> <span>Previous</span>
                  </button>
                  <button type="button" className="btn-submit" onClick={handleNext} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>Next Step</span> <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* ==================== TAB 3: FLIGHT SETUP ==================== */}
            {activeStep === 3 && (
              <div>
                <div style={{ borderBottom: "1px solid #edf2f9", marginBottom: "20px", paddingBottom: "10px" }}>
                  <h3 style={{ color: "var(--dark-color)", margin: 0, fontSize: "18px", fontWeight: "700" }}>
                    <i className="fa-solid fa-plane-departure" style={{ marginRight: "10px", color: "var(--primary-color)" }}></i> Step 3: Flight Information
                  </h3>
                </div>

                <div className="optional-toggle-box">
                  <label className="form-switch">
                    <input type="checkbox" checked={requireFlight} onChange={(e) => setRequireFlight(e.target.checked)} style={{ display: "none" }} />
                    <span className="switch-slider"></span>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--dark-color)" }}>Does this customer require Flight Management?</span>
                  </label>
                </div>

                {requireFlight && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "fadeIn 0.3s ease-in-out" }}>
                    {/* Leg Type Tab Buttons */}
                    <div style={{ display: "flex", gap: "10px" }}>
                      {(["Arrival", "Departure", "Both Legs"] as const).map((leg) => (
                        <button
                          key={leg}
                          type="button"
                          onClick={() => setFltLeg(leg)}
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
                            border: fltLeg === leg ? "none" : "1px solid #cbd5e1",
                            background: fltLeg === leg ? "#0284c7" : "#ffffff",
                            color: fltLeg === leg ? "#ffffff" : "#64748b",
                            boxShadow: fltLeg === leg ? `0 4px 6px -1px rgba(2, 132, 199, 0.25)` : "none",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <i className={leg === "Arrival" ? "fas fa-plane-arrival" : leg === "Departure" ? "fas fa-plane-departure" : "fas fa-arrows-left-right"}></i>
                          <span>{leg}</span>
                        </button>
                      ))}
                    </div>

                    {/* Arrival details */}
                    {(fltLeg === "Arrival" || fltLeg === "Both Legs") && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "15px", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", background: "#f8fafc" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
                          <i className="fas fa-plane-arrival" style={{ color: "#0284c7" }}></i>
                          <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>Arrival Flight Details</span>
                        </div>
                        <div className="form-grid">
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Flight Number *</label>
                            <div className="form-input-wrapper">
                              <i className="fas fa-plane form-icon"></i>
                              <input type="text" className="form-input" placeholder="e.g. SV-3720" value={fltArrFlightNo} onChange={(e) => setFltArrFlightNo(e.target.value)} required={fltLeg === "Arrival" || fltLeg === "Both Legs"} style={{ borderColor: errors.fltArrFlightNo ? "#ef4444" : undefined }} />
                            </div>
                            {errors.fltArrFlightNo && (
                              <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.fltArrFlightNo}</span>
                            )}
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Arrival Airport / City *</label>
                            <div className="form-input-wrapper">
                              <i className="fas fa-location-dot form-icon"></i>
                              <input type="text" className="form-input" placeholder="e.g. JED" value={fltArrPlace} onChange={(e) => setFltArrPlace(e.target.value)} required={fltLeg === "Arrival" || fltLeg === "Both Legs"} style={{ borderColor: errors.fltArrPlace ? "#ef4444" : undefined }} />
                            </div>
                            {errors.fltArrPlace && (
                              <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.fltArrPlace}</span>
                            )}
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Arrival Date *</label>
                            <input
                              type="date"
                              className="form-input"
                              value={fltArrDate}
                              onChange={(e) => setFltArrDate(e.target.value)}
                              min={saudiToday}
                              required={fltLeg === "Arrival" || fltLeg === "Both Legs"}
                              style={{
                                paddingLeft: "15px",
                                borderColor: (errors.fltArrDate || (fltArrDate && fltArrDate < saudiToday)) ? "#ef4444" : undefined
                              }}
                            />
                            {(errors.fltArrDate || (fltArrDate && fltArrDate < saudiToday)) && (
                              <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>
                                {errors.fltArrDate || "⚠️ Past dates are not allowed. Please select a current or future date."}
                              </span>
                            )}
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Arrival Time *</label>
                            <TimePicker24h
                              value={fltArrTime}
                              onChange={setFltArrTime}
                              hasError={!!errors.fltArrTime}
                            />
                            {errors.fltArrTime && (
                              <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.fltArrTime}</span>
                            )}
                          </div>

                        </div>
                      </div>
                    )}

                    {/* Departure details */}
                    {(fltLeg === "Departure" || fltLeg === "Both Legs") && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "15px", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", background: "#f8fafc" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
                          <i className="fas fa-plane-departure" style={{ color: "#0284c7" }}></i>
                          <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>Departure Flight Details</span>
                        </div>
                        <div className="form-grid">
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Flight Number *</label>
                            <div className="form-input-wrapper">
                              <i className="fas fa-plane form-icon"></i>
                              <input type="text" className="form-input" placeholder="e.g. SV-3721" value={fltDepFlightNo} onChange={(e) => setFltDepFlightNo(e.target.value)} required={fltLeg === "Departure" || fltLeg === "Both Legs"} style={{ borderColor: errors.fltDepFlightNo ? "#ef4444" : undefined }} />
                            </div>
                            {errors.fltDepFlightNo && (
                              <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.fltDepFlightNo}</span>
                            )}
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Departure Airport / City *</label>
                            <div className="form-input-wrapper">
                              <i className="fas fa-location-dot form-icon"></i>
                              <input type="text" className="form-input" placeholder="e.g. MED" value={fltDepPlace} onChange={(e) => setFltDepPlace(e.target.value)} required={fltLeg === "Departure" || fltLeg === "Both Legs"} style={{ borderColor: errors.fltDepPlace ? "#ef4444" : undefined }} />
                            </div>
                            {errors.fltDepPlace && (
                              <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.fltDepPlace}</span>
                            )}
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Departure Date *</label>
                            <input
                              type="date"
                              className="form-input"
                              value={fltDepDate}
                              onChange={(e) => setFltDepDate(e.target.value)}
                              min={saudiToday}
                              required={fltLeg === "Departure" || fltLeg === "Both Legs"}
                              style={{
                                paddingLeft: "15px",
                                borderColor: (errors.fltDepDate || (fltDepDate && fltDepDate < saudiToday)) ? "#ef4444" : undefined
                              }}
                            />
                            {(errors.fltDepDate || (fltDepDate && fltDepDate < saudiToday)) && (
                              <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>
                                {errors.fltDepDate || "⚠️ Past dates are not allowed. Please select a current or future date."}
                              </span>
                            )}
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Departure Time *</label>
                            <TimePicker24h
                              value={fltDepTime}
                              onChange={setFltDepTime}
                              hasError={!!errors.fltDepTime}
                            />
                            {errors.fltDepTime && (
                              <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.fltDepTime}</span>
                            )}
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ marginTop: "30px", display: "flex", justifyContent: "space-between" }}>
                  <button type="button" className="btn-cancel" onClick={handlePrev} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa-solid fa-arrow-left"></i> <span>Previous</span>
                  </button>
                  <button type="button" className="btn-submit" onClick={handleNext} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>Next Step</span> <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* ==================== TAB 4: TRAIN SETUP ==================== */}
            {activeStep === 4 && (
              <div>
                <div style={{ borderBottom: "1px solid #edf2f9", marginBottom: "20px", paddingBottom: "10px" }}>
                  <h3 style={{ color: "var(--dark-color)", margin: 0, fontSize: "18px", fontWeight: "700" }}>
                    <i className="fa-solid fa-train" style={{ marginRight: "10px", color: "var(--primary-color)" }}></i> Step 4: Haramain Train Integration
                  </h3>
                </div>

                <div className="optional-toggle-box">
                  <label className="form-switch">
                    <input type="checkbox" checked={requireTrain} onChange={(e) => setRequireTrain(e.target.checked)} style={{ display: "none" }} />
                    <span className="switch-slider"></span>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--dark-color)" }}>Does this customer have Haramain Train Tickets?</span>
                  </label>
                </div>

                {requireTrain && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "fadeIn 0.3s ease-in-out" }}>
                    
                    {/* Train Class Select Box */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label className="form-label">Train Ticket Class Type</label>
                      <select className="form-input form-select" value={trainClass} onChange={(e) => setTrainClass(e.target.value)} style={{ paddingLeft: "15px" }}>
                        <option value="Economy">Economy Class Ticket</option>
                        <option value="Business">Business Class Ticket</option>
                      </select>
                    </div>

                    {/* Leg Type Tab Buttons */}
                    <div style={{ display: "flex", gap: "10px" }}>
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
                            background: trnLeg === leg ? "#7c3aed" : "#ffffff",
                            color: trnLeg === leg ? "#ffffff" : "#64748b",
                            boxShadow: trnLeg === leg ? `0 4px 6px -1px rgba(124, 58, 237, 0.25)` : "none",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <i className={leg === "Arrival" ? "fas fa-train" : leg === "Departure" ? "fas fa-train" : "fas fa-arrows-left-right"}></i>
                          <span>{leg}</span>
                        </button>
                      ))}
                    </div>

                    {/* Arrival details */}
                    {(trnLeg === "Arrival" || trnLeg === "Both Legs") && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "15px", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", background: "#f8fafc" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
                          <i className="fas fa-train" style={{ color: "#7c3aed" }}></i>
                          <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>Arrival Train Details</span>
                        </div>
                        <div className="form-grid">
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Train Number *</label>
                            <div className="form-input-wrapper">
                              <i className="fas fa-train form-icon"></i>
                              <input type="text" className="form-input" placeholder="e.g. HHR-5" value={trnArrTrainNo} onChange={(e) => setTrnArrTrainNo(e.target.value)} required={trnLeg === "Arrival" || trnLeg === "Both Legs"} style={{ borderColor: errors.trnArrTrainNo ? "#ef4444" : undefined }} />
                            </div>
                            {errors.trnArrTrainNo && (
                              <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.trnArrTrainNo}</span>
                            )}
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Arrival Station *</label>
                            <div className="form-input-wrapper">
                              <i className="fas fa-location-dot form-icon"></i>
                              <input type="text" className="form-input" placeholder="e.g. Makkah Station" value={trnArrStation} onChange={(e) => setTrnArrStation(e.target.value)} required={trnLeg === "Arrival" || trnLeg === "Both Legs"} style={{ borderColor: errors.trnArrStation ? "#ef4444" : undefined }} />
                            </div>
                            {errors.trnArrStation && (
                              <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.trnArrStation}</span>
                            )}
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Arrival Date *</label>
                            <input
                              type="date"
                              className="form-input"
                              value={trnArrDate}
                              onChange={(e) => setTrnArrDate(e.target.value)}
                              min={saudiToday}
                              required={trnLeg === "Arrival" || trnLeg === "Both Legs"}
                              style={{
                                paddingLeft: "15px",
                                borderColor: (errors.trnArrDate || (trnArrDate && trnArrDate < saudiToday)) ? "#ef4444" : undefined
                              }}
                            />
                            {(errors.trnArrDate || (trnArrDate && trnArrDate < saudiToday)) && (
                              <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>
                                {errors.trnArrDate || "⚠️ Past dates are not allowed. Please select a current or future date."}
                              </span>
                            )}
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Arrival Time *</label>
                            <TimePicker24h
                              value={trnArrTime}
                              onChange={setTrnArrTime}
                              hasError={!!errors.trnArrTime}
                            />
                            {errors.trnArrTime && (
                              <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.trnArrTime}</span>
                            )}
                          </div>

                        </div>
                      </div>
                    )}

                    {/* Departure details */}
                    {(trnLeg === "Departure" || trnLeg === "Both Legs") && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "15px", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", background: "#f8fafc" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
                          <i className="fas fa-train" style={{ color: "#7c3aed" }}></i>
                          <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>Departure Train Details</span>
                        </div>
                        <div className="form-grid">
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Train Number *</label>
                            <div className="form-input-wrapper">
                              <i className="fas fa-train form-icon"></i>
                              <input type="text" className="form-input" placeholder="e.g. HHR-10" value={trnDepTrainNo} onChange={(e) => setTrnDepTrainNo(e.target.value)} required={trnLeg === "Departure" || trnLeg === "Both Legs"} style={{ borderColor: errors.trnDepTrainNo ? "#ef4444" : undefined }} />
                            </div>
                            {errors.trnDepTrainNo && (
                              <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.trnDepTrainNo}</span>
                            )}
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Departure Station *</label>
                            <div className="form-input-wrapper">
                              <i className="fas fa-location-dot form-icon"></i>
                              <input type="text" className="form-input" placeholder="e.g. Medina Station" value={trnDepStation} onChange={(e) => setTrnDepStation(e.target.value)} required={trnLeg === "Departure" || trnLeg === "Both Legs"} style={{ borderColor: errors.trnDepStation ? "#ef4444" : undefined }} />
                            </div>
                            {errors.trnDepStation && (
                              <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.trnDepStation}</span>
                            )}
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Departure Date *</label>
                            <input
                              type="date"
                              className="form-input"
                              value={trnDepDate}
                              onChange={(e) => setTrnDepDate(e.target.value)}
                              min={saudiToday}
                              required={trnLeg === "Departure" || trnLeg === "Both Legs"}
                              style={{
                                paddingLeft: "15px",
                                borderColor: (errors.trnDepDate || (trnDepDate && trnDepDate < saudiToday)) ? "#ef4444" : undefined
                              }}
                            />
                            {(errors.trnDepDate || (trnDepDate && trnDepDate < saudiToday)) && (
                              <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>
                                {errors.trnDepDate || "⚠️ Past dates are not allowed. Please select a current or future date."}
                              </span>
                            )}
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Departure Time *</label>
                            <TimePicker24h
                              value={trnDepTime}
                              onChange={setTrnDepTime}
                              hasError={!!errors.trnDepTime}
                            />
                            {errors.trnDepTime && (
                              <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.trnDepTime}</span>
                            )}
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ marginTop: "30px", display: "flex", justifyContent: "space-between" }}>
                  <button type="button" className="btn-cancel" onClick={handlePrev} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa-solid fa-arrow-left"></i> <span>Previous</span>
                  </button>
                  <button type="button" className="btn-submit" onClick={handleNext} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>Next Step</span> <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* ==================== TAB 5: NEW HOTEL BOOKING SETUP ==================== */}
            {activeStep === 5 && (
              <div>
                <div style={{ borderBottom: "1px solid #edf2f9", marginBottom: "20px", paddingBottom: "10px" }}>
                  <h3 style={{ color: "var(--dark-color)", margin: 0, fontSize: "18px", fontWeight: "700" }}>
                    <i className="fa-solid fa-hotel" style={{ marginRight: "10px", color: "var(--primary-color)" }}></i> Step 5: Umrah Hotel Accommodations
                  </h3>
                </div>

                <div className="optional-toggle-box">
                  <label className="form-switch">
                    <input type="checkbox" checked={requireHotel} onChange={(e) => setRequireHotel(e.target.checked)} style={{ display: "none" }} />
                    <span className="switch-slider"></span>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--dark-color)" }}>Include Hotel Reservation for this file?</span>
                  </label>
                </div>

                {requireHotel && (
                  <div className="form-grid" style={{ animation: "fadeIn 0.3s ease-in-out", marginBottom: "20px" }}>
                    <div>
                      <label className="form-label">Select Destination Area/City *</label>
                      <div className="form-input-wrapper" style={{ position: "relative" }}>
                        <i className="fa-solid fa-city form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                        <select className="form-input form-select" value={hotelCity} onChange={(e) => { setHotelCity(e.target.value); setHotelId(""); }} style={{ paddingLeft: "42px", width: "100%", borderColor: errors.hotelCity ? "#ef4444" : undefined }}>
                          <option value="">-- Choose City --</option>
                          {dynamicCities.map(city => (
                            <option key={city} value={city}>{city === "Makkah" ? "Makkah Mukarramah" : city === "Madinah" ? "Madinah Munawwarah" : city}</option>
                          ))}
                        </select>
                      </div>
                      {errors.hotelCity && (
                        <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.hotelCity}</span>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Available Property / Hotel *</label>
                      <div className="form-input-wrapper" style={{ position: "relative" }}>
                        <i className="fa-solid fa-building-circle-check form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                        <select className="form-input form-select" value={hotelId} onChange={(e) => setHotelId(e.target.value)} style={{ paddingLeft: "42px", width: "100%", borderColor: errors.hotelId ? "#ef4444" : undefined }}>
                          <option value="">-- Select Hotel --</option>
                          {filteredHotels.map((h) => (
                            <option key={h.id} value={h.id}>
                              [{h.city.toUpperCase()}] {h.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.hotelId && (
                        <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.hotelId}</span>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Check-In Date *</label>
                      <input
                        type="date"
                        className="form-input"
                        value={hotelCheckin}
                        onChange={(e) => setHotelCheckin(e.target.value)}
                        min={saudiToday}
                        style={{
                          paddingLeft: "15px",
                          borderColor: (errors.hotelCheckin || (hotelCheckin && hotelCheckin < saudiToday)) ? "#ef4444" : undefined
                        }}
                      />
                      {(errors.hotelCheckin || (hotelCheckin && hotelCheckin < saudiToday)) && (
                        <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>
                          {errors.hotelCheckin || "⚠️ Past dates are not allowed. Please select a current or future date."}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Check-Out Date *</label>
                      <input
                        type="date"
                        className="form-input"
                        value={hotelCheckout}
                        onChange={(e) => setHotelCheckout(e.target.value)}
                        min={hotelCheckin || saudiToday}
                        style={{
                          paddingLeft: "15px",
                          borderColor: (errors.hotelCheckout || (hotelCheckout && hotelCheckout < saudiToday)) ? "#ef4444" : undefined
                        }}
                      />
                      {(errors.hotelCheckout || (hotelCheckout && hotelCheckout < saudiToday)) && (
                        <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>
                          {errors.hotelCheckout || "⚠️ Past dates are not allowed. Please select a current or future date."}
                        </span>
                      )}
                    </div>


                  </div>
                )}

                <div className="form-group-full" style={{ marginTop: "10px" }}>
                  <label className="form-label">External Notes</label>
                  <div className="form-input-wrapper" style={{ position: "relative" }}>
                    <i className="fas fa-comment form-icon" style={{ position: "absolute", left: "14px", top: "16px", color: "#9ca3af" }}></i>
                    <textarea 
                      className="form-input" 
                      placeholder="Notes that might be shared or visible to relevant parties..." 
                      value={custNotes} 
                      onChange={(e) => setCustNotes(e.target.value)} 
                      rows={3} 
                      style={{ paddingLeft: "42px", width: "100%", height: "auto", resize: "vertical", paddingTop: "12px" }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: "30px", display: "flex", justifyContent: "space-between" }}>
                  <button type="button" className="btn-cancel" onClick={handlePrev} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa-solid fa-arrow-left"></i> <span>Previous</span>
                  </button>
                  <button type="submit" className="btn-submit" disabled={loading} style={{ background: "var(--primary-color)", color: "#1e1e2d", display: "flex", alignItems: "center", gap: "8px", fontWeight: "700" }}>
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-circle-check"></i>
                        <span>Complete Process & Save File</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>
      </div>

      {/* Scoped CSS Styles for stepper tabs */}
      <style>{`
        .wizard-steps {
          display: flex !important;
          justify-content: space-between !important;
          margin-bottom: 30px !important;
          position: relative !important;
          max-width: 100% !important;
          width: 100% !important;
          padding: 0 10px !important;
        }
        
        .wizard-steps::before {
          content: '' !important;
          position: absolute !important;
          top: 20px !important;
          left: 10% !important;
          width: 80% !important;
          height: 3px !important;
          background: #cbd5e1 !important;
          z-index: 1 !important;
        }

        .step-item {
          position: relative !important;
          z-index: 2 !important;
          text-align: center !important;
          flex: 1 !important;
        }
        
        .step-circle {
          width: 40px !important;
          height: 40px !important;
          border-radius: 50% !important;
          background: #ffffff !important;
          border: 3px solid #cbd5e1 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0 auto 10px auto !important;
          font-weight: 700 !important;
          color: #94a3b8 !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05) !important;
        }
        
        .step-item.active .step-circle {
          border-color: #b48a1d !important;
          background: #1e1e2d !important;
          color: #b48a1d !important;
          box-shadow: 0 0 0 6px rgba(180, 138, 29, 0.15) !important;
          transform: scale(1.1);
        }
        
        .step-item.completed .step-circle {
          background: #b48a1d !important;
          border-color: #b48a1d !important;
          color: #ffffff !important;
        }
        
        .step-label {
          font-size: 13px !important;
          font-weight: 600 !important;
          color: #94a3b8 !important;
          transition: color 0.3s ease !important;
          margin-top: 5px !important;
          white-space: nowrap !important;
        }
        
        .step-item.active .step-label {
          color: #1e1e2d !important;
          font-weight: 700 !important;
        }
        
        .step-item.completed .step-label {
          color: #b48a1d !important;
          font-weight: 700 !important;
        }
        
        .suggestion-item {
          transition: background-color 0.15s ease, color 0.15s ease;
        }
        .suggestion-item:hover {
          background-color: #f8fafc !important;
          color: #b48a1d !important;
        }
      `}</style>
    </div>
  );
};
