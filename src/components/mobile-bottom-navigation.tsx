"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "หน้าร้าน", icon: "⌂" },
  { href: "/seller", label: "ยอดขาย", icon: "฿" },
  { href: "/seller/products", label: "สินค้า", icon: "□" },
  { href: "/checkout", label: "ตะกร้า", icon: "+" },
];

export function MobileBottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-100 bg-white/95 px-3 pb-3 pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
      <div className="grid grid-cols-4 gap-1">
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-12 flex-col items-center justify-center rounded-2xl text-xs font-bold transition ${
                isActive
                  ? "bg-emerald-50 text-emerald-600"
                  : "text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span className="mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
