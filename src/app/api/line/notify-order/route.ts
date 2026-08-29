import { NextRequest, NextResponse } from "next/server";

type NotificationType = "new_order" | "payment_submitted";

type OrderRow = {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paymentStatus?: string;
  customerNote?: string | null;
};

type OrderItemRow = {
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
};

type PaymentRow = {
  amount: number;
  status: string;
};

type NotifyOrderRequest = {
  notificationType?: unknown;
  order?: {
    id?: unknown;
    orderNumber?: unknown;
    totalAmount?: unknown;
    paymentStatus?: unknown;
    customerNote?: unknown;
  };
  items?: unknown;
  payment?: {
    amount?: unknown;
    status?: unknown;
  } | null;
};

const allowedNotificationTypes = new Set<NotificationType>([
  "new_order",
  "payment_submitted",
]);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);

const getAppUrl = () =>
  (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

const getLineConfig = () => {
  const lineChannelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const lineSellerUserId = process.env.LINE_SELLER_USER_ID;

  return {
    lineChannelAccessToken,
    lineSellerUserId,
    isConfigured: Boolean(lineChannelAccessToken && lineSellerUserId),
  };
};

const createLineLogContext = ({
  lineSellerUserId,
  notificationType,
  orderId,
}: {
  lineSellerUserId: string;
  notificationType: NotificationType;
  orderId: string;
}) => ({
  sellerUserIdStartsWithU: lineSellerUserId.startsWith("U"),
  notificationType,
  orderId,
});

const flexText = (text: string, options?: { weight?: "bold"; size?: string }) => ({
  type: "text",
  text,
  wrap: true,
  ...(options?.weight ? { weight: options.weight } : {}),
  ...(options?.size ? { size: options.size } : {}),
});

const flexLabelValue = (label: string, value: string) => ({
  type: "box",
  layout: "vertical",
  margin: "md",
  contents: [
    flexText(label, { size: "sm" }),
    flexText(value, { weight: "bold" }),
  ],
});

const buildLineMessage = ({
  order,
  items,
  payment,
  notificationType,
}: {
  order: OrderRow;
  items: OrderItemRow[];
  payment: PaymentRow | null;
  notificationType: NotificationType;
}) => {
  const orderUrl = `${getAppUrl()}/orders/${order.id}`;
  const itemLines = items
    .map((item) => `${item.productName} x ${item.quantity}`)
    .join("\n");
  const isPaymentSubmitted = notificationType === "payment_submitted";
  const title = isPaymentSubmitted
    ? "💳 ลูกค้าแจ้งชำระเงินแล้ว"
    : "🔔 มีออเดอร์ใหม่";
  const amount = isPaymentSubmitted
    ? Number(payment?.amount ?? order.totalAmount)
    : Number(order.totalAmount);

  return {
    type: "flex",
    altText: title,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          flexText(title, { weight: "bold", size: "lg" }),
          flexLabelValue("เลขที่คำสั่งซื้อ", order.orderNumber),
          ...(isPaymentSubmitted
            ? [
                flexLabelValue("ยอดที่แจ้งชำระ", formatCurrency(amount)),
                flexLabelValue("สถานะ", "รอตรวจสอบ"),
              ]
            : [
                flexLabelValue("รายการสินค้า", itemLines || "-"),
                flexLabelValue("ยอดรวม", formatCurrency(amount)),
                flexLabelValue("สถานะการชำระเงิน", "ยังไม่ชำระ"),
              ]),
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#22C55E",
            action: {
              type: "uri",
              label: isPaymentSubmitted ? "ตรวจสอบออเดอร์" : "ดูออเดอร์",
              uri: orderUrl,
            },
          },
        ],
      },
    },
  };
};

const toPositiveNumber = (value: unknown) => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
};

