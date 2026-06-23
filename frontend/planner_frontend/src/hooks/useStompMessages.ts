import { useEffect } from "react";
import { stompService, type StompMessageHandler } from "../services/StompService";

/**
 * Subscribes to incoming board events from the STOMP WebSocket.
 *
 * The hook registers `handler` with the stompService singleton and
 * unregisters it on cleanup. No socket is owned by this hook — connection
 * lifecycle is managed by <StompProvider>.
 *
 * Usage:
 * ```tsx
 * const handleEvent = useCallback((data: unknown) => {
 *   const event = data as BoardEvent;
 *   switch (event.type) { ... }
 * }, [dispatch]);
 *
 * useStompMessages(handleEvent);
 * ```
 *
 * @param handler - A **stable** reference (wrap in useCallback). A new
 *   reference causes a re-subscribe on every render.
 */
export function useStompMessages(handler: StompMessageHandler): void {
  useEffect(() => {
    const unsubscribe = stompService.subscribe(handler);
    return unsubscribe;
  }, [handler]);
}
