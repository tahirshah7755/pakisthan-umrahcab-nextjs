"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";
import { getSaudiTodayDate } from "@/utils/formatters";
import { countryCodesList } from "@/utils/countriesData";

interface VehicleOption {
  name: string;
  type: string;
  capacity: string;
  luggage: string;
  price: number;
  icon: string;
}

export default function PublicHomePage() {
  const router = useRouter();
  const { settings: websiteSettings } = useWebsiteSettings();

  const siteTitle = websiteSettings?.site_title || "";
  const sitePhone = websiteSettings?.contact_phone || "";
  const siteEmail = websiteSettings?.contact_email || "";
  const siteAddress = websiteSettings?.contact_address || "";
  const cleanPhone = sitePhone.replace(/[^0-9]/g, "");
  let whatsappLink = websiteSettings?.whatsapp_link || "";
  if (whatsappLink) {
    if (!whatsappLink.startsWith("http://") && !whatsappLink.startsWith("https://")) {
      const cleanNum = whatsappLink.replace(/[^0-9]/g, "");
      if (/^\d+$/.test(cleanNum)) {
        whatsappLink = `https://wa.me/${cleanNum}`;
      } else {
        whatsappLink = `https://${whatsappLink}`;
      }
    }
  } else if (cleanPhone) {
    whatsappLink = `https://wa.me/${cleanPhone}?text=HI`;
  } else {
    whatsappLink = "#contact";
  }


  // Default offers array with individual distinct background images
  const defaultOffers = [
    { 
      vehicle: "Sedan", 
      route: "Madinah Hotel to Jeddah Airport", 
      price: 300, 
      icon: "fa-car", 
      bg_image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80" 
    },
    { 
      vehicle: "Ford Taurus", 
      route: "Madinah Hotel to Jeddah Airport", 
      price: 400, 
      icon: "fa-car-side", 
      bg_image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1600&q=80" 
    },
    { 
      vehicle: "Hyundai H-1", 
      route: "Madinah Hotel to Makkah Hotel", 
      price: 500, 
      icon: "fa-van-shuttle", 
      bg_image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1600&q=80" 
    },
    { 
      vehicle: "GMC Yukon XL", 
      route: "Makkah Hotel to Madinah Hotel", 
      price: 550, 
      icon: "fa-suv", 
      bg_image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1600&q=80" 
    },
    { 
      vehicle: "Toyota HI ACE", 
      route: "Madinah Hotel to Makkah Hotel", 
      price: 550, 
      icon: "fa-bus", 
      bg_image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1600&q=80" 
    }
  ];

  // Parse offers from website settings or use default
  const offers = React.useMemo(() => {
    if (websiteSettings?.homepage_offers) {
      try {
        const parsed = JSON.parse(websiteSettings.homepage_offers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.warn("Failed to parse websiteSettings.homepage_offers:", e);
      }
    }
    return defaultOffers;
  }, [websiteSettings?.homepage_offers]);

  const [activeOffer, setActiveOffer] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveOffer((prev) => (prev + 1) % offers.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [offers.length]);

  const handleNextOffer = () => setActiveOffer((prev) => (prev + 1) % offers.length);
  const handlePrevOffer = () => setActiveOffer((prev) => (prev - 1 + offers.length) % offers.length);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 40) {
      handleNextOffer();
    } else if (distance < -40) {
      handlePrevOffer();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Booking Wizard State
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState<{
    pickup: string;
    destination: string;
    date: string;
    time: string;
    passengers: string;
    luggage: string;
    carType: string;
    carPrice: number;
    fullName: string;
    email: string;
    whatsapp: string;
    flightNo: string;
    notes: string;
  }>({
    pickup: "",
    destination: "",
    date: "",
    time: "",
    passengers: "1",
    luggage: "2",
    carType: "Sedan",
    carPrice: 300,
    fullName: "",
    email: "",
    whatsapp: "",
    flightNo: "",
    notes: ""
  });

  // Local state for split WhatsApp number
  const [whatsappCode, setWhatsappCode] = useState("+966");
  const [whatsappLocal, setWhatsappLocal] = useState("");

  // Sort countryCodesList placing the common/popular country codes first
  const sortedCountryCodes = React.useMemo(() => {
    const popularCodes = ["+966", "+92", "+880", "+91", "+971", "+44", "+1"];
    const popular = countryCodesList.filter(c => popularCodes.includes(c.code));
    const others = countryCodesList.filter(c => !popularCodes.includes(c.code));
    
    // Deduplicate popular ones
    const uniquePopularMap = new Map();
    popular.forEach(c => {
      if (!uniquePopularMap.has(c.code)) {
        uniquePopularMap.set(c.code, c);
      }
    });
    const uniquePopular = Array.from(uniquePopularMap.values());
    uniquePopular.sort((a, b) => popularCodes.indexOf(a.code) - popularCodes.indexOf(b.code));
    return [...uniquePopular, ...others];
  }, []);

  // Sync state values to bookingData.whatsapp
  useEffect(() => {
    const cleanedLocal = whatsappLocal.replace(/[^0-9]/g, "");
    if (cleanedLocal) {
      setBookingData(prev => ({
        ...prev,
        whatsapp: `${whatsappCode}${cleanedLocal}`
      }));
    } else {
      setBookingData(prev => ({
        ...prev,
        whatsapp: ""
      }));
    }
  }, [whatsappCode, whatsappLocal]);

  // Dynamic Data & Checkout States
  const [locationsList, setLocationsList] = useState<string[]>([]);
  const [allRates, setAllRates] = useState<any[]>([]);
  const [publicFleet, setPublicFleet] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch locations, public rates, and public fleet on mount
  useEffect(() => {
    async function loadPublicData() {
      try {
        const locs = await api.getLocations();
        let parsedLocs: string[] = [];
        if (Array.isArray(locs)) {
          parsedLocs = locs
            .map((l: any) => (typeof l === "string" ? l : l?.name))
            .filter((name: any): name is string => Boolean(name && typeof name === "string" && name.trim().length > 0));
        }
        // Deduplicate location names
        setLocationsList(Array.from(new Set(parsedLocs)));
        
        const rates = await api.getPublicRates();
        setAllRates(rates || []);

        const fleet = await api.getPublicFleet();
        setPublicFleet(fleet || []);
      } catch (err) {
        console.error("Failed to fetch public booking data:", err);
      }
    }
    loadPublicData();
  }, []);

  // Helper to find pricing route match with smart location normalization
  const findRouteMatch = (pickup: string, destination: string) => {
    if (!pickup || !destination || allRates.length === 0) return null;

    const clean = (str: string) =>
      str
        .toLowerCase()
        .replace(/\(jed\)/g, "")
        .replace(/- terminal \d+/gi, "")
        .replace(/- north terminal/gi, "")
        .replace(/\(haramain\)/gi, "")
        .replace(/\(.*?\)/g, "")
        .replace(/[^a-z0-9]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const pClean = clean(pickup);
    const dClean = clean(destination);

    if (!pClean || !dClean) return null;

    const match1 = `${pClean} to ${dClean}`;
    const match2 = `${dClean} to ${pClean}`;

    // 1. Try exact match first
    const exact = allRates.find((r) => {
      const rClean = clean(r.route);
      return rClean === match1 || rClean === match2;
    });
    if (exact) return exact;

    // 2. Score each route in allRates for the best match based on word overlap density
    let bestRoute: any = null;
    let bestScore = -1;

    allRates.forEach((r) => {
      const rClean = clean(r.route);
      const parts = rClean.split(" to ");
      if (parts.length < 2) return;

      const sideA = parts[0].trim();
      const sideB = parts[1].trim();

      const getOverlapScore = (loc1: string, side1: string, loc2: string, side2: string) => {
        const w1 = new Set(loc1.split(" ").filter(w => w.length > 0));
        const w2 = new Set(loc2.split(" ").filter(w => w.length > 0));
        const s1 = new Set(side1.split(" ").filter(w => w.length > 0));
        const s2 = new Set(side2.split(" ").filter(w => w.length > 0));

        let overlap1 = 0;
        w1.forEach(w => { if (s1.has(w)) overlap1++; });

        let overlap2 = 0;
        w2.forEach(w => { if (s2.has(w)) overlap2++; });

        // Both pickup and destination must match at least one word on their respective side
        if (overlap1 === 0 || overlap2 === 0) return 0;

        // Normalise by word counts to reward higher specificity and prevent bias towards long strings
        const score = (overlap1 / Math.max(w1.size, s1.size)) + (overlap2 / Math.max(w2.size, s2.size));
        return score;
      };

      const scoreForward = getOverlapScore(pClean, sideA, dClean, sideB);
      const scoreBackward = getOverlapScore(pClean, sideB, dClean, sideA);
      const score = Math.max(scoreForward, scoreBackward);

      if (score > bestScore && score > 0.3) {
        bestScore = score;
        bestRoute = r;
      }
    });

    if (bestRoute) return bestRoute;

    // 3. Fallback check: match main city/location keywords
    const cities = ["jeddah", "makkah", "madinah", "taif", "yanbu"];
    const pCity = cities.find(c => pClean.includes(c));
    const dCity = cities.find(c => dClean.includes(c));

    if (pCity && dCity && pCity !== dCity) {
      const fallback = allRates.find((r) => {
        const rClean = clean(r.route);
        return rClean.includes(pCity) && rClean.includes(dCity);
      });
      if (fallback) return fallback;
    }

    return null;
  };

  const defaultVehicles = [
    { name: "Sedan", type: "Economy", capacity: "4 Passengers", luggage: "2 Bags", price: 300, icon: "fa-car" },
    { name: "Ford Taurus", type: "Premium Sedan", capacity: "4 Passengers", luggage: "3 Bags", price: 400, icon: "fa-car-side" },
    { name: "Hyundai H-1 / Staria", type: "Family Van", capacity: "7 Passengers", luggage: "5 Bags", price: 500, icon: "fa-van-shuttle" },
    { name: "GMC Yukon XL", type: "Luxury SUV", capacity: "7 Passengers", luggage: "6 Bags", price: 550, icon: "fa-suv" },
    { name: "Toyota HI ACE", type: "Large Minivan", capacity: "10 Passengers", luggage: "8 Bags", price: 550, icon: "fa-bus" }
  ];

  // Dynamically calculate vehicles and prices based on fleet database & route selection
  const currentVehicles = React.useMemo(() => {
    const match = findRouteMatch(bookingData.pickup, bookingData.destination);

    let custom: any = {};
    if (match && match.custom_prices) {
      try {
        custom = typeof match.custom_prices === 'string' ? JSON.parse(match.custom_prices) : match.custom_prices;
      } catch (e) {}
    }

    const resolveMeta = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes("taurus")) {
        return { type: "Premium Sedan", capacity: "4 Passengers", luggage: "3 Bags", maxPassengers: 4, icon: "fa-car-side" };
      }
      if (lower.includes("camry") || lower.includes("camery") || lower.includes("accord") || lower.includes("sonata") || lower.includes("sedan") || lower.includes("corolla") || lower.includes("civic")) {
        return { type: "Standard Sedan", capacity: "4 Passengers", luggage: "3 Bags", maxPassengers: 4, icon: "fa-car-side" };
      }
      if (lower.includes("staria") || lower.includes("starex") || lower.includes("h-1") || lower.includes("h1") || lower.includes("van")) {
        return { type: "Family Van", capacity: "7 Passengers", luggage: "5 Bags", maxPassengers: 7, icon: "fa-van-shuttle" };
      }
      if (lower.includes("yukon") || lower.includes("suv") || lower.includes("gmc") || lower.includes("tahoe") || lower.includes("prado")) {
        return { type: "Luxury SUV", capacity: "7 Passengers", luggage: "6 Bags", maxPassengers: 7, icon: "fa-suv" };
      }
      if (lower.includes("hiace") || lower.includes("hi ace") || lower.includes("bus") || lower.includes("coaster") || lower.includes("coach") || lower.includes("grand cabin")) {
        return { type: "Large Minivan", capacity: "10 Passengers", luggage: "8 Bags", maxPassengers: 10, icon: "fa-bus" };
      }
      return { type: "Standard Sedan", capacity: "4 Passengers", luggage: "3 Bags", maxPassengers: 4, icon: "fa-car" };
    };

    const resolvePrice = (name: string) => {
      const lower = name.toLowerCase();
      
      if (custom[name]?.price) return Number(custom[name].price);
      if (typeof custom[name] === "number") return custom[name];

      if (lower.includes("taurus")) {
        if (custom.taurus_price) return Number(custom.taurus_price);
        const sedanP = Number(custom.sedan_price || match?.sedan_price) || 300;
        return sedanP + 100;
      }
      if (lower.includes("staria") || lower.includes("starex") || lower.includes("h-1") || lower.includes("h1") || lower.includes("van")) {
        return Number(custom.van_price || match?.van_price) || 500;
      }
      if (lower.includes("yukon") || lower.includes("suv") || lower.includes("gmc") || lower.includes("tahoe") || lower.includes("prado")) {
        return Number(custom.suv_price || match?.suv_price) || 550;
      }
      if (lower.includes("hiace") || lower.includes("hi ace") || lower.includes("bus") || lower.includes("coaster") || lower.includes("coach") || lower.includes("grand cabin")) {
        return Number(custom.coach_price || match?.coach_price) || 550;
      }
      return Number(custom.sedan_price || match?.sedan_price) || 300;
    };

    const reqPassengers = (() => {
      const p = String(bookingData.passengers || "1");
      if (p === "1-4") return 1;
      if (p === "5-7") return 5;
      if (p === "8-10") return 8;
      if (p === "10+") return 10;
      const num = parseInt(p.replace(/[^0-9]/g, ""), 10);
      return isNaN(num) ? 1 : num;
    })();

    const reqLuggage = (() => {
      const l = String(bookingData.luggage || "0");
      const num = parseInt(l.replace(/[^0-9]/g, ""), 10);
      return isNaN(num) ? 0 : num;
    })();

    let vehicles = [];
    if (publicFleet.length > 0) {
      vehicles = publicFleet.map((f: any) => {
        const meta = resolveMeta(f.model);
        const price = resolvePrice(f.model);
        const maxPassengers = Number(f.capacity) || meta.maxPassengers;
        const maxLuggage = f.luggage !== undefined && f.luggage !== null ? Number(f.luggage) : (meta.luggage ? parseInt(meta.luggage.replace(/[^0-9]/g, ""), 10) : 2);
        const capacityText = `${maxPassengers} Passengers`;
        const luggageText = `${maxLuggage} Bags`;
        return {
          name: f.model,
          type: meta.type,
          capacity: capacityText,
          luggage: luggageText,
          maxPassengers: maxPassengers,
          maxLuggage: maxLuggage,
          price: price,
          icon: meta.icon
        };
      });
    } else {
      vehicles = defaultVehicles.map(v => {
        const meta = resolveMeta(v.name);
        const sedanPrice = Number(custom.sedan_price || match?.sedan_price) || 300;
        const taurusPrice = Number(custom.taurus_price || custom.ford_taurus_price) || (sedanPrice + 100);
        const vanPrice = Number(custom.van_price || match?.van_price) || 500;
        const suvPrice = Number(custom.suv_price || match?.suv_price) || 550;
        const coachPrice = Number(custom.coach_price || match?.coach_price) || (vanPrice + 50);

        let price = sedanPrice;
        if (v.name.includes("Taurus")) price = taurusPrice;
        else if (v.name.includes("H-1")) price = vanPrice;
        else if (v.name.includes("Yukon")) price = suvPrice;
        else if (v.name.includes("HI ACE")) price = coachPrice;

        return {
          ...v,
          price,
          maxPassengers: meta.maxPassengers,
          maxLuggage: meta.luggage ? parseInt(meta.luggage.replace(/[^0-9]/g, ""), 10) : 2
        };
      });
    }

    const filtered = vehicles.filter(v => v.maxPassengers >= reqPassengers && v.maxLuggage >= reqLuggage);
    return filtered.length > 0 ? filtered : vehicles;
  }, [bookingData.pickup, bookingData.destination, bookingData.passengers, bookingData.luggage, allRates, publicFleet]);

  // Step validation rules for strict tab progression
  const isStep1Complete = Boolean(
    bookingData.pickup &&
    bookingData.destination &&
    bookingData.pickup !== bookingData.destination &&
    bookingData.date &&
    bookingData.time
  );

  const isStep2Complete = isStep1Complete && Boolean(bookingData.carType && bookingData.carPrice);

  const isStep3Complete = isStep2Complete && Boolean(bookingData.fullName?.trim() && bookingData.whatsapp?.trim());

  const handleStepTabClick = (targetStep: number) => {
    if (targetStep === 1) {
      setStep(1);
      return;
    }
    if (targetStep === 2) {
      if (!isStep1Complete) {
        if (!bookingData.pickup || !bookingData.destination || !bookingData.date || !bookingData.time) {
          alert("Please fill in all location and timing details in Step 1 first.");
        } else if (bookingData.pickup === bookingData.destination) {
          alert("Pickup and Drop-off locations cannot be the same.");
        }
        return;
      }
      setStep(2);
      return;
    }
    if (targetStep === 3) {
      if (!isStep1Complete) {
        alert("Please complete Step 1 (Route details) first.");
        return;
      }
      if (!isStep2Complete) {
        alert("Please select a vehicle in Step 2 first.");
        return;
      }
      setStep(3);
      return;
    }
    if (targetStep === 4) {
      if (!isStep1Complete) {
        alert("Please complete Step 1 (Route details) first.");
        return;
      }
      if (!isStep2Complete) {
        alert("Please select a vehicle in Step 2 first.");
        return;
      }
      if (!isStep3Complete) {
        alert("Please fill in your Name & WhatsApp number in Step 3 first.");
        return;
      }
      setStep(4);
      return;
    }
  };

  const handleCarSelect = (name: string, price: number) => {
    setBookingData((prev) => ({ ...prev, carType: name, carPrice: price }));
    setStep(3);
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!bookingData.pickup || !bookingData.destination || !bookingData.date || !bookingData.time) {
        alert("Please fill in all location and timing details.");
        return;
      }
      if (bookingData.date < getSaudiTodayDate()) {
        alert("Pickup Date cannot be in the past.");
        return;
      }
      if (bookingData.pickup === bookingData.destination) {
        alert("Pickup and Drop-off locations cannot be the same.");
        return;
      }
      
      // Auto-set the price of the first vehicle in the selected route list so the state is consistent
      const firstVehicle = currentVehicles[0];
      setBookingData((prev) => ({ ...prev, carType: firstVehicle.name, carPrice: firstVehicle.price }));
    }
    if (step === 3) {
      if (!bookingData.fullName || !bookingData.whatsapp) {
        alert("Full Name and WhatsApp number are required.");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Save to Laravel backend via API wrapper
      const res = await api.createBooking({
        pickup: bookingData.pickup,
        destination: bookingData.destination,
        date: bookingData.date,
        time: bookingData.time,
        passengers: bookingData.passengers,
        car_type: bookingData.carType,
        car_price: bookingData.carPrice,
        full_name: bookingData.fullName,
        email: bookingData.email || `${bookingData.fullName.toLowerCase().replace(/\s+/g, "")}@example.com`,
        whatsapp: bookingData.whatsapp,
        flight_no: bookingData.flightNo,
        notes: bookingData.notes
      });

      const rawCode = res?.data?.booking_code || res?.data?.id;
      const bookingCode = rawCode ? String(rawCode) : ("BK-" + Math.floor(10000 + Math.random() * 90000));
      
      const whatsappMsg = `Assalamu Alaikum, I would like to book a cab.\n\n*Booking Summary*:\n• Code: ${bookingCode}\n• From: ${bookingData.pickup}\n• To: ${bookingData.destination}\n• Date: ${bookingData.date} @ ${bookingData.time}\n• Vehicle: ${bookingData.carType} (${bookingData.carPrice} SAR)\n• Client: ${bookingData.fullName}\n• WhatsApp: ${bookingData.whatsapp}\n\nPlease confirm my booking.`;
      const encoded = encodeURIComponent(whatsappMsg);

      const targetWa = whatsappLink && whatsappLink !== "#contact" ? whatsappLink.split('?')[0] : (cleanPhone ? `https://wa.me/${cleanPhone}` : "https://wa.me/");
      window.open(`${targetWa}?text=${encoded}`, "_blank");
      alert(`Your booking has been compiled successfully! Booking Reference: ${bookingCode}. Redirecting you to WhatsApp for immediate dispatcher assignment.`);
      router.push("/public-site/booking-status");
    } catch (err) {
      console.error(err);
      alert("Failed to submit WhatsApp booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOnlineOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await api.createIndividualOrder({
        pickup: bookingData.pickup,
        destination: bookingData.destination,
        date: bookingData.date,
        time: bookingData.time,
        passengers: bookingData.passengers,
        car_type: bookingData.carType,
        car_price: bookingData.carPrice,
        full_name: bookingData.fullName,
        email: bookingData.email || `${bookingData.fullName.toLowerCase().replace(/\s+/g, "")}@example.com`,
        whatsapp: bookingData.whatsapp,
        flight_no: bookingData.flightNo,
        notes: bookingData.notes
      });
      if (res && res.invoice) {
        alert("Your independent booking order has been created! Redirecting to secure invoice page.");
        router.push(`/public-site/invoice/${res.invoice.invoice_code}`);
      } else {
        alert("Failed to create order. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting independent booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVehicleSpecs = (vehicleName?: string) => {
    const v = (vehicleName || "").toLowerCase();
    if (v.includes("hiace") || v.includes("hi ace") || v.includes("bus") || v.includes("coaster") || v.includes("grand cabin")) {
      return { seats: "10-13 Seats", luggage: "8-10 Bags", type: "Executive Van / Minibus", icon: "fa-van-shuttle" };
    }
    if (v.includes("gmc") || v.includes("yukon") || v.includes("suv") || v.includes("tahoe") || v.includes("prado")) {
      return { seats: "6-7 Seats", luggage: "5-6 Bags", type: "Luxury VIP SUV", icon: "fa-car-side" };
    }
    if (v.includes("staria") || v.includes("starex") || v.includes("h-1") || v.includes("h1") || v.includes("van")) {
      return { seats: "7 Seats", luggage: "4-5 Bags", type: "Family MPV", icon: "fa-van-shuttle" };
    }
    if (v.includes("taurus") || v.includes("accord") || v.includes("business")) {
      return { seats: "4 Seats", luggage: "3 Bags", type: "Business Sedan", icon: "fa-car" };
    }
    return { seats: "4 Seats", luggage: "3 Bags", type: "Standard Sedan", icon: "fa-car" };
  };

  const currentActiveOffer = offers[activeOffer] || offers[0] || {};
  const activeSlideBg = currentActiveOffer.bg_image || currentActiveOffer.image || websiteSettings?.hero_bg_image || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80";

  const getVehicleImage = (vehicleName?: string, customImage?: string) => {
    if (customImage && (customImage.startsWith("http") || customImage.startsWith("data:") || customImage.startsWith("/"))) {
      return customImage;
    }
    const v = (vehicleName || "").toLowerCase();
    if (v.includes("camry") || v.includes("camery") || v.includes("sedan") || v.includes("sonata")) {
      return "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=600&q=80";
    }
    if (v.includes("gmc") || v.includes("yukon") || v.includes("suv") || v.includes("tahoe") || v.includes("prado")) {
      return "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80";
    }
    if (v.includes("staria") || v.includes("starex") || v.includes("h-1") || v.includes("h1") || v.includes("van")) {
      return "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80";
    }
    if (v.includes("hiace") || v.includes("hi ace") || v.includes("bus") || v.includes("coaster") || v.includes("coach") || v.includes("grand cabin")) {
      return "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=600&q=80";
    }
    if (v.includes("taurus") || v.includes("ford") || v.includes("accord")) {
      return "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80";
    }
    return "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80";
  };

  return (
    <div>
      {/* ===== HERO SLIDER WITH BOOKING WIDGET ===== */}
      <section 
        className="uc-hero"
        style={{
          backgroundImage: `linear-gradient(rgba(10, 13, 18, 0.82), rgba(13, 17, 23, 0.90)), url("${activeSlideBg}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          transition: "background-image 0.8s ease-in-out"
        }}
      >
        <div className="uc-hero-grid" style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", padding: "0 24px", display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "36px", alignItems: "center" }}>
          <div>
            <div
              className="uc-carousel-wrapper"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {offers.map((offer, idx) => {
                const specs = getVehicleSpecs(offer.vehicle);
                const isSelected = idx === activeOffer;
                const routes = (offer.route || "").split(" to ");
                const fromLoc = routes[0] || offer.route || "Pick-up";
                const toLoc = routes[1] || "Destination";
                const directWaMsg = encodeURIComponent(`Salam, I want to book the ${offer.vehicle} offer (${offer.route}) for ${offer.price} SAR.`);
                const targetWa = (whatsappLink.includes('?') ? whatsappLink.split('?')[0] : whatsappLink) + `?text=${directWaMsg}`;

                return (
                  <div key={idx} className={`uc-slide ${isSelected ? "active" : ""}`}>
                    <div className="uc-hero-text-container">
                      {/* Top Header Strip */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <span className="uc-badge-hot">
                          <i className="fas fa-crown" style={{ marginRight: "6px", color: "#f5d020" }}></i> Mega Offer
                        </span>
                        <div className="uc-slide-counter">
                          <span style={{ color: "var(--uc-primary)", fontWeight: 800 }}>0{idx + 1}</span>
                          <span style={{ color: "#6e7681", margin: "0 4px" }}>/</span>
                          <span>0{offers.length}</span>
                        </div>
                      </div>

                      {/* Vehicle Header & Price Row (Side by side on desktop, stacked on mobile) */}
                      <div className="uc-hero-main-row">
                        {/* Title & Type */}
                        <div className="uc-hero-title-col">
                          <h1 className="uc-offer-vehicle" style={{ margin: 0, textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>{offer.vehicle}</h1>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "6px" }}>
                            <span className="uc-vehicle-pill-type" style={{ background: "rgba(200, 168, 75, 0.2)", backdropFilter: "blur(4px)" }}>{specs.type}</span>
                            <div className="uc-vehicle-mini-icon">
                              <i className={`fas ${specs.icon || 'fa-car'}`}></i>
                            </div>
                          </div>
                        </div>

                        {/* Price & All-inclusive tag */}
                        <div className="uc-hero-price-col">
                          <div className="uc-hero-price-wrap">
                            <span className="uc-hero-price-amount">{offer.price}</span>
                            <span className="uc-hero-price-currency">SAR</span>
                          </div>
                          <span className="uc-hero-price-label">All-inclusive Rate</span>
                        </div>
                      </div>

                      <div className="uc-hero-divider"></div>
                      
                      {/* Action Buttons */}
                      <div className="uc-slide-actions">
                        <a href={targetWa} target="_blank" rel="noopener noreferrer" className="uc-btn-whatsapp">
                          <i className="fab fa-whatsapp"></i> Book via WhatsApp
                        </a>
                        <button onClick={() => {
                          setBookingData((prev) => ({
                            ...prev,
                            pickup: fromLoc,
                            destination: toLoc,
                            carType: offer.vehicle,
                            carPrice: offer.price
                          }));
                          setStep(1);
                          document.getElementById("booking-wizard")?.scrollIntoView({ behavior: "smooth" });
                        }} className="uc-btn-outline" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(4px)" }}>
                          <i className="fas fa-sliders"></i> Custom Booking
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Slider Interactive Thumbnails & Controls */}
            <div className="uc-slider-bottom-bar">
              {/* Slider Dots/Indicators */}
              <div className="uc-slider-dots">
                {offers.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveOffer(idx)}
                    className={`uc-slider-dot-btn ${idx === activeOffer ? "active" : ""}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Next/Prev Arrow Controls */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button onClick={handlePrevOffer} className="uc-slider-nav-btn" aria-label="Previous Slide">
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button onClick={handleNextOffer} className="uc-slider-nav-btn" aria-label="Next Slide">
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Intro Box */}
          <div style={{ background: "rgba(22,27,34,0.7)", border: "1px solid #30363d", borderRadius: "20px", padding: "32px", backdropFilter: "blur(8px)" }}>
            <h2 style={{ color: "#fff", fontSize: "24px", fontWeight: 700, marginBottom: "16px" }}>
              {websiteSettings?.hero_title || "Book now & Pay at Destination"}
            </h2>
            <p style={{ color: "#8b949e", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
              {websiteSettings?.hero_desc || "Experience smooth and affordable transportation services across Makkah, Madinah, and Jeddah. No credit card required. Cash payment accepted upon arrival."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <i className="fas fa-check-circle" style={{ color: "var(--uc-primary)", fontSize: "18px" }}></i>
                <span style={{ color: "#d0d7de", fontSize: "14px" }}>
                  {websiteSettings?.feature_1 || "Experienced, multi-lingual local drivers"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <i className="fas fa-check-circle" style={{ color: "var(--uc-primary)", fontSize: "18px" }}></i>
                <span style={{ color: "#d0d7de", fontSize: "14px" }}>
                  {websiteSettings?.feature_2 || "24/7 client dispatch support"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <i className="fas fa-check-circle" style={{ color: "var(--uc-primary)", fontSize: "18px" }}></i>
                <span style={{ color: "#d0d7de", fontSize: "14px" }}>
                  {websiteSettings?.feature_3 || "100% sanitized, air-conditioned clean vehicles"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BOOKING WIZARD SECTION ===== */}
      <section id="booking-wizard" className="uc-section" style={{ borderBottom: "1px solid #e1e4e8" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span className="uc-section-label">Ride Booking</span>
          <h2 className="uc-section-title">
            {websiteSettings?.booking_title || "Schedule Your Vehicle Online"}
          </h2>
          <p className="uc-section-subtitle" style={{ margin: "0 auto" }}>
            {websiteSettings?.booking_subtitle || "Fill in the dynamic form below to configure routes, select private cars, and generate a reservation receipt."}
          </p>
        </div>

        <div className="uc-wizard-wrap">
          {/* Progress Header */}
          <div className="uc-wizard-steps">
            <div
              className={`uc-wizard-step ${step >= 1 ? "active" : ""}`}
              onClick={() => handleStepTabClick(1)}
              style={{ cursor: "pointer" }}
            >
              <span className="step-num">1</span>
              <span>Route</span>
            </div>
            <div
              className={`uc-wizard-step ${step >= 2 ? "active" : ""}`}
              onClick={() => handleStepTabClick(2)}
              style={{
                cursor: isStep1Complete ? "pointer" : "not-allowed",
                opacity: isStep1Complete ? 1 : 0.5,
              }}
              title={!isStep1Complete ? "Please complete Step 1 (Route details) first" : ""}
            >
              <span className="step-num">2</span>
              <span>Vehicle</span>
            </div>
            <div
              className={`uc-wizard-step ${step >= 3 ? "active" : ""}`}
              onClick={() => handleStepTabClick(3)}
              style={{
                cursor: isStep2Complete ? "pointer" : "not-allowed",
                opacity: isStep2Complete ? 1 : 0.5,
              }}
              title={!isStep2Complete ? "Please complete Step 1 & Step 2 first" : ""}
            >
              <span className="step-num">3</span>
              <span>Contact</span>
            </div>
            <div
              className={`uc-wizard-step ${step >= 4 ? "active" : ""}`}
              onClick={() => handleStepTabClick(4)}
              style={{
                cursor: isStep3Complete ? "pointer" : "not-allowed",
                opacity: isStep3Complete ? 1 : 0.5,
              }}
              title={!isStep3Complete ? "Please complete Step 1, 2 & 3 first" : ""}
            >
              <span className="step-num">4</span>
              <span>Summary</span>
            </div>
          </div>

          {/* Form Body */}
          <div className="uc-wizard-body">
            {/* Step 1: Locations */}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="uc-form-row">
                  <div className="uc-form-group">
                    <label className="uc-form-label">Pickup Location *</label>
                    <select
                      className="uc-form-input"
                      value={bookingData.pickup}
                      onChange={(e) => setBookingData({ ...bookingData, pickup: e.target.value })}
                    >
                      <option value="">Select location...</option>
                      {locationsList.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                  <div className="uc-form-group">
                    <label className="uc-form-label">Drop-off Destination *</label>
                    <select
                      className="uc-form-input"
                      value={bookingData.destination}
                      onChange={(e) => setBookingData({ ...bookingData, destination: e.target.value })}
                    >
                      <option value="">Select location...</option>
                      {locationsList.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="uc-form-row">
                  <div className="uc-form-group">
                    <label className="uc-form-label">Pickup Date *</label>
                    <input
                      type="date"
                      className="uc-form-input"
                      value={bookingData.date}
                      onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                      min={getSaudiTodayDate()}
                      style={{
                        borderColor: bookingData.date && bookingData.date < getSaudiTodayDate() ? "#ef4444" : undefined
                      }}
                    />
                    {bookingData.date && bookingData.date < getSaudiTodayDate() && (
                      <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: 600 }}>
                        ⚠️ Past dates are not allowed. Please select a current or future date.
                      </span>
                    )}
                  </div>
                  <div className="uc-form-group">
                    <label className="uc-form-label">Pickup Time *</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <div style={{ flex: 1, position: "relative" }}>
                        <select
                          className="uc-form-input"
                          style={{ paddingRight: "30px", appearance: "none" }}
                          value={bookingData.time ? bookingData.time.split(":")[0] : ""}
                          onChange={(e) => {
                            const h = e.target.value;
                            const m = bookingData.time ? bookingData.time.split(":")[1] || "00" : "00";
                            setBookingData({ ...bookingData, time: h ? `${h}:${m}` : "" });
                          }}
                          required
                        >
                          <option value="">Hour</option>
                          {Array.from({ length: 24 }, (_, i) => {
                            const h = i < 10 ? `0${i}` : `${i}`;
                            return (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            );
                          })}
                        </select>
                        <i className="fas fa-chevron-down" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}></i>
                      </div>
                      <div style={{ flex: 1, position: "relative" }}>
                        <select
                          className="uc-form-input"
                          style={{ paddingRight: "30px", appearance: "none" }}
                          value={bookingData.time ? bookingData.time.split(":")[1] : ""}
                          onChange={(e) => {
                            const m = e.target.value;
                            const h = bookingData.time ? bookingData.time.split(":")[0] || "12" : "12";
                            setBookingData({ ...bookingData, time: m ? `${h}:${m}` : "" });
                          }}
                          required
                        >
                          <option value="">Minute</option>
                          {(() => {
                            const currentMin = bookingData.time ? bookingData.time.split(":")[1] : "";
                            const minutes = Array.from({ length: 12 }, (_, i) => {
                              const m = i * 5;
                              return m < 10 ? `0${m}` : `${m}`;
                            });
                            if (currentMin && !minutes.includes(currentMin)) {
                              minutes.push(currentMin);
                              minutes.sort();
                            }
                            return minutes.map((mm) => (
                              <option key={mm} value={mm}>
                                {mm}
                              </option>
                            ));
                          })()}
                        </select>
                        <i className="fas fa-chevron-down" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}></i>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="uc-form-row">
                  <div className="uc-form-group">
                    <label className="uc-form-label">Number of Passengers *</label>
                    <select
                      className="uc-form-input"
                      value={bookingData.passengers}
                      onChange={(e) => setBookingData({ ...bookingData, passengers: e.target.value })}
                    >
                      <option value="1">1 Passenger</option>
                      <option value="2">2 Passengers</option>
                      <option value="3">3 Passengers</option>
                      <option value="4">4 Passengers</option>
                      <option value="5">5 Passengers</option>
                      <option value="6">6 Passengers</option>
                      <option value="7">7 Passengers</option>
                      <option value="8">8 Passengers</option>
                      <option value="9">9 Passengers</option>
                      <option value="10">10+ Passengers</option>
                    </select>
                  </div>
                  <div className="uc-form-group">
                    <label className="uc-form-label">Number of Luggage / Bags *</label>
                    <select
                      className="uc-form-input"
                      value={bookingData.luggage}
                      onChange={(e) => setBookingData({ ...bookingData, luggage: e.target.value })}
                    >
                      <option value="0">0 Bags</option>
                      <option value="1">1 Bag</option>
                      <option value="2">2 Bags</option>
                      <option value="3">3 Bags</option>
                      <option value="4">4 Bags</option>
                      <option value="5">5 Bags</option>
                      <option value="6">6 Bags</option>
                      <option value="7">7 Bags</option>
                      <option value="8">8+ Bags</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
                  <button onClick={handleNextStep} className="uc-btn-primary">
                    Select Vehicle <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Car Choice */}
            {step === 2 && (
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px" }}>Select Your Private Ride</h3>
                <div className="uc-vehicles-grid">
                  {currentVehicles.map((v) => (
                    <div
                      key={v.name}
                      onClick={() => handleCarSelect(v.name, v.price)}
                      className={`uc-vehicle-card ${bookingData.carType === v.name ? "selected" : ""}`}
                    >
                      <div style={{ width: "100%", height: "135px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px", background: "transparent", overflow: "hidden", borderRadius: "10px" }}>
                        <img 
                          src={getVehicleImage(v.name)} 
                          alt={v.name} 
                          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.15))", transition: "transform 0.3s ease" }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80";
                          }}
                        />
                      </div>
                      <div className="uc-vehicle-name">{v.name}</div>
                      <div className="uc-vehicle-cap">
                        {v.capacity} • {v.luggage}
                      </div>
                      <div className="uc-vehicle-price">{v.price} SAR</div>
                      <div style={{ fontSize: "11px", color: "var(--uc-muted)", marginTop: "4px", fontWeight: 600 }}>{v.type}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px" }}>
                  <button onClick={handlePrevStep} className="uc-btn-outline">
                    <i className="fas fa-arrow-left"></i> Back
                  </button>
                  <button onClick={handleNextStep} className="uc-btn-primary">
                    Enter Info <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Contact */}
            {step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="uc-form-row">
                  <div className="uc-form-group">
                    <label className="uc-form-label">Full Name *</label>
                    <input
                      type="text"
                      placeholder="Your name..."
                      className="uc-form-input"
                      value={bookingData.fullName}
                      onChange={(e) => setBookingData({ ...bookingData, fullName: e.target.value })}
                    />
                  </div>
                  <div className="uc-form-group">
                    <label className="uc-form-label">WhatsApp Number *</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <div style={{ width: "135px", position: "relative" }}>
                        <select
                          className="uc-form-input"
                          style={{ width: "100%", paddingRight: "28px", appearance: "none" }}
                          value={whatsappCode}
                          onChange={(e) => setWhatsappCode(e.target.value)}
                        >
                          {sortedCountryCodes.map((c) => (
                            <option key={`${c.code}-${c.name}`} value={c.code}>
                              {c.flag} {c.code}
                            </option>
                          ))}
                        </select>
                        <i className="fas fa-chevron-down" style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}></i>
                      </div>
                      <input
                        type="tel"
                        placeholder="e.g. 501234567"
                        className="uc-form-input"
                        style={{ flex: 1 }}
                        value={whatsappLocal}
                        onChange={(e) => setWhatsappLocal(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="uc-form-row">
                  <div className="uc-form-group">
                    <label className="uc-form-label">Email Address</label>
                    <input
                      type="email"
                      placeholder="email@domain.com..."
                      className="uc-form-input"
                      value={bookingData.email}
                      onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                    />
                  </div>
                  <div className="uc-form-group">
                    <label className="uc-form-label">Flight Carrier No (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. SV-812..."
                      className="uc-form-input"
                      value={bookingData.flightNo}
                      onChange={(e) => setBookingData({ ...bookingData, flightNo: e.target.value })}
                    />
                  </div>
                </div>

                <div className="uc-form-group">
                  <label className="uc-form-label">Special Notes / Requests</label>
                  <textarea
                    rows={3}
                    placeholder="Child seat, wheelchair, extra luggage requests..."
                    className="uc-form-input"
                    value={bookingData.notes}
                    onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
                  <button onClick={handlePrevStep} className="uc-btn-outline">
                    <i className="fas fa-arrow-left"></i> Back
                  </button>
                  <button onClick={handleNextStep} className="uc-btn-primary">
                    Summary <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Summary */}
            {step === 4 && (
              <div>
                <div style={{ background: "#f8f9fa", border: "1px solid #e1e4e8", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: 700, borderBottom: "1px solid #e1e4e8", paddingBottom: "10px", marginBottom: "16px" }}>Booking Reservation Summary</h4>
                  
                  <div className="uc-summary-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "14px" }}>
                    <div>
                      <span style={{ color: "var(--uc-muted)" }}>Route Trip:</span>
                      <p style={{ fontWeight: 600 }}>{bookingData.pickup} → {bookingData.destination}</p>
                    </div>
                    <div>
                      <span style={{ color: "var(--uc-muted)" }}>Date & Time:</span>
                      <p style={{ fontWeight: 600 }}>{bookingData.date} @ {bookingData.time}</p>
                    </div>
                    <div>
                      <span style={{ color: "var(--uc-muted)" }}>Vehicle Choice:</span>
                      <p style={{ fontWeight: 600, color: "var(--uc-primary)" }}>{bookingData.carType}</p>
                    </div>
                    <div>
                      <span style={{ color: "var(--uc-muted)" }}>Total Fare Price:</span>
                      <p style={{ fontWeight: 700 }}>{bookingData.carPrice} SAR</p>
                    </div>
                    <div>
                      <span style={{ color: "var(--uc-muted)" }}>Passenger Name:</span>
                      <p style={{ fontWeight: 600 }}>{bookingData.fullName}</p>
                    </div>
                    <div>
                      <span style={{ color: "var(--uc-muted)" }}>WhatsApp Contact:</span>
                      <p style={{ fontWeight: 600 }}>{bookingData.whatsapp}</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px", marginTop: "32px" }}>
                  <button onClick={handlePrevStep} className="uc-btn-outline" style={{ padding: "14px 24px" }}>
                    <i className="fas fa-arrow-left"></i> Back
                  </button>
                  
                  <button 
                    onClick={handleOnlineOrderSubmit} 
                    disabled={isSubmitting}
                    className="uc-btn-primary" 
                    style={{ 
                      background: "linear-gradient(135deg, #059669 0%, #047857 100%)", 
                      color: "#fff", 
                      flex: 1, 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      gap: "10px", 
                      padding: "14px 24px",
                      fontSize: "16px",
                      fontWeight: "700",
                      borderRadius: "10px",
                      boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
                      cursor: "pointer"
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fas fa-circle-notch fa-spin"></i> Generating Invoice & Saving Order...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-file-invoice-dollar"></i> Confirm Order & Generate Invoice
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== VEHICLE PRICING SECTION ===== */}
      <section className="uc-section" style={{ borderBottom: "1px solid #e1e4e8" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span className="uc-section-label">Our Fleet</span>
          <h2 className="uc-section-title">Special Fare Route Rates</h2>
          <p className="uc-section-subtitle" style={{ margin: "0 auto" }}>Browse Makkah ↔ Madinah ↔ Jeddah Airport direct transport price listings.</p>
        </div>

        <div className="uc-offers-grid">
          {offers.map((offer, idx) => {
            const specs = getVehicleSpecs(offer.vehicle);
            return (
              <div key={idx} className="uc-offer-card">
                <span className="uc-offer-card-badge">Special Promo</span>
                <h3 className="uc-offer-card-vehicle">{offer.vehicle}</h3>
                
                {/* Vehicle Picture Frame */}
                <div className="uc-offer-card-img-wrap">
                  <img 
                    src={getVehicleImage(offer.vehicle, offer.image || offer.bg_image)} 
                    alt={offer.vehicle || "Vehicle"} 
                    className="uc-offer-card-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                </div>

                <div className="uc-offer-card-route">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{offer.route}</span>
                </div>

                {/* Capacity badge details */}
                <div style={{ display: "flex", gap: "10px", margin: "14px 0", justifyContent: "flex-start" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700, color: "#c9d1d9", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "6px 10px" }}>
                    <i className="fas fa-users" style={{ color: "var(--uc-primary)" }}></i> {specs.seats}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700, color: "#c9d1d9", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "6px 10px" }}>
                    <i className="fas fa-suitcase" style={{ color: "var(--uc-primary)" }}></i> {specs.luggage}
                  </span>
                </div>

                <div className="uc-offer-card-price">{offer.price} SAR</div>
                <span className="uc-offer-card-sub">Fuel, Driver, and Toll included</span>
                <button
                  onClick={() => {
                    const r = (offer.route || "").includes(" to ") ? offer.route.split(" to ") : [offer.route, ""];
                    setBookingData((prev) => ({
                      ...prev,
                      pickup: r[0] || "",
                      destination: r[1] || "",
                      carType: offer.vehicle,
                      carPrice: offer.price
                    }));
                    setStep(1);
                    document.getElementById("booking-wizard")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="uc-btn-outline"
                  style={{ width: "100%", justifyContent: "center", fontSize: "13px" }}
                >
                  Select Offer
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== DOWNLOAD APP SECTION ===== */}
      {(websiteSettings?.app_store_link || websiteSettings?.play_store_link || websiteSettings?.app_title) && (
        <section className="uc-app-section">
          <div style={{ maxWidth: "800px", margin: "0 auto", color: "#fff" }}>
            <span className="uc-section-label" style={{ color: "var(--uc-primary)" }}>Mobile Apps</span>
            <h2 style={{ fontSize: "32px", fontWeight: 800, marginTop: "12px", marginBottom: "16px" }}>
              {websiteSettings?.app_title || `Download the ${siteTitle} App Free Today`}
            </h2>
            <p style={{ color: "#8b949e", fontSize: "15px", lineHeight: 1.6 }}>
              {websiteSettings?.app_desc || "Access rides, confirm drivers, and download vouchers directly on your mobile device. Compatible with all Android and iOS smartphones."}
            </p>

            <div className="uc-app-btns">
              {websiteSettings?.app_store_link && (
                <a href={websiteSettings.app_store_link} target="_blank" rel="noopener noreferrer" className="uc-app-btn">
                  <i className="fab fa-apple uc-app-btn-icon" style={{ color: "#000" }}></i>
                  <div style={{ textAlign: "left" }}>
                    <span className="uc-app-btn-label">Download on the</span>
                    <span className="uc-app-btn-store">App Store</span>
                  </div>
                </a>
              )}
              {websiteSettings?.play_store_link && (
                <a href={websiteSettings.play_store_link} target="_blank" rel="noopener noreferrer" className="uc-app-btn">
                  <i className="fab fa-google-play uc-app-btn-icon" style={{ color: "#34A853" }}></i>
                  <div style={{ textAlign: "left" }}>
                    <span className="uc-app-btn-label">Get it on</span>
                    <span className="uc-app-btn-store">Google Play</span>
                  </div>
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ===== CONTACT SECTION ===== */}
      <section id="contact" className="uc-section">
        <div className="uc-contact-grid">
          <div>
            <span className="uc-section-label">Get In Touch</span>
            <h2 className="uc-section-title">
              {websiteSettings?.contact_title || "We would really love to hear from you"}
            </h2>
            <p className="uc-section-subtitle" style={{ marginBottom: "32px" }}>
              {websiteSettings?.contact_desc || "Our support team is online 24/7 to solve transport route issues, customize group packages, or provide special VIP executive fleet rates."}
            </p>

            {siteAddress && (
              <div className="uc-contact-item">
                <div className="uc-contact-icon">
                  <i className="fas fa-map-marker-alt"></i>
                </div>
                <div>
                  <div className="uc-contact-label">Office Address</div>
                  <div className="uc-contact-value">{siteAddress}</div>
                </div>
              </div>
            )}

            {sitePhone && (
              <div className="uc-contact-item">
                <div className="uc-contact-icon">
                  <i className="fas fa-phone-alt"></i>
                </div>
                <div>
                  <div className="uc-contact-label">Helpline Numbers</div>
                  <div className="uc-contact-value">{sitePhone}</div>
                </div>
              </div>
            )}

            {siteEmail && (
              <div className="uc-contact-item">
                <div className="uc-contact-icon">
                  <i className="fas fa-envelope"></i>
                </div>
                <div>
                  <div className="uc-contact-label">Email Queries</div>
                  <div className="uc-contact-value">{siteEmail}</div>
                </div>
              </div>
            )}
          </div>

          {/* Web form */}
          <div style={{ background: "#fff", border: "2px solid #e1e4e8", borderRadius: "16px", padding: "32px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>Drop Us a Line</h3>
            <form onSubmit={(e) => { e.preventDefault(); alert("Thank you! Your message has been dispatched to our client support agents."); }} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="uc-form-group">
                <label className="uc-form-label">Full Name</label>
                <input type="text" className="uc-form-input" placeholder="Your name..." required />
              </div>
              <div className="uc-form-group">
                <label className="uc-form-label">Email Address</label>
                <input type="email" className="uc-form-input" placeholder="email@address.com..." required />
              </div>
              <div className="uc-form-group">
                <label className="uc-form-label">Message Details</label>
                <textarea rows={4} className="uc-form-input" placeholder="How can we assist you?" required></textarea>
              </div>
              <button type="submit" className="uc-btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
