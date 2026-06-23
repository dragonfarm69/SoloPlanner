// ─── Types ────────────────────────────────────────────────────────────────────

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export interface AiSocketMessage {
  type: "token" | "done" | "error";
  /** Incremental text chunk (present on "token" events). */
  chunk?: string;
  /** Complete reply text (present on "done" events). */
  fullText?: string;
  /** Error description (present on "error" events). */
  message?: string;
}

export type AiMessageHandler = (data: AiSocketMessage) => void;

/**
 * Public surface of the AiChatService that consumers can depend on.
 * The connect/disconnect lifecycle is managed exclusively by AiChatProvider.
 */
export interface IAiChatService {
  send(payload: object): void;
  subscribe(handler: AiMessageHandler): () => void;
}

// ─── Service ──────────────────────────────────────────────────────────────────

class AiChatService implements IAiChatService {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  /**
   * Prevents reconnection attempts after an intentional disconnect()
   * (e.g. the chat panel closed).
   */
  private shouldReconnect = false;
  private listeners: Set<AiMessageHandler> = new Set();

  /**
   * Optional callback invoked whenever the connection status changes.
   * AiChatProvider sets this to update its React state.
   */
  onStatusChange?: (status: ConnectionStatus) => void;

  // ─── Lifecycle ──────────────────────────────

  /**
   * Opens the connection to the AI microservice WebSocket and enables
   * automatic reconnection on unexpected close.
   */
  connect(): void {
    const alreadyActive =
      this.ws !== null &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING);
    if (alreadyActive) return;
    this.shouldReconnect = true;
    this.openSocket();
  }

  /**
   * Closes the connection and disables auto-reconnect.
   * Safe to call when already disconnected.
   */
  disconnect(): void {
    this.shouldReconnect = false;
    this.clearReconnectTimer();

    if (this.ws) {
      // Nullify onclose before closing so the auto-reconnect branch never runs.
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }

    this.onStatusChange?.("disconnected");
  }

  // ─── Pub/Sub + Send ─────────────────────────

  /**
   * Sends a JSON-serialised payload through the open WebSocket.
   * If the socket is not ready, logs a warning instead of throwing.
   */
  send(payload: object): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      console.warn("[AiChatService] Cannot send — socket is not open.");
    }
  }

  /**
   * Registers a listener for incoming AI messages (token / done / error).
   *
   * @returns An unsubscribe function — call it in a useEffect cleanup.
   */
  subscribe(handler: AiMessageHandler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  // ─── Private helpers ────────────────────────

  private openSocket(): void {
    this.onStatusChange?.("connecting");

    const ws = new WebSocket("ws://localhost:8090/ws");
    this.ws = ws;

    ws.onopen = () => {
      console.log("[AiChatService] Connection established");
      this.onStatusChange?.("connected");
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const data = JSON.parse(event.data) as AiSocketMessage;
        this.listeners.forEach((handler) => handler(data));
      } catch (err) {
        console.error("[AiChatService] Failed to parse message:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("[AiChatService] WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("[AiChatService] Connection closed");
      this.onStatusChange?.("disconnected");

      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => this.openSocket(), 3000);
      }
    };
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

/**
 * Module-level singleton for the AI assistant WebSocket.
 * Never instantiate this class directly.
 *
 * Lifecycle (connect / disconnect) is managed by AiChatProvider.
 * Messages are consumed via useAiChat().
 */
export const aiChatService = new AiChatService();
