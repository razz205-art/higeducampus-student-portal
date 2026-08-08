"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { TrendingUp } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import type { AttendanceTrendPoint } from "@/types/attendance";

// ApexCharts reads `window` at import time, so it must never be evaluated
// during server-side rendering — dynamic-import with ssr:false is the
// standard safe pattern for it in the Next.js App Router.
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function AttendanceTrendChart({
  data,
  title = "Attendance Trend",
}: {
  data: AttendanceTrendPoint[];
  title?: string;
}) {
  const options: ApexOptions = {
    chart: {
      type: "area",
      toolbar: { show: false },
      fontFamily: "Inter, system-ui, sans-serif",
    },
    colors: ["#B98B3E"],
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0, stops: [0, 90, 100] },
    },
    grid: { borderColor: "#12203D0F", strokeDashArray: 3 },
    xaxis: {
      categories: data.map((d) => d.month),
      labels: { style: { colors: "#12203D99", fontSize: "12px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      min: 0,
      max: 100,
      labels: { style: { colors: "#12203D99", fontSize: "12px" }, formatter: (v) => `${v}%` },
    },
    tooltip: { y: { formatter: (v) => `${v}%` } },
  };

  const series = [{ name: "Attendance %", data: data.map((d) => d.percentage) }];

  return (
    <DashboardCard title={title} icon={TrendingUp}>
      <div className="h-64 w-full">
        <Chart options={options} series={series} type="area" height="100%" width="100%" />
      </div>
    </DashboardCard>
  );
}
