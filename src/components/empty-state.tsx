import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-50 text-xl font-bold text-emerald-600">
        +
      </div>
      <h2 className="text-lg font-bold text-zinc-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
