"use client";

import React from "react";

interface TimePicker24hProps {
  value: string | null | undefined;
  onChange: (val: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export default function TimePicker24h({ value, onChange, disabled, hasError }: TimePicker24hProps) {
  // Safe default: "12:00"
  const timeStr = value || "12:00";
  
  // Extract hours and minutes
  let hourVal = "12";
  let minuteVal = "00";
  
  if (timeStr && timeStr.includes(":")) {
    const parts = timeStr.split(":");
    hourVal = parts[0].trim().padStart(2, "0");
    if (parts[1]) {
      minuteVal = parts[1].trim().substring(0, 2).padStart(2, "0");
    }
  }

  // Ensure hourVal is within 00-23 and minuteVal within 00-59
  if (parseInt(hourVal) < 0 || parseInt(hourVal) > 23 || isNaN(parseInt(hourVal))) {
    hourVal = "12";
  }
  if (parseInt(minuteVal) < 0 || parseInt(minuteVal) > 59 || isNaN(parseInt(minuteVal))) {
    minuteVal = "00";
  }

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(`${e.target.value}:${minuteVal}`);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(`${hourVal}:${e.target.value}`);
  };

  const errorBorderColor = hasError ? "#ef4444" : undefined;

  return (
    <div style={{ display: "flex", gap: "8px", width: "100%" }}>
      {/* Hour Select */}
      <div className="form-input-wrapper" style={{ flex: 1, position: "relative" }}>
        <i className="fas fa-clock form-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}></i>
        <select
          className="form-input form-select"
          value={hourVal}
          onChange={handleHourChange}
          disabled={disabled}
          style={{ paddingLeft: "42px", width: "100%", borderColor: errorBorderColor }}
        >
          {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <i className="fas fa-chevron-down select-arrow" style={{ right: "12px", position: "absolute", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}></i>
      </div>

      {/* Minute Select */}
      <div className="form-input-wrapper" style={{ flex: 1, position: "relative" }}>
        <select
          className="form-input form-select"
          value={minuteVal}
          onChange={handleMinuteChange}
          disabled={disabled}
          style={{ width: "100%", borderColor: errorBorderColor }}
        >
          {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <i className="fas fa-chevron-down select-arrow" style={{ right: "12px", position: "absolute", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}></i>
      </div>
    </div>
  );
}
