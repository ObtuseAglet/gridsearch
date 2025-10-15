"use client";

import { useState, useCallback, useEffect } from "react";
import Grid from "@/components/Grid";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-300 bg-white px-4 py-3 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-800">GridSearch</h1>
        <p className="text-sm text-gray-600">Google Sheets Clone with Search Integration</p>
      </div>
      <Grid />
    </main>
  );
}
