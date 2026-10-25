"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import { 
  ArrowLeft, 
  Play, 
  ChevronRight, 
  Trophy, 
  Users, 
  Square, 
  CheckCircle2,
  Sparkles,
  Gamepad2
} from "lucide-react";

interface Participant {
  id: string;
  nickname: string;
  score: number;
}

interface SessionData {
  id: string;
  quizId?: string;
  joinCode: string;
  quizTitle: string;
  status: "WAITING" | "COUNTDOWN" | "QUESTION_ACTIVE" | "QUESTION_ENDED" | "LEADERBOARD" | "FINISHED";
  currentQuestionIndex: number;
  totalQuestions?: number;
  participants: Participant[];
}

export function HostControlClient({ initialSession }: { initialSession: SessionData }) {
  const [session, setSession] = useState<SessionData>(initialSession);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // Real-time State Polling
  const fetchState = async () => {
    try {
      const res = await fetch(`/api/sessions/${session.id}/state`);
      const data = await res.json();
      if (res.ok) {
        setSession((prev) => ({
          ...prev,
          status: data.session.status,
          currentQuestionIndex: data.session.currentQuestionIndex,
          participants: data.participants,
        }));
        setCurrentQuestion(data.currentQuestion);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, [session.id]);

  // Auto-advance from Leaderboard after 1.5 seconds (full automation for teacher)
  useEffect(() => {
    if (session.status === "LEADERBOARD") {
      const timer = setTimeout(() => {
        handleNext();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [session.status, session.currentQuestionIndex]);

  // Auto-transition from QUESTION_ACTIVE to LEADERBOARD when question time limit expires
  useEffect(() => {
    if (session.status === "QUESTION_ACTIVE" && currentQuestion) {
      const duration = (currentQuestion.timeLimit || 30) * 1000;
      const timer = setTimeout(() => {
        handleNext();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [session.status, session.currentQuestionIndex, currentQuestion?.id]);

  const [countdown, setCountdown] = useState<number | null>(null);

  const handleStartWithCountdown = async () => {
    setLoadingAction(true);
    try {
      await fetch(`/api/sessions/${session.id}/countdown`, { method: "POST" });
      setCountdown(3);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(false);
    }
  };

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      handleStart();
      setCountdown(null);
    }
  }, [countdown]);

  const handleStart = async () => {
    setLoadingAction(true);
    try {
      await fetch(`/api/sessions/${session.id}/start`, { method: "POST" });
      await fetchState();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleNext = async () => {
    setLoadingAction(true);
    try {
      await fetch(`/api/sessions/${session.id}/next`, { method: "POST" });
      await fetchState();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEnd = async () => {
    if (confirm("Akhiri sesi kuis ini? Kode game akan ditutup.")) {
      setLoadingAction(true);
      try {
        await fetch(`/api/sessions/${session.id}/end`, { method: "POST" });
        await fetchState();
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingAction(false);
      }
    }
  };

  const handleKick = async (participantId: string, nickname: string) => {
    if (confirm(`Tendang peserta "${nickname}" dari sesi kuis ini?`)) {
      try {
        await fetch(`/api/sessions/${session.id}/kick`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantId }),
        });
        await fetchState();
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans flex flex-col justify-between">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto w-full flex justify-between items-center pb-6 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link href="/author/quizzes" className="p-2.5 text-gray-400 hover:text-white bg-gray-800 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 block">
              HOST CONTROL PANEL
            </span>
            <h1 className="text-xl font-bold tracking-tight">{session.quizTitle}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-purple-900/60 border border-purple-500/30 text-purple-300 text-xs font-bold px-3.5 py-2 rounded-xl uppercase tracking-wider">
            Status: {session.status}
          </span>

          {session.status !== "FINISHED" && (
            <button
              onClick={handleEnd}
              disabled={loadingAction}
              className="bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
              title="Hentikan Sesi & Tutup Kode Game Peserta"
            >
              <Square className="w-3.5 h-3.5 fill-white" /> ⏹ Stop & Tutup Kode
            </button>
          )}
        </div>
      </div>

      {/* Main Display Area */}
      <main className="max-w-6xl mx-auto w-full flex-1 my-8 flex flex-col justify-center">
        {session.status === "WAITING" && (
          <div className="bg-gray-800/80 border border-gray-700/80 rounded-3xl p-8 sm:p-12 text-center space-y-8 shadow-2xl backdrop-blur-md">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-200">
                <QRCode 
                  value={typeof window !== "undefined" ? `${window.location.origin}/join?code=${session.joinCode}` : `http://localhost:3000/join?code=${session.joinCode}`} 
                  size={150} 
                  className="rounded-lg"
                />
              </div>
              <div className="text-center md:text-left">
                <span className="text-xs font-extrabold uppercase tracking-widest text-gray-400 block mb-2">
                  GAME CODE UNTUK PESERTA
                </span>
                <div className="inline-block bg-white text-gray-900 text-5xl sm:text-7xl font-black tracking-widest px-10 py-6 rounded-3xl shadow-inner border-4 border-purple-500">
                  {session.joinCode}
                </div>
                <p className="text-sm text-gray-400 mt-4">
                  Buka <strong className="text-white">{(typeof window !== "undefined") ? window.location.origin : "http://localhost:3000"}/join</strong><br/>
                  Atau scan QR Code di samping!
                </p>
              </div>
            </div>

            {/* Participants Grid */}
            <div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Users className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold">Peserta Terhubung ({session.participants.length})</h3>
              </div>

              {session.participants.length === 0 ? (
                <p className="text-xs text-gray-500 animate-pulse">Menunggu peserta pertama bergabung...</p>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-2xl mx-auto">
                  {session.participants.map((p) => (
                    <div
                      key={p.id}
                      className="bg-purple-900/50 border border-purple-500/40 text-purple-200 text-sm font-bold pl-4 pr-2 py-1.5 rounded-xl shadow-sm flex items-center gap-2 group"
                    >
                      <span>👤 {p.nickname}</span>
                      <button
                        onClick={() => handleKick(p.id, p.nickname)}
                        className="text-gray-400 hover:text-red-400 hover:bg-red-900/50 p-1 rounded-lg transition-colors text-xs font-bold"
                        title="Tendang Peserta Iseng"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {(session.status === "COUNTDOWN" || countdown !== null) && (
          <div className="bg-gray-800/80 border border-gray-700/80 rounded-3xl p-16 text-center space-y-6 shadow-2xl max-w-xl mx-auto w-full">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400 block">
              GET READY! KUIS DIMULAI DALAM
            </span>
            <AnimatePresence mode="wait">
              <motion.div
                key={countdown ?? 3}
                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                animate={{ opacity: 1, scale: 1.2, rotate: 0 }}
                exit={{ opacity: 0, scale: 1.8, rotate: 10 }}
                transition={{ duration: 0.5, ease: "backOut" }}
                className="text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 py-4"
              >
                {countdown && countdown > 0 ? countdown : "GO! 🚀"}
              </motion.div>
            </AnimatePresence>
            <p className="text-sm text-gray-400 animate-pulse">Menyiapkan soal pertama...</p>
          </div>
        )}

        {session.status === "QUESTION_ACTIVE" && currentQuestion && (
          <div className="bg-gray-800/80 border border-gray-700/80 rounded-3xl p-10 text-center space-y-6 shadow-2xl">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block">
              Soal {session.currentQuestionIndex + 1} dari {session.totalQuestions}
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white max-w-3xl mx-auto">
              {currentQuestion.content}
            </h2>

            <div className="pt-4 flex items-center justify-center gap-4 text-xs font-bold text-gray-400">
              <span className="bg-gray-700 px-3 py-1.5 rounded-lg">⏱️ {currentQuestion.timeLimit} Detik</span>
              <span className="bg-gray-700 px-3 py-1.5 rounded-lg">🏆 {currentQuestion.points} Poin</span>
            </div>
          </div>
        )}

        {session.status === "LEADERBOARD" && (
          <div className="bg-gray-800/80 border border-gray-700/80 rounded-3xl p-10 text-center space-y-6 shadow-2xl max-w-2xl mx-auto w-full">
            <div className="flex items-center justify-center gap-2 text-amber-400">
              <Trophy className="w-8 h-8" />
              <h2 className="text-2xl font-black uppercase tracking-tight">Papan Peringkat Live</h2>
            </div>

            <div className="space-y-3">
              {session.participants.slice(0, 5).map((p, idx) => (
                <div
                  key={p.id}
                  className="bg-gray-900/80 border border-gray-700/60 px-6 py-4 rounded-2xl flex items-center justify-between font-bold text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                      idx === 0 ? "bg-amber-400 text-gray-900" : idx === 1 ? "bg-gray-300 text-gray-900" : idx === 2 ? "bg-amber-700 text-white" : "bg-gray-800 text-gray-400"
                    }`}>
                      #{idx + 1}
                    </span>
                    <span className="text-white">{p.nickname}</span>
                  </div>
                  <span className="text-purple-400 font-extrabold">{p.score} Poin</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {session.status === "FINISHED" && (
          <div className="bg-gray-800/80 border border-gray-700/80 rounded-3xl p-10 text-center space-y-6 shadow-2xl max-w-2xl mx-auto w-full">
            <div className="text-5xl">🏆</div>
            <h2 className="text-3xl font-black text-white">QUIZ FINISHED!</h2>
            {session.participants[0] && (
              <p className="text-base text-gray-300">
                Pemenang Utama: <strong className="text-amber-400 text-lg font-bold">{session.participants[0].nickname}</strong> ({session.participants[0].score} Poin)
              </p>
            )}

            <div className="pt-4 flex justify-center">
              <Link
                href={`/author/quizzes/${session.quizId}/analytics`}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm px-6 py-3.5 rounded-2xl transition-all shadow-lg flex items-center gap-2"
              >
                📊 Lihat Laporan Analisis & Rekap Nilai Lengkap Guru
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer Controls */}
      <footer className="max-w-6xl mx-auto w-full flex flex-wrap justify-center items-center gap-4 pt-4 border-t border-gray-800">
        {session.status === "WAITING" && (
          <>
            <button
              onClick={handleStartWithCountdown}
              disabled={loadingAction || session.participants.length === 0}
              className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-extrabold text-base px-8 py-4 rounded-2xl transition-all shadow-xl flex items-center gap-2.5 disabled:opacity-40"
            >
              <Play className="w-5 h-5 fill-white" /> ▶ MULAI KUIS SEKARANG (START)
            </button>
            <button
              onClick={handleEnd}
              disabled={loadingAction}
              className="bg-gray-800 hover:bg-red-600 text-gray-300 hover:text-white font-bold text-sm px-6 py-4 rounded-2xl transition-all border border-gray-700 flex items-center gap-2"
            >
              <Square className="w-4 h-4" /> ⏹ STOP & TUTUP KODE
            </button>
          </>
        )}

        {(session.status === "QUESTION_ACTIVE" || session.status === "LEADERBOARD") && (
          <button
            onClick={handleNext}
            disabled={loadingAction}
            className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-extrabold text-lg px-10 py-4 rounded-2xl transition-all shadow-xl flex items-center gap-3"
          >
            {session.status === "QUESTION_ACTIVE" ? (
              <>
                <Trophy className="w-6 h-6" /> TAMPILKAN LEADERBOARD
              </>
            ) : (
              <>
                <ChevronRight className="w-6 h-6" /> SOAL BERIKUTNYA →
              </>
            )}
          </button>
        )}
      </footer>
    </div>
  );
}
