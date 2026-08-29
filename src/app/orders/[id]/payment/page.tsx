import { PaymentView } from "@/components/payment-view";

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 pb-28 sm:px-6 sm:py-10">
      <p className="text-sm font-bold text-emerald-600">PromptPay</p>
      <h1 className="mt-1 text-3xl font-black text-zinc-950">ชำระเงิน</h1>
      <PaymentView orderId={id} />
    </main>
  );
}
