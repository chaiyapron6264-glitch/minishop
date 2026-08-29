export function LoadingState({ label = "กำลังโหลด" }: { label?: string }) {
  return (
    <div className="grid gap-3" aria-label={label}>
      <div className="h-36 animate-pulse rounded-2xl bg-zinc-100" />
      <div className="h-4 w-2/3 animate-pulse rounded-full bg-zinc-100" />
      <div className="h-4 w-1/2 animate-pulse rounded-full bg-zinc-100" />
    </div>
  );
}
