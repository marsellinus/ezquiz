import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon
}: StatCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <span className="text-gray-500 text-sm font-medium">{title}</span>
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div>
        <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">{value}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
