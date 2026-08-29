import { createQrMatrix } from "@/lib/qr-code";

export function QrCode({ value }: { value: string }) {
  const modules = createQrMatrix(value);
  const quietZone = 4;
  const size = modules.length + quietZone * 2;

  return (
    <svg
      className="size-[280px] rounded-2xl bg-white p-3"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="PromptPay QR"
    >
      <rect width={size} height={size} fill="white" />
      {modules.map((row, y) =>
        row.map((isDark, x) =>
          isDark ? (
            <rect
              key={`${x}-${y}`}
              x={x + quietZone}
              y={y + quietZone}
              width="1"
              height="1"
              fill="#18181b"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
