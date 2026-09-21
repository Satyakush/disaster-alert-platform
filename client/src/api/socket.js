import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";

export const socket = io(socketUrl, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

let connectionUsers = 0;

const joinAlertsRoom = () => {
  if (socket.connected) socket.emit("alerts:join");
};

export const connectToAlerts = () => {
  const token = localStorage.getItem("token");

  if (!token) return;

  socket.auth = { token };
  connectionUsers += 1;

  if (!socket.connected) {
    socket.connect();
  } else {
    joinAlertsRoom();
  }
};

export const disconnectFromAlerts = () => {
  connectionUsers = Math.max(0, connectionUsers - 1);

  if (connectionUsers === 0 && socket.connected) {
    socket.emit("alerts:leave");
    socket.disconnect();
  }
};

socket.on("connect", joinAlertsRoom);
socket.on("connect_error", (error) => {
  console.error("Socket connection failed:", error.message);
});
