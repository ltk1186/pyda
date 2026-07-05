import Link from "next/link";
import { redirect } from "next/navigation";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { sanitizeNextPath } from "@/lib/auth/redirect";
import { getCurrentUser } from "@/lib/auth/session";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
    error?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = sanitizeNextPath(params.next);
  const user = await getCurrentUser();

  if (user) {
    redirect(nextPath);
  }

  const error = getSingleParam(params.error);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-12 text-neutral-950">
      <section className="w-full max-w-sm">
        <Link className="text-xl font-semibold tracking-tight" href="/">
          Pyda
        </Link>
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">
          광고 진행을 시작하려면 로그인해주세요.
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Google 또는 Kakao 로그인만 사용합니다. 첫 OAuth 로그인이 가입과
          로그인을 대신합니다.
        </p>
        {error ? (
          <p className="mt-4 rounded-md bg-neutral-100 px-3 py-2 text-sm text-neutral-700">
            로그인을 완료하지 못했습니다. 다시 시도해주세요.
          </p>
        ) : null}
        <div className="mt-7">
          <OAuthButtons nextPath={nextPath} />
        </div>
      </section>
    </main>
  );
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
