export type PromptPayPayloadDetails = {
  normalizedTarget: string;
  maskedTarget: string;
  amount: string;
  payload: string;
  crc: string;
  validation: PromptPayValidation;
};

export type PromptPayValidation = {
  isValid: boolean;
  payloadStartsValid: boolean;
  pointOfInitiationMethodValid: boolean;
  merchantAccountExists: boolean;
  promptPayAidValid: boolean;
  mobileIdentifierLengthValid: boolean;
  currencyValid: boolean;
  amountValid: boolean;
  countryValid: boolean;
  crcValid: boolean;
  errors: string[];
};

type TlvField = {
  tag: string;
  length: number;
  value: string;
};

export const emv = (tag: string, value: string) => {
  if (!/^\d{2}$/.test(tag)) {
    throw new Error("EMV tag must be two digits");
  }

  if (value.length > 99) {
    throw new Error("EMV value is too long");
  }

  return `${tag}${String(value.length).padStart(2, "0")}${value}`;
};

export const crc16CcittFalse = (value: string) => {
  let crc = 0xffff;

  for (let index = 0; index < value.length; index += 1) {
    crc ^= value.charCodeAt(index) << 8;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
};

export const normalizePromptPayPhone = (phone: string) => {
  const digits = phone.replace(/[\s-]/g, "");

  if (!/^\d+$/.test(digits)) {
    throw new Error("หมายเลข PromptPay ต้องเป็นตัวเลขเท่านั้น");
  }

  const normalized = digits.startsWith("0") ? `0066${digits.slice(1)}` : digits;

  if (!/^\d{13}$/.test(normalized) || !normalized.startsWith("0066")) {
    throw new Error("หมายเลข PromptPay ต้องเป็นเบอร์มือถือไทยรูปแบบ 08xxxxxxxx");
  }

  return normalized;
};

const maskPromptPayTarget = (target: string) =>
  `${target.slice(0, 6)}***${target.slice(-3)}`;

const formatAmount = (amount: number) => {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("ยอดชำระไม่ถูกต้อง");
  }

  return amount.toFixed(2);
};

const parseTlv = (payload: string) => {
  const fields: TlvField[] = [];
  let index = 0;

  while (index < payload.length) {
    const tag = payload.slice(index, index + 2);
    const rawLength = payload.slice(index + 2, index + 4);
    const length = Number(rawLength);
    const valueStart = index + 4;
    const valueEnd = valueStart + length;

    if (!/^\d{2}$/.test(tag) || !/^\d{2}$/.test(rawLength)) {
      break;
    }

    fields.push({
      tag,
      length,
      value: payload.slice(valueStart, valueEnd),
    });

    index = valueEnd;
  }

  return fields;
};

const getField = (fields: TlvField[], tag: string) =>
  fields.find((field) => field.tag === tag);

export function generatePromptPayPayload({
  phone,
  amount,
}: {
  phone: string;
  amount: number;
}) {
  if (!phone.trim()) {
    throw new Error("ยังไม่ได้ตั้งค่า NEXT_PUBLIC_PROMPTPAY_PHONE");
  }

  const normalizedTarget = normalizePromptPayPhone(phone);
  const formattedAmount = formatAmount(amount);
  const merchantAccountInfo = emv(
    "29",
    [emv("00", "A000000677010111"), emv("01", normalizedTarget)].join(""),
  );
  const payloadWithoutCrc = [
    emv("00", "01"),
    emv("01", "12"),
    merchantAccountInfo,
    emv("53", "764"),
    emv("54", formattedAmount),
    emv("58", "TH"),
    "6304",
  ].join("");
  const crc = crc16CcittFalse(payloadWithoutCrc);

  return `${payloadWithoutCrc}${crc}`;
}

export function validatePromptPayPayload({
  payload,
  amount,
}: {
  payload: string;
  amount: number;
}): PromptPayValidation {
  const expectedAmount = formatAmount(amount);
  const errors: string[] = [];
  const fields = parseTlv(payload);
  const merchantAccount = getField(fields, "29");
  const merchantFields = merchantAccount ? parseTlv(merchantAccount.value) : [];
  const aid = getField(merchantFields, "00");
  const mobile = getField(merchantFields, "01");
  const currency = getField(fields, "53");
  const amountField = getField(fields, "54");
  const country = getField(fields, "58");
  const crcField = getField(fields, "63");
  const payloadWithoutCrc = payload.slice(0, -4);
  const calculatedCrc = crc16CcittFalse(payloadWithoutCrc);

  const validation = {
    payloadStartsValid: payload.startsWith("000201"),
    pointOfInitiationMethodValid: getField(fields, "01")?.value === "12",
    merchantAccountExists: Boolean(merchantAccount),
    promptPayAidValid: aid?.value === "A000000677010111",
    mobileIdentifierLengthValid: /^\d{13}$/.test(mobile?.value ?? ""),
    currencyValid: currency?.value === "764",
    amountValid: amountField?.value === expectedAmount,
    countryValid: country?.value === "TH",
    crcValid: Boolean(crcField) && crcField?.value === calculatedCrc,
  };

  if (!validation.payloadStartsValid) errors.push("Payload Format Indicator ไม่ถูกต้อง");
  if (!validation.pointOfInitiationMethodValid) errors.push("Point of Initiation Method ไม่ถูกต้อง");
  if (!validation.merchantAccountExists) errors.push("ไม่พบ PromptPay Merchant Account");
  if (!validation.promptPayAidValid) errors.push("PromptPay AID ไม่ถูกต้อง");
  if (!validation.mobileIdentifierLengthValid) errors.push("หมายเลข PromptPay ไม่ถูกต้อง");
  if (!validation.currencyValid) errors.push("สกุลเงินไม่ถูกต้อง");
  if (!validation.amountValid) errors.push("ยอดชำระใน QR ไม่ตรงกับคำสั่งซื้อ");
  if (!validation.countryValid) errors.push("ประเทศไม่ถูกต้อง");
  if (!validation.crcValid) errors.push("CRC ไม่ถูกต้อง");

  return {
    ...validation,
    isValid: errors.length === 0,
    errors,
  };
}

export function getPromptPayPayloadDetails({
  phone,
  amount,
}: {
  phone: string;
  amount: number;
}): PromptPayPayloadDetails {
  const normalizedTarget = normalizePromptPayPhone(phone);
  const payload = generatePromptPayPayload({ phone, amount });
  const validation = validatePromptPayPayload({ payload, amount });

  return {
    normalizedTarget,
    maskedTarget: maskPromptPayTarget(normalizedTarget),
    amount: formatAmount(amount),
    payload,
    crc: payload.slice(-4),
    validation,
  };
}
