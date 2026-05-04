'use client';

interface TesterModalProps {
  show: boolean;
  onClose: () => void;
}

export default function TesterModal({ show, onClose }: TesterModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* 모달 헤더 */}
          <div className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-t-2xl px-6 py-5 text-center relative">
            {/* 로고 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-geoaio.png" alt="GEO-AIO 로고" className="absolute top-3 left-3 h-8 object-contain drop-shadow-md" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div className="flex items-center justify-center gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-white">테스터 모집 안내</h2>
                <p className="text-sm text-white/80 mt-1">GEO-AIO 베타 테스터를 모집합니다</p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/qr-tester.jpg" alt="테스터 모집 QR코드" width={72} height={72} className="w-[72px] h-[72px] rounded-lg border-2 border-white shadow-lg bg-white p-1" />
            </div>
          </div>

          {/* 모달 본문 */}
          <div className="px-6 py-5 space-y-4">
            {/* 모집 개요 */}
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                모집 개요
              </h3>
              <div className="space-y-1.5 text-[13px] text-gray-700">
                <p><strong>모집 기간:</strong> 상시 모집</p>
                <p><strong>모집 인원:</strong> 선착순 제한 없음</p>
                <p><strong>테스트 기간:</strong> 가입일로부터 30일</p>
                <p><strong>대상:</strong> 블로거, 마케터, 콘텐츠 크리에이터, SEO 담당자 등</p>
              </div>
            </div>

            {/* 테스터 혜택 */}
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <h3 className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                테스터 혜택
              </h3>
              <ul className="space-y-1.5 text-[13px] text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5 font-bold">&#10003;</span>
                  <span>30일간 <strong>Max 등급</strong> 기능 무료 사용</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5 font-bold">&#10003;</span>
                  <span>콘텐츠 분석 <strong>월 50회</strong> 이용</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5 font-bold">&#10003;</span>
                  <span>콘텐츠 생성 <strong>월 50회</strong> 이용</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5 font-bold">&#10003;</span>
                  <span>키워드 분석 <strong>월 50회</strong> 이용</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5 font-bold">&#10003;</span>
                  <span>시리즈 기획 <strong>월 50회</strong> 이용</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5 font-bold">&#10003;</span>
                  <span>A/B 버전 생성, SNS 채널별 변환 등 모든 기능</span>
                </li>
              </ul>
            </div>

            {/* 참여 방법 */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                참여 방법
              </h3>
              <ol className="space-y-1.5 text-[13px] text-gray-700 list-decimal list-inside">
                <li>무료 회원가입 후 로그인합니다</li>
                <li>아래 &quot;테스터 신청하기&quot; 버튼을 클릭하여 설문지를 작성합니다</li>
                <li>관리자 확인 후 테스터 등급이 부여됩니다</li>
                <li>30일간 맥스(Max) 등급 기능을 자유롭게 사용합니다</li>
              </ol>
            </div>

            {/* 테스터 의무 */}
            <div className="bg-violet-50 rounded-xl p-4 border border-violet-200">
              <h3 className="text-sm font-bold text-violet-800 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-violet-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                테스터 의무사항
              </h3>
              <ul className="space-y-1.5 text-[13px] text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-violet-500 mt-0.5 font-bold">&#8226;</span>
                  <span>테스트 기간 동안 주요 기능을 최소 1회 이상 사용</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-500 mt-0.5 font-bold">&#8226;</span>
                  <span>버그 발견 시 제보 (커뮤니티 게시판 또는 이메일)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-500 mt-0.5 font-bold">&#8226;</span>
                  <span>테스트 종료 후 간단한 사용 후기 작성 (선택)</span>
                </li>
              </ul>
            </div>

            {/* 안내 사항 */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-[12px] text-gray-500 leading-relaxed">
                ※ 테스트 기간 종료 후 유료 전환 의무는 없습니다. 자동 결제되지 않으며, 무료 계정으로 전환됩니다.
                기존에 생성/저장한 콘텐츠는 그대로 유지됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <a
            href="https://forms.gle/QVtdqRD6N73q4EvZ9"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-colors shadow-sm"
          >
            테스터 신청하기
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-gray-500 text-sm font-medium rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export function TesterFloatingButton(_props: { onClick: () => void }) {
  // 사용자 요구: 테스터 모집 중 배너 삭제 — 모든 페이지에서 일괄 hide
  // (각 페이지에서 import·렌더는 그대로 두되 컴포넌트가 null 반환)
  return null;
  // 아래 원본 마크업 보존 (필요 시 부활 가능)
  /* eslint-disable */
  // @ts-ignore
  return (
    <button
      onClick={_props.onClick}
      className="fixed top-20 left-4 sm:left-6 z-40 w-20 h-20 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 text-white rounded-2xl shadow-xl shadow-orange-500/40 hover:shadow-orange-500/60 hover:scale-110 transition-colors flex flex-col items-center justify-center gap-1 group"
    >
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full" />
      <svg className="w-7 h-7 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
      <span className="text-[10px] font-bold leading-tight text-center">테스터{'\n'}모집중</span>
    </button>
  );
}
