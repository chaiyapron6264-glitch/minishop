import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { getOrders, sellerStats } from "@/data/mock-shop";
import { formatCurrency } from "@/lib/format";

export default async function SellerDashboardPage() {
  const orders = await getOrders();
  const stats = [
    { label: "ยอดขาย", value: formatCurrency(sellerStats.revenue) },
    { label: "คำสั่งซื้อ", value: sellerStats.orders.toString() },
    { label: "สินค้า", value: sellerStats.products.toString() },
    { label: "สต็อกใกล้หมด", value: sellerStats.lowStock.toString() },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-emerald-600">Seller dashboard</p>
          <h1 className="mt-1 text-3xl font-black text-zinc-950">
            ภาพรวมร้าน MiniShop
          </h1>
        </div>
        <Link
          href="/seller/products/new"
          className="rounded-full bg-emerald-500 px-5 py-3 text-center text-sm font-black text-white hover:bg-emerald-600"
        >
          เพิ่มสินค้า
        </Link>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm shadow-zinc-100"
          >
            <p className="text-sm font-semibold text-zinc-500">{stat.label}</p>
            <p className="mt-3 text-2xl font-black text-zinc-950">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-zinc-100 bg-white shadow-sm shadow-zinc-100">
        <div className="flex items-center justify-between border-b border-zinc-100 p-5">
          <h2 className="text-lg font-black text-zinc-950">คำสั่งซื้อล่าสุด</h2>
          <Link href="/orders/ORD-1048" className="text-sm font-bold text-emerald-600">
            ดูรายละเอียด
          </Link>
        </div>
        <div className="divide-y divide-zinc-100">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center justify-between gap-4 p-5 transition hover:bg-zinc-50"
            >
              <div>
                <p className="font-black text-zinc-950">{order.id}</p>
                <p className="mt-1 text-sm text-zinc-500">
                  {order.customerName} · {order.itemCount} รายการ
                </p>
              </div>
              <div className="text-right">
                <StatusBadge status={order.status} />
                <p className="mt-2 text-sm font-black text-zinc-950">
                  {formatCurrency(order.total)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
