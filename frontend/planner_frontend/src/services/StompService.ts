// ─── Types ────────────────────────────────────────────────────────────────────

export type StompMessageHandler = (data: unknown) => void;

/**
 * Public surface of the StompService that consumers can depend on.
 * Only exposes what downstream code needs — the singleton's connect/disconnect
 * lifecycle is managed exclusively by StompProvider.
 */
export interface IStompService {
  subscribe(handler: StompMessageHandler): () => void;
}

// ─── Service ──────────────────────────────────────────────────────────────────

class StompService implements IStompService {
  private ws: WebSocket | null = null;
  private currentProjectId: string | null = null;
  private listeners: Set<StompMessageHandler> = new Set();

  // ─── Lifecycle ──────────────────────────────

  /**
   * Opens a WebSocket connection and performs the STOMP handshake for the
   * given project topic. Calling connect() while already connected to the
   * *same* project is a no-op. Switching to a different project first
   * disconnects the existing socket.
   */
  connect(projectId: string): void {
    const alreadyConnected =
      this.currentProjectId === projectId &&
      this.ws !== null &&
      this.ws.readyState === WebSocket.OPEN;

    if (alreadyConnected) return;

    // Clean up any previous connection before opening a new one.
    this.closeSocket();
    this.currentProjectId = projectId;

    const ws = new WebSocket("ws://localhost:8081/ws-connect/websocket");
    this.ws = ws;

    ws.onopen = () => {
      console.log("[StompService] WebSocket open — sending CONNECT frame");
      const connectFrame =
        "CONNECT\naccept-version:1.2,1.1,1.0\nheart-beat:10000,10000\n\n\u0000";
      ws.send(connectFrame);
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      this.handleRawFrame(event.data, projectId);
    };

    ws.onerror = (error) => {
      console.error("[StompService] WebSocket error:", error);
    };

    ws.onclose = (event) => {
      console.log("[StompService] WebSocket closed:", event);
    };
  }

  /**
   * Sends a STOMP DISCONNECT frame and closes the socket. Safe to call even
   * when the socket is not open.
   */
  disconnect(): void {
    this.closeSocket();
    this.currentProjectId = null;
  }

  // ─── Pub/Sub ────────────────────────────────

  /**
   * Registers a listener for incoming STOMP MESSAGE frames. The handler
   * receives the already-parsed JSON body.
   *
   * @returns An unsubscribe function — call it in a useEffect cleanup.
   */
  subscribe(handler: StompMessageHandler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  // ─── Private helpers ────────────────────────

  private handleRawFrame(frame: string, projectId: string): void {
    if (frame.startsWith("CONNECTED")) {
      console.log("[StompService] STOMP session active — subscribing to topic");
      const subscribeFrame = `SUBSCRIBE\nid:sub-0\ndestination:/topic/projects/${projectId}\n\n\u0000`;
      this.ws?.send(subscribeFrame);
      return;
    }

    if (frame.startsWith("MESSAGE")) {
      const parsed = this.parseMessageBody(frame);
      if (parsed !== null) {
        this.notifyListeners(parsed);
      }
    }
  }

  private parseMessageBody(frame: string): unknown | null {
    // STOMP body follows the first blank line (\n\n) and ends with the null byte.
    const parts = frame.split("\n\n");
    if (parts.length < 2) return null;

    const body = parts[1].replace(/\u0000/g, "").trim();
    try {
      return JSON.parse(body);
    } catch (e) {
      console.error("[StompService] Failed to parse MESSAGE body:", e);
      return null;
    }
  }

  private notifyListeners(data: unknown): void {
    this.listeners.forEach((handler) => handler(data));
  }

  private closeSocket(): void {
    if (!this.ws) return;

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send("DISCONNECT\n\n\u0000");
      this.ws.close();
    }
    this.ws = null;
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

/**
 * Module-level singleton. Import this directly anywhere you need to interact
 * with the board WebSocket; never call `new StompService()` yourself.
 *
 * Lifecycle (connect / disconnect) is managed by StompProvider.
 * Subscriptions are registered via useStompMessages().
 */
export const stompService = new StompService();
