'use client';

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

const REASON_LABEL: Record<string, string> = {
  DISCOVERED_NOT_INDEXED: '발견됨—미색인',
  CRAWLED_NOT_INDEXED: '크롤링됨—미색인',
  DUPLICATE_NO_CANONICAL: '중복(canonical 없음)',
  PAGE_WITH_REDIRECT: '리디렉션',
  NOINDEX: 'noindex',
  BLOCKED: '차단됨',
  OTHER: '기타',
};
const REASON_COLOR: Record<string, string> = {
  DISCOVERED_NOT_INDEXED: '#f59e0b',
  CRAWLED_NOT_INDEXED: '#ef4444',
  DUPLICATE_NO_CANONICAL: '#a855f7',
  PAGE_WITH_REDIRECT: '#06b6d4',
  NOINDEX: '#6b7280',
  BLOCKED: '#1f2937',
  OTHER: '#94a3b8',
};

export function IndexTrendChart({ data }: { data: { date: string; indexed: number; total: number; not_indexed: number }[] }) {
  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 border-t-4 border-t-emerald-400 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-5 bg-emerald-400 rounded-full shrink-0" />
        <h3 className="text-base font-semibold text-gray-800">📈 색인 추이</h3>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="total" stroke="#94a3b8" strokeWidth={2} name="총 페이지" />
            <Line type="monotone" dataKey="indexed" stroke="#10b981" strokeWidth={2} name="색인됨" />
            <Line type="monotone" dataKey="not_indexed" stroke="#ef4444" strokeWidth={2} name="미색인" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-sm text-gray-500 leading-relaxed border-t-2 border-t-emerald-100 pt-3">
        색인 추이 차트는 최근 60일간 총 페이지 수·색인 완료 수·미색인 수의 일별 변화를 시계열 선 그래프로 보여 줍니다.
        녹색 선이 꾸준히 상승 추세라면 Google 크롤러가 새로 발행된 콘텐츠를 지속적으로 발견하고 있다는 긍정적 신호입니다.
        반면 녹색 선이 갑자기 하락한다면 robots.txt 설정 변경, 서버 오류 급증, 사이트맵 업데이트 실패 등을 즉시 점검해야 합니다.
        회색 선(총 페이지)과 녹색 선(색인됨)의 간격이 좁을수록 색인율이 높다는 의미이며, 빨간 선(미색인)이 지속적으로 높은 수준을 유지한다면 크롤링 예산 부족이나 콘텐츠 품질 문제를 검토하세요.
        새 글을 대량 발행한 직후에는 통상 1~2주 뒤 색인 수가 증가하는 패턴이 나타납니다.
        특정 날짜에 급격한 변화가 발생했다면 해당 시점의 배포 이력, Google 알고리즘 업데이트, 사이트맵 수정 내역과 대조해 원인을 추적하세요.
        정기적으로 스냅샷을 찍어 데이터를 축적하면 콘텐츠 전략 변경이나 사이트 개편이 색인에 미치는 영향을 데이터 기반으로 분석할 수 있습니다.
        이 차트를 장기 관리 도구로 활용하여 SEO 건강 상태를 꾸준히 모니터링하세요.
      </p>
    </div>
  );
}

