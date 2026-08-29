import { createSupabaseBrowserClient } from "@/lib/supabase";

export type LineNotificationType = "new_order" | "payment_submitted";

type LineNotificationResult = {
  success: boolean;
  error?: string;
  lineStatus?: number | null;
  lineErrorResponse?: string;
};

type NotifyOrderPayload = {
  notificationType: LineNotificationType;
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    paymentStatus?: string;
    customerNote?: string | null;
  };
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal?: number;
  }[];
  payment: {
    amount: number;
    status: string;
  } | null;
};

const fetchOrderNotificationPayload = async ({
  orderId,
  notificationType,
}: {
  orderId: string;
  notificationType: LineNotificationType;
}): Promise<NotifyOrderPayload> => {
  const supabase = createSupabaseBrowserClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, order_number, total_amount, payment_status, customer_note")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    throw new Error(orderError.message);
  }

  if (!order) {
    throw new Error("Order not found");
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("product_name, quantity, unit_price, subtotal")
    .eq("order_id", orderId);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("amount, status")
    .eq("order_id", orderId)
    .limit(1)
    .maybeSingle();

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  return {
    notificationType,
    order: {
      id: order.id,
      orderNumber: order.order_number,
      totalAmount: Number(order.total_amount),
      paymentStatus: order.payment_status,
      customerNote: order.customer_note,
    },
    items: (items ?? []).map((item) => ({
      productName: item.product_name,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      subtotal: Number(item.subtotal),
    })),
    payment: payment
      ? {
          amount: Number(payment.amount),
          status: payment.status,
        }
      : null,
  };
};

export async function notifySellerOrder({
  orderId,
  notificationType,
}: {
  orderId: string;
  notificationType: LineNotificationType;
}): Promise<LineNotificationResult> {
  try {
    // LOCAL DEVELOPMENT WORKAROUND:
    // Browser-side Supabase can reach the database in Codex local development,
    // while the local Next.js server cannot. After deploying to Vercel, replace
    // this with server-side Supabase loading inside /api/line/notify-order.
    const payload = await fetchOrderNotificationPayload({
      orderId,
      notificationType,
    });

    const response = await fetch("/api/line/notify-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json().catch(() => null)) as {
      success?: boolean;
      error?: string;
      lineStatus?: number | null;
      lineErrorResponse?: string;
    } | null;

    if (!response.ok) {
      const error = result?.error ?? "LINE notification failed";
      console.error("LINE notification failed", {
        orderId,
        notificationType,
        error,
      });

      return {
        success: false,
        error,
        lineStatus: result?.lineStatus,
        lineErrorResponse: result?.lineErrorResponse,
      };
    }

    return {
      success: result?.success ?? true,
      lineStatus: result?.lineStatus,
      lineErrorResponse: result?.lineErrorResponse,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("LINE notification failed", {
      orderId,
      notificationType,
      error: message,
    });

    return { success: false, error: message };
  }
}
