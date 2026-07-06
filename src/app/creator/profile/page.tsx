import { CreatorProfileForm } from "@/components/creator/profile-form";
import { requireOwnedCreator } from "@/lib/creator/owner";
import { updateCreatorProfile } from "./actions";

export const dynamic = "force-dynamic";

export default async function CreatorProfilePage() {
  const creator = await requireOwnedCreator("/creator/profile");

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">프로필 수정</h1>
      {creator ? (
        <div className="mt-6">
          <CreatorProfileForm action={updateCreatorProfile} creator={creator} />
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-neutral-200 p-6">
          <p className="text-sm text-neutral-600">
            연결된 크리에이터 프로필이 없습니다.
          </p>
        </div>
      )}
    </section>
  );
}
