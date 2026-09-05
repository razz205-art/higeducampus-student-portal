"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { BarChart3 } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import type { ScoreDistributionBucket } from "@/types/test-reports";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function TestReportScoreChart({ data }: { data: ScoreDistributionBucket[] }) {
  const options: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "Inter, system-ui, sans-serif" },
    colors: ["#B98B3E"],
    plotOptions: { bar: { columnWidth: "55%", borderRadius: 3 } },
    dataLabels: { enabled: false },
    grid: { borderColor: "#12203D0F", strokeDashArray: 3 },
    xaxis: {
      categories: data.map((d) => d.label),
      labels: { style: { colors: "#12203D99", fontSize: "11px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      min: 0,
      labels: { style: { colors: "#12203D99", fontSize: "12px" } },
    },
    tooltip: { y: { formatter: (v) => `${v} student${v === 1 ? "" : "s"}` } },
  };

  const series = [{ name: "Students", data: data.map((d) => d.count) }];

  return (
    <DashboardCard title="Score Distribution" icon={BarChart3}>
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-900/45">No data to show yet.</p>
      ) : (
        <div className="h-64 w-full">
          <Chart options={options} series={series} type="bar" height="100%" width="100%" />
        </div>
      )}
    </DashboardCard>
  );
}
