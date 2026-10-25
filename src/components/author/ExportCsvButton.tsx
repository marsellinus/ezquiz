"use client";

import { Download } from "lucide-react";

export function ExportCsvButton({ data, filename }: { data: any[]; filename: string }) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("Tidak ada data untuk di-export.");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(","));

    for (const row of data) {
      const values = headers.map((header) => {
        const escaped = ("" + row[header]).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    }

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", filename);
    a.click();
  };

  return (
    <button
      onClick={handleExport}
      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 shadow-sm"
    >
      <Download className="w-4 h-4" /> Export CSV
    </button>
  );
}
