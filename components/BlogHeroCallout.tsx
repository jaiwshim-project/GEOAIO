// 블로그 히어로 강조 콜아웃 — 색인·AI 인용 최적화 메시지.
// /blog (LIST)와 /blog/category/[slug] 양쪽에서 공통 사용.
// 순수 CSS만으로 애니메이션·호버 동작하므로 'use client' 불필요 (서버 컴포넌트로도 사용 가능).

export default function BlogHeroCallout() {
  return (
    <div className="group relative mt-4 max-w-3xl cursor-pointer transition-transform duration-300 hover:-translate-y-0.5 hover:scale-[1.01] active:-translate-y-0 active:scale-[1.005]">
      {/* 외곽 펄스 글로우 (애니메이션) — hover/active 둘 다 강하게 */}
      <div className="absolute -inset-[3px] rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 blur-[6px] opacity-60 animate-pulse group-hover:opacity-95 group-hover:blur-[10px] group-active:opacity-95 transition-all duration-300" />
      {/* 정적 골드 보더 그라디언트 */}
      <div className="absolute -inset-[1.5px] rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 opacity-90 group-hover:-inset-[2.5px] group-hover:from-amber-600 group-hover:via-yellow-500 group-hover:to-amber-600 transition-all duration-300" />
      {/* 본체 카드 — 모바일 패딩 축소(px-3 py-3 → sm: 원래대로) */}
      <div className="relative flex items-start gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-3.5 bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 rounded-xl shadow-lg shadow-amber-200/60 ring-2 ring-white/60 group-hover:from-amber-200 group-hover:via-yellow-100 group-hover:to-orange-200 group-hover:shadow-xl group-hover:shadow-amber-300/70 group-hover:ring-amber-100 group-active:from-amber-200 group-active:via-yellow-100 group-active:to-orange-200 transition-all duration-300">
        {/* 우상단 반짝임 — 모바일에서는 항상 표시 */}
        <span className="pointer-events-none absolute top-2 right-3 text-amber-500 text-base opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-hover:animate-pulse animate-pulse transition-opacity duration-300">✨</span>
        {/* 좌측 골드 액센트 바 */}
        <span className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-amber-500 via-yellow-500 to-amber-500 rounded-full group-hover:top-1 group-hover:bottom-1 group-hover:w-1.5 transition-all duration-300" />
        {/* 배지 — 모바일에서 살짝 작게(6px) */}
        <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-white text-[12px] sm:text-[14px] font-bold shadow-md shadow-amber-500/50 ring-2 ring-white group-hover:scale-110 group-hover:rotate-12 group-hover:shadow-lg group-hover:shadow-amber-500/70 group-active:scale-105 group-active:rotate-6 transition-transform duration-300">✓</span>
        <p className="text-[12.5px] sm:text-[15px] font-bold text-slate-900 leading-snug pl-0.5 sm:pl-1 break-keep">
          본 블로그 사이트는{' '}
          <span className="inline-block px-1.5 py-0.5 rounded bg-amber-200/70 text-amber-900 font-extrabold transition-all duration-300 group-hover:bg-amber-300 group-hover:scale-105 group-active:bg-amber-300 break-keep">구글 검색과 색인</span>
          ,{' '}
          <span className="inline-block px-1.5 py-0.5 rounded bg-violet-200/70 text-violet-900 font-extrabold transition-all duration-300 group-hover:bg-violet-300 group-hover:scale-105 group-active:bg-violet-300 break-keep">AI 인용과 추천</span>
          에 최적화되어{' '}
          <span className="inline-block px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-extrabold shadow-sm transition-all duration-300 group-hover:from-amber-600 group-hover:to-yellow-600 group-hover:shadow-md group-hover:shadow-amber-400/60 group-active:from-amber-600 group-active:to-yellow-600 break-keep">최대의 홍보와 마케팅 효과</span>
          를 제공합니다!
        </p>
      </div>
    </div>
  );
}
