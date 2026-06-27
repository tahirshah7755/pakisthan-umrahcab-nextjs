"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

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


export const AddCustomerForm: React.FC<AddCustomerFormProps> = ({
  companies: initialCompanies,
  router,
}) => {
  const { companyUser } = useAuth();
  const pathname = usePathname();
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

  // Step 1 States: Customer Setup
  const [custCompany, setCustCompany] = useState("");
  const [custName, setCustName] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custSecondaryPhone, setCustSecondaryPhone] = useState("");
  const [custAltPhone, setCustAltPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");

  useEffect(() => {
    if (isCompanyPanel && companyUser?.name) {
      setCustCompany(companyUser.name);
    }
  }, [companyUser, isCompanyPanel]);

  // Step 2 States: Route setup (Full booking form integration)
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
  const [timingStatus, setTimingStatus] = useState("Confirmed");
  const [bookingStatus, setBookingStatus] = useState("Pending");
  const [adults, setAdults] = useState<number | "">(0);
  const [childrenCount, setChildrenCount] = useState<number | "">(0);
  const [bags, setBags] = useState<number | "">(0);
  const [vehicle, setVehicle] = useState("");
  const [tripPackage, setTripPackage] = useState("");
  const [priceBeforeDiscount, setPriceBeforeDiscount] = useState<number | "">("");
  const [discount, setDiscount] = useState<number | "">("");
  const [cashToReceive, setCashToReceive] = useState<number | "">("");
  const [discountReason, setDiscountReason] = useState("");
  const [tafweejRequired, setTafweejRequired] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [externalNotes, setExternalNotes] = useState("");
  const [vehiclesList, setVehiclesList] = useState<string[]>([]);
  const [packagesList, setPackagesList] = useState<string[]>([]);
  const [rawPriceList, setRawPriceList] = useState<any[]>([]);
  const [locationsList, setLocationsList] = useState<string[]>([]);

  const extractedLocations = React.useMemo(() => {
    if (locationsList && locationsList.length > 0) {
      return locationsList;
    }
    const fallbackLocations = [
      "Jeddah Airport (JED) - Terminal 1",
      "Jeddah Airport (JED) - North Terminal",
      "Makkah Hotel",
      "Madinah Hotel",
      "Jeddah Hotel",
      "Makkah Station (Haramain)",
      "Madinah Station (Haramain)",
      "Jeddah Station (Haramain)",
      "Madinah Haram",
      "Makkah Haram",
      "Yanbu",
      "Taif"
    ];
    return fallbackLocations;
  }, [locationsList]);

  const [externalPickupLocations, setExternalPickupLocations] = useState<string[]>([]);
  const [externalDropoffLocations, setExternalDropoffLocations] = useState<string[]>([]);

  const filteredPickupSuggestions = React.useMemo(() => {
    const localMatches = extractedLocations.filter((loc) =>
      loc.toLowerCase().includes(pickupLocation.toLowerCase())
    );
    return Array.from(new Set([...localMatches, ...externalPickupLocations]));
  }, [extractedLocations, pickupLocation, externalPickupLocations]);

  const filteredDropoffSuggestions = React.useMemo(() => {
    const localMatches = extractedLocations.filter((loc) =>
      loc.toLowerCase().includes(dropoffLocation.toLowerCase())
    );
    return Array.from(new Set([...localMatches, ...externalDropoffLocations]));
  }, [extractedLocations, dropoffLocation, externalDropoffLocations]);

  useEffect(() => {
    if (!pickupLocation || pickupLocation.trim().length < 3) {
      setExternalPickupLocations([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      const results = await api.searchExternalLocations(pickupLocation);
      setExternalPickupLocations(results);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [pickupLocation]);

  useEffect(() => {
    if (!dropoffLocation || dropoffLocation.trim().length < 3) {
      setExternalDropoffLocations([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      const results = await api.searchExternalLocations(dropoffLocation);
      setExternalDropoffLocations(results);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [dropoffLocation]);

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

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [companiesData, fleetData, priceListData, hotelsData, locationsData] = await Promise.all([
          (!initialCompanies || initialCompanies.length === 0) ? api.getCompanies() : Promise.resolve(null),
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
            reminders: !!c.reminders
          })));
        }

        // Map fleet models dynamically
        if (Array.isArray(fleetData) && fleetData.length > 0) {
          setVehiclesList(fleetData.map((f: any) => f.model));
        } else if (fleetData && Array.isArray(fleetData.data) && fleetData.data.length > 0) {
          setVehiclesList(fleetData.data.map((f: any) => f.model));
        } else {
          setVehiclesList([
            "Sedan CORE",
            "Hyundai Staria CORE",
            "Hyundai Starex CORE",
            "GMC XL Yukon CORE",
            "Hiace Grand Cabin CORE",
            "Coaster CORE",
            "Bus CORE",
            "Luxury Bus CORE",
            "SUV",
          ]);
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
          setPackagesList([
            "Jeddah Airport to Makkah Hotel ★ (جدہ ایئرپورٹ سے مکہ ہوٹل)",
            "Makkah Hotel to Jeddah Airport ★ (مکہ ہوٹل سے جدہ ایئرپورٹ)",
            "Jeddah Airport to Madinah Hotel (جدہ ایئرپورٹ سے مدینہ ہوٹل)",
            "4 in 1 Tour: Kiswah Factory + Makkah Museum + Hira Museum + Holy Quran Museum (ان ۱ ٹور)",
          ]);
        }

        // Map hotels dynamically
        if (Array.isArray(hotelsData) && hotelsData.length > 0) {
          setHotelsList(hotelsData);
        } else {
          setHotelsList(mockHotels);
        }
      } catch (err) {
        console.error("Failed to load dynamic data in AddCustomerForm:", err);
      }
    }
    loadData();
  }, [initialCompanies]);

  useEffect(() => {
    if (!vehicle || !tripPackage || rawPriceList.length === 0) return;

    const matchedPackage = rawPriceList.find((p: any) => {
      if (!p.route) return false;
      const r1 = p.route.toLowerCase().replace(/[^a-z0-9]/g, "");
      const r2 = tripPackage.toLowerCase().replace(/[^a-z0-9]/g, "");
      return r1 === r2 || r1.includes(r2) || r2.includes(r1);
    });

    if (matchedPackage) {
      const name = vehicle.toLowerCase();
      let category: "sedan" | "suv" | "van" | "coach" | null = null;
      if (name.includes("sedan")) category = "sedan";
      else if (name.includes("suv") || name.includes("gmc") || name.includes("yukon")) category = "suv";
      else if (name.includes("van") || name.includes("staria") || name.includes("starex") || name.includes("hiace") || name.includes("grand cabin")) category = "van";
      else if (name.includes("coaster") || name.includes("bus") || name.includes("coach")) category = "coach";

      if (category) {
        const priceField = `${category}_price`;
        const autoPrice = parseFloat(matchedPackage[priceField]);
        if (!isNaN(autoPrice)) {
          setPriceBeforeDiscount(autoPrice);
        }
      }
    }
  }, [vehicle, tripPackage, rawPriceList]);

  const finalBookingPrice = Math.max(0, (Number(priceBeforeDiscount) || 0) - (Number(discount) || 0));

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

      if (!custPhone.trim()) {
        newErrors.custPhone = "Contact Mobile (WhatsApp number) is required.";
      } else if (!phoneRegex.test(custPhone)) {
        newErrors.custPhone = "Please enter a valid phone number (minimum 7 digits).";
      }

      if (custSecondaryPhone && !phoneRegex.test(custSecondaryPhone)) {
        newErrors.custSecondaryPhone = "Please enter a valid secondary phone number.";
      }

      if (custAltPhone && !phoneRegex.test(custAltPhone)) {
        newErrors.custAltPhone = "Please enter a valid alternative phone number.";
      }

      if (custEmail && !emailRegex.test(custEmail)) {
        newErrors.custEmail = "Please enter a valid email address.";
      }
    }

    if (step === 2) {
      if (!pickupDate) {
        newErrors.pickupDate = "Pick up date is required.";
      }
      if (!pickupTime) {
        newErrors.pickupTime = "Pick up time is required.";
      }
      if (!pickupLocation.trim()) {
        newErrors.pickupLocation = "Pick up location is required.";
      }
      if (!dropoffLocation.trim()) {
        newErrors.dropoffLocation = "Drop off location is required.";
      }
      if (!vehicle) {
        newErrors.vehicle = "Vehicle selection is required.";
      }
      if (!tripPackage) {
        newErrors.tripPackage = "Package selection is required.";
      }
      if (priceBeforeDiscount === "") {
        newErrors.priceBeforeDiscount = "Price before discount is required.";
      } else if (Number(priceBeforeDiscount) < 0) {
        newErrors.priceBeforeDiscount = "Price before discount cannot be negative.";
      }

      if (discount !== "" && Number(discount) < 0) {
        newErrors.discount = "Discount cannot be negative.";
      } else if (discount !== "" && Number(discount) > (Number(priceBeforeDiscount) || 0)) {
        newErrors.discount = "Discount cannot exceed the price before discount.";
      }

      if (cashToReceive !== "" && Number(cashToReceive) < 0) {
        newErrors.cashToReceive = "Cash to receive cannot be negative.";
      }

      if (adults !== "" && Number(adults) < 0) {
        newErrors.adults = "Adults count cannot be negative.";
      }
      if (childrenCount !== "" && Number(childrenCount) < 0) {
        newErrors.childrenCount = "Children count cannot be negative.";
      }
      if (bags !== "" && Number(bags) < 0) {
        newErrors.bags = "Bags count cannot be negative.";
      }
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
        }
        if (!hotelCheckout) {
          newErrors.hotelCheckout = "Check-out date is required.";
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

    setLoading(true);

    try {
      // 1. Prepare consolidated contact details
      const phones = [custPhone, custSecondaryPhone, custAltPhone].filter(Boolean).join(" / ");
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
        phone: custPhone || null,
        secondary_phone: custSecondaryPhone || null,
        alternative_phone: custAltPhone || null,
        email: custEmail || null,
        passport_no: passportNo || null,
        hotel_info: requireHotel ? `${hotelName} in ${hotelCity} (In: ${hotelCheckin}, Out: ${hotelCheckout})` : null,
        notes: custNotes || null,
        registered_by: "umrahcab (Today)",
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

      // 3. Create Booking Record
      const todayStr = new Date().toISOString().split("T")[0];

      let bookingFlightNo = null;
      if (requireFlight) {
        if (fltLeg === "Arrival") bookingFlightNo = fltArrFlightNo;
        else if (fltLeg === "Departure") bookingFlightNo = fltDepFlightNo;
        else bookingFlightNo = `${fltArrFlightNo} / ${fltDepFlightNo}`;
      }

      const bookingData = {
        customer_id: customerId,
        pickup: pickupLocation,
        destination: dropoffLocation,
        date: pickupDate,
        time: pickupTime,
        passengers: `${Number(adults) + Number(childrenCount)} Passengers`,
        car_type: vehicle,
        car_price: finalBookingPrice,
        full_name: custName,
        email: custEmail || null,
        whatsapp: custPhone || "N/A",
        flight_no: bookingFlightNo,
        notes: `Route: ${tripPackage} | Vehicle: ${vehicle} | Passengers: ${Number(adults) + Number(childrenCount)} | Timing Status: ${timingStatus} | Booking Status: ${bookingStatus} | Bags: ${bags} | Discount Reason: ${discountReason} | Tafweej Required: ${tafweejRequired ? "Yes" : "No"} | Cash to Receive: ${cashToReceive} | Internal Notes: ${internalNotes} | External Notes: ${externalNotes}${notesInfo}`,
      };

      const bookingRes = await api.createBooking(bookingData);
      if (!bookingRes || !bookingRes.success) {
        showToast("Customer created, but failed to create booking file.", "error");
        setLoading(false);
        return;
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
            status: "On Time"
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
            status: "On Time"
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
            status: "Scheduled"
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
            status: "Scheduled"
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
          check_out: hotelCheckout || null
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
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fas fa-phone form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <input type="text" className="form-input" placeholder="WhatsApp Number" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} required style={{ paddingLeft: "42px", width: "100%", borderColor: errors.custPhone ? "#ef4444" : undefined }} />
                    </div>
                    {errors.custPhone && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.custPhone}</span>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Secondary Phone</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fas fa-phone form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <input type="text" className="form-input" placeholder="e.g. +9665XXXXXXXX" value={custSecondaryPhone} onChange={(e) => setCustSecondaryPhone(e.target.value)} style={{ paddingLeft: "42px", width: "100%", borderColor: errors.custSecondaryPhone ? "#ef4444" : undefined }} />
                    </div>
                    {errors.custSecondaryPhone && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.custSecondaryPhone}</span>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Alternative Phone</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fas fa-phone form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <input type="text" className="form-input" placeholder="e.g. +9665XXXXXXXX" value={custAltPhone} onChange={(e) => setCustAltPhone(e.target.value)} style={{ paddingLeft: "42px", width: "100%", borderColor: errors.custAltPhone ? "#ef4444" : undefined }} />
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
              <div>
                <div style={{ borderBottom: "1px solid #edf2f9", marginBottom: "20px", paddingBottom: "10px" }}>
                  <h3 style={{ color: "var(--dark-color)", margin: 0, fontSize: "18px", fontWeight: "700" }}>
                    <i className="fa-solid fa-route" style={{ marginRight: "10px", color: "var(--primary-color)" }}></i> Step 2: Transport Route & Sector Selection
                  </h3>
                </div>

                <div className="form-grid">
                  {/* Pickup Date */}
                  <div>
                    <label className="form-label">Pick up Date *</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fas fa-calendar-day form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <input
                        type="date"
                        className="form-input"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        required
                        style={{ paddingLeft: "42px", width: "100%", borderColor: errors.pickupDate ? "#ef4444" : undefined }}
                      />
                    </div>
                    {errors.pickupDate && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.pickupDate}</span>
                    )}
                  </div>

                  {/* Pickup Time */}
                  <div>
                    <label className="form-label">Pick up Time *</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fas fa-clock form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <input
                        type="time"
                        className="form-input"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        required
                        style={{ paddingLeft: "42px", width: "100%", borderColor: errors.pickupTime ? "#ef4444" : undefined }}
                      />
                    </div>
                    {errors.pickupTime && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.pickupTime}</span>
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
                        value={pickupLocation}
                        onChange={(e) => {
                          setPickupLocation(e.target.value);
                          setShowPickupSuggestions(true);
                        }}
                        onFocus={() => setShowPickupSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 200)}
                        required
                        style={{ paddingLeft: "42px", width: "100%", borderColor: errors.pickupLocation ? "#ef4444" : undefined }}
                      />
                    </div>
                    {showPickupSuggestions && filteredPickupSuggestions.length > 0 && (
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
                        {filteredPickupSuggestions.map((loc, idx) => (
                          <div
                            key={idx}
                            onMouseDown={() => {
                              setPickupLocation(loc);
                              setShowPickupSuggestions(false);
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
                    {errors.pickupLocation && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.pickupLocation}</span>
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
                        value={dropoffLocation}
                        onChange={(e) => {
                          setDropoffLocation(e.target.value);
                          setShowDropoffSuggestions(true);
                        }}
                        onFocus={() => setShowDropoffSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowDropoffSuggestions(false), 200)}
                        required
                        style={{ paddingLeft: "42px", width: "100%", borderColor: errors.dropoffLocation ? "#ef4444" : undefined }}
                      />
                    </div>
                    {showDropoffSuggestions && filteredDropoffSuggestions.length > 0 && (
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
                        {filteredDropoffSuggestions.map((loc, idx) => (
                          <div
                            key={idx}
                            onMouseDown={() => {
                              setDropoffLocation(loc);
                              setShowDropoffSuggestions(false);
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
                    {errors.dropoffLocation && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.dropoffLocation}</span>
                    )}
                  </div>

                  {/* Timing Status */}
                  <div>
                    <label className="form-label">Timing Status</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fas fa-clock-rotate-left form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <select
                        className="form-input form-select"
                        value={timingStatus}
                        onChange={(e) => setTimingStatus(e.target.value)}
                        style={{ paddingLeft: "42px", width: "100%", borderColor: errors.timingStatus ? "#ef4444" : undefined }}
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Delayed">Delayed</option>
                        <option value="On Time">On Time</option>
                      </select>
                    </div>
                    {errors.timingStatus && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.timingStatus}</span>
                    )}
                  </div>

                  {/* Booking Status */}
                  <div>
                    <label className="form-label">Booking Status *</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fas fa-chart-simple form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <select
                        className="form-input form-select"
                        value={bookingStatus}
                        onChange={(e) => setBookingStatus(e.target.value)}
                        required
                        style={{ paddingLeft: "42px", width: "100%", borderColor: errors.bookingStatus ? "#ef4444" : undefined }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    {errors.bookingStatus && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.bookingStatus}</span>
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
                        value={adults}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAdults(val === "" ? "" : parseInt(val) || 0);
                        }}
                        style={{ paddingLeft: "42px", width: "100%", borderColor: errors.adults ? "#ef4444" : undefined }}
                      />
                    </div>
                    {errors.adults && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.adults}</span>
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
                        value={childrenCount}
                        onChange={(e) => {
                          const val = e.target.value;
                          setChildrenCount(val === "" ? "" : parseInt(val) || 0);
                        }}
                        style={{ paddingLeft: "42px", width: "100%", borderColor: errors.childrenCount ? "#ef4444" : undefined }}
                      />
                    </div>
                    {errors.childrenCount && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.childrenCount}</span>
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
                        value={bags}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBags(val === "" ? "" : parseInt(val) || 0);
                        }}
                        style={{ paddingLeft: "42px", width: "100%", borderColor: errors.bags ? "#ef4444" : undefined }}
                      />
                    </div>
                    {errors.bags && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.bags}</span>
                    )}
                  </div>

                  {/* Vehicle */}
                  <div>
                    <label className="form-label">Vehicle *</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fas fa-bus form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <select
                        className="form-input form-select"
                        value={vehicle}
                        onChange={(e) => setVehicle(e.target.value)}
                        required
                        style={{ paddingLeft: "42px", width: "100%", borderColor: errors.vehicle ? "#ef4444" : undefined }}
                      >
                        <option value="">Choose vehicle...</option>
                        {vehiclesList.map((v, i) => (
                          <option key={i} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.vehicle && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.vehicle}</span>
                    )}
                  </div>

                  {/* Package */}
                  <div className="form-group-full">
                    <label className="form-label">Package *</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fas fa-box-archive form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <select
                        className="form-input form-select"
                        value={tripPackage}
                        onChange={(e) => setTripPackage(e.target.value)}
                        required
                        style={{ paddingLeft: "42px", width: "100%", borderColor: errors.tripPackage ? "#ef4444" : undefined }}
                      >
                        <option value="">Choose package...</option>
                        {packagesList.map((p, i) => (
                          <option key={i} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.tripPackage && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.tripPackage}</span>
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
                        value={priceBeforeDiscount}
                        onChange={(e) => setPriceBeforeDiscount(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                        required
                        style={{ paddingLeft: "42px", width: "100%", borderColor: errors.priceBeforeDiscount ? "#ef4444" : undefined }}
                      />
                    </div>
                    {errors.priceBeforeDiscount && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.priceBeforeDiscount}</span>
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
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                        style={{ paddingLeft: "42px", width: "100%", borderColor: errors.discount ? "#ef4444" : undefined }}
                      />
                    </div>
                    {errors.discount && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.discount}</span>
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
                        value={finalBookingPrice.toFixed(2)}
                        readOnly
                        style={{ paddingLeft: "42px", width: "100%", background: "#f1f5f9" }}
                      />
                    </div>
                  </div>

                  {/* Cash to Receive */}
                  <div>
                    <label className="form-label">Cash to Receive</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fas fa-hand-holding-dollar form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-input"
                        placeholder="0.00"
                        value={cashToReceive}
                        onChange={(e) => setCashToReceive(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                        style={{ paddingLeft: "42px", width: "100%", borderColor: errors.cashToReceive ? "#ef4444" : undefined }}
                      />
                    </div>
                    {errors.cashToReceive && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.cashToReceive}</span>
                    )}
                  </div>

                  {/* Discount Reason */}
                  <div className="form-group-full">
                    <label className="form-label">Discount Reason</label>
                    <div className="form-input-wrapper" style={{ position: "relative" }}>
                      <i className="fas fa-quote-left form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Reason for applying discount (if any)..."
                        value={discountReason}
                        onChange={(e) => setDiscountReason(e.target.value)}
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
                            checked={tafweejRequired}
                            onChange={(e) => setTafweejRequired(e.target.checked)}
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
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
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
                        value={externalNotes}
                        onChange={(e) => setExternalNotes(e.target.value)}
                        rows={3}
                        style={{ paddingLeft: "42px", width: "100%", height: "auto", resize: "vertical", paddingTop: "12px" }}
                      />
                    </div>
                  </div>
                </div>

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
                            <input type="date" className="form-input" value={fltArrDate} onChange={(e) => setFltArrDate(e.target.value)} required={fltLeg === "Arrival" || fltLeg === "Both Legs"} style={{ paddingLeft: "15px", borderColor: errors.fltArrDate ? "#ef4444" : undefined }} />
                            {errors.fltArrDate && (
                              <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.fltArrDate}</span>
                            )}
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Arrival Time *</label>
                            <input type="time" className="form-input" value={fltArrTime} onChange={(e) => setFltArrTime(e.target.value)} required={fltLeg === "Arrival" || fltLeg === "Both Legs"} style={{ paddingLeft: "15px", borderColor: errors.fltArrTime ? "#ef4444" : undefined }} />
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
                            <input type="date" className="form-input" value={fltDepDate} onChange={(e) => setFltDepDate(e.target.value)} required={fltLeg === "Departure" || fltLeg === "Both Legs"} style={{ paddingLeft: "15px", borderColor: errors.fltDepDate ? "#ef4444" : undefined }} />
                            {errors.fltDepDate && (
                              <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.fltDepDate}</span>
                            )}
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Departure Time *</label>
                            <input type="time" className="form-input" value={fltDepTime} onChange={(e) => setFltDepTime(e.target.value)} required={fltLeg === "Departure" || fltLeg === "Both Legs"} style={{ paddingLeft: "15px", borderColor: errors.fltDepTime ? "#ef4444" : undefined }} />
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
                            <input type="date" className="form-input" value={trnArrDate} onChange={(e) => setTrnArrDate(e.target.value)} required={trnLeg === "Arrival" || trnLeg === "Both Legs"} style={{ paddingLeft: "15px", borderColor: errors.trnArrDate ? "#ef4444" : undefined }} />
                            {errors.trnArrDate && (
                              <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.trnArrDate}</span>
                            )}
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Arrival Time *</label>
                            <input type="time" className="form-input" value={trnArrTime} onChange={(e) => setTrnArrTime(e.target.value)} required={trnLeg === "Arrival" || trnLeg === "Both Legs"} style={{ paddingLeft: "15px", borderColor: errors.trnArrTime ? "#ef4444" : undefined }} />
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
                            <input type="date" className="form-input" value={trnDepDate} onChange={(e) => setTrnDepDate(e.target.value)} required={trnLeg === "Departure" || trnLeg === "Both Legs"} style={{ paddingLeft: "15px", borderColor: errors.trnDepDate ? "#ef4444" : undefined }} />
                            {errors.trnDepDate && (
                              <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.trnDepDate}</span>
                            )}
                          </div>
                          <div>
                            <label className="form-label" style={{ color: "#475569" }}>Departure Time *</label>
                            <input type="time" className="form-input" value={trnDepTime} onChange={(e) => setTrnDepTime(e.target.value)} required={trnLeg === "Departure" || trnLeg === "Both Legs"} style={{ paddingLeft: "15px", borderColor: errors.trnDepTime ? "#ef4444" : undefined }} />
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
                          <option value="Makkah">Makkah Mukarramah</option>
                          <option value="Madinah">Madinah Munawwarah</option>
                          <option value="Jeddah">Jeddah</option>
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
                      <input type="date" className="form-input" value={hotelCheckin} onChange={(e) => setHotelCheckin(e.target.value)} style={{ paddingLeft: "15px", borderColor: errors.hotelCheckin ? "#ef4444" : undefined }} />
                      {errors.hotelCheckin && (
                        <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.hotelCheckin}</span>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Check-Out Date *</label>
                      <input type="date" className="form-input" value={hotelCheckout} onChange={(e) => setHotelCheckout(e.target.value)} style={{ paddingLeft: "15px", borderColor: errors.hotelCheckout ? "#ef4444" : undefined }} />
                      {errors.hotelCheckout && (
                        <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>{errors.hotelCheckout}</span>
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
