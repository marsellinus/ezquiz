"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BrainCircuit, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Award, 
  ArrowRight, 
  RotateCcw
} from "lucide-react";
import { QuestionAttachments, type QuestionAttachmentItem } from "@/components/public/QuestionAttachments";

interface Option {
  id: string;
  text: string;
}

interface QuizQuestionItem {
  id: string;
  type: "MULTIPLE_CHOICE" | "MULTIPLE_SELECT" | "TRUE_FALSE" | "SHORT_ANSWER" | "LONG_ANSWER";
  content: string;
  points: number;
  timeLimit: number;
  position: number;
  options: Option[];
  attachments?: QuestionAttachmentItem[];
}

interface QuizPublicData {
  title: string;
  description: string | null;
  slug: string;
  questions: QuizQuestionItem[];
}

export function SelfPacedQuizClient({ quiz }: { quiz: QuizPublicData }) {
  const [nickname, setNickname] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [globalTimeLimit, setGlobalTimeLimit] = useState(30);

  // User Answers State
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [shortAnswerText, setShortAnswerText] = useState("");

  // Timer State
  const [timeLeft, setTimeLeft] = useState(30);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [submitting, setSubmitting] = useState(false);

  // Feedback State
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    awardedPoints: number;
    correctAnswers: string[];
    explanation?: string;
  } | null>(null);

  // Final Stats
  const [totalScore, setTotalScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Anti-Cheat Tab Switch State
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);

  useEffect(() => {
    if (!hasStarted || isFinished) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
        setShowTabWarning(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [hasStarted, isFinished]);

  const currentQ = quiz.questions[currentIndex];

  // Ensure each question has a sensible time limit
  const effectiveTimeLimit = currentQ?.timeLimit ?? globalTimeLimit;

  // Timer Effect
  useEffect(() => {
    if (!hasStarted || isFinished || feedback || !currentQ) return;

    setTimeLeft(effectiveTimeLimit);
    setStartTime(Date.now());

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit on time out
          handleSubmitAnswer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, hasStarted, isFinished, feedback, globalTimeLimit]);

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      setHasStarted(true);
    }
  };

  const handleSubmitAnswer = async () => {
    if (submitting || feedback || !currentQ) return;
    
    // Validation: Check if answer exists
    if (currentQ.type === "MULTIPLE_CHOICE" || currentQ.type === "TRUE_FALSE") {
        if (!selectedOptionId) return;
    } else if (currentQ.type === "MULTIPLE_SELECT") {
        if (selectedOptionIds.length === 0) return;
    } else if (currentQ.type === "SHORT_ANSWER") {
        if (shortAnswerText.trim() === "") return;
    }

    setSubmitting(true);

    const responseTime = (Date.now() - startTime) / 1000;
    const payloadAnswer = 
        currentQ.type === "MULTIPLE_CHOICE" || currentQ.type === "TRUE_FALSE" ? selectedOptionId :
        currentQ.type === "MULTIPLE_SELECT" ? selectedOptionIds :
        shortAnswerText;

    try {
      const res = await fetch("/api/quizzes/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQ.id,
          answerData: payloadAnswer,
          points: currentQ.points,
          timeLimit: effectiveTimeLimit,
          scoringType: (currentQ as any).scoringType || "DYNAMIC",
          responseTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses jawaban");

      setFeedback(data);
      if (data.isCorrect) {
        setTotalScore((prev) => prev + data.awardedPoints);
        setCorrectCount((prev) => prev + 1);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    setFeedback(null);
    setSelectedOptionId(null);
    setSelectedOptionIds([]);
    setShortAnswerText("");

    if (currentIndex + 1 < quiz.questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setTotalScore(0);
    setCorrectCount(0);
    setIsFinished(false);
    setFeedback(null);
    setSelectedOptionId(null);
    setSelectedOptionIds([]);
    setShortAnswerText("");
  };

  // Step 1: Nickname Form
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans">
        <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-md w-full shadow-xl text-center">
          <div className="bg-purple-100 text-purple-700 p-4 rounded-2xl w-14 h-14 flex items-center justify-center mx-auto mb-4">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">{quiz.title}</h1>
          <p className="text-sm text-gray-500 mb-8">{quiz.description || "Kuis Interaktif Self-Paced"}</p>

          <form onSubmit={handleStartQuiz} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 text-left">
                Masukkan Nickname Anda
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                placeholder="Contoh: Aditya"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-bold text-sm focus:outline-none focus:border-purple-600 shadow-sm"
              />
            </div>



            <button
            type="submit"
            disabled={nickname.trim() === ""}
            className="w-full bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            Mulai Kuis Sekarang <ArrowRight className="w-4 h-4" />
          </button>
          </form>
        </div>
      </div>
    );
  }

  // Step 4: Final Result Card
  if (isFinished) {
    const accuracy = Math.round((correctCount / quiz.questions.length) * 100);

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-gray-200 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6"
        >
          <div className="bg-emerald-100 text-emerald-700 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto text-3xl">
            🎉
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-1">
              QUIZ FINISHED
            </span>
            <h1 className="text-2xl font-black text-gray-900">{nickname}</h1>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Skor</span>
              <span className="text-xl font-black text-purple-700">{totalScore}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Benar</span>
              <span className="text-xl font-black text-emerald-600">{correctCount} / {quiz.questions.length}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Akurasi</span>
              <span className="text-xl font-black text-blue-600">{accuracy}%</span>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleRestart}
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-sm flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Main Lagi
            </button>
            <a
              href="/"
              className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-bold py-3.5 rounded-xl transition-all shadow-sm border border-gray-200 text-sm flex items-center justify-center gap-2"
            >
              Kembali ke Menu
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // Step 2 & 3: Active Question & Feedback
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between p-4 sm:p-8 font-sans">
      {/* Header Info */}
      <header className="max-w-2xl w-full mx-auto flex items-center justify-between pt-2 pb-4 border-b border-gray-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 block">
            {quiz.title}
          </span>
          <span className="text-sm font-black text-gray-900">
            Soal {currentIndex + 1} dari {quiz.questions.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {tabSwitchCount > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-bold animate-pulse">
              ⚠️ Peringatan Tab: {tabSwitchCount}x
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold">
            <Award className="w-4 h-4 text-amber-500" /> {totalScore} Poin
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
            timeLeft <= 5 ? "bg-red-50 text-red-700 border-red-200 animate-pulse" : "bg-blue-50 text-blue-700 border-blue-200"
          }`}>
            <Clock className="w-4 h-4" /> 00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
          </div>
        </div>
      </header>

      {/* Main Question Display */}
      <main className="max-w-2xl w-full mx-auto flex-1 flex flex-col justify-center my-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6"
          >
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-relaxed">
              {currentQ.content}
            </h2>

            {currentQ.attachments && currentQ.attachments.length > 0 && (
              <QuestionAttachments attachments={currentQ.attachments} />
            )}

            {/* Answer Input Options */}
            {!feedback && (
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
                            ? "bg-purple-50 border-purple-600 text-purple-900 shadow-sm ring-1 ring-purple-600"
                            : "bg-gray-50 border-gray-200 text-gray-800 hover:border-gray-300"
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
                              ? "bg-purple-50 border-purple-600 text-purple-900 ring-1 ring-purple-600"
                              : "bg-gray-50 border-gray-200 text-gray-800 hover:border-gray-300"
                          }`}
                        >
                          <span>{opt.text}</span>
                          <span className={`w-5 h-5 rounded border flex items-center justify-center text-xs ${
                            isChecked ? "bg-purple-600 border-purple-600 text-white" : "border-gray-300"
                          }`}>
                            ✓
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentQ.type === "SHORT_ANSWER" && (
                  <div>
                    <input
                      type="text"
                      value={shortAnswerText}
                      onChange={(e) => setShortAnswerText(e.target.value)}
                      placeholder="Ketik jawaban Anda..."
                      className="w-full bg-gray-50 border border-gray-300 rounded-2xl p-4 text-gray-900 font-bold text-sm focus:outline-none focus:border-purple-600 shadow-sm"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Instant Feedback Display */}
            {feedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-6 rounded-2xl border text-left space-y-3 ${
                  feedback.isCorrect
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-red-50 border-red-200 text-red-900"
                }`}
              >
                <div className="flex items-center gap-3 font-extrabold text-base">
                  {feedback.isCorrect ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      <span>Benar! (+{feedback.awardedPoints} Poin)</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-600" />
                      <span>Belum Tepat</span>
                    </>
                  )}
                </div>

                {!feedback.isCorrect && feedback.correctAnswers?.length > 0 && (
                  <p className="text-xs font-semibold text-red-800">
                    Jawaban Benar: <strong>{feedback.correctAnswers.join(", ")}</strong>
                  </p>
                )}

                {feedback.explanation && (
                  <p className="text-xs text-gray-600 bg-white/70 p-3 rounded-xl border border-gray-200/50">
                    💡 <strong>Penjelasan:</strong> {feedback.explanation}
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Actions */}
      <footer className="max-w-2xl w-full mx-auto text-center pb-6">
        {!feedback ? (
          <button
            onClick={handleSubmitAnswer}
            disabled={submitting}
            className="w-full bg-gray-900 hover:bg-gray-800 active:scale-95 text-white font-extrabold text-base py-4 rounded-2xl transition-all shadow-lg disabled:opacity-50"
          >
            {submitting ? "Mengirim Jawaban..." : "KIRIM JAWABAN"}
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            className="w-full bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-extrabold text-base py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {currentIndex + 1 < quiz.questions.length ? "Soal Berikutnya →" : "Lihat Hasil Akhir 🎉"}
          </button>
        )}
      </footer>

      {/* Tab Switch Warning Modal (Anti-Cheat) */}
      {showTabWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="bg-red-100 text-red-600 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto text-3xl">
              ⚠️
            </div>
            <h3 className="text-xl font-extrabold text-gray-900">Peringatan: Berpindah Tab!</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Sistem mendeteksi Anda telah meninggalkan atau berpindah tab kuis ini (Pelanggaran ke-<strong>{tabSwitchCount}</strong>). Tetap berada di halaman kuis selama pengerjaan berlangsung!
            </p>
            <button
              onClick={() => setShowTabWarning(false)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md text-sm"
            >
              Saya Mengerti & Lanjutkan Kuis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
