"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";

interface Shortcut {
  id: number;
  keys: string;
  destination: string;
  description: string;
}

export default function ShortcutsPage() {
  const router = useRouter();
  const { settings } = useWebsiteSettings();
  const brandName = settings?.site_title?.split("-")[0]?.trim() || settings?.site_title || "Heba Cab";

  // Active Shortcuts state (mock CRUD in state for instant feedback)
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([
    { id: 1, keys: "Alt + H", destination: "/admin/hub", description: "Navigate directly to Central Hub" },
    { id: 2, keys: "Alt + B", destination: "/admin/bookings", description: "Create new transport booking" },
    { id: 3, keys: "Alt + C", destination: "/admin/customers", description: "Open customers registry" },
    { id: 4, keys: "Alt + E", destination: "/admin/extras", description: "Unlock Advanced Utilities panel" },
  ]);

  // Form states
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [keysInput, setKeysInput] = useState("");
  const [destInput, setDestInput] = useState("");
  const [descInput, setDescInput] = useState("");

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleAddOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keysInput.trim() || !destInput.trim() || !descInput.trim()) {
      showToast("Please fill all fields.", "error");
      return;
    }

    if (isEditing !== null) {
      // Update
      setShortcuts((prev) =>
        prev.map((s) =>
          s.id === isEditing
            ? { ...s, keys: keysInput, destination: destInput, description: descInput }
            : s
        )
      );
      showToast("Shortcut updated successfully!", "success");
      setIsEditing(null);
    } else {
      // Add
      const newShortcut: Shortcut = {
        id: Date.now(),
        keys: keysInput,
        destination: destInput,
        description: descInput,
      };
      setShortcuts((prev) => [...prev, newShortcut]);
      showToast("New keyboard shortcut registered!", "success");
    }

    // Reset inputs
    setKeysInput("");
    setDestInput("");
    setDescInput("");
  };

  const handleStartEdit = (s: Shortcut) => {
    setIsEditing(s.id);
    setKeysInput(s.keys);
    setDestInput(s.destination);
    setDescInput(s.description);
  };

  const handleDelete = (id: number) => {
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
    showToast("Shortcut removed.", "success");
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setKeysInput("");
    setDestInput("");
    setDescInput("");
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
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #dc2626 0%, #f97316 100%)", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
        <div>
          <h2>System Hotkey Shortcuts</h2>
          <p>Configure quick-access hotkeys to navigate the portal without clicking.</p>
        </div>
        <button onClick={() => router.push("/admin/hub")} className="form-btn-back">
          <i className="fas fa-arrow-left"></i>
          <span>Back to Hub</span>
        </button>
      </div>

      {/* Add / Edit Form Card */}
      <div className="form-card" style={{ borderLeft: "5px solid #dc2626" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#dc2626", marginBottom: "15px", marginTop: 0 }}>
          <i className="fas fa-plus-circle" style={{ marginRight: "8px" }}></i>
          {isEditing !== null ? "Modify Shortcut" : "Register Keyboard Shortcut"}
        </h3>
        <form onSubmit={handleAddOrUpdate} className="form-grid">
          <div>
            <label className="form-label">Shortcut Key Combination *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-keyboard form-icon"></i>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Alt + G"
                value={keysInput}
                onChange={(e) => setKeysInput(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Destination Link / Action *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-link form-icon"></i>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. /admin/payments"
                value={destInput}
                onChange={(e) => setDestInput(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group-full">
            <label className="form-label">Action Description *</label>
            <div className="form-input-wrapper">
              <i className="fas fa-comment form-icon"></i>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Open payments registry"
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group-full form-submit-row" style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
            {isEditing !== null && (
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{
                  background: "transparent", color: "#64748b", border: "1px solid #cbd5e1",
                  borderRadius: "6px", padding: "8px 20px", fontSize: "13px", fontWeight: "600", cursor: "pointer"
                }}
              >
                Cancel Edit
              </button>
            )}
            <button type="submit" className="btn-submit" style={{ background: "linear-gradient(135deg, #dc2626 0%, #f97316 100%)", width: "auto" }}>
              {isEditing !== null ? "Update Shortcut" : "Save Shortcut"}
            </button>
          </div>
        </form>
      </div>

      {/* Table Card */}
      <div className="table-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
            <i className="fas fa-list-ul" style={{ marginRight: "8px", color: "#dc2626" }}></i> Active Shortcut Mappings
          </h3>
        </div>

        <div className="table-responsive">
          <table className="db-table" style={{ margin: 0, fontSize: "13px" }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: "16px" }}>Shortcut Key</th>
                <th>Destination Link</th>
                <th>Action Description</th>
                <th style={{ paddingRight: "16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shortcuts.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                    No hotkeys configured yet.
                  </td>
                </tr>
              ) : (
                shortcuts.map((s) => (
                  <tr key={s.id}>
                    <td style={{ paddingLeft: "16px" }}>
                      <span style={{
                        background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5",
                        padding: "4px 10px", borderRadius: "6px", fontSize: "12px",
                        fontFamily: "monospace", fontWeight: "700"
                      }}>
                        {s.keys}
                      </span>
                    </td>
                    <td style={{ fontWeight: "600", color: "#475569" }}>
                      <code>{s.destination}</code>
                    </td>
                    <td style={{ color: "#1e293b", fontWeight: "600" }}>
                      {s.description}
                    </td>
                    <td style={{ paddingRight: "16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "8px" }}>
                        <button
                          title="Edit Shortcut"
                          onClick={() => handleStartEdit(s)}
                          style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          title="Delete Shortcut"
                          onClick={() => handleDelete(s.id)}
                          style={{ background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <i className="fas fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", color: "#94a3b8", fontSize: "12px" }}>
        <span>&copy; {new Date().getFullYear()} {brandName}. Hotkey Accessibility Manager.</span>
        <span>v2.0</span>
      </div>
    </div>
  );
}
