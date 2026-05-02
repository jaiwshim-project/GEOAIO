// GET /api/blog/category-counts
// 카테고리별 글 수만 가져오는 가벼운 endpoint.
// 전체 글 fetch (수 MB) 대신 카운트만 (수 KB) 반환하여 페이지 진입 속도 향상.
//
// 응답: { counts: { 'geo-aio': 52, '디지털스마일치과': 130, ... }, langCounts: { ko, en, zh, ja } }

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
// 5분간 CDN 캐시 (같은 응답을 여러 사용자에게 재사용)
export const revalidate = 300;

interface CountsRow { category: string; }

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '')
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ counts: {}, langCounts: { ko: 0, en: 0, zh: 0, ja: 0 } });
  }

  try {
    const supa = createClient(url, key, { auth: { persistSession: false } });
    // 카테고리만 select (가장 가벼운 쿼리). 페이지네이션으로 1000건 cap 우회.
    const PAGE_SIZE = 1000;
    const all: CountsRow[] = [];
    for (let page = 0; page < 50; page++) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supa
        .from('blog_articles')
        .select('category, author')
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) break;
      if (!data || data.length === 0) break;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      all.push(...(data as any));
      if (data.length < PAGE_SIZE) break;
    }

    const counts: Record<string, number> = {};
    const langCounts: Record<string, number> = { ko: 0, en: 0, zh: 0, ja: 0 };
    const byCategoryLang: Record<string, Record<string, number>> = {};
    for (const r of all) {
      const cat = r.category || 'uncategorized';
      counts[cat] = (counts[cat] || 0) + 1;
      // 언어 분류 (metadata.lang 우선, 기본 ko)
      let lang = 'ko';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const author = (r as any).author;
      if (author) {
        try {
          const m = JSON.parse(author);
          const explicit = m?.metadata?.lang || m?.lang;
          if (explicit && ['ko', 'en', 'zh', 'ja'].includes(explicit)) lang = explicit;
        } catch {}
      }
      langCounts[lang] = (langCounts[lang] || 0) + 1;
      // 카테고리별 언어 분포
      if (!byCategoryLang[cat]) byCategoryLang[cat] = { ko: 0, en: 0, zh: 0, ja: 0 };
      byCategoryLang[cat][lang] = (byCategoryLang[cat][lang] || 0) + 1;
    }

    const total = all.length;
    return NextResponse.json(
      { counts, langCounts, byCategoryLang, total },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (e) {
    return NextResponse.json(
      { counts: {}, langCounts: { ko: 0, en: 0, zh: 0, ja: 0 }, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
