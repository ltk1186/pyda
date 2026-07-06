import Link from "next/link";
import { createAdminCreator } from "@/app/admin/creators/actions";
import { AdminCreatorForm } from "@/components/admin/creator-form";
import { requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminNewCreatorPage() {
  await requireAdmin("/admin/creators/new");

  return (
    <main>
      <Link
        className="text-sm text-neutral-600 hover:text-neutral-950"
        href="/admin/creators"
      >
        크리에이터 목록
      </Link>
      <div className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          크리에이터 추가
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          실제 이미지 업로드와 계정 연결은 이후 단계에서 처리합니다.
        </p>
      </div>

      <div className="mt-6 max-w-3xl">
        <AdminCreatorForm action={createAdminCreator} submitLabel="생성" />
      </div>
    </main>
  );
}
