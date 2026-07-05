# Pyda Creator Marketplace MVP v0.1 개발 스펙

가장 중요한 원칙부터 고정하겠다.

> **UI의 시각 언어는 Instagram, 제품 구조와 거래 흐름은 Airbnb.**

이건 단순히 “둘을 참고한다”는 뜻이 아니다.

Instagram에서는 **이미지 우선, 사람 중심, 최소한의 텍스트, 빠른 탐색, 가벼운 인터랙션**을 가져온다.

Airbnb에서는 **로그인 없는 탐색, 카드형 상품 목록, 상세 페이지, 마지막 단계의 거래 CTA, 늦은 로그인, 호스트와 상품의 분리**를 가져온다.

그리고 관리자 콘솔은 완전히 다르게 간다. 소비자 사이트는 감성적이고 시각적이어야 하지만, 관리자 콘솔은 **빠르고 명확한 운영 도구**여야 한다.

# 1. MVP의 정확한 제품 정의

Pyda MVP는 다음 세 부분으로 구성한다.

| 영역        | 사용자        | 목적               |
| --------- | ---------- | ---------------- |
| 공개 마켓플레이스 | 모든 방문자     | 광고 상품 탐색         |
| 크리에이터 영역  | 로그인한 크리에이터 | 자신의 프로필과 상품 관리   |
| 관리자 콘솔    | 너          | 전체 플랫폼과 실제 거래 운영 |

별도 서비스 세 개를 만들지 않는다.

**리포지토리 하나, Next.js 앱 하나, Supabase 프로젝트 하나, 배포 하나**로 간다.

전체 구조는 다음과 같다.

```text
사용자
  ↓
pyda.io
  ↓
Cloudflare Workers
  ↓
Next.js
  ↓
Supabase
  ├─ PostgreSQL
  ├─ Auth
  └─ Storage

외부 연동
  ├─ Toss Payments
  └─ Telegram Bot
```

현재 Next.js 공식 문서 기준 최신 계열은 16이며 App Router가 Server Components, Route Handlers 등을 제공한다. Cloudflare는 현재 OpenNext 어댑터를 통해 Next.js App Router, SSR, SSG, Route Handlers, Server Actions 등을 Workers에서 지원한다. 따라서 별도 NestJS 서버 없이 한 코드베이스로 구성하는 방향이 현재 기술적으로도 정석에 가깝다. ([Next.js][1])

# 2. 최종 기술 스택

| 영역     | 선택                                      |
| ------ | --------------------------------------- |
| 언어     | TypeScript                              |
| 프레임워크  | Next.js 16 App Router                   |
| UI     | Tailwind CSS + shadcn/ui                |
| 아이콘    | Lucide                                  |
| 폼      | React Hook Form + Zod                   |
| DB     | Supabase PostgreSQL                     |
| 인증     | Supabase Auth                           |
| 로그인    | Google + Kakao                          |
| 이미지    | Supabase Storage                        |
| 서버 로직  | Next.js Route Handlers / Server Actions |
| 결제     | Toss Payments 결제위젯                      |
| 관리자 알림 | Telegram Bot                            |
| 배포     | Cloudflare Workers                      |
| DNS    | Cloudflare                              |
| 패키지 관리 | pnpm                                    |
| 단위 테스트 | Vitest                                  |
| E2E    | Playwright                              |
| 코드 관리  | GitHub                                  |

여기서 중요한 결정은 다음 세 가지다.

**ORM을 넣지 않는다.**

Prisma도 없다. 초기에는 Supabase Client와 SQL migration이면 충분하다.

**별도 백엔드를 만들지 않는다.**

NestJS도 FastAPI도 없다. 일반 데이터 접근은 Supabase를 쓰고, 보안이 중요한 로직만 Next.js의 서버 영역에서 처리한다.

**전역 상태관리 라이브러리를 넣지 않는다.**

Redux도 Zustand도 TanStack Query도 우선 넣지 않는다. Server Component, URL query parameter, local state로 시작한다.

Supabase는 브라우저에서 데이터베이스를 사용할 때 Postgres RLS와 Auth를 결합해 행 단위 접근 권한을 통제할 수 있다. 공개 스키마의 테이블에는 RLS를 반드시 적용하는 구조로 간다. ([Supabase][2])