export function ReasonsPie({ reasons }: { reasons: Record<string, number> }) {
  const data = Object.entries(reasons).map(([k, v]) => ({ name: REASON_LABEL[k] || k, value: v, color: REASON_COLOR[k] || '#94a3b8' }));
  const description = (
    <p className="mt-3 text-sm text-gray-500 leading-relaxed border-t-2 border-t-amber-100 pt-3">
      미색인 사유 분포 차트는 Google이 색인하지 못한 페이지들의 원인을 유형별로 분류해 비율을 시각화합니다.
      발견됨—미색인(DISCOVERED_NOT_INDEXED)은 Google이 URL 존재를 인식했지만 크롤링 우선순위에서 밀린 상태로, 내부 링크 강화와 크롤링 예산 확보로 개선할 수 있습니다.
      크롤링됨—미색인(CRAWLED_NOT_INDEXED)은 크롤러가 방문했지만 색인 가치가 낮다고 판단한 경우로, 콘텐츠 품질 향상·분량 확대·독창성 강화가 해결책입니다.
      중복(canonical 없음)은 동일하거나 유사한 내용이 여러 URL에 존재할 때 발생하며, canonical 태그로 대표 URL을 명시하면 해소됩니다.
      리디렉션 URL은 사이트맵에서 즉시 제거하고 최종 목적지 URL로 대체하세요.
      noindex 태그가 의도치 않게 설정된 페이지는 검색 노출이 완전히 차단되므로 우선 점검이 필요합니다.
      차단됨은 robots.txt 또는 HTTP X-Robots-Tag 헤더로 크롤러 접근을 막은 상태입니다.
      사유별 비중이 큰 항목부터 순서대로 해결하면 색인율을 가장 효율적으로 높일 수 있습니다.
      복합적인 사유가 나타날 경우 Google Search Console 공식 문서를 참고해 항목별 대응책을 세밀하게 수립하세요.
    </p>
  );
  if (data.length === 0) return (
    <div className="w-full bg-white rounded-xl border border-gray-200 border-t-4 border-t-amber-400 p-5 shadow-sm">
      <div className="flex items-center justify-center h-52 text-base text-gray-400">미색인 사유 데이터 없음</div>
      {description}
    </div>
  );
  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 border-t-4 border-t-amber-400 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-5 bg-amber-400 rounded-full shrink-0" />
        <h3 className="text-base font-semibold text-gray-800">🍩 미색인 사유 분포</h3>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(e) => `${e.name}: ${e.value}`} labelLine={false}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {description}
    </div>
  );
}

export function CategoryBars({ byCategory }: { byCategory: Record<string, { total: number; indexed: number }> }) {
  const data = Object.entries(byCategory).map(([k, v]) => ({
    category: k,
    indexed: v.indexed,
    not_indexed: Math.max(0, v.total - v.indexed),
    rate: v.total > 0 ? Math.round((v.indexed / v.total) * 100) : 0,
  }));
  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 border-t-4 border-t-indigo-500 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-5 bg-indigo-500 rounded-full shrink-0" />
        <h3 className="text-base font-semibold text-gray-800">📂 카테고리별 색인율</h3>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="indexed" stackId="a" fill="#10b981" name="색인됨" />
            <Bar dataKey="not_indexed" stackId="a" fill="#fca5a5" name="미색인" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-sm text-gray-500 leading-relaxed border-t-2 border-t-indigo-100 pt-3">
        카테고리별 색인율 차트는 GEO-AIO 블로그의 콘텐츠 카테고리별 색인 현황을 누적 막대 그래프로 보여 줍니다.
        진한 녹색 막대가 높을수록 해당 카테고리 콘텐츠가 Google 검색 결과에 많이 노출되고 있다는 의미입니다.
        카테고리 간 색인율 차이가 클 경우, 상대적으로 낮은 카테고리에서 내부 링크 추가·콘텐츠 품질 개선·발행 주기 조정이 필요합니다.
        다국어 콘텐츠(ko/en/zh/ja)가 특정 카테고리에 집중되어 있다면 hreflang 태그 설정 여부도 함께 점검하세요.
        색인율이 50% 미만인 카테고리는 즉시 진단 대상으로 삼고, 앞서 살펴본 미색인 사유 차트와 교차 분석하면 더 정확한 원인을 파악할 수 있습니다.
        특정 카테고리의 총 페이지 수가 갑자기 늘어났는데 색인 수가 그에 비례해 증가하지 않는다면 콘텐츠 품질이나 사이트맵 갱신 주기 문제를 의심하세요.
        성과가 좋은 카테고리의 전략(발행 주기, 내부 링크 구조, 콘텐츠 형식)을 낮은 카테고리에도 적용하여 전반적인 검색 가시성을 높이세요.
        정기 모니터링을 통해 SEO 투자 우선순위와 콘텐츠 로드맵을 데이터 기반으로 결정하세요.
      </p>
    </div>
  );
}

