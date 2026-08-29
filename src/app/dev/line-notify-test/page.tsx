"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  type LineNotificationType,
  notifySellerOrder,
} from "@/lib/line-notifications";

const isNotificationType = (value: string): value is LineNotificationType =>
  value === "new_order" || value === "payment_submitted";

const isDevelopment = process.env.NODE_ENV === "development";

export default function LineNotifyTestPage() {
  const searchParams = useSearchParams();
  const hasRun = useRef(false);
  const [result, setResult] = useState(
    isDevelopment ? "รอเริ่มทดสอบ" : "หน้านี้ใช้สำหรับทดสอบในเครื่องเท่านั้น",
  );

  useEffect(() => {
    if (hasRun.current) {
      return;
    }

    if (!isDevelopment) {
      return;
    }

    const orderId = searchParams.get("orderId") ?? "";
    const notificationTypeParam = searchParams.get("notificationType") ?? "";
    const shouldSend = searchParams.get("send") === "1";

    if (!shouldSend) {
      queueMicrotask(() => setResult("เพิ่ม send=1 เพื่อส่งแจ้งเตือนทดสอบ"));
      return;
    }

    if (!orderId || !isNotificationType(notificationTypeParam)) {
      queueMicrotask(() => setResult("ข้อมูลทดสอบไม่ถูกต้อง"));
      return;
    }

    const runKey = `line-notify-test:${orderId}:${notificationTypeParam}`;

    if (sessionStorage.getItem(runKey) === "sent") {
      queueMicrotask(() => setResult("ข้ามการส่งซ้ำใน browser session นี้"));
      return;
    }

    hasRun.current = true;
    sessionStorage.setItem(runKey, "sent");
    queueMicrotask(() => setResult("กำลังส่งแจ้งเตือนทดสอบ..."));

    // LOCAL DEVELOPMENT WORKAROUND:
    // This temporary page lets the browser load Supabase data before sending a
    // structured payload to the server API. Remove it after server-side Supabase
    // loading works in the deployed environment.
    notifySellerOrder({
      orderId,
      notificationType: notificationTypeParam,
    }).then((response) => {
      setResult(
        [
          `success=${response.success}`,
          `LINE_HTTP_STATUS=${response.lineStatus ?? "NOT_REACHED"}`,
          `LINE_ERROR_RESPONSE=${response.lineErrorResponse ?? ""}`,
          `error=${response.error ?? ""}`,
        ].join("\n"),
      );
    });
  }, [searchParams]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 bg-white px-5 py-8 text-slate-950">
      <p className="text-sm font-semibold text-green-600">
        Local development only
      </p>
      <h1 className="text-2xl font-bold">LINE notification test</h1>
      <pre className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        {result}
      </pre>
    </main>
  );
}
