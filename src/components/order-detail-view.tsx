"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { formatCurrency } from "@/lib/format";
import { createSupabaseBrowserClient } from "@/lib/supabase";

type OrderRow = {
  id: string;
  order_number: string;
  total_amount: number | string;
  order_status: string;
  payment_status: string;
  customer_note: string | null;
};

type OrderItemRow = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number | string;
  subtotal: number | string;
};

type PaymentRow = {
  id: string;
  amount: number | string;
  payment_method: string;
  status: string;
};

const orderStatusLabel: Record<string, string> = {
  pending: "รอยืนยัน",
  paid: "ชำระแล้ว",
  shipping: "กำลังจัดส่ง",
  completed: "สำเร็จ",
  cancelled: "ยกเลิก",
};

const paymentStatusLabel: Record<string, string> = {
  unpaid: "ยังไม่ชำระ",
  pending: "รอตรวจสอบ",
  paid: "ชำระแล้ว",
  failed: "ชำระไม่สำเร็จ",
};

export function OrderDetailView({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [payment, setPayment] = useState<PaymentRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      try {
        setIsLoading(true);
        setError(null);

        const supabase = createSupabaseBrowserClient();
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select(
            "id, order_number, total_amount, order_status, payment_status, customer_note",
          )
          .eq("id", orderId)
          .maybeSingle();

        if (orderError) {
          throw new Error(orderError.message);
        }

        if (!orderData) {
          throw new Error("ไม่พบคำสั่งซื้อนี้");
        }

        const { data: itemData, error: itemError } = await supabase
          .from("order_items")
          .select("id, product_name, quantity, unit_price, subtotal")
          .eq("order_id", orderId);

        if (itemError) {
          throw new Error(itemError.message);
        }

        const { data: paymentData, error: paymentError } = await supabase
          .from("payments")
          .select("id, amount, payment_method, status")
          .eq("order_id", orderId)
          .limit(1)
          .maybeSingle();

        if (paymentError) {
          throw new Error(paymentError.message);
        }

        if (!isMounted) {
          return;
        }

        setOrder(orderData as OrderRow);
        setItems((itemData ?? []) as OrderItemRow[]);
        setPayment((paymentData as PaymentRow | null) ?? null);
      } catch (caughtError) {
        console.error("Order detail load failed", caughtError);

        if (!isMounted) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "เกิดข้อผิดพลาด",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadOrder();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (isLoading) {
    return <LoadingState label="กำลังโหลดคำสั่งซื้อ" />;
  }

  if (error || !order) {
    return <ErrorState title="เกิดข้อผิดพลาด" message={error ?? "ไม่พบคำสั่งซื้อ"} />;
  }

  return (
    <>
      <section className="mt-6 space-y-5 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm shadow-zinc-100">
        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-sm font-bold text-emerald-700">เลขที่คำสั่งซื้อ</p>
          <p className="mt-1 text-xl font-black text-zinc-950">
            {order.order_number}
          </p>
        </div>

        <div>
          <h2 className="text-lg font-black text-zinc-950">รายการสินค้า</h2>
          <div className="mt-3 divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <div>
                  <p className="font-black text-zinc-950">
                    {item.product_name}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {formatCurrency(Number(item.unit_price))} x {item.quantity}
                  </p>
                </div>
                <p className="font-black text-zinc-950">
                  {formatCurrency(Number(item.subtotal))}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-100 pt-4 text-lg">
          <span className="font-black text-zinc-950">ยอดรวม</span>
          <span className="font-black text-emerald-600">
            {formatCurrency(Number(order.total_amount))}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-sm text-zinc-500">สถานะคำสั่งซื้อ</p>
            <p className="mt-1 font-black text-zinc-950">
              {orderStatusLabel[order.order_status] ?? order.order_status}
            </p>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-sm text-zinc-500">สถานะการชำระเงิน</p>
            <p className="mt-1 font-black text-zinc-950">
              {paymentStatusLabel[order.payment_status] ??
                paymentStatusLabel[payment?.status ?? ""] ??
                order.payment_status}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-zinc-50 p-4">
          <p className="text-sm text-zinc-500">หมายเหตุถึงร้าน</p>
          <p className="mt-1 font-semibold text-zinc-950">
            {order.customer_note || "-"}
          </p>
        </div>

        <Link
          href={`/orders/${order.id}/payment`}
          className="block w-full rounded-full bg-emerald-500 px-6 py-4 text-center text-sm font-black text-white hover:bg-emerald-600"
        >
          ไปขั้นตอนชำระเงิน
        </Link>
      </section>
    </>
  );
}
