import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";

export const socket = io(socketUrl, {
  autoConnect: false,
  transports: ["websocket", "polling"],
});

export const connectToAlerts = () => {
  const token = localStorage.getItem("token");

  if (!token) return;

  socket.auth = { token };

  if (!socket.connected) socket.connect();
  socket.emit("alerts:join");
};

export const disconnectFromAlerts = () => {
  if (socket.connected) {
    socket.emit("alerts:leave");
    socket.disconnect();
  }
};
