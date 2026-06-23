import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  aiChatService,
  type IAiChatService,
  type ConnectionStatus,
} from "../services/AiChatService";

// ─── Context ──────────────────────────────────────────────────────────────────

interface AiChatContextValue {
  service: IAiChatService;
  /** Live connection status — updates trigger a React re-render in consumers. */
  status: ConnectionStatus;
}

const AiChatContext = createContext<AiChatContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface AiChatProviderProps {
  isOpen: boolean;
  children: ReactNode;
}

/**
 * Manages the AI assistant WebSocket connection lifecycle and surfaces the
 * connection status as React state.
 *
 * Wrap this around <AiChatPanelContent> (or any subtree that calls useAiChat).
 * The socket opens when isOpen becomes true and closes when it becomes false
 * or the provider unmounts.
 */
export function AiChatProvider({ isOpen, children }: AiChatProviderProps) {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  // Wire the service's status callback to our React state once on mount.
  useEffect(() => {
    aiChatService.onStatusChange = setStatus;
    return () => {
      aiChatService.onStatusChange = undefined;
    };
  }, []);

  // Drive connect/disconnect based on whether the chat panel is visible.
  useEffect(() => {
    if (!isOpen) return;

    aiChatService.connect();

    return () => {
      aiChatService.disconnect();
    };
  }, [isOpen]);

  return (
    <AiChatContext.Provider value={{ service: aiChatService, status }}>
      {children}
    </AiChatContext.Provider>
  );
}

// ─── Context accessor ─────────────────────────────────────────────────────────

/**
 * Returns the AiChatContext value. Throws if called outside <AiChatProvider>.
 * Prefer useAiChat() for the common consumer use-case.
 */
export function useAiChatContext(): AiChatContextValue {
  const ctx = useContext(AiChatContext);
  if (!ctx) {
    throw new Error("useAiChatContext must be used inside <AiChatProvider>");
  }
  return ctx;
}
