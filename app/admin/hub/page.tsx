"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const cards = [
    {
      title: "Dashboard",
      icon: "fa-gauge",
      buttons: [{ label: "Visit", href: "/admin/dashboard", type: "visit" as const }],
    },
    {
      title: "Customers",
      icon: "fa-users",
      buttons: [
        { label: "List", href: "/admin/customers", type: "list" as const },
        { label: "Add", href: "/admin/customers/add", type: "add" as const },
      ],
    },
    {
      title: "Bookings",
      icon: "fa-calendar-days",
      buttons: [
        { label: "List", href: "/admin/bookings", type: "list" as const },
        { label: "Add", href: "/admin/bookings/add", type: "add" as const },
      ],
    },
    {
      title: "Services",
      icon: "fa-hand-holding-heart",
      buttons: [
        { label: "List", href: "/admin/services", type: "list" as const },
        { label: "Add", href: "/admin/services/add", type: "add" as const },
      ],
    },
    {
      title: "Companies",
      icon: "fa-building",
      buttons: [{ label: "Visit", href: "/admin/mock/companies", type: "visit" as const }],
    },
    {
      title: "Flights",
      icon: "fa-plane-departure",
      buttons: [
        { label: "List", href: "/admin/flights", type: "list" as const },
        { label: "Add", href: "/admin/flights/add", type: "add" as const },
      ],
    },
    {
      title: "Trains",
      icon: "fa-train",
      buttons: [
        { label: "List", href: "/admin/trains", type: "list" as const },
        { label: "Add", href: "/admin/trains/add", type: "add" as const },
      ],
    },
    {
      title: "Agent Follow-ups",
      icon: "fa-headset",
      buttons: [
        { label: "List", href: "/admin/mock/agent-followups", type: "list" as const },
        { label: "Add", href: "/admin/mock/agent-followups-add", type: "add" as const },
      ],
    },
    {
      title: "Balance Statement",
      icon: "fa-file-invoice-dollar",
      buttons: [{ label: "Visit", href: "/admin/mock/balance", type: "visit" as const }],
    },
    {
      title: "Invoices",
      icon: "fa-receipt",
      buttons: [
        { label: "List", href: "/admin/mock/invoices", type: "list" as const },
        { label: "Add", href: "/admin/mock/invoices-add", type: "add" as const },
      ],
    },
    {
      title: "Ledgers",
      icon: "fa-book-open",
      buttons: [{ label: "Visit", href: "/admin/mock/ledgers", type: "visit" as const }],
    },
    {
      title: "General Payments",
      icon: "fa-money-bill-transfer",
      buttons: [{ label: "Visit", href: "/admin/mock/payments", type: "visit" as const }],
    },
  ];

  return (
    <div className="hub-container">
      {/* Banner Card */}
      <div className="hub-header-banner">
        <h2>Central Hub</h2>
        <p>Manage your directory and operations in real-time.</p>
      </div>

      {/* Cards Grid */}
      <div className="hub-grid">
        {cards.map((card, idx) => (
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
