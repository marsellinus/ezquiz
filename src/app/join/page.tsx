"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Gamepad2, ArrowRight, AlertCircle } from "lucide-react";

function JoinGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCodeParam = searchParams.get("code") || searchParams.get("joinCode") || "";

  const [joinCode, setJoinCode] = useState(initialCodeParam);
  const [nickname, setNickname] = useState("");
  const [className, setClassName] = useState("");
  const [step, setStep] = useState<"CODE" | "NICKNAME">(initialCodeParam.trim().length >= 4 ? "NICKNAME" : "CODE");

  useEffect(() => {
    if (initialCodeParam.trim().length >= 4) {
      setJoinCode(initialCodeParam.trim().toUpperCase());
      setStep("NICKNAME");
    }
  }, [initialCodeParam]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim().length >= 4) {
      setStep("NICKNAME");
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/sessions/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          joinCode: joinCode.trim().toUpperCase(),
          nickname: nickname.trim(),
          className: className.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal bergabung ke kuis");

      // Redirect to live play page
      router.push(`/play/${data.session.joinCode}`);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-purple-600 text-white p-4 rounded-2xl mb-4 shadow-xl">
            <Gamepad2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">JOIN LIVE GAME</h1>
          <p className="text-xs text-gray-400 mt-1">Masukkan Kode Game dari Host Kuis Anda</p>
        </div>

        <div className="bg-gray-800/90 border border-gray-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          {error && (
            <div role="alert" className="mb-6 bg-red-900/50 border border-red-500/50 text-red-200 text-xs p-4 rounded-2xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {step === "CODE" ? (
            <form onSubmit={handleNextStep} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 text-center">
                  ENTER GAME CODE
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  required
                  maxLength={6}
                  placeholder="A7K92"
                  className="w-full bg-gray-900 border-2 border-purple-500/50 rounded-2xl py-4 text-center text-3xl font-black tracking-widest text-white focus:outline-none focus:border-purple-500 uppercase shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={joinCode.trim().length < 4}
                className="w-full bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-extrabold py-4 rounded-2xl text-base transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-40"
              >
                Lanjut <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-5">
              <div>
                <span className="inline-block bg-purple-900/60 border border-purple-500/30 text-purple-300 text-xs font-bold px-3 py-1 rounded-full mb-3">
                  Kode Game: {joinCode}
                </span>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  NAMA / NICKNAME PESERTA *
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                  placeholder="Contoh: Budi"
                  className="w-full bg-gray-900 border-2 border-gray-700 rounded-2xl px-4 py-3 text-center text-lg font-bold text-white focus:outline-none focus:border-purple-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-300 uppercase tracking-widest mb-1.5">
                  KELAS / ROMBEL (OPSIONAL)
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Contoh: X IPA 1, XII MIPA 2"
                  className="w-full bg-gray-900 border border-purple-500/40 rounded-2xl px-4 py-2.5 text-center text-sm font-bold text-purple-200 focus:outline-none focus:border-purple-400 shadow-inner"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep("CODE")}
                  className="px-4 py-4 bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold rounded-2xl text-sm"
                >
                  Ubah Kode
                </button>
                <button
                  type="submit"
                  disabled={loading || !nickname.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-extrabold py-4 rounded-2xl text-base transition-all shadow-lg disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Bergabung...
                    </>
                  ) : (
                    "MASUK KE GAME 🚀"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JoinGamePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 text-white flex items-center justify-center text-sm font-bold" role="status">Memuat Halaman Game...</div>}>
      <JoinGameContent />
    </Suspense>
  );
}
