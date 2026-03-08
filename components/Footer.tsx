'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-slate-900 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="md:col-span-2">
            <div className="mb-3">
              <Image src="/images/logo-geoaio.png" alt="GEOAIO" width={400} height={80} className="h-10 w-auto rounded" quality={100} unoptimized />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              AI 검색엔진(AI Overview, Generative Engine)에 최적화된 콘텐츠를 분석하고 생성하는 올인원 도구입니다.
              Claude AI를 활용하여 콘텐츠의 GEO/AIO 점수를 분석하고, 최적화된 콘텐츠를 자동으로 생성합니다.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">서비스</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>홈</Link></li>
              <li><Link href="/analyze" className="text-xs text-slate-400 hover:text-white transition-colors">콘텐츠 분석</Link></li>
              <li><Link href="/generate" className="text-xs text-slate-400 hover:text-white transition-colors">콘텐츠 생성</Link></li>
              <li><Link href="/landing" className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>홍보페이지</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">리소스</h4>
            <ul className="space-y-2">
              <li><Link href="/manual" className="text-xs text-slate-400 hover:text-white transition-colors">사용자 매뉴얼</Link></li>
              <li><Link href="/make-guide" className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>Make 활용 매뉴얼</Link></li>
              <li><a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-white transition-colors">Gemini API Key 발급</a></li>
              <li>
                <Link href="/admin" className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  관리자 대시보드
                </Link>
              </li>
            </ul>
          </div>
        </div>
        {/* 연락처 & 법적 보호 */}
        <div className="border-t border-slate-700 pt-4 mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">심재우 대표</span>
              <a href="tel:010-2397-5734" className="flex items-center gap-1.5 hover:text-white transition-colors">
                <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                010-2397-5734
              </a>
              <a href="mailto:jaiwshim@gmail.com" className="flex items-center gap-1.5 hover:text-white transition-colors">
                <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                jaiwshim@gmail.com
              </a>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg">
              <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              <span className="text-[11px] text-slate-300 font-medium">특허 및 저작권 등록으로 법적 보호를 받고 있습니다.</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            &copy; 2026 GEOAIO &mdash; AI 검색엔진 콘텐츠 최적화 도구
          </p>
          <p className="text-xs text-slate-500">
            Powered by AI
          </p>
        </div>
      </div>
    </footer>
  );
}
