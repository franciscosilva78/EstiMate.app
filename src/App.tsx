/// <reference types="vite/client" />
import { useEffect, useState, FormEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import { io, Socket } from "socket.io-client";
import { RoomState, User } from "./types";
import { JoinRoom } from "./components/JoinRoom";
import { Room } from "./components/Room";
import { Layout } from "./components/Layout";

let socket: Socket | null = null;

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [roomNameInput, setRoomNameInput] = useState("");

  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/room\/([a-zA-Z0-9-]+)$/);
    if (match) {
      setRoomId(match[1]);
    }
  }, []);

  useEffect(() => {
    if (roomId && user && !socket) {
      // Configuração otimizada para furar firewalls corporativos
      // Usa a variável de ambiente se existir, senão usa a URL fixa do Render
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://estimate-app-jfnc.onrender.com";
      
      socket = io(backendUrl, {
        transports: ["polling", "websocket"], // Força o polling inicial (HTTP normal) que firewalls aceitam
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        timeout: 20000
      });

      socket.on("connect", () => {
        const urlParams = new URLSearchParams(window.location.search);
        const urlRoomName = urlParams.get("name") || "Planning Room";
        socket?.emit("join_room", { roomId, roomName: urlRoomName, name: user.name, role: user.role });
      });

      socket.on("room_update", (state: RoomState) => {
        setRoomState(state);
      });

      socket.on("room_deleted", () => {
        setRoomId(null);
        setUser(null);
        setRoomState(null);
        window.history.pushState({}, "", "/");
      });

      return () => {
        socket?.disconnect();
        socket = null;
      };
    }
  }, [roomId, user]);

  const handleCreateRoom = (e: FormEvent) => {
    e.preventDefault();
    if (!roomNameInput.trim()) return;
    const newRoomId = uuidv4();
    window.history.pushState({}, "", `/room/${newRoomId}?name=${encodeURIComponent(roomNameInput)}`);
    setRoomId(newRoomId);
    setUser({ id: "", name: "Scrum Master", role: "ScrumMaster", vote: null });
  };

  const handleJoin = (name: string, role: "QA" | "Dev" | "ScrumMaster") => {
    setUser({ id: "", name, role, vote: null });
  };

  const handleVote = (vote: number) => {
    if (socket && roomId) {
      socket.emit("vote", { roomId, vote });
    }
  };

  const handleReveal = () => {
    if (socket && roomId) {
      socket.emit("reveal", { roomId });
    }
  };

  const handleReset = () => {
    if (socket && roomId) {
      socket.emit("reset", { roomId });
    }
  };

  const handleDeleteRoom = () => {
    if (socket && roomId) {
      socket.emit("delete_room", { roomId });
    }
  };

  return (
    <Layout>
      {!roomId ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-white/10 shadow-[0_0_40px_-10px_rgba(168,85,247,0.2)] backdrop-blur-sm">
            <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-center bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Criar Sala
            </h1>
            <form onSubmit={handleCreateRoom} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Nome da Sala</label>
                <input
                  type="text"
                  value={roomNameInput}
                  onChange={(e) => setRoomNameInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-white placeholder-slate-600 font-medium text-sm sm:text-base"
                  placeholder="ex: Planejamento Sprint 42"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!roomNameInput.trim()}
                className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-xl font-bold text-base sm:text-lg shadow-[0_0_20px_-5px_rgba(168,85,247,0.5)] hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.6)] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
              >
                Iniciar Sala
              </button>
            </form>
          </div>
        </div>
      ) : !user ? (
        <JoinRoom onJoin={handleJoin} />
      ) : (
        <Room
          roomState={roomState}
          currentUser={(socket?.id && roomState?.users[socket.id]) || user}
          onVote={handleVote}
          onReveal={handleReveal}
          onReset={handleReset}
          onDelete={handleDeleteRoom}
        />
      )}
    </Layout>
  );
}
