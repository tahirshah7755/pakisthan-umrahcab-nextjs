"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const MOCK_MRZ_DATA = `P<PAKALI<<AMJAD<<<<<<<<<<<<<<<<<<<<<<<<<<<<
EJ98438292PAK8502128M3112246<<<<<<<<<<<<<<02
-------------------------------------------
DOCUMENT TYPE: PASSPORT (P)
ISSUING STATE: PAKISTAN (PAK)
SURNAME: ALI
GIVEN NAMES: AMJAD
PASSPORT NUMBER: EJ9843829
NATIONALITY: PAKISTANI
DATE OF BIRTH: 12 FEB 1985
GENDER: MALE (M)
DATE OF EXPIRY: 24 DEC 2031`;

export default function ScannerPage() {
  const router = useRouter();

  // Component State
  const [outputText, setOutputText] = useState("");
  const [aiMode, setAiMode] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      triggerScanSimulation(files[0].name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      triggerScanSimulation(files[0].name);
    }
  };

  // Clipboard Paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            triggerScanSimulation("Pasted Clipboard Image");
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const triggerScanSimulation = (fileName: string) => {
    setIsScanning(true);
    showToast(`Analyzing ${fileName}...`, "success");
    
    setTimeout(() => {
      setIsScanning(false);
      setOutputText(MOCK_MRZ_DATA);
      showToast("MRZ Document Scanned Successfully!", "success");
    }, 1800);
  };

  const handleCopyText = () => {
    if (!outputText) {
      showToast("Nothing to copy.", "error");
      return;
    }
    navigator.clipboard.writeText(outputText);
    showToast("Text copied to clipboard!", "success");
  };

  const handleDownloadTxt = () => {
    if (!outputText) {
      showToast("Scan a document first to download text.", "error");
      return;
    }
    const element = document.createElement("a");
    const file = new Blob([outputText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "passport_scan_mrz.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast("Extracted MRZ file downloaded!", "success");
  };

  const handleClearAll = () => {
    setOutputText("");
    showToast("Workspace cleared.", "success");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "10px" }}>
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

      {/* Header Banner */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #475569 0%, #334155 100%)", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <h2>Pilgrim Visa / Passport Document Scanner</h2>
            <span style={{ background: "#2563eb", color: "#ffffff", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>Native OCR Tool</span>
          </div>
          <p>Simulate document optical scanning. Paste, drag-and-drop or select visa or passport images to extract MRZ records.</p>
        </div>
        <button onClick={() => router.push("/admin/hub")} className="form-btn-back">
          <i className="fas fa-arrow-left"></i>
          <span>Back to Hub</span>
        </button>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "stretch" }}>
        
        {/* Left Column: Upload / Paste Area */}
        <div className="form-card" style={{ display: "flex", flexDirection: "column", gap: "20px", justifyContent: "center", minHeight: "350px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#475569", margin: 0 }}>
            <i className="fas fa-upload" style={{ marginRight: "8px" }}></i> Document Source
          </h3>
          
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              flex: 1,
              border: isDragging ? "3px dashed #2563eb" : "3px dashed #cbd5e1",
              borderRadius: "12px",
              background: isDragging ? "#eff6ff" : "#f8fafc",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 20px",
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
              position: "relative"
            }}
            onClick={() => document.getElementById("ocr-file-input")?.click()}
          >
            <input
              type="file"
              id="ocr-file-input"
              style={{ display: "none" }}
              accept="image/*,application/pdf"
              onChange={handleFileChange}
            />

            {isScanning ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                <div className="spinner" style={{ width: "40px", height: "40px", borderWidth: "4px", borderTopColor: "#2563eb" }}></div>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#475569" }}>Scanning Document Matrix...</span>
              </div>
            ) : (
              <>
                <i className="fas fa-passport" style={{ fontSize: "48px", color: isDragging ? "#2563eb" : "#94a3b8", marginBottom: "16px" }}></i>
                <p style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", textAlign: "center", margin: "0 0 6px 0" }}>
                  Drag & Drop Document Image here
                </p>
                <p style={{ fontSize: "12px", color: "#64748b", textAlign: "center", margin: 0 }}>
                  or click to select file from computer
                </p>
                <div style={{ marginTop: "20px", background: "#f1f5f9", padding: "6px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", color: "#64748b" }}>
                  <i className="fas fa-keyboard" style={{ marginRight: "6px" }}></i> Press Ctrl + V to paste screenshot
                </div>
              </>
            )}

            {/* Simulated Scanning Laser Line */}
            {isScanning && (
              <div style={{
                position: "absolute",
                width: "90%",
                height: "2px",
                background: "rgba(37, 99, 235, 0.7)",
                boxShadow: "0 0 8px 2px rgba(37, 99, 235, 0.8)",
                top: "10%",
                animation: "scanLine 1.8s infinite linear"
              }}></div>
            )}
          </div>

          <button
            onClick={() => triggerScanSimulation("Sample Passport Document")}
            disabled={isScanning}
            className="btn-submit"
            style={{ background: "linear-gradient(135deg, #475569 0%, #334155 100%)", marginTop: "10px" }}
          >
            <i className="fas fa-wand-magic-sparkles" style={{ marginRight: "8px" }}></i> Simulate Quick Scan Capture
          </button>
        </div>

        {/* Right Column: Extracted MRZ Text Output */}
        <div className="form-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#475569", margin: 0 }}>
              <i className="fas fa-brain" style={{ marginRight: "8px" }}></i> Extracted Output
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f3e8ff", padding: "6px 12px", borderRadius: "8px", color: "#7c3aed" }}>
                <span style={{ fontSize: "12px", fontWeight: "700" }}>AI Smart Mode</span>
                <label className="toggle-switch" style={{ position: "relative", display: "inline-block", width: "40px", height: "20px" }}>
                  <input
                    type="checkbox"
                    checked={aiMode}
                    onChange={(e) => setAiMode(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span className="slider" style={{
                    position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: aiMode ? "#7c3aed" : "#ccc", transition: ".4s", borderRadius: "20px"
                  }}>
                    <span style={{
                      position: "absolute", content: '""', height: "14px", width: "14px", left: aiMode ? "22px" : "3px", bottom: "3px",
                      backgroundColor: "white", transition: ".4s", borderRadius: "50%"
                    }}></span>
                  </span>
                </label>
              </div>

              <button
                onClick={handleCopyText}
                style={{
                  background: "#ffffff", color: "#059669", border: "1px solid #059669", borderRadius: "6px",
                  padding: "6px 12px", fontSize: "12px", fontWeight: "700", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "6px", transition: "all 0.15s"
                }}
              >
                <i className="fas fa-copy"></i> Copy
              </button>
            </div>
          </div>

          <textarea
            id="output-text"
            className="form-input"
            rows={12}
            value={outputText}
            onChange={(e) => setOutputText(e.target.value)}
            placeholder="Scanned text will appear here... Paste or drag a passport image, or click the simulation button."
            style={{
              flex: 1,
              fontFamily: "monospace",
              fontSize: "13px",
              lineHeight: "1.6",
              background: "#1e1b4b",
              color: "#a78bfa",
              borderColor: "#cbd5e1",
              padding: "16px",
              borderRadius: "8px",
              resize: "none"
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
            <button
              onClick={handleClearAll}
              style={{
                background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px",
                padding: "8px 18px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s"
              }}
            >
              Clear All
            </button>
            
            <button
              onClick={handleDownloadTxt}
              style={{
                background: "#dbeafe", color: "#2563eb", border: "none", borderRadius: "6px",
                padding: "8px 18px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s"
              }}
            >
              Download txt
            </button>
          </div>

        </div>

      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
      `}</style>
    </div>
  );
}
