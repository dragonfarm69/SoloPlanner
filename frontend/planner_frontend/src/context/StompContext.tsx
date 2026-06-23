import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { stompService, type IStompService } from "../services/StompService";

// ─── Context ──────────────────────────────────────────────────────────────────

interface StompContextValue {
  /**
   * Exposes the service for advanced consumers (e.g. a future component that
   * needs to send STOMP frames). Typical consumers should use useStompMessages()
   * instead of accessing the service directly.
   */
  service: IStompService;
}

const StompContext = createContext<StompContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface StompProviderProps {
  projectId: string | undefined;
  children: ReactNode;
}

/**
 * Manages the board WebSocket connection lifecycle.
 *
 * Mount this once around the board page. It calls stompService.connect() when
 * projectId is available and stompService.disconnect() on cleanup (unmount or
 * projectId change). Components subscribe to messages via useStompMessages().
 */
export function StompProvider({ projectId, children }: StompProviderProps) {
  useEffect(() => {
    if (!projectId) return;

    stompService.connect(projectId);

    return () => {
      stompService.disconnect();
    };
  }, [projectId]);

  return (
    <StompContext.Provider value={{ service: stompService }}>
      {children}
    </StompContext.Provider>
  );
}

// ─── Context accessor ─────────────────────────────────────────────────────────

/**
 * Returns the StompContext value. Throws if called outside <StompProvider>.
 * Prefer useStompMessages() for the common subscription use-case.
 */
export function useStompContext(): StompContextValue {
  const ctx = useContext(StompContext);
  if (!ctx) {
    throw new Error("useStompContext must be used inside <StompProvider>");
  }
  return ctx;
}
