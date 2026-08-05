"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/utils/api";

export default function PublicInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  // Mock Card Fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await api.getPublicInvoiceDetails(code);
      if (res) {
        const invObj = res.invoice || (res.invoice_code ? res : null);
        const ordObj = res.order || res.individual_order || invObj?.individual_order || null;
        setInvoice(invObj);
        setOrder(ordObj);
      }
    } catch (err) {
      console.error("Failed to fetch invoice:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code) {
      fetchInvoice();
    }
  }, [code]);

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
      alert("Please fill in all credit card fields for simulation.");
      return;
    }
    setPaying(true);
    // Simulate latency
    setTimeout(async () => {
      try {
        const res = await api.payIndividualOrderInvoice(code);
        if (res.success) {
          alert("Payment Simulated Successfully! Your booking is now confirmed.");
          fetchInvoice();
        } else {
          alert("Payment gateway rejected transaction.");
        }
      } catch (err) {
        console.error(err);
        alert("Payment simulation failed.");
      } finally {
        setPaying(false);
      }
    }, 2000);
  };

  if (loading) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        minHeight: "100vh", background: "#0b0f19", color: "#fff", gap: "16px"
      }}>
        <div style={{
          width: "48px", height: "48px", border: "4px solid rgba(255,255,255,0.1)",
          borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite"
        }}></div>
        <span style={{ fontWeight: "600", fontSize: "16px", color: "#94a3b8" }}>Loading Invoice Details...</span>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { to { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        minHeight: "100vh", background: "#0b0f19", color: "#fff", gap: "16px", padding: "20px", textAlign: "center"
      }}>
        <i className="fas fa-exclamation-triangle" style={{ fontSize: "48px", color: "#ef4444" }}></i>
        <h2 style={{ fontSize: "24px", fontWeight: "700" }}>Invoice Not Found</h2>
        <p style={{ color: "#94a3b8", maxWidth: "400px" }}>The requested invoice code does not match any orders in our system.</p>
        <button onClick={() => router.push("/public-site")} style={{
          background: "#3b82f6", border: "none", color: "#fff", padding: "10px 24px", borderRadius: "6px",
          fontWeight: "700", cursor: "pointer", marginTop: "10px"
        }}>
          Return Home
        </button>
      </div>
    );
  }

  const isPaid = invoice.status?.toLowerCase() === "paid";

  return (
    <div className="public-invoice-wrapper" style={{
      minHeight: "100vh", background: "#0b0f19", color: "#f8fafc", padding: "110px 20px 60px 20px",
      fontFamily: "system-ui, sans-serif"
    }}>
      <style>{`
        @media print {
          header, footer, nav, .uc-header, .uc-footer, .uc-whatsapp-float, .uc-floating-wa, .uc-mobile-bottom-nav, button, .no-print {
            display: none !important;
          }
          body, html {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .public-invoice-wrapper {
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            min-height: auto !important;
          }
          .invoice-card-box {
            background: #ffffff !important;
            color: #000000 !important;
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            padding: 20px !important;
          }
          .invoice-card-box h2, 
          .invoice-card-box h3, 
          .invoice-card-box h4, 
          .invoice-card-box p, 
          .invoice-card-box span {
            color: #000000 !important;
          }
          .invoice-card-box div {
            border-color: #e2e8f0 !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Invoice Summary Details Card */}
        <div className="invoice-card-box" style={{
          background: "#161b22", border: "1px solid #30363d", borderRadius: "16px", padding: "30px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
        }}>
          {/* Top Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #30363d", paddingBottom: "20px", marginBottom: "25px", flexWrap: "wrap", gap: "15px" }}>
            <div>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#3b82f6", textTransform: "uppercase", letterSpacing: "1px" }}>UmrahCab Invoice</span>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#fff", margin: "4px 0 0 0" }}>#{invoice.invoice_code}</h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{
                background: isPaid ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                color: isPaid ? "#10b981" : "#ef4444",
                border: isPaid ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                padding: "6px 16px", borderRadius: "9999px", fontSize: "14px", fontWeight: "700"
              }}>
                <i className={isPaid ? "fas fa-check-circle" : "fas fa-clock"} style={{ marginRight: "6px" }}></i>
                {invoice.status}
              </span>
              <button onClick={() => window.print()} className="no-print" style={{
                background: "rgba(255,255,255,0.05)", border: "1px solid #30363d", color: "#c9d1d9",
                width: "36px", height: "36px", borderRadius: "8px", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center"
              }}>
                <i className="fas fa-print"></i>
              </button>
            </div>
          </div>

          {/* Info Blocks */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", marginBottom: "30px" }}>
            <div>
              <h4 style={{ color: "#8b949e", fontSize: "12px", textTransform: "uppercase", margin: "0 0 8px 0" }}>Billed To</h4>
              <p style={{ fontWeight: "700", fontSize: "15px", color: "#fff", margin: "0 0 4px 0" }}>{invoice.customer}</p>
              <p style={{ color: "#c9d1d9", fontSize: "13px", margin: "0 0 4px 0" }}>{order?.email}</p>
              <p style={{ color: "#c9d1d9", fontSize: "13px", margin: 0 }}>{order?.whatsapp}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <h4 style={{ color: "#8b949e", fontSize: "12px", textTransform: "uppercase", margin: "0 0 8px 0" }}>Date Details</h4>
              <p style={{ fontWeight: "700", fontSize: "15px", color: "#fff", margin: "0 0 4px 0" }}>Invoice Date: {invoice.date}</p>
              <p style={{ color: "#c9d1d9", fontSize: "13px", margin: 0 }}>Type: {invoice.type}</p>
            </div>
          </div>

          {/* Ride Details Panel */}
          {order && (
            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid #30363d", borderRadius: "12px",
              padding: "20px", marginBottom: "30px"
            }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#fff", borderBottom: "1px solid #30363d", paddingBottom: "10px", margin: "0 0 15px 0" }}>
                <i className="fas fa-route" style={{ color: "#3b82f6", marginRight: "8px" }}></i> Ride Configuration details
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", fontSize: "14px" }}>
                <div>
                  <span style={{ color: "#8b949e", fontSize: "12px" }}>Pickup Location:</span>
                  <p style={{ fontWeight: "600", margin: "3px 0 0 0" }}>{order.pickup}</p>
                </div>
                <div>
                  <span style={{ color: "#8b949e", fontSize: "12px" }}>Drop-off Destination:</span>
                  <p style={{ fontWeight: "600", margin: "3px 0 0 0" }}>{order.destination}</p>
                </div>
                <div>
                  <span style={{ color: "#8b949e", fontSize: "12px" }}>Pickup Date & Time:</span>
                  <p style={{ fontWeight: "600", margin: "3px 0 0 0" }}>{order.date} @ {order.time}</p>
                </div>
                <div>
                  <span style={{ color: "#8b949e", fontSize: "12px" }}>Vehicle & Capacity:</span>
                  <p style={{ fontWeight: "600", color: "#3b82f6", margin: "3px 0 0 0" }}>{order.car_type} ({order.passengers} Passengers)</p>
                </div>
                {order.flight_no && (
                  <div>
                    <span style={{ color: "#8b949e", fontSize: "12px" }}>Flight Carrier No:</span>
                    <p style={{ fontWeight: "600", margin: "3px 0 0 0" }}>{order.flight_no}</p>
                  </div>
                )}
                {order.notes && (
                  <div style={{ gridColumn: "span 2" }}>
                    <span style={{ color: "#8b949e", fontSize: "12px" }}>Special Requirements:</span>
                    <p style={{ fontWeight: "600", margin: "3px 0 0 0", fontStyle: "italic" }}>{order.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pricing Ledger Card */}
          <div style={{
            borderTop: "2px dashed #30363d", paddingTop: "20px", display: "flex",
            justifyContent: "flex-end"
          }}>
            <div style={{ width: "100%", maxWidth: "300px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", color: "#c9d1d9" }}>
                <span>Subtotal Rate:</span>
                <span>{invoice.amount} SAR</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px", color: "#c9d1d9" }}>
                <span>Amount Paid:</span>
                <span>{isPaid ? invoice.amount : "0.00"} SAR</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #30363d", paddingTop: "12px", fontSize: "18px", fontWeight: "800", color: "#fff" }}>
                <span>Balance Due:</span>
                <span style={{ color: isPaid ? "#10b981" : "#ef4444" }}>{invoice.balance} SAR</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
