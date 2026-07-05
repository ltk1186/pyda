export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-16">
      <p className="text-sm font-medium text-neutral-500">Pyda MVP</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        프로젝트 기반 준비 완료
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
        이 화면은 제품 UI가 아니라 Next.js App Router, Tailwind CSS,
        shadcn/ui, Supabase, Cloudflare Workers 배포 기반을 확인하기 위한
        최소 플레이스홀더입니다.
      </p>
    </main>
  );
}
