# Kakao OIDC Auth Setup

Manual setup required before real Kakao login can work.

The app starts Kakao authorization directly from a server route. The flow is:

```text
Kakao authorization code
-> Kakao token exchange
-> Kakao OIDC ID token
-> Supabase signInWithIdToken
```

## Environment

Set these values locally and in deployment secrets:

- `APP_BASE_URL`
- `KAKAO_REST_API_KEY`
- `KAKAO_CLIENT_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

`APP_BASE_URL` is the single source for the Kakao callback URL:

```text
{APP_BASE_URL}/auth/kakao/callback
```

Do not put real Kakao keys or Supabase secrets in this document.

## Kakao Developers

- Enable Kakao Login.
- Enable OpenID Connect.
- Use nickname consent.
- Use profile image consent.
- Do not request `account_email`.
- Add the custom redirect URI:
  - Local: `http://localhost:3000/auth/kakao/callback`
  - Production: `{production APP_BASE_URL}/auth/kakao/callback`

## Supabase

- Enable the Kakao provider.
- Set Kakao Client ID to the Kakao REST API key.
- Set Kakao Client Secret.
- Enable `Allow users without an email`.
- Set the local Site URL.
- Add local redirect allow list entries for app routes as needed.

The app preserves late-login return paths through `/login?next=...`, stores the
OAuth intent in short-lived HttpOnly cookies, and validates `next` so only
same-site relative paths are accepted.
