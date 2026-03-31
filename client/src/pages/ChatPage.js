/**
 * pages/ChatPage.js
 * Production-grade two-panel chat UI.
 *
 * Left panel  — Conversation list (unread badge, avatar, last message, online dot)
 * Right panel — Message thread (auto-scroll, infinite scroll, typing indicator,
 *               optimistic sends, delivery status badges)
 *
 * Relies entirely on useChat hook + chatSlice for state management.
 * No DB/socket logic lives in the component.
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchConversations, startConversation } from "../features/chat/chatSlice";
import { selectCurrentUser } from "../features/auth/authSlice";
import useChat from "../hooks/useChat";

// ─────────────────────────────────────────────────────────────────────────────
// Small utility components
// ─────────────────────────────────────────────────────────────────────────────

const Avatar = ({ src, name, size = 40, online = false }) => {
  const initials = (name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {src ? (
        <img
          src={src}
          alt={name}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: size * 0.38,
            userSelect: "none",
          }}
        >
          {initials}
        </div>
      )}
      {online && (
        <span
          style={{
            position: "absolute",
            bottom: 1,
            right: 1,
            width: size * 0.28,
            height: size * 0.28,
            background: "#22c55e",
            borderRadius: "50%",
            border: "2px solid #1e1e2e",
          }}
        />
      )}
    </div>
  );
};

const StatusIcon = ({ status }) => {
  if (status === "seen")
    return <span style={{ color: "#818cf8", fontSize: 12 }}>✓✓</span>;
  if (status === "delivered")
    return <span style={{ color: "#94a3b8", fontSize: 12 }}>✓✓</span>;
  if (status === "failed")
    return <span style={{ color: "#ef4444", fontSize: 12 }}>!</span>;
  return <span style={{ color: "#94a3b8", fontSize: 12 }}>✓</span>;
};

const TypingBubble = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 0" }}>
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        style={{
          display: "inline-block",
          width: 8,
          height: 8,
          background: "#94a3b8",
          borderRadius: "50%",
          animation: `typingBounce 1.2s ${i * 0.2}s infinite`,
        }}
      />
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const diffDays = Math.floor((now - d) / 86_400_000);
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

const ChatPage = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);

  // UI state
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Refs
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const topSentinelRef = useRef(null);
  const inputRef = useRef(null);

  // Active conversation ID comes from Redux; we pull it here for useChat
  const { activeConvId } = useChat(null);
  const chat = useChat(activeConvId);

  const {
    conversations,
    messages,
    hasMore,
    typingUsers,
    onlineUsers,
    loading,
    sendMessage,
    startTyping,
    stopTyping,
    loadMoreMessages,
    openConversation,
  } = chat;

  // ── Load conversations on mount ──────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  // ── Auto-scroll to bottom on new messages ────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // ── IntersectionObserver for infinite scroll (top of message list) ───────────
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading.moreMessages) {
          loadMoreMessages();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading.moreMessages, loadMoreMessages]);

  // ── Filtered conversations (search) ────────────────────────────────────────
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((conv) =>
      conv.participants?.some((p) =>
        p.name?.toLowerCase().includes(q)
      )
    );
  }, [conversations, searchQuery]);

  // ── Get the other participant in a conversation ───────────────────────────────
  const getOtherParticipant = useCallback(
    (conv) => {
      return conv.participants?.find(
        (p) => String(p._id || p) !== String(currentUser?._id)
      );
    },
    [currentUser]
  );

  // ── Unread count for current user ────────────────────────────────────────────
  const getUnread = (conv) => {
    const key = String(currentUser?._id);
    if (!conv.unreadCount || !(conv.unreadCount instanceof Object)) return 0;
    // unreadCount may be a plain object (from JSON) or a Map
    if (typeof conv.unreadCount.get === "function") {
      return conv.unreadCount.get(key) || 0;
    }
    return conv.unreadCount[key] || 0;
  };

  // ── Handle send ────────────────────────────────────────────────────────────
  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText("");
    stopTyping();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Active conversation metadata ──────────────────────────────────────────────
  const activeConversation = conversations.find((c) => c._id === activeConvId);
  const otherUser = activeConversation
    ? getOtherParticipant(activeConversation)
    : null;
  const isOtherOnline = otherUser ? !!onlineUsers[String(otherUser._id)] : false;

  // ── Styles ────────────────────────────────────────────────────────────────────
  const styles = {
    page: {
      display: "flex",
      height: "calc(100vh - 64px)",
      background: "#0f0f1a",
      color: "#e2e8f0",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      overflow: "hidden",
    },
    sidebar: {
      width: 320,
      borderRight: "1px solid #1e1e2e",
      display: "flex",
      flexDirection: "column",
      background: "#13131f",
    },
    sidebarHeader: {
      padding: "20px 16px 12px",
      borderBottom: "1px solid #1e1e2e",
    },
    sidebarTitle: {
      margin: 0,
      fontSize: 20,
      fontWeight: 700,
      color: "#e2e8f0",
      marginBottom: 12,
    },
    searchInput: {
      width: "100%",
      padding: "8px 12px",
      background: "#1e1e2e",
      border: "1px solid #2d2d3e",
      borderRadius: 8,
      color: "#e2e8f0",
      fontSize: 14,
      outline: "none",
      boxSizing: "border-box",
    },
    convList: {
      flex: 1,
      overflowY: "auto",
      scrollbarWidth: "thin",
      scrollbarColor: "#2d2d3e transparent",
    },
    convItem: (active) => ({
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 16px",
      cursor: "pointer",
      background: active ? "#1e1e30" : "transparent",
      borderLeft: active ? "3px solid #6366f1" : "3px solid transparent",
      transition: "background 0.15s",
    }),
    convBody: {
      flex: 1,
      minWidth: 0,
    },
    convName: {
      fontSize: 15,
      fontWeight: 600,
      color: "#e2e8f0",
      marginBottom: 2,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    convPreview: {
      fontSize: 13,
      color: "#94a3b8",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    convMeta: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: 4,
      flexShrink: 0,
    },
    convTime: {
      fontSize: 12,
      color: "#64748b",
    },
    unreadBadge: {
      background: "#6366f1",
      color: "#fff",
      fontSize: 11,
      fontWeight: 700,
      borderRadius: 10,
      padding: "1px 7px",
      minWidth: 20,
      textAlign: "center",
    },
    chatArea: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: "#0f0f1a",
    },
    chatHeader: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "16px 20px",
      borderBottom: "1px solid #1e1e2e",
      background: "#13131f",
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: 700,
      color: "#e2e8f0",
    },
    userStatus: {
      fontSize: 13,
      color: isOtherOnline ? "#22c55e" : "#64748b",
    },
    messagesContainer: {
      flex: 1,
      overflowY: "auto",
      padding: "16px 20px",
      scrollbarWidth: "thin",
      scrollbarColor: "#2d2d3e transparent",
    },
    loadMoreBtn: {
      display: "block",
      margin: "8px auto",
      padding: "6px 20px",
      background: "#1e1e2e",
      border: "1px solid #2d2d3e",
      borderRadius: 16,
      color: "#94a3b8",
      cursor: "pointer",
      fontSize: 13,
    },
    messageBubble: (isMine) => ({
      display: "flex",
      flexDirection: "column",
      alignItems: isMine ? "flex-end" : "flex-start",
      marginBottom: 8,
    }),
    bubble: (isMine) => ({
      maxWidth: "65%",
      padding: "10px 14px",
      borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
      background: isMine
        ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
        : "#1e1e2e",
      color: "#e2e8f0",
      fontSize: 15,
      lineHeight: 1.5,
      wordBreak: "break-word",
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      opacity: 1,
      transition: "opacity 0.2s",
    }),
    bubbleMeta: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      marginTop: 4,
      fontSize: 11,
      color: "#64748b",
    },
    typingArea: {
      padding: "4px 20px 8px",
      minHeight: 24,
      fontSize: 13,
      color: "#94a3b8",
      fontStyle: "italic",
    },
    inputArea: {
      padding: "12px 20px 16px",
      borderTop: "1px solid #1e1e2e",
      display: "flex",
      gap: 10,
      alignItems: "flex-end",
      background: "#13131f",
    },
    textInput: {
      flex: 1,
      background: "#1e1e2e",
      border: "1px solid #2d2d3e",
      borderRadius: 12,
      padding: "10px 14px",
      color: "#e2e8f0",
      fontSize: 15,
      resize: "none",
      outline: "none",
      fontFamily: "inherit",
      lineHeight: 1.5,
      maxHeight: 120,
    },
    sendBtn: {
      padding: "10px 20px",
      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      border: "none",
      borderRadius: 12,
      color: "#fff",
      fontWeight: 700,
      fontSize: 15,
      cursor: "pointer",
      transition: "opacity 0.15s, transform 0.1s",
      whiteSpace: "nowrap",
      flexShrink: 0,
    },
    emptyState: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
      gap: 12,
      color: "#64748b",
    },
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Inject keyframe animation for typing bubble */}
      <style>{`
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2d2d3e; border-radius: 3px; }
      `}</style>

      <div style={styles.page}>
        {/* ── Left Panel: Conversation List ─────────────────────────────────── */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h2 style={styles.sidebarTitle}>Messages</h2>
            <input
              style={styles.searchInput}
              type="text"
              placeholder="Search conversations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={styles.convList}>
            {loading.conversations && (
              <p style={{ textAlign: "center", color: "#64748b", padding: 20 }}>
                Loading…
              </p>
            )}

            {!loading.conversations && filteredConversations.length === 0 && (
              <p
                style={{ textAlign: "center", color: "#64748b", padding: 20, fontSize: 14 }}
              >
                No conversations yet.
              </p>
            )}

            {filteredConversations.map((conv) => {
              const other = getOtherParticipant(conv);
              const unread = getUnread(conv);
              const online = other ? !!onlineUsers[String(other._id)] : false;

              return (
                <div
                  key={conv._id}
                  style={styles.convItem(conv._id === activeConvId)}
                  onClick={() => openConversation(conv._id)}
                  role="button"
                  aria-selected={conv._id === activeConvId}
                >
                  <Avatar
                    src={other?.avatar}
                    name={other?.name}
                    size={44}
                    online={online}
                  />
                  <div style={styles.convBody}>
                    <div style={styles.convName}>{other?.name || "Unknown"}</div>
                    <div style={styles.convPreview}>
                      {conv.lastMessageText || "Start a conversation"}
                    </div>
                  </div>
                  <div style={styles.convMeta}>
                    <span style={styles.convTime}>
                      {formatTime(conv.lastMessageAt)}
                    </span>
                    {unread > 0 && (
                      <span style={styles.unreadBadge}>{unread}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Right Panel: Message Thread ───────────────────────────────────── */}
        <main style={styles.chatArea}>
          {!activeConvId ? (
            <div style={styles.emptyState}>
              <span style={{ fontSize: 48 }}>💬</span>
              <p style={{ fontSize: 16 }}>Select a conversation to start chatting</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div style={styles.chatHeader}>
                <Avatar
                  src={otherUser?.avatar}
                  name={otherUser?.name}
                  size={42}
                  online={isOtherOnline}
                />
                <div style={styles.userInfo}>
                  <div style={styles.userName}>{otherUser?.name || "…"}</div>
                  <div style={styles.userStatus}>
                    {isOtherOnline ? "● Online" : "○ Offline"}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div ref={messagesContainerRef} style={styles.messagesContainer}>
                {/* Top sentinel for infinite scroll */}
                <div ref={topSentinelRef} style={{ height: 1 }} />

                {loading.moreMessages && (
                  <p style={{ textAlign: "center", color: "#64748b", fontSize: 13, padding: 8 }}>
                    Loading older messages…
                  </p>
                )}

                {loading.messages && messages.length === 0 && (
                  <p style={{ textAlign: "center", color: "#64748b", padding: 40 }}>
                    Loading messages…
                  </p>
                )}

                {!loading.messages && messages.length === 0 && (
                  <p
                    style={{ textAlign: "center", color: "#64748b", fontSize: 14, padding: 40 }}
                  >
                    No messages yet. Say hello! 👋
                  </p>
                )}

                {messages.map((msg) => {
                  const isMine =
                    String(msg.sender?._id || msg.sender) ===
                    String(currentUser?._id);

                  return (
                    <div key={msg._id} style={styles.messageBubble(isMine)}>
                      {/* Avatar for the other user */}
                      {!isMine && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-end",
                            gap: 8,
                          }}
                        >
                          <Avatar
                            src={msg.sender?.avatar}
                            name={msg.sender?.name}
                            size={28}
                          />
                          <div style={styles.bubble(false)}>
                            {msg.text}
                            {msg.attachments?.length > 0 && (
                              <div style={{ marginTop: 6 }}>
                                {msg.attachments.map((att, i) => (
                                  <a
                                    key={i}
                                    href={att.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: "#818cf8", display: "block", fontSize: 13 }}
                                  >
                                    📎 {att.name || "Attachment"}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* My message */}
                      {isMine && (
                        <div
                          style={{
                            ...styles.bubble(true),
                            opacity: msg.isOptimistic ? 0.7 : 1,
                          }}
                        >
                          {msg.text}
                          {msg.attachments?.length > 0 && (
                            <div style={{ marginTop: 6 }}>
                              {msg.attachments.map((att, i) => (
                                <a
                                  key={i}
                                  href={att.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: "#c4b5fd", display: "block", fontSize: 13 }}
                                >
                                  📎 {att.name || "Attachment"}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Message metadata */}
                      <div style={styles.bubbleMeta}>
                        <span>{formatTime(msg.createdAt)}</span>
                        {isMine && <StatusIcon status={msg.status} />}
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Avatar src={otherUser?.avatar} name={otherUser?.name} size={28} />
                    <div
                      style={{
                        ...styles.bubble(false),
                        padding: "8px 14px",
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      <TypingBubble />
                    </div>
                  </div>
                )}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div style={styles.inputArea}>
                <textarea
                  ref={inputRef}
                  id="chat-message-input"
                  style={styles.textInput}
                  rows={1}
                  placeholder="Type a message…"
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    startTyping();
                  }}
                  onKeyDown={handleKeyDown}
                  onBlur={stopTyping}
                />
                <button
                  id="chat-send-button"
                  style={styles.sendBtn}
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  aria-label="Send message"
                >
                  Send ↗
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default ChatPage;
