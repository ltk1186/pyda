# Supabase Kakao Auth Setup

Manual setup required before real Kakao login can work.

## Kakao Developers

- Create or select the Kakao app.
- Confirm the REST API key.
- Enable Kakao Login.
- Configure the Kakao Login Client Secret.
- Add Supabase callback URL as a Kakao Redirect URI.

## Supabase

- Enable the Kakao provider.
- Set Kakao Client ID to the Kakao REST API key.
- Set Kakao Client Secret.
- Enable `Allow users without an email` when Kakao email is not required.
- Set the local Site URL.
- Add local redirect URL allow list entries, including:
  - `http://localhost:3000/auth/callback`

The app preserves late-login return paths through `/login?next=...` and validates
`next` so only same-site relative paths are accepted.

Do not store real Kakao keys, client secrets, or Supabase secrets in this file.
