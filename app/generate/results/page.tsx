'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase-client';

interface ResultItem {
  id: string;
  topic: string;
  tone: string;
  category: string;
  created_at: string;
  project_id?: string;
}

export default function GenerateResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login?redirect=/generate/results');
          return;
        }
        const { data } = await supabase
          .from('generate_results')
          .select('id, data, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: ResultItem[] = (data || []).map((row: any) => ({
          id: row.id,
          topic: row.data?.topic || '제목 없음',
          tone: row.data?.tone || '',
          category: row.data?.category || '',
          project_id: row.data?.project_id,
          created_at: row.created_at,
        }));
        setResults(items);
      } catch (e) {
        console.error('[results] 로드 실패:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const filtered = filter
    ? results.filter(r => r.topic.toLowerCase().includes(filter.toLowerCase()))
    : results;

  const formatDate = (s: string) => {
    const d = new Date(s);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const categoryLabel: Record<string, string> = {
    blog: '블로그',
    product: '제품',
    faq: 'FAQ',
    howto: '가이드',
    landing: '랜딩',
    technical: '기술문서',
    social: '소셜',
    email: '이메일',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 히어로 */}
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white px-6 sm:px-10 py-7 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">생성 결과 목록</h1>
          <p className="text-white/90 text-sm leading-relaxed">
            지금까지 생성한 콘텐츠 목록입니다. 클릭하면 결과 페이지로 이동합니다.
          </p>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-medium mt-3">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            총 {results.length}건
          </span>
        </section>

        {/* 검색 + 새로 만들기 */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="주제로 검색..."
            className="flex-1 min-w-[200px] px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder-gray-400"
          />
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold rounded-xl hover:shadow-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            새로 만들기
          </Link>
        </div>

        {/* 결과 목록 */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <svg className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-gray-500">불러오는 중...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-gray-400 font-medium">{filter ? '검색 결과가 없습니다' : '아직 생성한 결과가 없습니다'}</p>
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 px-4 py-2 mt-4 text-sm font-medium bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
            >
              첫 콘텐츠 생성하기
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => (
              <Link
                key={r.id}
                href={`/generate/result?id=${r.id}`}
                className="group block bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-indigo-300 hover:shadow-sm transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {r.category && (
                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-100 text-indigo-700">
                          {categoryLabel[r.category] || r.category}
                        </span>
                      )}
                      {r.tone && (
                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-purple-100 text-purple-700">
                          {r.tone}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
                    </div>
                    <h2 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {r.topic}
                    </h2>
                  </div>
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-colors shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
