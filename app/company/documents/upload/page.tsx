"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/utils/api";
import CustomerSearchDropdown from "@/components/admin/CustomerSearchDropdown";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/umrahcab";
const IMAGE_BASE = API_URL.split("/api/")[0] || "http://localhost:8000";

function CompanyDocumentUploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledCustomerId = searchParams.get("customerId") || searchParams.get("customer_id") || "";

  // Selected customer state
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Documents list
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Viewer states
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<any | null>(null);

  // Delete states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<number | null>(null);

  const downloadFile = (filePath: string) => {
    const downloadUrl = `${API_URL}/download-file?path=${encodeURIComponent(filePath)}`;
    window.location.href = downloadUrl;
  };

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

  // If customer is prefilled via URL, fetch customer details using company endpoint
  useEffect(() => {
    if (prefilledCustomerId) {
      const fetchCustomerDetails = async () => {
        try {
          const res = await api.getCustomer(prefilledCustomerId);
          if (res) {
            setSelectedCustomer(res.customer || res);
          }
        } catch (err) {
          console.error("Error fetching prefilled B2B customer:", err);
        }
      };
      fetchCustomerDetails();
    }
  }, [prefilledCustomerId]);

  // Load documents whenever selected customer changes
  useEffect(() => {
    if (selectedCustomer?.id) {
      loadCustomerDocuments(selectedCustomer.id);
    } else {
      setDocuments([]);
    }
  }, [selectedCustomer]);

  const loadCustomerDocuments = async (customerId: string) => {
    try {
      setLoadingDocs(true);
      const res = await api.getCustomerDocuments(customerId, true); // true = isCompany
      if (res && Array.isArray(res)) {
        setDocuments(res);
      } else {
        setDocuments([]);
      }
    } catch (err) {
      console.error("Error loading documents:", err);
      showToast("Failed to load documents", "error");
    } finally {
      setLoadingDocs(false);
    }
  };

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
      validateAndSetFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(selectedFile.type)) {
      showToast("Only PDF and Image files (JPG, PNG) are allowed.", "error");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      showToast("Maximum file size allowed is 10MB.", "error");
      return;
    }

    setFile(selectedFile);
    if (!title) {
      // Auto-set title to filename without extension
      const nameWithoutExt = selectedFile.name.substring(0, selectedFile.name.lastIndexOf(".")) || selectedFile.name;
      setTitle(nameWithoutExt);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer) {
      showToast("Please select a customer first.", "error");
      return;
    }

    if (!file) {
      showToast("Please select a document file to upload.", "error");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("customer_id", selectedCustomer.id);
      formData.append("title", title);
      formData.append("document_file", file);

      const res = await api.uploadCustomerDocument(formData, true); // true = isCompany

      if (res) {
        showToast("Document uploaded successfully!", "success");
        setTitle("");
        setFile(null);
        // Reset file input element
        const fileInput = document.getElementById("document-file-input") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        
        // Reload documents list
        loadCustomerDocuments(selectedCustomer.id);
      } else {
        showToast("Failed to upload document.", "error");
      }
    } catch (err) {
      console.error("Upload error:", err);
      showToast("An error occurred during file upload.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (id: number) => {
    try {
      const res = await api.deleteCustomerDocument(id, true); // true = isCompany
      if (res) {
        showToast("Document deleted successfully!", "success");
        if (selectedCustomer?.id) {
          loadCustomerDocuments(selectedCustomer.id);
        }
      } else {
        showToast("Failed to delete document.", "error");
      }
    } catch (err) {
      console.error("Delete error:", err);
      showToast("An error occurred while deleting the document.", "error");
    }
  };

  const getFileUrl = (path: string) => {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    return `${IMAGE_BASE}${path}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "10px" }}>
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: toast.type === "success" ? "#d4af37" : "#ef4444",
          color: toast.type === "success" ? "#0f172a" : "#ffffff", padding: "12px 24px", borderRadius: "8px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)", fontWeight: "700",
          fontSize: "14px", display: "flex", alignItems: "center", gap: "10px",
        }}>
          <i className={toast.type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header card */}
      <div className="form-header-card" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", border: "1px solid #334155", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <h2 style={{ color: "#ffffff" }}>Upload Customer Documents</h2>
            <span style={{ background: "linear-gradient(135deg, #d4af37 0%, #b48a1d 100%)", color: "#0f172a", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>B2B Agent Portal</span>
          </div>
          <p style={{ color: "#94a3b8" }}>Attach passport copies, e-visas, vouchers, or ticket images directly to a pilgrim's bio for quick viewing and downloading.</p>
        </div>
        <button onClick={() => router.push(prefilledCustomerId ? `/company/customers` : `/company/dashboard`)} className="form-btn-back" style={{ border: "1px solid #d4af37", color: "#d4af37" }}>
          <i className="fas fa-arrow-left"></i>
          <span>Back</span>
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px", alignItems: "start" }}>
        
        {/* Left Column: Upload Form */}
        <div className="form-card" style={{ display: "flex", flexDirection: "column", gap: "20px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="fas fa-file-arrow-up" style={{ color: "#d4af37" }}></i>
            <span>Upload Document</span>
          </h3>

          <form onSubmit={handleUploadSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Customer Search Dropdown */}
            <div>
              <CustomerSearchDropdown
                selectedCustomer={selectedCustomer}
                onSelectCustomer={(cust) => setSelectedCustomer(cust)}
                disabled={!!prefilledCustomerId}
                themeColor="#d4af37"
                required={true}
              />
              {prefilledCustomerId && (
                <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                  <i className="fas fa-lock" style={{ marginRight: "4px" }}></i> Context locked via URL.
                </span>
              )}
            </div>

            {/* Title / Description */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, color: "#334155" }}>Document Title / Description</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Passport Copy, E-Visa, Flight Ticket"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ borderColor: "#cbd5e1" }}
              />
            </div>

            {/* File Dropzone */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, color: "#334155" }}>Select File</label>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("document-file-input")?.click()}
                style={{
                  border: isDragging ? "2px dashed #d4af37" : "2px dashed #cbd5e1",
                  borderRadius: "8px",
                  background: isDragging ? "#fefdf6" : "#f8fafc",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "30px 20px",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  minHeight: "150px"
                }}
              >
                <input
                  type="file"
                  id="document-file-input"
                  style={{ display: "none" }}
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileChange}
                />

                <i className="fas fa-cloud-arrow-up" style={{ fontSize: "36px", color: file ? "#10b981" : "#94a3b8", marginBottom: "12px" }}></i>
                
                {file ? (
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>
                      Selected: {file.name}
                    </p>
                    <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.name.split('.').pop()?.toUpperCase() || file.type.split("/")[1]?.toUpperCase()}
                    </p>
                  </div>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a", margin: "0 0 4px 0" }}>
                      Drag and drop file here, or click to select
                    </p>
                    <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
                      Allowed types: PDF, PNG, JPG, JPEG, Word, Excel (Max 10MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={uploading || !selectedCustomer || !file}
              className="btn-submit"
              style={{
                background: "linear-gradient(135deg, #d4af37 0%, #b48a1d 100%)",
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px",
                fontSize: "14px",
                fontWeight: "700",
                marginTop: "10px",
                border: "none",
                opacity: (!selectedCustomer || !file) ? 0.6 : 1
              }}
            >
              {uploading ? (
                <>
                  <div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", borderTopColor: "#0f172a" }}></div>
                  <span>Uploading Document...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-upload"></i>
                  <span>Upload & Attach</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Existing Attached Documents */}
        <div className="form-card" style={{ display: "flex", flexDirection: "column", gap: "20px", minHeight: "360px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="fas fa-folder-open" style={{ color: "#d4af37" }}></i>
            <span>Attached Documents</span>
          </h3>

          {!selectedCustomer ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: "40px 20px", color: "#64748b", background: "#f8fafc", borderRadius: "8px" }}>
              <i className="fas fa-user-slash" style={{ fontSize: "28px", color: "#cbd5e1", marginBottom: "12px" }}></i>
              <span style={{ fontSize: "13px", fontWeight: "600" }}>Select a customer to view attached documents</span>
            </div>
          ) : loadingDocs ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: "40px" }}>
              <div className="spinner" style={{ width: "32px", height: "32px", borderWidth: "3px", borderTopColor: "#d4af37", marginBottom: "12px" }}></div>
              <span style={{ fontSize: "13px", color: "#64748b" }}>Loading customer attachments...</span>
            </div>
          ) : documents.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: "40px 20px", color: "#64748b", background: "#f8fafc", borderRadius: "8px" }}>
              <i className="fas fa-folder-open" style={{ fontSize: "28px", color: "#cbd5e1", marginBottom: "12px" }}></i>
              <span style={{ fontSize: "13px", fontWeight: "600" }}>No documents uploaded for this customer yet.</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {documents.map((doc) => {
                const isPdf = doc.file_type?.toLowerCase() === "pdf";
                return (
                  <div
                    key={doc.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      transition: "all 0.15s"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "6px",
                        background: isPdf ? "#fee2e2" : "#e0f2fe",
                        color: isPdf ? "#ef4444" : "#0284c7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px"
                      }}>
                        <i className={isPdf ? "fas fa-file-pdf" : "fas fa-file-image"}></i>
                      </div>
                      
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>{doc.title}</span>
                        <span style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                          Uploaded by {doc.uploaded_by || "Agent"} • {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {/* View / Download */}
                      <button
                        type="button"
                        onClick={() => {
                          setViewerDoc(doc);
                          setViewerOpen(true);
                        }}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "6px",
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          color: "#475569",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "all 0.15s"
                        }}
                        title="View Document"
                      >
                        <i className="fas fa-eye" style={{ fontSize: "12px" }}></i>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          downloadFile(doc.file_path);
                        }}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "6px",
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          color: "#059669",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "all 0.15s"
                        }}
                        title="Download"
                      >
                        <i className="fas fa-download" style={{ fontSize: "12px" }}></i>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDocToDelete(doc.id);
                          setDeleteConfirmOpen(true);
                        }}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "6px",
                          background: "#fee2e2",
                          border: "1px solid #fecaca",
                          color: "#dc2626",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "all 0.15s"
                        }}
                        title="Delete"
                      >
                        <i className="fas fa-trash-can" style={{ fontSize: "12px" }}></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {viewerOpen && viewerDoc && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "90%",
            maxWidth: "800px",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "16px 24px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#f8fafc"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: viewerDoc.file_type?.toLowerCase() === "pdf" ? "#fee2e2" : "#e0f2fe",
                  color: viewerDoc.file_type?.toLowerCase() === "pdf" ? "#ef4444" : "#0284c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px"
                }}>
                  <i className={viewerDoc.file_type?.toLowerCase() === "pdf" ? "fas fa-file-pdf" : "fas fa-file-image"}></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>{viewerDoc.title}</h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#64748b" }}>
                    Type: {viewerDoc.file_type?.toUpperCase()} • Uploaded by {viewerDoc.uploaded_by || "User"}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    downloadFile(viewerDoc.file_path);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#10b981",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 14px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                >
                  <i className="fas fa-download"></i> Download
                </button>
                <button
                  type="button"
                  onClick={() => { setViewerOpen(false); setViewerDoc(null); }}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "8px",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: "24px",
              overflowY: "auto",
              background: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              minHeight: "350px"
            }}>
              {(() => {
                const ext = viewerDoc.file_type?.toLowerCase();
                const url = getFileUrl(viewerDoc.file_path);

                if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
                  return (
                    <img
                      src={url}
                      alt={viewerDoc.title}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "65vh",
                        objectFit: "contain",
                        borderRadius: "8px",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
                      }}
                    />
                  );
                } else if (ext === "pdf") {
                  return (
                    <iframe
                      src={url}
                      style={{
                        width: "100%",
                        height: "65vh",
                        border: "none",
                        borderRadius: "8px",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
                      }}
                    />
                  );
                } else {
                  return (
                    <div style={{
                      background: "#ffffff",
                      borderRadius: "12px",
                      padding: "30px 40px",
                      textAlign: "center",
                      maxWidth: "400px",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
                    }}>
                      <div style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        background: "#fef3c7",
                        color: "#d97706",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        margin: "0 auto 16px auto"
                      }}>
                        <i className="fas fa-file-lines"></i>
                      </div>
                      <h4 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "16px", fontWeight: "700" }}>
                        Preview Not Available
                      </h4>
                      <p style={{ margin: "0 0 20px 0", color: "#64748b", fontSize: "13px", lineHeight: "1.5" }}>
                        Direct preview is not supported for <strong>.{ext.toUpperCase()}</strong> files. Please download the file to view it on your device.
                      </p>
                      <button
                        type="button"
                        onClick={() => downloadFile(viewerDoc.file_path)}
                        style={{
                          background: "#d4af37",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "10px 20px",
                          fontSize: "13px",
                          fontWeight: "700",
                          cursor: "pointer",
                          width: "100%",
                          boxShadow: "0 4px 10px rgba(212, 175, 55, 0.3)"
                        }}
                      >
                        <i className="fas fa-download" style={{ marginRight: "8px" }}></i> Download Document
                      </button>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}

      {deleteConfirmOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          padding: "20px"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "90%",
            maxWidth: "420px",
            padding: "24px",
            textAlign: "center",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "#fee2e2",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              margin: "0 auto 16px auto"
            }}>
              <i className="fas fa-triangle-exclamation"></i>
            </div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
              Delete Document?
            </h3>
            <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>
              Are you sure you want to permanently delete this document? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDocToDelete(null);
                }}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#475569",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "background 0.15s"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (docToDelete) {
                    await handleDeleteDoc(docToDelete);
                  }
                  setDeleteConfirmOpen(false);
                  setDocToDelete(null);
                }}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#ef4444",
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  boxShadow: "0 4px 10px rgba(239, 68, 68, 0.2)"
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompanyDocumentUploadPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
        <div className="spinner" style={{ width: "32px", height: "32px", borderWidth: "3px", borderTopColor: "#d4af37" }}></div>
      </div>
    }>
      <CompanyDocumentUploadContent />
    </Suspense>
  );
}
