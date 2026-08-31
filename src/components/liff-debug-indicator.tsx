"use client";

import { useLiff } from "@/components/liff-provider";

export function LiffDebugIndicator() {
  const { isConfigured, isInitialized, isInClient, profile, error, isLoading } =
    useLiff();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed right-3 bottom-20 z-50 max-w-[220px] rounded-2xl border border-emerald-100 bg-white/95 px-3 py-2 text-[11px] leading-5 text-zinc-600 shadow-sm shadow-zinc-100 backdrop-blur">
      <p className="font-black text-emerald-700">LIFF debug</p>
      <p>configured: {String(isConfigured)}</p>
      <p>initialized: {String(isInitialized)}</p>
      <p>mode: {isInClient ? "LINE" : "browser"}</p>
      <p>profile: {profile ? "loaded" : "not loaded"}</p>
      {isLoading ? <p>status: loading</p> : null}
      {error ? <p className="text-red-600">error: {error}</p> : null}
    </div>
  );
}
