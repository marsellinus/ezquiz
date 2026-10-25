import Link from "next/link";
import { 
  Shuffle, 
  ArrowRight, 
  Gamepad2, 
  Sparkles, 
  Users, 
  BarChart3,
  Globe,
  Zap,
  PlayCircle,
  FileText,
  CheckCircle2,
  LogOut
} from "lucide-react";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { LandingDemoShuffle } from "@/components/public/LandingDemoShuffle";

export default async function LandingPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/author/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-900 selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-2.5 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300 transform group-hover:scale-105">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-black text-gray-900 tracking-tight block">QUIZ & PICKER</span>
              <span className="text-[10px] text-gray-500 font-bold tracking-wider uppercase block">Platform Interaktif</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
            <a href="#mode-quiz" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
              <Gamepad2 className="w-4 h-4" /> Interactive Quiz
            </a>
            <a href="#mode-picker" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
              <Shuffle className="w-4 h-4" /> Random Picker
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <>
              <Link
                href="/login"
                className="text-gray-700 hover:text-gray-900 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                Mulai Gratis <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-24 max-w-7xl mx-auto text-center">
        {/* Background Decorative Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[20%] w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-[10%] right-[20%] w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-10%] left-[40%] w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-bold mb-8 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Platform Evaluasi & Ice-Breaking Modern
        </div>

        <h1 className="text-5xl sm:text-7xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto">
          Satu Platform, <br />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Dua Mode Interaktif.
          </span>
        </h1>

        <p className="text-gray-600 text-base sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Ubah cara Anda berinteraksi dengan audiens. Gunakan <strong>Interactive Quiz</strong> untuk evaluasi seru ala game, atau <strong>Random Picker</strong> untuk ice-breaking cepat tanpa ribet.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white text-base font-bold px-8 py-4 rounded-2xl transition-all duration-300 shadow-xl flex items-center justify-center gap-3 transform hover:-translate-y-1"
          >
            <Sparkles className="w-5 h-5 text-amber-400" /> Dashboard Author / Guru
          </Link>
          <a
            href="#mode-quiz"
            className="w-full sm:w-auto bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 text-base font-semibold px-8 py-4 rounded-2xl transition-all duration-200 shadow-sm flex items-center justify-center gap-2 hover:shadow-md"
          >
            <Gamepad2 className="w-5 h-5 text-indigo-600" /> Lihat Mode Quiz & Picker
          </a>
        </div>
      </section>

      {/* Dual Modes Showcase Section */}
      <section className="py-20 bg-white border-t border-gray-100 px-6 relative z-10" id="mode-quiz">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-sm font-bold uppercase tracking-widest text-purple-600 block mb-3">
              Mode 1: Interactive Quiz
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
              Gamifikasi Evaluasi Kelas
            </h2>
            <p className="text-gray-500 text-lg">
              Berikan pengalaman seperti bermain game. Lengkap dengan sistem poin, bonus kecepatan, leaderboard real-time, dan berbagai tipe soal interaktif.
            </p>
          </div>

          {/* Join Live Game Box for Students in Mode 1 */}
          <div className="bg-purple-900 text-white rounded-3xl p-8 max-w-xl mx-auto shadow-2xl mb-16 space-y-4 text-center relative overflow-hidden border border-purple-800">
            <div className="flex items-center justify-center gap-2 text-purple-300 font-extrabold text-sm uppercase tracking-wider">
              <Gamepad2 className="w-5 h-5 text-purple-400 animate-bounce" /> Masukkan Kode Game Peserta
            </div>
            <form action="/join" method="GET" className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                name="code"
                maxLength={8}
                placeholder="KODE GAME (Misal: A7K92)"
                className="flex-1 bg-gray-900 border border-purple-500/50 rounded-2xl px-5 py-4 text-center font-black text-xl text-white tracking-widest uppercase focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 shadow-inner placeholder:text-gray-500"
                required
              />
              <button
                type="submit"
                className="bg-purple-500 hover:bg-purple-400 active:scale-95 text-white font-extrabold px-8 py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-base"
              >
                JOIN GAME 🚀
              </button>
            </form>
            <p className="text-xs text-purple-300 font-medium">
              Punya Kode Game dari Guru/Host? Masukkan kode di atas untuk langsung masuk ke kuis!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50/50 border border-gray-100 rounded-3xl p-8 hover:bg-white hover:shadow-xl transition-all duration-300 group">
              <div className="bg-purple-100 text-purple-600 p-3 rounded-2xl w-14 h-14 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Live Game Mode</h3>
              <p className="text-gray-600 leading-relaxed">
                Host game secara langsung di kelas. Peserta bergabung via kode, kerjakan bersama, dan lihat leaderboard yang selalu update di layar utama.
              </p>
            </div>

            <div className="bg-gray-50/50 border border-gray-100 rounded-3xl p-8 hover:bg-white hover:shadow-xl transition-all duration-300 group">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-2xl w-14 h-14 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">5 Tipe Pertanyaan</h3>
              <p className="text-gray-600 leading-relaxed">
                Dukung Pilihan Ganda, Checkbox, True/False, Isian Singkat, hingga Esai Panjang. Bikin kuis yang tidak monoton.
              </p>
            </div>

            <div className="bg-gray-50/50 border border-gray-100 rounded-3xl p-8 hover:bg-white hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 blur-2xl opacity-20 rounded-full"></div>
              <div className="bg-amber-100 text-amber-600 p-3 rounded-2xl w-14 h-14 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">AI Auto-Generate</h3>
              <p className="text-gray-600 leading-relaxed relative z-10">
                Kehabisan ide? Gunakan fitur <strong>AI Generate</strong> (didukung Gemini) untuk membuat 10 soal kuis lengkap seketika hanya dari satu topik.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mode 2: Random Picker Section */}
      <section className="py-24 bg-gray-50 border-t border-gray-200 px-6" id="mode-picker">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="w-full lg:w-1/2">
            <span className="text-sm font-bold uppercase tracking-widest text-indigo-600 block mb-3">
              Mode 2: Random Picker
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
              Ice-Breaking Cepat, Tanpa Ribet
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Tidak butuh skor? Hanya ingin mengacak pertanyaan untuk diskusi kelas atau event? Random Picker adalah jawabannya.
            </p>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <div className="mt-1 bg-green-100 text-green-600 p-1 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-gray-900 block">Tanpa Login Peserta</strong>
                  <span className="text-gray-500 text-sm">Bagikan link, peserta bisa langsung klik tombol Shuffle.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 bg-green-100 text-green-600 p-1 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-gray-900 block">Anti-Repeat System</strong>
                  <span className="text-gray-500 text-sm">Opsi untuk mencegah soal yang sama muncul dua kali berturut-turut.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 bg-green-100 text-green-600 p-1 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-gray-900 block">Server-Side Secure</strong>
                  <span className="text-gray-500 text-sm">Hanya 1 soal yang dikirim per request. Bank soal tetap aman.</span>
                </div>
              </li>
            </ul>

            <Link
              href="/p/informatika-dasar"
              target="_blank"
              className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-700 hover:underline"
            >
              Lihat Demo Random Picker <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="w-full lg:w-1/2">
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-gray-900">Demo Live Shuffle</h3>
                  <p className="text-xs text-gray-500">Cobalah klik tombol di bawah</p>
                </div>
                <Globe className="text-gray-300 w-6 h-6" />
              </div>
              <LandingDemoShuffle />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-900 text-white px-6 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black mb-6 tracking-tight">
            Siap Merevolusi Cara Anda Mengajar?
          </h2>
          <p className="text-indigo-200 text-lg mb-10 max-w-2xl mx-auto">
            Mulai buat Interactive Quiz yang menegangkan atau Random Picker yang menyenangkan dalam hitungan menit. 
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto bg-white text-indigo-900 hover:bg-gray-100 font-extrabold text-base px-8 py-4 rounded-2xl transition-all inline-flex items-center justify-center gap-2 shadow-lg hover:scale-105 transform"
            >
              Mulai Gratis Sekarang <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-black text-gray-900 text-lg">
            <Gamepad2 className="w-6 h-6 text-indigo-600" /> QUIZ & PICKER
          </div>
          
          <div className="flex gap-6 text-sm font-semibold text-gray-500">
            <a href="#mode-quiz" className="hover:text-indigo-600 transition-colors">Interactive Quiz</a>
            <a href="#mode-picker" className="hover:text-indigo-600 transition-colors">Random Picker</a>
            <Link href="/login" className="hover:text-indigo-600 transition-colors">Login Author</Link>
          </div>

          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Platform Interaktif. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
