"use client";

import Grid from "@/components/Grid";
import Toolbar from "@/components/Toolbar";
import StatusBar from "@/components/StatusBar";

export default function Home() {
  return (
    <main className="h-screen flex flex-col bg-white">
      <Toolbar />
      <Grid />
      <StatusBar />
    </main>
  );
}
