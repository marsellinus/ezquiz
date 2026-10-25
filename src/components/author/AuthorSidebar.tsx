"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  Shuffle, 
  BrainCircuit, 
  LogOut,
  Menu,
  X
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/author/dashboard", icon: LayoutDashboard },
  { name: "Random Picker", href: "/author/pickers", icon: Shuffle },
  { name: "My Quizzes", href: "/author/quizzes", icon: BrainCircuit },
];

export function AuthorSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Keep the page behind the drawer from scrolling, and allow Esc to close
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const nav = (
    <>
      <div className="px-3 py-6 flex-1 space-y-1">
        <span className="px-3 text-[11px] font-semibold text-gray-400 tracking-wider mb-2 block uppercase">
          Menu Utama
        </span>

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 px-3.5 py-3 md:py-2.5 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? "bg-gray-100 text-gray-900 font-bold"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-gray-900" : "text-gray-400"}`} />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3.5 py-3 md:py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar — fixed height so page headers can stick right below it (top-14) */}
      <header className="lg:hidden sticky top-0 z-40 h-14 bg-white border-b border-gray-200 flex items-center gap-2 px-3">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Buka menu navigasi"
          aria-expanded={isOpen}
          aria-controls="author-mobile-nav"
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/author/dashboard" className="flex items-center gap-2.5 min-w-0">
          <div className="bg-gray-900 text-white p-1.5 rounded-lg shrink-0">
            <Shuffle className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-gray-900 tracking-tight truncate">QUIZ &amp; PICKER</span>
        </Link>
      </header>

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed inset-0 z-50 ${isOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!isOpen}
      >
        <div
          onClick={() => setIsOpen(false)}
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          id="author-mobile-nav"
          className={`absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white flex flex-col shadow-2xl transition-transform duration-200 ease-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-gray-900 text-white p-2 rounded-xl">
                <Shuffle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-gray-900 tracking-tight block">QUIZ &amp; PICKER</span>
                <span className="text-[11px] text-gray-400 font-medium">AUTHOR PANEL</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Tutup menu navigasi"
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {nav}
        </aside>
      </div>

      {/* Desktop sidebar — sticky so it stays in view while long pages scroll */}
      <aside className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen w-64 bg-white border-r border-gray-200 flex-col text-gray-600 font-sans shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100 shrink-0">
          <div className="bg-gray-900 text-white p-2 rounded-xl">
            <Shuffle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-bold text-gray-900 tracking-tight block">QUIZ &amp; PICKER</span>
            <span className="text-[11px] text-gray-400 font-medium">AUTHOR PANEL</span>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">{nav}</div>
      </aside>
    </>
  );
}
