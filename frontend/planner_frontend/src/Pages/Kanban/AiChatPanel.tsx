import { useState, useRef, useEffect, useCallback } from "react";
import { useWsMessages } from "../../hooks/useWsMessages";
import { wsService } from "../../services/WebsocketService";
import "./AiChatPanel.css";

interface Message {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface AiChatPanelProps {
  projectId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AiChatPanel({
  projectId,
  isOpen,
  onClose,
}: AiChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      content:
        "Hello! I am your AI Assistant. How can I help you manage your project and tasks today?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = localStorage.getItem("user_id") || "";

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Handle incoming AI messages
  const handleIncomingMessage = useCallback(
    (raw: unknown) => {
      const data = raw as {
        type: string;
        projectId?: string;
        userId?: string;
        content?: string;
      };

      if (data && data.type === "AI_CHAT" && data.content) {
        console.log("received chat event: ", data);
        // Ensure this message is for the current user and project
        if (
          (!data.userId || data.userId === userId) &&
          (!data.projectId || data.projectId === projectId)
        ) {
          setMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substring(7),
              sender: "ai",
              content: data.content!,
              timestamp: new Date(),
            },
          ]);

          console.log("MESSAGE: ", messages);
          setIsTyping(false);
        }
      }
    },
    [userId, projectId],
  );

  useWsMessages(handleIncomingMessage);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isTyping) return;

    const newMessage: Message = {
      id: Math.random().toString(36).substring(7),
      sender: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    // Update local messages state
    setMessages((prev) => [...prev, newMessage]);
    setIsTyping(true);
    setInputText("");

    console.log("sending: ", userId);

    // Send payload over WebSocket
    wsService.sendMessage({
      type: "AI_CHAT",
      projectId,
      userId,
      content: trimmed,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="ai-chat-panel" id="ai-chat-panel">
      {/* Panel Header */}
      <div className="ai-chat-header">
        <div className="ai-chat-title-group">
          <div className="ai-chat-avatar">
            <span className="ai-chat-avatar-sparkle">✦</span>
          </div>
          <div>
            <div className="ai-chat-title">AI Assistant</div>
            <div className="ai-chat-status">
              <span className="status-dot online"></span>
              Connected
            </div>
          </div>
        </div>
        <button
          className="ai-chat-close-btn"
          onClick={onClose}
          aria-label="Close Chat Panel"
        >
          &times;
        </button>
      </div>

      {/* Messages List */}
      <div className="ai-chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`ai-chat-bubble-wrapper ${
              msg.sender === "user" ? "user-wrapper" : "ai-wrapper"
            }`}
          >
            <div
              className={`ai-chat-bubble ${
                msg.sender === "user" ? "user-bubble" : "ai-bubble"
              }`}
            >
              <div className="ai-chat-bubble-content">{msg.content}</div>
              <div className="ai-chat-bubble-time">
                {msg.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="ai-chat-bubble-wrapper ai-wrapper">
            <div className="ai-chat-bubble ai-bubble typing-bubble">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="ai-chat-input-area">
        <div className="ai-chat-input-container">
          <textarea
            className="ai-chat-textarea"
            placeholder="Ask AI something..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            aria-label="AI message input"
            rows={1}
          />
          <button
            className={`ai-chat-send-btn ${
              !inputText.trim() || isTyping ? "disabled" : ""
            }`}
            onClick={handleSend}
            disabled={!inputText.trim() || isTyping}
            aria-label="Send message"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
