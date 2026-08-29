import Link from "next/link";
import { HomeProducts } from "@/components/home-products";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 sm:px-6 sm:py-10">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
            LINE-ready ecommerce starter
          </div>
          <div className="space-y-4">
            <h1 className="max-w-xl text-4xl font-black leading-tight text-zinc-950 sm:text-5xl">
              MiniShop ร้านค้าเล็กที่พร้อมขายบนมือถือ
            </h1>
            <p className="max-w-xl text-base leading-8 text-zinc-600">
              หน้าร้านเรียบง่ายสำหรับสินค้าเด่น คำสั่งซื้อ และเส้นทางไปสู่
              LINE LIFF ในอนาคต โดยยังไม่ผูกระบบชำระเงินหรือแชทบอท
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/seller/products"
              className="rounded-full bg-emerald-500 px-6 py-3 text-center text-sm font-black text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-600"
            >
              ดูสินค้า
            </Link>
            <Link
              href="/seller"
              className="rounded-full border border-zinc-200 px-6 py-3 text-center text-sm font-black text-zinc-800 transition hover:bg-zinc-50"
            >
              เปิดแดชบอร์ดผู้ขาย
            </Link>
          </div>
        </div>
        <HomeProducts />
      </section>
    </main>
  );
}
