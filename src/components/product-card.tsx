import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/types/shop";
import { StatusBadge } from "./status-badge";

type ProductCardProps = {
  product: Product;
  compact?: boolean;
};

export function ProductCard({ product, compact = false }: ProductCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm shadow-zinc-100">
      <Link href={`/product/${product.id}`} className="block">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className={`w-full object-cover ${compact ? "h-36" : "h-48"}`}
          />
        ) : (
          <div
            className={`flex w-full items-center justify-center bg-emerald-50 text-sm font-bold text-emerald-700 ${
              compact ? "h-36" : "h-48"
            }`}
          >
            MiniShop
          </div>
        )}
      </Link>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-emerald-600">
              {product.category}
            </p>
            <h3 className="mt-1 line-clamp-2 text-base font-bold text-zinc-950">
              {product.name}
            </h3>
          </div>
          <StatusBadge status={product.status} />
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-zinc-500">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-lg font-extrabold text-zinc-950">
            {formatCurrency(product.price)}
          </p>
          <Link
            href={`/product/${product.id}`}
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-600"
          >
            สั่งเลย
          </Link>
        </div>
      </div>
    </article>
  );
}