# 3. 배포는 Cloudflare Pages가 아니라 Workers

이전에는 Cloudflare Pages도 검토했지만, **새 MVP는 Cloudflare Workers로 확정하는 게 낫다.**

현재 Cloudflare의 공식 Next.js 배포 경로는 OpenNext를 통한 Workers 배포다. App Router, SSR, Route Handler, Server Action이 지원되며 custom domain 연결도 가능하다. ([Cloudflare Docs][3])

따라서 구조는 다음과 같다.

```text
GitHub main
    ↓
Cloudflare Workers Build
    ↓
pyda.io
```

개발자는 로컬에서 `npm run dev` 또는 `pnpm dev`로 작업한다.

실제 Workers 환경 검증은 별도 `preview` 명령으로 한다.

운영 배포는 `main` 브랜치 기준으로 한다.

기존 Hetzner는 사용하지 않는다.

MVP에서 필요해질 때까지 그대로 둔다.

# 4. 공개 사이트 UI 원칙

여기가 가장 중요하다.

## Instagram에서 가져올 것

첫째는 **이미지가 콘텐츠의 중심**이어야 한다.

텍스트가 먼저 나오고 이미지가 보조하는 전통적인 SaaS 랜딩페이지를 만들지 않는다.

둘째는 **사람이 보여야 한다.**

크리에이터 아바타, 이름, Founding Creator 배지, 플랫폼이 상품과 자연스럽게 연결되어야 한다.

셋째는 **색을 많이 사용하지 않는다.**

기본은 흰색, 검정, 회색이다.

브랜드 컬러는 CTA와 선택 상태에만 쓴다.

그라데이션, 과도한 그림자, 화려한 SaaS 카드 디자인은 사용하지 않는다.

## Airbnb에서 가져올 것

첫째는 방문자가 **로그인 없이 상품을 충분히 탐색**할 수 있어야 한다.

둘째는 목록에서 상품을 발견하고 상세 페이지에 들어가는 구조를 따른다.

셋째는 상세 페이지에서 이미지, 판매자, 상품 내용, 가격을 충분히 이해한 후 마지막에 거래 행동을 한다.

넷째는 데스크톱 상세 화면에서 오른쪽에 거래 CTA를 고정한다.

모바일에서는 하단에 고정한다.

# 5. 홈페이지

홈페이지는 별도의 거대한 랜딩페이지로 만들지 않는다.

**랜딩페이지이면서 동시에 마켓플레이스**다.

첫 화면 구조는 다음과 같다.

```text
Header

누가, 어디에, 무엇을, 얼마에 해주는가.

크리에이터의 광고 자리를 직접 보고
원하는 광고를 진행해보세요.

[전체] [YouTube] [Instagram] [네이버 블로그] [TikTok]

광고 상품 Grid

Founding Creator 안내

서비스 이용 방법

Footer
```

Hero 영역은 화면 전체를 차지하지 않는다.

Instagram이나 Airbnb처럼 사용자가 빨리 실제 콘텐츠를 봐야 한다.

광고 상품은 모바일에서 2열, 태블릿에서 3열, 데스크톱에서 4열 또는 5열로 간다.

초기 데이터가 적을 때는 데스크톱 4열로 시작한다.

# 6. 광고 상품 카드

상품 카드는 MVP의 가장 중요한 UI 컴포넌트다.

형태는 다음과 같다.

```text
┌────────────────────┐
│                    │
│      대표 이미지     │
│                    │
│ [예시 광고 상품]     │
└────────────────────┘

김제주  ✓ Founding Creator
YouTube · 영상 내 30초 소개

제주 여행 영상에 브랜드 소개

500,000원
```

카드에 반드시 보여주는 정보는 다음 여섯 가지다.

| 정보    | 목적       |
| ----- | -------- |
| 이미지   | 즉시 관심 유발 |
| 크리에이터 | 누가       |
| 플랫폼   | 어디에      |
| 광고 형식 | 무엇을      |
| 상품명   | 구체적 이해   |
| 가격    | 얼마에      |

카드 이미지 비율은 **4:5**를 기본으로 한다.

Instagram의 세로형 시각 감각과 크리에이터 콘텐츠 특성에 가장 잘 맞는다.

