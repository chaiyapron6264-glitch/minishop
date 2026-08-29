import { AddProductForm } from "@/components/add-product-form";

export default function NewProductPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 pb-28 sm:px-6 sm:py-10">
      <p className="text-sm font-bold text-emerald-600">New product</p>
      <h1 className="mt-1 text-3xl font-black text-zinc-950">เพิ่มสินค้า</h1>
      <AddProductForm />
    </main>
  );
}