const validateNotificationPayload = (body: NotifyOrderRequest) => {
  const notificationType =
    typeof body.notificationType === "string" ? body.notificationType : "";

  if (!allowedNotificationTypes.has(notificationType as NotificationType)) {
    return { error: "Invalid notification request" };
  }

  const order = body.order;

  if (!order || typeof order !== "object") {
    return { error: "Invalid order data" };
  }

  const orderId = typeof order.id === "string" ? order.id.trim() : "";
  const orderNumber =
    typeof order.orderNumber === "string" ? order.orderNumber.trim() : "";
  const totalAmount = toPositiveNumber(order.totalAmount);

  if (!orderId || !orderNumber || totalAmount === null) {
    return { error: "Invalid order data" };
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return { error: "Invalid order items" };
  }

  const items = body.items.map((item) => {
    const itemRecord = item as Record<string, unknown>;
    const productName =
      typeof itemRecord.productName === "string"
        ? itemRecord.productName.trim()
        : "";
    const quantity = toPositiveNumber(itemRecord.quantity);
    const unitPrice = toPositiveNumber(itemRecord.unitPrice);
    const subtotal =
      itemRecord.subtotal === undefined
        ? undefined
        : toPositiveNumber(itemRecord.subtotal);

    if (!productName || quantity === null || unitPrice === null) {
      return null;
    }

    return {
      productName,
      quantity,
      unitPrice,
      ...(subtotal === null ? {} : { subtotal }),
    };
  });

  if (items.some((item) => item === null)) {
    return { error: "Invalid order items" };
  }

  const paymentAmount =
    body.payment === null || body.payment === undefined
      ? null
      : toPositiveNumber(body.payment.amount);

  if (body.payment && paymentAmount === null) {
    return { error: "Invalid payment data" };
  }

  const payment =
    body.payment && paymentAmount !== null
      ? {
          amount: paymentAmount,
          status:
            typeof body.payment.status === "string"
              ? body.payment.status
              : "pending",
        }
      : null;

  return {
    notificationType: notificationType as NotificationType,
    order: {
      id: orderId,
      orderNumber,
      totalAmount,
      paymentStatus:
        typeof order.paymentStatus === "string" ? order.paymentStatus : undefined,
      customerNote:
        typeof order.customerNote === "string" ? order.customerNote : null,
    },
    items: items as OrderItemRow[],
    payment,
  };
};

export async function GET() {
  const { lineChannelAccessToken, lineSellerUserId, isConfigured } =
    getLineConfig();

  return NextResponse.json({
    success: true,
    lineConfigured: isConfigured,
    hasLineChannelAccessToken: Boolean(lineChannelAccessToken),
    hasLineSellerUserId: Boolean(lineSellerUserId),
    appUrlConfigured: Boolean(process.env.NEXT_PUBLIC_APP_URL),
  });
}

export async function POST(request: NextRequest) {
  try {
    const { lineChannelAccessToken, lineSellerUserId, isConfigured } =
      getLineConfig();

    if (!isConfigured || !lineChannelAccessToken || !lineSellerUserId) {
      return NextResponse.json(
        { success: false, error: "LINE notification is not configured" },
        { status: 500 },
      );
    }

    // LOCAL DEVELOPMENT WORKAROUND:
    // The Codex local Next.js server cannot fetch Supabase, so this route accepts
    // a browser-loaded order snapshot. After deployment, replace this with
    // server-side Supabase loading before building the LINE message.
    const body = (await request.json()) as NotifyOrderRequest;
    const validatedPayload = validateNotificationPayload(body);

    if ("error" in validatedPayload) {
      return NextResponse.json(
        { success: false, error: validatedPayload.error },
        { status: 400 },
      );
    }

    const message = buildLineMessage({
      order: validatedPayload.order,
      items: validatedPayload.items,
      payment: validatedPayload.payment,
      notificationType: validatedPayload.notificationType,
    });

    const lineLogContext = createLineLogContext({
      lineSellerUserId,
      notificationType: validatedPayload.notificationType,
      orderId: validatedPayload.order.id,
    });
    let lineResponse: Response;

    try {
      lineResponse = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lineChannelAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: lineSellerUserId,
          messages: [message],
        }),
      });
    } catch (lineError) {
      console.error("LINE push request failed", {
        ...lineLogContext,
        status: null,
        body: lineError instanceof Error ? lineError.message : String(lineError),
      });

      return NextResponse.json(
        {
          success: false,
          error: "LINE notification failed",
          lineStatus: null,
          lineErrorResponse:
            lineError instanceof Error ? lineError.message : String(lineError),
        },
        { status: 502 },
      );
    }

    if (!lineResponse.ok) {
      const lineError = await lineResponse.text();
      console.error("LINE push failed", {
        ...lineLogContext,
        status: lineResponse.status,
        body: lineError,
      });

      return NextResponse.json(
        {
          success: false,
          error: "LINE notification failed",
          lineStatus: lineResponse.status,
          lineErrorResponse: lineError,
        },
        { status: 502 },
      );
    }

    console.log("LINE push succeeded", {
      ...lineLogContext,
      status: lineResponse.status,
    });

    return NextResponse.json({ success: true, lineStatus: lineResponse.status });
  } catch (error) {
    console.error("LINE notification server error", error);

    return NextResponse.json(
      { success: false, error: "Unable to send LINE notification" },
      { status: 500 },
    );
  }
}
