"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { ProductCard } from "@/components/product-card";
import { mapProductRow } from "@/data/products";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/types/shop";

type ProductRow = Parameters<typeof mapProductRow>[0];

export function HomeProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        setIsLoading(true);
        setError(null);

        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("products")
          .select(
            "id, shop_id, name, description, price, image_url, stock, is_active, created_at",
          )
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (!isMounted) {
          return;
        }

        if (error) {
          setError(error.message);
          setProducts([]);
          return;
        }

        setProducts(((data ?? []) as ProductRow[]).map(mapProductRow));
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load products",
        );
        setProducts([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const heroProduct = products[0];
  const estimatedInventoryValue = products.reduce(
    (sum, product) => sum + product.price * product.stock,
    0,
  );

  return (
    <>
      <div className="rounded-[2rem] border border-zinc-100 bg-white p-3 shadow-2xl shadow-zinc-100">
        {heroProduct?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroProduct.imageUrl}
            alt={heroProduct.name}
            className="h-80 w-full rounded-[1.5rem] object-cover"
          />
        ) : (
          <div className="flex h-80 w-full items-center justify-center rounded-[1.5rem] bg-emerald-50 text-2xl font-black text-emerald-700">
            MiniShop
          </div>
        )}
        <div className="grid grid-cols-3 gap-3 p-3">
          <div>
            <p className="text-xs text-zinc-500">ยอดขาย</p>
            <p className="font-black text-zinc-950">
              {formatCurrency(estimatedInventoryValue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">สินค้า</p>
            <p className="font-black text-zinc-950">{products.length}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">คำสั่งซื้อ</p>
            <p className="font-black text-zinc-950">0</p>
          </div>
        </div>
      </div>

      <section className="mt-10 lg:col-span-2">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-emerald-600">สินค้าแนะนำ</p>
            <h2 className="text-2xl font-black text-zinc-950">เลือกซื้อเลย</h2>
          </div>
          <Link
            href="/seller/products"
            className="text-sm font-bold text-emerald-600"
          >
            ดูทั้งหมด
          </Link>
        </div>
        {isLoading ? (
          <LoadingState label="กำลังโหลดสินค้า" />
        ) : error ? (
          <ErrorState message={error} />
        ) : products.length === 0 ? (
          <EmptyState
            title="ยังไม่มีสินค้า"
            description="เมื่อมีสินค้า active ใน Supabase แล้ว สินค้าจะแสดงบนหน้าร้านนี้"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
