"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen } = useAuth();

  return (
    <div className="admin-layout" style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main panel */}
      <div
        className="admin-main"
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          minWidth: 0,
        }}
      >
        {/* Top Header */}
        <Header />

        {/* Dynamic page content */}
        <main className="admin-content-area">{children}</main>
      </div>
    </div>
  );
}
