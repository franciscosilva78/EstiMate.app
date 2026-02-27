import express from "express";
import { createServer as createViteServer } from "vite";
import { Server as SocketIOServer } from "socket.io";
import http from "http";
import { v4 as uuidv4 } from "uuid";

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

  app.post("/api/edit-image", async (req, res) => {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const { image, prompt } = req.body;

      if (!image || !prompt) {
        return res.status(400).json({ error: "Missing image or prompt" });
      }

      const mimeType = image.match(/data:(.*?);base64,/)?.[1] || "image/png";
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      let imageUrl = null;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          imageUrl = `data:image/png;base64,${base64EncodeString}`;
          break;
        }
      }

      if (imageUrl) {
        res.json({ imageUrl });
      } else {
        res.status(500).json({ error: "Failed to generate image" });
      }
    } catch (error: any) {
      console.error("Error editing image:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
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
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
