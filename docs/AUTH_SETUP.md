# Supabase Auth Setup

Manual setup required before real OAuth login can work:

1. In Supabase Dashboard, enable Auth providers:
   - Google
   - Kakao
2. Add provider client IDs and secrets from each provider console.
3. Add redirect URL:
   - Local: `http://localhost:3000/auth/callback`
   - Production: `https://pyda.io/auth/callback`
4. Configure app environment:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The app preserves late-login return paths through `/login?next=...` and validates `next` so only same-site relative paths are accepted.