마우스를 올렸을 때 아주 약한 이미지 확대 정도만 넣는다.

과도한 animation은 넣지 않는다.

# 7. 광고 상품 상세 페이지

URL은 다음 형태다.

```text
/listings/[slug]
```

모바일에서는 이미지 1장씩 swipe하는 carousel을 쓴다.

데스크톱에서는 최대 3장의 이미지가 다음처럼 보인다.

```text
┌────────────────────┬──────────┐
│                    │  Image 2 │
│      Image 1       ├──────────┤
│                    │  Image 3 │
└────────────────────┴──────────┘
```

이미지가 1장이면 크게 한 장만 보여준다.

상세 정보의 순서는 고정한다.

```text
예시 광고 상품

상품명

크리에이터
Founding Creator Badge

플랫폼 · 채널
광고 형식

가격

제공되는 내용

상세 설명
```

오른쪽 CTA 카드에는 다음 메시지를 둔다.

> 관심 있는 광고가 있으신가요?
> 처음부터 끝까지 직접 진행을 도와드립니다.

버튼은 다음 하나다.

**광고 진행하기**

로그인하지 않은 사람이 이 버튼을 누를 때 처음 로그인을 요구한다.

# 8. 이미지 규칙

상품은 텍스트만으로 공개할 수 없다.

**최소 1장, 최대 3장**을 DB 수준에서 강제한다.

이미지 선택 단계에서 다음 기능만 구현한다.

```text
이미지 선택
미리보기
순서 변경
삭제
```

첫 번째 이미지가 항상 대표 이미지다.

허용 형식은 JPEG, PNG, WebP다.

업로드 전 브라우저에서 긴 변 기준 최대 1600px 정도로 줄이고 압축한다.

Storage에는 다음 경로 구조를 쓴다.

```text
creators/{creator_id}/avatar/
creators/{creator_id}/listings/{listing_id}/
```

Supabase Storage는 파일 저장과 RLS 기반 접근 제어를 지원하므로 별도 이미지 서버를 만들지 않는다. ([Supabase][4])

# 9. 로그인

로그인 화면에는 두 개만 둔다.

```text
Google로 계속하기

Kakao로 계속하기
```

회원가입 버튼은 별도로 두지 않는다.

**첫 OAuth 로그인 자체가 가입이다.**

Supabase는 Google과 Kakao OAuth를 공식 지원하며, Next.js의 callback route에서 PKCE code exchange 후 세션을 cookie에 저장하는 구조를 사용할 수 있다. ([Supabase][5])

사용자는 다음 과정을 경험한다.

```text
광고 진행하기
    ↓
Google로 계속하기
    ↓
Google 계정 선택
    ↓
바로 광고 요청 화면
```

중간에 다시 회원가입 폼이 나오지 않는다.

또한 로그인 전 보고 있던 상품과 행동을 잃으면 안 된다.

예를 들어 다음 정보를 `next`에 보존한다.

```text
/login?next=/listings/jeju-youtube-30s?request=1
```

로그인 완료 후 원래 상품으로 돌아와 요청창이 바로 다시 열린다.

# 10. 공개 페이지 전체 라우트

| URL                | 역할                  |
| ------------------ | ------------------- |
| `/`                | 홈 및 상품 탐색           |
| `/listings/[slug]` | 광고 상품 상세            |
| `/creators/[slug]` | 크리에이터 공개 프로필        |
| `/creators/join`   | Founding Creator 모집 |
| `/login`           | OAuth 로그인           |
| `/auth/callback`   | OAuth 처리            |
| `/claim/[token]`   | 관리자 직접 온보딩 연결       |

광고주 로그인 후에는 다음 두 개만 추가한다.

| URL                      | 역할         |
| ------------------------ | ---------- |
| `/account/requests`      | 내 광고 요청    |
| `/account/requests/[id]` | 요청 상태 및 결제 |

광고주용 거대한 대시보드는 만들지 않는다.

# 11. 크리에이터 영역

크리에이터용 영역은 다음 네 개면 된다.

| URL                           | 역할      |
| ----------------------------- | ------- |
| `/creator`                    | 요약      |
| `/creator/profile`            | 프로필 수정  |
| `/creator/listings`           | 내 광고 상품 |
| `/creator/listings/new`       | 상품 추가   |
| `/creator/listings/[id]/edit` | 상품 수정   |

