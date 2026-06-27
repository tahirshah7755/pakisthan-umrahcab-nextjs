import React, { useState, useEffect, useRef } from "react";
import { api } from "@/utils/api";

interface Country {
  code: string;
  flag: string;
  name: string;
}

interface CountryCodeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  style?: React.CSSProperties;
  className?: string;
}

export const CountryCodeSelector: React.FC<CountryCodeSelectorProps> = ({
  value,
  onChange,
  style,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [countries, setCountries] = useState<Country[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const list = await api.getCountryCodes();
      setCountries(list);
    }
    load();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filtered = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search)
  );

  const selectedCountry = countries.find((c) => c.code === value);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", ...style }}>
      {/* Trigger Button - shows only the dialing code number (and flag optionally) */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        className={className}
        style={{
          width: "100%",
          height: "45px",
          padding: "0 10px",
          border: "1px solid #cbd5e1",
          borderRadius: "6px",
          background: "#ffffff",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          fontSize: "14px",
          color: "#000000",
          outline: "none",
        }}
      >
        <span>
          {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.code}` : value}
        </span>
        <i
          className="fas fa-chevron-down"
          style={{
            color: "#9ca3af",
            fontSize: "11px",
            transition: "transform 0.2s",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        ></i>
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "50px",
            left: 0,
            width: "300px",
            maxHeight: "250px",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Search Box */}
          <div style={{ padding: "8px", borderBottom: "1px solid #e2e8f0" }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country..."
              autoFocus
              style={{
                width: "100%",
                padding: "6px 10px",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                fontSize: "13px",
                outline: "none",
                color: "#000000",
              }}
            />
          </div>

          {/* List of Countries */}
          <div style={{ overflowY: "auto", flexGrow: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "10px", fontSize: "13px", color: "#94a3b8", textAlign: "center" }}>
                No countries found
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.code + "-" + c.name}
                  type="button"
                  onClick={() => {
                    onChange(c.code);
                    setIsOpen(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                    cursor: "pointer",
                    color: "#334155",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <span style={{ fontSize: "16px" }}>{c.flag}</span>
                  <span style={{ fontWeight: "600", minWidth: "45px" }}>{c.code}</span>
                  <span style={{ color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.name}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
