"use client";

import React, { useState, useEffect } from "react";
import { getSaudiTodayDate } from "@/utils/formatters";

export type DateFilterPreset = "all" | "today" | "tomorrow" | "yesterday" | "custom";

export interface DateFilterValue {
  preset: DateFilterPreset;
  startDate: string;
  endDate: string;
}

interface DateFilterControlProps {
  onFilterChange: (value: DateFilterValue) => void;
  initialPreset?: DateFilterPreset;
  initialStartDate?: string;
  initialEndDate?: string;
  style?: React.CSSProperties;
}

export const DateFilterControl: React.FC<DateFilterControlProps> = ({
  onFilterChange,
  initialPreset = "all",
  initialStartDate = "",
  initialEndDate = "",
  style = {},
}) => {
  const [preset, setPreset] = useState<DateFilterPreset>(initialPreset);
  const [startDate, setStartDate] = useState<string>(initialStartDate);
  const [endDate, setEndDate] = useState<string>(initialEndDate);

  const getYesterdayDate = (): string => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getTomorrowDate = (): string => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handlePresetSelect = (selected: DateFilterPreset) => {
    setPreset(selected);
    const saudiToday = getSaudiTodayDate();
    let newStart = "";
    let newEnd = "";

    if (selected === "today") {
      newStart = saudiToday;
      newEnd = saudiToday;
    } else if (selected === "tomorrow") {
      const tDate = getTomorrowDate();
      newStart = tDate;
      newEnd = tDate;
    } else if (selected === "yesterday") {
      const yDate = getYesterdayDate();
      newStart = yDate;
      newEnd = yDate;
    } else if (selected === "all") {
      newStart = "";
      newEnd = "";
    } else if (selected === "custom") {
      newStart = startDate || saudiToday;
      newEnd = endDate || saudiToday;
    }

    setStartDate(newStart);
    setEndDate(newEnd);
    onFilterChange({ preset: selected, startDate: newStart, endDate: newEnd });
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    onFilterChange({ preset: "custom", startDate: start, endDate: end });
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap",
        ...style,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          backgroundColor: "#f1f5f9",
          borderRadius: "8px",
          padding: "3px",
          gap: "2px",
          border: "1px solid #e2e8f0",
        }}
      >
        <button
          type="button"
          onClick={() => handlePresetSelect("all")}
          style={{
            padding: "6px 14px",
            fontSize: "12px",
            fontWeight: 600,
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            transition: "all 0.15s ease",
            backgroundColor: preset === "all" ? "#ffffff" : "transparent",
            color: preset === "all" ? "#0f172a" : "#64748b",
            boxShadow: preset === "all" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          All
        </button>

        <button
          type="button"
          onClick={() => handlePresetSelect("today")}
          style={{
            padding: "6px 14px",
            fontSize: "12px",
            fontWeight: 600,
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            transition: "all 0.15s ease",
            backgroundColor: preset === "today" ? "#3b82f6" : "transparent",
            color: preset === "today" ? "#ffffff" : "#64748b",
            boxShadow: preset === "today" ? "0 1px 3px rgba(59,130,246,0.3)" : "none",
          }}
        >
          <i className="fas fa-calendar-day" style={{ marginRight: "4px" }}></i> Today
        </button>

        <button
          type="button"
          onClick={() => handlePresetSelect("tomorrow")}
          style={{
            padding: "6px 14px",
            fontSize: "12px",
            fontWeight: 600,
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            transition: "all 0.15s ease",
            backgroundColor: preset === "tomorrow" ? "#10b981" : "transparent",
            color: preset === "tomorrow" ? "#ffffff" : "#64748b",
            boxShadow: preset === "tomorrow" ? "0 1px 3px rgba(16,185,129,0.3)" : "none",
          }}
        >
          <i className="fas fa-calendar-plus" style={{ marginRight: "4px" }}></i> Tomorrow
        </button>

        <button
          type="button"
          onClick={() => handlePresetSelect("yesterday")}
          style={{
            padding: "6px 14px",
            fontSize: "12px",
            fontWeight: 600,
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            transition: "all 0.15s ease",
            backgroundColor: preset === "yesterday" ? "#0284c7" : "transparent",
            color: preset === "yesterday" ? "#ffffff" : "#64748b",
            boxShadow: preset === "yesterday" ? "0 1px 3px rgba(2,132,199,0.3)" : "none",
          }}
        >
          <i className="fas fa-history" style={{ marginRight: "4px" }}></i> Yesterday
        </button>

        <button
          type="button"
          onClick={() => handlePresetSelect("custom")}
          style={{
            padding: "6px 14px",
            fontSize: "12px",
            fontWeight: 600,
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            transition: "all 0.15s ease",
            backgroundColor: preset === "custom" ? "#b48a1d" : "transparent",
            color: preset === "custom" ? "#ffffff" : "#64748b",
            boxShadow: preset === "custom" ? "0 1px 3px rgba(180,138,29,0.3)" : "none",
          }}
        >
          <i className="fas fa-calendar-alt" style={{ marginRight: "4px" }}></i> Custom Range
        </button>
      </div>

      {preset === "custom" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "#f8fafc",
            padding: "4px 10px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleCustomDateChange(e.target.value, endDate)}
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
                outline: "none",
              }}
            />
          </div>

          <span style={{ color: "#94a3b8", fontWeight: 700 }}>-</span>

          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleCustomDateChange(startDate, e.target.value)}
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
                outline: "none",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
