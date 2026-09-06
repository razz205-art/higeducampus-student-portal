"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { Layers, Users, Activity, CalendarRange } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import type { ActivityPoint } from "@/types/progress";

// ApexCharts reads `window` at import time — must be dynamically imported
// with ssr:false, same pattern as AttendanceTrendChart.
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Server pages that render this client component can't pass a Lucide icon
// component reference as a prop — React only allows serializable values
// (strings, numbers, plain objects, already-rendered elements) across the
// server/client boundary, and a bare component reference isn't one of
// those. Passing a string key here and resolving it to the real icon
// component inside this client file sidesteps that restriction entirely.
const ICONS: Record<string, LucideIcon> = { Layers, Users, Activity, CalendarRange };

export default function ActivityChart({
  title,
  icon = "Layers",
  data,
}: {
  title: string;
  icon?: keyof typeof ICONS;
  data: ActivityPoint[];
}) {
  const options: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "Inter, system-ui, sans-serif" },
    colors: ["#12203D"],
    plotOptions: { bar: { borderRadius: 4, columnWidth: "55%" } },
    dataLabels: { enabled: false },
    grid: { borderColor: "#12203D0F", strokeDashArray: 3 },
    xaxis: {
      categories: data.map((d) => d.label),
      labels: { style: { colors: "#12203D99", fontSize: "12px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: "#12203D99", fontSize: "12px" } },
      forceNiceScale: true,
    },
    tooltip: { y: { formatter: (v) => `${v} ${v === 1 ? "activity" : "activities"}` } },
  };

  const series = [{ name: "Activity", data: data.map((d) => d.count) }];
  const Icon = ICONS[icon] ?? Layers;

  return (
    <DashboardCard title={title} icon={Icon}>
      <div className="h-56 w-full">
        <Chart options={options} series={series} type="bar" height="100%" width="100%" />
      </div>
    </DashboardCard>
  );
}
