"use client";

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataItem {
  name: string;
  value: number;
}

interface BarChartProps {
  data: DataItem[];
}

export function BarChart({ data }: BarChartProps) {
  return (
    <div className="bg-[#131620] border border-[#1F2937] p-6 rounded-xl shadow-sm h-80">
      <h3 className="text-white font-semibold mb-6">Penguasaan Materi per Topik (%)</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: -20,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1F2937" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} domain={[0, 100]} />
            <Tooltip 
              cursor={{ fill: '#1A1D2D' }} 
              contentStyle={{ backgroundColor: '#0B0E14', borderColor: '#1F2937', color: '#fff', borderRadius: '8px' }}
              itemStyle={{ color: '#818CF8' }}
            />
            <Bar dataKey="value" fill="#818CF8" radius={[4, 4, 0, 0]} barSize={40} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
