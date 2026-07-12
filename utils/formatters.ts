/**
 * Utility functions for standardizing date and time formatting.
 */

/**
 * Format date string (e.g. YYYY-MM-DD or ISO string) to "Date :MonthName: Year" format.
 * Example: "2026-07-12" -> "12 :July: 2026"
 */
export const formatDateToCustom = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "";
  try {
    let year: number;
    let monthIdx: number;
    let day: number;

    const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      year = parseInt(match[1], 10);
      monthIdx = parseInt(match[2], 10) - 1;
      day = parseInt(match[3], 10);
    } else {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      year = d.getFullYear();
      monthIdx = d.getMonth();
      day = d.getDate();
    }

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthName = monthNames[monthIdx] || "January";
    const dayStr = day < 10 ? `0${day}` : String(day);
    return `${dayStr} ${monthName} ${year}`;
  } catch {
    return String(dateStr);
  }
};

/**
 * Format time string to 24-hour HH:MM format.
 * Example: "2:30 PM" -> "14:30", "14:30:00" -> "14:30"
 */
export const formatTimeTo24h = (timeStr: string | null | undefined): string => {
  if (!timeStr) return "";
  try {
    const clean = String(timeStr).trim().toUpperCase();
    const isPm = clean.includes("PM");
    const isAm = clean.includes("AM");

    // Strip AM/PM
    const baseTime = clean.replace(/[AP]M/, "").trim();
    const parts = baseTime.split(":");
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);

      if (isPm && hours < 12) {
        hours += 12;
      } else if (isAm && hours === 12) {
        hours = 0;
      }

      const hh = hours < 10 ? `0${hours}` : String(hours);
      const mm = minutes < 10 ? `0${minutes}` : String(minutes);
      return `${hh}:${mm}`;
    }
    return String(timeStr);
  } catch {
    return String(timeStr);
  }
};
