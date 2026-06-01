import { useState, useRef, useEffect, useCallback } from "react";
import "./AiChatPanel.css";

// ─── Types ───────────────────────────────
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AiChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Constants ───────────────────────────
const SUGGESTIONS = [
  "Summarize my tasks",
  "What should I prioritize?",
  "Help me plan my day",
];

const MOCK_AI_REPLY = "I'm not connected yet — API integration coming soon!";

// ─── Helpers ─────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Component ───────────────────────────

export default function AiChatPanel({ isOpen, onClose }: AiChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to let the animation finish
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // ─── Send Message ────────────────────
  const sendMessage = useCallback((content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI reply after a short delay
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: MOCK_AI_REPLY,
        timestamp: new Date(),
      };
      setIsTyping(false);
      setMessages((prev) => [...prev, aiMessage]);
    }, 1200);
  }, []);

  // ─── Input Handlers ──────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(inputValue);
      }
    },
    [inputValue, sendMessage],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      sendMessage(suggestion);
    },
    [sendMessage],
  );

  // ─── Sub-components ──────────────────

  const hasMessages = messages.length > 0;

  return (
    <>
      {/* Backdrop overlay */}
      <div className="chat-overlay" onClick={onClose} />

      {/* Panel */}
      <div
        className="chat-panel"
        id="ai-chat-panel"
        role="dialog"
        aria-label="AI Assistant"
      >
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <div className="chat-header-icon" aria-hidden="true">
              ✦
            </div>
            <div className="chat-header-info">
              <span className="chat-header-title">AI Assistant</span>
              <span className="chat-header-status">
                <span className="chat-status-dot" aria-hidden="true" />
                Online
              </span>
            </div>
          </div>
          <button
            className="chat-close"
            onClick={onClose}
            aria-label="Close chat"
            id="chat-close-btn"
          >
            ✕
          </button>
        </div>

        {/* Messages / Empty State */}
        {hasMessages ? (
          <div className="chat-messages" id="chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message chat-message--${msg.role}`}
              >
                <div className="chat-message-avatar" aria-hidden="true">
                  {msg.role === "assistant" ? "✦" : "●"}
                </div>
                <div className="chat-message-content">
                  <div className="chat-message-bubble">{msg.content}</div>
                  <span className="chat-message-time">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="chat-message chat-message--assistant">
                <div className="chat-message-avatar" aria-hidden="true">
                  ✦
                </div>
                <div className="chat-message-content">
                  <div className="chat-typing">
                    <span className="chat-typing-dot" />
                    <span className="chat-typing-dot" />
                    <span className="chat-typing-dot" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="chat-empty">
            <span className="chat-empty-icon" aria-hidden="true">
              ✦
            </span>
            <span className="chat-empty-title">How can I help?</span>
            <span className="chat-empty-subtitle">
              Ask me anything about your tasks, priorities, or planning.
            </span>
            <div className="chat-suggestions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="chat-suggestion-chip"
                  onClick={() => handleSuggestionClick(s)}
                  id={`suggestion-${s.toLowerCase().replace(/\s+/g, "-").replace(/\?/g, "")}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Ask the AI assistant..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              id="chat-input"
              aria-label="Chat message input"
            />
            <button
              className="chat-send-btn"
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isTyping}
              aria-label="Send message"
              id="chat-send-btn"
            >
              ↑
            </button>
          </div>
          <div className="chat-input-hint">Press Enter to send</div>
        </div>
      </div>
    </>
  );
}
