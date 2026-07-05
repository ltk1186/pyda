insert into public.creators (
  slug,
  display_name,
  bio,
  avatar_path,
  social_links,
  status,
  is_sample,
  is_founding,
  founding_granted_at
)
values
  (
    'sample-jeju-jiyun',
    '김지윤',
    '제주 여행과 로컬 맛집을 기록하는 예시 크리에이터입니다.',
    '/images/samples/avatar-jeju.svg',
    '{"youtube":"https://youtube.com/@sample-jeju-jiyun","instagram":"https://instagram.com/sample.jeju.jiyun"}'::jsonb,
    'published',
    true,
    true,
    now()
  ),
  (
    'sample-style-mina',
    '박미나',
    '데일리 패션과 뷰티 숏폼을 만드는 예시 크리에이터입니다.',
    '/images/samples/avatar-style.svg',
    '{"instagram":"https://instagram.com/sample.style.mina","tiktok":"https://tiktok.com/@sample.style.mina"}'::jsonb,
    'published',
    true,
    true,
    now()
  ),
  (
    'sample-home-joon',
    '이준호',
    '집 꾸미기와 생활용품 리뷰를 다루는 예시 크리에이터입니다.',
    '/images/samples/avatar-home.svg',
    '{"blog":"https://blog.naver.com/sample-home-joon","youtube":"https://youtube.com/@sample-home-joon"}'::jsonb,
    'published',
    true,
    false,
    null
  ),
  (
    'sample-food-sora',
    '최소라',
    '서울 맛집과 간편식을 소개하는 예시 크리에이터입니다.',
    '/images/samples/avatar-food.svg',
    '{"tiktok":"https://tiktok.com/@sample.food.sora","instagram":"https://instagram.com/sample.food.sora"}'::jsonb,
    'published',
    true,
    false,
    null
  )
on conflict (slug) do update set
  display_name = excluded.display_name,
  bio = excluded.bio,
  avatar_path = excluded.avatar_path,
  social_links = excluded.social_links,
  status = excluded.status,
  is_sample = excluded.is_sample,
  is_founding = excluded.is_founding,
  founding_granted_at = excluded.founding_granted_at,
  updated_at = now();

