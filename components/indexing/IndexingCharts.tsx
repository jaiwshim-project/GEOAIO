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
    <div className="w-full h-72 bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">📈 색인 추이</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="total" stroke="#94a3b8" strokeWidth={2} name="총 페이지" />
          <Line type="monotone" dataKey="indexed" stroke="#10b981" strokeWidth={2} name="색인됨" />
          <Line type="monotone" dataKey="not_indexed" stroke="#ef4444" strokeWidth={2} name="미색인" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReasonsPie({ reasons }: { reasons: Record<string, number> }) {
  const data = Object.entries(reasons).map(([k, v]) => ({ name: REASON_LABEL[k] || k, value: v, color: REASON_COLOR[k] || '#94a3b8' }));
  if (data.length === 0) return (
    <div className="w-full h-72 bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-center text-sm text-gray-400">
      미색인 사유 데이터 없음
    </div>
  );
  return (
    <div className="w-full h-72 bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">🍩 미색인 사유 분포</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(e) => `${e.name}: ${e.value}`} labelLine={false}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
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
    <div className="w-full h-72 bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">📂 카테고리별 색인율</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="category" tick={{ fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="indexed" stackId="a" fill="#10b981" name="색인됨" />
          <Bar dataKey="not_indexed" stackId="a" fill="#fca5a5" name="미색인" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatCards({ snapshot }: { snapshot: { total_pages: number; indexed: number; not_indexed: number; taken_at: string; is_mock?: boolean } }) {
  const rate = snapshot.total_pages > 0 ? ((snapshot.indexed / snapshot.total_pages) * 100).toFixed(1) : '0';
  const cards = [
    { label: '총 페이지', value: snapshot.total_pages, color: 'text-gray-700', bg: 'bg-gray-50' },
    { label: '색인 완료', value: snapshot.indexed, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: '미색인', value: snapshot.not_indexed, color: 'text-rose-700', bg: 'bg-rose-50' },
    { label: '색인율', value: `${rate}%`, color: 'text-indigo-700', bg: 'bg-indigo-50' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map(c => (
        <div key={c.label} className={`${c.bg} rounded-xl p-4 border border-gray-200`}>
          <div className="text-xs text-gray-500 mb-1">{c.label}</div>
          <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
        </div>
      ))}
      {snapshot.is_mock && (
        <div className="col-span-full text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
          ⚠️ MOCK 데이터 표시 중 — 실데이터를 보려면 GSC OAuth 설정이 필요합니다 (<code>docs/gsc-oauth-setup.md</code>)
        </div>
      )}
      <div className="col-span-full text-[11px] text-gray-400 text-right">측정: {snapshot.taken_at.slice(0, 19).replace('T', ' ')}</div>
    </div>
  );
}
