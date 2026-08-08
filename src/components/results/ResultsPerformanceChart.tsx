"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { LineChart } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import type { ResultsPerformancePoint } from "@/types/results";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function ResultsPerformanceChart({ data }: { data: ResultsPerformancePoint[] }) {
  const options: ApexOptions = {
    chart: { type: "line", toolbar: { show: false }, fontFamily: "Inter, system-ui, sans-serif" },
    colors: ["#B98B3E"],
    stroke: { curve: "smooth", width: 2.5 },
    markers: { size: 4, colors: ["#B98B3E"], strokeColors: "#FAF9F6", strokeWidth: 2 },
    dataLabels: { enabled: false },
    grid: { borderColor: "#12203D0F", strokeDashArray: 3 },
    xaxis: {
      categories: data.map((d) => d.label),
      labels: { style: { colors: "#12203D99", fontSize: "11px" }, rotate: -20 },
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

  const series = [{ name: "Score", data: data.map((d) => d.percentage) }];

  return (
    <DashboardCard title="Performance Graph" icon={LineChart}>
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-900/45">
          No internal or mock test scores recorded yet.
        </p>
      ) : (
        <div className="h-64 w-full">
          <Chart options={options} series={series} type="line" height="100%" width="100%" />
        </div>
      )}
    </DashboardCard>
  );
}