첫 화면은 다음 정도면 된다.

```text
안녕하세요, 김제주님

내 공개 상품 3개
숨김 상품 1개

[새 광고 상품 추가]

내 광고 상품
```

초기에는 크리에이터에게 광고 요청 관리 기능을 주지 않는다.

요청이 들어오면 **네가 직접 크리에이터에게 연락한다.**

이게 현재 concierge MVP와 맞다.

# 12. 관리자 직접 온보딩

이 기능은 핵심 기능으로 개발한다.

흐름은 다음과 같다.

```text
관리자
    ↓
크리에이터 생성
    ↓
프로필 작성
    ↓
광고 상품 대신 등록
    ↓
사이트에 공개
    ↓
온보딩 링크 생성
    ↓
크리에이터에게 전송
```

크리에이터가 링크를 연다.

```text
/claim/[token]
```

로그인하지 않았다면 Google 또는 Kakao 로그인을 한다.

로그인이 끝나면 서버에서 다음을 처리한다.

```text
토큰 검증
    ↓
만료 여부 확인
    ↓
이미 연결된 계정인지 확인
    ↓
creator.owner_user_id 연결
    ↓
claimed_at 기록
    ↓
토큰 폐기
```

그 순간부터 해당 크리에이터는 네가 미리 만든 프로필과 상품을 직접 관리할 수 있다.

토큰 원문은 DB에 저장하지 않는다.

SHA-256 해시만 저장한다.

기본 유효기간은 14일로 한다.

관리자가 링크를 재생성하면 이전 링크는 즉시 무효화한다.

# 13. Founding Creator

프로그램 시작일은 코드에 고정하지 않는다.

환경변수로 관리한다.

```text
FOUNDING_PROGRAM_START_AT
```

종료일은 시작일에서 100일 후다.

자격 조건은 세 개다.

```text
100일 기간 내 온보딩 완료

공개 광고 상품 최소 1개

관리자 최종 승인
```

세 조건을 만족하면 관리자 콘솔에 다음처럼 보인다.

```text
✓ 기간 조건
✓ 온보딩 완료
✓ 공개 상품 1개 이상

[Founding Creator 확정]
```

확정 후 배지는 영구적으로 유지한다.

정산 계산은 다음과 같다.

```text
거래금액          1,000,000원
기본 수수료 15%     150,000원
Founding 혜택 5%p   +50,000원
최종 정산액          900,000원
```

코드 내부에서는 “환급”이라는 모호한 표현 대신 다음 용어를 쓴다.

```text
platform_fee
founding_benefit
creator_payout
```

수수료율 계산에는 소수를 쓰지 않는다.

basis point로 저장한다.

```text
기본 수수료       1500 bps
Founding 혜택      500 bps
```

돈은 모두 원 단위 정수로 저장한다.

# 14. 최소 DB 스키마

기존 계획대로 핵심 테이블은 다섯 개로 간다.

## profiles

| 필드           | 설명            |
| ------------ | ------------- |
| id           | auth.users ID |
| display_name | 사용자 이름        |
| avatar_url   | 프로필 이미지       |
| is_admin     | 관리자 여부        |
| created_at   | 생성일           |
| updated_at   | 수정일           |

광고주와 크리에이터 계정을 별도로 나누지 않는다.

`creators` 데이터가 연결되어 있으면 크리에이터다.

광고 요청을 만들면 광고주다.

한 사람이 둘 다 될 수도 있다.

## creators

| 필드                  | 설명                                 |
| ------------------- | ---------------------------------- |
| id                  | UUID                               |
| owner_user_id       | 실제 사용자, 초기에는 null 가능               |
| slug                | 공개 URL                             |
| display_name        | 활동명                                |
| bio                 | 소개                                 |
| avatar_path         | 이미지                                |
| social_links        | JSONB                              |
| status              | draft, published, hidden, archived |
| is_sample           | 예시 여부                              |
| onboarded_at        | 직접 온보딩 완료일                         |
| claimed_at          | 계정 연결일                             |
| claim_token_hash    | 온보딩 토큰 해시                          |
| claim_expires_at    | 만료일                                |
| is_founding         | Founding Creator 여부                |
| founding_granted_at | 확정일                                |
| created_at          | 생성일                                |
| updated_at          | 수정일                                |

