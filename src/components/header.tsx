import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-black text-white">
            M
          </span>
          <span>
            <span className="block text-lg font-black text-zinc-950">
              MiniShop
            </span>
            <span className="block text-xs font-medium text-zinc-500">
              ร้านค้าพร้อมขายบนมือถือ
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-2 text-sm font-semibold text-zinc-600 sm:flex">
          <Link className="rounded-full px-4 py-2 hover:bg-zinc-100" href="/">
            หน้าร้าน
          </Link>
          <Link
            className="rounded-full px-4 py-2 hover:bg-zinc-100"
            href="/seller"
          >
            ผู้ขาย
          </Link>
          <Link
            className="rounded-full bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600"
            href="/seller/products/new"
          >
            เพิ่มสินค้า
          </Link>
        </nav>
      </div>
    </header>
  );
}
