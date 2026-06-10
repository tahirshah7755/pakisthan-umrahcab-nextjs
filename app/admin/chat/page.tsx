"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "../../../utils/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/umrahcab";
const IMAGE_BASE = API_URL.split("/api/")[0] || "http://localhost:8000";

interface Company {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  logo_path: string | null;
}

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

interface ChatRoom {
  company: Company;
  last_message: ChatMessage | null;
  unread_count: number;
  updated_at: string;
}

interface FilePreview {
  url: string;
  name: string;
  isImage: boolean;
  isPdf: boolean;
}

export default function AdminChatPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [activePreviewFile, setActivePreviewFile] = useState<FilePreview | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const roomsRef = useRef<ChatRoom[]>([]);

  // Keep rooms reference updated for sound checks
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  // Audio helper for live chime
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
      console.warn("Audio blocked", e);
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

  // Fetch all chat rooms/companies
  const fetchRooms = async (isInitial = false) => {
    try {
      const data = await api.getAdminChatRooms();
      if (data) {
        if (!isInitial) {
          let hasNewUnread = false;
          data.forEach((newRoom: ChatRoom) => {
            const oldRoom = roomsRef.current.find(r => r.company.id === newRoom.company.id);
            if (newRoom.unread_count > (oldRoom ? oldRoom.unread_count : 0)) {
              hasNewUnread = true;
            }
          });
          if (hasNewUnread) {
            playNewMessageSound();
          }
        }
        setRooms(data);
      }
    } catch (err) {
      console.error("Error fetching rooms:", err);
    } finally {
      if (isInitial) setLoadingRooms(false);
    }
  };

  // Fetch messages for active room
  const fetchMessagesForRoom = async (companyId: number, isInitial = false) => {
    if (isInitial) setLoadingMessages(true);
    try {
      const data = await api.getAdminChatMessages(companyId);
      if (data) {
        setMessages((prev) => {
          const hasNewMessages = data.length > prev.length;
          if (prev.length !== data.length || JSON.stringify(prev) !== JSON.stringify(data)) {
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
      if (isInitial) setLoadingMessages(false);
    }
  };

  // Poll chat rooms (every 2 seconds)
  useEffect(() => {
    fetchRooms(true);
    pollingIntervalRef.current = setInterval(() => {
      fetchRooms(false);
    }, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Poll messages for active room
  useEffect(() => {
    if (!selectedRoom) return;

    fetchMessagesForRoom(selectedRoom.company.id, true);
    const msgInterval = setInterval(() => {
      fetchMessagesForRoom(selectedRoom.company.id, false);
    }, 2000);

    return () => {
      clearInterval(msgInterval);
    };
  }, [selectedRoom]);

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

  // Handle select room
  const handleSelectRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    setReplyTo(null);
    setSelectedFile(null);
    setInputText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowMobileChat(true);

    setRooms(prevRooms =>
      prevRooms.map(r =>
        r.company.id === room.company.id ? { ...r, unread_count: 0 } : r
      )
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || (!inputText.trim() && !selectedFile)) return;

    const currentInput = inputText.trim();
    const currentReplyTo = replyTo;
    const currentFile = selectedFile;

    const tempId = -Date.now();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      company_id: selectedRoom.company.id,
      sender_type: "admin",
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

      const res = await api.sendAdminChatMessage(selectedRoom.company.id, formData);
      if (res && res.success) {
        fetchMessagesForRoom(selectedRoom.company.id, false);
        fetchRooms(false);
      } else {
        setMessages((prev) => prev.filter(m => m.id !== tempId));
      }
    } catch (err) {
      console.error("Error sending admin message:", err);
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

  const formatLastMsgTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch (e) {
      return "";
    }
  };

  const handleOpenPreview = (path: string) => {
    const filename = getFileName(path);
    const url = `${IMAGE_BASE}/${path}`;
    const isImg = isImageFile(path);
    const isPdf = path.toLowerCase().endsWith(".pdf");

    setActivePreviewFile({
      url,
      name: filename,
      isImage: isImg,
      isPdf
    });
  };

  const filteredRooms = rooms.filter((r) =>
    r.company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: "5px", height: "calc(100vh - 120px)", display: "flex" }}>
      {/* Premium Outer Container */}
      <div 
        style={{ 
          background: "#ffffff", 
          borderRadius: "16px", 
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)", 
          display: "flex", 
          flexGrow: 1, 
          overflow: "hidden",
          border: "1px solid #edf2f9"
        }}
      >
        {/* Left Side: Rooms / Companies Panel */}
        <div 
          className={`admin-chat-left-pane ${showMobileChat ? "mobile-hidden" : "mobile-visible"}`}
          style={{ 
            width: "340px", 
            borderRight: "1px solid #edf2f9", 
            display: "flex", 
            flexDirection: "column",
            flexShrink: 0
          }}
        >
          {/* Panel Search Header */}
          <div style={{ padding: "20px", borderBottom: "1px solid #edf2f9", background: "#f8fafc" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", margin: "0 0 12px 0" }}>B2B Live Support</h3>
            <div style={{ position: "relative" }}>
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search agent or company..." 
                style={{ 
                  width: "100%", 
                  height: "38px", 
                  background: "#ffffff", 
                  border: "1px solid #cbd5e1", 
                  borderRadius: "8px", 
                  padding: "0 15px 0 35px", 
                  fontSize: "13px",
                  outline: "none"
                }}
              />
              <i 
                className="fas fa-search" 
                style={{ position: "absolute", left: "12px", top: "12px", color: "#94a3b8", fontSize: "13px" }}
              ></i>
            </div>
          </div>

          {/* Rooms List */}
          <div style={{ flexGrow: 1, overflowY: "auto", padding: "10px" }}>
            {loadingRooms ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
                <div className="spinner-gold" style={{ width: "30px", height: "30px" }}></div>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 10px", color: "#94a3b8", fontSize: "13px" }}>
                No active chat connections found.
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isSelected = selectedRoom?.company.id === room.company.id;
                return (
                  <div 
                    key={room.company.id}
                    onClick={() => handleSelectRoom(room)}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "12px", 
                      padding: "12px", 
                      borderRadius: "10px", 
                      cursor: "pointer", 
                      background: isSelected ? "rgba(212, 175, 55, 0.08)" : "transparent",
                      marginBottom: "6px",
                      transition: "background 0.2s"
                    }}
                    onMouseOver={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "#f8fafc";
                    }}
                    onMouseOut={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div 
                      style={{ 
                        width: "42px", 
                        height: "42px", 
                        borderRadius: "50%", 
                        background: room.company.logo_path ? "rgba(0,0,0,0.02)" : "linear-gradient(135deg, #d4af37 0%, #b48a1d 100%)", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        overflow: "hidden",
                        border: "1px solid #edf2f9",
                        flexShrink: 0
                      }}
                    >
                      {room.company.logo_path ? (
                        <img 
                          src={`${IMAGE_BASE}/${room.company.logo_path}`} 
                          alt="Logo" 
                          style={{ width: "100%", height: "100%", objectFit: "contain" }} 
                        />
                      ) : (
                        <i className="fas fa-handshake" style={{ color: "#ffffff", fontSize: "16px" }}></i>
                      )}
                    </div>

                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "3px" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {room.company.name}
                        </h4>
                        <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                          {formatLastMsgTime(room.last_message ? room.last_message.created_at : null)}
                        </span>
                      </div>
                      <p style={{ fontSize: "12px", color: room.unread_count > 0 ? "#1e293b" : "#64748b", fontWeight: room.unread_count > 0 ? "700" : "400", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {room.last_message 
                          ? (room.last_message.sender_type === "admin" ? "You: " : "") + (room.last_message.message || "📎 Shared File")
                          : "No conversation history."}
                      </p>
                    </div>

                    {room.unread_count > 0 && (
                      <div style={{ background: "#d4af37", color: "#ffffff", fontWeight: "700", fontSize: "11px", borderRadius: "50%", minWidth: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px", flexShrink: 0 }}>
                        {room.unread_count}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Message Thread Area */}
        <div 
          className={`admin-chat-right-pane ${showMobileChat ? "mobile-visible" : "mobile-hidden"}`}
          style={{ 
            flexGrow: 1, 
            display: "flex", 
            flexDirection: "column",
            background: "#f1f5f9"
          }}
        >
          {selectedRoom ? (
            <>
              {/* Header */}
              <div style={{ background: "#ffffff", padding: "16px 20px", borderBottom: "1px solid #edf2f9", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button className="mobile-back-btn" onClick={() => setShowMobileChat(false)} style={{ background: "transparent", border: "none", fontSize: "16px", cursor: "pointer", color: "#64748b", padding: "5px", marginRight: "5px" }}>
                    <i className="fas fa-arrow-left"></i>
                  </button>

                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: selectedRoom.company.logo_path ? "rgba(0,0,0,0.02)" : "linear-gradient(135deg, #d4af37 0%, #b48a1d 100%)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid #edf2f9" }}>
                    {selectedRoom.company.logo_path ? (
                      <img src={`${IMAGE_BASE}/${selectedRoom.company.logo_path}`} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    ) : (
                      <i className="fas fa-handshake" style={{ color: "#ffffff", fontSize: "14px" }}></i>
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", margin: 0 }}>{selectedRoom.company.name}</h3>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Email: {selectedRoom.company.email} | Phone: {selectedRoom.company.phone || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Message List */}
              <div 
                ref={chatContainerRef}
                style={{ flexGrow: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" }}
              >
                {loadingMessages ? (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                    <div className="spinner-gold" style={{ width: "40px", height: "40px" }}></div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_type === "admin";
                    return (
                      <div key={msg.id} className="msg-fade-in" style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", position: "relative" }}>
                        <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                          {/* Quoted Message */}
                          {msg.reply_to && (
                            <div style={{ background: isMe ? "#f1f5f9" : "#e2e8f0", color: "#475569", padding: "8px 12px", borderRadius: "8px 8px 0 0", fontSize: "12px", borderLeft: isMe ? "3px solid #b48a1d" : "3px solid #64748b", maxWidth: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "-2px", opacity: 0.85 }}>
                              <i className="fas fa-quote-left" style={{ marginRight: "5px", fontSize: "10px" }}></i>
                              {msg.reply_to.message ? msg.reply_to.message : "📎 Attachment File"}
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div className={`chat-message-bubble-hover ${isMe ? "sender" : "receiver"}`} style={{ background: isMe ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" : "#ffffff", color: isMe ? "#ffffff" : "#334155", padding: "10px 14px", borderRadius: msg.reply_to ? (isMe ? "12px 0px 12px 12px" : "0px 12px 12px 12px") : "12px", boxShadow: "0 2px 6px rgba(0,0,0,0.03)", border: isMe ? "none" : "1px solid #e2e8f0", position: "relative", opacity: msg.isOptimistic ? 0.6 : 1, transition: "all 0.3s ease" }}>
                            {/* Image Attachment */}
                            {msg.attachment && isImageFile(msg.attachment) && (
                              <div style={{ marginBottom: msg.message ? "8px" : "0px", borderRadius: "8px", overflow: "hidden" }}>
                                {msg.isOptimistic ? (
                                  <div style={{ width: "180px", height: "100px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <i className="fas fa-circle-notch fa-spin"></i>
                                  </div>
                                ) : (
                                  <img 
                                    src={`${IMAGE_BASE}/${msg.attachment}`} 
                                    alt="Attachment" 
                                    style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "cover", display: "block", cursor: "pointer" }} 
                                    onClick={() => handleOpenPreview(msg.attachment!)}
                                  />
                                )}
                              </div>
                            )}

                            {/* File Attachment */}
                            {msg.attachment && !isImageFile(msg.attachment) && (
                              <div style={{ background: isMe ? "rgba(255,255,255,0.08)" : "#f1f5f9", padding: "8px 12px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px", marginBottom: msg.message ? "8px" : "0px" }}>
                                <i className="fas fa-file-pdf" style={{ fontSize: "20px", color: isMe ? "#d4af37" : "#ef4444" }}></i>
                                {msg.isOptimistic ? (
                                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>Uploading {msg.attachment}...</span>
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

                            {msg.message && <p style={{ margin: 0, fontSize: "13px", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>{msg.message}</p>}

                            {!msg.isOptimistic && (
                              <button onClick={() => setReplyTo(msg)} title="Reply to this message" className="reply-hover-btn" style={{ position: "absolute", right: isMe ? "auto" : "-35px", left: isMe ? "-35px" : "auto", top: "50%", transform: "translateY(-50%)", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "50%", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#64748b", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.08)", transition: "all 0.2s" }}>
                                <i className="fas fa-reply"></i>
                              </button>
                            )}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "3px" }}>
                            <span style={{ fontSize: "9px", color: "#94a3b8" }}>{formatTime(msg.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef}></div>
              </div>

              {/* Staged reply previews */}
              {replyTo && (
                <div style={{ background: "#ffffff", borderTop: "1px solid #e2e8f0", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                    <i className="fas fa-reply" style={{ color: "#d4af37", fontSize: "13px" }}></i>
                    <span style={{ fontSize: "12px", color: "#475569" }}>
                      Replying to <strong style={{ color: "#1e293b" }}>{replyTo.sender_type === "admin" ? "You" : selectedRoom.company.name}</strong>: <span style={{ fontStyle: "italic", opacity: 0.8 }}>{replyTo.message ? replyTo.message : "📎 Attachment File"}</span>
                    </span>
                  </div>
                  <button onClick={() => setReplyTo(null)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                    <i className="fas fa-times-circle" style={{ fontSize: "16px" }}></i>
                  </button>
                </div>
              )}

              {selectedFile && (
                <div style={{ background: "#fffbeb", borderTop: "1px solid #fef3c7", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fas fa-paperclip" style={{ color: "#d4af37" }}></i>
                    <span style={{ fontSize: "12px", color: "#b45309" }}>Staged File: <strong style={{ textDecoration: "underline" }}>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button onClick={removeSelectedFile} style={{ background: "transparent", border: "none", color: "#b45309", cursor: "pointer" }}>
                    <i className="fas fa-times-circle" style={{ fontSize: "16px" }}></i>
                  </button>
                </div>
              )}

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} style={{ padding: "16px 20px", background: "#ffffff", borderTop: "1px solid #edf2f9", display: "flex", alignItems: "center", gap: "12px" }}>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: "rgba(148, 163, 184, 0.08)", border: "none", color: "#64748b", fontSize: "18px", cursor: "pointer", width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="fas fa-paperclip"></i>
                </button>
                <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type a message reply..." style={{ flexGrow: 1, height: "40px", border: "1px solid #cbd5e1", borderRadius: "20px", padding: "0 18px", fontSize: "13px", outline: "none" }} />
                <button type="submit" disabled={sending || (!inputText.trim() && !selectedFile)} style={{ background: sending || (!inputText.trim() && !selectedFile) ? "#cbd5e1" : "linear-gradient(135deg, #d4af37 0%, #b48a1d 100%)", color: "#ffffff", border: "none", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 10px rgba(212,175,55,0.2)" }}>
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px", textAlign: "center", opacity: 0.75 }}>
              <div style={{ fontSize: "56px", color: "#cbd5e1", marginBottom: "20px", background: "#ffffff", width: "110px", height: "110px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="far fa-comments" style={{ color: "#d4af37" }}></i>
              </div>
              <h3 style={{ color: "#1e293b", fontWeight: "800", fontSize: "18px", margin: "0 0 8px 0" }}>Support Live Workspace</h3>
              <p style={{ color: "#64748b", fontSize: "14px", maxWidth: "340px", margin: 0, lineHeight: 1.5 }}>Select an active B2B Company from the left list.</p>
            </div>
          )}
        </div>
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
        .msg-fade-in {
          animation: message-slide-up 0.22s ease forwards;
        }
        @keyframes message-slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .reply-hover-btn {
          opacity: 0 !important;
        }
        .chat-message-bubble-hover:hover .reply-hover-btn {
          opacity: 1 !important;
        }
        .chat-message-bubble-hover.sender:hover {
          transform: translateX(-3px);
        }
        .chat-message-bubble-hover.receiver:hover {
          transform: translateX(3px);
        }
        @media (min-width: 769px) {
          .mobile-back-btn {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .admin-chat-left-pane {
            width: 100% !important;
          }
          .mobile-hidden {
            display: none !important;
          }
          .mobile-visible {
            display: flex !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
