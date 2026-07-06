// ─── Types ────────────────────────────────────────────────────────────────────

export type WsMessageHandler = (data: unknown) => void;

/**
 * Public surface of the WebSocket service that consumers depend on.
 */
export interface IWsService {
  subscribe(handler: WsMessageHandler): () => void;
  sendMessage(payload: any): void;
  subscribeTopic(topic: string): void;
  unsubscribeTopic(topic: string): void;
}

// ─── Service ──────────────────────────────────────────────────────────────────

class ProjectWebSocketService implements IWsService {
  private ws: WebSocket | null = null;

  sendMessage(payload: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      console.warn(
        "[ProjectWebSocketService] Cannot send message: WebSocket is not open.",
      );
    }
  }
  private currentProjectId: string | null = null;
  private listeners: Set<WsMessageHandler> = new Set();
  private activeSubscribedTopics: Set<string> = new Set(["project"]);

  // ─── Lifecycle ──────────────────────────────

  /**
   * Opens a raw WebSocket connection for the given project.
   * Switching to a different project first disconnects the existing socket.
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

    // Connect to the raw project websocket endpoint
    const ws = new WebSocket(
      `ws://localhost:8081/ws-connect/projects/${projectId}`,
    );
    this.ws = ws;

    ws.onopen = () => {
      console.log(
        `[ProjectWebSocketService] Connected to project ${projectId}`,
      );
      // Re-subscribe to all active topics on connection (excluding implicitly backend pre-subscribed "project")
      this.activeSubscribedTopics.forEach((topic) => {
        if (topic !== "project") {
          this.sendMessage({ type: "SUBSCRIBE", topic });
        }
      });
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(event.data);
        this.listeners.forEach((handler) => handler(parsed));
      } catch (e) {
        console.error("[ProjectWebSocketService] Failed to parse message:", e);
      }
    };

    ws.onerror = (error) => {
      console.error("[ProjectWebSocketService] WebSocket error:", error);
    };

    ws.onclose = (event) => {
      console.log("[ProjectWebSocketService] WebSocket closed:", event);
    };
  }

  /**
   * Closes the raw WebSocket connection.
   */
  disconnect(): void {
    this.closeSocket();
    this.currentProjectId = null;
    this.activeSubscribedTopics = new Set(["project"]);
  }

  subscribeTopic(topic: string): void {
    this.activeSubscribedTopics.add(topic);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendMessage({ type: "SUBSCRIBE", topic });
    }
  }

  unsubscribeTopic(topic: string): void {
    this.activeSubscribedTopics.delete(topic);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendMessage({ type: "UNSUBSCRIBE", topic });
    }
  }

  // ─── Pub/Sub ────────────────────────────────

  /**
   * Registers a listener for incoming raw WebSocket messages.
   *
   * @returns An unsubscribe function — call it in a useEffect cleanup.
   */
  subscribe(handler: WsMessageHandler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  // ─── Private helpers ────────────────────────

  private closeSocket(): void {
    if (!this.ws) return;

    if (
      this.ws.readyState === WebSocket.OPEN ||
      this.ws.readyState === WebSocket.CONNECTING
    ) {
      this.ws.close();
    }
    this.ws = null;
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

// Export using the same name to avoid breaking existing imports across the frontend codebase
export const wsService = new ProjectWebSocketService();
