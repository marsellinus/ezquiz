"use client";

import { Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface DataItem {
  subject: string;
  A: number;
  fullMark: number;
}

interface RadarChartProps {
  data: DataItem[];
}

export function RadarChart({ data }: RadarChartProps) {
  return (
    <div className="bg-[#131620] border border-[#1F2937] p-6 rounded-xl shadow-sm h-80">
      <h3 className="text-white font-semibold mb-2">Radar Performance Topik</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#1F2937" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 10 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0B0E14', borderColor: '#1F2937', color: '#fff', borderRadius: '8px' }}
              itemStyle={{ color: '#10B981' }}
            />
            <Radar name="Skor" dataKey="A" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
          </RechartsRadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
