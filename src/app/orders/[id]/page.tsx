import { OrderDetailView } from "@/components/order-detail-view";

export default async function OrderDetailPage({
  params,
}: PageProps<"/orders/[id]">) {
  const { id } = await params;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 pb-28 sm:px-6 sm:py-10">
      <p className="text-sm font-bold text-emerald-600">Order detail</p>
      <h1 className="mt-1 text-3xl font-black text-zinc-950">
        สั่งซื้อสำเร็จ
      </h1>
      <OrderDetailView orderId={id} />
    </main>
  );
}
