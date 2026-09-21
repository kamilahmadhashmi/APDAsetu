/* ==========================================================================
   AEGIS-MESH / AAPDASETU - WEBSOCKET REAL-TIME DISPATCH CLIENT
   Maintains resilient WebSocket connection to backend gateway, handles
   heartbeats, automatic reconnect with exponential backoff, and event distribution.
   ========================================================================== */

class WebSocketDispatchClient {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 15;
    this.subscribers = new Set();
    this.isConnected = false;
    this.heartbeatTimer = null;
  }

  connect() {
    if (typeof window === 'undefined') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use current host or fallback to standard API gateway port
    const host = window.location.port === '8080' ? `${window.location.hostname}:8000` : window.location.host;
    const wsUrl = `${protocol}//${host}/ws/dispatch`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected to Real-Time Dispatch Hub:', wsUrl);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.notifySubscribers({ type: 'STATUS_CHANGE', status: 'CONNECTED' });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.notifySubscribers(msg);
          
          // Broadcast DOM custom event for global components
          window.dispatchEvent(new CustomEvent('aegis-dispatch-event', { detail: msg }));
        } catch (e) {
          // Plaintext ping/pong
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.stopHeartbeat();
        this.notifySubscribers({ type: 'STATUS_CHANGE', status: 'DISCONNECTED' });
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        this.ws?.close();
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(10000, 1000 * Math.pow(1.5, this.reconnectAttempts));
      setTimeout(() => this.connect(), delay);
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 25000);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(data) {
    this.subscribers.forEach(cb => {
      try {
        cb(data);
      } catch (err) {
        console.error('[WebSocket] Subscriber callback error:', err);
      }
    });
  }
}

export const websocketClient = new WebSocketDispatchClient();
