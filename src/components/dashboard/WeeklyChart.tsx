"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const MEMBER_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#6366f1", // indigo
];

interface Member {
  id: string;
  name: string;
}

interface WeeklyChartProps {
  data: Record<string, string | number>[];
  members: Member[];
}

export function WeeklyChart({ data, members }: WeeklyChartProps) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12 }}
            stroke="#94a3b8"
          />
          <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
            }}
            formatter={(value: number, name: string) => [
              `${value} pts`,
              members.find((m) => m.id === name)?.name ?? name,
            ]}
          />
          <Legend
            formatter={(value) => members.find((m) => m.id === value)?.name ?? value}
            wrapperStyle={{ fontSize: 12 }}
          />
          {members.map((m, i) => (
            <Bar
              key={m.id}
              dataKey={m.id}
              stackId="family"
              fill={MEMBER_COLORS[i % MEMBER_COLORS.length]}
              radius={i === members.length - 1 ? [4, 4, 0, 0] : 0}
              name={m.name}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
