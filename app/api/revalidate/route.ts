import { revalidateTag, revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

// Next.js On-Demand Revalidation API
// 블로그 글 수정 후 즉시 캐시 무효화
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const path = searchParams.get('path');
    const secret = searchParams.get('secret');

    // 보안: secret 키 확인 (옵션)
    const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || 'dev-secret-key';
    if (secret && secret !== REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    // 태그 기반 재검증 (특정 블로그 글)
    if (tag) {
      revalidateTag(tag);
      return NextResponse.json({
        revalidated: true,
        type: 'tag',
        tag,
        now: Date.now()
      });
    }

    // 경로 기반 재검증 (특정 URL)
    if (path) {
      revalidatePath(path);
      return NextResponse.json({
        revalidated: true,
        type: 'path',
        path,
        now: Date.now()
      });
    }

    // 전체 블로그 캐시 무효화
    if (searchParams.get('all') === 'true') {
      revalidateTag('blog-articles');
      return NextResponse.json({
        revalidated: true,
        type: 'all',
        now: Date.now()
      });
    }

    return NextResponse.json({ error: 'Missing tag or path parameter' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to revalidate', details: String(err) }, { status: 500 });
  }
}

// GET도 허용 (브라우저에서 바로 호출 가능)
export async function GET(request: NextRequest) {
  return POST(request);
}
