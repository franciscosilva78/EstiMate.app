import express from "express";
import { createServer as createViteServer } from "vite";
import { Server as SocketIOServer } from "socket.io";
import http from "http";
import { v4 as uuidv4 } from "uuid";
import path from "path";

interface User {
  id: string;
  name: string;
  role: "QA" | "Dev" | "ScrumMaster";
  vote: number | null;
}

interface Room {
  id: string;
  name: string;
  status: "voting" | "revealed";
  users: Record<string, User>;
}

const rooms: Record<string, Room> = {};

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
    },
  });

  app.use(express.json({ limit: '50mb' }));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_room", ({ roomId, roomName, name, role }) => {
      if (!rooms[roomId]) {
        rooms[roomId] = { id: roomId, name: roomName || "Planning Room", status: "voting", users: {} };
      }
      
      const user: User = { id: socket.id, name, role, vote: null };
      rooms[roomId].users[socket.id] = user;
      
      socket.join(roomId);
      io.to(roomId).emit("room_update", rooms[roomId]);
    });

    socket.on("vote", ({ roomId, vote }) => {
      if (rooms[roomId] && rooms[roomId].users[socket.id]) {
        rooms[roomId].users[socket.id].vote = vote;
        io.to(roomId).emit("room_update", rooms[roomId]);
      }
    });

    socket.on("reveal", ({ roomId }) => {
      if (rooms[roomId]) {
        rooms[roomId].status = "revealed";
        io.to(roomId).emit("room_update", rooms[roomId]);
      }
    });

    socket.on("reset", ({ roomId }) => {
      if (rooms[roomId]) {
        rooms[roomId].status = "voting";
        for (const userId in rooms[roomId].users) {
          rooms[roomId].users[userId].vote = null;
        }
        io.to(roomId).emit("room_update", rooms[roomId]);
      }
    });

    socket.on("delete_room", ({ roomId }) => {
      if (rooms[roomId]) {
        io.to(roomId).emit("room_deleted");
        delete rooms[roomId];
      }
    });

    socket.on("disconnect", () => {
      for (const roomId in rooms) {
        if (rooms[roomId].users[socket.id]) {
          delete rooms[roomId].users[socket.id];
          if (Object.keys(rooms[roomId].users).length === 0) {
            delete rooms[roomId];
          } else {
            io.to(roomId).emit("room_update", rooms[roomId]);
          }
        }
      }
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
