import { createContext, useContext, useEffect, type ReactNode } from "react";
import { wsService, type IWsService } from "../services/WebsocketService";

// ─── Context ──────────────────────────────────────────────────────────────────

interface WsContextValue {
  /**
   * Exposes the service for advanced consumers (e.g. a future component that
   * needs to send Ws frames). Typical consumers should use useWsMessages()
   * instead of accessing the service directly.
   */
  service: IWsService;
}

const WsContext = createContext<WsContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface WsProviderProps {
  projectId: string | undefined;
  children: ReactNode;
}

/**
 * Manages the board WebSocket connection lifecycle.
 *
 * Mount this once around the board page. It calls WsService.connect() when
 * projectId is available and WsService.disconnect() on cleanup (unmount or
 * projectId change). Components subscribe to messages via useWsMessages().
 */
export function WsProvider({ projectId, children }: WsProviderProps) {
  useEffect(() => {
    if (!projectId) return;

    wsService.connect(projectId);

    return () => {
      wsService.disconnect();
    };
  }, [projectId]);

  return (
    <WsContext.Provider value={{ service: wsService }}>
      {children}
    </WsContext.Provider>
  );
}

// ─── Context accessor ─────────────────────────────────────────────────────────

/**
 * Returns the WsContext value. Throws if called outside <StompProvider>.
 * Prefer useStompMessages() for the common subscription use-case.
 */
export function useWsContext(): WsContextValue {
  const ctx = useContext(WsContext);
  if (!ctx) {
    throw new Error("useWsContext must be used inside <StompProvider>");
  }
  return ctx;
}