## listings

| 필드            | 설명                                 |
| ------------- | ---------------------------------- |
| id            | UUID                               |
| creator_id    | 크리에이터                              |
| slug          | 공개 URL                             |
| title         | 상품명                                |
| platform      | 플랫폼                                |
| channel_name  | 채널명                                |
| channel_url   | 채널 URL                             |
| audience_size | 구독자 또는 팔로워                         |
| ad_format     | 광고 형식                              |
| description   | 상세 설명                              |
| deliverables  | 제공 내용 배열                           |
| price_krw     | 가격                                 |
| image_paths   | 이미지 1개에서 3개                        |
| status        | draft, published, hidden, archived |
| is_sample     | 예시 상품                              |
| published_at  | 최초 공개일                             |
| created_at    | 생성일                                |
| updated_at    | 수정일                                |

공개 상태가 되려면 이미지가 최소 1장 있어야 한다.

4장째는 UI와 DB 모두 거부한다.

## requests

| 필드                   | 설명        |
| -------------------- | --------- |
| id                   | UUID      |
| advertiser_user_id   | 광고주       |
| listing_id           | 상품        |
| brand_name           | 회사 또는 브랜드 |
| contact_name         | 담당자       |
| contact_channel      | 선호 연락수단   |
| contact_value        | 연락처       |
| campaign_brief       | 광고 내용     |
| preferred_start_date | 희망 시작일    |
| preferred_end_date   | 희망 종료일    |
| quoted_amount_krw    | 최종 결제금액   |
| status               | 현재 거래 단계  |
| admin_notes          | 관리자 메모    |
| created_at           | 생성일       |
| updated_at           | 수정일       |

## payments

| 필드                      | 설명            |
| ----------------------- | ------------- |
| id                      | UUID          |
| request_id              | 광고 요청         |
| provider                | toss          |
| environment             | test 또는 live  |
| order_id                | 토스 주문번호       |
| payment_key             | 토스 결제키        |
| amount_krw              | 결제금액          |
| platform_fee_bps        | 수수료율          |
| founding_benefit_bps    | 혜택률           |
| platform_fee_amount     | 플랫폼 수수료       |
| founding_benefit_amount | 추가 혜택         |
| creator_payout_amount   | 크리에이터 정산액     |
| status                  | 결제 상태         |
| paid_at                 | 결제일           |
| settled_at              | 크리에이터 정산일     |
| provider_payload        | 장애 대응용 최소 데이터 |
| created_at              | 생성일           |
| updated_at              | 수정일           |

# 15. 광고 요청 상태

상태는 이것으로 고정한다.

```text
submitted
    ↓
checking
    ↓
payment_ready
    ↓
paid
    ↓
in_progress
    ↓
completed
```

예외 상태는 다음 두 개다.

```text
declined
cancelled
```

관리자 UI에서는 영어 코드가 아니라 한국어로 보여준다.

```text
신규 요청
확인 중
결제 가능
결제 완료
집행 중
완료
진행 불가
취소
```

상태 전환은 아무 상태에서 아무 상태로 바뀔 수 없게 한다.

예를 들어 신규 요청이 바로 완료로 바뀌는 것은 막는다.

# 16. 광고 요청 흐름

사용자가 상세 페이지에서 `광고 진행하기`를 누른다.

로그인 후 다음 폼이 뜬다.

```text
회사 또는 브랜드명

담당자명

어떤 방식으로 연락드릴까요?

연락처

어떤 광고를 진행하고 싶으신가요?

희망 일정
```

제출하면 즉시 다음 세 가지가 일어난다.

```text
requests 생성

관리자 콘솔 신규 요청 +1

Telegram 알림 발송
```

Telegram이 실패해도 광고 요청 자체는 성공해야 한다.

알림은 보조 수단이다.

**DB와 관리자 콘솔이 진짜 원장이다.**

# 17. 관리자 콘솔

관리자 UI는 Instagram 스타일로 만들지 않는다.

여기는 운영 효율이 우선이다.

