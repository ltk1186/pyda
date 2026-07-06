import Link from "next/link";

const navigation = [
  { label: "대시보드", href: "/admin", enabled: true },
  { label: "크리에이터", href: "/admin/creators", enabled: true },
  { label: "광고 상품", href: null, enabled: false },
  { label: "광고 요청", href: "/admin/requests", enabled: true },
  { label: "결제 및 정산", href: null, enabled: false },
];

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white lg:hidden">
        <div className="px-4 py-4">
          <Link className="text-base font-semibold" href="/admin">
            Pyda Admin
          </Link>
          <nav className="mt-3 flex gap-4 overflow-x-auto text-sm">
            {navigation.map((item) =>
              item.href ? (
                <Link
                  className="whitespace-nowrap text-neutral-700 hover:text-neutral-950"
                  href={item.href}
                  key={item.label}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="whitespace-nowrap text-neutral-400"
                  key={item.label}
                >
                  {item.label}
                </span>
              ),
            )}
          </nav>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden min-h-screen w-64 border-r border-neutral-200 bg-white px-5 py-6 lg:block">
          <Link className="text-lg font-semibold" href="/admin">
            Pyda Admin
          </Link>
          <nav className="mt-8 space-y-1 text-sm">
            {navigation.map((item) =>
              item.href ? (
                <Link
                  className="block rounded-md px-3 py-2 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950"
                  href={item.href}
                  key={item.label}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="block rounded-md px-3 py-2 text-neutral-400"
                  key={item.label}
                >
                  {item.label}
                </span>
              ),
            )}
          </nav>
        </aside>
        <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
