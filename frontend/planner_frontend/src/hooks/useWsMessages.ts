import { useEffect } from "react";
import { wsService, type WsMessageHandler } from "../services/WebsocketService";

/**
 * Subscribes to incoming board events from the Ws WebSocket.
 *
 * The hook registers `handler` with the WsService singleton and
 * unregisters it on cleanup. No socket is owned by this hook — connection
 * lifecycle is managed by <WsProvider>.
 *
 * Usage:
 * ```tsx
 * const handleEvent = useCallback((data: unknown) => {
 *   const event = data as BoardEvent;
 *   switch (event.type) { ... }
 * }, [dispatch]);
 *
 * useWsMessages(handleEvent);
 * ```
 *
 * @param handler - A **stable** reference (wrap in useCallback). A new
 *   reference causes a re-subscribe on every render.
 */
export function useWsMessages(handler: WsMessageHandler): void {
  useEffect(() => {
    const unsubscribe = wsService.subscribe(handler);
    return unsubscribe;
  }, [handler]);
}