사이드바 구조는 다음으로 고정한다.

```text
Pyda Admin

대시보드
크리에이터
광고 상품
광고 요청
결제 및 정산
```

## 대시보드

다음 숫자만 보여준다.

```text
공개 크리에이터

공개 광고 상품

신규 요청

완료 거래

GMV

플랫폼 수익
```

테스트 결제와 실제 결제는 절대 합치지 않는다.

실결제 전에는 화면 상단에 크게 표시한다.

**TEST MODE**

## 크리에이터

목록에서 바로 다음이 보여야 한다.

```text
아바타

이름

플랫폼

광고 상품 수

공개 상태

Founding Creator

계정 연결 여부
```

가능한 행동은 다음이다.

```text
추가
수정
숨김
삭제
온보딩 링크 생성
Founding Creator 확정
```

사용자가 보는 “삭제”는 내부적으로 `archived` 상태로 바꾼다.

진짜 DB 삭제는 관리자 화면에서 하지 않는다.

## 광고 상품

이미지가 반드시 목록에서 보여야 한다.

가능한 행동은 다음과 같다.

```text
추가
수정
공개
숨김
삭제
```

예시 광고 상품만 필터링할 수 있어야 한다.

## 광고 요청

운영의 중심 화면이다.

```text
광고주

광고 상품

크리에이터

금액

현재 상태

요청일
```

요청 상세에서 네가 상태를 바꾼다.

`payment_ready`로 변경할 때 최종 가격을 입력한다.

## 결제 및 정산

다음 정보를 보여준다.

```text
거래금액

결제 상태

플랫폼 수수료

Founding 혜택

크리에이터 정산액

정산 상태
```

# 18. Toss Payments

초기에는 무조건 다음 값으로 시작한다.

```text
PAYMENTS_MODE=test
```

실제 결제 코드는 별도 디렉터리에 격리한다.

```text
src/lib/payments/toss/
    client.ts
    server.ts
    types.ts
    calculations.ts

src/app/api/payments/
    confirm/route.ts

src/app/api/webhooks/
    toss/route.ts
```

결제 코드에는 반드시 다음 원칙을 명시적으로 주석으로 남긴다.

```text
브라우저가 보내온 결제금액을 신뢰하지 않는다.

DB의 quoted_amount와 반드시 비교한다.

결제 성공 페이지로 돌아왔다는 이유로 paid 처리하지 않는다.

서버 결제 승인 성공 이후에만 paid 처리한다.

동일 order_id와 payment_key의 중복 처리를 막는다.

test와 live 키를 절대 혼용하지 않는다.
```

라이브 전환은 환경변수 하나만 바꾸면 되는 구조로 만들지 않는다.

다음 조건이 모두 있어야 live가 가능하게 한다.

```text
PAYMENTS_MODE=live

TOSS_LIVE_SECRET_KEY 존재

TOSS_LIVE_CLIENT_KEY 존재
```

하나라도 없으면 애플리케이션이 live 결제를 거부한다.

# 19. 권한 정책

RLS는 모든 공개 스키마 테이블에 적용한다. Supabase도 브라우저에서 안전하게 데이터에 접근하려면 공개 스키마 테이블에 RLS를 활성화하라고 명시하고 있다. ([Supabase][2])

권한 구조는 다음과 같다.

| 데이터         | 비로그인 | 일반 사용자    | 크리에이터  | 관리자 |
| ----------- | ---- | --------- | ------ | --- |
| 공개 크리에이터    | 읽기   | 읽기        | 읽기     | 전체  |
| 공개 상품       | 읽기   | 읽기        | 읽기     | 전체  |
| 내 요청        | 불가   | 본인만       | 본인만    | 전체  |
| 내 크리에이터 프로필 | 불가   | 불가        | 본인만 수정 | 전체  |
| 내 상품        | 불가   | 불가        | 본인만 수정 | 전체  |
| 결제          | 불가   | 본인 거래만 읽기 | 불가     | 전체  |

Supabase `service_role` 키는 브라우저 코드에 절대 들어가지 않는다.

claim 처리, 관리자 특수 작업, 결제 처리는 서버에서만 수행한다.

# 20. 리포 구조

새 리포는 monorepo로 만들지 않는다.

다음 정도면 충분하다.

