"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function BulkDownloadsPage() {
  const router = useRouter();

  // Checkbox states
  const [dlBookings, setDlBookings] = useState(true);
  const [dlCustomers, setDlCustomers] = useState(true);
  const [dlPayments, setDlPayments] = useState(true);
  const [exportProgress, setExportProgress] = useState<number>(-1);

  // Toast notification
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleBulkExport = (e: React.FormEvent) => {
    e.preventDefault();
    setExportProgress(0);
    const interval = setInterval(() => {
      setExportProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          showToast("Export download completed successfully!", "success");
          return -1;
        }
        return p + 20;
      });
    }, 300);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px", maxWidth: "900px", margin: "0 auto", padding: "10px" }}>
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "#ffffff", padding: "12px 24px", borderRadius: "8px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", fontWeight: "600",
          fontSize: "14px", display: "flex", alignItems: "center", gap: "10px",
        }}>
          <i className={toast.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)", padding: "20px 30px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "700" }}>Bulk Downloads & Backups</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "5px 0 0 0", fontSize: "14px" }}>Select directories to compile and download as consolidated database backups.</p>
        </div>
        <button 
          onClick={() => router.push("/admin/extras")} 
          style={{ background: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", padding: "10px 18px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <i className="fas fa-arrow-left"></i>
          <span>Back to Utilities</span>
        </button>
      </div>

      {/* Main Panel Form */}
      <div className="form-card" style={{ background: "#ffffff", padding: "35px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
        <form onSubmit={handleBulkExport} style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: 0 }}>Choose Tables for Compression</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", background: "#f8fafc", padding: "20px", borderRadius: "8px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", fontSize: "14px", color: "#334155" }}>
              <input 
                type="checkbox" 
                checked={dlBookings} 
                onChange={(e) => setDlBookings(e.target.checked)} 
                style={{ width: "20px", height: "20px", cursor: "pointer" }} 
              />
              <span style={{ fontWeight: "600" }}>Transport Bookings Matrix Logs</span>
            </label>
            
            <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", fontSize: "14px", color: "#334155" }}>
              <input 
                type="checkbox" 
                checked={dlCustomers} 
                onChange={(e) => setDlCustomers(e.target.checked)} 
                style={{ width: "20px", height: "20px", cursor: "pointer" }} 
              />
              <span style={{ fontWeight: "600" }}>Corporate Customer Account Logs</span>
            </label>
            
            <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", fontSize: "14px", color: "#334155" }}>
              <input 
                type="checkbox" 
                checked={dlPayments} 
                onChange={(e) => setDlPayments(e.target.checked)} 
                style={{ width: "20px", height: "20px", cursor: "pointer" }} 
              />
              <span style={{ fontWeight: "600" }}>Deposits & Ledger Records</span>
            </label>
          </div>

          {exportProgress >= 0 && (
            <div style={{ width: "100%", background: "#e2e8f0", borderRadius: "10px", height: "24px", overflow: "hidden", position: "relative" }}>
              <div style={{ width: `${exportProgress}%`, background: "#4f46e5", height: "100%", transition: "width 0.3s" }}></div>
              <span style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", fontSize: "12px", fontWeight: "bold", color: exportProgress > 50 ? "white" : "black" }}>
                Compiling Data... {exportProgress}%
              </span>
            </div>
          )}

          <div>
            <button 
              type="submit" 
              className="btn-submit" 
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", width: "100%", background: "#0f172a", height: "50px", fontWeight: "600", fontSize: "15px" }} 
              disabled={exportProgress >= 0}
            >
              <i className="fas fa-file-zipper"></i>
              <span>Compile and Download Backup</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
