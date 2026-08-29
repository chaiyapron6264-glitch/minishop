import type { OrderStatus, ProductStatus } from "@/types/shop";

type Status = ProductStatus | OrderStatus;

const statusLabel: Record<Status, string> = {
  active: "กำลังขาย",
  draft: "ฉบับร่าง",
  sold_out: "สินค้าหมด",
  pending: "รอตรวจสอบ",
  paid: "ชำระแล้ว",
  shipping: "กำลังจัดส่ง",
  completed: "สำเร็จ",
};

const statusClassName: Record<Status, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  draft: "bg-slate-100 text-slate-600 ring-slate-200",
  sold_out: "bg-rose-50 text-rose-700 ring-rose-100",
  pending: "bg-amber-50 text-amber-700 ring-amber-100",
  paid: "bg-lime-50 text-lime-700 ring-lime-100",
  shipping: "bg-sky-50 text-sky-700 ring-sky-100",
  completed: "bg-zinc-100 text-zinc-700 ring-zinc-200",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold ring-1 ${statusClassName[status]}`}
    >
      {statusLabel[status]}
    </span>
  );
}
