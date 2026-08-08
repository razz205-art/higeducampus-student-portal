"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import type { LucideIcon } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import type { ActivityPoint } from "@/types/progress";

// ApexCharts reads `window` at import time — must be dynamically imported
// with ssr:false, same pattern as AttendanceTrendChart.
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function ActivityChart({
  title,
  icon,
  data,
}: {
  title: string;
  icon: LucideIcon;
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

  return (
    <DashboardCard title={title} icon={icon}>
      <div className="h-56 w-full">
        <Chart options={options} series={series} type="bar" height="100%" width="100%" />
      </div>
    </DashboardCard>
  );
}
