"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { ProductCard } from "@/components/product-card";
import { mapProductRow } from "@/data/products";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { Product } from "@/types/shop";

type ProductRow = Parameters<typeof mapProductRow>[0];

export function SellerProductsList() {
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

  if (isLoading) {
    return <LoadingState label="กำลังโหลดสินค้า" />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title="ยังไม่มีสินค้า"
        description="เพิ่มสินค้าชิ้นแรกเพื่อเริ่มขายบน MiniShop"
        action={
          <Link
            href="/seller/products/new"
            className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-black text-white"
          >
            เพิ่มสินค้า
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
