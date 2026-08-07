"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TrendingUp } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import type { PerformancePoint } from "@/types/student-dashboard";

export default function PerformanceChart({ data }: { data: PerformancePoint[] }) {
  return (
    <DashboardCard title="Performance Trend" icon={TrendingUp}>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="performanceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B98B3E" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#B98B3E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#12203D" strokeOpacity={0.06} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "#12203D99" }}
              tickLine={false}
              axisLine={{ stroke: "#12203D1A" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "#12203D99" }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 4,
                border: "1px solid #12203D1A",
                fontSize: 13,
              }}
              formatter={(value) => [`${value}%`, "Score"]}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#B98B3E"
              strokeWidth={2}
              fill="url(#performanceFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}
