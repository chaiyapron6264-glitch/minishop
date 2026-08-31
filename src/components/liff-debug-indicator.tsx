"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useLiff } from "@/components/liff-provider";

const formatYesNo = (value: boolean) => (value ? "Yes" : "No");

const maskUserId = (userId: string) => {
  if (userId.length <= 8) {
    return "****";
  }

  return `${userId.slice(0, 4)}...${userId.slice(-4)}`;
};

export function LiffDebugIndicator() {
  const searchParams = useSearchParams();
  const { isInitialized, isInClient, isLoggedIn, profile, error, isLoading } =
    useLiff();

  if (searchParams.get("liffDebug") !== "1") {
    return null;
  }

  return (
    <div className="fixed right-3 bottom-20 z-50 max-w-[260px] rounded-2xl border border-emerald-100 bg-white/95 px-3 py-2 text-[11px] leading-5 text-zinc-600 shadow-sm shadow-zinc-100 backdrop-blur">
      <p className="font-black text-emerald-700">LIFF debug</p>
      <p>LIFF initialized: {formatYesNo(isInitialized)}</p>
      <p>Running inside LINE: {formatYesNo(isInClient)}</p>
      <p>LINE logged in: {formatYesNo(isLoggedIn)}</p>
      <p>Profile loaded: {formatYesNo(Boolean(profile))}</p>
      {profile ? (
        <div className="mt-2 flex items-center gap-2 border-t border-zinc-100 pt-2">
          {profile.pictureUrl ? (
            <Image
              src={profile.pictureUrl}
              alt={profile.displayName}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : null}
          <div className="min-w-0">
            <p className="truncate font-bold text-zinc-900">
              {profile.displayName}
            </p>
            <p>userId: {maskUserId(profile.userId)}</p>
          </div>
        </div>
      ) : null}
      {isLoading ? <p>status: loading</p> : null}
      {error ? <p className="text-red-600">error: {error}</p> : null}
    </div>
  );
}
