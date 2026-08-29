"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { StatusBadge } from "@/components/status-badge";
import { mapProductRow } from "@/data/products";
import { formatCurrency } from "@/lib/format";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { Product } from "@/types/shop";

type ProductRow = Parameters<typeof mapProductRow>[0];

export function ProductDetailView({ productId }: { productId: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      try {
        setIsLoading(true);
        setError(null);
        setNotFound(false);

        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("products")
          .select(
            "id, shop_id, name, description, price, image_url, stock, is_active, created_at",
          )
          .eq("id", productId)
          .maybeSingle();

        if (!isMounted) {
          return;
        }

        if (error) {
          setError(error.message);
          setProduct(null);
          return;
        }

        if (!data) {
          setNotFound(true);
          setProduct(null);
          return;
        }

        const mappedProduct = mapProductRow(data as ProductRow);
        setProduct(mappedProduct);
        setQuantity(1);
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "เกิดข้อผิดพลาด",
        );
        setProduct(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProduct();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  const total = useMemo(
    () => (product ? product.price * quantity : 0),
    [product, quantity],
  );

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-6 pb-28 sm:px-6 sm:py-10">
        <LoadingState label="กำลังโหลดสินค้า" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-6 pb-28 sm:px-6 sm:py-10">
        <ErrorState message={error} />
      </main>
    );
  }

  if (notFound || !product) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-6 pb-28 sm:px-6 sm:py-10">
        <ErrorState title="ไม่พบสินค้า" message="สินค้านี้ไม่มีอยู่ในระบบ" />
      </main>
    );
  }

  const isInactive = !product.isActive;
  const isOutOfStock = product.stock <= 0;
  const canOrder = !isInactive && !isOutOfStock;

  const decreaseQuantity = () => {
    setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1));
  };

  const increaseQuantity = () => {
    setQuantity((currentQuantity) =>
      Math.min(product.stock, currentQuantity + 1),
    );
  };

  const handleBuy = () => {
    if (!canOrder) {
      return;
    }

    router.push(`/checkout?product=${product.id}&quantity=${quantity}`);
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 pb-28 sm:px-6 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-2">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-96 w-full rounded-[2rem] object-cover"
          />
        ) : (
          <div className="flex h-96 w-full items-center justify-center rounded-[2rem] bg-emerald-50 text-2xl font-black text-emerald-700">
            MiniShop
          </div>
        )}
        <section className="space-y-5">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <p className="text-sm font-bold text-emerald-600">
                {product.category}
              </p>
              <StatusBadge status={product.status} />
            </div>
            <h1 className="text-3xl font-black leading-tight text-zinc-950">
              {product.name}
            </h1>
            <p className="mt-3 text-3xl font-black text-emerald-600">
              {formatCurrency(product.price)}
            </p>
          </div>
          <p className="text-base leading-8 text-zinc-600">
            {product.description}
          </p>

          {isInactive ? (
            <ErrorState
              title="สินค้ายังไม่เปิดขาย"
              message="สินค้านี้ยังไม่พร้อมให้ลูกค้าสั่งซื้อ"
            />
          ) : null}

          {isOutOfStock ? (
            <ErrorState title="สินค้าหมด" message="ไม่สามารถสั่งซื้อสินค้านี้ได้" />
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-zinc-50 p-4">
              <p className="text-sm text-zinc-500">สินค้าในสต๊อก</p>
              <p className="mt-1 text-xl font-black text-zinc-950">
                {product.stock}
              </p>
            </div>
            <div className="rounded-2xl bg-zinc-50 p-4">
              <p className="text-sm text-zinc-500">ราคาต่อชิ้น</p>
              <p className="mt-1 text-xl font-black text-zinc-950">
                {formatCurrency(product.price)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-100 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-700">จำนวน</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex size-10 items-center justify-center rounded-full border border-zinc-200 text-lg font-black text-zinc-700 disabled:text-zinc-300"
                  disabled={!canOrder || quantity <= 1}
                  onClick={decreaseQuantity}
                >
                  -
                </button>
                <span className="w-8 text-center text-lg font-black text-zinc-950">
                  {quantity}
                </span>
                <button
                  type="button"
                  className="flex size-10 items-center justify-center rounded-full border border-zinc-200 text-lg font-black text-zinc-700 disabled:text-zinc-300"
                  disabled={!canOrder || quantity >= product.stock}
                  onClick={increaseQuantity}
                >
                  +
                </button>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">
              <span className="text-lg font-black text-zinc-950">รวมทั้งหมด</span>
              <span className="text-2xl font-black text-emerald-600">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="block w-full rounded-full bg-emerald-500 px-6 py-4 text-center text-sm font-black text-white shadow-lg shadow-emerald-100 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
            disabled={!canOrder}
            onClick={handleBuy}
          >
            ดำเนินการสั่งซื้อ
          </button>
        </section>
      </div>
    </main>
  );
}
