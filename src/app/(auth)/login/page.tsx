"use font-sans";
"use client";

import { useActionState } from "react";
import { authenticate } from "./actions";
import { Shuffle, LogIn, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-gray-900 text-white p-3 rounded-xl mb-4 shadow-sm">
            <Shuffle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">RANDOM PICKER SOAL</h1>
          <p className="text-sm text-gray-500 mt-1">Author / Guru / Dosen Login</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          {errorMessage && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form action={dispatch} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Author
              </label>
              <input
                type="email"
                name="email"
                defaultValue="author@example.com"
                required
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors shadow-sm"
                placeholder="author@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                name="password"
                defaultValue="Author123!"
                required
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors shadow-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {isPending ? (
                "Memproses Login..."
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In ke Dashboard
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Demo Login Credentials:<br />
              <strong className="text-gray-700">author@example.com</strong> / <strong className="text-gray-700">Author123!</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
