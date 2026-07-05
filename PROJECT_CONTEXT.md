# Pyda MVP Project Context

## Source Of Truth

`README.md` is the agreed detailed MVP development specification. Always read it before implementation work and use it as the primary decision document.

`PROJECT_CONTEXT.md` is only a quick context aid. It does not replace, shorten, or override `README.md`. If this file conflicts with `README.md`, follow `README.md`.

## Product

Pyda is a creator advertising marketplace where creators register ad inventory and pricing, and advertisers browse listings directly to start paid campaigns.

The core validation question is:

> Will advertisers see a creator's ad inventory and pay real money to transact?

The MVP goal is first real transaction and GMV, not a complete platform.

## Product Principle

Public marketplace UI:

- Instagram-like visual feel
- Airbnb-like browsing and transaction structure

Core expression:

> 누가, 어디에, 무엇을, 얼마에 해주는가.

CTA:

> 관심 있는 광고가 있으신가요? 처음부터 끝까지 직접 진행을 도와드립니다.

Users can view all listings without login. Login is first required when they click `광고 진행하기`.

## MVP Structure

Keep three areas inside one Next.js app:

- Public marketplace
- Creator management area
- Admin console

Use one codebase, one deployment, and one Supabase project.

## Core Flow

방문 -> 광고 상품 탐색 -> 상품 상세 확인 -> 광고 진행하기 -> Google 또는 Kakao 로그인 -> 광고 요청 -> 관리자에게 알림 -> 관리자가 직접 크리에이터와 조율 -> 결제 가능 상태 -> Toss Payments 결제 -> 광고 집행 -> 완료 및 정산

Initial operations are concierge-led. Admin-managed transaction operation is more important than automation.

## Creator Onboarding

At first, admins can create creators and listings on behalf of creators.

Admins generate onboarding links and send them to creators. When a creator logs in with Google or Kakao through the claim link, the pre-created creator profile and listings are attached to that account.

## Founding Creator

Within 100 days of official launch, a creator becomes a permanent Founding Creator if all conditions are met:

- Direct onboarding completed
- At least one published listing
- Final admin approval

Default platform fee is 15%. Founding Creators receive an additional 5 percentage points in payout, making their effective fee 10%.

Use integer KRW amounts and basis points for money and fee calculations.

## Listings

Every listing requires images:

- Minimum 1 image
- Maximum 3 images
- First image is the cover image

Before real creators exist, use sample listings and clearly label them as samples.

Admins can add, edit, hide, and archive all creators and listings.

## Initial Stack

- Next.js App Router
- TypeScript
- pnpm
- Tailwind CSS
- shadcn/ui
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Google + Kakao OAuth
- Toss Payments
- Telegram admin notifications
- Cloudflare Workers
- GitHub

Do not create a separate backend.

## Initial Data Model

Start lean with five core tables:

- `profiles`
- `creators`
- `listings`
- `requests`
- `payments`

## Out Of Scope For MVP

- Realtime chat
- Reviews and ratings
- Recommendation algorithms
- AI features
- Ad performance measurement
- View count API integrations
- Maps
- Calendar booking
- Automatic settlement
- Mobile app
- Internationalization
- Complex search
- Likes and follows

Judge new feature ideas by whether they are needed for the first real transaction.

## Current Foundation Status

Implemented:

- Next.js App Router + TypeScript project base
- pnpm package management
- Tailwind CSS and shadcn/ui-ready structure
- Supabase browser/server client scaffolding
- Cloudflare Workers deployment scaffolding through OpenNext
- Minimal lint, type-check, and unit test setup

Not implemented yet:

- Login
- Database schema or migrations
- Product marketplace UI
- Creator flows
- Admin console
- Payments
- Notifications
