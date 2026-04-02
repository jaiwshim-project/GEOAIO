"use client";

import Link from "next/link";

export default function AXDiagnosisPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-sm text-indigo-200 font-medium mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            AX Ontology OS
          </div>
          <div className="inline-block px-6 py-2.5 mb-5 bg-gradient-to-r from-indigo-600/30 via-violet-600/30 to-purple-600/30 border border-indigo-400/40 rounded-xl backdrop-blur-sm">
            <span className="text-sm md:text-base font-bold bg-gradient-to-r from-blue-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent tracking-wide">
              AI-Powered Enterprise Transformation
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
            AX 사전 진단
          </h1>
          <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            조직의 AX(AI Transformation) 전환 준비 상태를 진단합니다.<br />
            <span className="text-indigo-300 font-semibold">인식 &middot; 구조 &middot; 실행</span> 3층 구조로 조직의 현재를 파악하고,<br />
            변화의 시작점을 찾아드립니다.
          </p>
        </div>

        {/* 3층 구조 설명 */}
        <div className="grid grid-cols-3 gap-3 mb-10 max-w-xl mx-auto">
          {[
            { icon: "🧠", label: "인식 진단", sub: "Mindset", color: "from-blue-500/20 to-blue-600/20 border-blue-500/30" },
            { icon: "🔗", label: "구조 진단", sub: "Ontology", color: "from-purple-500/20 to-purple-600/20 border-purple-500/30" },
            { icon: "🚀", label: "실행 진단", sub: "Execution", color: "from-emerald-500/20 to-emerald-600/20 border-emerald-500/30" },
          ].map((item, i) => (
            <div key={i} className={`bg-gradient-to-br ${item.color} border rounded-xl p-4 text-center backdrop-blur-sm`}>
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-white font-bold text-sm">{item.label}</div>
              <div className="text-gray-400 text-xs">{item.sub}</div>
            </div>
          ))}
        </div>

        {/* 경영진 / 직원 선택 */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* 경영진용 */}
          <Link href="/ax-diagnosis/executive" className="group block">
            <div className="relative bg-gradient-to-br from-amber-500/10 to-orange-600/10 border-2 border-amber-500/30 rounded-2xl p-8 text-center hover:border-amber-400/60 hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-xl font-extrabold text-white mb-2">경영진용 진단</h2>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                전략적 관점에서 조직의 AX 전환<br />
                방향과 투자 우선순위를 진단합니다
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-5">
                {["전략 방향", "투자 우선순위", "조직 준비도"].map((tag) => (
                  <span key={tag} className="px-2.5 py-1 bg-amber-500/15 text-amber-300 text-xs rounded-full border border-amber-500/20">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="text-amber-400 font-bold text-sm group-hover:gap-3 inline-flex items-center gap-2 transition-all">
                경영진 진단 시작
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>

          {/* 직원용 */}
          <Link href="/ax-diagnosis/employee" className="group block">
            <div className="relative bg-gradient-to-br from-indigo-500/10 to-violet-600/10 border-2 border-indigo-500/30 rounded-2xl p-8 text-center hover:border-indigo-400/60 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-extrabold text-white mb-2">직원용 진단</h2>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                현장 관점에서 업무 구조, 병목,<br />
                자동화 가능성을 진단합니다
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-5">
                {["업무 구조", "병목 분석", "자동화 가능성"].map((tag) => (
                  <span key={tag} className="px-2.5 py-1 bg-indigo-500/15 text-indigo-300 text-xs rounded-full border border-indigo-500/20">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="text-indigo-400 font-bold text-sm group-hover:gap-3 inline-flex items-center gap-2 transition-all">
                직원 진단 시작
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* 소요시간 안내 */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            소요시간: 약 10분 &middot; 진행률 표시 &middot; 중간 저장 가능
          </p>
        </div>

        {/* 홈으로 */}
        <div className="text-center mt-6">
          <Link href="/landing" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            &larr; 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
