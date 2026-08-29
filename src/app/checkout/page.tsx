import { Suspense } from "react";
import { CheckoutSummary } from "@/components/checkout-summary";
import { LoadingState } from "@/components/loading-state";

export default function CheckoutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 pb-28 sm:px-6 sm:py-10">
      <p className="text-sm font-bold text-emerald-600">Checkout</p>
      <h1 className="mt-1 text-3xl font-black text-zinc-950">
        สรุปคำสั่งซื้อ
      </h1>
      <Suspense fallback={<LoadingState label="กำลังโหลดคำสั่งซื้อ" />}>
        <CheckoutSummary />
      </Suspense>
    </main>
  );
}
