"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Award, CheckCircle2, Calendar, Filter, Sparkles, Trophy } from "lucide-react";
import { ExportCsvButton } from "@/components/author/ExportCsvButton";

interface ParticipantAnswer {
  id: string;
  questionContent?: string;
  answerData?: string;
  isCorrect: boolean;
  pointsEarned: number;
}

interface Participant {
  id: string;
  nickname: string;
  className?: string;
  score: number;
  tabSwitchCount?: number;
  createdAt?: string;
  answers: ParticipantAnswer[];
}

interface SessionItem {
  id: string;
  joinCode: string;
  status: string;
  createdAt: string;
  participants: Participant[];
}

interface QuizAnalyticsProps {
  quizTitle: string;
  quizSlug: string;
  sessions: SessionItem[];
}

export function AnalyticsViewClient({ quizTitle, quizSlug, sessions }: QuizAnalyticsProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string>("ALL");
  const [selectedClassName, setSelectedClassName] = useState<string>("ALL");
  const [showViolations, setShowViolations] = useState<boolean>(true);
  const [activeDetailParticipant, setActiveDetailParticipant] = useState<(Participant & { sessionCode: string; sessionDate: string }) | null>(null);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);

  // Default Simulated Multi-Class Data Scenario
  const simulatedSessions: SessionItem[] = [
    {
      id: "sim-session-1",
      joinCode: "IPA1-S1",
      status: "FINISHED",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      participants: [
        {
          id: "p1",
          nickname: "Budi Santoso",
          className: "X IPA 1",
          score: 450,
          tabSwitchCount: 0,
          answers: [
            { id: "a1", questionContent: "Pengertian Fotosintesis", answerData: "Proses pembuatan makanan", isCorrect: true, pointsEarned: 100 },
            { id: "a2", questionContent: "Organel Sel Tumbuhan", answerData: "Kloroplas", isCorrect: true, pointsEarned: 100 },
            { id: "a3", questionContent: "Fungsi Mitokondria", answerData: "Respirasi Sel / Energi", isCorrect: true, pointsEarned: 100 },
            { id: "a4", questionContent: "Hukum Mendel I", answerData: "Segregasi Bebas", isCorrect: true, pointsEarned: 100 },
            { id: "a5", questionContent: "Sistem Ekosistem", answerData: "Komunitas Biotik", isCorrect: false, pointsEarned: 50 },
          ],
        },
        {
          id: "p2",
          nickname: "Anisa Rahma",
          className: "X IPA 1",
          score: 400,
          tabSwitchCount: 2,
          answers: [
            { id: "a1", questionContent: "Pengertian Fotosintesis", answerData: "Proses pembuatan makanan", isCorrect: true, pointsEarned: 100 },
            { id: "a2", questionContent: "Organel Sel Tumbuhan", answerData: "Kloroplas", isCorrect: true, pointsEarned: 100 },
            { id: "a3", questionContent: "Fungsi Mitokondria", answerData: "Respirasi Sel", isCorrect: true, pointsEarned: 100 },
            { id: "a4", questionContent: "Hukum Mendel I", answerData: "Asortasi", isCorrect: false, pointsEarned: 0 },
            { id: "a5", questionContent: "Sistem Ekosistem", answerData: "Rantai Makanan", isCorrect: true, pointsEarned: 100 },
          ],
        },
        {
          id: "p3",
          nickname: "Candra Kusuma",
          className: "X IPA 1",
          score: 300,
          tabSwitchCount: 5,
          answers: [
            { id: "a1", questionContent: "Pengertian Fotosintesis", answerData: "Pembelahan sel", isCorrect: false, pointsEarned: 0 },
            { id: "a2", questionContent: "Organel Sel Tumbuhan", answerData: "Kloroplas", isCorrect: true, pointsEarned: 100 },
            { id: "a3", questionContent: "Fungsi Mitokondria", answerData: "Respirasi Sel", isCorrect: true, pointsEarned: 100 },
            { id: "a4", questionContent: "Hukum Mendel I", answerData: "Segregasi Bebas", isCorrect: true, pointsEarned: 100 },
          ],
        },
      ],
    },
    {
      id: "sim-session-2",
      joinCode: "IPA2-S2",
      status: "FINISHED",
      createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      participants: [
        {
          id: "p4",
          nickname: "Deni Pratama",
          className: "X IPA 2",
          score: 500,
          tabSwitchCount: 0,
          answers: [
            { id: "a1", questionContent: "Pengertian Fotosintesis", answerData: "Proses pembuatan makanan", isCorrect: true, pointsEarned: 100 },
            { id: "a2", questionContent: "Organel Sel Tumbuhan", answerData: "Kloroplas", isCorrect: true, pointsEarned: 100 },
            { id: "a3", questionContent: "Fungsi Mitokondria", answerData: "Respirasi Sel / Energi", isCorrect: true, pointsEarned: 100 },
            { id: "a4", questionContent: "Hukum Mendel I", answerData: "Segregasi Bebas", isCorrect: true, pointsEarned: 100 },
            { id: "a5", questionContent: "Sistem Ekosistem", answerData: "Interaksi Biotik Abiotik", isCorrect: true, pointsEarned: 100 },
          ],
        },
        {
          id: "p5",
          nickname: "Eka Wijaya",
          className: "X IPA 2",
          score: 350,
          tabSwitchCount: 1,
          answers: [
            { id: "a1", questionContent: "Pengertian Fotosintesis", answerData: "Proses pembuatan makanan", isCorrect: true, pointsEarned: 100 },
            { id: "a2", questionContent: "Organel Sel Tumbuhan", answerData: "Ribosom", isCorrect: false, pointsEarned: 0 },
            { id: "a3", questionContent: "Fungsi Mitokondria", answerData: "Respirasi Sel", isCorrect: true, pointsEarned: 100 },
            { id: "a4", questionContent: "Hukum Mendel I", answerData: "Segregasi Bebas", isCorrect: true, pointsEarned: 100 },
          ],
        },
      ],
    },
  ];

  // Active dataset
  const currentSessions = (isSimulated || sessions.length === 0 || sessions.every(s => s.participants.length === 0))
    ? simulatedSessions 
    : sessions;

  // Extract all unique class names across sessions
  const allRawParticipants = currentSessions.flatMap((s) => s.participants);
  const uniqueClassNames = Array.from(
    new Set(allRawParticipants.map((p) => p.className || "Umum / Tanpa Kelas").filter(Boolean))
  );

  // Filtered Sessions
  const activeSessions = selectedSessionId === "ALL" 
    ? currentSessions 
    : currentSessions.filter((s) => s.id === selectedSessionId);

  // Active Participants (filtered by session AND class)
  const activeParticipants = activeSessions.flatMap((s) => 
    s.participants.map((p) => ({ 
      ...p, 
      displayClass: p.className || "Umum / Tanpa Kelas",
      sessionCode: s.joinCode, 
      sessionDate: s.createdAt 
    }))
  )
  .filter((p) => selectedClassName === "ALL" || p.displayClass === selectedClassName)
  .sort((a, b) => b.score - a.score);

  const totalParticipants = activeParticipants.length;

  const avgScore = totalParticipants > 0
    ? Math.round(activeParticipants.reduce((acc, p) => acc + p.score, 0) / totalParticipants)
    : 0;

  const allAnswers = activeParticipants.flatMap((p) => p.answers);
  const totalAnswersCount = allAnswers.length;
  const totalCorrectCount = allAnswers.filter((a) => a.isCorrect).length;
  const avgAccuracy = totalAnswersCount > 0 ? Math.round((totalCorrectCount / totalAnswersCount) * 100) : 0;

  // Prepare CSV Export Data
  const csvData = activeParticipants.map((p, idx) => {
    const pCorrect = p.answers.filter((a) => a.isCorrect).length;
    const pTotal = p.answers.length;
    const pAccuracy = pTotal > 0 ? Math.round((pCorrect / pTotal) * 100) : 0;
    return {
      Rank: `#${idx + 1}`,
      SessionCode: p.sessionCode,
      Kelas: p.displayClass,
      Nickname: p.nickname,
      Score: p.score,
      Correct: pCorrect,
      Wrong: Math.max(0, pTotal - pCorrect),
      Accuracy: `${pAccuracy}%`,
      TabSwitchCount: `${p.tabSwitchCount || 0}x Keluar Tab`,
      Date: new Date(p.sessionDate).toLocaleString("id-ID"),
    };
  });

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Top Bar Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
        <div>
          <Link 
            href="/author/quizzes" 
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Quiz
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            📊 Rekap Multi-Kelas: <span className="text-purple-700">{quizTitle}</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Total {sessions.length} Sesi Batch Ditayangkan • {uniqueClassNames.length} Rombel / Kelas Terdaftar
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsSimulated(!isSimulated)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-sm ${
              isSimulated ? "bg-amber-500 text-gray-900 border border-amber-400" : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
            }`}
          >
            <Sparkles className="w-4 h-4" /> {isSimulated ? "⚡ Mode Simulasi Aktif (Sample X IPA 1 & 2)" : "✨ Uji Simulasi Multi-Kelas"}
          </button>

          <ExportCsvButton 
            data={csvData} 
            filename={`rekap-nilai-multi-kelas-${quizSlug}.csv`} 
          />
        </div>
      </div>

      {/* Filter Bar: Select Batch & Select Class */}
      <div className="bg-purple-900 text-white rounded-3xl p-6 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border border-purple-800">
        <div className="flex items-center gap-3">
          <div className="bg-purple-800 p-2.5 rounded-2xl text-purple-300">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Filter Multi-Kelas & Batch Tanggal</h3>
            <p className="text-xs text-purple-300">Filter data berdasarkan sesi atau rombel kelas tertentu</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Class Filter */}
          <div className="flex-1 lg:flex-none">
            <span className="text-[10px] font-bold text-purple-300 uppercase block mb-1">Filter Kelas</span>
            <select
              value={selectedClassName}
              onChange={(e) => setSelectedClassName(e.target.value)}
              className="bg-gray-900 border border-purple-500/50 text-white rounded-2xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-purple-400 cursor-pointer w-full"
            >
              <option value="ALL">🏫 Semua Kelas / Rombel ({allRawParticipants.length} Siswa)</option>
              {uniqueClassNames.map((cName) => (
                <option key={cName} value={cName}>
                  📚 Kelas: {cName} ({allRawParticipants.filter(p => (p.className || "Umum / Tanpa Kelas") === cName).length} Siswa)
                </option>
              ))}
            </select>
          </div>

          {/* Session Filter */}
          <div className="flex-1 lg:flex-none">
            <span className="text-[10px] font-bold text-purple-300 uppercase block mb-1">Filter Sesi Batch</span>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="bg-gray-900 border border-purple-500/50 text-white rounded-2xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-purple-400 cursor-pointer w-full min-w-[220px]"
            >
              <option value="ALL">🌐 Semua Sesi / Batch (Gabungan)</option>
              {sessions.map((s, idx) => (
                <option key={s.id} value={s.id}>
                  Batch #{sessions.length - idx} (Kode: {s.joinCode})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Peserta Sesi Ini</span>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-3xl font-black text-gray-900">{totalParticipants} <span className="text-sm font-normal text-gray-400">Siswa</span></h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rata-Rata Nilai / Skor</span>
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-3xl font-black text-gray-900">{avgScore} <span className="text-sm font-normal text-gray-400">Poin</span></h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rata-Rata Akurasi Klas</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-3xl font-black text-gray-900">{avgAccuracy}% <span className="text-sm font-normal text-gray-400">Tepat</span></h3>
        </div>
      </div>

      {/* Participant Ranking & Score Table */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Peringkat & Rekap Nilai Peserta
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Diurutkan berdasarkan skor tertinggi</p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer bg-amber-50/80 border border-amber-200 px-3.5 py-2 rounded-xl hover:bg-amber-100 transition-colors">
              <input 
                type="checkbox" 
                checked={showViolations} 
                onChange={(e) => setShowViolations(e.target.checked)} 
                className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
              />
              <span>⚠️ Tampilkan Pelanggaran Pindah Tab</span>
            </label>

            <span className="text-xs font-bold bg-purple-50 text-purple-700 px-3.5 py-2 rounded-xl border border-purple-200">
              {activeParticipants.length} Data Ditampilkan
            </span>
          </div>
        </div>

        {activeParticipants.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="text-3xl">👥</div>
            <h4 className="font-bold text-gray-800 text-sm">Belum Ada Data Peserta</h4>
            <p className="text-xs text-gray-400">Sesi/Batch yang dipilih belum memiliki jawaban peserta.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4">Peringkat</th>
                  <th className="py-3.5 px-4">Kelas / Rombel</th>
                  <th className="py-3.5 px-4">Sesi Batch</th>
                  <th className="py-3.5 px-4">Nama Peserta</th>
                  <th className="py-3.5 px-4">Skor Akhir</th>
                  <th className="py-3.5 px-4">Jawaban Benar</th>
                  <th className="py-3.5 px-4">Akurasi</th>
                  {showViolations && <th className="py-3.5 px-4 text-center">Status Pindah Tab</th>}
                  <th className="py-3.5 px-4">Tanggal Pengerjaan</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {activeParticipants.map((p, idx) => {
                  const pCorrect = p.answers.filter((a) => a.isCorrect).length;
                  const pTotal = p.answers.length;
                  const pAcc = pTotal > 0 ? Math.round((pCorrect / pTotal) * 100) : 0;
                  const tSwitch = p.tabSwitchCount || 0;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-4 font-black">
                        <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs ${
                          idx === 0 ? "bg-amber-400 text-gray-900 font-bold" : idx === 1 ? "bg-gray-300 text-gray-900" : idx === 2 ? "bg-amber-700 text-white" : "bg-gray-100 text-gray-600"
                        }`}>
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold">
                        <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs px-2.5 py-1 rounded-lg">
                          🏫 {p.displayClass}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-gray-100 text-gray-700 text-xs font-mono font-bold px-2.5 py-1 rounded-md">
                          {p.sessionCode}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-gray-900">👤 {p.nickname}</td>
                      <td className="py-4 px-4 font-black text-purple-700 text-base">{p.score} Poin</td>
                      <td className="py-4 px-4 text-emerald-700 font-bold">{pCorrect} / {pTotal} Soal</td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                          pAcc >= 80 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : pAcc >= 50 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                          {pAcc}%
                        </span>
                      </td>
                      {showViolations && (
                        <td className="py-4 px-4 text-center">
                          {tSwitch > 0 ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-red-50 text-red-700 border border-red-200 inline-flex items-center gap-1">
                              ⚠️ {tSwitch}x Pindah Tab
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                              ✓ Jujur (0x)
                            </span>
                          )}
                        </td>
                      )}
                      <td className="py-4 px-4 text-xs text-gray-500 font-mono">
                        {new Date(p.sessionDate).toLocaleString("id-ID")}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => setActiveDetailParticipant(p)}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          🔍 Lihat Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Participant Detail Answer Sheet Modal */}
      {activeDetailParticipant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <div>
                <span className="text-xs font-bold text-purple-600 uppercase tracking-widest block">
                  LEMBAR JAWABAN PESERTA LENGKAP
                </span>
                <h3 className="text-2xl font-black text-gray-900">
                  👤 {activeDetailParticipant.nickname}
                </h3>
                <p className="text-xs text-gray-400">
                  Kelas: <strong className="text-purple-700">{activeDetailParticipant.className || "Umum"}</strong> • Sesi Batch: <strong className="text-gray-700">{activeDetailParticipant.sessionCode}</strong> • Tanggal: {new Date(activeDetailParticipant.sessionDate).toLocaleString("id-ID")}
                </p>
              </div>

              <button
                onClick={() => setActiveDetailParticipant(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Score & Anti-Cheat Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-purple-900 text-white rounded-2xl p-4">
                <span className="text-xs text-purple-300 block">Total Skor</span>
                <span className="text-2xl font-black">{activeDetailParticipant.score} Poin</span>
              </div>
              <div className="bg-purple-900 text-white rounded-2xl p-4">
                <span className="text-xs text-purple-300 block">Akurasi</span>
                <span className="text-2xl font-black text-amber-400 block">
                  {activeDetailParticipant.answers.length > 0 
                    ? Math.round((activeDetailParticipant.answers.filter(a => a.isCorrect).length / activeDetailParticipant.answers.length) * 100) 
                    : 0}%
                </span>
              </div>
              <div className={`rounded-2xl p-4 border ${
                (activeDetailParticipant.tabSwitchCount || 0) > 0 ? "bg-red-950 border-red-800 text-red-200" : "bg-emerald-950 border-emerald-800 text-emerald-200"
              }`}>
                <span className="text-xs uppercase font-bold block opacity-80">Indikator Pindah Tab</span>
                <span className="text-xl font-black block mt-0.5">
                  {(activeDetailParticipant.tabSwitchCount || 0) > 0 
                    ? `⚠️ ${activeDetailParticipant.tabSwitchCount}x Keluar Tab` 
                    : "✓ Jujur (0x)"}
                </span>
              </div>
            </div>

            {/* Answer List Breakdown */}
            <div className="space-y-4">
              <h4 className="font-bold text-gray-900 text-sm">Rincian Jawaban Per Soal ({activeDetailParticipant.answers.length} Soal)</h4>

              {activeDetailParticipant.answers.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">Peserta ini belum mengirimkan jawaban.</p>
              ) : (
                <div className="space-y-3">
                  {activeDetailParticipant.answers.map((ans, idx) => (
                    <div 
                      key={ans.id || idx}
                      className={`p-4 rounded-2xl border text-sm space-y-2 ${
                        ans.isCorrect ? "bg-emerald-50/50 border-emerald-200 text-emerald-950" : "bg-red-50/50 border-red-200 text-red-950"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-bold text-gray-900 text-xs">
                          Soal #{idx + 1}: {ans.questionContent}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold shrink-0 ${
                          ans.isCorrect ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                        }`}>
                          {ans.isCorrect ? `✓ Benar (+${ans.pointsEarned} Poin)` : "✕ Salah (0 Poin)"}
                        </span>
                      </div>

                      {ans.answerData && (
                        <p className="text-xs text-gray-700 bg-white/80 p-2.5 rounded-xl border border-gray-200">
                          <strong className="text-gray-900">Jawaban Peserta:</strong> {ans.answerData}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setActiveDetailParticipant(null)}
                className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
