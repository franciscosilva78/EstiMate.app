import { useState, FormEvent } from "react";

interface JoinRoomProps {
  onJoin: (name: string, role: "QA" | "Dev") => void;
}

export function JoinRoom({ onJoin }: JoinRoomProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<"QA" | "Dev">("Dev");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name.trim(), role);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 sm:mt-20 p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-white/10 shadow-[0_0_40px_-10px_rgba(34,211,238,0.2)] backdrop-blur-sm">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
        Entrar na Sessão
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Seu Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all text-white placeholder-slate-600 font-medium text-sm sm:text-base"
            placeholder="Digite seu nome"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Selecione sua Função</label>
          <div className="flex gap-3 sm:gap-4">
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="Dev"
                checked={role === "Dev"}
                onChange={() => setRole("Dev")}
                className="peer sr-only"
              />
              <div className="text-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-950 border border-white/10 peer-checked:border-cyan-500 peer-checked:bg-cyan-500/10 peer-checked:text-cyan-400 peer-checked:shadow-[0_0_15px_-3px_rgba(34,211,238,0.3)] font-bold transition-all text-xs sm:text-sm">
                DEV
              </div>
            </label>
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="QA"
                checked={role === "QA"}
                onChange={() => setRole("QA")}
                className="peer sr-only"
              />
              <div className="text-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-950 border border-white/10 peer-checked:border-purple-500 peer-checked:bg-purple-500/10 peer-checked:text-purple-400 peer-checked:shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)] font-bold transition-all text-xs sm:text-sm">
                QA
              </div>
            </label>
          </div>
        </div>
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-xl font-bold text-base sm:text-lg shadow-[0_0_20px_-5px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_-5px_rgba(34,211,238,0.6)] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
        >
          Entrar na Sala
        </button>
      </form>
    </div>
  );
}