export function StatCards({ snapshot }: { snapshot: { total_pages: number; indexed: number; not_indexed: number; taken_at: string; is_mock?: boolean; verifiedCount?: number } }) {
  const rate = snapshot.total_pages > 0 ? ((snapshot.indexed / snapshot.total_pages) * 100).toFixed(1) : '0';
  const verifyRate = snapshot.total_pages > 0 && snapshot.verifiedCount ? ((snapshot.verifiedCount / snapshot.total_pages) * 100).toFixed(1) : '0';
  const cards = [
    { label: '총 페이지',  value: snapshot.total_pages,  color: 'text-gray-800',    bg: 'bg-gray-50',    border: 'border-l-4 border-l-gray-400',    accent: 'border-gray-200' },
    { label: '색인 완료',  value: snapshot.indexed,       color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-l-4 border-l-emerald-400', accent: 'border-emerald-200' },
    { label: '미색인',     value: snapshot.not_indexed,   color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-l-4 border-l-rose-400',    accent: 'border-rose-200' },
    { label: '색인율',     value: `${rate}%`,             color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-l-4 border-l-indigo-500',  accent: 'border-indigo-200' },
    ...(snapshot.verifiedCount !== undefined ? [
      { label: '확인됨',     value: snapshot.verifiedCount, color: 'text-violet-700',   bg: 'bg-violet-50',  border: 'border-l-4 border-l-violet-400',   accent: 'border-violet-200' },
      { label: '확인율',     value: `${verifyRate}%`,       color: 'text-cyan-700',    bg: 'bg-cyan-50',    border: 'border-l-4 border-l-cyan-400',    accent: 'border-cyan-200' },
    ] : []),
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map(c => (
        <div key={c.label} className={`${c.bg} rounded-xl p-4 border ${c.accent} ${c.border} shadow-sm`}>
          <div className="text-sm text-gray-500 mb-1">{c.label}</div>
          <div className={`text-3xl font-bold ${c.color}`}>{c.value}</div>
        </div>
      ))}
      {snapshot.is_mock && (
        <div className="col-span-full text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
          ⚠️ MOCK 데이터 표시 중 — 실데이터를 보려면 GSC OAuth 설정이 필요합니다 (<code>docs/gsc-oauth-setup.md</code>)
        </div>
      )}
      <div className="col-span-full text-xs text-gray-400 text-right">측정: {snapshot.taken_at.slice(0, 19).replace('T', ' ')}</div>
      <div className="col-span-full bg-white rounded-xl border border-gray-200 border-t-4 border-t-blue-400 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-5 bg-blue-400 rounded-full shrink-0" />
          <h3 className="text-base font-semibold text-gray-800">📊 색인 현황 요약</h3>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          이 요약 카드는 Google Search Console(GSC) 기준으로 사이트의 색인 건강 상태를 한눈에 보여 주는 핵심 지표입니다.
          총 페이지는 사이트맵에 등록된 URL 전체 수로, 실제 발행된 콘텐츠 규모를 나타냅니다.
          색인 완료는 Google 검색 결과에 실제로 노출될 수 있는 페이지 수이며, 이 수치가 높을수록 검색 유입 기회가 넓어집니다.
          미색인은 아직 검색 결과에 포함되지 않은 페이지 수로, 낮을수록 이상적입니다.
          색인율은 전체 페이지 대비 색인된 비율이며, 일반적으로 80% 이상이면 양호한 수준으로 평가합니다.
          <strong>확인됨</strong>은 GSC URL Inspection으로 상태를 확인한 페이지 수이고, <strong>확인율</strong>은 전체 대비 확인된 비율입니다.
          색인율이 지속적으로 낮다면 크롤링 예산 부족, noindex 태그 오설정, 내부 링크 부재, 중복 콘텐츠, 페이지 로딩 속도 저하 등 다양한 원인이 복합적으로 작용할 수 있습니다.
          미색인 페이지가 많을 경우 아래 미색인 사유 분포 차트와 카테고리별 색인율 차트를 함께 분석하여 개선 우선순위를 정하세요.
          측정 시각은 가장 최근 스냅샷 기준이며, 페이지 우측 상단의 지금 측정 버튼을 눌러 실시간으로 갱신할 수 있습니다.
          Google은 대규모 사이트를 전체 크롤링하는 데 며칠이 소요될 수 있으므로 최소 주 1회 이상 정기 측정을 권장합니다.
          데이터가 누적될수록 색인 추이 차트에서 변화 패턴을 더 정확히 파악할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