with listing_seed as (
  select *
  from (
    values
      (
        'sample-jeju-youtube-30s',
        'sample-jeju-jiyun',
        '제주 여행 영상 내 30초 브랜드 소개',
        'YouTube',
        '지윤의 제주 노트',
        'https://youtube.com/@sample-jeju-jiyun',
        82000,
        '영상 내 30초 소개',
        '제주 여행 브이로그 본문 흐름 안에서 브랜드를 자연스럽게 소개합니다.',
        array['영상 내 30초 브랜드 언급', '고정 댓글 7일 유지', '간단한 집행 결과 공유']::text[],
        500000,
        array['/images/samples/jeju-youtube-1.svg', '/images/samples/jeju-youtube-2.svg', '/images/samples/jeju-youtube-3.svg']::text[]
      ),
      (
        'sample-jeju-youtube-dedicated',
        'sample-jeju-jiyun',
        '제주 로컬 브랜드 단독 리뷰 영상',
        'YouTube',
        '지윤의 제주 노트',
        'https://youtube.com/@sample-jeju-jiyun',
        82000,
        '단독 리뷰 영상',
        '제주 기반 브랜드 또는 여행 상품을 하나의 영상 주제로 다룹니다.',
        array['6분 이상 단독 리뷰 영상', '영상 설명란 링크 삽입', '썸네일 브랜드 노출']::text[],
        1200000,
        array['/images/samples/jeju-review-1.svg', '/images/samples/jeju-review-2.svg']::text[]
      ),
      (
        'sample-style-instagram-reels',
        'sample-style-mina',
        '봄 데일리룩 Instagram 릴스 소개',
        'Instagram',
        'mina.daily',
        'https://instagram.com/sample.style.mina',
        54000,
        '릴스 1편',
        '패션 또는 뷰티 아이템을 착용 장면 중심의 릴스로 소개합니다.',
        array['릴스 1편 제작', '피드 30일 유지', '브랜드 계정 태그']::text[],
        350000,
        array['/images/samples/style-reels-1.svg', '/images/samples/style-reels-2.svg']::text[]
      ),
      (
        'sample-style-instagram-story',
        'sample-style-mina',
        'Instagram 스토리 3컷 체험 소개',
        'Instagram',
        'mina.daily',
        'https://instagram.com/sample.style.mina',
        54000,
        '스토리 3컷',
        '제품 사용 전후와 핵심 장점을 짧은 스토리 흐름으로 소개합니다.',
        array['스토리 3컷 업로드', '링크 스티커 포함', '24시간 노출 캡처 제공']::text[],
        180000,
        array['/images/samples/style-story-1.svg']::text[]
      ),
      (
        'sample-home-blog-review',
        'sample-home-joon',
        '네이버 블로그 생활용품 상세 리뷰',
        '네이버 블로그',
        '준호의 집 사용기',
        'https://blog.naver.com/sample-home-joon',
        36000,
        '상세 리뷰 포스트',
        '생활용품의 사용 장면, 장단점, 구매 포인트를 긴 글과 사진으로 정리합니다.',
        array['블로그 리뷰 1건', '사진 8장 이상', '검색 키워드 3개 반영']::text[],
        420000,
        array['/images/samples/home-blog-1.svg', '/images/samples/home-blog-2.svg']::text[]
      ),
      (
        'sample-home-youtube-shorts',
        'sample-home-joon',
        '집꾸미기 YouTube Shorts 노출',
        'YouTube',
        '준호의 집 사용기',
        'https://youtube.com/@sample-home-joon',
        41000,
        'Shorts 1편',
        '공간 변화 전후를 중심으로 생활용품을 짧고 명확하게 보여줍니다.',
        array['Shorts 1편 제작', '제품명 자막 노출', '설명란 링크 삽입']::text[],
        280000,
        array['/images/samples/home-shorts-1.svg']::text[]
      ),
      (
        'sample-food-tiktok-quick',
        'sample-food-sora',
        'TikTok 간편식 20초 맛보기',
        'TikTok',
        'sora.quickbite',
        'https://tiktok.com/@sample.food.sora',
        73000,
        '20초 숏폼',
        '간편식의 조리 과정과 첫 인상을 빠르게 보여주는 숏폼 광고입니다.',
        array['20초 TikTok 영상 1편', '브랜드 해시태그 포함', '댓글 반응 캡처 제공']::text[],
        300000,
        array['/images/samples/food-tiktok-1.svg', '/images/samples/food-tiktok-2.svg']::text[]
      ),
      (
        'sample-food-instagram-post',
        'sample-food-sora',
        '서울 맛집 Instagram 피드 소개',
        'Instagram',
        'sora.quickbite',
        'https://instagram.com/sample.food.sora',
        48000,
        '피드 사진 1건',
        '방문 경험을 기반으로 메뉴와 매장 분위기를 이미지 중심으로 소개합니다.',
        array['피드 게시물 1건', '사진 5장 이상', '브랜드 위치 태그']::text[],
        260000,
        array['/images/samples/food-feed-1.svg', '/images/samples/food-feed-2.svg', '/images/samples/food-feed-3.svg']::text[]
      )
  ) as seed(
    slug,
    creator_slug,
    title,
    platform,
    channel_name,
    channel_url,
    audience_size,
    ad_format,
    description,
    deliverables,
    price_krw,
    image_paths
  )
)
insert into public.listings (
  creator_id,
  slug,
  title,
  platform,
  channel_name,
  channel_url,
  audience_size,
  ad_format,
  description,
  deliverables,
  price_krw,
  image_paths,
  status,
  is_sample,
  published_at
)
select
  creators.id,
  listing_seed.slug,
  listing_seed.title,
  listing_seed.platform,
  listing_seed.channel_name,
  listing_seed.channel_url,
  listing_seed.audience_size,
  listing_seed.ad_format,
  listing_seed.description,
  listing_seed.deliverables,
  listing_seed.price_krw,
  listing_seed.image_paths,
  'published',
  true,
  now()
from listing_seed
inner join public.creators on creators.slug = listing_seed.creator_slug
on conflict (slug) do update set
  creator_id = excluded.creator_id,
  title = excluded.title,
  platform = excluded.platform,
  channel_name = excluded.channel_name,
  channel_url = excluded.channel_url,
  audience_size = excluded.audience_size,
  ad_format = excluded.ad_format,
  description = excluded.description,
  deliverables = excluded.deliverables,
  price_krw = excluded.price_krw,
  image_paths = excluded.image_paths,
  status = excluded.status,
  is_sample = excluded.is_sample,
  published_at = excluded.published_at,
  updated_at = now();
