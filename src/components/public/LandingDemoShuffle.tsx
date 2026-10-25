"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, ExternalLink, CheckCircle2 } from "lucide-react";

const DEMO_QUESTIONS = [
  {
    content: "Apa yang dimaksud dengan algoritma dalam pemrograman komputer?",
    tag: "Algoritma & Pemrograman",
    linkTitle: "Materi Pengantar Algoritma (Wikipedia)",
    linkUrl: "https://id.wikipedia.org/wiki/Algoritma",
  },
  {
    content: "Jelaskan perbedaan utama antara Database Relasional (SQL) dan Non-Relasional (NoSQL)!",
    tag: "Basis Data",
    linkTitle: "Perbandingan SQL vs NoSQL (AWS)",
    linkUrl: "https://aws.amazon.com/id/relational-database/",
  },
  {
    content: "Apa fungsi utama dari protokol HTTP / HTTPS dalam komunikasi web?",
    tag: "Jaringan Komputer",
    linkTitle: "MDN Web HTTP Overview",
    linkUrl: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
  },
  {
    content: "Sebutkan dan jelaskan 4 pilar utama Object-Oriented Programming (OOP)!",
    tag: "Pemrograman Berorientasi Objek",
  },
  {
    content: "Apa perbedaan antara Authentication (Autentikasi) dan Authorization (Otorisasi)?",
    tag: "Keamanan Sistem",
  },
];

export function LandingDemoShuffle() {
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleShuffle = () => {
    setLoading(true);
    setTimeout(() => {
      let nextIndex = Math.floor(Math.random() * DEMO_QUESTIONS.length);
      if (DEMO_QUESTIONS.length > 1) {
        while (nextIndex === index) {
          nextIndex = Math.floor(Math.random() * DEMO_QUESTIONS.length);
        }
      }
      setIndex(nextIndex);
      setLoading(false);
    }, 150);
  };

  const currentQ = DEMO_QUESTIONS[index];

  return (
    <div suppressHydrationWarning className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xl relative z-20 overflow-hidden text-left max-w-xl mx-auto">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
          <span className="text-xs font-mono text-gray-400 ml-2">Public Preview Widget</span>
        </div>
        <span className="text-[11px] font-bold tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Live Interactive
        </span>
      </div>

      <div className="min-h-[200px] flex flex-col justify-between py-2">
        {mounted ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ.content}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-4 my-auto"
            >
              <span className="inline-block bg-indigo-50 text-indigo-700 text-[11px] font-bold px-2.5 py-1 rounded-md border border-indigo-100">
                {currentQ.tag}
              </span>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-snug">
                {currentQ.content}
              </h3>
              {currentQ.linkTitle && (
                <div className="pt-2 border-t border-gray-100">
                  <a
                    href={currentQ.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:underline bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100"
                  >
                    🔗 {currentQ.linkTitle} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="space-y-4 my-auto">
            <span className="inline-block bg-indigo-50 text-indigo-700 text-[11px] font-bold px-2.5 py-1 rounded-md border border-indigo-100">
              {currentQ.tag}
            </span>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-snug">
              {currentQ.content}
            </h3>
            {currentQ.linkTitle && (
              <div className="pt-2 border-t border-gray-100">
                <a
                  href={currentQ.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:underline bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100"
                >
                  🔗 {currentQ.linkTitle} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pt-4 mt-4 border-t border-gray-100 relative z-30">
        <button
          type="button"
          onClick={handleShuffle}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-sm py-4 px-6 rounded-2xl transition-all duration-150 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl cursor-pointer pointer-events-auto disabled:opacity-50"
        >
          <Shuffle className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "MENGACAK SOAL..." : "🎲 SHUFFLE DEMO (KLIK SINI)"}
        </button>
      </div>
    </div>
  );
}
