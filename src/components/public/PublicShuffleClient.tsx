"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import { QuestionAttachments } from "./QuestionAttachments";
import { 
  Shuffle, 
  AlertCircle,
  Volume2,
  Pause,
  Play,
  Maximize2,
  Minimize2,
  CheckCircle2,
  XCircle
} from "lucide-react";

interface Attachment {
  type: "IMAGE" | "VIDEO" | "FILE";
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
}

interface QuestionLink {
  title: string;
  url: string;
}

interface Question {
  id?: string;
  content: string;
  positionNumber?: number;
  type?: string;
  options?: { id: string; text: string }[];
  attachments: Attachment[];
  links: QuestionLink[];
}

interface PickerPublicData {
  title: string;
  description: string | null;
  slug: string;
  isPreview?: boolean;
  pickerId?: string;
}

declare global {
  interface Window {
    // Holds a live reference so Chrome does not garbage-collect the utterance mid-speech.
    __utterance?: SpeechSynthesisUtterance;
  }
}

export function PublicShuffleClient({ picker }: { picker: PickerPublicData }) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [speechState, setSpeechState] = useState<"IDLE" | "PLAYING" | "PAUSED">("IDLE");

  // Answering state — one of these shapes per question type
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [essayText, setEssayText] = useState("");
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: string;
    isCorrect: boolean | null;
    correctOptionIds: string[];
    correctAnswers: string[];
    explanation?: string | null;
  } | null>(null);
  const [showEssayReference, setShowEssayReference] = useState(false);

  // Pre-load voices to avoid Chrome's async getVoices() bug
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Esc/F11 also leave fullscreen: keep the icon in sync with the real browser state.
  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  // Speech can be cut short by navigation/shuffle; stop it when the card unmounts.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeakQuestion = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (speechState === "PLAYING") {
      window.speechSynthesis.pause();
      setSpeechState("PAUSED");
      return;
    }

    if (speechState === "PAUSED") {
      window.speechSynthesis.resume();
      setSpeechState("PLAYING");
      return;
    }

    if (!question?.content) return;

    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(question.content);
    utterance.lang = "id-ID";
    utterance.rate = 0.95;
    
    // Cari suara yang lebih natural (Google Chrome Voice, Edge Natural, dsb)
    const voices = window.speechSynthesis.getVoices();
    const indonesianVoices = voices.filter(v => v.lang.includes("id-ID") || v.lang.includes("id_ID") || v.lang === "id");
    
    const naturalVoice = indonesianVoices.find(v => 
      v.name.includes("Google") || 
      v.name.toLowerCase().includes("natural") || 
      v.name.toLowerCase().includes("online")
    );
    
    if (naturalVoice) {
      utterance.voice = naturalVoice; // Suara paling natural yang tersedia
    } else if (indonesianVoices.length > 0) {
      utterance.voice = indonesianVoices[0];
    }

    utterance.onstart = () => setSpeechState("PLAYING");
    utterance.onend = () => setSpeechState("IDLE");
    utterance.onerror = () => setSpeechState("IDLE");
    
    // Mencegah Garbage Collection mendadak di beberapa browser
    window.__utterance = utterance;

    window.speechSynthesis.speak(utterance);
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Browsers reject requestFullscreen outside a user gesture or when blocked by policy.
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
  };

  const handleShuffle = async () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeechState("IDLE");
    }
    setLoading(true);
    setError(null);
    setSelectedOptionId(null);
    setSelectedOptionIds([]);
    setEssayText("");
    setFeedback(null);
    setShowEssayReference(false);

    try {
      const res = await fetch(`/api/public/${picker.slug}/shuffle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPreview: picker.isPreview,
          pickerId: picker.pickerId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengambil soal");
      }

      setQuestion(data.question);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (answerData: string | string[]) => {
    if (!question?.id || feedback || checking) return;
    setChecking(true);

    try {
      const res = await fetch(`/api/public/${picker.slug}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          answerData,
          isPreview: picker.isPreview,
          pickerId: picker.pickerId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memeriksa jawaban");

      setFeedback(data);
    } catch (err) {
      setSelectedOptionId(null);
      setSelectedOptionIds([]);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setChecking(false);
    }
  };

  const handleSelectOption = (optionId: string) => {
    if (!question?.id || feedback || checking) return;

    if (question.type === "MULTIPLE_SELECT") {
      setSelectedOptionIds((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      );
      return;
    }

    setSelectedOptionId(optionId);
    void submitAnswer(optionId);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Sticky compact header: keeps title + progress visible on long questions */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200/80">
        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-2.5 flex items-center gap-3">
          <div className="bg-gray-900 text-white p-1.5 rounded-lg shrink-0">
            <Shuffle className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none mb-1">
              Random Picker Soal
            </span>
            <h1 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight truncate">
              {picker.title}
            </h1>
          </div>
          {question?.positionNumber !== undefined && (
            <span className="shrink-0 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-extrabold px-2.5 py-1 rounded-md">
              #{question.positionNumber}
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-between px-4 sm:px-8">
        {picker.description && (
          <p className="max-w-2xl w-full mx-auto text-xs sm:text-sm text-gray-500 leading-relaxed pt-4 line-clamp-2">
            {picker.description}
          </p>
        )}

      {/* Main Question Display Box */}
      <main className="max-w-2xl w-full mx-auto flex-1 flex flex-col justify-center my-4">
        {error ? (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center text-sm font-medium">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p>{error}</p>
            <button
              onClick={handleShuffle}
              className="mt-4 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors"
            >
              🔄 Coba Lagi
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {!question ? (
              // Empty State Before First Shuffle (Section AQ)
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-gray-200 rounded-3xl p-10 sm:p-14 text-center shadow-sm flex flex-col items-center justify-center min-h-[300px]"
              >
                <div className="bg-gray-100 p-4 rounded-2xl mb-4 text-3xl">
                  🎲
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Belum ada soal dipilih</h3>
                <p className="text-sm text-gray-500 max-w-xs">
                  Tekan tombol Shuffle di bawah untuk mendapatkan soal secara acak.
                </p>
              </motion.div>
            ) : (
              // Active Question Card (Section AB & AL)
              <motion.div
                key={question.id ?? question.content + (question.positionNumber || "")}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 min-h-[300px] flex flex-col justify-between"
              >
                <div>
                  {/* Question number lives in the sticky header, so the card starts with actions */}
                  <div className="flex justify-end items-center mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSpeakQuestion}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                          speechState === "PLAYING" ? "bg-purple-100 text-purple-700 hover:bg-purple-200 ring-1 ring-purple-300" :
                          speechState === "PAUSED" ? "bg-amber-100 text-amber-700 hover:bg-amber-200 ring-1 ring-amber-300" :
                          "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                        title="Bacakan Soal dengan Suara (Text-To-Speech)"
                      >
                        {speechState === "PLAYING" ? (
                          <><Pause className="w-4 h-4" /> Pause Suara</>
                        ) : speechState === "PAUSED" ? (
                          <><Play className="w-4 h-4" /> Lanjut Baca</>
                        ) : (
                          <><Volume2 className="w-4 h-4 text-purple-600" /> Bacakan</>
                        )}
                      </button>
                      <button
                        onClick={toggleFullscreen}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-1.5 rounded-lg text-xs font-bold transition-colors"
                        title="Mode Proyektor / Fullscreen"
                      >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <h2 className="text-lg sm:text-xl font-medium text-gray-900 leading-relaxed whitespace-pre-line">
                    {question.content}
                  </h2>
                </div>

                {/* Answering UI — single choice, multi-select, or essay */}
                {question.type === "LONG_ANSWER" ? (
                  <div className="space-y-3 pt-2">
                    <textarea
                      value={essayText}
                      onChange={(e) => setEssayText(e.target.value)}
                      rows={4}
                      disabled={feedback !== null || checking}
                      placeholder="Tulis jawaban uraianmu di sini..."
                      className="w-full bg-gray-50 border border-gray-300 rounded-2xl p-4 text-sm text-gray-900 font-medium focus:outline-none focus:border-gray-900 disabled:opacity-70"
                    />

                    {!feedback ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (essayText.trim()) void submitAnswer(essayText.trim());
                        }}
                        disabled={checking || !essayText.trim()}
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm font-extrabold py-3 rounded-2xl transition-colors disabled:opacity-50"
                      >
                        {checking ? "Mengirim..." : "Kirim Jawaban"}
                      </button>
                    ) : (
                      <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm space-y-2">
                        <p className="font-extrabold text-gray-900">Jawaban terkirim</p>
                        <p className="text-xs text-gray-600">
                          Soal essay tidak dinilai otomatis. Cocokkan jawabanmu dengan pembahasan di bawah.
                        </p>
                        {feedback.explanation && (
                          <p className="text-xs text-gray-700 bg-white p-3 rounded-xl border border-gray-200/60">
                            💡 <strong>Pembahasan:</strong> {feedback.explanation}
                          </p>
                        )}
                        {!feedback.explanation && (
                          <button
                            type="button"
                            onClick={() => setShowEssayReference((v) => !v)}
                            className="text-xs font-semibold text-indigo-600 hover:underline"
                          >
                            {showEssayReference ? "Sembunyikan kunci" : "Lihat kunci jawaban"}
                          </button>
                        )}
                        {showEssayReference && feedback.correctAnswers.length > 0 && (
                          <p className="text-xs font-semibold text-gray-800">
                            Kunci: <strong>{feedback.correctAnswers.join(", ")}</strong>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  question.options &&
                  question.options.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {question.options.map((opt, idx) => {
                          const isPicked =
                            question.type === "MULTIPLE_SELECT"
                              ? selectedOptionIds.includes(opt.id)
                              : selectedOptionId === opt.id;
                          const isCorrectOption = feedback?.correctOptionIds.includes(opt.id) ?? false;
                          const answered = feedback !== null;

                          const stateClass = !answered
                            ? isPicked
                              ? "bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500"
                              : "bg-gray-50 border-gray-200 text-gray-800 hover:border-gray-400 hover:bg-white"
                            : isCorrectOption
                              ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500"
                              : isPicked
                                ? "bg-red-50 border-red-400 text-red-900 ring-1 ring-red-400"
                                : "bg-gray-50 border-gray-200 text-gray-400";

                          return (
                            <button
                              key={opt.id || idx}
                              type="button"
                              onClick={() => handleSelectOption(opt.id)}
                              disabled={answered || checking || !question.id}
                              className={`p-4 rounded-2xl border font-bold text-sm text-left flex gap-3 transition-all disabled:cursor-default ${stateClass}`}
                            >
                              <span className="font-mono shrink-0">{String.fromCharCode(65 + idx)}.</span>
                              <span className="flex-1">{opt.text}</span>
                              {answered && isCorrectOption && (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                              )}
                              {answered && isPicked && !isCorrectOption && (
                                <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {question.type === "MULTIPLE_SELECT" && !feedback && (
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedOptionIds.length > 0) void submitAnswer(selectedOptionIds);
                          }}
                          disabled={checking || selectedOptionIds.length === 0}
                          className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm font-extrabold py-3 rounded-2xl transition-colors disabled:opacity-50"
                        >
                          {checking ? "Memeriksa..." : "Periksa Jawaban"}
                        </button>
                      )}

                      <AnimatePresence mode="wait">
                        {feedback && (
                          <motion.div
                            key={feedback.isCorrect ? "correct" : "wrong"}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`p-4 rounded-2xl border text-sm space-y-2 ${
                              feedback.isCorrect
                                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                                : "bg-red-50 border-red-200 text-red-900"
                            }`}
                          >
                            <div className="flex items-center gap-2 font-extrabold">
                              {feedback.isCorrect ? (
                                <>
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Jawaban Benar!
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-5 h-5 text-red-600" /> Belum Tepat
                                </>
                              )}
                            </div>
                            {!feedback.isCorrect && feedback.correctAnswers.length > 0 && (
                              <p className="text-xs font-semibold">
                                Jawaban benar: <strong>{feedback.correctAnswers.join(", ")}</strong>
                              </p>
                            )}
                            {feedback.explanation && (
                              <p className="text-xs text-gray-700 bg-white/70 p-3 rounded-xl border border-gray-200/60">
                                💡 <strong>Penjelasan:</strong> {feedback.explanation}
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                )}

                {/* Attachments Display */}
                <QuestionAttachments attachments={question.attachments} className="pt-2" />

                {/* Links Display */}
                {question.links.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                      Tautan Referensi (Scan QR / Klik):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {question.links.map((link, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 p-4 rounded-2xl flex flex-col items-center justify-center gap-3 text-center shadow-sm hover:shadow-md transition-shadow">
                          <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                            <QRCode value={link.url} size={96} className="rounded-md" />
                          </div>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1.5 break-words w-full px-2"
                          >
                            🔗 {link.title}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

        {/* Shuffle action: sticky so it is always reachable on long questions */}
        <footer className="sticky bottom-0 max-w-2xl w-full mx-auto text-center pb-4 pt-3 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent">
          <button
            onClick={handleShuffle}
            disabled={loading}
            aria-label="Acak soal"
            aria-busy={loading}
            className="w-full sm:w-auto min-w-[280px] bg-gray-900 hover:bg-gray-800 active:scale-95 text-white font-extrabold text-base sm:text-lg py-3.5 px-8 rounded-2xl transition-all duration-150 flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
          >
            <Shuffle className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "MENGACAK SOAL..." : question ? "ACAK SOAL LAIN" : "ACAK SOAL"}
          </button>
        </footer>
      </div>
    </div>
  );
}
