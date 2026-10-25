"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusCircle, Shuffle, BrainCircuit, X, ArrowRight } from "lucide-react";

export function CreateChoiceModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl transition-all duration-200 font-bold text-sm flex items-center gap-2 shadow-md hover:shadow-lg"
      >
        <PlusCircle className="w-4 h-4" /> Create New Project
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-1">Create New Project</h3>
            <p className="text-sm text-gray-500 mb-6">Pilih jenis project yang ingin Anda buat.</p>

            <div className="space-y-4">
              {/* Option 1: Random Picker */}
              <Link
                href="/author/pickers/new"
                onClick={() => setIsOpen(false)}
                className="group border border-gray-200 hover:border-gray-900 rounded-2xl p-5 flex items-start gap-4 transition-all duration-200 hover:bg-gray-50/80 cursor-pointer block"
              >
                <div className="bg-indigo-50 text-indigo-700 p-3 rounded-xl group-hover:bg-gray-900 group-hover:text-white transition-colors">
                  <Shuffle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-base">🎲 Random Picker</h4>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Kumpulan soal untuk latihan instan. Pengguna menekan Shuffle untuk mengambil 1 soal acak tanpa sistem ujian/skor.
                  </p>
                </div>
              </Link>

              {/* Option 2: Quiz */}
              <Link
                href="/author/quizzes/new"
                onClick={() => setIsOpen(false)}
                className="group border border-gray-200 hover:border-gray-900 rounded-2xl p-5 flex items-start gap-4 transition-all duration-200 hover:bg-gray-50/80 cursor-pointer block"
              >
                <div className="bg-purple-50 text-purple-700 p-3 rounded-xl group-hover:bg-gray-900 group-hover:text-white transition-colors">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-base">🧠 Interactive Quiz</h4>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Kuis interaktif (Pilgan, Checkbox, Isian, True/False) dengan skor, timer, mode Live Game (Join Code), & Self-Paced.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
