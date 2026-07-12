"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "../../../utils/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/umrahcab";
const IMAGE_BASE = API_URL.split("/api/")[0] || "http://localhost:8000";

const getFileUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}/view-file?path=${encodeURIComponent(cleanPath)}`;
};

interface ChatMessage {
  id: number;
  company_id: number;
  sender_type: "company" | "admin";
  sender_id: number;
  message: string | null;
  attachment: string | null;
  reply_to_id: number | null;
  reply_to?: ChatMessage | null;
  is_read: boolean;
  created_at: string;
  isOptimistic?: boolean;
}

interface FilePreview {
  url: string;
  name: string;
  isImage: boolean;
  isPdf: boolean;
}

export default function CompanyChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activePreviewFile, setActivePreviewFile] = useState<FilePreview | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Play live chat chime when receiving a new message
  const playNewMessageSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0.06, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.15);

      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(783.99, ctx.currentTime);
        gain2.gain.setValueAtTime(0.08, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.25);
      }, 80);
    } catch (e) {
      console.warn("Audio Context blocked", e);
    }
  };

  const isNearBottom = () => {
    const container = chatContainerRef.current;
    if (!container) return true;
    const threshold = 150;
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <= threshold
    );
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    chatBottomRef.current?.scrollIntoView({ behavior });
  };

  // Fetch messages from backend
  const fetchMessages = async (isInitial = false) => {
    try {
      const data = await api.getCompanyChatMessages();
      if (data) {
        setMessages((prev) => {
          const hasNewMessages = data.length > prev.length;
          if (prev.length !== data.length || JSON.stringify(prev) !== JSON.stringify(data)) {
            if (hasNewMessages && !isInitial) {
              const lastNewMsg = data[data.length - 1];
              if (lastNewMsg && lastNewMsg.sender_type !== "company") {
                playNewMessageSound();
              }
            }

            const shouldScroll = isInitial || isNearBottom() || hasNewMessages;
            if (shouldScroll) {
              setTimeout(() => scrollToBottom(isInitial ? "auto" : "smooth"), 50);
            }
            return data;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  // Start polling
  useEffect(() => {
    fetchMessages(true);
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages(false);
    }, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActivePreviewFile(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedFile) return;

    const currentInput = inputText.trim();
    const currentReplyTo = replyTo;
    const currentFile = selectedFile;

    const tempId = -Date.now();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      company_id: 0,
      sender_type: "company",
      sender_id: 0,
      message: currentInput || null,
      attachment: currentFile ? currentFile.name : null,
      reply_to_id: currentReplyTo ? currentReplyTo.id : null,
      reply_to: currentReplyTo,
      is_read: false,
      created_at: new Date().toISOString(),
      isOptimistic: true
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText("");
    setSelectedFile(null);
    setReplyTo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    setTimeout(() => scrollToBottom("smooth"), 50);

    setSending(true);
    try {
      const formData = new FormData();
      if (currentInput) formData.append("message", currentInput);
      if (currentFile) formData.append("file", currentFile);
      if (currentReplyTo) formData.append("reply_to_id", String(currentReplyTo.id));

      const res = await api.sendCompanyChatMessage(formData);
      if (res && res.success) {
        fetchMessages(false);
      } else {
        setMessages((prev) => prev.filter(m => m.id !== tempId));
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((prev) => prev.filter(m => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const isImageFile = (path: string | null) => {
    if (!path) return false;
    const extension = path.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "");
  };

  const getFileName = (path: string | null) => {
    if (!path) return "";
    return path.split("/").pop() || "Attachment";
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  };

  // Open attachment in custom preview modal
  const handleOpenPreview = (path: string) => {
    const filename = getFileName(path);
    const url = getFileUrl(path);
    const isImg = isImageFile(path);
    const isPdf = path.toLowerCase().endsWith(".pdf");

    setActivePreviewFile({
      url,
      name: filename,
      isImage: isImg,
      isPdf
    });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "450px" }}>
        <div className="spinner-gold" style={{ width: "50px", height: "50px" }}></div>
      </div>
    );
  }

  return (
    <div style={{ padding: "10px", display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
      {/* Premium Outer Container */}
      <div 
        style={{ 
          background: "#ffffff", 
          borderRadius: "16px", 
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)", 
          display: "flex", 
          flexDirection: "column", 
          flexGrow: 1, 
          overflow: "hidden",
          border: "1px solid #edf2f9"
        }}
      >
        {/* Chat Header */}
        <div 
          style={{ 
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", 
            padding: "16px 24px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            borderBottom: "2px solid #d4af37"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div 
              style={{ 
                width: "44px", 
                height: "44px", 
                borderRadius: "50%", 
                background: "rgba(212, 175, 55, 0.15)", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                color: "#d4af37",
                fontSize: "20px",
                border: "1px solid rgba(212,175,55,0.3)"
              }}
            >
              <i className="fas fa-headset animate-pulse"></i>
            </div>
            <div>
              <h3 style={{ color: "#ffffff", fontSize: "16px", fontWeight: "700", margin: 0, letterSpacing: "0.5px" }}>Support Live Desk</h3>
              <p style={{ color: "#10b981", fontSize: "12px", fontWeight: "600", margin: "2px 0 0 0", display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="live-dot" style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                System Connection Active
              </p>
            </div>
          </div>
          <div style={{ color: "#94a3b8", fontSize: "12px" }}>
            <span style={{ background: "rgba(212,175,55,0.15)", color: "#d4af37", padding: "4px 10px", borderRadius: "12px", fontWeight: "700", fontSize: "11px" }}>
              B2B AGENT PANEL
            </span>
          </div>
        </div>

        {/* Message View Area */}
        <div 
          ref={chatContainerRef}
          style={{ 
            flexGrow: 1, 
            padding: "24px", 
            overflowY: "auto", 
            background: "#f1f5f9",
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}
        >
          {messages.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.8, padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: "56px", color: "#cbd5e1", marginBottom: "20px", background: "#ffffff", width: "100px", height: "100px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="far fa-comments" style={{ color: "#d4af37" }}></i>
              </div>
              <h4 style={{ color: "#1e293b", fontWeight: "800", fontSize: "18px", margin: "0 0 8px 0" }}>Start a Conversation</h4>
              <p style={{ color: "#64748b", fontSize: "14px", maxWidth: "360px", margin: 0, lineHeight: 1.5 }}>
                Type your question below to chat in real-time with the admin support team.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_type === "company";
              return (
                <div 
                  key={msg.id} 
                  className="msg-fade-in"
                  style={{ 
                    display: "flex", 
                    justifyContent: isMe ? "flex-end" : "flex-start",
                    position: "relative"
                  }}
                >
                  <div 
                    style={{ 
                      maxWidth: "72%", 
                      display: "flex", 
                      flexDirection: "column",
                      alignItems: isMe ? "flex-end" : "flex-start"
                    }}
                  >
                    {/* Quoted Message Render */}
                    {msg.reply_to && (
                      <div 
                        style={{ 
                          background: isMe ? "#f1f5f9" : "#e2e8f0", 
                          color: "#475569", 
                          padding: "8px 12px", 
                          borderRadius: "8px 8px 0 0", 
                          fontSize: "12px",
                          borderLeft: isMe ? "3px solid #b48a1d" : "3px solid #64748b",
                          maxWidth: "100%",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          marginBottom: "-2px",
                          opacity: 0.85
                        }}
                      >
                        <i className="fas fa-quote-left" style={{ marginRight: "5px", fontSize: "10px" }}></i>
                        {msg.reply_to.message ? msg.reply_to.message : "📎 Attachment File"}
                      </div>
                    )}

                    {/* Main Message Bubble */}
                    <div 
                      className={`chat-message-bubble-hover ${isMe ? "sender" : "receiver"}`}
                      style={{ 
                        background: isMe 
                          ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" 
                          : "#ffffff", 
                        color: isMe ? "#ffffff" : "#334155", 
                        padding: "12px 16px", 
                        borderRadius: msg.reply_to 
                          ? (isMe ? "12px 0px 12px 12px" : "0px 12px 12px 12px")
                          : "12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        border: isMe ? "none" : "1px solid #e2e8f0",
                        position: "relative",
                        opacity: msg.isOptimistic ? 0.6 : 1,
                        transition: "all 0.3s ease"
                      }}
                    >
                      {/* Image Attachment Render */}
                      {msg.attachment && isImageFile(msg.attachment) && (
                        <div style={{ marginBottom: msg.message ? "8px" : "0px", borderRadius: "8px", overflow: "hidden" }}>
                          {msg.isOptimistic ? (
                            <div style={{ width: "200px", height: "120px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <i className="fas fa-circle-notch fa-spin"></i>
                            </div>
                          ) : (
                            <img 
                              src={getFileUrl(msg.attachment)} 
                              alt="Attachment" 
                              style={{ maxWidth: "100%", maxHeight: "250px", objectFit: "cover", display: "block", cursor: "pointer" }} 
                              onClick={() => handleOpenPreview(msg.attachment!)}
                            />
                          )}
                        </div>
                      )}

                      {/* File Attachment Render */}
                      {msg.attachment && !isImageFile(msg.attachment) && (
                        <div 
                          style={{ 
                            background: isMe ? "rgba(255,255,255,0.08)" : "#f1f5f9", 
                            padding: "8px 12px", 
                            borderRadius: "8px", 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "10px",
                            marginBottom: msg.message ? "8px" : "0px"
                          }}
                        >
                          <i className="fas fa-file-pdf" style={{ fontSize: "20px", color: isMe ? "#d4af37" : "#ef4444" }}></i>
                          {msg.isOptimistic ? (
                            <span style={{ fontSize: "13px", color: "#94a3b8" }}>Uploading {msg.attachment}...</span>
                          ) : (
                            <button 
                              type="button"
                              onClick={() => handleOpenPreview(msg.attachment!)}
                              style={{ 
                                background: "transparent",
                                border: "none",
                                padding: 0,
                                color: isMe ? "#d4af37" : "#2563eb", 
                                fontWeight: "600", 
                                fontSize: "13px",
                                textAlign: "left",
                                cursor: "pointer",
                                textDecoration: "underline"
                              }}
                            >
                              {getFileName(msg.attachment)}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Message Text */}
                      {msg.message && <p style={{ margin: 0, fontSize: "14px", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{msg.message}</p>}

                      {/* Reply Button */}
                      {!msg.isOptimistic && (
                        <button 
                          onClick={() => setReplyTo(msg)}
                          title="Reply to this message"
                          className="reply-hover-btn"
                          style={{
                            position: "absolute",
                            right: isMe ? "auto" : "-35px",
                            left: isMe ? "-35px" : "auto",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "50%",
                            width: "28px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            color: "#64748b",
                            cursor: "pointer",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                            transition: "all 0.2s"
                          }}
                        >
                          <i className="fas fa-reply"></i>
                        </button>
                      )}
                    </div>

                    {/* Metadata */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                      <span style={{ fontSize: "10px", color: "#94a3b8" }}>{formatTime(msg.created_at)}</span>
                      {isMe && !msg.isOptimistic && (
                        <i 
                          className={`fas ${msg.is_read ? "fa-check-double" : "fa-check"}`} 
                          style={{ fontSize: "10px", color: msg.is_read ? "#10b981" : "#94a3b8" }}
                        ></i>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatBottomRef}></div>
        </div>

        {/* Staged file / reply previews */}
        {replyTo && (
          <div style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
              <i className="fas fa-reply" style={{ color: "#d4af37", fontSize: "13px" }}></i>
              <span style={{ fontSize: "12px", color: "#475569" }}>
                Replying to <strong style={{ color: "#1e293b" }}>{replyTo.sender_type === "company" ? "You" : "Support"}</strong>:{" "}
                <span style={{ fontStyle: "italic", opacity: 0.85 }}>{replyTo.message ? replyTo.message : "📎 Attachment File"}</span>
              </span>
            </div>
            <button onClick={() => setReplyTo(null)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}>
              <i className="fas fa-times-circle" style={{ fontSize: "16px" }}></i>
            </button>
          </div>
        )}

        {selectedFile && (
          <div style={{ background: "#fffbeb", borderTop: "1px solid #fef3c7", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(212,175,55,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#d4af37" }}>
                <i className="fas fa-file-alt"></i>
              </div>
              <span style={{ fontSize: "12px", color: "#b45309" }}>
                Staged File: <strong style={{ textDecoration: "underline" }}>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button onClick={removeSelectedFile} style={{ background: "transparent", border: "none", color: "#b45309", cursor: "pointer" }}>
              <i className="fas fa-times-circle" style={{ fontSize: "16px" }}></i>
            </button>
          </div>
        )}

        {/* Input form */}
        <form onSubmit={handleSendMessage} style={{ padding: "16px 20px", background: "#ffffff", borderTop: "1px solid #edf2f9", display: "flex", alignItems: "center", gap: "12px" }}>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
          <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: "rgba(148, 163, 184, 0.08)", border: "none", color: "#64748b", fontSize: "18px", cursor: "pointer", width: "42px", height: "42px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="fas fa-paperclip"></i>
          </button>
          <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type a message here..." style={{ flexGrow: 1, height: "42px", border: "1px solid #cbd5e1", borderRadius: "24px", padding: "0 20px", fontSize: "14px", outline: "none" }} />
          <button type="submit" disabled={sending || (!inputText.trim() && !selectedFile)} style={{ background: sending || (!inputText.trim() && !selectedFile) ? "#cbd5e1" : "linear-gradient(135deg, #d4af37 0%, #b48a1d 100%)", color: "#ffffff", border: "none", borderRadius: "50%", width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", cursor: "pointer", boxShadow: "0 4px 10px rgba(212,175,55,0.2)" }}>
            <i className="fas fa-paper-plane" style={{ marginLeft: "-2px" }}></i>
          </button>
        </form>
      </div>

      {/* File Preview Lightbox Modal */}
      {activePreviewFile && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(6px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setActivePreviewFile(null)}
        >
          <div 
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "90%",
              maxWidth: "900px",
              height: "85%",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div 
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #edf2f9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc"
              }}
            >
              <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
                {activePreviewFile.name}
              </h4>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <a 
                  href={activePreviewFile.url} 
                  download={activePreviewFile.name}
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    padding: "6px 14px",
                    background: "#d4af37",
                    color: "#ffffff",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "600",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 2px 4px rgba(212,175,55,0.2)"
                  }}
                >
                  <i className="fas fa-download"></i> Download
                </a>
                <button 
                  onClick={() => setActivePreviewFile(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: "22px",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#ef4444")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "#94a3b8")}
                >
                  <i className="fas fa-times-circle"></i>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div style={{ flexGrow: 1, background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {activePreviewFile.isImage ? (
                <img 
                  src={activePreviewFile.url} 
                  alt="Preview" 
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", padding: "10px" }} 
                />
              ) : activePreviewFile.isPdf ? (
                <iframe 
                  src={activePreviewFile.url} 
                  style={{ width: "100%", height: "100%", border: "none" }}
                  title="PDF Preview"
                />
              ) : (
                <div style={{ textAlign: "center", color: "#ffffff", padding: "40px" }}>
                  <i className="fas fa-file-alt" style={{ fontSize: "80px", color: "#d4af37", marginBottom: "20px" }}></i>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>Preview Not Supported</h4>
                  <p style={{ color: "#94a3b8", fontSize: "14px", margin: "0 0 20px 0" }}>This file format cannot be viewed directly.</p>
                  <a 
                    href={activePreviewFile.url} 
                    download={activePreviewFile.name}
                    style={{
                      padding: "10px 20px",
                      background: "#d4af37",
                      color: "#ffffff",
                      borderRadius: "8px",
                      fontWeight: "600",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <i className="fas fa-download"></i> Download to Local Machine
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .live-dot { animation: pulse-dot 1.8s infinite ease-in-out; }
        @keyframes pulse-dot {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        .msg-fade-in { animation: message-slide-up 0.25s ease forwards; }
        @keyframes message-slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .reply-hover-btn { opacity: 0 !important; }
        .chat-message-bubble-hover:hover .reply-hover-btn { opacity: 1 !important; }
        .chat-message-bubble-hover.sender:hover { transform: translateX(-4px); }
        .chat-message-bubble-hover.receiver:hover { transform: translateX(4px); }
      `}</style>
    </div>
  );
}
