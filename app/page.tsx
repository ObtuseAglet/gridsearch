"use client";

import Grid from "@/components/Grid";
import StatusBar from "@/components/StatusBar";
import Toolbar from "@/components/Toolbar";

export default function Home() {
  return (
    <main className="h-screen flex flex-col bg-white">
      <Toolbar />
      <Grid />
      <StatusBar />
    </main>
  );
}
