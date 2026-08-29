import Link from "next/link";
import { SellerProductsList } from "@/components/seller-products-list";

export default function SellerProductsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-emerald-600">Catalog</p>
          <h1 className="mt-1 text-3xl font-black text-zinc-950">สินค้า</h1>
        </div>
        <Link
          href="/seller/products/new"
          className="rounded-full bg-emerald-500 px-5 py-3 text-center text-sm font-black text-white hover:bg-emerald-600"
        >
          เพิ่มสินค้า
        </Link>
      </div>

      <div className="mt-6">
        <SellerProductsList />
      </div>
    </main>
  );
}
