'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TesterModal, { TesterFloatingButton } from '@/components/TesterModal';
import { getUserPlan, getUsageSummary, type PlanType, type FeatureType } from '@/lib/usage';

const plans = [
  {
    id: 'free' as PlanType,
    name: '무료',
    price: '₩0',
    originalPrice: '',
    period: '/월',
    description: '기본 기능을 체험해보세요',
    limit: 3,
    color: 'from-gray-500 to-gray-600',
    border: 'border-gray-300',
    bg: 'bg-gray-50',
    badge: '',
    discount: '',
  },
  {
    id: 'pro' as PlanType,
    name: '프로',
    price: '₩29,700',
    originalPrice: '₩59,000',
    period: '/월',
    description: '전문적인 콘텐츠 최적화',
    limit: 15,
    color: 'from-blue-600 to-indigo-600',
    border: 'border-blue-300',
    bg: 'bg-blue-50',
    badge: '인기',
    discount: '51% OFF',
  },
  {
    id: 'max' as PlanType,
    name: '맥스',
    price: '₩79,200',
    originalPrice: '₩149,000',
    period: '/월',
    description: '대량 콘텐츠 최적화에 최적',
    limit: 50,
    color: 'from-violet-600 to-purple-600',
    border: 'border-violet-300',
    bg: 'bg-violet-50',
    badge: '최대',
    discount: '47% OFF',
  },
];

const features = [
  { key: 'analyze' as FeatureType, label: '콘텐츠 분석' },
  { key: 'generate' as FeatureType, label: '콘텐츠 생성' },
  { key: 'keyword' as FeatureType, label: '키워드 분석' },
  { key: 'series' as FeatureType, label: '시리즈 기획' },
];

