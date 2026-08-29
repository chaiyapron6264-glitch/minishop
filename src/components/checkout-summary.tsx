"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { mapProductRow } from "@/data/products";
import { formatCurrency } from "@/lib/format";
import { notifySellerOrder } from "@/lib/line-notifications";
import { generateOrderNumber } from "@/lib/order-number";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { Product } from "@/types/shop";

type ProductRow = Parameters<typeof mapProductRow>[0];

export function CheckoutSummary() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("product");
  const rawQuantity = searchParams.get("quantity");
  const parsedQuantity = Number(rawQuantity ?? 1);
  const requestedQuantity =
    Number.isFinite(parsedQuantity) && parsedQuantity > 0
      ? Math.floor(parsedQuantity)
      : 1;
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      if (!productId) {
        setIsLoading(false);
        setError("ไม่พบรหัสสินค้าในลิงก์สั่งซื้อ");
        return;
      }

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

        setProduct(mapProductRow(data as ProductRow));
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

  const quantity = product
    ? Math.min(Math.max(1, requestedQuantity), Math.max(1, product.stock))
    : requestedQuantity;
  const total = useMemo(
    () => (product ? product.price * quantity : 0),
    [product, quantity],
  );

  const createOrder = async () => {
    if (isSubmitting || !productId) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: latestProductData, error: latestProductError } =
        await supabase
          .from("products")
          .select(
            "id, shop_id, name, description, price, image_url, stock, is_active, created_at",
          )
          .eq("id", productId)
          .maybeSingle();

      if (latestProductError) {
        throw new Error(latestProductError.message);
      }

      if (!latestProductData) {
        throw new Error("ไม่พบสินค้า");
      }

      const latestProduct = mapProductRow(latestProductData as ProductRow);

      if (!latestProduct.isActive) {
        throw new Error("สินค้ายังไม่เปิดขาย");
      }

      if (!latestProduct.shopId) {
        throw new Error("ไม่พบร้านค้าของสินค้า");
      }

      if (quantity < 1) {
        throw new Error("จำนวนสินค้าต้องมากกว่า 0");
      }

      if (quantity > latestProduct.stock) {
        throw new Error("จำนวนสินค้าในสต๊อกไม่เพียงพอ");
      }

      const unitPrice = latestProduct.price;
      const subtotal = unitPrice * quantity;
      const totalAmount = subtotal;

      const { data: customer, error: customerError } = await supabase
        .from("profiles")
        .select("id")
        .eq("line_user_id", "TEMP_CUSTOMER_001")
        .limit(1)
        .maybeSingle();

      if (customerError) {
        throw new Error(customerError.message);
      }

      if (!customer?.id) {
        throw new Error("ไม่พบข้อมูลลูกค้าชั่วคราว");
      }

      let createdOrder: { id: string; order_number: string } | null = null;
      let lastOrderError: Error | null = null;

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const { data, error } = await supabase
          .from("orders")
          .insert({
            order_number: generateOrderNumber(),
            shop_id: latestProduct.shopId,
            customer_id: customer.id,
            total_amount: totalAmount,
            order_status: "pending",
            payment_status: "unpaid",
            customer_note: note.trim() || null,
          })
          .select("id, order_number")
          .single();

        if (!error && data) {
          createdOrder = data as { id: string; order_number: string };
          lastOrderError = null;
          break;
        }

        lastOrderError = new Error(error?.message ?? "สร้างคำสั่งซื้อไม่สำเร็จ");
      }

      if (!createdOrder) {
        throw lastOrderError ?? new Error("สร้างคำสั่งซื้อไม่สำเร็จ");
      }

      const { error: itemError } = await supabase.from("order_items").insert({
        order_id: createdOrder.id,
        product_id: latestProduct.id,
        product_name: latestProduct.name,
        quantity,
        unit_price: unitPrice,
        subtotal,
      });

      if (itemError) {
        throw new Error(itemError.message);
      }

      const { error: paymentError } = await supabase.from("payments").insert({
        order_id: createdOrder.id,
        amount: totalAmount,
        payment_method: "promptpay",
        status: "pending",
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      const nextStock = latestProduct.stock - quantity;
      const { data: stockUpdateData, error: stockUpdateError } = await supabase
        .from("products")
        .update({ stock: nextStock })
        .eq("id", latestProduct.id)
        .eq("stock", latestProduct.stock)
        .select("id")
        .maybeSingle();

      if (stockUpdateError) {
        throw new Error(stockUpdateError.message);
      }

      if (!stockUpdateData) {
        throw new Error("สต๊อกสินค้าเปลี่ยนแปลง กรุณาลองอีกครั้ง");
      }

      try {
        await notifySellerOrder({
          orderId: createdOrder.id,
          notificationType: "new_order",
        });
      } catch (notificationError) {
        console.error("LINE new order notification failed", notificationError);
      }

      router.push(`/orders/${createdOrder.id}`);
    } catch (caughtError) {
      console.error("Create order failed", caughtError);
      setError(
        caughtError instanceof Error ? caughtError.message : "เกิดข้อผิดพลาด",
      );
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState label="กำลังโหลดคำสั่งซื้อ" />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (notFound || !product) {
    return <ErrorState title="ไม่พบสินค้า" message="สินค้านี้ไม่มีอยู่ในระบบ" />;
  }

  if (!product.isActive) {
    return (
      <ErrorState
        title="สินค้ายังไม่เปิดขาย"
        message="สินค้านี้ยังไม่พร้อมให้ลูกค้าสั่งซื้อ"
      />
    );
  }

  if (product.stock <= 0) {
    return <ErrorState title="สินค้าหมด" message="ไม่สามารถสั่งซื้อสินค้านี้ได้" />;
  }

  return (
    <section className="mt-6 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm shadow-zinc-100">
      {error ? <ErrorState title="เกิดข้อผิดพลาด" message={error} /> : null}
      <div className="flex gap-4">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="size-24 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex size-24 items-center justify-center rounded-2xl bg-emerald-50 text-xs font-bold text-emerald-700">
            MiniShop
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-black text-zinc-950">{product.name}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {formatCurrency(product.price)} x {quantity}
          </p>
          <p className="mt-3 text-lg font-black text-zinc-950">
            {formatCurrency(total)}
          </p>
        </div>
      </div>

      <label className="mt-6 block">
        <span className="text-sm font-bold text-zinc-700">
          หมายเหตุถึงร้านค้า
        </span>
        <textarea
          className="mt-2 min-h-28 w-full rounded-2xl border border-zinc-200 p-4 outline-none focus:border-emerald-500"
          placeholder="เช่น ขอรับสินค้าวันเสาร์"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>

      <div className="mt-6 border-t border-zinc-100 pt-5">
        <div className="flex items-center justify-between text-lg font-black text-zinc-950">
          <span>ยอดรวม</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <button
          type="button"
          className="mt-5 block w-full rounded-full bg-emerald-500 px-6 py-4 text-center text-sm font-black text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
          disabled={isSubmitting}
          onClick={createOrder}
        >
          {isSubmitting ? "กำลังสร้างคำสั่งซื้อ..." : "ยืนยันคำสั่งซื้อ"}
        </button>
      </div>
    </section>
  );
}
