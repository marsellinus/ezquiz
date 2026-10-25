"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Library, 
  BookOpen, 
  Users, 
  Award, 
  Shuffle, 
  BarChart2, 
  Settings,
  GraduationCap
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Ujian", href: "/admin/exams", icon: FileText },
    { name: "Bank Soal", href: "/admin/banks", icon: Library },
    { name: "Mata Pelajaran", href: "/admin/subjects", icon: BookOpen },
    { name: "Pengguna & Guru", href: "/admin/users", icon: Users },
    { name: "Hasil Ujian", href: "/admin/results", icon: Award },
    { name: "Random Picker", href: "/admin/random", icon: Shuffle },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart2 },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col text-gray-600">
      <div className="p-6 flex items-center gap-3 border-b border-gray-100">
        <div className="bg-gray-900 p-2 rounded-lg">
          <GraduationCap className="text-white w-5 h-5" />
        </div>
        <span className="text-lg font-bold text-gray-900 tracking-tight">AdaptExam</span>
      </div>

      <div className="px-3 py-4 flex-1">
        <span className="px-3 text-xs font-semibold text-gray-400 tracking-wider mb-2 block">
          ADMIN PANEL
        </span>
        
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
                  isActive 
                    ? "bg-gray-100 text-gray-900" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-gray-900" : "text-gray-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="text-gray-900 text-xs font-bold flex items-center gap-2 mb-1">
            <Library className="w-3.5 h-3.5 text-gray-500" /> Bank Soal
          </h4>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Soal otomatis masuk ke sistem adaptif siswa.
          </p>
        </div>
      </div>
    </aside>
  );
}
