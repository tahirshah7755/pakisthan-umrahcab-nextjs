/**
 * Utility functions for standardizing date and time formatting.
 */

/**
 * Parse a time string ("HH:MM" or "hh:mm AM/PM") into 12-hour components
 */
export const parseTimeTo12hParts = (timeStr: string | null | undefined) => {
  if (!timeStr) return { hour: "", minute: "", merid: "AM" };
  try {
    const clean = String(timeStr).trim().toUpperCase();
    
    // If it's already in 12h format (e.g., "02:30 PM")
    const isPm = clean.includes("PM");
    const isAm = clean.includes("AM");
    if (isPm || isAm) {
      const base = clean.replace(/[AP]M/, "").trim();
      const parts = base.split(":");
      return {
        hour: parts[0] ? parts[0].padStart(2, "0") : "",
        minute: parts[1] ? parts[1].padStart(2, "0") : "",
        merid: isPm ? "PM" : "AM"
      };
    }

    // 24h format (e.g., "14:30")
    const parts = clean.split(":");
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      if (isNaN(hours) || isNaN(minutes)) {
        return { hour: "", minute: "", merid: "AM" };
      }
      const merid = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      if (hours === 0) hours = 12;
      return {
        hour: String(hours).padStart(2, "0"),
        minute: String(minutes).padStart(2, "0"),
        merid
      };
    }
    return { hour: "", minute: "", merid: "AM" };
  } catch {
    return { hour: "", minute: "", merid: "AM" };
  }
};

/**
 * Convert 12-hour components to a 24-hour time string ("HH:MM")
 */
export const format12hPartsTo24h = (hour: string, minute: string, merid: string): string => {
  if (!hour || !minute) return "";
  try {
    let h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    if (isNaN(h) || isNaN(m)) return "";
    
    if (merid === "PM" && h < 12) {
      h += 12;
    } else if (merid === "AM" && h === 12) {
      h = 0;
    }
    
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  } catch {
    return "";
  }
};

/**
 * Format a date and optional time into "DD MMM, YYYY hh:mm AM/PM"
 * Examples:
 *   "2026-07-22", "09:59:00" -> "22 Jul, 2026 09:59 PM"
 *   "2026-07-22T21:59:00Z" -> "22 Jul, 2026 09:59 PM"
 *   "2026-05-22 21:59:00" -> "22 May, 2026 09:59 PM"
 */
export const formatDateTime = (
  dateInput: string | Date | null | undefined,
  timeInput?: string | null | undefined
): string => {
  if (!dateInput) return "N/A";
  try {
    let d: Date;
    let hasTimeVal = false;
    let timeStr = timeInput || "";

    if (dateInput instanceof Date) {
      d = dateInput;
      hasTimeVal = true;
    } else {
      const cleanDate = String(dateInput).trim();
      if (!cleanDate) return "N/A";

      // If dateInput already contains time (e.g. T, space, or is an ISO string)
      if (cleanDate.includes("T") || cleanDate.includes(" ")) {
        hasTimeVal = true;
      }
      d = new Date(cleanDate);
      if (isNaN(d.getTime())) {
        // Fallback for custom date formats like YYYY-MM-DD
        const match = cleanDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          d = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
        } else {
          return cleanDate;
        }
      }
    }

    const day = d.getDate();
    const monthIdx = d.getMonth();
    const year = d.getFullYear();

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const monthName = monthNames[monthIdx] || "Jan";
    const dayStr = day < 10 ? `0${day}` : String(day);

    let hh = "";
    let mm = "";

    if (timeStr) {
      const formatted24h = formatTimeTo24h(timeStr);
      if (formatted24h) {
        const parts = formatted24h.split(":");
        hh = parts[0] ? parts[0].padStart(2, "0") : "";
        mm = parts[1] ? parts[1].padStart(2, "0") : "";
      }
    } else if (hasTimeVal) {
      const hours = d.getHours();
      const minutes = d.getMinutes();
      hh = String(hours).padStart(2, "0");
      mm = String(minutes).padStart(2, "0");
    }

    if (hh && mm) {
      return `${dayStr} ${monthName}, ${year} ${hh}:${mm}`;
    }
    return `${dayStr} ${monthName}, ${year}`;
  } catch {
    return "N/A";
  }
};

/**
 * Format a date string (e.g., "2026-07-22") to "DD MMM, YYYY"
 * Example: "2026-05-22" -> "22 May, 2026"
 */
export const formatDateOnly = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return "N/A";
  try {
    let d: Date;
    if (dateInput instanceof Date) {
      d = dateInput;
    } else {
      const cleanDate = String(dateInput).trim();
      if (!cleanDate) return "N/A";
      const match = cleanDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        d = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
      } else {
        d = new Date(cleanDate);
      }
    }
    if (isNaN(d.getTime())) return "N/A";

    const day = d.getDate();
    const monthIdx = d.getMonth();
    const year = d.getFullYear();

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const monthName = monthNames[monthIdx] || "Jan";
    const dayStr = day < 10 ? `0${day}` : String(day);

    return `${dayStr} ${monthName}, ${year}`;
  } catch {
    return "N/A";
  }
};

/**
 * Format a time string (e.g., "14:30:00" or "09:59") to "hh:mm AM/PM"
 * Example: "14:30" -> "02:30 PM"
 */
export const formatTimeOnly = (timeStr: string | null | undefined): string => {
  if (!timeStr) return "N/A";
  const formatted24h = formatTimeTo24h(timeStr);
  if (formatted24h) {
    return formatted24h;
  }
  return String(timeStr);
};

/**
 * Format date string to "DD MMM, YYYY" format for legacy support.
 * Example: "2026-07-12" -> "12 Jul, 2026"
 */
export const formatDateToCustom = (dateStr: string | null | undefined): string => {
  return formatDateOnly(dateStr);
};

/**
 * Format time string to 24-hour HH:MM format for API requests.
 * Example: "2:30 PM" -> "14:30"
 */
export const formatTimeTo24h = (timeStr: string | null | undefined): string => {
  if (!timeStr) return "";
  try {
    const { hour, minute, merid } = parseTimeTo12hParts(timeStr);
    if (!hour || !minute) return String(timeStr);
    return format12hPartsTo24h(hour, minute, merid);
  } catch {
    return String(timeStr);
  }
};

/**
 * Get current date in Saudi Arabia timezone (Asia/Riyadh) as "YYYY-MM-DD"
 */
export const getSaudiTodayDate = (): string => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
};

/**
 * Get date in Saudi Arabia timezone (Asia/Riyadh) offset by offsetDays as "YYYY-MM-DD"
 */
export const getSaudiDateWithOffset = (offsetDays: number): string => {
  return new Intl.DateTimeFormat("en-CA", {
  }).format(new Date(Date.now() + offsetDays * 86400000));
};

/**
 * Resolve company/agent logo URL properly handling Base64, absolute HTTP URLs, and relative paths via proxy-image endpoint.
 */
export const getCompanyLogoSrc = (logoPath?: string | null): string => {
  if (!logoPath || typeof logoPath !== "string") return "";
  const trimmed = logoPath.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("data:")) {
    return trimmed;
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/umrahcab";
  const IMAGE_BASE = API_URL.split("/api/")[0] || "http://localhost:8000";

  let fullUrl = trimmed;
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    const cleanPath = trimmed.startsWith("/") ? trimmed.substring(1) : trimmed;
    fullUrl = `${IMAGE_BASE}/${cleanPath}`;
  }

  return `/api/proxy-image?url=${encodeURIComponent(fullUrl)}`;
};



