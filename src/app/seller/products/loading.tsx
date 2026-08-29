import { LoadingState } from "@/components/loading-state";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 sm:px-6 sm:py-10">
      <LoadingState label="กำลังโหลดสินค้า" />
    </main>
  );
}
