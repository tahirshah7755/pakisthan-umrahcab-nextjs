"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface UtilityCard {
  title: string;
  desc: string;
  icon: string;
  btnLabel: string;
  btnType: "blue" | "green" | "indigo" | "orange" | "yellow" | "disabled";
  href: string;
}

export default function ExtrasPage() {
  const { extrasUnlocked, unlockExtras, lockExtras } = useAuth();
  const router = useRouter();

  // Pin State
  const [pin, setPin] = useState("");
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();

    if (!pin) {
      showToast("Please enter the security PIN code.", "error");
      return;
    }

    const success = unlockExtras(pin);

    if (success) {
      showToast("Security verification passed! Utilities unlocked.", "success");
      setPin("");
    } else {
      showToast("Incorrect security PIN code. Access Denied.", "error");
      setPin("");
    }
  };

  const utilities: UtilityCard[] = [
    {
      title: "Bulk Downloads",
      desc: "Export large datasets, backup receipts, and download multiple reports at once.",
      icon: "fa-cloud-arrow-down",
      btnLabel: "Open Bulk Export",
      btnType: "blue",
      href: "/admin/bulk-downloads",
    },
    {
      title: "Price List Management",
      desc: "Easily set and change standard pricing for all vehicle and package combinations in a matrix view.",
      icon: "fa-file-invoice-dollar",
      btnLabel: "Manage Customer Prices",
      btnType: "green",
      href: "/admin/extras/price-list",
    },
    {
      title: "Package Management",
      desc: "Create, edit, and organize trip packages. Set system-level core status for primary routes.",
      icon: "fa-box-archive",
      btnLabel: "Manage Packages",
      btnType: "green",
      href: "/admin/package-management",
    },
    {
      title: "Fleet Management",
      desc: "Manage your fleet of vehicles, categories, and track booking utilization across your transport inventory.",
      icon: "fa-bus",
      btnLabel: "Manage Fleet",
      btnType: "indigo",
      href: "/admin/fleet",
    },
    {
      title: "Round Trip Discounts",
      desc: "Configure automatic multi-leg discounts based on vehicle and package groupings with date validity.",
      icon: "fa-tag",
      btnLabel: "Manage Discounts",
      btnType: "green",
      href: "/admin/round-trip-discounts",
    },
    {
      title: "System Maintenance",
      desc: "Coming soon: Cache management and database optimization tools.",
      icon: "fa-gears",
      btnLabel: "System Maintenance",
      btnType: "disabled",
      href: "#",
    },
    {
      title: "Global Performance Report",
      desc: "Access consolidated statistics across all branch companies and agencies without filtering by local company ID.",
      icon: "fa-globe",
      btnLabel: "Open Global Report",
      btnType: "blue",
      href: "/admin/global-report",
    },
    {
      title: "Activity Audit Log",
      desc: "Track system-wide changes, security events, and user actions with detailed history.",
      icon: "fa-clock-rotate-left",
      btnLabel: "Open Audit Tool",
      btnType: "indigo",
      href: "/admin/audit-log",
    },
    {
      title: "Admin Notices",
      desc: "Manage internal system announcements for administrative staff and headquarters.",
      icon: "fa-bullhorn",
      btnLabel: "Manage Admin Notices",
      btnType: "yellow",
      href: "/admin/notices?tab=admin",
    },
    {
      title: "Agent Notices",
      desc: "Broadcast alerts and updates to company agents and branch staff.",
      icon: "fa-bell",
      btnLabel: "Manage Agent Notices",
      btnType: "orange",
      href: "/admin/notices?tab=agent",
    },
  ];

  return (
    <div style={{ minHeight: "calc(100vh - 130px)" }}>
      {/* Toast alert */}
      {toast.show && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            <i
              className={`fas ${
                toast.type === "success"
                  ? "fa-circle-check text-success"
                  : "fa-circle-xmark text-danger"
              }`}
            ></i>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {!extrasUnlocked ? (
        /* PIN Barrier Screen */
        <div className="extras-barrier-container">
          <div className="barrier-card">
            <div className="barrier-icon-container">
              <i className="fas fa-shield-halved"></i>
            </div>
            <h2 className="barrier-title">Security Barrier</h2>
            <p className="barrier-subtitle">
              Authorized Personnel Only. Please enter the security key to access advanced utilities.
            </p>

            <form onSubmit={handleUnlock} style={{ width: "100%" }}>
              <input
                type="password"
                className="barrier-input"
                placeholder="•••"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
              />
              <button type="submit" className="barrier-btn">
                <i className="fas fa-key"></i>
                <span>Unlock Utilities</span>
              </button>
            </form>

            <button
              onClick={() => router.push("/admin/hub")}
              className="barrier-back-link"
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
            >
              <i className="fas fa-arrow-left"></i>
              <span>Return to Dashboard</span>
            </button>
          </div>
        </div>
      ) : (
        /* Unlocked Utilities Panel */
        <div>
          {/* Header Banner */}
          <div className="extras-header-banner">
            <div>
              <h2>Advanced Utilities</h2>
              <p>Access background tools, audit logs, and bulk administration features.</p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={lockExtras}
                className="form-btn-back"
                style={{ background: "rgba(220, 53, 69, 0.15)", borderColor: "rgba(220, 53, 69, 0.3)" }}
              >
                <i className="fas fa-lock"></i>
                <span>Lock Session</span>
              </button>
              <button onClick={() => router.push("/admin/hub")} className="form-btn-back">
                <i className="fas fa-arrow-left"></i>
                <span>Back to Hub</span>
              </button>
            </div>
          </div>

          {/* Grid of Utilities */}
          <div className="extras-grid">
            {utilities.map((util, index) => {
              const isDisabled = util.btnType === "disabled";
              return (
                <div key={index} className="extras-card">
                  <div
                    className="extras-card-icon"
                    style={{
                      background: isDisabled
                        ? "#f1f5f9"
                        : util.btnType === "green"
                        ? "#f0fdf4"
                        : util.btnType === "blue"
                        ? "#f0f9ff"
                        : util.btnType === "indigo"
                        ? "#eef2ff"
                        : util.btnType === "orange"
                        ? "#fff7ed"
                        : "#fefcbf",
                      color: isDisabled
                        ? "#94a3b8"
                        : util.btnType === "green"
                        ? "var(--success-color)"
                        : util.btnType === "blue"
                        ? "#0284c7"
                        : util.btnType === "indigo"
                        ? "#4f46e5"
                        : util.btnType === "orange"
                        ? "#ea580c"
                        : "#ca8a04",
                    }}
                  >
                    <i className={`fas ${util.icon}`}></i>
                  </div>
                  <h3 className="extras-card-title">{util.title}</h3>
                  <p className="extras-card-desc">{util.desc}</p>
                  <button
                    onClick={() => {
                      if (!isDisabled) router.push(util.href);
                    }}
                    className={`extras-btn extras-btn-${util.btnType}`}
                    disabled={isDisabled}
                  >
                    {util.btnLabel}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
