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

export default function Home() {
  const [query, setQuery] = useState<null | QueryContext>(null);
  const [chartOptions, setChartOptions] = useState<null | ChartOptions>(null);
  return (
    <QueryProvider value={{ query, setQuery, setChartOptions, chartOptions }}>
      <main className="flex min-h-screen flex-row">
        <Sidebar />
        <div className="flex-grow flex-col flex justify-center items-center">
          <div className="w-[800px] h-[800px] text-black">
            <MyResponsiveSunburst />
          </div>
          <BottomBar />
        </div>
      </main>
    </QueryProvider>
  );
}
