"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface HubCardProps {
  title: string;
  icon: string;
  themeIdx: number;
  buttons: {
    label: string;
    href: string;
    type: "visit" | "list" | "add";
  }[];
}

function HubCard({ title, icon, themeIdx, buttons }: HubCardProps) {
  const router = useRouter();

  return (
    <div className={`hub-card card-theme-${themeIdx}`}>
      <div className="hub-card-icon-container">
        <i className={`fas ${icon}`}></i>
      </div>
      <h3 className="hub-card-title">{title}</h3>
      <div className="hub-card-button-group">
        {buttons.map((btn, idx) => (
          <button
            key={idx}
            onClick={() => router.push(btn.href)}
            className={`hub-btn hub-btn-${btn.type}`}
          >
            {btn.type === "visit" && <i className="fas fa-eye"></i>}
            {btn.type === "list" && <i className="fas fa-list"></i>}
            {btn.type === "add" && <i className="fas fa-plus"></i>}
            <span>{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CentralHub() {
  const { user } = useAuth();
  const router = useRouter();

  const cards = [
    {
      title: "Dashboard",
      icon: "fa-gauge",
      buttons: [{ label: "Visit", href: "/admin/dashboard", type: "visit" as const }],
    },
    {
      title: "Customers",
      icon: "fa-users",
      permissionKey: "customers",
      buttons: [
        { label: "List", href: "/admin/customers", type: "list" as const },
        { label: "Add", href: "/admin/customers/add", type: "add" as const },
      ],
    },
    {
      title: "Bookings",
      icon: "fa-calendar-days",
      permissionKey: "bookings",
      buttons: [
        { label: "List", href: "/admin/bookings", type: "list" as const },
        { label: "Add", href: "/admin/bookings/add", type: "add" as const },
      ],
    },
    {
      title: "Individual Orders",
      icon: "fa-cart-shopping",
      buttons: [{ label: "Manage", href: "/admin/individual-orders", type: "list" as const }],
    },
    {
      title: "Services",
      icon: "fa-hand-holding-heart",
      permissionKey: "services",
      buttons: [
        { label: "List", href: "/admin/services", type: "list" as const },
        { label: "Add", href: "/admin/services/add", type: "add" as const },
      ],
    },
    {
      title: "Companies",
      icon: "fa-building",
      permissionKey: "companies",
      buttons: [{ label: "Visit", href: "/admin/companies", type: "visit" as const }],
    },
    {
      title: "Flights",
      icon: "fa-plane-departure",
      permissionKey: "flights",
      buttons: [
        { label: "List", href: "/admin/flights", type: "list" as const },
        { label: "Add", href: "/admin/flights/add", type: "add" as const },
      ],
    },
    {
      title: "Trains",
      icon: "fa-train",
      permissionKey: "trains",
      buttons: [
        { label: "List", href: "/admin/trains", type: "list" as const },
        { label: "Add", href: "/admin/trains/add", type: "add" as const },
      ],
    },
    {
      title: "Agent Follow-ups",
      icon: "fa-headset",
      permissionKey: "agent_followups",
      buttons: [
        { label: "List", href: "/admin/agent-followups", type: "list" as const },
        { label: "Add", href: "/admin/agent-followups/add", type: "add" as const },
      ],
    },
    {
      title: "Balance Statement",
      icon: "fa-file-invoice-dollar",
      permissionKey: "balance",
      buttons: [{ label: "Visit", href: "/admin/balance", type: "visit" as const }],
    },
    {
      title: "Invoices",
      icon: "fa-receipt",
      permissionKey: "invoices",
      buttons: [
        { label: "List", href: "/admin/invoices", type: "list" as const },
        { label: "Add", href: "/admin/invoices/add", type: "add" as const },
      ],
    },
    {
      title: "Ledgers",
      icon: "fa-book-open",
      permissionKey: "ledgers",
      buttons: [{ label: "Visit", href: "/admin/ledgers", type: "visit" as const }],
    },
    {
      title: "General Payments",
      icon: "fa-money-bill-transfer",
      permissionKey: "payments",
      buttons: [{ label: "Visit", href: "/admin/payments", type: "visit" as const }],
    },
    {
      title: "Drivers Registry",
      icon: "fa-user-tie",
      permissionKey: "drivers",
      buttons: [{ label: "Manage", href: "/admin/drivers", type: "list" as const }],
    },
    {
      title: "Driver Sheets & Logs",
      icon: "fa-clipboard-list",
      permissionKey: "drivers",
      buttons: [{ label: "Review", href: "/admin/driver-entries", type: "list" as const }],
    },
    {
      title: "Security & Permissions",
      icon: "fa-user-shield",
      permissionKey: "sub_admins",
      buttons: [{ label: "Configure", href: "/admin/sub-admins", type: "list" as const }],
    },
  ];

  // Helper to check permissions
  const hasPermission = (card: typeof cards[0]) => {
    if (!user || user.role === "SUPER_ADMIN") return true;
    if (!(card as any).permissionKey) return true;
    
    const userPerms = (user as any).permissions || {};
    const access = userPerms[(card as any).permissionKey] || "none";
    return access !== "none";
  };

  const visibleCards = cards.filter(hasPermission);

  return (
    <div className="hub-container">
      {/* Banner Card */}
      <div className="hub-header-banner">
        <h2>Central Hub</h2>
        <p>Manage your directory and operations in real-time.</p>
      </div>

      {/* Cards Grid */}
      <div className="hub-grid">
        {visibleCards.map((card, idx) => (
          <HubCard
            key={idx}
            title={card.title}
            icon={card.icon}
            themeIdx={idx}
            buttons={card.buttons}
          />
        ))}
      </div>
    </div>
  );
}