export default function PricingPage() {
  const [currentPlan, setCurrentPlan] = useState<PlanType>('free');
  const [usage, setUsage] = useState<{ feature: FeatureType; label: string; current: number; limit: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState<'pro' | 'max' | null>(null);
  const [showTesterModal, setShowTesterModal] = useState(false);

  useEffect(() => {
    Promise.all([getUserPlan(), getUsageSummary()])
      .then(([plan, summary]) => {
        setCurrentPlan(plan);
        setUsage(summary);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 히어로 */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white px-6 sm:px-10 py-8 mb-6 flex items-center gap-6">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
              <circle cx="50" cy="50" r="80" stroke="white" strokeWidth="0.5" />
              <circle cx="350" cy="100" r="120" stroke="white" strokeWidth="0.5" />
            </svg>
          </div>
          <img src="/images/logo-geoaio.png" alt="GEOAIO" className="relative z-10 h-16 rounded-lg shadow-lg hidden sm:block" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-1">요금제</h2>
            <p className="text-sm text-white/80">필요에 맞는 플랜을 선택하세요</p>
          </div>
        </div>

        {/* 프로모션 배너 */}
        <div className="mb-6 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-xl p-5 text-white shadow-lg border border-orange-300 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-bold">Grand Open 프로모션</h3>
                <span className="px-2.5 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">SALE</span>
              </div>
              <p className="text-white text-sm">그랜드 오픈을 기념하여 <strong>최대 51% 할인</strong>된 특별 가격으로 제공합니다</p>
            </div>
          </div>
        </div>

        {/* 관리자 배너 */}
        {!loading && currentPlan === 'admin' && (
          <div className="mb-5 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl p-5 text-white shadow-lg border border-red-300">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold">관리자 계정</h3>
                <p className="text-white text-sm">모든 기능을 무제한으로 사용할 수 있습니다</p>
              </div>
            </div>
          </div>
        )}

        {/* 요금제 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative rounded-xl p-5 border ${plan.border} ${plan.bg} ${
                  isCurrent ? 'ring-2 ring-indigo-400 shadow-lg' : 'shadow-sm'
                } transition-all`}
              >
                {plan.discount && (
                  <span className="absolute -top-3 right-4 px-3 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full">
                    {plan.discount}
                  </span>
                )}
                {plan.badge && !plan.discount && (
                  <span className={`absolute -top-3 right-4 px-3 py-0.5 bg-gradient-to-r ${plan.color} text-white text-xs font-bold rounded-full`}>
                    {plan.badge}
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-3 left-4 px-3 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full">
                    현재 플랜
                  </span>
                )}

                <h3 className="text-sm font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{plan.description}</p>

                <div className="mb-4">
                  <div className="mb-1 h-5">
                    {plan.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">{plan.originalPrice}</span>
                    )}
                  </div>
                  <span className="text-xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                  {plan.originalPrice && (
                    <span className="ml-2 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                      프로모션가
                    </span>
                  )}
                </div>

                <div className="space-y-3 mb-4">
                  {features.map((f) => (
                    <div key={f.key} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{f.label}</span>
                      <span className={`font-semibold bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>
                        {plan.limit}회/월
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-3 space-y-2">
                    {['대시보드', 'API 키 관리 (이미지 생성용 옵션)'].map((item) => (
                      <div key={item} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{item}</span>
                        <span className="text-emerald-500 font-bold">&#10003;</span>
                      </div>
                    ))}
                  </div>
                </div>

                {plan.id === 'free' ? (
                  <button
                    disabled
                    className="w-full py-2.5 bg-gray-200 text-gray-500 font-semibold rounded-xl cursor-not-allowed text-sm"
                  >
                    기본 플랜
                  </button>
                ) : (
                  <button
                    onClick={() => setPaymentModal(plan.id as 'pro' | 'max')}
                    className={`w-full py-2.5 bg-gradient-to-r ${plan.color} text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-md border ${plan.border} text-sm`}
                  >
                    결제
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* 이번 달 사용량 */}
        {!loading && usage.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-red-400 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              이번 달 사용량
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                currentPlan === 'admin' ? 'bg-red-100 text-red-700 border-red-300'
                : currentPlan === 'tester' ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                : currentPlan === 'pro' ? 'bg-blue-100 text-blue-700 border-blue-300'
                : currentPlan === 'max' ? 'bg-violet-100 text-violet-700 border-violet-300'
                : 'bg-gray-100 text-gray-700 border-gray-300'
              }`}>
                {currentPlan === 'admin' ? '관리자' : currentPlan === 'tester' ? '테스터' : currentPlan === 'pro' ? '프로' : currentPlan === 'max' ? '맥스' : '무료'}
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {usage.map((u) => {
                const isUnlimited = currentPlan === 'admin';
                const percentage = isUnlimited ? 0 : Math.min((u.current / u.limit) * 100, 100);
                const isOver = !isUnlimited && u.current >= u.limit;
                return (
                  <div key={u.feature} className="bg-gray-50 rounded-xl p-4 border border-violet-300">
                    <p className="text-sm font-medium text-gray-700 mb-2">{u.label}</p>
                    <div className="flex items-end gap-1 mb-2">
                      <span className={`text-xl font-bold ${isOver ? 'text-red-600' : 'text-gray-900'}`}>
                        {u.current}
                      </span>
                      <span className="text-sm text-gray-500 mb-0.5">
                        {isUnlimited ? '/ 무제한' : `/ ${u.limit}회`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isUnlimited ? 'bg-emerald-500' : isOver ? 'bg-red-500' : percentage > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: isUnlimited ? '100%' : `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 사용량 리셋 안내 */}
        <div className="mt-4 bg-indigo-50 rounded-xl p-4 border border-indigo-200 flex items-start gap-3">
          <svg className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-[13px] text-indigo-800">
            <p className="font-bold mb-1">사용량 초기화 안내</p>
            <p className="text-indigo-700">모든 요금제(무료/프로/맥스)의 사용 횟수는 <strong>가입일 기준 30일 주기로 자동 초기화</strong>됩니다. 미사용 횟수는 이월되지 않으며, 해당 요금제의 제공 횟수로 새롭게 시작됩니다.</p>
          </div>
        </div>
      </main>
      <Footer />

      <TesterFloatingButton onClick={() => setShowTesterModal(true)} />
      <TesterModal show={showTesterModal} onClose={() => setShowTesterModal(false)} />

      {/* 결제 안내 모달 */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setPaymentModal(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className={`rounded-t-2xl px-6 py-5 text-center relative ${
              paymentModal === 'pro'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                : 'bg-gradient-to-r from-violet-500 to-purple-600'
            }`}>
              <button
                onClick={() => setPaymentModal(null)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-extrabold text-white">
                {paymentModal === 'pro' ? '프로(Pro)' : '맥스(Max)'} 플랜 결제
              </h2>
              <p className="text-sm text-white/80 mt-1">계좌이체로 간편하게 결제하세요</p>
            </div>

            {/* 본문 */}
            <div className="px-6 py-5 space-y-4">
              {/* 결제 금액 */}
              <div className={`rounded-xl p-4 border text-center ${
                paymentModal === 'pro'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-violet-50 border-violet-200'
              }`}>
                <p className="text-sm text-gray-500 mb-1">월 이용료</p>
                <p className={`text-3xl font-extrabold ${
                  paymentModal === 'pro' ? 'text-blue-600' : 'text-violet-600'
                }`}>
                  {paymentModal === 'pro' ? '29,700' : '79,200'}
                  <span className="text-base font-medium text-gray-500">원/월</span>
                </p>
              </div>

              {/* 결제 방법 */}
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <h3 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  계좌이체
                </h3>
                <div className="bg-white rounded-lg p-4 border border-emerald-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">입금 은행</span>
                    <span className="font-bold text-gray-800">농협</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">계좌번호</span>
                    <span className="font-bold text-gray-800">352-0699-6074-53</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">예금주</span>
                    <span className="font-bold text-gray-800">심재우</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">입금액</span>
                    <span className={`font-bold ${paymentModal === 'pro' ? 'text-blue-600' : 'text-violet-600'}`}>
                      {paymentModal === 'pro' ? '29,700원' : '79,200원'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 결제 확인 */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  결제 확인 요청
                </h3>
                <p className="text-[13px] text-gray-700 mb-3">
                  입금 후 아래 번호로 <strong>문자 메시지</strong>를 보내주세요.
                </p>
                <div className="bg-white rounded-lg p-4 border border-blue-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">연락처</span>
                    <span className="font-bold text-gray-800">010-9344-6505</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    <p className="font-medium text-blue-700 mb-1">문자 내용 예시:</p>
                    <div className="bg-blue-50 rounded-lg p-3 text-[13px] text-gray-700 border border-blue-100">
                      AIO {paymentModal === 'pro' ? '프로' : '맥스'} 결제 완료<br/>
                      입금자명: 홍길동<br/>
                      가입 이메일: example@email.com
                    </div>
                  </div>
                </div>
              </div>

              {/* 등급 적용 */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  등급 즉시 적용
                </h3>
                <p className="text-[13px] text-gray-700">
                  문자 확인 후 <strong>즉시 {paymentModal === 'pro' ? '프로(Pro)' : '맥스(Max)'} 등급으로 업그레이드</strong>되며,
                  바로 모든 기능을 사용하실 수 있습니다. 결제일로부터 <strong>30일간</strong> 이용 가능합니다.
                </p>
              </div>

              {/* 안내 */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-[12px] text-gray-500 leading-relaxed">
                  ※ 영업일 기준 입금 확인 후 최대 1시간 이내 등급이 적용됩니다.<br/>
                  ※ 입금자명과 가입 시 이름이 다를 경우, 문자에 가입 이메일을 반드시 기재해주세요.<br/>
                  ※ 자동 결제가 아니며, 매월 수동 이체 방식입니다.
                </p>
              </div>
            </div>

            {/* 푸터 */}
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setPaymentModal(null)}
                className="w-full py-2.5 text-gray-500 text-sm font-medium rounded-xl hover:bg-gray-100 transition-all border border-gray-200"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
