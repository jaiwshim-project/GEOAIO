'use client';

import Link from 'next/link';
import { downloadManualDocx } from '@/lib/generateManualDocx';
import Footer from '@/components/Footer';

export default function ManualPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900">사용자 매뉴얼</h1>
                <p className="text-[11px] text-gray-700">GEO-AIO 사용 가이드</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadManualDocx()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm border border-sky-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                DOCX 다운로드
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-800 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-violet-300 hover:border-violet-400"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* 소개 */}
        <section className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm border border-indigo-200 p-6">
          <h2 className="text-sm font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent mb-3">GEO-AIO란?</h2>
          <p className="text-[11px] text-gray-800 leading-relaxed">
            GEO-AIO는 AI 검색엔진(AI Overview, Generative Engine)에 최적화된 콘텐츠를 작성할 수 있도록
            도와주는 종합 콘텐츠 플랫폼입니다. Google Gemini API를 활용하여 콘텐츠 분석, 생성, 키워드 경쟁 분석, 시리즈 기획,
            SNS 채널별 변환, <strong>15가지 톤</strong>의 콘텐츠 동시 생성, 프로젝트별 콘텐츠 관리 등 다양한 기능을 제공하며, Make.com 연동을 통한 자동화도 지원합니다.
          </p>
        </section>

        {/* 네비게이션 가이드 */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-slate-600 to-gray-700 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">&#9776;</span>
            <span className="bg-gradient-to-r from-slate-700 to-gray-600 bg-clip-text text-transparent">메뉴 구조 안내</span>
          </h2>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h3 className="text-[13pt] font-semibold text-gray-800 mb-2">주요 메뉴</h3>
              <ul className="space-y-2 text-[11px] text-gray-800">
                <li className="flex items-start gap-2"><span className="text-gray-500 font-bold">&#8226;</span> <strong>분석:</strong> 기존 콘텐츠의 GEO/AIO 점수를 분석합니다</li>
                <li className="flex items-start gap-2"><span className="text-gray-500 font-bold">&#8226;</span> <strong>생성:</strong> AI가 최적화된 새 콘텐츠를 생성합니다</li>
                <li className="flex items-start gap-2"><span className="text-gray-500 font-bold">&#8226;</span> <strong>키워드:</strong> 키워드 경쟁 분석 및 전략 수립</li>
                <li className="flex items-start gap-2"><span className="text-gray-500 font-bold">&#8226;</span> <strong>시리즈:</strong> 에피소드 기반 콘텐츠 시리즈 기획</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h3 className="text-[13pt] font-semibold text-gray-800 mb-2">부가 메뉴</h3>
              <ul className="space-y-2 text-[11px] text-gray-800">
                <li className="flex items-start gap-2"><span className="text-gray-500 font-bold">&#8226;</span> <strong>요금제:</strong> 플랜 확인 및 업그레이드</li>
                <li className="flex items-start gap-2"><span className="text-gray-500 font-bold">&#8226;</span> <strong>자료실:</strong> GEO/AIO 관련 가이드 PDF</li>
                <li className="flex items-start gap-2"><span className="text-gray-500 font-bold">&#8226;</span> <strong>커뮤니티:</strong> 질문, 후기, 정보 공유</li>
                <li className="flex items-start gap-2"><span className="text-gray-500 font-bold">&#8226;</span> <strong>Make 연동:</strong> Make.com 자동화 연동 가이드</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h3 className="text-[13pt] font-semibold text-gray-800 mb-2">요금제 뱃지</h3>
              <p className="text-[11px] text-gray-800 mb-2">로그인 후 헤더에 현재 요금제가 뱃지로 표시됩니다.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] font-bold rounded-full">FREE</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[11px] font-bold rounded-full">PRO</span>
                <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-[11px] font-bold rounded-full">MAX</span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[11px] font-bold rounded-full">TESTER</span>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[11px] font-bold rounded-full">ADMIN</span>
              </div>
            </div>
          </div>
        </section>

        {/* API 키 설정 */}
        <section className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">1</span>
            <span className="bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">API 키 설정</span>
          </h2>
          <p className="text-[11px] text-gray-800 mb-3">콘텐츠 분석/생성 및 이미지 생성을 위해 Gemini API 키가 필요합니다. 아래 3가지 방법으로 등록할 수 있습니다.</p>
          <div className="space-y-3">
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <h3 className="text-[13pt] font-semibold text-amber-800 mb-2 flex items-center gap-2">
                API 키 등록 방법 3가지
              </h3>
              <div className="space-y-2">
                <div className="bg-white rounded-lg p-3 border border-amber-200">
                  <p className="text-[11px] font-semibold text-amber-700 mb-1">① 헤더 드롭다운 메뉴 (모달)</p>
                  <p className="text-[11px] text-gray-700">로그인 후 우측 상단 사용자 이름 클릭 → <strong>API 키 설정</strong> 선택 → 팝업 모달에서 키 입력 후 저장. 어느 페이지에서든 바로 접근 가능합니다.</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-amber-200">
                  <p className="text-[11px] font-semibold text-amber-700 mb-1">② 콘텐츠 생성 페이지 하단 상시 패널</p>
                  <p className="text-[11px] text-gray-700">콘텐츠 생성 페이지(<code className="bg-amber-100 px-1 py-0.5 rounded text-amber-700">/generate</code>) 하단 &quot;GEO/AIO 최적화 콘텐츠 생성&quot; 버튼 바로 아래에 API 키 설정 카드가 <strong>상시 표시</strong>됩니다. 생성 도중 키 오류가 발생해도 페이지를 벗어나지 않고 즉시 새 키를 입력·저장할 수 있습니다.</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-amber-200">
                  <p className="text-[11px] font-semibold text-amber-700 mb-1">③ 설정 페이지</p>
                  <p className="text-[11px] text-gray-700">헤더 드롭다운 → <strong>API 키 설정</strong>은 모달로 열리며, 직접 <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-700">/settings</code> 페이지에도 접근 가능합니다.</p>
                </div>
              </div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <h3 className="text-[13pt] font-semibold text-amber-800 mb-2 flex items-center gap-2">
                Gemini API Key 발급 방법
                <span className="px-2 py-0.5 bg-amber-200 text-amber-700 text-[11px] font-bold rounded-full">무료</span>
              </h3>
              <p className="text-[11px] text-gray-800 mb-2">콘텐츠 분석, 생성, AI 이미지 생성에 사용됩니다.</p>
              <div className="bg-white rounded-lg p-3 border border-amber-200">
                <ol className="space-y-1 text-[11px] text-gray-700">
                  <li>1. <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline hover:text-indigo-800">Google AI Studio</a>에 접속합니다</li>
                  <li>2. Google 계정으로 로그인합니다</li>
                  <li>3. &quot;API 키 만들기&quot; 또는 &quot;Create API Key&quot; 버튼을 클릭합니다</li>
                  <li>4. 생성된 키를 복사하여 API 키 입력란에 붙여넣고 저장합니다</li>
                </ol>
              </div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <h3 className="text-[13pt] font-semibold text-amber-800 mb-2">키 저장 방식</h3>
              <p className="text-[11px] text-gray-800">입력한 API 키는 브라우저 로컬 스토리지 및 Supabase에 안전하게 저장됩니다. 브라우저를 닫아도 키가 유지되므로 매번 다시 입력할 필요가 없습니다. 키 오류 발생 시 생성 페이지 하단 패널에서 바로 교체할 수 있습니다.</p>
            </div>
          </div>
        </section>

        {/* 프로젝트 관리 (사용자 대시보드) */}
        <section className="bg-white rounded-xl shadow-sm border border-indigo-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">2</span>
            <span className="bg-gradient-to-r from-indigo-700 to-violet-600 bg-clip-text text-transparent">프로젝트 관리 (사용자 대시보드)</span>
          </h2>
          <p className="text-[11px] text-gray-800 mb-3">GEO-AIO는 <strong>프로젝트</strong> 단위로 콘텐츠를 관리합니다. 사용자 대시보드(<code className="bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-700 text-[11px]">/user-dashboard</code>)에서 프로젝트를 생성하고 참조 자료 파일을 업로드한 뒤, 해당 프로젝트로 콘텐츠를 생성할 수 있습니다.</p>
          <div className="space-y-3">
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <h3 className="text-[13pt] font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                프로젝트 추가
                <span className="px-2 py-0.5 bg-indigo-200 text-indigo-700 text-[11px] font-bold rounded-full">NEW</span>
              </h3>
              <ul className="space-y-2 text-[11px] text-gray-800">
                <li className="flex items-start gap-2"><span className="text-indigo-500 font-bold">&#8226;</span> <strong>프로젝트 이름 (필수):</strong> AX덴탈그룹, 디지털스마일치과 등 클라이언트/브랜드명</li>
                <li className="flex items-start gap-2"><span className="text-indigo-500 font-bold">&#8226;</span> <strong>설명 (선택):</strong> 프로젝트에 대한 간단한 메모</li>
                <li className="flex items-start gap-2"><span className="text-indigo-500 font-bold">&#8226;</span> <strong>참조 파일 업로드 (선택):</strong> PDF, DOCX, MD, TXT 형식 지원 · 각 20MB 이하</li>
              </ul>
              <div className="mt-3 bg-white rounded-lg p-3 border border-indigo-200">
                <p className="text-[11px] font-medium text-indigo-700 mb-1">파일 드래그앤드롭 지원</p>
                <p className="text-[11px] text-gray-700">병원 소개서, 서비스 설명서, 기존 블로그 글 등을 파일로 업로드하면 AI가 해당 정보를 참조하여 더 정확한 콘텐츠를 생성합니다.</p>
              </div>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <h3 className="text-[13pt] font-semibold text-indigo-800 mb-2">프로젝트 선택 → 콘텐츠 생성</h3>
              <p className="text-[11px] text-gray-800 mb-2">프로젝트 목록에서 <strong>"선택"</strong> 버튼을 클릭하면 해당 프로젝트가 활성화되고 <strong>콘텐츠 생성 페이지(/generate)</strong>로 자동 이동합니다. 이후 생성되는 모든 콘텐츠는 이 프로젝트에 저장됩니다.</p>
              <div className="bg-white rounded-lg p-3 border border-indigo-200">
                <p className="text-[11px] font-medium text-indigo-700 mb-1">상단 배너 확인</p>
                <p className="text-[11px] text-gray-700">콘텐츠 생성 페이지 상단에 현재 선택된 프로젝트 이름이 표시됩니다. 다른 프로젝트로 콘텐츠를 생성하려면 사용자 대시보드로 돌아가 프로젝트를 재선택하세요.</p>
              </div>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <h3 className="text-[13pt] font-semibold text-indigo-800 mb-2">생성된 콘텐츠 목록 보기</h3>
              <p className="text-[11px] text-gray-800 mb-2">사용자 대시보드 하단의 <strong>"콘텐츠 생성"</strong> 버튼을 클릭하면 프로젝트별 생성 이력을 확인할 수 있습니다.</p>
              <ul className="space-y-1 text-[11px] text-gray-700">
                <li className="flex items-start gap-2"><span className="text-indigo-400 font-bold">&#8226;</span> 프로젝트 탭 버튼 클릭 → 해당 프로젝트의 콘텐츠 목록 표시</li>
                <li className="flex items-start gap-2"><span className="text-indigo-400 font-bold">&#8226;</span> 각 항목 클릭 → 생성 결과 상세 페이지로 이동</li>
                <li className="flex items-start gap-2"><span className="text-indigo-400 font-bold">&#8226;</span> &quot;+ 새 콘텐츠 생성&quot; 버튼 → 콘텐츠 생성 페이지로 이동</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 콘텐츠 분석 */}
        <section className="bg-white rounded-xl shadow-sm border border-blue-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">3</span>
            <span className="bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">콘텐츠 분석</span>
          </h2>
          <p className="text-[11px] text-gray-800 mb-3">기존 콘텐츠의 GEO/AIO 최적화 수준을 분석합니다. 상단 메뉴에서 &quot;분석&quot;을 클릭하여 접근합니다.</p>
          <div className="space-y-3 text-gray-800">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <h3 className="text-[13pt] font-semibold text-blue-800 mb-2">입력 항목</h3>
              <ul className="space-y-2 text-[11px] text-gray-800">
                <li className="flex items-start gap-2"><span className="text-blue-500 font-bold">&#8226;</span> <strong>콘텐츠 입력 (필수):</strong> 분석할 콘텐츠(블로그 글, 기사, 웹페이지 텍스트 등)를 텍스트 영역에 붙여넣기 합니다</li>
                <li className="flex items-start gap-2"><span className="text-blue-500 font-bold">&#8226;</span> <strong>타겟 키워드 (선택):</strong> 최적화하려는 주요 검색 키워드를 입력하면 해당 키워드에 대한 맞춤 분석을 제공합니다</li>
                <li className="flex items-start gap-2"><span className="text-blue-500 font-bold">&#8226;</span> <strong>URL (선택):</strong> 콘텐츠가 게시된 URL을 입력하면 추가적인 컨텍스트를 바탕으로 분석합니다</li>
              </ul>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <h3 className="text-[13pt] font-semibold text-blue-800 mb-2">분석 결과 탭</h3>
              <p className="text-[11px] text-gray-800 mb-2">분석이 완료되면 5개 탭으로 결과가 표시됩니다.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="text-[11px] font-medium text-blue-700 mb-1">종합 개요</p>
                  <p className="text-[11px] text-gray-700">전체 GEO/AIO 점수와 주요 지표를 한눈에 확인하는 대시보드</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="text-[11px] font-medium text-blue-700 mb-1">AIO 분석</p>
                  <p className="text-[11px] text-gray-700">Google AI Overview 인용 가능성 분석 (구조화 답변, 신뢰성, 간결성)</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="text-[11px] font-medium text-blue-700 mb-1">GEO 분석</p>
                  <p className="text-[11px] text-gray-700">생성형 AI 엔진의 콘텐츠 이해도 분석 (의미적 명확성, 전문성, 컨텍스트)</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="text-[11px] font-medium text-blue-700 mb-1">키워드 분석</p>
                  <p className="text-[11px] text-gray-700">콘텐츠 내 키워드 분포, 밀도, 관련성 및 타겟 키워드 최적화 상태</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="text-[11px] font-medium text-blue-700 mb-1">개선 제안</p>
                  <p className="text-[11px] text-gray-700">우선순위별 구체적인 콘텐츠 개선 제안 및 실행 가능한 액션 아이템</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 콘텐츠 생성 */}
        <section className="bg-white rounded-xl shadow-sm border border-emerald-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">4</span>
            <span className="bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">콘텐츠 생성</span>
          </h2>
          <p className="text-[11px] text-gray-800 mb-3">Gemini AI가 GEO/AIO에 최적화된 콘텐츠를 자동으로 생성합니다. 프로젝트 선택 후 사업 정보 → 콘텐츠 유형 → 생성 순서로 진행됩니다. 생성 시 <strong>15가지 톤</strong>이 동시 생성되며 결과 페이지에서 원하는 버전을 탭으로 선택합니다.</p>
          <div className="space-y-3">
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <h3 className="text-[13pt] font-semibold text-emerald-800 mb-2">Step 1: 사업 정보 입력</h3>
              <p className="text-[11px] text-gray-800 mb-2">사업 정보를 입력하면 맥락에 맞는 고품질 콘텐츠가 생성됩니다. 상단에 현재 선택된 <strong>프로젝트</strong>가 표시되며, 해당 프로젝트의 참조 파일이 자동으로 반영됩니다.</p>
              <ul className="space-y-2 text-[11px] text-gray-800">
                <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">&#8226;</span> <strong>회사 정보:</strong> 회사명, 소재지, 웹사이트 URL</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">&#8226;</span> <strong>브랜드 정보:</strong> 브랜드명, 슬로건</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">&#8226;</span> <strong>업종:</strong> IT/소프트웨어, 의료/헬스케어, 교육, 금융, 쇼핑몰, 부동산, 요식업, 뷰티/패션, 여행/관광, 제조업, 법률/회계, 기타</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">&#8226;</span> <strong>제품/서비스:</strong> 주요 제품 및 서비스 설명</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">&#8226;</span> <strong>타겟 고객:</strong> 주요 고객층 설명</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">&#8226;</span> <strong>강점/차별점:</strong> 경쟁 우위 요소</li>
              </ul>
              <div className="mt-3 bg-white rounded-lg p-3 border border-emerald-200">
                <p className="text-[11px] font-medium text-emerald-700 mb-1">프로필 저장/불러오기</p>
                <p className="text-[11px] text-gray-700">입력한 사업 정보를 프로필로 저장하면 다음에 바로 불러올 수 있습니다. 여러 브랜드/사업 프로필을 관리할 수 있어 반복 입력이 필요 없습니다.</p>
              </div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <h3 className="text-[13pt] font-semibold text-emerald-800 mb-2">Step 2: 콘텐츠 유형 선택</h3>
              <ul className="space-y-2 text-[11px] text-gray-800">
                <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">&#8226;</span> <strong>콘텐츠 유형:</strong> 블로그, 제품 설명, FAQ, How-to 가이드, 랜딩 페이지, 기술 문서, SNS 포스트, 이메일</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">&#8226;</span> <strong>타겟 키워드:</strong> SEO에 활용할 핵심 키워드를 지정합니다</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">&#8226;</span> <strong>15가지 톤 동시 생성:</strong> 전문적 / 친근한 / 설득적 / 간결한 / 스토리텔링 / 뉴스형 / 교육형 / 비교분석형 / 사례연구형 / 감성형 / FAQ형 / 체크리스트형 / 비용분석형 / 위험·금기형 / 오해깨기형 — 생성 완료 후 결과 페이지에서 탭으로 선택</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">&#8226;</span> <strong>톤별 맞춤 제목·내용:</strong> 동일한 주제라도 톤마다 제목 형식·도입부·문체·구조가 완전히 다르게 생성됩니다</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">&#8226;</span> <strong>하단 API 키 패널:</strong> 생성 버튼 아래에 API 키 설정 카드가 상시 표시 — 키 오류 시 페이지 이동 없이 즉시 교체 가능</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-purple-200 ring-1 ring-purple-100">
              <h3 className="text-[13pt] font-semibold text-purple-800 mb-2 flex items-center gap-2">
                <span>🎯</span> Step 2.5: CEP 장면 발굴 위저드
                <span className="text-[10px] px-2 py-0.5 bg-purple-200 text-purple-800 rounded-full font-bold">NEW · 선택</span>
              </h3>
              <p className="text-[11px] text-gray-800 mb-3"><strong>CEP(Category Entry Point)</strong>는 소비자가 카테고리에 진입하는 &quot;순간·장면&quot;입니다. 콘텐츠 생성 화면 상단의 <strong>&quot;🎯 CEP 장면 발굴&quot;</strong> 패널을 펼치면 검색 데이터 기반 5단계 위저드가 동작하여, AI 검색엔진이 인용하기 좋은 <strong>장면 문장</strong>을 자동 도출합니다.</p>
              <ol className="space-y-2 text-[11px] text-gray-800 mb-3">
                <li className="flex items-start gap-2"><span className="text-purple-500 font-bold whitespace-nowrap">①</span> <span><strong>시드 키워드 입력</strong> + [클러스터 발견] 클릭 → 네이버 자동완성과 LLM 분석으로 검색어 풀과 <strong>&quot;삶의 언어&quot;</strong>(예: &quot;비 오는 주말 아이와 갈 곳&quot;) 자동 수집</span></li>
                <li className="flex items-start gap-2"><span className="text-purple-500 font-bold whitespace-nowrap">②</span> <span><strong>클러스터 카드 선택</strong> → 같은 의도로 묶인 검색어 그룹과 검색 경로(예: 선크림 밀림 → 화장 뜸 → 화장 잘먹는 선크림)를 보고 점유할 클러스터 1개 선택</span></li>
                <li className="flex items-start gap-2"><span className="text-purple-500 font-bold whitespace-nowrap">③</span> <span><strong>[장면 번역] 클릭</strong> → 클러스터를 한 줄 장면 문장으로 자동 변환 (예: &quot;아침 화장 전, 선크림은 발라야 하지만 베이스 메이크업이 뜨지 않기를 바라는 순간&quot;)</span></li>
                <li className="flex items-start gap-2"><span className="text-purple-500 font-bold whitespace-nowrap">④</span> <span><strong>[후보 평가] 클릭</strong> → 시장성 / 브랜드 적합성 / 입증 가능성 3축 점수표가 생성. 명시적 CEP와 잠재적 CEP를 비교</span></li>
                <li className="flex items-start gap-2"><span className="text-purple-500 font-bold whitespace-nowrap">⑤</span> <span><strong>장면 문장 확정</strong> → 결정한 문장은 그대로 콘텐츠 생성에 자동 전달되어 H1·도입부·H2·결론을 그 장면이 점유</span></li>
              </ol>
              <div className="bg-white rounded-lg p-3 border border-purple-200 mb-2">
                <p className="text-[11px] font-bold text-purple-700 mb-1">💡 효과</p>
                <ul className="space-y-1 text-[11px] text-gray-700">
                  <li>• <strong>AI 검색 인용률 ↑</strong> — Perplexity·SearchGPT가 &quot;장면 쿼리&quot;에 직접 답으로 발췌</li>
                  <li>• <strong>경쟁 강도 ↓</strong> — &quot;30대 여성&quot; 같은 인구통계 표현 대신 비어 있는 장면 좌표 점유</li>
                  <li>• <strong>E-E-A-T × CEP 결합</strong> — &quot;누가 썼는가&quot;(권위) + &quot;어떤 순간을 위해&quot;(맥락) 이중 신뢰 신호</li>
                </ul>
              </div>
              <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-200">
                <p className="text-[10px] text-amber-800"><strong>⚠️ 사용 팁:</strong> 위저드 패널은 기본 접힘 상태입니다. 카테고리 선택 후 패널 헤더의 &quot;🎯 CEP 장면 발굴&quot;을 클릭해 펼치세요. 입력한 장면 문장은 15가지 톤 생성에 일괄 적용됩니다. CEP 적용 vs 미적용의 비교 데모는 프로젝트 루트 <code className="bg-purple-100 px-1 py-0.5 rounded text-purple-700">cep-comparison-demo.html</code>에서 확인할 수 있습니다.</p>
              </div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <h3 className="text-[13pt] font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                참조 자료 활용 (RAG 방식)
              </h3>
              <p className="text-[11px] text-gray-800 mb-3">추가 요구사항 입력란에 참조 자료를 입력하거나, 파일을 업로드하면 해당 정보를 기반으로 더 정확하고 구체적인 콘텐츠를 생성합니다.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-emerald-200">
                  <p className="text-[11px] font-medium text-emerald-700 mb-1">텍스트 입력</p>
                  <p className="text-[11px] text-gray-700">추가 요구사항 입력란에 통계, 사실관계, 연구 결과 등 참조할 정보를 직접 입력합니다.</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-200">
                  <p className="text-[11px] font-medium text-emerald-700 mb-1">파일 업로드 (드래그앤드롭 지원)</p>
                  <p className="text-[11px] text-gray-700 mb-1">최대 5개 파일, 각 20MB 이하. 지원 형식:</p>
                  <p className="text-[10px] text-gray-500">TXT, MD, CSV, JSON, HTML, PDF, DOCX, DOC, XLS, XLSX, PPT, PPTX, PNG, JPG, JPEG, WEBP</p>
                </div>
              </div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <h3 className="text-[13pt] font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                생성 결과 페이지 기능
              </h3>
              <p className="text-[11px] text-gray-800 mb-3">콘텐츠 생성이 완료되면 결과 페이지에서 다양한 후속 작업을 수행할 수 있습니다.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-emerald-200">
                  <p className="text-[11px] font-medium text-emerald-700 mb-1">톤/스타일 탭 (15가지 컬러 카드)</p>
                  <p className="text-[11px] text-gray-700">결과 페이지 상단에 15가지 톤이 컬러 카드 그리드로 표시됩니다. 각 탭은 고유 배경색·테두리색을 가지며, 활성 탭에는 체크 뱃지가 표시됩니다. 클릭하면 해당 톤의 제목·내용으로 전환됩니다.</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-200">
                  <p className="text-[11px] font-medium text-emerald-700 mb-1">콘텐츠 헤더</p>
                  <p className="text-[11px] text-gray-700">생성된 제목, 글자 수, 예상 읽기 시간, 카테고리 뱃지가 표시됩니다.</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-200">
                  <p className="text-[11px] font-medium text-emerald-700 mb-1">SEO 최적화 팁</p>
                  <p className="text-[11px] text-gray-700">AI가 생성한 SEO 최적화 제안이 파란색 정보 박스에 표시됩니다.</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-200">
                  <p className="text-[11px] font-medium text-emerald-700 mb-1">AI 이미지 생성</p>
                  <p className="text-[11px] text-gray-700">버튼 클릭으로 3장의 AI 이미지를 생성하고, 다운로드하거나 본문에 삽입할 수 있습니다.</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-200">
                  <p className="text-[11px] font-medium text-emerald-700 mb-1">수정/재생성</p>
                  <p className="text-[11px] text-gray-700">수정 요청 사항을 입력하면 AI가 해당 내용을 반영하여 콘텐츠를 재생성합니다.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. 키워드 경쟁 분석 */}
        <section className="bg-white rounded-xl shadow-sm border border-cyan-200 p-6">
          <h2 className="text-sm font-bold flex items-center gap-3 mb-3">
            <span className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">5</span>
            <span className="bg-gradient-to-r from-cyan-700 to-blue-600 bg-clip-text text-transparent">키워드 경쟁 분석</span>
          </h2>
          <p className="text-[11px] text-gray-800 mb-3">타겟 키워드의 AI 검색 경쟁도를 분석하고, 차별화 전략을 수립합니다. 상단 메뉴에서 &quot;키워드&quot;를 클릭하여 접근합니다.</p>

          <div className="space-y-3">
            <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-100">
              <h3 className="text-[13pt] font-semibold text-cyan-800 mb-3">입력 항목</h3>
              <ul className="space-y-2 text-[11px] text-gray-700">
                <li className="flex items-start gap-2"><span className="text-cyan-500 font-bold">&#8226;</span> <strong>분석 키워드 (필수):</strong> 분석할 키워드를 입력합니다 (예: &quot;AI 마케팅 전략&quot;)</li>
                <li className="flex items-start gap-2"><span className="text-cyan-500 font-bold">&#8226;</span> <strong>산업 분야 (선택):</strong> IT/테크, 교육, 의료/건강, 금융/보험, 부동산, 여행/관광, 법률/컨설팅, 마케팅/광고, 이커머스, 요식업, 기타 중 선택</li>
              </ul>
              <div className="mt-3 bg-white rounded-lg p-3 border border-cyan-200">
                <p className="text-[11px] font-medium text-cyan-700 mb-1">사용 흐름</p>
                <p className="text-[11px] text-gray-700">키워드 입력 → 산업 분야 선택(선택) → &quot;분석 시작&quot; 버튼 클릭 → AI가 해당 키워드의 경쟁 환경을 종합 분석하여 7개 섹션으로 결과를 표시합니다.</p>
              </div>
            </div>

            <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-100">
              <h3 className="text-[13pt] font-semibold text-cyan-800 mb-3">분석 결과 상세 (7개 섹션)</h3>
              <div className="space-y-3">
                {/* 1. 분석 개요 */}
                <div className="bg-white rounded-lg p-3 border border-cyan-200">
                  <p className="text-[11px] font-medium text-cyan-700 mb-1 flex items-center gap-2">
                    <span className="w-5 h-5 bg-cyan-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                    분석 개요
                  </p>
                  <p className="text-[11px] text-gray-700 mb-2">3개 카드로 핵심 정보를 한눈에 보여줍니다.</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-purple-50 rounded p-2 border border-purple-100 text-center">
                      <p className="text-[10px] font-medium text-purple-600">키워드</p>
                      <p className="text-[10px] text-gray-600">분석 대상 키워드명</p>
                    </div>
                    <div className="bg-blue-50 rounded p-2 border border-blue-100 text-center">
                      <p className="text-[10px] font-medium text-blue-600">검색 의도</p>
                      <p className="text-[10px] text-gray-600">사용자 검색 의도 분류</p>
                    </div>
                    <div className="bg-orange-50 rounded p-2 border border-orange-100 text-center">
                      <p className="text-[10px] font-medium text-orange-600">난이도</p>
                      <p className="text-[10px] text-gray-600">상(빨강)/중(노랑)/하(초록)</p>
                    </div>
                  </div>
                </div>

                {/* 2. AI 인용 요소 */}
                <div className="bg-white rounded-lg p-3 border border-cyan-200">
                  <p className="text-[11px] font-medium text-cyan-700 mb-1 flex items-center gap-2">
                    <span className="w-5 h-5 bg-cyan-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                    AI 인용 요소
                  </p>
                  <p className="text-[11px] text-gray-700">AI가 콘텐츠를 인용할 때 중요하게 평가하는 요소를 카드별로 분석합니다. 각 요소에는 <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded">높음</span> <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">중간</span> <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">낮음</span> 중요도 뱃지가 표시되며, 구체적인 설명이 함께 제공됩니다.</p>
                </div>

                {/* 3. 필수 다룰 주제 */}
                <div className="bg-white rounded-lg p-3 border border-cyan-200">
                  <p className="text-[11px] font-medium text-cyan-700 mb-1 flex items-center gap-2">
                    <span className="w-5 h-5 bg-cyan-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">3</span>
                    필수 다룰 주제
                  </p>
                  <p className="text-[11px] text-gray-700">해당 키워드로 콘텐츠를 작성할 때 반드시 포함해야 할 핵심 주제들이 번호 순서대로 나열됩니다. AI가 인용할 만한 콘텐츠를 만들려면 이 주제들을 빠짐없이 다뤄야 합니다.</p>
                </div>

                {/* 4. 차별화 전략 */}
                <div className="bg-white rounded-lg p-3 border border-cyan-200">
                  <p className="text-[11px] font-medium text-cyan-700 mb-1 flex items-center gap-2">
                    <span className="w-5 h-5 bg-cyan-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">4</span>
                    차별화 전략
                  </p>
                  <p className="text-[11px] text-gray-700">경쟁 콘텐츠와 차별화할 수 있는 전략이 카드 형태로 제시됩니다. 각 카드에는 <strong>전략명</strong>, <strong>설명</strong>, 그리고 &quot;구현 방법&quot; 항목으로 구체적인 실행 방안이 포함됩니다.</p>
                </div>

                {/* 5. 콘텐츠 추천 */}
                <div className="bg-white rounded-lg p-3 border border-cyan-200">
                  <p className="text-[11px] font-medium text-cyan-700 mb-1 flex items-center gap-2">
                    <span className="w-5 h-5 bg-cyan-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">5</span>
                    콘텐츠 추천
                  </p>
                  <p className="text-[11px] text-gray-700">콘텐츠 유형별(블로그, 영상, 인포그래픽 등) 맞춤 추천 사항이 제공됩니다. 각 유형마다 권장 글자 수, 형식, 톤, 핵심 포함 요소 등이 불릿 포인트로 정리됩니다.</p>
                </div>

                {/* 6. 연관 키워드 */}
                <div className="bg-white rounded-lg p-3 border border-cyan-200">
                  <p className="text-[11px] font-medium text-cyan-700 mb-1 flex items-center gap-2">
                    <span className="w-5 h-5 bg-cyan-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">6</span>
                    연관 키워드
                  </p>
                  <p className="text-[11px] text-gray-700">분석한 키워드와 함께 활용하면 좋은 연관 키워드가 클릭 가능한 뱃지 형태로 표시됩니다. 이 키워드들을 콘텐츠에 자연스럽게 포함하면 의미적 SEO(Semantic SEO) 완성도가 높아집니다.</p>
                </div>

                {/* 7. 경쟁사 인사이트 */}
                <div className="bg-white rounded-lg p-3 border border-cyan-200">
                  <p className="text-[11px] font-medium text-cyan-700 mb-1 flex items-center gap-2">
                    <span className="w-5 h-5 bg-cyan-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">7</span>
                    경쟁사 인사이트
                  </p>
                  <p className="text-[11px] text-gray-700">현재 검색 상위 콘텐츠를 분석하여 도출한 인사이트와 실행 방안이 짝으로 제시됩니다. 각 카드에 <strong>&quot;인사이트&quot;</strong>(현황 분석)와 <strong>&quot;실행 방안&quot;</strong>(구체적 행동)이 함께 표시되어 바로 적용할 수 있습니다.</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-200">
              <p className="text-[11px] text-cyan-800">
                <span className="font-semibold">활용 Tip:</span> 키워드 분석 결과를 참고하여 콘텐츠 생성 시 해당 키워드를 타겟 키워드로 지정하면, AI가 분석 결과에 맞춰 최적화된 콘텐츠를 생성합니다.
              </p>
            </div>
          </div>
        </section>

        {/* 5. 시리즈 기획 */}
        <section className="bg-white rounded-xl shadow-sm border border-orange-200 p-6">
          <h2 className="text-sm font-bold flex items-center gap-3 mb-3">
            <span className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">6</span>
            <span className="bg-gradient-to-r from-orange-700 to-red-600 bg-clip-text text-transparent">콘텐츠 시리즈 기획</span>
          </h2>
          <p className="text-[11px] text-gray-800 mb-3">하나의 주제로 연관된 시리즈 콘텐츠 기획안을 자동으로 생성합니다. 상단 메뉴에서 &quot;시리즈&quot;를 클릭하여 접근합니다.</p>

          <div className="space-y-3">
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <h3 className="text-[13pt] font-semibold text-orange-800 mb-3">입력 항목</h3>
              <ul className="space-y-2 text-[11px] text-gray-700">
                <li className="flex items-start gap-2"><span className="text-orange-500 font-bold">&#8226;</span> <strong>시리즈 주제 (필수):</strong> 시리즈의 전체 주제를 입력합니다 (예: &quot;초보자를 위한 SEO 가이드&quot;, &quot;디지털 마케팅 전략&quot;)</li>
                <li className="flex items-start gap-2"><span className="text-orange-500 font-bold">&#8226;</span> <strong>산업 분야 (선택):</strong> IT/테크, 교육, 의료/건강, 금융/보험, 부동산, 여행/관광, 법률/컨설팅, 마케팅/광고, 이커머스, 요식업, 기타</li>
                <li className="flex items-start gap-2"><span className="text-orange-500 font-bold">&#8226;</span> <strong>에피소드 수:</strong> 슬라이더로 3~12편 조절 (기본 7편). 슬라이더를 드래그하면 현재 선택된 편수가 실시간으로 표시됩니다</li>
                <li className="flex items-start gap-2"><span className="text-orange-500 font-bold">&#8226;</span> <strong>추가 요청사항 (선택):</strong> 타겟 독자층, 특정 키워드, 스타일 등 참고 사항을 자유 텍스트로 입력합니다</li>
              </ul>
              <div className="mt-3 bg-white rounded-lg p-3 border border-orange-200">
                <p className="text-[11px] font-medium text-orange-700 mb-1">사용 흐름</p>
                <p className="text-[11px] text-gray-700">주제 입력 → 산업 분야 선택(선택) → 에피소드 수 조절 → 추가 요청(선택) → &quot;시리즈 기획하기&quot; 버튼 클릭 → AI가 연속성 있는 시리즈 기획안을 생성합니다.</p>
              </div>
            </div>

            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <h3 className="text-[13pt] font-semibold text-orange-800 mb-3">기획 결과 상세</h3>
              <div className="space-y-3">
                {/* 시리즈 개요 */}
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <p className="text-[11px] font-medium text-orange-700 mb-1 flex items-center gap-2">
                    <span className="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                    시리즈 개요
                  </p>
                  <p className="text-[11px] text-gray-700">시리즈 전체 제목과 설명이 표시되며, 타겟 독자 정보가 색상 뱃지로 강조됩니다. 이 정보를 바탕으로 일관된 톤과 대상을 유지하며 시리즈를 발행할 수 있습니다.</p>
                </div>

                {/* 에피소드 카드 */}
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <p className="text-[11px] font-medium text-orange-700 mb-1 flex items-center gap-2">
                    <span className="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                    에피소드별 기획 카드
                  </p>
                  <p className="text-[11px] text-gray-700 mb-2">각 에피소드는 <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded">EP 1</span> <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded">EP 2</span> ... 형태의 접기/펼치기 카드로 표시됩니다.</p>
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                    <p className="text-[10px] font-medium text-orange-600 mb-2">접힌 상태에서 표시되는 정보:</p>
                    <ul className="space-y-1 text-[11px] text-gray-600">
                      <li className="flex items-start gap-2"><span className="text-orange-400 font-bold">&#8226;</span> 에피소드 번호 뱃지, 제목, 부제목</li>
                      <li className="flex items-start gap-2"><span className="text-orange-400 font-bold">&#8226;</span> 요약 미리보기 (2줄)</li>
                    </ul>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-100 mt-2">
                    <p className="text-[10px] font-medium text-orange-600 mb-2">펼친 상태에서 추가로 표시되는 정보:</p>
                    <ul className="space-y-1 text-[11px] text-gray-600">
                      <li className="flex items-start gap-2"><span className="text-orange-400 font-bold">&#8226;</span> <strong>요약:</strong> 에피소드의 전체 내용 요약</li>
                      <li className="flex items-start gap-2"><span className="text-orange-400 font-bold">&#8226;</span> <strong>타겟 키워드:</strong> 에피소드별 SEO 키워드가 색상 뱃지로 표시</li>
                      <li className="flex items-start gap-2"><span className="text-orange-400 font-bold">&#8226;</span> <strong>주요 포인트:</strong> 에피소드에서 다룰 핵심 내용 불릿 리스트</li>
                      <li className="flex items-start gap-2"><span className="text-orange-400 font-bold">&#8226;</span> <strong>내부 링크 제안:</strong> 다른 에피소드와의 연결 포인트 (해당 시 표시)</li>
                      <li className="flex items-start gap-2"><span className="text-orange-400 font-bold">&#8226;</span> <strong>예상 분량:</strong> 권장 글자 수 또는 읽기 시간</li>
                      <li className="flex items-start gap-2"><span className="text-orange-400 font-bold">&#8226;</span> <strong>&quot;이 시리즈로 콘텐츠 생성&quot; 버튼:</strong> 클릭하면 해당 에피소드 주제가 자동 입력된 콘텐츠 생성 페이지로 이동</li>
                    </ul>
                  </div>
                </div>

                {/* 전략 섹션 3개 */}
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <p className="text-[11px] font-medium text-orange-700 mb-1 flex items-center gap-2">
                    <span className="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">3</span>
                    링킹 전략 / 발행 일정 / 기대 효과
                  </p>
                  <p className="text-[11px] text-gray-700 mb-2">에피소드 목록 아래에 3개의 전략 섹션이 표시됩니다.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="bg-green-50 rounded p-2 border border-green-100">
                      <p className="text-[10px] font-medium text-green-700">🔗 링킹 전략</p>
                      <p className="text-[10px] text-gray-600">에피소드 간 내부 링크 구조를 설계하여 SEO 시너지를 극대화하는 전략</p>
                    </div>
                    <div className="bg-amber-50 rounded p-2 border border-amber-100">
                      <p className="text-[10px] font-medium text-amber-700">📅 발행 일정</p>
                      <p className="text-[10px] text-gray-600">권장 발행 주기와 순서 제안 (예: 주 2회, 월/목 발행)</p>
                    </div>
                    <div className="bg-yellow-50 rounded p-2 border border-yellow-100">
                      <p className="text-[10px] font-medium text-yellow-700">🎯 기대 효과</p>
                      <p className="text-[10px] text-gray-600">시리즈 완성 시 예상되는 SEO/마케팅 효과와 트래픽 성장</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
              <p className="text-[11px] text-orange-800">
                <span className="font-semibold">활용 Tip:</span> 시리즈 기획 후 각 에피소드의 &quot;이 시리즈로 콘텐츠 생성&quot; 버튼을 클릭하면 해당 에피소드 제목이 자동으로 생성 페이지에 입력됩니다. 기획 → 생성 → 발행까지 원스톱으로 진행할 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* 6. A/B 버전 & SNS 채널별 변환 */}
        <section className="bg-white rounded-xl shadow-sm border border-sky-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">7</span>
            <span className="bg-gradient-to-r from-sky-700 to-blue-600 bg-clip-text text-transparent">5가지 톤 생성 &amp; SNS 채널별 변환</span>
          </h2>
          <p className="text-[11px] text-gray-800 mb-3">같은 주제로 <strong>5가지 톤</strong>의 콘텐츠를 동시 생성하고, SNS 채널에 최적화된 형식으로 자동 변환합니다.</p>
          <div className="space-y-3">
            <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
              <h3 className="text-[13pt] font-semibold text-sky-800 mb-2">5가지 톤 동시 생성</h3>
              <p className="text-[11px] text-gray-800 mb-2">콘텐츠 생성 시 하나의 요청으로 <strong>5가지 톤</strong>이 자동으로 동시 생성됩니다. 결과 페이지에서 탭을 클릭해 각 톤을 비교하고 원하는 버전을 선택하세요.</p>
              <div className="space-y-2 text-[11px] text-gray-700 mb-3">
                <p>1. 콘텐츠 생성 페이지에서 프로젝트, 주제, 콘텐츠 유형 입력</p>
                <p>2. &quot;콘텐츠 생성&quot; 버튼 클릭 → 5가지 톤이 자동으로 병렬 생성</p>
                <p>3. 결과 페이지에서 탭을 클릭하여 각 버전 비교</p>
                <p>4. 가장 적합한 버전을 선택하여 저장/활용</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {[
                  { tone: '전문적', desc: '권위 있는 어조', color: 'blue' },
                  { tone: '친근한', desc: '대화체 어조', color: 'green' },
                  { tone: '설득적', desc: '행동 유도 어조', color: 'rose' },
                  { tone: '간결한', desc: '핵심만 전달', color: 'amber' },
                  { tone: '스토리텔링', desc: '서사 중심 어조', color: 'violet' },
                ].map(t => (
                  <div key={t.tone} className={`bg-${t.color}-50 rounded-lg p-3 border border-${t.color}-200 text-center`}>
                    <p className={`text-[11pt] font-bold text-${t.color}-700`}>{t.tone}</p>
                    <p className="text-[11px] text-gray-600 mt-1">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
              <h3 className="text-[13pt] font-semibold text-sky-800 mb-2">SNS 채널별 변환</h3>
              <p className="text-[11px] text-gray-800 mb-2">생성된 콘텐츠를 각 SNS 채널에 최적화된 형식으로 자동 변환합니다.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {[
                  { channel: '인스타그램', desc: '후킹 문구 + 핵심 포인트 + 이모지 + 해시태그 10-15개', icon: '📸' },
                  { channel: '링크드인', desc: '전문적 인사이트 + 번호 정리 + 토론 유도 + 해시태그 3-5개', icon: '💼' },
                  { channel: '네이버 블로그', desc: 'SEO 최적화 제목 + 목차 + 키워드 반복 + 이미지 위치 표시', icon: '📝' },
                  { channel: '카드뉴스', desc: '6-8장 슬라이드 구성 + 표지/본문/마무리 형식', icon: '🎴' },
                  { channel: '핵심 요약', desc: '3줄 요약 + 키워드 5개 + 주요 포인트 + 한 줄 결론', icon: '📋' },
                ].map(ch => (
                  <div key={ch.channel} className="bg-white rounded-lg p-3 border border-sky-200 flex items-start gap-3">
                    <span className="text-lg">{ch.icon}</span>
                    <div>
                      <p className="text-[11pt] font-medium text-sky-700">{ch.channel}</p>
                      <p className="text-[11px] text-gray-600">{ch.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-[11px] text-gray-700">
                <p>1. 콘텐츠 생성 후 결과 페이지 하단의 <span className="font-semibold text-sky-700">SNS 채널별 변환</span> 섹션 확인</p>
                <p>2. 원하는 채널 버튼 클릭 (인스타그램, 링크드인 등)</p>
                <p>3. AI가 해당 채널에 최적화된 형식으로 자동 변환</p>
                <p>4. 변환 결과를 <span className="font-semibold">복사</span> 버튼으로 클립보드에 복사</p>
              </div>
            </div>
          </div>
        </section>

        {/* 대시보드 */}
        <section className="bg-white rounded-xl shadow-sm border border-violet-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">8</span>
            <span className="bg-gradient-to-r from-violet-700 to-purple-600 bg-clip-text text-transparent">대시보드 활용하기</span>
          </h2>
          <p className="text-[11px] text-gray-800 mb-3">대시보드(<code className="bg-violet-100 px-1.5 py-0.5 rounded text-violet-700 text-[11px]">/dashboard</code>)에서는 분석 및 생성한 모든 콘텐츠의 이력을 관리하고, 다양한 방식으로 콘텐츠를 활용할 수 있습니다.</p>

          <div className="space-y-3">
            <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
              <h3 className="text-[13pt] font-semibold text-violet-800 mb-3">이력 목록</h3>
              <p className="text-[11px] text-gray-800 mb-2">생성하거나 분석한 모든 콘텐츠가 날짜순으로 정리됩니다. 각 항목에는 제목, 날짜, 카테고리가 표시되며, &quot;보기&quot; 버튼을 클릭하면 상세 페이지로 이동합니다.</p>
              <p className="text-[11px] text-gray-700">수정/재생성한 콘텐츠는 원본 아래에 수정본으로 표시됩니다.</p>
            </div>

            <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
              <h3 className="text-[13pt] font-semibold text-violet-800 mb-3">상세 페이지 기능</h3>
              <p className="text-[11px] text-gray-800 mb-3">각 콘텐츠의 상세 페이지(<code className="bg-violet-100 px-1.5 py-0.5 rounded text-violet-700 text-[11px]">/dashboard/[id]</code>)에서는 고유한 URL로 언제든 다시 접근할 수 있습니다.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-violet-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </span>
                    <p className="text-[11px] font-medium text-indigo-700">블로그 붙여넣기용 복사</p>
                  </div>
                  <p className="text-[11px] text-gray-600">화면에 보이는 서식 그대로 복사됩니다. 블로그 에디터에 붙여넣기 하면 제목, 표, 리스트 등이 유지됩니다.</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-violet-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 bg-amber-400 rounded flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </span>
                    <p className="text-[11px] font-medium text-amber-700">제목 복사</p>
                  </div>
                  <p className="text-[11px] text-gray-600">콘텐츠 제목만 클립보드에 복사합니다.</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-violet-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 bg-sky-400 rounded flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </span>
                    <p className="text-[11px] font-medium text-sky-700">본문 복사</p>
                  </div>
                  <p className="text-[11px] text-gray-600">본문 내용을 HTML 서식과 함께 복사합니다. 표 등 서식이 유지됩니다.</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-violet-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 bg-emerald-400 rounded flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </span>
                    <p className="text-[11px] font-medium text-emerald-700">이미지로 복사</p>
                  </div>
                  <p className="text-[11px] text-gray-600">콘텐츠를 PNG 이미지로 캡처하여 클립보드에 복사합니다. 편집 불가한 이미지 형태로 붙여넣기 가능합니다.</p>
                </div>
              </div>
            </div>

            <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
              <h3 className="text-[13pt] font-semibold text-violet-800 mb-3 flex items-center gap-2">
                본문 수정 기능
                <span className="px-2 py-0.5 bg-violet-200 text-violet-700 text-[11px] font-bold rounded-full">NEW</span>
              </h3>
              <p className="text-[11px] text-gray-800 mb-3">&quot;본문 수정&quot; 버튼을 클릭하면 마크다운 편집 모드로 전환됩니다. 상단에 편집 도구 바가 고정되어 스크롤해도 항상 접근할 수 있습니다.</p>
              <div className="bg-white rounded-lg p-4 border border-violet-200">
                <p className="text-[11px] font-medium text-violet-700 mb-2">편집 도구 바 기능</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'B', desc: '굵게' },
                    { label: 'I', desc: '기울임' },
                    { label: 'S', desc: '취소선' },
                    { label: 'H1', desc: '제목1' },
                    { label: 'H2', desc: '제목2' },
                    { label: 'H3', desc: '제목3' },
                    { label: '목록', desc: '불릿 목록' },
                    { label: '번호', desc: '번호 목록' },
                    { label: '인용', desc: '인용문' },
                    { label: '표', desc: '표 삽입' },
                    { label: '―', desc: '구분선' },
                  ].map((tool) => (
                    <span key={tool.label} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-[11px] text-gray-700">
                      <span className="font-bold">{tool.label}</span>
                      <span className="text-gray-400">{tool.desc}</span>
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500 mt-2">수정 후 &quot;저장하기&quot; 버튼을 클릭하면 변경 내용이 저장됩니다.</p>
                <div className="mt-3 pt-3 border-t border-violet-100">
                  <p className="text-[11px] font-medium text-violet-700 mb-1">찾기/바꾸기 기능</p>
                  <p className="text-[11px] text-gray-600">편집 도구 바의 &quot;찾기/바꾸기&quot; 버튼을 클릭하면 텍스트 검색 및 일괄 바꾸기 패널이 나타납니다. 특정 단어를 찾아 이전/다음으로 이동하거나, 하나씩 또는 모두 바꾸기가 가능합니다.</p>
                </div>
              </div>
            </div>

            <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
              <h3 className="text-[13pt] font-semibold text-violet-800 mb-2">수정본 관리</h3>
              <p className="text-[11px] text-gray-800">콘텐츠 생성 결과 페이지에서 수정/재생성한 이력이 있으면, 상세 페이지에서 &quot;원본&quot;과 &quot;수정 #1, #2...&quot; 버튼으로 각 버전을 전환하여 확인할 수 있습니다.</p>
            </div>

            <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
              <h3 className="text-[13pt] font-semibold text-violet-800 mb-3">콘텐츠 통계 &amp; 차트</h3>
              <p className="text-[11px] text-gray-800 mb-3">콘텐츠 생성/분석 현황을 차트와 통계로 한눈에 파악합니다. 대시보드 상단의 &quot;콘텐츠 통계&quot; 섹션을 클릭하여 펼치기/접기 가능합니다.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                {[
                  { label: '총 콘텐츠', desc: '생성 + 분석 전체 수', color: 'indigo' },
                  { label: '생성 수', desc: 'AI로 생성한 콘텐츠', color: 'purple' },
                  { label: '분석 수', desc: 'AIO 분석한 콘텐츠', color: 'emerald' },
                  { label: '평균 AIO 점수', desc: '분석 콘텐츠 평균 점수', color: 'amber' },
                ].map(s => (
                  <div key={s.label} className={`bg-${s.color}-50 rounded-lg p-3 border border-${s.color}-200 text-center`}>
                    <p className={`text-[11pt] font-bold text-${s.color}-700`}>{s.label}</p>
                    <p className="text-[11px] text-gray-600">{s.desc}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-[11px] text-gray-700">
                <p><span className="font-semibold text-violet-700">월별 생성 추이:</span> 바 차트로 월별 콘텐츠 생성 수 시각화</p>
                <p><span className="font-semibold text-violet-700">카테고리 분포:</span> 파이 차트로 블로그, SNS, 제품설명 등 카테고리별 비율 표시</p>
              </div>
            </div>
          </div>
        </section>

        {/* 점수 해석 */}
        <section className="bg-white rounded-xl shadow-sm border border-purple-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">8</span>
            <span className="bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">점수 해석 가이드</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">0 ~ 39</div>
              <div className="text-sm font-medium text-red-700">개선 필요</div>
              <p className="text-[8pt] text-red-700 mt-2">AI 검색엔진 최적화가 부족한 상태입니다. 제안사항을 참고하여 전면적인 개선이 필요합니다.</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">40 ~ 69</div>
              <div className="text-sm font-medium text-yellow-700">보통</div>
              <p className="text-[8pt] text-yellow-700 mt-2">기본적인 최적화는 되어 있으나, 핵심 부분에서 추가 개선의 여지가 있습니다.</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">70 ~ 100</div>
              <div className="text-sm font-medium text-green-700">우수</div>
              <p className="text-[8pt] text-green-700 mt-2">AI 검색엔진에 잘 최적화된 콘텐츠입니다. 세부 사항을 미세 조정하면 더욱 좋아집니다.</p>
            </div>
          </div>
        </section>

        {/* 용어 설명 */}
        <section className="bg-white rounded-xl shadow-sm border border-teal-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">9</span>
            <span className="bg-gradient-to-r from-teal-700 to-cyan-600 bg-clip-text text-transparent">용어 설명</span>
          </h2>
          <div className="space-y-3">
            {[
              { term: 'AIO', desc: 'AI Overview의 약자. Google 검색 결과 상단에 AI가 생성하는 요약 답변입니다.', color: 'blue' },
              { term: 'GEO', desc: 'Generative Engine Optimization의 약자. 생성형 AI 검색엔진에 최적화하는 전략입니다.', color: 'purple' },
              { term: '키워드 밀도', desc: '전체 콘텐츠 대비 특정 키워드가 차지하는 비율입니다. 적절한 밀도를 유지하는 것이 중요합니다.', color: 'amber' },
              { term: '구조화 데이터', desc: 'AI가 콘텐츠를 쉽게 이해할 수 있도록 정리된 형식(리스트, 표, Q&A 등)의 데이터입니다.', color: 'emerald' },
              { term: 'E-E-A-T', desc: '경험(Experience), 전문성(Expertise), 권위(Authoritativeness), 신뢰성(Trustworthiness)의 약자로, Google이 콘텐츠 품질을 평가하는 기준입니다.', color: 'rose' },
            ].map((item) => (
              <div key={item.term} className={`bg-${item.color}-50 rounded-xl p-4 border border-${item.color}-100 flex gap-4`}>
                <span className={`font-semibold text-${item.color}-700 whitespace-nowrap min-w-[120px]`}>{item.term}</span>
                <span className="text-[11px] text-gray-800">{item.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ===== GEO/AIO 최적화 실전 가이드 ===== */}
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-indigo-200" /></div>
          <div className="relative flex justify-center">
            <span className="bg-gray-50 px-6 text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">GEO/AIO 최적화 실전 가이드</span>
          </div>
        </div>

        {/* 10. 콘텐츠 구조 재구성 */}
        <section className="bg-white rounded-xl shadow-sm border border-rose-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">10</span>
            <span className="bg-gradient-to-r from-rose-700 to-pink-600 bg-clip-text text-transparent">콘텐츠 구조 재구성법</span>
          </h2>
          <p className="text-[11px] text-gray-800 mb-3">AI 검색엔진은 잘 구조화된 콘텐츠를 선호합니다. 다음 원칙에 따라 콘텐츠를 재구성하면 GEO/AIO 점수가 크게 향상됩니다.</p>

          <div className="space-y-3">
            <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
              <h3 className="text-[13pt] font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-rose-200 text-rose-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                역피라미드 구조 적용
              </h3>
              <p className="text-[11px] text-gray-800 mb-3">가장 중요한 정보를 글 상단에, 세부 내용은 하단에 배치합니다. AI는 상단 콘텐츠를 우선적으로 인용합니다.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-red-200">
                  <p className="text-[11px] font-medium text-red-500 mb-2">Before</p>
                  <p className="text-[11px] text-gray-800">서론 &rarr; 배경 설명 &rarr; 상세 내용 &rarr; <strong>핵심 결론</strong></p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-[11px] font-medium text-green-500 mb-2">After</p>
                  <p className="text-[11px] text-gray-800"><strong>핵심 결론/답변</strong> &rarr; 상세 근거 &rarr; 배경 설명 &rarr; 부가 정보</p>
                </div>
              </div>
            </div>

            <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
              <h3 className="text-[13pt] font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-rose-200 text-rose-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                명확한 헤딩 계층 구조
              </h3>
              <p className="text-[11px] text-gray-800 mb-3">H1 &rarr; H2 &rarr; H3 순서로 논리적인 계층을 만듭니다. 각 헤딩은 해당 섹션의 내용을 정확히 요약해야 합니다.</p>
              <div className="bg-white rounded-lg p-4 border border-rose-100 text-[11px] text-gray-700 space-y-1">
                <p className="font-bold">H1: AI 콘텐츠 최적화 완벽 가이드</p>
                <p className="ml-4 font-semibold text-gray-800">&nbsp;&nbsp;H2: AIO란 무엇인가?</p>
                <p className="ml-8 text-gray-700">&nbsp;&nbsp;&nbsp;&nbsp;H3: AIO의 작동 원리</p>
                <p className="ml-8 text-gray-700">&nbsp;&nbsp;&nbsp;&nbsp;H3: AIO 노출 조건</p>
                <p className="ml-4 font-semibold text-gray-800">&nbsp;&nbsp;H2: GEO 최적화 전략</p>
                <p className="ml-8 text-gray-700">&nbsp;&nbsp;&nbsp;&nbsp;H3: 구조화 데이터 활용</p>
              </div>
            </div>

            <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
              <h3 className="text-[13pt] font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-rose-200 text-rose-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                리스트와 표 적극 활용
              </h3>
              <p className="text-[11px] text-gray-800 mb-3">AI는 글 형태보다 리스트, 표, 단계별 가이드 형식의 데이터를 더 쉽게 파싱하고 인용합니다.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-red-200">
                  <p className="text-[11px] font-medium text-red-500 mb-2">Before</p>
                  <p className="text-[11px] text-gray-800">콘텐츠 최적화를 위해서는 키워드를 적절히 배치하고 헤딩 구조를 잡아야 하며 내부 링크를 활용하는 것이 좋습니다.</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-[11px] font-medium text-green-500 mb-2">After</p>
                  <div className="text-[11px] text-gray-800">
                    <p className="font-medium mb-1">콘텐츠 최적화 3단계:</p>
                    <p>1. 키워드를 제목, 소제목, 본문에 자연스럽게 배치</p>
                    <p>2. H1~H3 헤딩으로 논리적 구조 설계</p>
                    <p>3. 관련 페이지로의 내부 링크 추가</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
              <h3 className="text-[13pt] font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-rose-200 text-rose-700 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                한 문단 한 주제 원칙
              </h3>
              <p className="text-[11px] text-gray-800">각 문단은 하나의 명확한 주제만 다룹니다. 2~4문장으로 간결하게 작성하고, AI가 특정 문단을 독립적으로 인용할 수 있게 합니다. 긴 문단은 여러 개로 분리하세요.</p>
            </div>
          </div>
        </section>

        {/* 11. 키워드 최적화 방법 */}
        <section className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">11</span>
            <span className="bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">키워드 최적화 방법</span>
          </h2>
          <p className="text-[11px] text-gray-800 mb-3">올바른 키워드 전략은 AI 검색 노출의 핵심입니다. 단순한 키워드 반복이 아닌, 의미 중심의 최적화가 필요합니다.</p>

          <div className="space-y-3">
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <h3 className="text-[13pt] font-semibold text-amber-800 mb-2">키워드 배치 핵심 위치</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {['제목 (H1)', '소제목 (H2~H3)', '첫 문단 (100자 이내)', '메타 디스크립션'].map((pos) => (
                  <div key={pos} className="bg-white border border-amber-200 rounded-lg p-2 text-center">
                    <p className="text-[11px] font-medium text-amber-700">{pos}</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-800">핵심 키워드는 위 4곳에 반드시 포함시키세요. AI는 이 위치의 텍스트를 콘텐츠 주제 파악에 가장 많이 활용합니다.</p>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <h3 className="text-[13pt] font-semibold text-amber-800 mb-2">적정 키워드 밀도</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] text-gray-800">핵심 키워드</span>
                    <span className="text-[11px] font-medium text-green-600">1.5% ~ 2.5% (적정)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 relative">
                    <div className="bg-green-400 h-3 rounded-full" style={{ width: '50%' }} />
                    <div className="absolute top-0 left-[30%] w-[40%] h-3 border border-green-600 rounded-full border-dashed" />
                  </div>
                  <p className="text-[11px] text-gray-700 mt-1">1% 미만이면 주제 인식 부족, 3% 초과하면 키워드 스터핑으로 감점</p>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] text-gray-800">관련 키워드 / LSI 키워드</span>
                    <span className="text-sm font-medium text-blue-600">0.5% ~ 1.5%</span>
                  </div>
                  <p className="text-[11px] text-gray-700">핵심 키워드의 동의어, 유사어를 자연스럽게 분산 배치</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <h3 className="text-[13pt] font-semibold text-amber-800 mb-2">의미적 키워드 확장 (Semantic SEO)</h3>
              <p className="text-[11px] text-gray-800 mb-3">AI는 단순 키워드 매칭이 아니라 의미를 이해합니다. 관련 주제를 폭넓게 다뤄야 합니다.</p>
              <div className="bg-white rounded-lg p-4 border border-amber-200">
                <p className="text-[11px] font-medium text-amber-700 mb-2">예시: 핵심 키워드가 &quot;콘텐츠 마케팅&quot;인 경우</p>
                <div className="flex flex-wrap gap-2">
                  {['콘텐츠 전략', 'SEO 최적화', '블로그 마케팅', '타겟 오디언스', 'CTA', '전환율', '콘텐츠 캘린더', 'B2B 마케팅', '스토리텔링', '데이터 기반 마케팅'].map((kw) => (
                    <span key={kw} className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">{kw}</span>
                  ))}
                </div>
                <p className="text-[11px] text-gray-700 mt-2">이처럼 주변 관련 키워드를 자연스럽게 포함하면 의미적 완성도가 높아집니다.</p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <h3 className="text-[13pt] font-semibold text-amber-800 mb-2">롱테일 키워드 활용</h3>
              <p className="text-[11px] text-gray-800 mb-3">구체적인 질문형 롱테일 키워드를 소제목이나 FAQ에 활용하면 AI 검색 노출 확률이 높아집니다.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-red-200">
                  <p className="text-[11px] font-medium text-red-500 mb-1">일반 키워드</p>
                  <p className="text-[11px] text-gray-700">콘텐츠 최적화</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-[11px] font-medium text-green-500 mb-1">롱테일 키워드</p>
                  <p className="text-[11px] text-gray-700">AI 검색엔진에 콘텐츠를 최적화하는 방법</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 12. E-E-A-T 강화법 */}
        <section className="bg-white rounded-xl shadow-sm border border-violet-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">12</span>
            <span className="bg-gradient-to-r from-violet-700 to-indigo-600 bg-clip-text text-transparent">E-E-A-T 강화법</span>
          </h2>
          <p className="text-[11px] text-gray-800 mb-3">E-E-A-T(경험, 전문성, 권위, 신뢰)는 AI가 콘텐츠를 인용할지 결정하는 핵심 기준입니다. 각 요소를 강화하는 구체적인 방법을 안내합니다.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Experience */}
            <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-sky-600 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-sm">E</span>
                <h3 className="text-[11pt] font-semibold text-blue-800">Experience (경험)</h3>
              </div>
              <p className="text-[11px] text-gray-800 mb-3">실제 경험을 바탕으로 한 콘텐츠임을 보여주세요.</p>
              <ul className="space-y-2">
                <li className="text-[11px] text-gray-800 flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">&#10003;</span>
                  &quot;직접 테스트해본 결과...&quot; 등 1인칭 경험 서술
                </li>
                <li className="text-[11px] text-gray-800 flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">&#10003;</span>
                  실제 사례, 스크린샷, 결과 데이터 포함
                </li>
                <li className="text-[11px] text-gray-800 flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">&#10003;</span>
                  구체적인 시행착오와 교훈 공유
                </li>
                <li className="text-[11px] text-gray-800 flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">&#10003;</span>
                  날짜, 기간 등 시간적 맥락 제시
                </li>
              </ul>
            </div>

            {/* Expertise */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-sm">E</span>
                <h3 className="text-[11pt] font-semibold text-purple-800">Expertise (전문성)</h3>
              </div>
              <p className="text-[11px] text-gray-800 mb-3">해당 분야의 깊이 있는 지식을 증명하세요.</p>
              <ul className="space-y-2">
                <li className="text-[11px] text-gray-800 flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">&#10003;</span>
                  전문 용어를 정확하게 사용하고 쉽게 설명
                </li>
                <li className="text-[11px] text-gray-800 flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">&#10003;</span>
                  깊이 있는 분석과 독자적인 인사이트 제시
                </li>
                <li className="text-[11px] text-gray-800 flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">&#10003;</span>
                  저자 프로필, 자격/경력 소개 포함
                </li>
                <li className="text-[11px] text-gray-800 flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">&#10003;</span>
                  관련 연구, 논문, 보고서 인용
                </li>
              </ul>
            </div>

            {/* Authoritativeness */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-sm">A</span>
                <h3 className="text-[11pt] font-semibold text-amber-800">Authoritativeness (권위)</h3>
              </div>
              <p className="text-[11px] text-gray-800 mb-3">해당 분야에서의 권위를 구축하세요.</p>
              <ul className="space-y-2">
                <li className="text-[11px] text-gray-800 flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">&#10003;</span>
                  공신력 있는 출처 인용 (학술 논문, 공공 데이터 등)
                </li>
                <li className="text-[11px] text-gray-800 flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">&#10003;</span>
                  업계 전문가 인터뷰, 의견 인용
                </li>
                <li className="text-[11px] text-gray-800 flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">&#10003;</span>
                  수상 경력, 미디어 소개 등 사회적 증거
                </li>
                <li className="text-[11px] text-gray-800 flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">&#10003;</span>
                  관련 주제에 대한 다수의 콘텐츠 보유
                </li>
              </ul>
            </div>

            {/* Trustworthiness */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-sm">T</span>
                <h3 className="text-[11pt] font-semibold text-emerald-800">Trustworthiness (신뢰)</h3>
              </div>
              <p className="text-[11px] text-gray-800 mb-3">콘텐츠의 정확성과 신뢰도를 높이세요.</p>
              <ul className="space-y-2">
                <li className="text-[11px] text-gray-800 flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">&#10003;</span>
                  통계와 수치에 출처 명시 (예: &quot;2025년 가트너 보고서에 따르면...&quot;)
                </li>
                <li className="text-[11px] text-gray-800 flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">&#10003;</span>
                  최신 정보로 정기적 업데이트 (&quot;최종 수정: 2026.02&quot;)
                </li>
                <li className="text-[11px] text-gray-800 flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">&#10003;</span>
                  팩트 체크 완료 표시, 검수 과정 언급
                </li>
                <li className="text-[11px] text-gray-800 flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">&#10003;</span>
                  투명한 저자 정보, 연락처, 정정 정책
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 13. FAQ 생성법 */}
        <section className="bg-white rounded-xl shadow-sm border border-cyan-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-teal-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">13</span>
            <span className="bg-gradient-to-r from-cyan-700 to-teal-600 bg-clip-text text-transparent">FAQ 섹션 생성법</span>
          </h2>
          <p className="text-[11px] text-gray-800 mb-3">FAQ는 AI Overview에 직접 인용될 확률이 가장 높은 콘텐츠 형식입니다. 효과적인 FAQ를 만드는 방법을 안내합니다.</p>

          <div className="space-y-3">
            <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-100">
              <h3 className="text-[13pt] font-semibold text-cyan-800 mb-3">FAQ 작성 원칙</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                  <div>
                    <p className="text-[11pt] font-medium text-gray-800">실제 사용자 질문 기반</p>
                    <p className="text-[11px] text-gray-700">Google 자동완성, &quot;People Also Ask&quot;, 네이버 연관검색어에서 실제 질문을 수집하세요.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                  <div>
                    <p className="text-[11pt] font-medium text-gray-800">답변은 2~4문장으로 간결하게</p>
                    <p className="text-[11px] text-gray-700">AI가 그대로 인용할 수 있는 길이가 이상적입니다. 핵심을 먼저, 부연을 나중에.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                  <div>
                    <p className="text-[11pt] font-medium text-gray-800">질문에 키워드 포함</p>
                    <p className="text-[11px] text-gray-700">질문 자체에 타겟 키워드가 자연스럽게 들어가도록 구성하세요.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                  <div>
                    <p className="text-[11pt] font-medium text-gray-800">5~10개의 FAQ가 적정</p>
                    <p className="text-[11px] text-gray-700">너무 적으면 커버리지 부족, 너무 많으면 품질이 떨어집니다.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-100">
              <h3 className="text-[13pt] font-semibold text-cyan-800 mb-3">효과적인 FAQ 예시</h3>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4 border border-cyan-200">
                  <p className="text-[11pt] font-semibold text-cyan-700 mb-2">Q: AIO(AI Overview)에 콘텐츠가 노출되려면 어떻게 해야 하나요?</p>
                  <p className="text-[11px] text-gray-800">AIO에 노출되려면 콘텐츠를 질문-답변 형식으로 구성하고, 핵심 답변을 2~3문장으로 간결하게 작성해야 합니다. 또한 통계와 출처를 포함하여 신뢰도를 높이고, 명확한 헤딩 구조로 AI가 내용을 쉽게 파악할 수 있도록 해야 합니다.</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-cyan-200">
                  <p className="text-[11pt] font-semibold text-cyan-700 mb-2">Q: GEO 최적화와 기존 SEO의 차이점은 무엇인가요?</p>
                  <p className="text-[11px] text-gray-800">기존 SEO가 검색엔진 랭킹 알고리즘에 초점을 맞추는 반면, GEO는 생성형 AI가 콘텐츠를 이해하고 인용하기 쉽도록 최적화하는 전략입니다. 의미적 완성도, E-E-A-T 신호, 구조화된 데이터 형식이 GEO의 핵심 요소입니다.</p>
                </div>
              </div>
            </div>

            <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-100">
              <h3 className="text-[13pt] font-semibold text-cyan-800 mb-3">FAQ 질문 유형별 템플릿</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { type: '정의형', q: '"[키워드]란 무엇인가요?"' },
                  { type: '방법형', q: '"[키워드]를 하는 방법은?"' },
                  { type: '비교형', q: '"[A]와 [B]의 차이점은?"' },
                  { type: '이유형', q: '"[키워드]가 중요한 이유는?"' },
                  { type: '목록형', q: '"[키워드]의 종류/유형은?"' },
                  { type: '비용/시간형', q: '"[키워드]에 얼마나 걸리나요?"' },
                ].map((item) => (
                  <div key={item.type} className="bg-white rounded-lg p-3 border border-cyan-100">
                    <p className="text-[11px] font-medium text-cyan-600 mb-1">{item.type}</p>
                    <p className="text-[11px] text-gray-800">{item.q}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 14. 인용 최적화 (Citability) */}
        <section className="bg-white rounded-xl shadow-sm border border-pink-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">14</span>
            <span className="bg-gradient-to-r from-pink-700 to-rose-600 bg-clip-text text-transparent">AI 인용 최적화 (Citability)</span>
          </h2>
          <p className="text-[11px] text-gray-800 mb-3">AI가 콘텐츠를 인용하기 쉽게 만드는 것이 GEO/AIO의 최종 목표입니다.</p>

          <div className="space-y-3">
            <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
              <h3 className="text-[13pt] font-semibold text-pink-800 mb-3">인용되기 쉬운 문장 작성법</h3>
              <div className="space-y-3">
                {[
                  { title: '정의문 포함', desc: '"[주제]란 [정의]를 말합니다" 형태의 명확한 정의를 포함하세요.', example: '"AIO란 Google 검색 결과 상단에 AI가 생성하는 요약 답변입니다."' },
                  { title: '수치와 통계 활용', desc: '구체적인 숫자를 포함하면 AI가 팩트로 인용합니다.', example: '"2025년 기준 전체 검색의 약 40%에서 AI Overview가 표시됩니다."' },
                  { title: '단계별 설명', desc: '"첫째... 둘째... 셋째..." 형태의 순서가 있는 설명', example: '"GEO 최적화는 3단계로 진행됩니다. 첫째, 콘텐츠 구조화..."' },
                  { title: '비교/대조 문장', desc: '"A는 ~인 반면, B는 ~입니다" 형태', example: '"SEO는 키워드 랭킹에 집중하는 반면, GEO는 AI의 의미 이해에 초점을 맞춥니다."' },
                ].map((item) => (
                  <div key={item.title} className="bg-white rounded-lg p-4 border border-pink-100">
                    <p className="text-[11pt] font-medium text-pink-700 mb-1">{item.title}</p>
                    <p className="text-[11px] text-gray-700 mb-2">{item.desc}</p>
                    <p className="text-[11px] text-gray-700 bg-pink-50 px-3 py-2 rounded-lg italic">{item.example}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 15. Make.com 연동 */}
        <section className="bg-white rounded-xl shadow-sm border border-indigo-200 p-6">
          <h2 className="text-sm font-bold flex items-center gap-3 mb-3">
            <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">15</span>
            <span className="bg-gradient-to-r from-indigo-700 to-violet-600 bg-clip-text text-transparent">Make.com 자동화 연동</span>
          </h2>
          <p className="text-[11px] text-gray-800 mb-3">Make.com(구 Integromat)을 활용하여 콘텐츠 분석/생성을 자동화할 수 있습니다. Webhook API를 통해 외부 시스템과 연결합니다.</p>

          <div className="space-y-3">
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <h3 className="text-[13pt] font-semibold text-indigo-800 mb-3">연동 개요</h3>
              <div className="space-y-2 text-[11px] text-gray-700">
                <p>1. Make.com에서 시나리오(Scenario) 생성</p>
                <p>2. HTTP 모듈로 Webhook URL 설정: <code className="bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-700 text-[11px]">/api/webhook</code></p>
                <p>3. API Key를 헤더에 설정 (<code className="bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-700 text-[11px]">X-API-Key</code> 또는 <code className="bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-700 text-[11px]">Authorization: Bearer</code>)</p>
                <p>4. JSON Body에 action과 필요한 데이터 전달</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-indigo-100">
              <h3 className="text-[13pt] font-semibold text-indigo-800 mb-3">지원 기능</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { action: 'generate', desc: 'AI 콘텐츠 생성 - 주제, 카테고리, 톤 지정' },
                  { action: 'analyze', desc: '콘텐츠 GEO/AIO 분석 - 텍스트와 키워드 전달' },
                ].map(item => (
                  <div key={item.action} className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                    <p className="text-[11pt] font-medium text-indigo-700">{item.action}</p>
                    <p className="text-[11px] text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-4 border border-indigo-200">
              <p className="text-[11px] text-indigo-800">
                <span className="font-semibold">참고:</span> 자세한 설정 방법은 상단 네비게이션의 <span className="font-semibold text-indigo-700">Make 연동</span> 가이드 페이지를 참조하세요. API Key 설정, JSON Body 예시 등 단계별 안내가 제공됩니다.
              </p>
            </div>
          </div>
        </section>

        {/* 16. 요금제 안내 */}
        <section className="bg-white rounded-xl shadow-sm border border-emerald-200 p-6">
          <h2 className="text-sm font-bold flex items-center gap-3 mb-3">
            <span className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">16</span>
            <span className="bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">요금제 안내</span>
          </h2>
          <p className="text-[11px] text-gray-800 mb-3">GEO-AIO는 무료 플랜과 유료 플랜을 제공합니다. 각 플랜별 사용 가능 횟수가 다릅니다.</p>

          <div className="space-y-3">
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <h3 className="text-[13pt] font-semibold text-emerald-800 mb-3">플랜별 비교</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-gray-700 border-collapse">
                  <thead>
                    <tr className="border-b-2 border-emerald-200">
                      <th className="text-left py-2 px-3 text-emerald-700">항목</th>
                      <th className="text-center py-2 px-3 text-gray-500">Free</th>
                      <th className="text-center py-2 px-3 text-blue-600">Pro</th>
                      <th className="text-center py-2 px-3 text-purple-600">Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { item: '콘텐츠 분석', free: '월 3회', pro: '월 15회', max: '월 50회' },
                      { item: '콘텐츠 생성', free: '월 3회', pro: '월 15회', max: '월 50회' },
                      { item: '키워드 분석', free: '월 3회', pro: '월 15회', max: '월 50회' },
                      { item: '시리즈 기획', free: '월 3회', pro: '월 15회', max: '월 50회' },
                      { item: '월 이용료', free: '무료', pro: '29,700원', max: '79,200원' },
                    ].map((row, i) => (
                      <tr key={row.item} className={i % 2 === 0 ? 'bg-white' : 'bg-emerald-50/50'}>
                        <td className="py-2 px-3 font-medium">{row.item}</td>
                        <td className="py-2 px-3 text-center">{row.free}</td>
                        <td className="py-2 px-3 text-center">{row.pro}</td>
                        <td className="py-2 px-3 text-center">{row.max}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-emerald-100">
              <h3 className="text-[13pt] font-semibold text-emerald-800 mb-3">구독 관리</h3>
              <div className="space-y-2 text-[11px] text-gray-700">
                <p>&#8226; 유료 구독은 <span className="font-semibold">30일 단위</span>로 운영됩니다</p>
                <p>&#8226; 만료일까지 결제가 확인되지 않으면 <span className="font-semibold text-red-600">무료 계정으로 자동 전환</span>됩니다</p>
                <p>&#8226; 무료 전환 후에도 기존에 생성/저장한 콘텐츠는 유지됩니다</p>
                <p>&#8226; 만료 전 이메일로 안내를 받으실 수 있습니다</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
              <p className="text-[11px] text-emerald-800">
                <span className="font-semibold">요금제 확인:</span> 상단 네비게이션의 <span className="font-semibold text-emerald-700">요금제</span> 페이지에서 현재 플랜 확인 및 업그레이드가 가능합니다.
              </p>
            </div>
          </div>
        </section>

        {/* 최근 업데이트 (2026-04) */}
        <section className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 text-[10px] font-bold tracking-wider">NEW</span>
            최근 업데이트 (2026년 4월)
          </h2>
          <p className="text-[11px] text-gray-600 mb-4">최근 추가된 기능과 변경 사항을 빠르게 확인하세요.</p>

          <div className="space-y-4">
            {/* 1. 프로젝트 URL 필드 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-[13pt] font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <span className="text-base">🌐</span> 프로젝트 URL 입력
              </h3>
              <p className="text-[11px] text-gray-700 mb-2">
                <strong>위치:</strong> /user-dashboard → 프로젝트 추가/수정 폼
              </p>
              <ul className="text-[11px] text-gray-700 space-y-1 list-disc list-inside ml-2">
                <li><strong>홈페이지 URL</strong> · <strong>블로그 URL</strong> 두 필드 신규 추가 (선택 입력)</li>
                <li>입력하면 콘텐츠 생성 시 본문 마지막 해시태그 직전에 <strong>자동 링크 블록</strong>이 삽입됩니다.</li>
                <li>비워두면 자동 삽입 안 됨 (기존 동작 그대로).</li>
              </ul>
            </div>

            {/* 2. 콘텐츠 자동 URL 삽입 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-[13pt] font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <span className="text-base">🔗</span> 콘텐츠에 회사 링크 자동 삽입
              </h3>
              <p className="text-[11px] text-gray-700 mb-2">
                15가지 톤 일괄 생성·재생성·E-E-A-T 변환·이어쓰기 모두 적용. 출력 형식:
              </p>
              <pre className="text-[10px] bg-gray-50 border border-gray-200 rounded p-2 overflow-x-auto leading-relaxed">{`---
📍 {회사명} 더 알아보기
- 🌐 홈페이지: [URL](URL)
- 📝 블로그: [URL](URL)
---
#해시태그1 #해시태그2 ...`}</pre>
              <p className="text-[10px] text-gray-500 mt-2">기존 DB에 저장된 콘텐츠는 영향 없음 — 재생성 시 적용됩니다.</p>
            </div>

            {/* 3. 제안서 페이지 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-[13pt] font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <span className="text-base">📄</span> 제안서 메뉴
              </h3>
              <p className="text-[11px] text-gray-700 mb-2">
                <strong>위치:</strong> 헤더 → 제안서 / URL: /proposal/[카테고리]
              </p>
              <ul className="text-[11px] text-gray-700 space-y-1 list-disc list-inside ml-2">
                <li>14개 카테고리별 생성 (블로그 카테고리와 연동)</li>
                <li>섹션 구성: 한계 및 문제점 → 현황 진단 → GEO-AIO 솔루션 → SEO vs E-E-A-T 9-table 비교 → 실제 운영 콘텐츠 → ROI → 온톨로지 적용 안내 → 가격표 → 도입 절차 → 신뢰 시그널 → FAQ → CTA</li>
                <li>schema.org JSON-LD 자동 출력 (AI 검색엔진 인용 최적화)</li>
                <li>프리미엄 다크+골드 테마 + 비주얼 차트 (도넛·진행 바·그래프)</li>
              </ul>
            </div>

            {/* 4. PDF 저장 버튼 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-[13pt] font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <span className="text-base">💾</span> PDF로 저장
              </h3>
              <p className="text-[11px] text-gray-700 mb-2">
                각 제안서 페이지의 표지(PROPOSAL TO {`{카테고리명}`}) 우측 상단의 <strong className="text-amber-700">PDF로 저장</strong> 버튼.
              </p>
              <ul className="text-[11px] text-gray-700 space-y-1 list-disc list-inside ml-2">
                <li>본문 article 영역만 캡쳐 → A4 멀티페이지 PDF 다운로드</li>
                <li>파일명: <code className="text-[10px] bg-gray-100 px-1 rounded">{`{카테고리명}-제안서-YYYY-MM-DD.pdf`}</code></li>
                <li>html2canvas-pro + jsPDF 동적 로드 (Tailwind v4 oklch 색공간 호환)</li>
              </ul>
            </div>

            {/* 5. 가격표 3 플랜 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-[13pt] font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <span className="text-base">💰</span> 요금제 — 3가지 플랜
              </h3>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <p className="text-[11px] font-bold text-blue-800">프로 (Pro)</p>
                  <p className="text-[10px] text-gray-700 mt-0.5">200만원/월 · 월 70건 · 1년 계약</p>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded p-2">
                  <p className="text-[11px] font-bold text-indigo-800">프리미엄</p>
                  <p className="text-[10px] text-gray-700 mt-0.5">540/분기 · 연 2,160 · 월 80건</p>
                </div>
                <div className="bg-amber-50 border border-amber-300 rounded p-2">
                  <p className="text-[11px] font-bold text-amber-800">맥스 (Max) ⭐</p>
                  <p className="text-[10px] text-gray-700 mt-0.5">1,440만원/연 (20% 할인) · 월 100건 + 브랜드뉴스/유튜브</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">맥스가 가장 좋은 혜택 + 가장 저렴 (연간 일시불 20% 할인). 프리미엄은 가운데 위치.</p>
              <p className="text-[10px] text-rose-600 mt-1">※ 본 할인 이벤트는 사전 예고 없이 원래 가격으로 환원될 수 있습니다. (7월 1일로 예정)</p>

              {/* 외국어 옵션 안내 */}
              <div className="mt-3 bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-200 rounded-lg p-3">
                <p className="text-[11px] font-bold text-sky-800 mb-1">🌐 외국어 콘텐츠 옵션 (영어 · 중국어 · 일본어)</p>
                <ul className="text-[10px] text-gray-700 space-y-0.5 list-disc list-inside ml-1">
                  <li>체감식 가산: <strong className="text-rose-600">1종 +60% · 2종 +40% · 3종 +30%</strong> (예: 한국어+영어+중국어 = 200%)</li>
                  <li>한국어 기본 선택 필수 · 외국어 단독 선택 불가 · 4종 이상은 별도 협의</li>
                  <li>프로(월): 200 / 320 / 400 / 460만원 (한국어 → +1종 → +2종 → +3종)</li>
                  <li>프리미엄(분기): 540 / 864 / 1,080 / 1,242만원</li>
                  <li>맥스(연): 1,440 / 2,304 / 2,880 / 3,312만원</li>
                </ul>
              </div>
            </div>

            {/* 6. 사용자 메뉴 변경 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-[13pt] font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <span className="text-base">👤</span> 사용자 대시보드 / 로그인
              </h3>
              <ul className="text-[11px] text-gray-700 space-y-1 list-disc list-inside ml-2">
                <li>플랜 표시: 무료 / Pro / 맥스 / 관리자 배지 자동 노출</li>
                <li>이번 달 사용 현황 — 콘텐츠 생성·분석·키워드·시리즈 4종 사용량/한도</li>
                <li>프로젝트 카드: 회사명·대표자·지역·홈페이지·블로그 + RAG 파일 첨부</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 팁 */}
        <section className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm border border-indigo-300 p-6">
          <h2 className="text-sm font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent mb-3">최적화 팁</h2>
          <ul className="space-y-3">
            {[
              '질문-답변 형식으로 콘텐츠를 구성하면 AI Overview에 인용될 확률이 높아집니다.',
              '통계, 수치, 출처를 포함하여 콘텐츠의 신뢰도를 높이세요.',
              '명확한 헤딩 구조(H1, H2, H3)와 리스트를 활용하여 콘텐츠를 구조화하세요.',
              '핵심 정보를 글 상단에 배치하여 AI가 빠르게 핵심을 파악할 수 있도록 하세요.',
              '분석 후 개선 제안을 적용하고 재분석하여 점수 변화를 확인하세요.',
              '참조 자료(파일 업로드)를 활용하면 더 정확하고 데이터 기반의 콘텐츠를 생성할 수 있습니다.',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-[11px] text-indigo-800">{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  );
}
