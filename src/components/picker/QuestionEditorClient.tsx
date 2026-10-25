"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import QRCode from "react-qr-code";
import { z } from "zod";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Copy, 
  MoveUp, 
  MoveDown, 
  Link as LinkIcon, 
  Eye, 
  CheckCircle2, 
  Globe, 
  Settings, 
  Upload, 
  Video as VideoIcon, 
  FileText, 
  ExternalLink,
  Sparkles,
  X
} from "lucide-react";

interface Attachment {
  id?: string;
  type: "IMAGE" | "VIDEO" | "FILE";
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
}

interface QuestionLinkItem {
  id?: string;
  title: string;
  url: string;
}

interface OptionItem {
  text: string;
  isCorrect: boolean;
}

type PickerQuestionType = "MULTIPLE_CHOICE" | "MULTIPLE_SELECT" | "LONG_ANSWER";

const QUESTION_TYPE_OPTIONS: { value: PickerQuestionType; label: string }[] = [
  { value: "MULTIPLE_CHOICE", label: "○ Pilihan Ganda" },
  { value: "MULTIPLE_SELECT", label: "☐ Pilihan Ganda (Multi Jawaban)" },
  { value: "LONG_ANSWER", label: "📄 Essay / Uraian" },
];

interface QuestionItem {
  id: string;
  type: PickerQuestionType;
  content: string;
  explanation: string;
  position: number;
  isActive: boolean;
  options: OptionItem[];
  attachments: Attachment[];
  links: QuestionLinkItem[];
}

interface SettingsItem {
  allowRepeat: boolean;
  preventImmediateRepeat: boolean;
  noRepeatUntilAllShown: boolean;
  showQuestionNumber: boolean;
  showAttachments: boolean;
  showLinks: boolean;
}

interface PickerData {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  settings: SettingsItem;
  questions: QuestionItem[];
}

const aiResponseSchema = z.object({
  questions: z.array(
    z.object({
      content: z.string(),
      options: z
        .array(z.object({ text: z.string(), isCorrect: z.boolean().optional() }))
        .default([]),
    })
  ),
});

