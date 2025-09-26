// hooks/useSocket.ts
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [socketReady, setSocketReady] = useState(false);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io("http://192.168.18.8:3000", { path: "/api/socket" });

      socketRef.current.on("connect", () => {
        console.log("Socket conectado:", socketRef.current?.id);
        setSocketReady(true);
      });
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return socketReady ? socketRef.current : null;
}
