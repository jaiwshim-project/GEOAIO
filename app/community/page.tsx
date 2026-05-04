'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TesterModal, { TesterFloatingButton } from '@/components/TesterModal';
import { createClient } from '@/lib/supabase-client';
import { getUserPlan, type PlanType } from '@/lib/usage';
import type { User } from '@supabase/supabase-js';

interface Question {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  content: string;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
}

interface Review {
  id: string;
  user_id: string;
  user_name: string;
  rating: number;
  content: string;
  created_at: string;
}

type Tab = 'questions' | 'reviews' | 'qna';

interface QnaItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const QNA_DATA: QnaItem[] = [
  // 서비스 소개
  { id: 1, category: '서비스 소개', question: 'GEOAIO는 어떤 서비스인가요?', answer: 'GEOAIO는 AI 검색 엔진(ChatGPT, Gemini, Perplexity 등)에서 콘텐츠가 잘 노출되도록 최적화해주는 서비스입니다. AI 기반 검색 최적화(AIO)와 생성형 엔진 최적화(GEO) 기술을 활용하여, 여러분의 콘텐츠가 AI 답변에 인용될 확률을 높여드립니다.' },
  { id: 2, category: '서비스 소개', question: 'AIO와 GEO의 차이점은 무엇인가요?', answer: 'AIO(AI Overview Optimization)는 Google의 AI 개요(AI Overview)에 콘텐츠가 노출되도록 최적화하는 것이고, GEO(Generative Engine Optimization)는 ChatGPT, Perplexity 등 생성형 AI 검색 엔진에서 콘텐츠가 인용되도록 최적화하는 것입니다. 두 가지 모두 AI 시대의 새로운 SEO 전략입니다.' },
  { id: 3, category: '서비스 소개', question: '기존 SEO와 어떻게 다른가요?', answer: '기존 SEO는 구글, 네이버 등 전통 검색엔진의 검색 결과 순위를 높이는 데 집중합니다. 반면 GEO/AIO는 AI가 답변을 생성할 때 참조하는 콘텐츠가 되도록 최적화합니다. AI 검색에서는 키워드 밀도보다 콘텐츠의 신뢰성, 구조화, 전문성이 더 중요합니다.' },
  { id: 4, category: '서비스 소개', question: '어떤 AI 검색 엔진을 지원하나요?', answer: 'Google AI Overview, ChatGPT(SearchGPT), Perplexity AI, Microsoft Copilot, Gemini 등 주요 AI 검색 엔진을 모두 지원합니다. 각 엔진의 특성에 맞는 최적화 전략을 제공합니다.' },
  { id: 5, category: '서비스 소개', question: '이 서비스를 사용하면 어떤 효과가 있나요?', answer: 'AI 검색 결과에서 콘텐츠 노출 확률이 높아지고, 브랜드 인지도가 향상됩니다. 또한 AI가 생성하는 답변에 여러분의 콘텐츠가 출처로 인용되어 신뢰성 있는 트래픽을 확보할 수 있습니다.' },
  // 기능 관련
  { id: 6, category: '기능', question: '콘텐츠 분석 기능은 어떻게 사용하나요?', answer: '홈페이지에서 "콘텐츠 분석" 메뉴를 클릭하고, 분석할 콘텐츠의 URL 또는 텍스트를 입력하면 됩니다. AI가 콘텐츠의 GEO/AIO 최적화 점수를 분석하고, 개선 방향을 구체적으로 제시합니다.' },
  { id: 7, category: '기능', question: '콘텐츠 생성 기능은 무엇인가요?', answer: '주제와 키워드를 입력하면 GEO/AIO에 최적화된 콘텐츠를 AI가 자동으로 생성해줍니다. 생성된 콘텐츠는 구조화된 형식, 전문 용어, 통계 데이터 등이 포함되어 AI 검색엔진이 선호하는 형태로 작성됩니다.' },
  { id: 8, category: '기능', question: '키워드 분석 기능은 어떤 정보를 제공하나요?', answer: '키워드 분석은 입력한 키워드의 AI 검색 트렌드, 경쟁도, 관련 키워드를 분석합니다. AI 검색엔진에서 자주 질문되는 형태의 키워드를 발굴하고, 콘텐츠 전략 수립에 필요한 인사이트를 제공합니다.' },
  { id: 9, category: '기능', question: '시리즈 콘텐츠 생성이란 무엇인가요?', answer: '하나의 주제에 대해 연속된 여러 편의 콘텐츠를 체계적으로 기획하고 생성하는 기능입니다. 시리즈 형태의 콘텐츠는 AI 검색엔진에서 전문성과 깊이를 인정받아 더 높은 인용 확률을 가집니다.' },
  { id: 10, category: '기능', question: '최적화 점수는 어떻게 계산되나요?', answer: '콘텐츠의 구조화 정도, 전문성, 인용 가능성, 질문-답변 형식 포함 여부, 통계/데이터 활용도, 명확한 출처 제시 등 다양한 요소를 종합적으로 평가하여 100점 만점으로 점수를 산출합니다.' },
  // 요금제
  { id: 11, category: '요금제', question: '무료 플랜으로 얼마나 사용할 수 있나요?', answer: '무료 플랜은 월 3회까지 콘텐츠 분석, 생성, 키워드 분석, 시리즈 생성 기능을 사용할 수 있습니다. 서비스 체험 후 유료 플랜으로 업그레이드하시면 더 많은 횟수를 이용하실 수 있습니다.' },
  { id: 12, category: '요금제', question: '테스터 플랜은 어떤 혜택이 있나요?', answer: '테스터 플랜은 월 15회까지 모든 기능을 사용할 수 있으며, 얼리 테스터로 참여하신 분들께 제공되는 특별 플랜입니다. 서비스 피드백을 제공해주시면 테스터 등급을 부여해드립니다.' },
  { id: 13, category: '요금제', question: 'Pro 플랜과 Max 플랜의 차이는 무엇인가요?', answer: 'Pro 플랜은 월 15회, Max 플랜은 월 50회까지 사용 가능합니다. Max 플랜은 대량의 콘텐츠를 관리하는 기업이나 마케팅 에이전시에 적합하며, 우선 지원 서비스도 포함됩니다.' },
  { id: 14, category: '요금제', question: '요금제를 변경하려면 어떻게 하나요?', answer: '현재 요금제 변경은 관리자에게 문의해주시면 처리해드립니다. 질문 게시판이나 이메일을 통해 플랜 변경을 요청하실 수 있습니다. 향후 자동 결제 및 플랜 변경 기능이 추가될 예정입니다.' },
  { id: 15, category: '요금제', question: '사용 횟수가 초과되면 어떻게 되나요?', answer: '월간 사용 횟수가 초과되면 해당 월에는 추가 사용이 제한됩니다. 매월 1일에 사용 횟수가 초기화되며, 더 많은 사용이 필요하시면 상위 플랜으로 업그레이드를 권장합니다.' },
  // 계정 관리
  { id: 16, category: '계정', question: '회원가입은 어떻게 하나요?', answer: '홈페이지 우측 상단의 "로그인" 버튼을 클릭한 후 "회원가입" 탭에서 이메일과 비밀번호를 입력하시면 됩니다. 가입 후 바로 무료 플랜으로 서비스를 이용하실 수 있습니다.' },
  { id: 17, category: '계정', question: '비밀번호를 잊어버렸어요. 어떻게 하나요?', answer: '로그인 페이지에서 "비밀번호 찾기" 기능을 이용하시거나, 관리자에게 문의해주세요. 등록된 이메일로 비밀번호 재설정 링크를 보내드립니다.' },
  { id: 18, category: '계정', question: '내 사용량은 어디서 확인하나요?', answer: '로그인 후 "마이페이지" 메뉴에서 이번 달 사용량, 누적 사용량, 잔여 횟수 등을 확인하실 수 있습니다. 각 기능별(분석, 생성, 키워드, 시리즈) 사용 현황도 상세하게 확인 가능합니다.' },
  { id: 19, category: '계정', question: '계정을 삭제하려면 어떻게 하나요?', answer: '계정 삭제를 원하시면 관리자에게 질문 게시판이나 이메일로 요청해주세요. 계정 삭제 시 모든 사용 기록과 생성된 콘텐츠 데이터가 영구적으로 삭제됩니다.' },
  { id: 20, category: '계정', question: '여러 기기에서 동시에 로그인할 수 있나요?', answer: '네, 동일한 계정으로 여러 기기에서 동시 로그인이 가능합니다. PC, 태블릿, 모바일 등 다양한 기기에서 자유롭게 서비스를 이용하실 수 있습니다.' },
  // 기술 관련
  { id: 21, category: '기술', question: 'API를 직접 호출할 수 있나요?', answer: '네, API 키를 발급받으시면 직접 API를 호출하여 서비스를 이용할 수 있습니다. 마이페이지에서 API 키를 확인하실 수 있으며, API 문서를 참고하여 시스템에 통합하실 수 있습니다.' },
  { id: 22, category: '기술', question: '생성된 콘텐츠의 저작권은 누구에게 있나요?', answer: 'AI를 통해 생성된 콘텐츠의 저작권은 사용자에게 있습니다. 생성된 콘텐츠를 자유롭게 수정하고 활용하실 수 있으며, 상업적 목적으로도 사용 가능합니다.' },
  { id: 23, category: '기술', question: '콘텐츠 분석 결과는 얼마나 정확한가요?', answer: 'AI 모델 기반으로 분석하므로 높은 수준의 정확도를 제공하지만, 100% 보장은 아닙니다. 분석 결과는 참고용으로 활용하시고, 최종 콘텐츠 전략은 사용자의 판단과 함께 결정하시는 것을 권장합니다.' },
  { id: 24, category: '기술', question: '데이터는 안전하게 보호되나요?', answer: '모든 데이터는 암호화되어 전송 및 저장되며, Supabase의 보안 인프라를 활용하고 있습니다. 사용자의 콘텐츠와 개인정보는 엄격한 보안 정책에 따라 관리됩니다.' },
  { id: 25, category: '기술', question: '어떤 언어의 콘텐츠를 지원하나요?', answer: '현재 한국어와 영어 콘텐츠를 주로 지원합니다. AI 모델의 다국어 처리 능력을 활용하여 다양한 언어의 콘텐츠 분석 및 생성이 가능하며, 지원 언어는 지속적으로 확대될 예정입니다.' },
  // 활용 팁
  { id: 26, category: '활용 팁', question: 'AI 검색 최적화를 위한 가장 중요한 팁은 무엇인가요?', answer: '질문-답변(Q&A) 형식으로 콘텐츠를 구성하고, 신뢰할 수 있는 통계 데이터를 포함하세요. 구조화된 데이터(제목, 소제목, 목록)를 사용하고, 전문 용어를 적절히 활용하면 AI 검색엔진에서 인용될 확률이 높아집니다.' },
  { id: 27, category: '활용 팁', question: '콘텐츠를 얼마나 자주 업데이트해야 하나요?', answer: 'AI 검색엔진은 최신 정보를 선호하므로, 최소 월 1회 이상 콘텐츠를 업데이트하는 것을 권장합니다. 특히 통계 데이터, 트렌드 관련 내용은 정기적인 갱신이 중요합니다.' },
  { id: 28, category: '활용 팁', question: '블로그와 웹사이트 중 어디에 더 효과적인가요?', answer: '두 곳 모두 효과적이지만, 웹사이트의 경우 구조화된 데이터(Schema.org)를 활용할 수 있어 AI 검색엔진이 콘텐츠를 더 잘 이해합니다. 블로그는 정기적인 콘텐츠 업데이트에 유리합니다. 두 채널을 병행하는 것이 가장 효과적입니다.' },
  { id: 29, category: '활용 팁', question: 'E-E-A-T가 AI 검색 최적화에도 중요한가요?', answer: '매우 중요합니다. E-E-A-T(경험, 전문성, 권위성, 신뢰성)는 Google AI Overview에서 콘텐츠를 선택하는 핵심 기준입니다. 실제 경험에 기반한 콘텐츠, 전문가의 인사이트, 신뢰할 수 있는 출처를 포함하세요.' },
  { id: 30, category: '활용 팁', question: '경쟁사보다 AI 검색에서 앞서려면 어떻게 해야 하나요?', answer: '첫째, 경쟁사가 다루지 않는 세부 주제(롱테일 키워드)를 공략하세요. 둘째, 독자적인 데이터나 연구 결과를 포함하세요. 셋째, 콘텐츠를 시리즈로 구성하여 주제에 대한 깊이를 보여주세요. 본 서비스의 키워드 분석과 시리즈 생성 기능이 도움이 됩니다.' },
];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<Tab>('questions');
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<PlanType>('free');
  const [loading, setLoading] = useState(true);

  // 질문 상태
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qTitle, setQTitle] = useState('');
  const [qContent, setQContent] = useState('');
  const [qSubmitting, setQSubmitting] = useState(false);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [answering, setAnswering] = useState(false);

  // 후기 상태
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rRating, setRRating] = useState(5);
  const [rContent, setRContent] = useState('');
  const [rSubmitting, setRSubmitting] = useState(false);

  const [showQForm, setShowQForm] = useState(false);
  const [showRForm, setShowRForm] = useState(false);
  const [expandedQna, setExpandedQna] = useState<number | null>(null);
  const [qnaFilter, setQnaFilter] = useState<string>('전체');
  const [showTesterModal, setShowTesterModal] = useState(false);

  const isAdmin = plan === 'admin';

  useEffect(() => {
    const load = async () => {
      try {
        // 사용자 확인 (비로그인도 허용)
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          const p = await getUserPlan();
          setPlan(p);
        }
        await loadData();
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadData = async () => {
    // 비로그인도 조회 가능하도록 API 사용
    const res = await fetch('/api/community/list');
    if (res.ok) {
      const data = await res.json();
      setQuestions(data.questions || []);
      setReviews(data.reviews || []);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleSubmitQuestion = async () => {
    if (!qTitle.trim() || !qContent.trim() || !user) return;
    setQSubmitting(true);
    try {
      const supabase = createClient();
      const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || '사용자';
      const { error } = await supabase.from('questions').insert({
        user_id: user.id,
        user_name: userName,
        title: qTitle.trim(),
        content: qContent.trim(),
      });
      if (error) throw error;
      setQTitle('');
      setQContent('');
      setShowQForm(false);
      await loadData();
    } catch {
      alert('질문 등록에 실패했습니다.');
    } finally {
      setQSubmitting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!rContent.trim() || !user) return;
    setRSubmitting(true);
    try {
      const supabase = createClient();
      const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || '사용자';
      const { error } = await supabase.from('reviews').insert({
        user_id: user.id,
        user_name: userName,
        rating: rRating,
        content: rContent.trim(),
      });
      if (error) throw error;
      setRContent('');
      setRRating(5);
      setShowRForm(false);
      await loadData();
    } catch {
      alert('후기 등록에 실패했습니다.');
    } finally {
      setRSubmitting(false);
    }
  };

  const handleAnswer = async (questionId: string) => {
    if (!answerText.trim()) return;
    setAnswering(true);
    try {
      const res = await fetch('/api/community/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, answer: answerText.trim() }),
      });
      if (!res.ok) throw new Error();
      setAnswerText('');
      await loadData();
    } catch {
      alert('답변 등록에 실패했습니다.');
    } finally {
      setAnswering(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('질문을 삭제하시겠습니까?')) return;
    const supabase = createClient();
    await supabase.from('questions').delete().eq('id', id);
    await loadData();
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('후기를 삭제하시겠습니까?')) return;
    const supabase = createClient();
    await supabase.from('reviews').delete().eq('id', id);
    await loadData();
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
            <h2 className="text-2xl font-bold mb-1">커뮤니티</h2>
            <p className="text-sm text-white/80">질문, 후기, 자주 묻는 질문을 확인하세요</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* 탭 헤더 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('questions')}
                  className={`flex-1 py-3.5 text-sm font-bold text-center transition-colors border-b-3 ${
                    activeTab === 'questions'
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-600'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-transparent'
                  }`}
                >
                  질문 <span className={`ml-1 text-xs font-semibold ${activeTab === 'questions' ? 'text-emerald-500' : 'text-gray-300'}`}>({questions.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`flex-1 py-3.5 text-sm font-bold text-center transition-colors border-b-3 ${
                    activeTab === 'reviews'
                      ? 'text-purple-700 bg-purple-50 border-purple-600'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-transparent'
                  }`}
                >
                  후기 <span className={`ml-1 text-xs font-semibold ${activeTab === 'reviews' ? 'text-purple-500' : 'text-gray-300'}`}>({reviews.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('qna')}
                  className={`flex-1 py-3.5 text-sm font-bold text-center transition-colors border-b-3 ${
                    activeTab === 'qna'
                      ? 'text-indigo-800 bg-indigo-50 border-indigo-800'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-transparent'
                  }`}
                >
                  QnA <span className={`ml-1 text-xs font-semibold ${activeTab === 'qna' ? 'text-indigo-600' : 'text-gray-300'}`}>({QNA_DATA.length})</span>
                </button>
              </div>

              {/* ===================== 질문 탭 ===================== */}
              {activeTab === 'questions' && (
                <div className="p-5">
                  {/* 질문 작성 버튼 (로그인 시만) */}
                  {user && !showQForm && (
                    <button
                      onClick={() => setShowQForm(true)}
                      className="w-full mb-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-colors shadow-sm"
                    >
                      질문 작성하기
                    </button>
                  )}
                  {!user && (
                    <div className="mb-4 text-center py-3 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-500">질문을 작성하려면 <a href="/login" className="text-indigo-600 font-semibold">로그인</a>이 필요합니다.</p>
                    </div>
                  )}

                  {/* 질문 작성 폼 */}
                  {showQForm && (
                    <div className="mb-5 bg-indigo-50/50 rounded-xl p-4 border border-indigo-200">
                      <h3 className="text-sm font-bold text-gray-900 mb-3">새 질문 작성</h3>
                      <input
                        type="text"
                        placeholder="질문 제목"
                        value={qTitle}
                        onChange={(e) => setQTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 mb-2"
                      />
                      <textarea
                        placeholder="질문 내용을 입력하세요"
                        value={qContent}
                        onChange={(e) => setQContent(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 resize-none mb-3"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setShowQForm(false); setQTitle(''); setQContent(''); }}
                          className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          취소
                        </button>
                        <button
                          onClick={handleSubmitQuestion}
                          disabled={qSubmitting || !qTitle.trim() || !qContent.trim()}
                          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {qSubmitting ? '등록 중...' : '등록'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 질문 목록 */}
                  {questions.length === 0 ? (
                    <div className="text-center py-10 text-sm text-gray-400">
                      아직 질문이 없습니다. 첫 번째 질문을 남겨보세요!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {questions.map((q) => (
                        <div key={q.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                          <button
                            onClick={() => { setExpandedQ(expandedQ === q.id ? null : q.id); setAnswerText(q.answer || ''); }}
                            className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                          >
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${
                              q.answer ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {q.answer ? '답변 완료' : '대기 중'}
                            </span>
                            <span className="text-sm font-medium text-gray-900 flex-1 truncate">{q.title}</span>
                            <span className="text-[10px] text-gray-400 shrink-0">{q.user_name}</span>
                            <span className="text-[10px] text-gray-400 shrink-0">{formatDate(q.created_at)}</span>
                            <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 ${expandedQ === q.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {expandedQ === q.id && (
                            <div className="border-t border-gray-100 px-4 py-4 space-y-3">
                              {/* 질문 내용 */}
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{q.content}</p>
                              </div>

                              {/* 답변 */}
                              {q.answer && (
                                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500 text-white rounded">관리자 답변</span>
                                    {q.answered_at && (
                                      <span className="text-[10px] text-gray-400">{formatDate(q.answered_at)}</span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{q.answer}</p>
                                </div>
                              )}

                              {/* 관리자 답변 입력 */}
                              {isAdmin && (
                                <div className="bg-red-50/50 rounded-lg p-3 border border-red-200">
                                  <h4 className="text-xs font-bold text-red-700 mb-2">
                                    {q.answer ? '답변 수정' : '답변 작성'}
                                  </h4>
                                  <textarea
                                    placeholder="답변을 입력하세요"
                                    value={answerText}
                                    onChange={(e) => setAnswerText(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-400 resize-none mb-2"
                                  />
                                  <button
                                    onClick={() => handleAnswer(q.id)}
                                    disabled={answering || !answerText.trim()}
                                    className="px-4 py-1.5 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                                  >
                                    {answering ? '저장 중...' : '답변 저장'}
                                  </button>
                                </div>
                              )}

                              {/* 본인 질문 삭제 */}
                              {user?.id === q.user_id && (
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => handleDeleteQuestion(q.id)}
                                    className="text-[10px] text-red-400 hover:text-red-600 transition-colors"
                                  >
                                    삭제
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ===================== 후기 탭 ===================== */}
              {activeTab === 'reviews' && (
                <div className="p-5">
                  {/* 평균 별점 */}
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-3 mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-5 h-5 ${star <= Math.round(Number(avgRating)) ? 'text-amber-400' : 'text-gray-200'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-lg font-bold text-amber-700 tabular-nums">{avgRating}</span>
                      <span className="text-xs text-gray-500">({reviews.length}개 후기)</span>
                    </div>
                  )}

                  {/* 후기 작성 버튼 (로그인 시만) */}
                  {user && !showRForm && (
                    <button
                      onClick={() => setShowRForm(true)}
                      className="w-full mb-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-colors shadow-sm"
                    >
                      후기 작성하기
                    </button>
                  )}
                  {!user && (
                    <div className="mb-4 text-center py-3 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-500">후기를 작성하려면 <a href="/login" className="text-indigo-600 font-semibold">로그인</a>이 필요합니다.</p>
                    </div>
                  )}

                  {/* 후기 작성 폼 */}
                  {showRForm && (
                    <div className="mb-5 bg-amber-50/50 rounded-xl p-4 border border-amber-200">
                      <h3 className="text-sm font-bold text-gray-900 mb-3">후기 작성</h3>
                      {/* 별점 선택 */}
                      <div className="mb-3">
                        <label className="text-xs font-medium text-gray-600 mb-1 block">별점</label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setRRating(star)}
                              className="focus:outline-none"
                            >
                              <svg
                                className={`w-7 h-7 transition-colors ${star <= rRating ? 'text-amber-400' : 'text-gray-200'} hover:text-amber-300`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </button>
                          ))}
                          <span className="ml-2 text-sm font-bold text-amber-600">{rRating}점</span>
                        </div>
                      </div>
                      <textarea
                        placeholder="서비스 이용 후기를 남겨주세요"
                        value={rContent}
                        onChange={(e) => setRContent(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400 resize-none mb-3"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setShowRForm(false); setRContent(''); setRRating(5); }}
                          className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          취소
                        </button>
                        <button
                          onClick={handleSubmitReview}
                          disabled={rSubmitting || !rContent.trim()}
                          className="px-4 py-2 text-xs font-semibold text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {rSubmitting ? '등록 중...' : '등록'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 후기 목록 */}
                  {reviews.length === 0 ? (
                    <div className="text-center py-10 text-sm text-gray-400">
                      아직 후기가 없습니다. 첫 번째 후기를 남겨보세요!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map((r) => (
                        <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg
                                    key={star}
                                    className={`w-3.5 h-3.5 ${star <= r.rating ? 'text-amber-400' : 'text-gray-200'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="text-xs font-medium text-gray-700">{r.user_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400">{formatDate(r.created_at)}</span>
                              {user?.id === r.user_id && (
                                <button
                                  onClick={() => handleDeleteReview(r.id)}
                                  className="text-[10px] text-red-400 hover:text-red-600 transition-colors"
                                >
                                  삭제
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* ===================== QnA 탭 ===================== */}
              {activeTab === 'qna' && (
                <div className="p-5">
                  <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-xs text-blue-700 font-medium">GEOAIO 서비스에 대해 자주 묻는 질문과 답변입니다.</p>
                  </div>

                  {/* 카테고리 필터 */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {['전체', '서비스 소개', '기능', '요금제', '계정', '기술', '활용 팁'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setQnaFilter(cat)}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                          qnaFilter === cat
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* QnA 목록 */}
                  <div className="space-y-2">
                    {QNA_DATA
                      .filter((item) => qnaFilter === '전체' || item.category === qnaFilter)
                      .map((item) => (
                        <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                          <button
                            onClick={() => setExpandedQna(expandedQna === item.id ? null : item.id)}
                            className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                          >
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 shrink-0">
                              {item.category}
                            </span>
                            <span className="text-sm font-medium text-gray-900 flex-1">Q. {item.question}</span>
                            <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 ${expandedQna === item.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {expandedQna === item.id && (
                            <div className="border-t border-gray-100 px-4 py-4">
                              <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500 text-white rounded">A</span>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{item.answer}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />

      <TesterFloatingButton onClick={() => setShowTesterModal(true)} />
      <TesterModal show={showTesterModal} onClose={() => setShowTesterModal(false)} />
    </div>
  );
}
