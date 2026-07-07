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
    '제주한바퀴',
    '제주 명소, 로컬 공간, 여행 코스와 지역 브랜드를 따뜻한 여행 영상으로 소개하는 예시 크리에이터입니다.',
    '/images/samples/avatar-jeju.svg',
    '{"youtube":"https://youtube.com/@sample-jeju-hanbakwi","instagram":"https://instagram.com/sample.jeju.hanbakwi"}'::jsonb,
    'published',
    true,
    true,
    now()
  ),
  (
    'sample-style-mina',
    '오늘의제주',
    '카페, 패션, 일상과 로컬 공간을 자연스럽게 기록하는 제주 라이프스타일 예시 크리에이터입니다.',
    '/images/samples/avatar-style.svg',
    '{"instagram":"https://instagram.com/sample.today.jeju","tiktok":"https://tiktok.com/@sample.today.jeju"}'::jsonb,
    'published',
    true,
    true,
    now()
  ),
  (
    'sample-home-joon',
    '살림의기록',
    '집, 생활용품, 인테리어를 직접 사용하고 꼼꼼하게 소개하는 예시 크리에이터입니다.',
    '/images/samples/avatar-home.svg',
    '{"blog":"https://blog.naver.com/sample-salim-record","youtube":"https://youtube.com/@sample-salim-record"}'::jsonb,
    'published',
    true,
    false,
    null
  ),
  (
    'sample-food-sora',
    '한입서울',
    '서울 맛집, 음식, 간편식을 빠르고 직관적인 숏폼과 사진으로 소개하는 예시 크리에이터입니다.',
    '/images/samples/avatar-food.svg',
    '{"tiktok":"https://tiktok.com/@sample.hanip.seoul","instagram":"https://instagram.com/sample.hanip.seoul"}'::jsonb,
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
        '제주한바퀴',
        'https://youtube.com/@sample-jeju-hanbakwi',
        82000,
        '영상 내 30초 소개',
        '제주 여행 영상 흐름 안에서 브랜드, 공간, 상품을 약 30초간 자연스럽게 소개합니다.',
        array['영상 내 30초 소개', '고정 댓글 7일 유지', '간단한 집행 결과 공유']::text[],
        500000,
        array['/images/samples/jeju-hanbakwi-youtube-integration.webp']::text[]
      ),
      (
        'sample-jeju-youtube-dedicated',
        'sample-jeju-jiyun',
        '제주 로컬 브랜드 단독 리뷰 영상',
        'YouTube',
        '제주한바퀴',
        'https://youtube.com/@sample-jeju-hanbakwi',
        82000,
        '단독 리뷰 영상',
        '하나의 제주 로컬 브랜드나 공간을 중심으로 제작하는 단독 YouTube 리뷰 콘텐츠입니다.',
        array['단독 리뷰 영상 1편', '영상 설명란 링크 삽입', '콘텐츠 내 핵심 포인트 소개']::text[],
        1200000,
        array['/images/samples/jeju-hanbakwi-youtube-review.webp']::text[]
      ),
      (
        'sample-style-instagram-reels',
        'sample-style-mina',
        '제주 라이프스타일 Instagram 릴스 1편',
        'Instagram',
        '오늘의제주',
        'https://instagram.com/sample.today.jeju',
        54000,
        '릴스 1편',
        '제품, 공간, 서비스를 자연스러운 제주 라이프스타일 콘텐츠로 제작합니다.',
        array['릴스 1편 제작', '피드 30일 유지', '브랜드 계정 태그']::text[],
        350000,
        array['/images/samples/today-jeju-instagram-reels.webp']::text[]
      ),
      (
        'sample-style-instagram-story',
        'sample-style-mina',
        'Instagram 스토리 3컷 소개',
        'Instagram',
        '오늘의제주',
        'https://instagram.com/sample.today.jeju',
        54000,
        '스토리 3컷',
        '직접 사용하거나 방문한 모습을 3개의 연속 스토리로 소개합니다.',
        array['스토리 3컷 업로드', '링크 스티커 포함', '24시간 노출 캡처 제공']::text[],
        180000,
        array['/images/samples/today-jeju-instagram-story.webp']::text[]
      ),
      (
        'sample-home-blog-review',
        'sample-home-joon',
        '생활용품 네이버 블로그 상세 리뷰',
        '네이버 블로그',
        '살림의기록',
        'https://blog.naver.com/sample-salim-record',
        36000,
        '상세 리뷰 포스트',
        '직접 사용한 과정과 사진을 포함하는 상세 리뷰형 블로그 포스트입니다.',
        array['블로그 리뷰 1건', '사진 8장 이상', '검색 키워드 3개 반영']::text[],
        420000,
        array['/images/samples/salim-record-naver-blog-review.webp']::text[]
      ),
      (
        'sample-home-youtube-shorts',
        'sample-home-joon',
        '집과 생활 YouTube Shorts 1편',
        'YouTube',
        '살림의기록',
        'https://youtube.com/@sample-salim-record',
        41000,
        'Shorts 1편',
        '제품이나 서비스를 짧고 직관적인 세로형 영상으로 소개합니다.',
        array['Shorts 1편 제작', '핵심 사용 장면 소개', '설명란 링크 삽입']::text[],
        280000,
        array['/images/samples/salim-record-youtube-shorts.webp']::text[]
      ),
      (
        'sample-food-tiktok-quick',
        'sample-food-sora',
        '음식·간편식 TikTok 20초 숏폼',
        'TikTok',
        '한입서울',
        'https://tiktok.com/@sample.hanip.seoul',
        73000,
        '20초 숏폼',
        '음식의 특징과 먹는 장면을 빠른 템포로 보여주는 짧은 영상입니다.',
        array['20초 TikTok 영상 1편', '브랜드 해시태그 포함', '댓글 반응 캡처 제공']::text[],
        300000,
        array['/images/samples/hanip-seoul-tiktok-shortform.webp']::text[]
      ),
      (
        'sample-food-instagram-post',
        'sample-food-sora',
        '서울 맛집 Instagram 피드 소개',
        'Instagram',
        '한입서울',
        'https://instagram.com/sample.hanip.seoul',
        48000,
        '피드 사진 1건',
        '음식과 공간을 사진 중심의 Instagram 피드 콘텐츠로 소개합니다.',
        array['피드 게시물 1건', '사진 5장 이상', '브랜드 위치 태그']::text[],
        260000,
        array['/images/samples/hanip-seoul-instagram-feed.webp']::text[]
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
