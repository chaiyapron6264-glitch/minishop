import { createSupabaseClient, getSupabaseConfig } from "@/lib/supabase";
import type { Product } from "@/types/shop";

type ProductRow = {
  id: string;
  shop_id: string | null;
  name: string;
  description: string | null;
  price: number | string | null;
  image_url: string | null;
  stock: number | null;
  is_active: boolean | null;
  created_at: string | null;
};

export type ProductQueryResult = {
  products: Product[];
  error: string | null;
};

const productFields =
  "id, shop_id, name, description, price, image_url, stock, is_active, created_at";

export const mapProductRow = (row: ProductRow): Product => ({
  id: row.id,
  shopId: row.shop_id ?? undefined,
  name: row.name,
  description: row.description ?? "",
  price: Number(row.price ?? 0),
  imageUrl: row.image_url ?? "",
  category: "สินค้า",
  stock: row.stock ?? 0,
  sold: 0,
  status: row.is_active ? "active" : "draft",
  isActive: row.is_active ?? false,
  createdAt: row.created_at ?? undefined,
});

const missingConfigMessage =
  "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local";

export async function getSupabaseProducts({
  activeOnly = false,
}: {
  activeOnly?: boolean;
} = {}): Promise<ProductQueryResult> {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();

  if (!supabaseUrl || !supabasePublishableKey) {
    return { products: [], error: missingConfigMessage };
  }

  const supabase = createSupabaseClient();
  let query = supabase
    .from("products")
    .select(productFields)
    .order("created_at", { ascending: false });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    return { products: [], error: error.message };
  }

  return {
    products: (data ?? []).map((row) => mapProductRow(row as ProductRow)),
    error: null,
  };
}
