import { ImageResponse } from 'next/og';

// 글마다 동적 OG 이미지 자동 생성 (Next.js 15 컨벤션).
// 별도의 og:image meta 태그를 수동 추가할 필요 없음 — Next.js가 자동으로
// /blog/{id}/opengraph-image URL을 메타데이터에 주입.
export const runtime = 'edge';
export const alt = 'GEO-AIO 블로그 글';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

interface PostMeta {
  title?: string;
  category?: string;
}

async function getPostMeta(id: string): Promise<PostMeta> {
  if (!supabaseUrl || !supabaseKey) return {};
  if (!/^[0-9a-f-]{36}$/i.test(id)) return {};
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/blog_articles?id=eq.${id}&select=title,category`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return {};
    const rows = await res.json();
    return (rows[0] as PostMeta) || {};
  } catch {
    return {};
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  'geo-aio': 'GEO-AIO',
  'regenmed': '리젠메드컨설팅',
  'brewery': '대전맥주장 수제맥주',
  'dental': '치과병원',
};

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostMeta(id);
  const title = post.title || 'GEO-AIO 블로그';
  const categoryLabel = post.category ? (CATEGORY_LABELS[post.category] || post.category) : '';

  // 제목 80자 이내로 잘라 가독성 확보
  const displayTitle = title.length > 80 ? title.slice(0, 78) + '…' : title;

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 45%, #f5f3ff 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '72px 80px',
          position: 'relative',
        }}
      >
        {/* 상단 골드 라인 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, transparent, #f59e0b 30%, #f59e0b 70%, transparent)',
          }}
        />
        {/* 우측 상단 amber 블롭 */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.12)',
          }}
        />
        {/* 좌측 하단 violet 블롭 */}
        <div
          style={{
            position: 'absolute',
            bottom: -160,
            left: -120,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'rgba(139, 92, 246, 0.08)',
          }}
        />

        {/* 헤더 라벨 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 22,
            color: '#b45309',
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            fontWeight: 700,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#f59e0b',
            }}
          />
          GEO-AIO · Blog
        </div>

        {/* 제목 */}
        <div
          style={{
            fontSize: displayTitle.length > 50 ? 52 : 64,
            color: '#0f172a',
            fontWeight: 800,
            lineHeight: 1.18,
            letterSpacing: '-0.02em',
            display: 'flex',
            flexWrap: 'wrap',
            marginBottom: 24,
          }}
        >
          {displayTitle}
        </div>

        {/* 카테고리 배지 */}
        {categoryLabel && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '10px 22px',
              background: 'white',
              border: '1px solid #fcd34d',
              borderRadius: 999,
              fontSize: 22,
              color: '#92400e',
              fontWeight: 600,
              alignSelf: 'flex-start',
              boxShadow: '0 2px 12px rgba(245, 158, 11, 0.12)',
            }}
          >
            {categoryLabel}
          </div>
        )}

        {/* 푸터 */}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 32,
            borderTop: '1px solid #fde68a',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontSize: 24,
              color: '#334155',
              fontWeight: 600,
            }}
          >
            www.geo-aio.com
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 20,
              color: '#92400e',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            AI Search Optimized
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#10b981',
              }}
            />
          </div>
        </div>
      </div>
    ),
    size
  );
}
