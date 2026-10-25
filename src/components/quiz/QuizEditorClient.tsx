"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import QRCode from "react-qr-code";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Copy, 
  MoveUp, 
  MoveDown, 
  Sparkles, 
  Eye, 
  CheckCircle2, 
  Globe, 
  Play, 
  X, 
  Check, 
  Clock, 
  Award, 
  HelpCircle,
  BrainCircuit,
  ExternalLink,
  Upload,
  MoreHorizontal,
  ChevronDown,
  Download,
  BarChart2,
  Users
} from "lucide-react";

interface OptionItem {
  id?: string;
  text: string;
  isCorrect: boolean;
}

interface QuestionItem {
  id: string;
  type: "MULTIPLE_CHOICE" | "MULTIPLE_SELECT" | "TRUE_FALSE" | "SHORT_ANSWER" | "LONG_ANSWER";
  content: string;
  explanation: string;
  points: number;
  timeLimit: number;
  scoringType?: "DYNAMIC" | "FIXED";
  position: number;
  options: OptionItem[];
}

interface QuizData {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  mode: "SELF_PACED" | "LIVE";
  questions: QuestionItem[];
}

export function QuizEditorClient({ initialQuiz }: { initialQuiz: QuizData }) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizData>(initialQuiz);
  const [title, setTitle] = useState(initialQuiz.title);
  const [description, setDescription] = useState(initialQuiz.description || "");
  const [mode, setMode] = useState<"SELF_PACED" | "LIVE">(initialQuiz.mode);
  const [questions, setQuestions] = useState<QuestionItem[]>(initialQuiz.questions);

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"SAVED" | "SAVING" | "ERROR">("SAVED");

  // Tools Dropdown Menu
  const [showToolsMenu, setShowToolsMenu] = useState(false);

  // AI Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("Medium");
  const [aiCount, setAiCount] = useState(5);
  const [aiLoading, setAiLoading] = useState(false);

  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotice = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Add Question Card
  const handleAddQuestion = (type: QuestionItem["type"] = "MULTIPLE_CHOICE") => {
    const newQ: QuestionItem = {
      id: `temp-${Date.now()}-${Math.random()}`,
      type,
      content: "",
      explanation: "",
      points: 100,
      timeLimit: 30,
      position: questions.length + 1,
      options: type === "TRUE_FALSE"
        ? [
            { text: "True", isCorrect: true },
            { text: "False", isCorrect: false },
          ]
        : [
            { text: "Opsi 1", isCorrect: true },
            { text: "Opsi 2", isCorrect: false },
            { text: "Opsi 3", isCorrect: false },
            { text: "Opsi 4", isCorrect: false },
          ],
    };
    setQuestions([...questions, newQ]);
  };

  // Duplicate Question
  const handleDuplicate = (index: number) => {
    const target = questions[index];
    const duplicated: QuestionItem = {
      ...JSON.parse(JSON.stringify(target)),
      id: `temp-${Date.now()}-${Math.random()}`,
      position: questions.length + 1,
    };
    const updated = [...questions];
    updated.splice(index + 1, 0, duplicated);
    setQuestions(updated);
  };

  // Delete Question
  const handleDelete = (id: string) => {
    if (confirm("Hapus soal kuis ini?")) {
      setQuestions(questions.filter((q) => q.id !== id));
    }
  };

  // Reorder
  const handleMove = (index: number, direction: "UP" | "DOWN") => {
    if (direction === "UP" && index === 0) return;
    if (direction === "DOWN" && index === questions.length - 1) return;

    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    const updated = [...questions];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setQuestions(updated);
  };

  // Option Updates
  const handleOptionChange = (qId: string, optIndex: number, text: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: q.options.map((opt, i) =>
                i === optIndex ? { ...opt, text } : opt
              ),
            }
          : q
      )
    );
  };

  const handleToggleCorrect = (qId: string, optIndex: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id !== qId) return q;

        if (q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") {
          // Single correct answer
          return {
            ...q,
            options: q.options.map((opt, i) => ({
              ...opt,
              isCorrect: i === optIndex,
            })),
          };
        } else {
          // Multiple select toggle
          return {
            ...q,
            options: q.options.map((opt, i) =>
              i === optIndex ? { ...opt, isCorrect: !opt.isCorrect } : opt
            ),
          };
        }
      })
    );
  };

  const handleAddOption = (qId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: [...q.options, { text: `Opsi ${q.options.length + 1}`, isCorrect: false }],
            }
          : q
      )
    );
  };

  const handleRemoveOption = (qId: string, optIndex: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: q.options.filter((_, i) => i !== optIndex),
            }
          : q
      )
    );
  };

  // AI Generator Submit
  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic,
          difficulty: aiDifficulty,
          count: aiCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI generation failed");

      const generatedQuestions: QuestionItem[] = data.questions.map((gQ: any, idx: number) => ({
        id: `temp-ai-${Date.now()}-${idx}`,
        type: gQ.type || "MULTIPLE_CHOICE",
        content: gQ.content,
        explanation: gQ.explanation || "",
        points: gQ.points || 100,
        timeLimit: gQ.timeLimit || 30,
        position: questions.length + idx + 1,
        options: gQ.options || [],
      }));

      setQuestions([...questions, ...generatedQuestions]);
      setShowAiModal(false);
      setAiTopic("");
      showNotice(`Berhasil membuat ${generatedQuestions.length} soal dengan AI! Status: Draft.`);
    } catch (err: any) {
      showNotice(err.message, "error");
    } finally {
      setAiLoading(false);
    }
  };

  // Save Quiz
  const handleSave = async (showNotification = true) => {
    setSaving(true);
    setSaveStatus("SAVING");

    try {
      const res = await fetch(`/api/quizzes/${quiz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          mode,
          questions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan quiz");

      setSaveStatus("SAVED");
      if (showNotification) showNotice("Quiz berhasil disimpan!");
    } catch (err: any) {
      setSaveStatus("ERROR");
      if (showNotification) showNotice(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Publish Quiz
  const handlePublish = async () => {
    await handleSave(false);

    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/publish`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal publish quiz");

      setQuiz({ ...quiz, status: "PUBLISHED" });
      showNotice("Quiz berhasil DIPUBLIKASIKAN!");
      router.refresh();
    } catch (err: any) {
      showNotice(err.message, "error");
    }
  };

  // Start Live Session
  const handleStartLiveSession = async () => {
    await handleSave(false);

    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/sessions`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memulai live session");

      router.push(`/author/sessions/${data.session.id}`);
    } catch (err: any) {
      showNotice(err.message, "error");
    }
  };

  // Duplicate Quiz
  const handleDuplicateQuiz = async () => {
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal duplikasi quiz");

      showNotice("Quiz berhasil diduplikasi!");
      router.push(`/author/quizzes/${data.quiz.id}`);
    } catch (err: any) {
      showNotice(err.message, "error");
    }
  };

  // Import CSV Massal
  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length <= 1) throw new Error("File CSV kosong atau format tidak sesuai.");

        const importedQuestions: QuestionItem[] = [];
        // Skip header if contains 'soal' or 'question'
        const startIndex = lines[0].toLowerCase().includes("soal") || lines[0].toLowerCase().includes("content") ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim());
          if (!cols[0]) continue;

          const content = cols[0];
          const optA = cols[1] || "Opsi A";
          const optB = cols[2] || "Opsi B";
          const optC = cols[3] || "Opsi C";
          const optD = cols[4] || "Opsi D";
          const correctKey = (cols[5] || "A").toUpperCase();
          const explanation = cols[6] || "";

          importedQuestions.push({
            id: `temp-csv-${Date.now()}-${i}`,
            type: "MULTIPLE_CHOICE",
            content,
            explanation,
            points: 100,
            timeLimit: 30,
            position: questions.length + importedQuestions.length + 1,
            options: [
              { text: optA, isCorrect: correctKey.includes("A") || correctKey.includes(optA) },
              { text: optB, isCorrect: correctKey.includes("B") || correctKey.includes(optB) },
              { text: optC, isCorrect: correctKey.includes("C") || correctKey.includes(optC) },
              { text: optD, isCorrect: correctKey.includes("D") || correctKey.includes(optD) },
            ],
          });
        }

        if (importedQuestions.length === 0) throw new Error("Tidak ada soal valid yang berhasil diurai.");

        setQuestions((prev) => [...prev, ...importedQuestions]);
        showNotice(`Berhasil mengimpor ${importedQuestions.length} soal dari file CSV!`);
      } catch (err: any) {
        showNotice(err.message || "Gagal mengimpor file CSV", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Download Sample CSV Template
  const handleDownloadSampleCsv = () => {
    const csvContent = [
      "Soal,Opsi A,Opsi B,Opsi C,Opsi D,Jawaban Benar,Penjelasan",
      '"Ibu kota negara Indonesia adalah...","Jakarta","Nusantara","Bandung","Surabaya","B","Nusantara adalah ibu kota baru RI."',
      '"Hardware yang berfungsi sebagai otak komputer adalah...","RAM","GPU","CPU","Power Supply","C","CPU (Central Processing Unit) memproses instruksi komputer."',
      '"Apa kepanjangan dari HTML?","Hypertext Markup Language","High Tech Modern Language","Hyper Transfer Main Logic","Home Tool Markup Language","A","HTML adalah bahasa standar penulisan web."',
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "template_soal_kuis.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/quiz/${quiz.slug}` : `/quiz/${quiz.slug}`;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-20 md:top-6 right-4 sm:right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-3 transition-all ${
          notification.type === "success" 
            ? "bg-gray-900 text-white border-gray-800" 
            : "bg-red-600 text-white border-red-700"
        }`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Editor Header Bar */}
      <header className="sticky top-14 lg:top-0 z-30 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/author/quizzes" className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">{title || "Untitled Quiz"}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                quiz.status === "PUBLISHED" 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
                {quiz.status}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium">Total: {questions.length} Soal Interaktif</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* AI Generate Button */}
          <button
            onClick={() => setShowAiModal(true)}
            className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-purple-600" /> ✨ AI Generate
          </button>

          {/* Save Draft Button */}
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>

          {/* Primary Action Button: Start Live Game */}
          <button
            onClick={handleStartLiveSession}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md active:scale-95"
            title="Mulai Live Game Kelas (Barengan)"
          >
            <Play className="w-4 h-4 fill-white" /> Start Live Game
          </button>

          {/* Dropdown Menu for More Actions */}
          <div className="relative">
            <button
              onClick={() => setShowToolsMenu(!showToolsMenu)}
              className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
            >
              <MoreHorizontal className="w-4 h-4" />
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {showToolsMenu && (
              <div 
                className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setShowToolsMenu(false)}
              >
                <label className="px-4 py-2.5 hover:bg-gray-50 text-gray-800 text-xs font-semibold flex items-center gap-2.5 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-emerald-600" /> Import Excel/CSV
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleImportCsv}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={handleDownloadSampleCsv}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-800 text-xs font-semibold flex items-center gap-2.5 transition-colors"
                >
                  <Download className="w-4 h-4 text-blue-600" /> Unduh Template CSV
                </button>

                <button
                  onClick={handleDuplicateQuiz}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-800 text-xs font-semibold flex items-center gap-2.5 transition-colors"
                >
                  <Copy className="w-4 h-4 text-purple-600" /> Duplikasi Kuis (Clone)
                </button>

                <Link
                  href={`/author/quizzes/${quiz.id}/analytics`}
                  className="px-4 py-2.5 hover:bg-gray-50 text-purple-700 text-xs font-bold flex items-center gap-2.5 transition-colors border-t border-gray-100"
                >
                  <BarChart2 className="w-4 h-4 text-purple-600" /> 📊 Rekap Nilai & Analisis Peserta
                </Link>

                {quiz.status === "PUBLISHED" && (
                  <a
                    href={`/quiz/${quiz.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 hover:bg-gray-50 text-emerald-700 text-xs font-bold flex items-center gap-2.5 transition-colors border-t border-gray-100"
                  >
                    <ExternalLink className="w-4 h-4 text-emerald-600" /> Link Kuis Mandiri
                  </a>
                )}

                {quiz.status !== "PUBLISHED" && (
                  <button
                    onClick={handlePublish}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-indigo-700 text-xs font-bold flex items-center gap-2.5 transition-colors border-t border-gray-100"
                  >
                    <Globe className="w-4 h-4 text-indigo-600" /> Publish Quiz
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        
        {/* Public Share Banner (If Published) */}
        {quiz.status === "PUBLISHED" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="bg-white p-2 rounded-xl shadow-sm border border-emerald-100">
                <QRCode value={publicUrl} size={64} className="rounded-md" />
              </div>
              <div>
                <h4 className="text-emerald-900 font-bold text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Quiz is Live!
                </h4>
                <p className="text-emerald-700 text-xs mt-0.5 break-all">
                  {publicUrl}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(publicUrl);
                  showNotice("Public link berhasil disalin!");
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              >
                Copy Link
              </button>
              <a
                href={`/quiz/${quiz.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" /> Open
              </a>
            </div>
          </div>
        )}

        {/* Title & Mode Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Judul Quiz
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xl font-bold text-gray-900 border-b border-transparent hover:border-gray-200 focus:border-gray-900 focus:outline-none py-1 transition-colors"
              placeholder="Masukkan judul kuis..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Deskripsi Kuis
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full text-sm text-gray-600 border-b border-transparent hover:border-gray-200 focus:border-gray-900 focus:outline-none py-1 transition-colors resize-none"
              placeholder="Tuliskan petunjuk kuis..."
            />
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Mode Default Permainan:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode("SELF_PACED")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  mode === "SELF_PACED" ? "bg-gray-900 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                🎮 Self-Paced
              </button>
              <button
                type="button"
                onClick={() => setMode("LIVE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  mode === "LIVE" ? "bg-purple-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                ⚡ Live Game
              </button>
            </div>
          </div>
        </div>

        {/* Question Cards Stack */}
        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={q.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              {/* Card Header Toolbar */}
              <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-gray-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-purple-600 text-white text-xs font-extrabold px-2.5 py-1 rounded-lg shadow-sm">
                    Soal {index + 1}
                  </span>
                  
                  {/* Select Question Type */}
                  <select
                    value={q.type}
                    onChange={(e) => {
                      const newType = e.target.value as QuestionItem["type"];
                      setQuestions(
                        questions.map((item) =>
                          item.id === q.id ? { ...item, type: newType } : item
                        )
                      );
                    }}
                    className="bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 px-3 py-1.5 focus:outline-none focus:border-purple-600 transition-colors"
                  >
                    <option value="MULTIPLE_CHOICE">○ Pilihan Ganda</option>
                    <option value="MULTIPLE_SELECT">☐ Centang Banyak</option>
                    <option value="TRUE_FALSE">✓/✕ True / False</option>
                    <option value="SHORT_ANSWER">✏️ Isian Singkat</option>
                    <option value="LONG_ANSWER">📄 Essay / Review</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2 ml-auto">
                  {/* Points Selector */}
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg text-xs font-medium">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <select
                      value={q.points}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setQuestions(questions.map(item => item.id === q.id ? { ...item, points: val } : item));
                      }}
                      className="bg-transparent text-gray-900 font-bold focus:outline-none cursor-pointer"
                    >
                      <option value={50}>50 Poin</option>
                      <option value={100}>100 Poin</option>
                      <option value={200}>200 Poin</option>
                    </select>
                  </div>

                  {/* Scoring Rule Selector */}
                  <div className="flex items-center gap-1 bg-purple-50 border border-purple-200 px-2 py-1 rounded-lg text-xs font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <select
                      value={q.scoringType || "DYNAMIC"}
                      onChange={(e) => {
                        const val = e.target.value as "DYNAMIC" | "FIXED";
                        setQuestions(questions.map(item => item.id === q.id ? { ...item, scoringType: val } : item));
                      }}
                      className="bg-transparent text-purple-900 font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="DYNAMIC">⚡ Dynamic Speed Bonus</option>
                      <option value="FIXED">🎯 Fixed Point</option>
                    </select>
                  </div>

                  {/* Reorder / Duplicate / Delete Actions */}
                  <div className="flex items-center gap-0.5 pl-1 border-l border-gray-200">
                    <button onClick={() => handleMove(index, "UP")} disabled={index === 0} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-30 transition-colors" title="Naikkan">
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleMove(index, "DOWN")} disabled={index === questions.length - 1} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-30 transition-colors" title="Turunkan">
                      <MoveDown className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDuplicate(index)} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors" title="Duplikasi">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(q.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Hapus">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Question Content Input */}
              <div>
                <textarea
                  value={q.content}
                  onChange={(e) => {
                    const text = e.target.value;
                    setQuestions(questions.map(item => item.id === q.id ? { ...item, content: text } : item));
                  }}
                  rows={2}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-gray-900 text-sm focus:outline-none focus:border-gray-900 font-medium"
                  placeholder="Tuliskan pertanyaan kuis di sini..."
                />
              </div>

              {/* Options Editor Section based on Type */}
              {(q.type === "MULTIPLE_CHOICE" || q.type === "MULTIPLE_SELECT" || q.type === "TRUE_FALSE") && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                    Pilihan Jawaban (Centang hijau = Jawaban Benar)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((opt, optIdx) => (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                          opt.isCorrect 
                            ? "bg-emerald-50 border-emerald-300 text-emerald-900" 
                            : "bg-gray-50 border-gray-200 text-gray-700"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleCorrect(q.id, optIdx)}
                          className={`w-6 h-6 rounded-md flex items-center justify-center border font-bold text-xs transition-colors ${
                            opt.isCorrect
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "bg-white border-gray-300 text-transparent hover:border-emerald-500"
                          }`}
                        >
                          ✓
                        </button>

                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleOptionChange(q.id, optIdx, e.target.value)}
                          className="w-full bg-transparent border-b border-transparent focus:border-gray-900 focus:outline-none text-sm font-medium px-1"
                          placeholder={`Pilihan ${optIdx + 1}`}
                        />

                        {q.type !== "TRUE_FALSE" && q.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(q.id, optIdx)}
                            className="text-gray-400 hover:text-red-600 p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {q.type !== "TRUE_FALSE" && (
                    <button
                      type="button"
                      onClick={() => handleAddOption(q.id)}
                      className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1 pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Tambah Pilihan Jawaban
                    </button>
                  )}
                </div>
              )}

              {/* Short Answer Editor */}
              {q.type === "SHORT_ANSWER" && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                    Kunci Jawaban Singkat (Case-Insensitive String Matching)
                  </span>
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleOptionChange(q.id, optIdx, e.target.value)}
                        className="w-full bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm text-emerald-900 font-bold focus:outline-none"
                        placeholder="Masukkan teks jawaban yang diterima..."
                      />
                      {q.options.length > 1 && (
                        <button onClick={() => handleRemoveOption(q.id, optIdx)} className="text-gray-400 hover:text-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddOption(q.id)}
                    className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1 pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Tambah Alternatif Jawaban Singkat
                  </button>
                </div>
              )}

              {/* Explanation Input */}
              <div className="pt-2 border-t border-gray-100">
                <input
                  type="text"
                  value={q.explanation}
                  onChange={(e) => {
                    const text = e.target.value;
                    setQuestions(questions.map(item => item.id === q.id ? { ...item, explanation: text } : item));
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-gray-900"
                  placeholder="Tambahkan penjelasan / pembahasan jawaban (Opsional)..."
                />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Add Question Button */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => handleAddQuestion("MULTIPLE_CHOICE")}
            className="flex-1 py-3.5 border-2 border-dashed border-gray-300 hover:border-gray-900 rounded-2xl text-gray-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors bg-white"
          >
            <Plus className="w-4 h-4" /> + Multiple Choice
          </button>

          <button
            onClick={() => handleAddQuestion("MULTIPLE_SELECT")}
            className="flex-1 py-3.5 border-2 border-dashed border-gray-300 hover:border-gray-900 rounded-2xl text-gray-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors bg-white"
          >
            <Plus className="w-4 h-4" /> + Multiple Select
          </button>

          <button
            onClick={() => handleAddQuestion("TRUE_FALSE")}
            className="flex-1 py-3.5 border-2 border-dashed border-gray-300 hover:border-gray-900 rounded-2xl text-gray-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors bg-white"
          >
            <Plus className="w-4 h-4" /> + True / False
          </button>
        </div>
      </div>

      {/* AI Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" /> ✨ AI Question Generator (Gemini)
              </h3>
              <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Topik Kuis</label>
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Contoh: Jaringan Komputer & HTTP"
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-purple-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tingkat Kesulitan</label>
                <select
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900"
                >
                  <option value="Easy">Easy (Mudah)</option>
                  <option value="Medium">Medium (Sedang)</option>
                  <option value="Hard">Hard (Sukar)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Jumlah Soal</label>
                <select
                  value={aiCount}
                  onChange={(e) => setAiCount(parseInt(e.target.value))}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900"
                >
                  <option value={3}>3 Soal</option>
                  <option value={5}>5 Soal</option>
                  <option value={10}>10 Soal</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleAiGenerate}
                disabled={aiLoading || !aiTopic.trim()}
                className="px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {aiLoading ? "Generating..." : "Generate Soal AI"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

