"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function ShortcutsPage() {
  const router = useRouter();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)" }}>
        <div>
          <h2>Keyboard Accessibility Shortcuts</h2>
          <p>Configure quick-access hotkeys to navigate the portal without clicking.</p>
        </div>
        <button onClick={() => router.push("/admin/hub")} className="form-btn-back">
          <i className="fas fa-arrow-left"></i>
          <span>Back to Hub</span>
        </button>
      </div>

      <div className="form-card">
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#333", marginBottom: "15px" }}>Active Portal Shortcuts</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            { keys: "Alt + H", action: "Navigate directly to Central Hub" },
            { keys: "Alt + B", action: "Create new transport booking" },
            { keys: "Alt + C", action: "Open customers registry" },
            { keys: "Alt + E", action: "Unlock Advanced Utilities panel" }
          ].map((sc, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "#f8fafc", borderRadius: "6px" }}>
              <span style={{ fontSize: "14px", fontWeight: "600" }}>{sc.action}</span>
              <span style={{ background: "#e2e8f0", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace", fontWeight: "700", border: "1px solid #cbd5e1" }}>{sc.keys}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
