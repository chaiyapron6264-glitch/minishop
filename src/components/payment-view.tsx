"use client";

import { useEffect, useMemo, useState } from "react";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { QrCode } from "@/components/qr-code";
import { formatCurrency } from "@/lib/format";
import { notifySellerOrder } from "@/lib/line-notifications";
import { getPromptPayPayloadDetails } from "@/lib/promptpay";
import { createSupabaseBrowserClient } from "@/lib/supabase";

type OrderRow = {
  id: string;
  order_number: string;
  order_status: string;
  payment_status: string;
};

type PaymentRow = {
  id: string;
  amount: number | string;
  status: string;
};

const paymentStatusLabel: Record<string, string> = {
  pending: "รอการชำระเงิน",
  verifying: "รอตรวจสอบการชำระเงิน",
  paid: "ชำระเงินแล้ว",
  failed: "การชำระเงินมีปัญหา",
};

export function PaymentView({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [payment, setPayment] = useState<PaymentRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPayment() {
      try {
        setIsLoading(true);
        setError(null);

        const supabase = createSupabaseBrowserClient();
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("id, order_number, order_status, payment_status")
          .eq("id", orderId)
          .maybeSingle();

        if (orderError) {
          throw new Error(orderError.message);
        }

        if (!orderData) {
          throw new Error("ไม่พบคำสั่งซื้อนี้");
        }

        if ((orderData as OrderRow).order_status === "cancelled") {
          throw new Error("คำสั่งซื้อนี้ถูกยกเลิกแล้ว");
        }

        const { data: paymentData, error: paymentError } = await supabase
          .from("payments")
          .select("id, amount, status")
          .eq("order_id", orderId)
          .limit(1)
          .maybeSingle();

        if (paymentError) {
          throw new Error(paymentError.message);
        }

        if (!paymentData) {
          throw new Error("ไม่พบข้อมูลการชำระเงิน");
        }

        if (Number((paymentData as PaymentRow).amount) <= 0) {
          throw new Error("ยอดชำระไม่ถูกต้อง");
        }

        if (!isMounted) {
          return;
        }

        setOrder(orderData as OrderRow);
        setPayment(paymentData as PaymentRow);
      } catch (caughtError) {
        console.error("Payment load failed", caughtError);

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

    void loadPayment();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const promptPayPhone = process.env.NEXT_PUBLIC_PROMPTPAY_PHONE ?? "";
  const amount = Number(payment?.amount ?? 0);
  const qrPayloadResult = useMemo(() => {
    if (!payment) {
      return {
        payload: "",
        normalizedTarget: "",
        maskedTarget: "",
        amount: "",
        crc: "",
        validation: null,
        error: null,
      };
    }

    try {
      const payloadDetails = getPromptPayPayloadDetails({
        phone: promptPayPhone,
        amount,
      });

      return {
        payload: payloadDetails.payload,
        normalizedTarget: payloadDetails.normalizedTarget,
        maskedTarget: payloadDetails.maskedTarget,
        amount: payloadDetails.amount,
        crc: payloadDetails.crc,
        validation: payloadDetails.validation,
        error: null,
      };
    } catch (caughtError) {
      return {
        payload: "",
        normalizedTarget: "",
        maskedTarget: "",
        amount: "",
        crc: "",
        validation: null,
        error:
          caughtError instanceof Error
            ? caughtError.message
            : "สร้าง QR ไม่สำเร็จ",
      };
    }
  }, [amount, payment, promptPayPhone]);

  const confirmPayment = async () => {
    if (isSubmitting || !order || !payment) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: paymentError } = await supabase
        .from("payments")
        .update({ status: "verifying" })
        .eq("id", payment.id);

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      const { error: orderError } = await supabase
        .from("orders")
        .update({ payment_status: "pending_verification" })
        .eq("id", order.id);

      if (orderError) {
        throw new Error(orderError.message);
      }

      try {
        await notifySellerOrder({
          orderId: order.id,
          notificationType: "payment_submitted",
        });
      } catch (notificationError) {
        console.error(
          "LINE payment submitted notification failed",
          notificationError,
        );
      }

      setPayment({ ...payment, status: "verifying" });
      setOrder({ ...order, payment_status: "pending_verification" });
      setSuccessMessage(true);
    } catch (caughtError) {
      console.error("Payment confirmation failed", caughtError);
      setError(
        caughtError instanceof Error ? caughtError.message : "เกิดข้อผิดพลาด",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState label="กำลังโหลดข้อมูลชำระเงิน" />;
  }

  if (error || !order || !payment) {
    return <ErrorState title="เกิดข้อผิดพลาด" message={error ?? "ไม่พบข้อมูล"} />;
  }

  if (qrPayloadResult.error || !qrPayloadResult.validation?.isValid) {
    return (
      <ErrorState
        title="สร้าง PromptPay QR ไม่สำเร็จ"
        message={
          qrPayloadResult.error ||
          qrPayloadResult.validation?.errors.join(", ") ||
          "Payload ไม่ถูกต้อง"
        }
      />
    );
  }

  const isPaid = payment.status === "paid";

  return (
    <section className="mt-6 space-y-5 rounded-2xl border border-zinc-100 bg-white p-5 text-center shadow-sm shadow-zinc-100">
      {successMessage ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          แจ้งชำระเงินเรียบร้อย รอร้านค้าตรวจสอบ
        </div>
      ) : null}

      {isPaid ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          ชำระเงินแล้ว
        </div>
      ) : null}

      <div>
        <p className="text-sm font-bold text-emerald-700">เลขที่คำสั่งซื้อ</p>
        <p className="mt-1 text-xl font-black text-zinc-950">
          {order.order_number}
        </p>
      </div>

      <div>
        <p className="text-sm text-zinc-500">ยอดที่ต้องชำระ</p>
        <p className="mt-1 text-3xl font-black text-emerald-600">
          {formatCurrency(amount)}
        </p>
      </div>

      <div className="flex justify-center rounded-[2rem] bg-zinc-50 p-5">
        <QrCode value={qrPayloadResult.payload} />
      </div>

      <div>
        <p className="text-lg font-black text-zinc-950">PromptPay</p>
        <p className="mt-1 text-sm font-bold text-zinc-600">
          ยอดชำระ {formatCurrency(amount)}
        </p>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          กรุณาตรวจสอบยอดเงินก่อนชำระ
        </p>
      </div>

      <div className="rounded-2xl bg-zinc-50 p-4">
        <p className="text-sm text-zinc-500">สถานะการชำระเงิน</p>
        <p className="mt-1 font-black text-zinc-950">
          {paymentStatusLabel[payment.status] ?? payment.status}
        </p>
      </div>

      {!isPaid ? (
        <button
          type="button"
          className="block w-full rounded-full bg-emerald-500 px-6 py-4 text-center text-sm font-black text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
          disabled={isSubmitting || payment.status === "verifying"}
          onClick={confirmPayment}
        >
          {isSubmitting ? "กำลังแจ้งชำระเงิน..." : "ฉันชำระเงินแล้ว"}
        </button>
      ) : null}
    </section>
  );
}
