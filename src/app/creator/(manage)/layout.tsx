import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { label: "홈", href: "/creator" },
  { label: "프로필", href: "/creator/profile" },
  { label: "내 광고 상품", href: "/creator/listings" },
];

export default function CreatorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="brand-page min-h-screen text-neutral-950">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link className="text-lg font-semibold tracking-tight" href="/">
            Pyda
          </Link>
          <nav className="flex gap-4 text-sm text-neutral-600">
            {navItems.map((item) => (
              <Link
                className="font-medium hover:text-neutral-950"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}