```text
pyda/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   ├── (account)/
│   │   ├── creator/
│   │   ├── admin/
│   │   ├── api/
│   │   └── auth/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── marketplace/
│   │   ├── creator/
│   │   └── admin/
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   ├── auth/
│   │   ├── payments/
│   │   ├── notifications/
│   │   └── domain/
│   │
│   └── types/
│
├── supabase/
│   ├── migrations/
│   └── seed.sql
│
├── tests/
│
├── package.json
├── wrangler.jsonc
└── README.md
```

기존 Pyda의 `apps/web`, `apps/api`, `packages/shared` 구조는 가져오지 않는다.

# 21. 테스트

모든 것을 테스트하려고 하지 않는다.

돈과 권한과 핵심 거래 흐름만 테스트한다.

단위 테스트는 다음 네 영역이 필수다.

```text
Founding Creator 자격 계산

15% 수수료와 5%p 혜택 계산

광고 요청 상태 전환

claim token 검증
```

E2E는 다음 핵심 흐름만 검증한다.

```text
로그인 없이 상품 탐색

로그인 후 광고 요청

관리자 크리에이터 직접 생성

온보딩 링크로 계정 claim

이미지 1개에서 3개 상품 공개

4번째 이미지 거부

테스트 결제 완료
```

# 22. MVP에서 절대 만들지 않을 것

다음은 v0.1 범위 밖이다.

```text
실시간 채팅

리뷰

별점

자동 추천

AI 기능

광고 성과 측정

조회수 API 연동

달력 예약

자동 정산

크리에이터와 광고주 직접 메시지

모바일 앱

다국어

다중 통화

복잡한 검색

지도

팔로우

좋아요

알림 센터
```

필요하다는 증거가 생기기 전에는 만들지 않는다.

# 23. 개발 순서

개발은 다음 순서로 진행하는 것이 맞다.

**1단계는 기반이다.**

새 GitHub 리포, Next.js, Cloudflare, Supabase, 기본 migration, RLS를 만든다.

**2단계는 공개 마켓플레이스다.**

홈, 상품 카드, 상세 페이지, 예시 데이터를 만든다.

**3단계는 관리자 콘솔이다.**

크리에이터와 상품을 네가 직접 추가, 수정, 숨김, 삭제할 수 있게 만든다.

**4단계는 인증과 온보딩이다.**

Google, Kakao, 직접 생성한 크리에이터의 claim link를 만든다.

**5단계는 광고 요청이다.**

늦은 로그인, 요청 폼, 관리자 상태 관리, Telegram 알림을 만든다.

**6단계는 크리에이터 관리 화면이다.**

자기 프로필과 자기 상품을 수정하게 한다.

**7단계는 Toss 테스트 결제다.**

마지막에 격리된 결제 모듈로 붙인다.

이 순서가 중요한 이유가 있다.

**결제 전에 실제 마켓플레이스와 관리자 운영 흐름이 먼저 완성되어야 한다.**

---

내 최종 판단으로 이 스펙은 지금 우리 상황에서 상당히 균형이 좋다.

기존 Pyda처럼 너무 무겁지 않다. 그렇다고 이메일만 수집하는 랜딩페이지처럼 검증력이 약하지도 않다.

가장 중요한 것은 **공개 사이트가 Instagram처럼 보고 싶고, Airbnb처럼 이해하기 쉬우며, 관리자는 뒤에서 모든 거래를 직접 움직일 수 있다는 것**이다.

이제부터 개발 중 새로운 기능 아이디어가 나와도, 우선 이 스펙에 없는 기능은 기본적으로 넣지 않는 것이 맞다. **v0.1의 목적은 좋은 플랫폼을 완성하는 것이 아니라 첫 실제 거래를 만드는 것이다.**

[1]: https://nextjs.org/docs/app "Next.js Docs: App Router | Next.js"
[2]: https://supabase.com/docs/guides/database/postgres/row-level-security "Row Level Security | Supabase Docs"
[3]: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/ "Next.js · Cloudflare Workers docs"
[4]: https://supabase.com/docs/guides/storage "Storage | Supabase Docs"
[5]: https://supabase.com/docs/guides/auth/social-login/auth-google "Login with Google | Supabase Docs"
