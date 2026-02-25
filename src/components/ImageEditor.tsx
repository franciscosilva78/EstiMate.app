import { useState, useRef, ChangeEvent } from "react";
import { Image as ImageIcon, Sparkles, X, Upload, Loader2 } from "lucide-react";

export function ImageEditor() {
  const [isOpen, setIsOpen] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResultImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!image || !prompt) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/edit-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image, prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to edit image");
      }

      setResultImage(data.imageUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-105 flex items-center justify-center group z-50"
        title="Editor Nano Banana"
      >
        <Sparkles size={24} className="group-hover:animate-pulse" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 flex flex-col max-h-[80vh]">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2 text-indigo-600 font-semibold">
          <Sparkles size={18} />
          <span>Editor Nano Banana</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
        {!image ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-colors"
          >
            <Upload size={32} className="mb-2 text-slate-400" />
            <span className="text-sm font-medium text-slate-900">Clique para enviar imagem</span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
            <img src={resultImage || image} alt="Preview" className="w-full h-auto object-cover" />
            <button
              onClick={() => {
                setImage(null);
                setResultImage(null);
              }}
              className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2 mt-auto">
          <label className="text-sm font-medium text-slate-700">Comando</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="ex: Adicionar um filtro retrô, Remover a pessoa no fundo..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none h-20 text-slate-900"
            disabled={loading || !image}
          />
          <button
            onClick={handleEdit}
            disabled={loading || !image || !prompt.trim()}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <ImageIcon size={18} />
                Editar Imagem
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
