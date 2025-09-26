// pages/api/socket.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import type { Socket } from "net";

// Extendendo NextApiResponse para incluir `io`
export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: HTTPServer & {
      io?: SocketIOServer;
    };
  };
};

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  // Se o Socket.IO ainda não foi iniciado
  if (!res.socket.server.io) {
    console.log("🔌 Iniciando Socket.IO...");

    const io = new SocketIOServer(res.socket.server, {
      path: "/api/socket",
      cors: {
        origin: "*", // ajuste para sua rede se necessário
      },
    });

    io.on("connection", (socket) => {
      console.log("Cliente conectado:", socket.id);

      socket.on("update-state", (state) => {
        io.emit("state-updated", state); // envia para todos os clientes
      });

      socket.on("disconnect", () => {
        console.log("Cliente desconectado:", socket.id);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log("⚡ Socket.IO já iniciado");
  }

  res.end();
}
