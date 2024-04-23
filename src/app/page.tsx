"use client";
import React, { useState } from "react";
import {
  BottomBar,
  ChartOptions,
  MyResponsiveSunburst,
  QueryContext,
  QueryProvider,
  Sidebar,
} from "./components";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import Link from "next/link";

export default function Home() {
  const [query, setQuery] = useState<null | QueryContext>(null);
  const [chartOptions, setChartOptions] = useState<null | ChartOptions>(null);
  return (
    <QueryProvider value={{ query, setQuery, setChartOptions, chartOptions }}>
      <main className="flex min-h-screen flex-row relative">
        <Sidebar />
        <div className="flex-grow flex-col flex justify-center items-center">
          <div className="w-[800px] h-[800px] text-black">
            <MyResponsiveSunburst />
          </div>
          <BottomBar />
        </div>
        <Link href="https://github.com/RhysSullivan/posthog-sunburst/">
          <GitHubLogoIcon className="absolute top-4 right-4 h-8 w-8" />
        </Link>
      </main>
    </QueryProvider>
  );
}
