import { useCallback } from "react";
import { aiChatService, type AiMessageHandler, type ConnectionStatus } from "../services/AiChatService";
import { useAiChatContext } from "../context/AiChatContext";

interface UseAiChatReturn {
  /** Live connection status from AiChatContext. */
  status: ConnectionStatus;
  /**
   * Sends a JSON payload through the AI WebSocket. A no-op (with a warning)
   * if the socket is not currently open.
   */
  send: (payload: object) => void;
  /**
   * Registers a listener for incoming AI messages (token / done / error).
   * Returns an unsubscribe function — pass it as the return value of a
   * useEffect so cleanup is handled automatically.
   */
  subscribe: (handler: AiMessageHandler) => () => void;
}

/**
 * Consumes the AiChatContext to provide the connection status and wraps the
 * aiChatService singleton's send/subscribe methods with stable callbacks.
 *
 * Must be called inside a component that is a descendant of <AiChatProvider>.
 *
 * Usage:
 * ```tsx
 * const { send, status, subscribe } = useAiChat();
 *
 * useEffect(() => {
 *   return subscribe((msg) => {
 *     if (msg.type === "token") { ... }
 *   });
 * }, [subscribe]);
 * ```
 */
export function useAiChat(): UseAiChatReturn {
  const { status } = useAiChatContext();

  const send = useCallback((payload: object) => {
    aiChatService.send(payload);
  }, []);

  const subscribe = useCallback((handler: AiMessageHandler) => {
    return aiChatService.subscribe(handler);
  }, []);

  return { status, send, subscribe };
}
