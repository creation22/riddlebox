// src/utils/socket.js

let socket = null;
let listeners = [];

export function initSocket() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    console.log("✅ WebSocket already connected");
    return socket;
  }

  // socket = new WebSocket("ws://localhost:8000");
  socket = new WebSocket("wss://riddlebox.onrender.com");


  socket.onopen = () => {
    console.log("✅ Connected to WebSocket server");
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    listeners.forEach((cb) => cb(data));
  };

  socket.onclose = (e) => {
    console.log("❌ WebSocket closed:", e.code, e.reason);
    // Optionally auto-reconnect:
    // setTimeout(initSocket, 2000);
  };

  socket.onerror = (err) => {
    console.error("⚠️ WebSocket error:", err);
  };

  return socket;
}

// Send helper
export function sendMessage(type, payload = {}) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn("⚠️ Tried to send message before socket was ready:", type);
    return;
  }
  socket.send(JSON.stringify({ type, payload }));
}

// Add listener
export function addSocketListener(callback) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((cb) => cb !== callback);
  };
}

// Export for direct access
export function getSocket() {
  return socket;
}
