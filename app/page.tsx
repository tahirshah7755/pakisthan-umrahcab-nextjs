"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function PortalPage() {
  // Apply a custom body class for the portal page
  useEffect(() => {
    document.body.classList.add("portal-body");
    return () => {
      document.body.classList.remove("portal-body");
    };
  }, []);

  return (
    <>
      {/* Background glowing effects */}
      <div className="portal-bg-effects">
        <div className="glow-sphere" style={{ top: "10%", right: "10%" }}></div>
        <div
          className="glow-sphere"
          style={{
            bottom: "10%",
            left: "10%",
            background:
              "radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)",
          }}
        ></div>
      </div>

      <div className="portal-container">
        {/* Logo */}
        <div className="portal-logo">
          <img src="/logo2.png" alt="Umrah Cab Logo" />
        </div>

        {/* Title */}
        <h1 className="portal-title">Portal Genesis</h1>
        <p className="portal-subtitle">
          Secure Gateway to High-Performance Transport Management
        </p>

        {/* Action Grid */}
        <div className="portal-grid">
          <Link href="/login" className="portal-card login-card">
            <div className="portal-card-icon">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div className="portal-card-title">Secured Access</div>
            <div className="portal-card-desc">Enter the management hub</div>
          </Link>

          <Link href="/public-site" className="portal-card web-card">
            <div className="portal-card-icon">
              <i className="fa-solid fa-globe"></i>
            </div>
            <div className="portal-card-title">Public Website</div>
            <div className="portal-card-desc">Explore our public services</div>
          </Link>
        </div>

        {/* Footer */}
        <div className="portal-footer">Portal 2.0 • Pulse Integrated Hub</div>
      </div>
    </>
  );
}
