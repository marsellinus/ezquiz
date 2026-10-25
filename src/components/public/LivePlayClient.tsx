"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  CheckCircle2, 
} from "lucide-react";
import { QuestionAttachments, type QuestionAttachmentItem } from "./QuestionAttachments";

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  type: string;
  content: string;
  position: number;
  totalQuestions: number;
  points: number;
  timeLimit: number;
  options: Option[];
  attachments?: QuestionAttachmentItem[];
}

interface LiveSession {
  id: string;
  joinCode: string;
  status: "WAITING" | "COUNTDOWN" | "QUESTION_ACTIVE" | "QUESTION_ENDED" | "LEADERBOARD" | "FINISHED";
  currentQuestionIndex: number;
  totalQuestions: number;
  quizTitle: string;
}

interface Participant {
  id: string;
  nickname: string;
  score: number;
}

export function LivePlayClient({ initialCode }: { initialCode: string }) {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [leaderboard, setLeaderboard] = useState<Participant[]>([]);

  // Answers State
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [shortAnswerText, setShortAnswerText] = useState("");

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Anti-Cheat Tab Switch State
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);

  useEffect(() => {
    if (!session || session.status === "FINISHED" || session.status === "WAITING") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
        setShowTabWarning(true);
        // Persist tab switch count to DB for host analytics
        fetch(`/api/sessions/${session.id}/tab-switch`, { method: "POST" }).catch(console.error);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [session?.status]);

  // Poll Session State
  const pollState = async () => {
    try {
      const stateRes = await fetch(`/api/sessions/${initialCode}/state`);
      const stateData = await stateRes.json();
      if (stateRes.ok && stateData.session) {
        setSession(stateData.session);
        setCurrentQ(stateData.currentQuestion);
        setParticipants(stateData.participants);
        setLeaderboard(stateData.leaderboard);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    pollState();
    const interval = setInterval(pollState, 1500);
    return () => clearInterval(interval);
  }, [initialCode]);

  // Reset submission state when question changes
  useEffect(() => {
    setHasSubmitted(false);
    setFeedback(null);
    setSelectedOptionId(null);
    setSelectedOptionIds([]);
    setShortAnswerText("");
  }, [currentQ?.id, session?.currentQuestionIndex]);

  const handleSubmitAnswer = async () => {
    if (!session || !currentQ || hasSubmitted || submitting) return;
    setSubmitting(true);

    let payloadAnswer: any = null;
    if (currentQ.type === "MULTIPLE_CHOICE" || currentQ.type === "TRUE_FALSE") {
      payloadAnswer = selectedOptionId;
    } else if (currentQ.type === "MULTIPLE_SELECT") {
      payloadAnswer = selectedOptionIds;
    } else if (currentQ.type === "SHORT_ANSWER") {
      payloadAnswer = shortAnswerText;
    }

    try {
      const res = await fetch("/api/quizzes/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQ.id,
          answerData: payloadAnswer,
          points: currentQ.points,
          timeLimit: currentQ.timeLimit,
          scoringType: (currentQ as any).scoringType || "DYNAMIC",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback(data);
        setHasSubmitted(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-4 font-sans">
        <div className="animate-spin text-purple-500 mb-3 text-2xl">⏳</div>
        <p className="text-sm text-gray-400 font-bold">Menghubungkan ke Sesi Kuis ({initialCode})...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-between p-4 sm:p-8 font-sans">
      {/* Header Info */}
      <header className="max-w-2xl w-full mx-auto flex items-center justify-between pt-2 pb-4 border-b border-gray-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-purple-400 block">
            {session.quizTitle}
          </span>
          <span className="text-sm font-black">
            CODE: {session.joinCode}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {tabSwitchCount > 0 && (
            <span className="bg-red-900/60 border border-red-500/40 text-red-200 text-xs font-bold px-3 py-1.5 rounded-full animate-pulse">
              ⚠️ Warning: {tabSwitchCount}x Tab Switch
            </span>
          )}
          <span className="bg-purple-900/60 border border-purple-500/40 text-purple-200 text-xs font-bold px-3 py-1.5 rounded-full">
            {session.status}
          </span>
        </div>
      </header>

      {/* Main Gameplay Screen */}
      <main className="max-w-2xl w-full mx-auto flex-1 flex flex-col justify-center my-6">
        <AnimatePresence mode="wait">
          {session.status === "WAITING" && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800/80 border border-gray-700/80 rounded-3xl p-8 sm:p-12 text-center shadow-2xl space-y-4"
            >
              <div className="bg-purple-600/30 text-purple-400 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto text-3xl">
                🎮
              </div>
              <h2 className="text-2xl font-black text-white">Anda Sudah Masuk ke Lobby!</h2>
              <p className="text-sm text-gray-400 max-w-xs mx-auto">
                Menunggu Host memulai kuis. Siapkan jari Anda untuk menjawab secepat mungkin!
              </p>
            </motion.div>
          )}

          {session.status === "QUESTION_ACTIVE" && currentQ && (
            <motion.div
              key={currentQ.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/90 border border-gray-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center text-xs font-bold text-gray-400 border-b border-gray-700 pb-3">
                <span>Soal {session.currentQuestionIndex + 1} dari {session.totalQuestions}</span>
                <span className="bg-purple-900/50 text-purple-300 px-3 py-1 rounded-md border border-purple-500/30">
                  {currentQ.points} Poin
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
                {currentQ.content}
              </h2>

              {currentQ.attachments && currentQ.attachments.length > 0 && (
                <QuestionAttachments attachments={currentQ.attachments} theme="dark" />
              )}

              {!hasSubmitted ? (
                <div className="space-y-3 pt-2">
                  {(currentQ.type === "MULTIPLE_CHOICE" || currentQ.type === "TRUE_FALSE") && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentQ.options.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedOptionId(opt.id)}
                          className={`p-4 rounded-2xl border font-bold text-sm text-left transition-all ${
                            selectedOptionId === opt.id
                              ? "bg-purple-600 border-purple-500 text-white shadow-lg ring-2 ring-purple-400"
                              : "bg-gray-900/80 border-gray-700 text-gray-200 hover:border-gray-600"
                          }`}
                        >
                          {opt.text}
                        </button>
                      ))}
                    </div>
                  )}

                  {currentQ.type === "MULTIPLE_SELECT" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentQ.options.map((opt) => {
                        const isChecked = selectedOptionIds.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              if (isChecked) {
                                setSelectedOptionIds(selectedOptionIds.filter((id) => id !== opt.id));
                              } else {
                                setSelectedOptionIds([...selectedOptionIds, opt.id]);
                              }
                            }}
                            className={`p-4 rounded-2xl border font-bold text-sm text-left transition-all flex items-center justify-between ${
                              isChecked
                                ? "bg-purple-600 border-purple-500 text-white ring-2 ring-purple-400"
                                : "bg-gray-900/80 border-gray-700 text-gray-200 hover:border-gray-600"
                            }`}
                          >
                            <span>{opt.text}</span>
                            <span className={`w-5 h-5 rounded border flex items-center justify-center text-xs ${
                              isChecked ? "bg-white text-purple-900 border-white" : "border-gray-600"
                            }`}>
                              ✓
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {currentQ.type === "SHORT_ANSWER" && (
                    <input
                      type="text"
                      value={shortAnswerText}
                      onChange={(e) => setShortAnswerText(e.target.value)}
                      placeholder="Ketik jawaban Anda..."
                      className="w-full bg-gray-900 border-2 border-gray-700 rounded-2xl p-4 text-white font-bold text-sm focus:outline-none focus:border-purple-500 shadow-inner"
                    />
                  )}
                </div>
              ) : (
                <div className="bg-purple-900/40 border border-purple-500/30 p-6 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h3 className="font-extrabold text-base text-white">Jawaban Terkirim!</h3>
                  <p className="text-xs text-gray-400">Menunggu seluruh peserta selesai menjawab...</p>
                </div>
              )}
            </motion.div>
          )}

          {session.status === "LEADERBOARD" && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800/90 border border-gray-700/80 rounded-3xl p-8 shadow-2xl text-center space-y-6"
            >
              <div className="flex items-center justify-center gap-2 text-amber-400">
                <Trophy className="w-7 h-7" />
                <h2 className="text-xl font-black uppercase tracking-tight">Leaderboard Sementara</h2>
              </div>

              <div className="space-y-2">
                {leaderboard.map((p, idx) => (
                  <div key={p.id} className="bg-gray-900/80 border border-gray-700 px-4 py-3 rounded-xl flex items-center justify-between font-bold text-sm">
                    <span className="text-gray-300 flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                        idx === 0 ? "bg-amber-400 text-gray-900" : idx === 1 ? "bg-gray-300 text-gray-900" : idx === 2 ? "bg-amber-700 text-white" : "bg-gray-800 text-gray-400"
                      }`}>
                        {idx + 1}
                      </span>
                      {p.nickname}
                    </span>
                    <span className="text-purple-400">{p.score} Poin</span>
                  </div>
                ))}
                {leaderboard.length === 0 && (
                  <p className="text-xs text-gray-500">Menunggu jawaban peserta...</p>
                )}
              </div>
            </motion.div>
          )}

          {session.status === "FINISHED" && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800/90 border border-gray-700/80 rounded-3xl p-10 shadow-2xl text-center space-y-6"
            >
              <div className="text-5xl">🎉</div>
              <h2 className="text-2xl font-black text-white">SELESAI!</h2>
              <p className="text-sm text-gray-400">Terima kasih telah berpartisipasi dalam kuis interaktif ini!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Submit Action */}
      <footer className="max-w-2xl w-full mx-auto text-center pb-4">
        {session.status === "QUESTION_ACTIVE" && !hasSubmitted && (
          <button
            onClick={handleSubmitAnswer}
            disabled={submitting}
            className="w-full bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-extrabold text-base py-4 rounded-2xl transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Mengirim Jawaban...
              </>
            ) : (
              "KIRIM JAWABAN"
            )}
          </button>
        )}
      </footer>

      {/* Tab Switch Warning Modal (Anti-Cheat) */}
      {showTabWarning && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4 text-white">
            <div className="bg-red-500/20 text-red-400 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto text-3xl">
              ⚠️
            </div>
            <h3 className="text-xl font-extrabold text-white">Peringatan: Berpindah Tab!</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Sistem mendeteksi Anda telah berpindah atau meninggalkan aplikasi kuis ini. Catatan pelanggaran ini dikirimkan langsung ke Guru/Host.
            </p>
            <button
              onClick={() => setShowTabWarning(false)}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md text-sm"
            >
              Saya Mengerti & Kembali ke Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