export function QuestionEditorClient({ initialPicker }: { initialPicker: PickerData }) {
  const router = useRouter();
  const [picker, setPicker] = useState<PickerData>(initialPicker);
  const [questions, setQuestions] = useState<QuestionItem[]>(initialPicker.questions);
  const [title, setTitle] = useState(initialPicker.title);
  const [description, setDescription] = useState(initialPicker.description || "");
  const [settings, setSettings] = useState<SettingsItem>(initialPicker.settings);

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"SAVED" | "SAVING" | "ERROR">("SAVED");

  // Modals state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [activeLinkQuestionId, setActiveLinkQuestionId] = useState<string | null>(null);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [uploadingForQuestionId, setUploadingForQuestionId] = useState<string | null>(null);

  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // AI Modal states
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("Medium");
  const [aiCount, setAiCount] = useState(5);
  const [aiLoading, setAiLoading] = useState(false);

  const showNotice = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

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
      if (!res.ok) throw new Error(data.error || "Gagal membuat soal AI");

      const parsed = aiResponseSchema.parse(data);

      const generatedQuestions: QuestionItem[] = parsed.questions.map((gQ, idx) => ({
        id: `temp-ai-${Date.now()}-${idx}`,
        type: "MULTIPLE_CHOICE" as PickerQuestionType,
        content: gQ.content,
        explanation: "",
        position: questions.length + idx + 1,
        isActive: true,
        options: gQ.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect === true })),
        attachments: [],
        links: [],
      }));

      setQuestions([...questions, ...generatedQuestions]);
      setShowAiModal(false);
      setAiTopic("");
      showNotice(`Berhasil membuat ${generatedQuestions.length} soal acak dengan AI! Jangan lupa Simpan Perubahan.`);
    } catch (err) {
      showNotice(err instanceof Error ? err.message : "Terjadi kesalahan", "error");
    } finally {
      setAiLoading(false);
    }
  };

  // Add question card
  const handleAddQuestion = () => {
    const newQuestion: QuestionItem = {
      id: `temp-${Date.now()}-${Math.random()}`,
      type: "MULTIPLE_CHOICE",
      content: "",
      explanation: "",
      position: questions.length + 1,
      isActive: true,
      options: [
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
      ],
      attachments: [],
      links: [],
    };
    setQuestions([...questions, newQuestion]);
  };

  // Option handlers (single correct answer per question)
  const handleOptionChange = (questionId: string, optionIndex: number, text: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, i) => (i === optionIndex ? { ...opt, text } : opt)),
            }
          : q
      )
    );
  };

  const handleToggleCorrect = (questionId: string, optionIndex: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id !== questionId) return q;
        // Single-answer types keep exactly one correct option; multi-select toggles.
        if (q.type === "MULTIPLE_SELECT") {
          return {
            ...q,
            options: q.options.map((opt, i) =>
              i === optionIndex ? { ...opt, isCorrect: !opt.isCorrect } : opt
            ),
          };
        }
        return {
          ...q,
          options: q.options.map((opt, i) => ({ ...opt, isCorrect: i === optionIndex })),
        };
      })
    );
  };

  const handleChangeType = (questionId: string, type: PickerQuestionType) => {
    setQuestions(
      questions.map((q) => {
        if (q.id !== questionId) return q;
        if (type === "LONG_ANSWER") {
          return { ...q, type, options: [] };
        }
        if (q.options.length === 0) {
          return {
            ...q,
            type,
            options: [
              { text: "", isCorrect: true },
              { text: "", isCorrect: false },
            ],
          };
        }
        if (type === "MULTIPLE_CHOICE") {
          const firstCorrect = q.options.findIndex((o) => o.isCorrect);
          return {
            ...q,
            type,
            options: q.options.map((o, i) => ({ ...o, isCorrect: i === (firstCorrect === -1 ? 0 : firstCorrect) })),
          };
        }
        return { ...q, type };
      })
    );
  };

  const handleAddOption = (questionId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: [...q.options, { text: "", isCorrect: q.options.length === 0 }],
            }
          : q
      )
    );
  };

  const handleRemoveOption = (questionId: string, optionIndex: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id !== questionId) return q;
        const removed = q.options[optionIndex];
        const remaining = q.options.filter((_, i) => i !== optionIndex);
        // Keep exactly one correct answer when the correct row is deleted.
        if (removed.isCorrect && remaining.length > 0) {
          remaining[0] = { ...remaining[0], isCorrect: true };
        }
        return { ...q, options: remaining };
      })
    );
  };

  // Duplicate question
  const handleDuplicateQuestion = (index: number) => {
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

  // Delete question
  const handleDeleteQuestion = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus soal ini?")) {
      setQuestions(questions.filter((q) => q.id !== id));
    }
  };

  // Reorder questions
  const handleMove = (index: number, direction: "UP" | "DOWN") => {
    if (direction === "UP" && index === 0) return;
    if (direction === "DOWN" && index === questions.length - 1) return;

    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    const updated = [...questions];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setQuestions(updated);
  };

  // File Upload Handler
  const handleFileUpload = async (questionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingForQuestionId(questionId);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah file");

      const newAttachment: Attachment = {
        type: data.type,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
      };

      setQuestions(
        questions.map((q) =>
          q.id === questionId
            ? { ...q, attachments: [...q.attachments, newAttachment] }
            : q
        )
      );
      showNotice("File berhasil diunggah!");
    } catch (err) {
      showNotice(err instanceof Error ? err.message : "Terjadi kesalahan", "error");
    } finally {
      setUploadingForQuestionId(null);
    }
  };

  // Add Link Handler
  const handleAddLink = () => {
    if (!activeLinkQuestionId || !linkUrl.trim()) return;

    let formattedUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const newLink: QuestionLinkItem = {
      title: linkTitle.trim() || formattedUrl,
      url: formattedUrl,
    };

    setQuestions(
      questions.map((q) =>
        q.id === activeLinkQuestionId
          ? { ...q, links: [...q.links, newLink] }
          : q
      )
    );

    setActiveLinkQuestionId(null);
    setLinkTitle("");
    setLinkUrl("");
  };

  // Remove Link
  const handleRemoveLink = (questionId: string, index: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? { ...q, links: q.links.filter((_, i) => i !== index) }
          : q
      )
    );
  };

  // Remove Attachment
  const handleRemoveAttachment = (questionId: string, index: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? { ...q, attachments: q.attachments.filter((_, i) => i !== index) }
          : q
      )
    );
  };

  // Save All Changes (Auto / Manual)
  const handleSave = async (showNotification = true) => {
    setSaving(true);
    setSaveStatus("SAVING");

    try {
      const res = await fetch(`/api/pickers/${picker.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          settings,
          questions: questions.map((q, idx) => ({
            ...q,
            position: idx + 1,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan perubahan");

      setSaveStatus("SAVED");
      if (showNotification) showNotice("Perubahan berhasil disimpan!");
    } catch (err) {
      setSaveStatus("ERROR");
      if (showNotification) showNotice(err instanceof Error ? err.message : "Gagal menyimpan", "error");
    } finally {
      setSaving(false);
    }
  };

  // Publish Handler
  const handlePublish = async () => {
    await handleSave(false);

    try {
      const res = await fetch(`/api/pickers/${picker.id}/publish`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mempublikasikan");

      setPicker({ ...picker, status: "PUBLISHED" });
      setShowPublishModal(false);
      showNotice("Random Picker berhasil LIVE!");
      router.refresh();
    } catch (err) {
      showNotice(err instanceof Error ? err.message : "Terjadi kesalahan", "error");
    }
  };

  // Unpublish Handler
  const handleUnpublish = async () => {
    try {
      const res = await fetch(`/api/pickers/${picker.id}/unpublish`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Gagal unpublish");

      setPicker({ ...picker, status: "DRAFT" });
      showNotice("Status picker diubah menjadi DRAFT");
      router.refresh();
    } catch (err) {
      showNotice(err instanceof Error ? err.message : "Terjadi kesalahan", "error");
    }
  };

  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/p/${picker.slug}` : `/p/${picker.slug}`;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
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
      <header className="sticky top-14 lg:top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/author/pickers"
              aria-label="Kembali ke daftar picker"
              className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight truncate">
                  {title || "Untitled Picker"}
                </h1>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                    picker.status === "PUBLISHED"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {picker.status}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5 flex items-center gap-1.5">
                <span>{questions.length} card soal</span>
                <span aria-hidden="true">·</span>
                <span
                  className={
                    saveStatus === "ERROR"
                      ? "text-red-500 font-semibold"
                      : saveStatus === "SAVING"
                        ? "text-amber-600 font-semibold"
                        : "text-emerald-600 font-semibold"
                  }
                >
                  {saveStatus === "SAVING" ? "Menyimpan…" : saveStatus === "SAVED" ? "Tersimpan" : "Gagal menyimpan"}
                </span>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAiModal(true)}
              className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Generate soal otomatis dengan Gemini AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" /> AI
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              aria-label="Setelan pengacakan & tampilan"
              className="px-3 py-2 text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              title="Setelan pengacakan & tampilan"
            >
              <Settings className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Setelan</span>
            </button>

            <Link
              href={`/author/pickers/${picker.id}/preview`}
              aria-label="Pratinjau tampilan peserta"
              className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              title="Pratinjau tampilan peserta"
            >
              <Eye className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Preview</span>
            </Link>

            <div className="w-px h-6 bg-gray-200 shrink-0" aria-hidden="true" />

            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
            >
              {saving ? "Menyimpan…" : "Simpan"}
            </button>

            {picker.status === "PUBLISHED" ? (
              <button
                onClick={handleUnpublish}
                className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                Unpublish
              </button>
            ) : (
              <button
                onClick={() => setShowPublishModal(true)}
                className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Globe className="w-3.5 h-3.5" /> Publish
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Title & Description Edit Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Judul Picker
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xl font-bold text-gray-900 border-b border-transparent hover:border-gray-200 focus:border-gray-900 focus:outline-none py-1 transition-colors"
              placeholder="Masukkan judul..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Deskripsi / Petunjuk untuk Pengguna
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full text-sm text-gray-600 border-b border-transparent hover:border-gray-200 focus:border-gray-900 focus:outline-none py-1 transition-colors resize-none"
              placeholder="Tuliskan petunjuk untuk pengguna..."
            />
          </div>
        </div>

        {/* Public Share Banner (If Published) */}
        {picker.status === "PUBLISHED" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="bg-white p-2 rounded-xl shadow-sm border border-emerald-100">
                <QRCode value={publicUrl} size={64} className="rounded-md" />
              </div>
              <div>
                <h4 className="text-emerald-900 font-bold text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Random Picker is Live!
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
                href={`/p/${picker.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" /> Open
              </a>
            </div>
          </div>
        )}

        {/* Question Cards Stack (Section J Format) */}
        <div className="space-y-6">
          {questions.map((q, index) => (
            <div
              key={q.id}
              className={`bg-white border rounded-2xl p-6 shadow-sm transition-all relative ${
                !q.isActive ? "opacity-60 bg-gray-50 border-gray-200" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Card Header Toolbar */}
              <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-gray-900 text-white text-xs font-bold px-2.5 py-1 rounded-md">
                    Soal {index + 1}
                  </span>
                  <select
                    value={q.type}
                    onChange={(e) => handleChangeType(q.id, e.target.value as PickerQuestionType)}
                    className="bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 px-2.5 py-1 focus:outline-none focus:border-gray-900 transition-colors"
                    title="Tipe soal"
                  >
                    {QUESTION_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {!q.isActive && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">
                      Disabled
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {/* Active Toggle */}
                  <button
                    onClick={() => {
                      setQuestions(
                        questions.map((item) =>
                          item.id === q.id ? { ...item, isActive: !item.isActive } : item
                        )
                      );
                    }}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                      q.isActive
                        ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                        : "text-gray-500 bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {q.isActive ? "Active" : "Enable"}
                  </button>

                  {/* Reorder Buttons */}
                  <button
                    onClick={() => handleMove(index, "UP")}
                    disabled={index === 0}
                    className="p-1.5 text-gray-400 hover:text-gray-800 disabled:opacity-30 rounded hover:bg-gray-100"
                    title="Pindahkan Ke Atas"
                  >
                    <MoveUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMove(index, "DOWN")}
                    disabled={index === questions.length - 1}
                    className="p-1.5 text-gray-400 hover:text-gray-800 disabled:opacity-30 rounded hover:bg-gray-100"
                    title="Pindahkan Ke Bawah"
                  >
                    <MoveDown className="w-4 h-4" />
                  </button>

                  {/* Duplicate Button */}
                  <button
                    onClick={() => handleDuplicateQuestion(index)}
                    className="p-1.5 text-gray-400 hover:text-gray-800 rounded hover:bg-gray-100"
                    title="Duplikasi Soal"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                    title="Hapus Soal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Textarea */}
              <div className="mb-4">
                <textarea
                  value={q.content}
                  onChange={(e) => {
                    const text = e.target.value;
                    setQuestions(
                      questions.map((item) =>
                        item.id === q.id ? { ...item, content: text } : item
                      )
                    );
                  }}
                  rows={3}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-gray-900 text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors shadow-sm"
                  placeholder="Tuliskan pertanyaan di sini..."
                />
              </div>

              {/* Options Editor — hidden for essay questions */}
              {q.type !== "LONG_ANSWER" && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Pilihan Jawaban ({q.options.length} opsi)
                  </span>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    {q.type === "MULTIPLE_SELECT"
                      ? "Klik huruf untuk menandai semua jawaban benar"
                      : "Klik huruf untuk menandai jawaban benar"}
                  </span>
                </div>

                {q.options.length === 0 ? (
                  <p className="text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-3">
                    Belum ada pilihan. Tambahkan opsi agar soal bisa dijawab seperti pilihan ganda.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                          opt.isCorrect
                            ? "bg-emerald-50 border-emerald-300"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleCorrect(q.id, optIdx)}
                          title={opt.isCorrect ? "Jawaban benar" : "Tandai sebagai jawaban benar"}
                          className={`w-7 h-7 shrink-0 rounded-lg border font-extrabold text-xs transition-colors ${
                            opt.isCorrect
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "bg-white border-gray-300 text-gray-500 hover:border-emerald-500 hover:text-emerald-600"
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </button>

                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleOptionChange(q.id, optIdx, e.target.value)}
                          placeholder={`Pilihan ${String.fromCharCode(65 + optIdx)}`}
                          className="w-full bg-transparent border-b border-transparent focus:border-gray-900 focus:outline-none text-sm font-medium text-gray-900 py-1"
                        />

                        <button
                          type="button"
                          onClick={() => handleRemoveOption(q.id, optIdx)}
                          className="text-gray-400 hover:text-red-600 p-1 shrink-0"
                          title="Hapus pilihan"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleAddOption(q.id)}
                  className="mt-2 text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> + Tambah Pilihan
                </button>
              </div>
              )}

              {q.type === "LONG_ANSWER" && (
                <p className="mb-4 text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-3">
                  Soal essay tidak punya kunci jawaban otomatis — siswa menjawab dengan menulis uraian, lalu
                  mencocokkan sendiri dengan pembahasan.
                </p>
              )}

              {/* Question Attachments List */}
              {q.attachments.length > 0 && (
                <div className="mb-4 space-y-2">
                  {q.attachments.map((att, attIdx) => (
                    <div key={attIdx} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {att.type === "IMAGE" ? (
                          <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                            <img
                              src={att.fileUrl}
                              alt={att.fileName}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200 bg-white"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                console.error("Gagal memuat gambar:", att.fileUrl, att.fileName);
                              }}
                            />
                          </a>
                        ) : att.type === "VIDEO" ? (
                          <VideoIcon className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        )}
                        <span className="truncate font-medium text-gray-700 text-xs">{att.fileName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:underline font-medium"
                        >
                          Lihat
                        </a>
                        <button
                          onClick={() => handleRemoveAttachment(q.id, attIdx)}
                          className="text-gray-400 hover:text-red-600 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Question Links List */}
              {q.links.length > 0 && (
                <div className="mb-4 space-y-2">
                  {q.links.map((link, linkIdx) => (
                    <div key={linkIdx} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <LinkIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="truncate font-medium text-gray-800 text-xs">{link.title}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:underline font-medium flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> Buka
                        </a>
                        <button
                          onClick={() => handleRemoveLink(q.id, linkIdx)}
                          className="text-gray-400 hover:text-red-600 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Explanation / Pembahasan (also the essay reference answer) */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  {q.type === "LONG_ANSWER" ? "Pembahasan / Kunci Uraian (Opsional)" : "Pembahasan (Opsional)"}
                </label>
                <textarea
                  value={q.explanation}
                  onChange={(e) => {
                    const text = e.target.value;
                    setQuestions(
                      questions.map((item) =>
                        item.id === q.id ? { ...item, explanation: text } : item
                      )
                    );
                  }}
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-700 text-xs focus:outline-none focus:border-gray-900 transition-colors"
                  placeholder="Tampil setelah siswa menjawab..."
                />
              </div>

              {/* Action Toolbar (Section J Format: [+ File] [+ Link]) */}
              <div className="flex items-center gap-3 pt-3 border-t border-gray-100 text-xs">
                <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingForQuestionId === q.id ? "Uploading..." : "+ File / Media"}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileUpload(q.id, e)}
                    disabled={uploadingForQuestionId === q.id}
                  />
                </label>

                <button
                  onClick={() => setActiveLinkQuestionId(q.id)}
                  className="bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1.5"
                >
                  <LinkIcon className="w-3.5 h-3.5" /> + Link
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Add Question Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleAddQuestion}
            className="flex-1 py-4 border-2 border-dashed border-gray-300 hover:border-gray-900 rounded-2xl text-gray-600 hover:text-gray-900 font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 bg-white hover:bg-gray-50 shadow-sm"
          >
            <Plus className="w-5 h-5" /> + Tambah Soal Manual
          </button>
          <button
            onClick={() => setShowAiModal(true)}
            className="flex-1 py-4 border-2 border-dashed border-purple-300 hover:border-purple-600 rounded-2xl text-purple-700 font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 bg-purple-50 hover:bg-purple-100 shadow-sm"
          >
            <Sparkles className="w-5 h-5 text-purple-600" /> ✨ Generate Soal dengan AI
          </button>
        </div>
      </div>

      {/* AI Question Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2 text-purple-700">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-extrabold text-gray-900 text-lg">AI Question Generator</h3>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Topik / Pokok Bahasan Soal
                </label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Contoh: Dasar Algoritma & Struktur Data"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 font-medium focus:outline-none focus:border-purple-600 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Tingkat Kesulitan
                  </label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 font-medium focus:outline-none focus:border-purple-600"
                  >
                    <option value="Easy">Easy (Mudah)</option>
                    <option value="Medium">Medium (Sedang)</option>
                    <option value="Hard">Hard (Sulit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Jumlah Soal
                  </label>
                  <select
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 font-medium focus:outline-none focus:border-purple-600"
                  >
                    <option value={3}>3 Soal</option>
                    <option value={5}>5 Soal</option>
                    <option value={10}>10 Soal</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleAiGenerate}
                disabled={aiLoading || !aiTopic.trim()}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {aiLoading ? (
                  <>⏳ Generating...</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Generate Sekarang
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Link Dialog Modal */}
      {activeLinkQuestionId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 text-base">Tambah Link Referensi</h3>
              <button onClick={() => setActiveLinkQuestionId(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">URL (Link)</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com/materi"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Judul Tautan (Opsional)</label>
                <input
                  type="text"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="Contoh: Materi Pembelajaran"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveLinkQuestionId(null)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddLink}
                  className="px-4 py-2 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                  Tambah Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Dialog Modal (Section BR) */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">Setelan Random Picker</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 text-sm text-gray-700">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Aturan Pengacakan (Behavior)</span>
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allowRepeat}
                      onChange={(e) => setSettings({ ...settings, allowRepeat: e.target.checked })}
                      className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                    />
                    <span>Allow repeated questions (Soal boleh muncul berulang kali)</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.preventImmediateRepeat}
                      onChange={(e) => setSettings({ ...settings, preventImmediateRepeat: e.target.checked })}
                      className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                    />
                    <span>Prevent immediate repeat (Soal tidak boleh langsung muncul berturut-turut)</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.noRepeatUntilAllShown}
                      onChange={(e) => setSettings({ ...settings, noRepeatUntilAllShown: e.target.checked })}
                      className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                    />
                    <span>No repeat until all questions shown (Habiskan semua soal dulu sebelum diulang)</span>
                  </label>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Tampilan Publik (Display)</span>
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showQuestionNumber}
                      onChange={(e) => setSettings({ ...settings, showQuestionNumber: e.target.checked })}
                      className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                    />
                    <span>Show question number (Tampilkan &quot;Soal #Posisi&quot;)</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showAttachments}
                      onChange={(e) => setSettings({ ...settings, showAttachments: e.target.checked })}
                      className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                    />
                    <span>Show attachments (Tampilkan file/media terlampir)</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showLinks}
                      onChange={(e) => setSettings({ ...settings, showLinks: e.target.checked })}
                      className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                    />
                    <span>Show links (Tampilkan link referensi)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  handleSave(true);
                }}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800"
              >
                Simpan Setelan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Dialog Modal (Section Y) */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-bold text-gray-900 text-lg mb-2">Publish Random Picker?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Setelah dipublikasikan, Random Picker dapat diakses oleh siapa saja menggunakan public link.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handlePublish}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800"
              >
                Publish Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
