'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import CategoryBanner from '@/components/CategoryBanner';
import Footer from '@/components/Footer';
import ApiKeyPanel from '@/components/ApiKeyPanel';
import type { ContentCategory } from '@/lib/types';
import { saveHistoryItem, generateId } from '@/lib/history';
import { getProfiles, saveProfile, deleteProfile as deleteProfileSupabase, saveApiKey, type Profile, type ProfileData } from '@/lib/supabase-storage';
// canUseFeature, incrementUsage는 커스텀 사용자 시스템에서 API 방식으로 대체
import { useUser, type UserProject } from '@/lib/user-context';
import { track } from '@vercel/analytics';

// fire-and-forget 안전 트래킹: 실패해도 사용자 흐름을 막지 않음
const safeTrack = (event: string, props?: Record<string, string | number | boolean | null>) => {
  try {
    track(event, props);
  } catch (e) {
    console.error('[analytics] track failed:', e);
  }
};

const categories: { id: ContentCategory; label: string; description: string; icon: string; color: string; bgIdle: string }[] = [
  {
    id: 'blog',
    label: '블로그 포스트',
    description: 'SEO 최적화된 블로그 글 작성',
    icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
    color: 'from-blue-500 via-blue-600 to-indigo-600 border-blue-300 shadow-blue-200',
    bgIdle: 'bg-blue-50 border-blue-200 hover:border-blue-400 hover:shadow-blue-100',
  },
  {
    id: 'product',
    label: '제품 설명',
    description: '전환율 높은 제품 소개 콘텐츠',
    icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
    color: 'from-emerald-500 via-emerald-600 to-teal-600 border-emerald-300 shadow-emerald-200',
    bgIdle: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100',
  },
  {
    id: 'faq',
    label: 'FAQ 페이지',
    description: 'AI 검색에 최적화된 FAQ',
    icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    color: 'from-amber-500 via-orange-500 to-amber-600 border-amber-300 shadow-amber-200',
    bgIdle: 'bg-amber-50 border-amber-200 hover:border-amber-400 hover:shadow-amber-100',
  },
  {
    id: 'howto',
    label: 'How-to 가이드',
    description: '단계별 안내 콘텐츠 작성',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    color: 'from-violet-500 via-purple-600 to-indigo-600 border-violet-300 shadow-violet-200',
    bgIdle: 'bg-violet-50 border-violet-200 hover:border-violet-400 hover:shadow-violet-100',
  },
  {
    id: 'landing',
    label: '랜딩 페이지',
    description: '설득력 있는 랜딩 카피 작성',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    color: 'from-pink-500 via-rose-500 to-pink-600 border-pink-300 shadow-pink-200',
    bgIdle: 'bg-pink-50 border-pink-200 hover:border-pink-400 hover:shadow-pink-100',
  },
  {
    id: 'technical',
    label: '기술 문서',
    description: '구조화된 기술 문서 작성',
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    color: 'from-cyan-500 via-sky-500 to-cyan-600 border-cyan-300 shadow-cyan-200',
    bgIdle: 'bg-cyan-50 border-cyan-200 hover:border-cyan-400 hover:shadow-cyan-100',
  },
  {
    id: 'social',
    label: '소셜 미디어',
    description: 'SNS 최적화 콘텐츠 생성',
    icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
    color: 'from-rose-500 via-red-500 to-rose-600 border-rose-300 shadow-rose-200',
    bgIdle: 'bg-rose-50 border-rose-200 hover:border-rose-400 hover:shadow-rose-100',
  },
  {
    id: 'email',
    label: '이메일 마케팅',
    description: '전환율 높은 이메일 작성',
    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    color: 'from-indigo-500 via-blue-600 to-indigo-600 border-indigo-300 shadow-indigo-200',
    bgIdle: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400 hover:shadow-indigo-100',
  },
];

// ==================== 카테고리별 서브키워드 ====================
const subKeywordsByCategory: Record<ContentCategory, string[]> = {
  blog: ['일반 블로그', '뷰티', '푸드', '여행', '라이프스타일', '기술', '금융', '건강'],
  product: ['의료 제품', '화장품', '패션', '전자제품', '식품', '가구', '서비스'],
  faq: ['일반 FAQ', '기술 지원', '고객 서비스', '제품 사용법', '결제/배송', '회원 관리'],
  howto: ['일상 가이드', '요리 레시피', 'DIY', '기술 튜토리얼', '운동/피트니스', '학습'],
  landing: ['SaaS', 'E-commerce', '서비스', '구독형', '모바일 앱', '교육'],
  technical: ['API 문서', '시스템 설계', '개발 가이드', '운영 매뉴얼', '보안 가이드'],
  social: ['인스타그램', '페이스북', '유튜브', '틱톡', '링크드인', '트위터'],
  email: ['뉴스레터', '프로모션', '고객 유지', '이벤트 안내', '제품 소개'],
};

// ⚠️ TEMP: 동시성 한계 검증을 위해 5개 톤 임시 비활성화 (2026-04-26).
//   실패 빈도 높은 5개(친근한·설득적·뉴스형·비교분석형·사례연구형)를 빼고
//   안정적 5개만 사용. 검증 결과에 따라 복원 또는 옵션 B(토글)로 전환.
const toneOptions = [
  { value: '전문적이고 신뢰감 있는', label: '전문적' },
  { value: '친근하고 대화체의', label: '친근한' },             // 활성 (자동 재시도로 안정화)
  { value: '설득력 있고 강렬한', label: '설득적' },            // 활성 (Claude 단계별 분리로 안정화)
  { value: '간결하고 명확한', label: '간결한' },
  { value: '스토리텔링 중심의', label: '스토리텔링' },
  { value: '뉴스/저널리즘 스타일의', label: '뉴스형' },        // 활성 (Claude 단계별 분리로 안정화)
  { value: '교육적이고 강의형의', label: '교육형' },
  { value: '비교분석 중심의', label: '비교분석형' },           // 활성 (Claude 단계별 분리로 안정화)
  { value: '사례연구 중심의', label: '사례연구형' },           // 활성 (Claude 단계별 분리로 안정화)
  { value: '감성적이고 공감하는', label: '감성형' },
];

export default function GeneratePage() {
  const router = useRouter();
  const { selectedProject, geminiApiKey: contextApiKey, setGeminiApiKey: setContextApiKey, currentUser } = useUser();
  // context 로드 전 빈값일 경우 localStorage에서 직접 읽어 fallback
  const geminiApiKey = contextApiKey;

  const [selectedCategory, setSelectedCategory] = useState<ContentCategory | null>(null);
  const [selectedSubKeyword, setSelectedSubKeyword] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [tone, setTone] = useState('전문적이고 신뢰감 있는');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [referenceFiles, setReferenceFiles] = useState<{ name: string; content: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKeyRecovery, setShowKeyRecovery] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [recoveryKeyVisible, setRecoveryKeyVisible] = useState(false);
  const [recoverySaving, setRecoverySaving] = useState(false);
  const [recoverySaved, setRecoverySaved] = useState(false);

  // 하단 상시 API 키 패널
  const [inlineKey, setInlineKey] = useState('');
  const [inlineKeyVisible, setInlineKeyVisible] = useState(false);
  const [inlineSaving, setInlineSaving] = useState(false);
  const [inlineHasKey, setInlineHasKey] = useState(false);
  const [inlineStatus, setInlineStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [abTestMode, setAbTestMode] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [showBusinessInfo, setShowBusinessInfo] = useState(false);
  const [businessInfo, setBusinessInfo] = useState({
    companyName: '',
    brandName: '',
    industry: '',
    customIndustry: '',
    mainProduct: '',
    productDescription: '',
    priceRange: '',
    mainBenefit: '',
    targetAudience: '',
    customerNeeds: '',
    strengths: [] as string[],
    newStrength: '',
    uniquePoint: '',
    location: '',
    website: '',
  });
  const [bizSaved, setBizSaved] = useState(false);
  const [showProfileList, setShowProfileList] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<Profile[]>([]);
  const [profileSaveMsg, setProfileSaveMsg] = useState('');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileListRef = useRef<HTMLDivElement>(null);

  // ==================== API 자동 선택 ====================
  const [availableApis, setAvailableApis] = useState<string[]>([]);
  const [selectedApi, setSelectedApi] = useState<'gemini' | 'claude' | 'geo-aio'>('gemini');

  // ==================== 동적 분야 생성 ====================
  const [dynamicSubKeywords, setDynamicSubKeywords] = useState<string[]>([]);
  const [loadingSubKeywords, setLoadingSubKeywords] = useState(false);

  // ==================== 톤 생성 진행 상황 ====================
  const [toneProgress, setToneProgress] = useState(0);

  // API 가용성 확인 (페이지 로드 시)
  useEffect(() => {
    const checkApis = async () => {
      const available: string[] = [];

      // 서버 환경변수 확인 (Vercel에서만 관리)
      try {
        const res = await fetch('/api/ai-status');
        if (res.ok) {
          const data = await res.json();
          if (data.availableModels) {
            if (data.availableModels.includes('🧠 Claude')) available.push('claude');
          }
        }
      } catch {}

      setAvailableApis(available);
      if (available.length > 0) {
        // 우선순위: Claude > Gemini > Geo-AIO (Claude를 디폴트로)
        if (available.includes('gemini')) setSelectedApi('gemini');
        else if (available.includes('claude')) setSelectedApi('claude');
      }
    };

    checkApis();
  }, [contextApiKey]);

  // 주제 추천 드롭다운
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [topicFetchError, setTopicFetchError] = useState('');
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  // 사용된 추천 주제 마킹 (결과 페이지 → 다른 주제로 또 생성 흐름 지원)
  const [usedTopics, setUsedTopics] = useState<string[]>([]);
  // 📚 localStorage에 저장된 추천 주제 — 별도 고정 섹션용 (어떤 경우에도 표시)
  const [savedTopicsCache, setSavedTopicsCache] = useState<{ topics: string[]; usedTopics?: string[]; category?: string; subKeyword?: string; savedAt?: number } | null>(null);
  // 🎯 localStorage에 저장된 CEP 장면 발굴 결과 — 별도 고정 섹션용
  const [savedCepCache, setSavedCepCache] = useState<{ lifeLanguages?: string[]; clusters?: { clusterName: string; intent?: string }[]; sceneSentence?: string; savedAt?: number } | null>(null);
  const CEP_CACHE_KEY = 'cep:wizardResult';
  // 키워드 추천
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  // 타겟 키워드 입력 (초기값은 빈 문자열)
  const [customKeyword, setCustomKeyword] = useState('');

  // CEP(Category Entry Point) 발굴 상태
  const [cepOpen, setCepOpen] = useState(false);
  const [cepSeed, setCepSeed] = useState('');
  const [cepLoading, setCepLoading] = useState<'idle' | 'cluster' | 'scene' | 'score'>('idle');
  const [cepClusters, setCepClusters] = useState<{ clusterName: string; keywords: string[]; searchPath: string[]; intent: string }[]>([]);
  const [cepLifeLanguages, setCepLifeLanguages] = useState<string[]>([]);
  const [cepSelectedCluster, setCepSelectedCluster] = useState<number | null>(null);
  const [sceneSentence, setSceneSentence] = useState('');
  const [cepTask, setCepTask] = useState('');
  const [cepHooks, setCepHooks] = useState<string[]>([]);
  const [cepCandidates, setCepCandidates] = useState<{ cepKeyword: string; sceneSentence?: string; score?: { marketFit: number; brandFit: number; provability: number; total: number; rationale: { market: string; brand: string; proof: string } }; recommendation?: string }[]>([]);
  const [cepError, setCepError] = useState<string | null>(null);
  // CEP 자동 도출(분대 Oscar): topic 입력 시 백그라운드 자동 진행
  const [cepAutoMode, setCepAutoMode] = useState(true);
  const [cepAutoStatus, setCepAutoStatus] = useState<'idle' | 'searching' | 'translating' | 'done' | 'failed'>('idle');

  // 프로필 목록 로드
  useEffect(() => {
    getProfiles().then(profiles => setSavedProfiles(profiles));
  }, []);


  // 카테고리 변경 시 이전 추천 초기화
  useEffect(() => {
    setTopicSuggestions([]);
    setTopicFetchError('');
    setShowTopicDropdown(false);
    setSelectedSubKeyword('');
  }, [selectedCategory]);

  // 동적 분야 로드 (카테고리 또는 프로젝트 변경 시)
  useEffect(() => {
    setDynamicSubKeywords([]);

    if (selectedCategory && selectedProject?.name) {
      console.log('[분야] useEffect 트리거:', {
        category: selectedCategory,
        projectName: selectedProject.name
      });
      loadDynamicSubKeywords(selectedCategory);
    }
  }, [selectedCategory, selectedProject?.name]);

  // 동적 분야 생성 (프로젝트 중심 + 비즈니스 정보 보조)
  const loadDynamicSubKeywords = async (category: ContentCategory) => {
    if (!selectedProject?.name) {
      console.log('[분야] 프로젝트 정보 없음');
      return;
    }

    setLoadingSubKeywords(true);
    console.log('[분야] 로드 시작:', { projectName: selectedProject.name, category });

    try {
      const headers = getApiHeaders(selectedApi);
      const payload = {
        category,
        projectName: selectedProject.name,
        projectDescription: selectedProject.description || '',
        projectFiles: [], // 분야 추천은 프로젝트명 기반으로 충분
        businessInfo: businessInfo ? {
          industry: businessInfo.industry || businessInfo.customIndustry || '',
          mainProduct: businessInfo.mainProduct || '',
          mainBenefit: businessInfo.mainBenefit || '',
          targetAudience: businessInfo.targetAudience || '',
        } : {},
      };

      console.log('[분야] 요청 페이로드:', payload);
      console.log('[분야] 요청 헤더:', { ...headers, 'X-API-Provider': selectedApi });

      const res = await fetch('/api/suggest-subkeywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
          'X-API-Provider': selectedApi,
        },
        body: JSON.stringify(payload),
      });

      console.log('[분야] 응답 상태:', res.status, res.statusText);

      if (res.ok) {
        const data = await res.json();
        console.log('[분야] 응답 데이터:', data);
        setDynamicSubKeywords(data.subKeywords || []);
      } else {
        const errorText = await res.text();
        console.error('[분야] API 에러:', res.status, errorText);
        setDynamicSubKeywords([]);
      }
    } catch (e) {
      console.error('[분야] 예외 발생:', e);
      setDynamicSubKeywords([]);
    } finally {
      setLoadingSubKeywords(false);
    }
  };

  // ==================== AI별 헤더 생성 ====================
  // 주의: API 키는 서버 환경 변수에서만 관리
  // localStorage 사용 금지 (캐시 문제 방지)
  const getApiHeaders = (api: string): Record<string, string> => {
    // 클라이언트에서 API 키를 보내지 않음
    // 서버에서 process.env 환경 변수를 사용하도록 위임
    return {};
  };

  // ============ 추천 주제 sessionStorage 캐시 (분대 Sierra) ============
  // 결과 페이지에서 다시 generate로 돌아왔을 때 같은 추천 주제를 보존하기 위함
  const SUGGEST_CACHE_KEY = 'cep:suggestedTopics';
  const SUGGEST_CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간 (사용자가 결과 페이지에서 오래 머물 수 있도록)
  const buildSuggestContextHash = (cat?: string | null) => {
    try {
      const parts = [
        cat || selectedCategory || '',
        selectedSubKeyword || '',
        businessInfo?.companyName || '',
        businessInfo?.industry || businessInfo?.customIndustry || '',
        selectedProject?.id || selectedProject?.name || '',
      ];
      return parts.join('|').slice(0, 120);
    } catch {
      return '';
    }
  };
  const readSuggestCache = (): { topics: string[]; usedTopics: string[]; savedAt: number; contextHash: string } | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(SUGGEST_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.topics)) return null;
      return parsed;
    } catch {
      return null;
    }
  };
  const writeSuggestCache = (topics: string[], usedTopicsArg: string[], cat?: string | null) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SUGGEST_CACHE_KEY, JSON.stringify({
        topics,
        usedTopics: usedTopicsArg,
        savedAt: Date.now(),
        contextHash: buildSuggestContextHash(cat),
        // 페이지 재진입 시 자동 복원용 — selectedCategory 등 state도 함께 보존
        category: cat || selectedCategory || '',
        subKeyword: selectedSubKeyword || '',
      }));
    } catch {}
  };
  const updateUsedTopicInCache = (newTopic: string) => {
    if (typeof window === 'undefined') return;
    try {
      const cached = readSuggestCache();
      if (!cached) return;
      const newUsed = Array.from(new Set([...(cached.usedTopics || []), newTopic]));
      localStorage.setItem(SUGGEST_CACHE_KEY, JSON.stringify({
        ...cached,
        usedTopics: newUsed,
      }));
      setUsedTopics(newUsed);
    } catch {}
  };

  // 📚 마운트 시 localStorage에서 저장된 추천 주제 직접 읽어 별도 섹션에 표시 (고정 섹션용)
  // 자동 복원 useEffect와 무관하게 항상 동작 — 사용자가 어떤 경우에도 볼 수 있음
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(SUGGEST_CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.topics) && parsed.topics.length > 0) {
        setSavedTopicsCache(parsed);
        console.log(`[savedTopics] localStorage에서 ${parsed.topics.length}개 추천 주제 로드`);
      }
    } catch (e) {
      console.warn('[savedTopics] localStorage 읽기 실패:', e);
    }
  }, []);

  // 새 추천 주제가 fetch될 때 savedTopicsCache도 갱신 (state 동기화)
  useEffect(() => {
    if (topicSuggestions.length === 0) return;
    setSavedTopicsCache(prev => {
      if (prev && JSON.stringify(prev.topics) === JSON.stringify(topicSuggestions)
          && JSON.stringify(prev.usedTopics || []) === JSON.stringify(usedTopics)) {
        return prev;
      }
      return {
        topics: topicSuggestions,
        usedTopics,
        category: selectedCategory || undefined,
        subKeyword: selectedSubKeyword || undefined,
        savedAt: Date.now(),
      };
    });
  }, [topicSuggestions, usedTopics, selectedCategory, selectedSubKeyword]);

  // 🎯 마운트 시 localStorage에서 CEP 결과 읽기 (고정 섹션용)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(CEP_CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && (Array.isArray(parsed.lifeLanguages) || Array.isArray(parsed.clusters))) {
        setSavedCepCache(parsed);
        console.log(`[savedCep] localStorage에서 CEP 결과 로드: lifeLang ${parsed.lifeLanguages?.length || 0}개, clusters ${parsed.clusters?.length || 0}개`);
      }
    } catch (e) {
      console.warn('[savedCep] localStorage 읽기 실패:', e);
    }
  }, []);

  // CEP 결과 변경 시 localStorage + savedCepCache 동기화
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((cepLifeLanguages?.length || 0) === 0 && (cepClusters?.length || 0) === 0 && !sceneSentence) return;
    const next = {
      lifeLanguages: cepLifeLanguages || [],
      clusters: (cepClusters || []).map(c => ({ clusterName: c.clusterName, intent: c.intent })),
      sceneSentence: sceneSentence || undefined,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(CEP_CACHE_KEY, JSON.stringify(next));
      setSavedCepCache(next);
    } catch {}
  }, [cepLifeLanguages, cepClusters, sceneSentence]);

  // 페이지 마운트 시 추천 주제 복원 (3중 안전망)
  // 1순위: URL query (?cep_topics_b64=...) — 결과 페이지에서 명시적으로 보낸 것 (가장 신뢰)
  // 2순위: localStorage (cep:suggestedTopics) — 같은 PC, 24시간 TTL
  // 3순위: 새로 fetch (사용자가 카테고리 클릭 시)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (topicSuggestions.length > 0) {
      console.log('[suggestCache] 이미 추천 있음, 복원 스킵');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const restoreFromCache = (cached: any, source: string) => {
      if (!cached || !Array.isArray(cached.topics) || cached.topics.length === 0) return false;
      if (cached.category && !selectedCategory) setSelectedCategory(cached.category);
      if (cached.subKeyword && !selectedSubKeyword) setSelectedSubKeyword(cached.subKeyword);
      setTopicSuggestions(cached.topics);
      setUsedTopics(cached.usedTopics || []);
      setShowTopicDropdown(true);
      console.log(`[suggestCache] ✅ ${source}에서 복원: ${cached.topics.length}개 topic, ${cached.usedTopics?.length || 0}개 사용됨`);
      // localStorage에도 저장 (다음에 URL 없어도 복원 가능)
      try {
        localStorage.setItem(SUGGEST_CACHE_KEY, JSON.stringify({
          ...cached,
          savedAt: cached.savedAt || Date.now(),
        }));
      } catch {}
      return true;
    };

    // 1순위: URL query
    try {
      const params = new URLSearchParams(window.location.search);
      const b64 = params.get('cep_topics_b64');
      if (b64) {
        const decoded = decodeURIComponent(escape(atob(b64)));
        const cached = JSON.parse(decoded);
        if (restoreFromCache(cached, 'URL query')) {
          // URL 정리 (다음 새로고침 시 깨끗하게)
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);
          return;
        }
      }
    } catch (e) {
      console.warn('[suggestCache] URL query 복원 실패:', e);
    }

    // 2순위: localStorage
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cached = readSuggestCache() as any;
      console.log('[suggestCache] localStorage 확인:', cached ? `topics=${cached.topics?.length || 0}, savedAt=${new Date(cached.savedAt || 0).toLocaleTimeString()}` : 'none');
      if (cached && Array.isArray(cached.topics) && cached.topics.length > 0) {
        const age = Date.now() - (cached.savedAt || 0);
        if (age < SUGGEST_CACHE_TTL) {
          restoreFromCache(cached, 'localStorage');
          return;
        }
        console.log(`[suggestCache] localStorage 만료 (${Math.round(age / 60000)}분 경과)`);
      }
    } catch (e) {
      console.warn('[suggestCache] localStorage 복원 실패:', e);
    }

    console.log('[suggestCache] 복원 가능한 cache 없음 — 사용자가 카테고리 선택 시 새 fetch');
    // 마운트 시 1회만 — 의도적
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 주제 추천 fetch (버튼 클릭 시 호출)
  const fetchTopicSuggestions = async (cat: string, inputTopic?: string) => {
    if (loadingTopics) return;
    setLoadingTopics(true);
    setTopicSuggestions([]);
    setTopicFetchError('');

    // selectedProject가 null일 경우 sessionStorage에서 직접 읽기
    let activeProject = selectedProject;
    if (!activeProject) {
      try {
        const stored = sessionStorage.getItem('geoaio_project');
        if (stored) activeProject = JSON.parse(stored);
      } catch {}
    }

    // 이전 작성 주제 + 프로젝트 파일 병렬 조회
    let pastTopics: string[] = [];
    let projectFiles: { file_name: string; content: string }[] = [];
    if (activeProject?.id) {
      try {
        const [historyRes, filesRes] = await Promise.all([
          fetch(`/api/generate-results?project_id=${activeProject.id}`),
          fetch(`/api/user-projects/files?project_id=${activeProject.id}`),
        ]);
        const historyData = await historyRes.json();
        const filesData = await filesRes.json();
        pastTopics = (historyData.items || []).map((item: { topic: string }) => item.topic).filter(Boolean);
        projectFiles = (filesData.files || []).filter((f: { content: string }) => f.content);
      } catch {}
    }

    const catLabel = categories.find(c => c.id === cat)?.label || cat;
    try {
      const res = await fetch('/api/suggest-topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getApiHeaders(selectedApi),
          'X-API-Provider': selectedApi,
        },
        body: JSON.stringify({
          category: cat,
          categoryLabel: catLabel,
          pastTopics,
          projectName: activeProject?.name,
          projectDescription: activeProject?.description,
          projectFiles,
          inputTopic: inputTopic || '',
          subKeyword: selectedSubKeyword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setTopicFetchError(data.error || `오류 (${res.status})`);
      } else {
        const newTopics = data.topics || [];
        setTopicSuggestions(newTopics);
        // 새로 fetch했으므로 usedTopics 초기화 + sessionStorage 저장
        setUsedTopics([]);
        writeSuggestCache(newTopics, [], cat);
        if (!newTopics.length) setTopicFetchError('추천 주제를 가져오지 못했습니다.');
      }
    } catch (e) {
      setTopicFetchError(e instanceof Error ? e.message : '네트워크 오류');
    }
    setLoadingTopics(false);
  };

  // 주제 선택/변경 시 키워드 추천 + 자동 선택
  const fetchKeywordSuggestions = async (topicValue: string) => {
    if (!topicValue.trim() || !selectedCategory) return;
    setLoadingKeywords(true);
    setKeywordSuggestions([]);
    setSelectedKeywords([]);
    const catLabel = categories.find(c => c.id === selectedCategory)?.label || selectedCategory;
    try {
      const res = await fetch('/api/suggest-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getApiHeaders(selectedApi),
          'X-API-Provider': selectedApi,
        },
        body: JSON.stringify({ topic: topicValue, category: selectedCategory, categoryLabel: catLabel }),
      });
      const data = await res.json();
      const keywords = data.keywords || [];
      setKeywordSuggestions(keywords);

      // 자동으로 상위 2-3개 키워드 선택
      if (keywords.length > 0) {
        const autoSelectedCount = Math.min(3, keywords.length); // 최대 3개
        const autoSelected = keywords.slice(0, autoSelectedCount);
        setSelectedKeywords(autoSelected);
        setTargetKeyword(autoSelected.join(', '));
      }
    } catch {}
    setLoadingKeywords(false);
  };

  const handleTopicSuggestionClick = (suggestion: string) => {
    setTopic(suggestion);
    setShowTopicDropdown(false);
    fetchKeywordSuggestions(suggestion);
  };

  const toggleKeyword = (kw: string) => {
    setSelectedKeywords(prev => {
      const next = prev.includes(kw) ? prev.filter(k => k !== kw) : [...prev, kw];
      setTargetKeyword(next.join(', '));
      return next;
    });
  };

  const addCustomKeyword = () => {
    const kw = customKeyword.trim();
    if (!kw) return;
    setSelectedKeywords(prev => {
      if (prev.includes(kw)) return prev;
      const next = [...prev, kw];
      setTargetKeyword(next.join(', '));
      return next;
    });
    setCustomKeyword('');
  };

  // 프로필 목록 외부 클릭 시 닫기
  useEffect(() => {
    if (!showProfileList) return;
    const handler = (e: MouseEvent) => {
      if (profileListRef.current && !profileListRef.current.contains(e.target as Node)) {
        setShowProfileList(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showProfileList]);

  const saveAsProfile = async () => {
    const name = businessInfo.companyName.trim() || '이름 없음';
    const { newStrength, ...dataToSave } = businessInfo;
    await saveProfile(name, dataToSave as ProfileData);
    const updated = await getProfiles();
    setSavedProfiles(updated);
    setProfileSaveMsg(`"${name}" 저장 완료`);
    setTimeout(() => setProfileSaveMsg(''), 2000);
  };

  const loadProfile = (profile: Profile) => {
    setBusinessInfo({ ...profile.data, newStrength: '' });
    autoSave({ ...profile.data, newStrength: '' });
    setShowProfileList(false);
  };

  const handleDeleteProfile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteProfileSupabase(id);
    const updated = await getProfiles();
    setSavedProfiles(updated);
  };

  // 변경 시 자동 저장 표시 (디바운스)
  const autoSave = useCallback((_info: typeof businessInfo) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setBizSaved(true);
      setTimeout(() => setBizSaved(false), 2000);
    }, 1000);
  }, []);

  const saveBusinessInfo = () => {
    // Supabase 프로필로 저장은 saveAsProfile에서 처리
  };

  const updateBiz = (field: string, value: string) => {
    setBusinessInfo(prev => {
      const next = { ...prev, [field]: value };
      autoSave(next);
      return next;
    });
  };

  const addStrength = () => {
    const val = businessInfo.newStrength.trim();
    if (val && businessInfo.strengths.length < 5 && !businessInfo.strengths.includes(val)) {
      setBusinessInfo(prev => {
        const next = { ...prev, strengths: [...prev.strengths, val], newStrength: '' };
        autoSave(next);
        return next;
      });
    }
  };

  const removeStrength = (index: number) => {
    setBusinessInfo(prev => {
      const next = { ...prev, strengths: prev.strengths.filter((_, i) => i !== index) };
      autoSave(next);
      return next;
    });
  };

  const industries = [
    { value: '음식/요식업', label: '🍽️ 음식/요식업' },
    { value: '소매/유통', label: '🏪 소매/유통' },
    { value: '뷰티/미용', label: '💅 뷰티/미용' },
    { value: '헬스/피트니스', label: '🏋️ 헬스/피트니스' },
    { value: '교육/학원', label: '🎓 교육/학원' },
    { value: 'IT/테크', label: '💻 IT/테크' },
    { value: '의료/건강', label: '🏥 의료/건강' },
    { value: '금융/보험', label: '💰 금융/보험' },
    { value: '부동산', label: '🏠 부동산' },
    { value: '여행/관광/숙박', label: '✈️ 여행/관광/숙박' },
    { value: '법률/컨설팅', label: '⚖️ 법률/컨설팅' },
    { value: '기타', label: '📦 기타' },
  ];

  const [fileUploading, setFileUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileErrors, setFileErrors] = useState<string[]>([]);

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  const MAX_FILE_COUNT = 5;

  const processFiles = async (files: File[]) => {
    setFileUploading(true);
    setFileErrors([]);
    const newFiles: { name: string; content: string }[] = [];
    const errors: string[] = [];
    const remainingSlots = MAX_FILE_COUNT - referenceFiles.length;
    if (remainingSlots <= 0) {
      setFileErrors([`최대 ${MAX_FILE_COUNT}개까지만 업로드할 수 있습니다.`]);
      setFileUploading(false);
      return;
    }
    const filesToProcess = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      errors.push(`${files.length - remainingSlots}개 파일 건너뜀 (최대 ${MAX_FILE_COUNT}개 제한)`);
    }
    for (const file of filesToProcess) {
      try {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const supportedExts = ['txt', 'md', 'csv', 'json', 'html', 'xml', 'log', 'pdf', 'docx', 'pptx', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
        if (!supportedExts.includes(ext)) {
          errors.push(`${file.name}: 지원하지 않는 파일 형식 (.${ext})`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`${file.name}: 파일 크기 초과 (${(file.size / 1024 / 1024).toFixed(1)}MB, 최대 20MB)`);
          continue;
        }
        const textExts = ['txt', 'md', 'csv', 'json', 'html', 'xml', 'log'];
        if (textExts.includes(ext)) {
          const text = await file.text();
          newFiles.push({ name: file.name, content: text.substring(0, 15000) });
        } else {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/parse-file', { method: 'POST', body: formData });
          if (res.ok) {
            const data = await res.json();
            if (data.text) {
              newFiles.push({ name: data.fileName || file.name, content: data.text });
            } else {
              errors.push(`${file.name}: 텍스트를 추출할 수 없습니다`);
            }
          } else {
            const errData = await res.json().catch(() => ({}));
            errors.push(`${file.name}: ${errData.error || '파일 처리 실패'}`);
          }
        }
      } catch {
        errors.push(`${file.name}: 파일 처리 중 오류 발생`);
      }
    }
    setReferenceFiles(prev => [...prev, ...newFiles]);
    if (errors.length > 0) setFileErrors(errors);
    setFileUploading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    await processFiles(Array.from(files));
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const removeFile = (index: number) => {
    setReferenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const buildAdditionalNotes = () => {
    const parts: string[] = [];
    if (additionalNotes.trim()) parts.push(`[사용자 요구사항]\n${additionalNotes.trim()}`);
    // 업로드된 참조 파일을 RAG 컨텍스트로 포함
    if (referenceFiles.length > 0) {
      const refParts = referenceFiles.map(f =>
        `--- 참조자료: ${f.name} ---\n${f.content}\n--- 끝 ---`
      ).join('\n\n');
      parts.push(`[참조 자료 - 아래 자료의 정보, 수치, 사실, 표현을 적극 활용하여 콘텐츠를 작성하세요]\n${refParts}`);
    }
    const biz = businessInfo;
    const bizParts: string[] = [];
    if (biz.companyName) bizParts.push(`회사명: ${biz.companyName}`);
    if (biz.brandName) bizParts.push(`브랜드명: ${biz.brandName}`);
    const ind = biz.industry === '기타' ? biz.customIndustry : biz.industry;
    if (ind) bizParts.push(`산업 분야: ${ind}`);
    if (biz.mainProduct) bizParts.push(`주요 제품/서비스: ${biz.mainProduct}`);
    if (biz.productDescription) bizParts.push(`제품 설명: ${biz.productDescription}`);
    if (biz.priceRange) bizParts.push(`가격대: ${biz.priceRange}`);
    if (biz.mainBenefit) bizParts.push(`주요 혜택: ${biz.mainBenefit}`);
    if (biz.targetAudience) bizParts.push(`타겟 고객: ${biz.targetAudience}`);
    if (biz.customerNeeds) bizParts.push(`고객 니즈: ${biz.customerNeeds}`);
    if (biz.strengths.length > 0) bizParts.push(`강점: ${biz.strengths.join(', ')}`);
    if (biz.uniquePoint) bizParts.push(`차별점: ${biz.uniquePoint}`);
    if (biz.location) bizParts.push(`위치: ${biz.location}`);
    if (biz.website) bizParts.push(`웹사이트: ${biz.website}`);
    if (bizParts.length > 0) parts.push(`[비즈니스 정보]\n${bizParts.join('\n')}`);
    return parts.length > 0 ? parts.join('\n\n') : undefined;
  };

  // ==================== CEP 패널 자동 펼침 (분대 Quebec) ====================
  // 카테고리 선택 시 자동 모드라면 패널 펼쳐서 자동 도출이 진행되는 것을 사용자에게 노출
  useEffect(() => {
    if (selectedCategory && cepAutoMode && !sceneSentence) {
      setCepOpen(true);
    }
  }, [selectedCategory, cepAutoMode, sceneSentence]);

  // ==================== CEP 자동 도출 (분대 Oscar) ====================
  // topic 또는 targetKeyword 입력 시 1.0초 debounce 후 cluster-search → translate-scene 자동 실행
  useEffect(() => {
    if (!cepAutoMode) return;
    if (!selectedCategory) return;
    // 이미 sceneSentence가 있으면 (사용자 직접 입력 또는 이전 자동 결과) 재실행 방지
    if (sceneSentence) return;
    // 시드 후보: topic > targetKeyword > selectedSubKeyword (분대 Quebec — 폴백 강화)
    const seedSource = (topic.trim() || targetKeyword.trim() || selectedSubKeyword || '').slice(0, 50);
    if (seedSource.length < 3) return;

    const timer = setTimeout(async () => {
      if (cepAutoStatus !== 'idle') return; // 진행 중이면 스킵
      setCepAutoStatus('searching');
      setCepError(null);
      try {
        // Step 1: cluster-search
        const r1 = await fetch('/api/cep/cluster-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(geminiApiKey ? { 'X-Gemini-Key': geminiApiKey } : {}) },
          body: JSON.stringify({
            seedKeyword: seedSource,
            industry: businessInfo.industry || businessInfo.customIndustry,
            businessContext: businessInfo.companyName || '',
          }),
        });
        const d1 = await r1.json();
        if (!r1.ok) throw new Error(d1.error || 'cluster search failed');
        const clusters = d1.clusters || [];
        const lifeLangs = d1.lifeLanguages || [];
        setCepClusters(clusters);
        setCepLifeLanguages(lifeLangs);
        setCepSeed(seedSource);

        if (clusters.length === 0) {
          setCepAutoStatus('failed');
          return;
        }

        // Step 2: 첫 클러스터 자동 선택 + translate-scene
        setCepSelectedCluster(0);
        setCepAutoStatus('translating');
        const r2 = await fetch('/api/cep/translate-scene', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(geminiApiKey ? { 'X-Gemini-Key': geminiApiKey } : {}) },
          body: JSON.stringify({
            cluster: clusters[0],
            industry: businessInfo.industry || businessInfo.customIndustry,
            businessContext: businessInfo.companyName,
          }),
        });
        const d2 = await r2.json();
        if (!r2.ok) throw new Error(d2.error || 'scene translate failed');
        setSceneSentence(d2.sceneSentence || '');
        setCepTask(d2.task || '');
        setCepHooks(d2.contentHooks || []);
        setCepAutoStatus('done');
      } catch (e) {
        setCepAutoStatus('failed');
        setCepError(e instanceof Error ? e.message : 'CEP 자동 도출 실패');
      }
    }, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, targetKeyword, selectedSubKeyword, selectedCategory, cepAutoMode, sceneSentence, geminiApiKey]);

  // ==================== CEP(Category Entry Point) 핸들러 ====================
  const handleCepClusterSearch = async () => {
    if (!cepSeed.trim()) { setCepError('시드 키워드를 입력하세요'); return; }
    safeTrack('cep_seed_submit', { seed_length: cepSeed.length, has_industry: !!businessInfo.industry });
    setCepLoading('cluster'); setCepError(null);
    try {
      const r = await fetch('/api/cep/cluster-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(geminiApiKey ? { 'X-Gemini-Key': geminiApiKey } : {}) },
        body: JSON.stringify({
          seedKeyword: cepSeed,
          industry: businessInfo.industry || businessInfo.customIndustry,
          businessContext: businessInfo.companyName ? `${businessInfo.companyName} - ${businessInfo.mainProduct || ''}` : '',
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'cluster search failed');
      setCepClusters(d.clusters || []);
      setCepLifeLanguages(d.lifeLanguages || []);
    } catch (e) { setCepError(e instanceof Error ? e.message : '클러스터 수집 실패'); }
    finally { setCepLoading('idle'); }
  };

  const handleCepTranslateScene = async (idx: number) => {
    const cluster = cepClusters[idx];
    if (!cluster) return;
    setCepSelectedCluster(idx);
    setCepLoading('scene'); setCepError(null);
    try {
      const r = await fetch('/api/cep/translate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(geminiApiKey ? { 'X-Gemini-Key': geminiApiKey } : {}) },
        body: JSON.stringify({
          cluster,
          industry: businessInfo.industry || businessInfo.customIndustry,
          businessContext: businessInfo.companyName,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'scene translate failed');
      setSceneSentence(d.sceneSentence || '');
      setCepTask(d.task || '');
      setCepHooks(d.contentHooks || []);
      safeTrack('cep_cluster_translate', {
        keywords_count: cluster.keywords.length,
        path_depth: cluster.searchPath?.length || 0,
      });
    } catch (e) { setCepError(e instanceof Error ? e.message : '장면 번역 실패'); }
    finally { setCepLoading('idle'); }
  };

  const handleCepScore = async () => {
    if (cepClusters.length === 0) return;
    setCepLoading('score'); setCepError(null);
    try {
      const candidates = cepClusters.map(c => ({ cepKeyword: c.clusterName, sceneSentence: c.intent, type: 'explicit' as const }));
      const r = await fetch('/api/cep/score-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(geminiApiKey ? { 'X-Gemini-Key': geminiApiKey } : {}) },
        body: JSON.stringify({
          candidates,
          businessContext: businessInfo.companyName ? `${businessInfo.companyName} - ${businessInfo.mainProduct || ''} - 강점:${(businessInfo.strengths || []).join(',')}` : '',
          ragSummary: '',
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'score failed');
      setCepCandidates(d.candidates || []);
      safeTrack('cep_score', { candidates_count: cepClusters.length });
    } catch (e) { setCepError(e instanceof Error ? e.message : '평가 실패'); }
    finally { setCepLoading('idle'); }
  };

  const handleGenerate = async () => {
    if (!selectedCategory || !topic.trim()) return;

    // 추천 주제 중 하나로 생성하면 사용 이력에 추가 (sessionStorage 동기화)
    try {
      const t = topic.trim();
      if (t && topicSuggestions.includes(t)) {
        updateUsedTopicInCache(t);
      }
    } catch {}

    // ==================== API 자동 선택 로직 ====================
    // 주의: API 키는 서버 환경 변수에서만 관리 (localStorage 사용 금지)
    // API 키는 서버 환경 변수에서 관리 — 클라이언트 검사 불필요
    const apiToUse = selectedApi || 'gemini';

    setIsGenerating(true);
    setError(null);
    setShowKeyRecovery(false);
    setToneProgress(0);

    try {
      // 사용량 체크 (커스텀 사용자 시스템: usage-summary API 사용)
      if (currentUser) {
        const usageRes = await fetch(`/api/usage-summary?user_id=${currentUser.id}`);
        if (usageRes.ok) {
          const usageData = await usageRes.json();
          const genItem = usageData.summary?.find((s: { feature: string; remaining: number; limit: number }) => s.feature === 'generate');
          if (genItem && genItem.limit !== -1 && genItem.remaining <= 0) {
            setError(`이번 달 콘텐츠 생성 사용 횟수(${genItem.limit}회)를 모두 소진했습니다. 요금제를 업그레이드하세요.`);
            setIsGenerating(false);
            return;
          }
        }
      }

      saveBusinessInfo();
      const notes = buildAdditionalNotes();

      // 선택된 프로젝트의 업체 정보 (+ 비즈니스 정보 fallback)
      let activeProjectInfo = selectedProject;
      if (!activeProjectInfo) {
        try {
          const stored = sessionStorage.getItem('geoaio_project');
          if (stored) activeProjectInfo = JSON.parse(stored);
        } catch {}
      }

      // 업체 정보가 없으면 비즈니스 정보에서 가져오기 (항상 포함되도록)
      if (!activeProjectInfo?.company_name && businessInfo?.industry) {
        activeProjectInfo = {
          ...(activeProjectInfo || {}),
          id: activeProjectInfo?.id || '',
          company_name: businessInfo.industry || '(회사명)',
          representative_name: businessInfo.mainProduct || '(원장/대표명)',
          region: businessInfo.targetAudience || '',
        } as UserProject;
      }

      // 프로젝트 RAG 파일 로드 (모든 프로젝트에 RAG 파일 존재)
      let projectFiles: { file_name: string; content: string }[] = [];
      const projectId = activeProjectInfo?.id || selectedProject?.id;
      if (projectId) {
        try {
          const filesRes = await fetch(`/api/user-projects/files?project_id=${projectId}`);
          const filesData = await filesRes.json();
          projectFiles = (filesData.files || []).filter((f: { content: string }) => f.content && f.content.length > 0);
          console.log(`[RAG] 프로젝트 파일 ${projectFiles.length}개 로드`);
        } catch (e) {
          console.error('[RAG] 파일 로드 실패:', e);
        }
      }

      // ── 멀티 에이전트 병렬 생성 ──
      // 마크다운 단순 생성이라 빠름 → 3개씩 병렬로 안전하게 처리
      safeTrack('content_generate', {
        cep_applied: !!sceneSentence,
        has_rag: projectFiles.length > 0,
        category: selectedCategory,
        tone_count: 10,
      });
      const AGENT_BATCH = 1; // 순차 처리 (Gemini 동시성 한계 완전 회피, 약 40~50초·100% 안정)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results: any[] = new Array(toneOptions.length).fill(null);

      const generateTone = async (t: typeof toneOptions[0], idx: number) => {
        // 단일 fetch 호출 — 재시도용 inner 함수
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fetchOnce = async (): Promise<{ ok: boolean; data: any; status: number }> => {
          try {
            const res = await fetch('/api/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-API-Provider': apiToUse },
              body: JSON.stringify({
                category: selectedCategory,
                topic: topic.trim(),
                targetKeyword: targetKeyword.trim() || undefined,
                subKeyword: selectedSubKeyword || undefined,
                tone: t.value,
                additionalNotes: notes,
                company_name: activeProjectInfo?.company_name || undefined,
                representative_name: activeProjectInfo?.representative_name || undefined,
                region: activeProjectInfo?.region || undefined,
                homepage_url: activeProjectInfo?.homepage_url || undefined,
                blog_url: activeProjectInfo?.blog_url || undefined,
                projectFiles: projectFiles.slice(0, 3).map(f => ({
                  file_name: f.file_name,
                  content: f.content.slice(0, 3000),
                })),
                // CEP(Category Entry Point) 발굴 데이터
                sceneSentence: sceneSentence || undefined,
                cepTask: cepTask || undefined,
                cepKeyword: cepClusters[cepSelectedCluster ?? -1]?.clusterName,
                searchPath: cepClusters[cepSelectedCluster ?? -1]?.searchPath,
                cepCluster: cepClusters[cepSelectedCluster ?? -1]?.keywords,
                lifeLanguages: cepLifeLanguages.length ? cepLifeLanguages : undefined,
              }),
            });
            const data = await res.json();
            return { ok: res.ok && !data.error, data, status: res.status };
          } catch {
            return { ok: false, data: null, status: 0 };
          }
        };

        // 1차 시도만 — 자동 재시도 제거 (사용자 요청: '성공한 것만 사용')
        const result = await fetchOnce();

        if (!result.ok) {
          console.log(`[generate] 톤 "${t.label}" 생성 실패 (HTTP ${result.status}) — 재시도 없이 ⚠️ 표시`);
          return { title: topic.trim(), content: `${t.label} 생성 실패: ${result.data?.error || result.status}`, hashtags: [], metadata: { wordCount: 0, estimatedReadTime: '', seoTips: [] }, toneName: t.label, toneValue: t.value };
        }
        return { ...result.data, toneName: t.label, toneValue: t.value };
      };

      // AGENT_BATCH 개씩 병렬 실행 (멀티 에이전트)
      for (let i = 0; i < toneOptions.length; i += AGENT_BATCH) {
        const agentGroup = toneOptions.slice(i, i + AGENT_BATCH);
        const agentResults = await Promise.all(
          agentGroup.map((t, j) => generateTone(t, i + j))
        );
        agentResults.forEach((r, j) => { results[i + j] = r; });
        setToneProgress(Math.min(i + AGENT_BATCH, toneOptions.length));
      }
      // 사용량 기록 (커스텀 사용자 시스템)
      if (currentUser) {
        fetch('/api/usage-count', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: currentUser.id, feature: 'generate' }),
        }).catch(() => {});
      }
      const now = new Date();
      const historyId = generateId();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      // 히스토리 저장 실패해도 redirect는 진행
      try {
        await saveHistoryItem({
          id: historyId, type: 'generation',
          title: results[0]?.title || topic.trim(),
          summary: `10가지 톤 버전 | ${topic.trim()}`,
          date: dateStr, category: selectedCategory || undefined,
          targetKeyword: targetKeyword.trim() || undefined,
          generateResult: results[0], topic: topic.trim(), tone: '10가지 톤', revisions: [],
        });
      } catch { /* 히스토리 저장 실패는 무시하고 계속 진행 */ }
      // 부분 실패도 결과 페이지로 redirect — 사용자가 ⚠️ 표시로 직접 확인
      // 정상 = content 200자+ (실패 메시지 '전문적 생성 실패' 등 거름)
      const validResults = results.filter(r => r.content && r.content.length > 200);
      if (validResults.length === 0) {
        console.warn('[generate] 모든 톤 부실 응답 — 결과 페이지에서 ⚠️ 처리 위해 redirect 강행');
        // throw 제거. results[0]을 mainResult로 사용 (사용자가 결과 페이지에서 상태 확인)
      }
      const mainResult = { ...(validResults[0] || results[0] || { title: topic.trim(), content: '', hashtags: [], metadata: { wordCount: 0, estimatedReadTime: '', seoTips: [] } }), abVersions: results };
      // 생성 즉시 sessionStorage로 전달 → 블로그 게시 시 DB 저장 (generate_results 불필요)
      const resultId = `session_${Date.now()}`;
      sessionStorage.setItem(`gr_${resultId}`, JSON.stringify({
        result: mainResult,
        category: selectedCategory,
        topic: topic.trim(),
        targetKeyword: targetKeyword.trim(),
        tone: '10가지 톤',
        historyId,
        project_id: selectedProject?.id,
      }));
      router.push(`/generate/result?id=${resultId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(msg);
      // API 키 관련 오류면 복구 패널 표시
      const isKeyError = msg.includes('API_KEY') || msg.includes('api key') || msg.includes('401')
        || msg.includes('유효하지 않') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')
        || msg.includes('할당량') || msg.includes('키가 필요');
      if (isKeyError) setShowKeyRecovery(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveRecoveryKey = async (andRetry = false) => {
    const key = recoveryKey.trim();
    if (!key) return;
    setRecoverySaving(true);
    try {
      localStorage.setItem('geoaio_gemini_key', key);
      setContextApiKey(key);
      await saveApiKey('gemini', key);
      await fetch('/api/set-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey: key }),
      }).catch(() => {});
      setRecoverySaved(true);
      setRecoveryKey('');
      setError(null);
      if (andRetry) {
        setShowKeyRecovery(false);
        setRecoverySaved(false);
        // 새 키가 context에 반영된 후 생성 재시도
        setTimeout(() => handleGenerate(), 100);
      }
    } finally {
      setRecoverySaving(false);
    }
  };

  // 하단 패널 초기 키 상태 확인
  useEffect(() => {
    try {
      if (localStorage.getItem('geoaio_gemini_key')) setInlineHasKey(true);
    } catch {}
    fetch('/api/set-api-key').then(r => r.json()).then(d => {
      if (d.hasGeminiKey) setInlineHasKey(true);
    }).catch(() => {});
  }, []);

  const handleSaveInlineKey = async (andGenerate = false) => {
    const key = inlineKey.trim();
    if (!key) return;
    setInlineSaving(true);
    setInlineStatus(null);
    try {
      localStorage.setItem('geoaio_gemini_key', key);
      setContextApiKey(key);
      await saveApiKey('gemini', key);
      await fetch('/api/set-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey: key }),
      }).catch(() => {});
      setInlineStatus({ type: 'success', msg: 'API 키가 저장되었습니다.' });
      setInlineKey('');
      setInlineHasKey(true);
      setError(null);
      setShowKeyRecovery(false);
      if (andGenerate) setTimeout(() => handleGenerate(), 100);
    } catch (e) {
      setInlineStatus({ type: 'error', msg: e instanceof Error ? e.message : '저장 실패' });
    } finally {
      setInlineSaving(false);
    }
  };

  const handleDeleteInlineKey = async () => {
    try { localStorage.removeItem('geoaio_gemini_key'); } catch {}
    setContextApiKey('');
    const { deleteApiKey } = await import('@/lib/supabase-storage');
    await deleteApiKey('gemini');
    setInlineHasKey(false);
    setInlineStatus({ type: 'success', msg: 'API 키가 삭제되었습니다.' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        showApiKeyButton
        onToggleApiKey={() => setShowApiKeyInput(!showApiKeyInput)}
        apiKeyOpen={showApiKeyInput}
      />
      <CategoryBanner />

      {/* API Key 입력 패널 */}
      <ApiKeyPanel visible={showApiKeyInput} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* 📚 저장된 추천 주제 (localStorage) — 항상 표시되는 고정 섹션 */}
        {savedTopicsCache && Array.isArray(savedTopicsCache.topics) && savedTopicsCache.topics.length > 0 && (
          <section className="bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 border-2 border-purple-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">📚</span>
                <h3 className="text-sm font-bold text-purple-900">저장된 추천 주제</h3>
                <span className="text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-semibold">
                  {savedTopicsCache.topics.length}개 ·{' '}
                  {(savedTopicsCache.usedTopics?.length || 0)}/{savedTopicsCache.topics.length} 사용
                </span>
                {savedTopicsCache.savedAt && (
                  <span className="text-[10px] text-purple-600">
                    (저장: {new Date(savedTopicsCache.savedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('저장된 추천 주제를 모두 삭제하시겠습니까?')) {
                    try { localStorage.removeItem(SUGGEST_CACHE_KEY); } catch {}
                    setSavedTopicsCache(null);
                    setTopicSuggestions([]);
                    setUsedTopics([]);
                  }
                }}
                className="text-[11px] text-rose-600 hover:text-rose-700 hover:underline"
                title="저장된 추천 주제 모두 삭제"
              >
                🗑️ 비우기
              </button>
            </div>
            <ul className="space-y-1.5">
              {savedTopicsCache.topics.map((t, i) => {
                const isUsed = (savedTopicsCache.usedTopics || []).includes(t);
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => {
                        setTopic(t);
                        // 카테고리·subKeyword도 함께 복원 (저장돼 있으면)
                        if (savedTopicsCache.category && !selectedCategory) {
                          setSelectedCategory(savedTopicsCache.category as ContentCategory);
                        }
                        if (savedTopicsCache.subKeyword && !selectedSubKeyword) {
                          setSelectedSubKeyword(savedTopicsCache.subKeyword);
                        }
                        // 추천 주제 dropdown 데이터도 동기화
                        setTopicSuggestions(savedTopicsCache.topics);
                        setUsedTopics(savedTopicsCache.usedTopics || []);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors border ${
                        isUsed
                          ? 'bg-rose-50/50 text-rose-400 border-rose-200 cursor-pointer hover:bg-rose-100'
                          : 'bg-white text-gray-800 border-purple-200 hover:bg-purple-100 hover:border-purple-400'
                      }`}
                      title={isUsed ? '이미 사용한 주제 (다시 사용 가능)' : '클릭하면 주제 입력란에 자동 입력'}
                    >
                      {isUsed && <span className="text-rose-600 mr-1.5 font-bold">✓</span>}
                      <span className={isUsed ? 'line-through decoration-rose-500 decoration-2' : ''}>{t}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-[11px] text-purple-600">
              💡 클릭하면 주제 입력란에 자동 입력 + 카테고리도 자동 선택됩니다. 빨간 줄 주제는 이미 사용한 주제예요.
            </p>
          </section>
        )}

        {/* 🎯 저장된 CEP 장면 발굴 (lifeLanguages + 장면 문장) — 항상 표시되는 고정 섹션 */}
        {savedCepCache && ((savedCepCache.lifeLanguages?.length || 0) > 0 || savedCepCache.sceneSentence) && (
          <section className="bg-gradient-to-br from-pink-50 via-rose-50 to-pink-50 border-2 border-rose-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <h3 className="text-sm font-bold text-rose-900">저장된 CEP 장면 발굴</h3>
                <span className="text-xs text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full font-semibold">
                  {(savedCepCache.lifeLanguages?.length || 0)}개 삶의 언어
                  {(savedCepCache.clusters?.length || 0) > 0 && ` · ${savedCepCache.clusters!.length}개 클러스터`}
                </span>
                {savedCepCache.savedAt && (
                  <span className="text-[10px] text-rose-600">
                    (저장: {new Date(savedCepCache.savedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('저장된 CEP 결과를 모두 삭제하시겠습니까?')) {
                    try { localStorage.removeItem(CEP_CACHE_KEY); } catch {}
                    setSavedCepCache(null);
                  }
                }}
                className="text-[11px] text-rose-600 hover:text-rose-700 hover:underline"
                title="저장된 CEP 결과 삭제"
              >
                🗑️ 비우기
              </button>
            </div>

            {savedCepCache.sceneSentence && (
              <div className="mb-3 p-3 bg-white border border-rose-200 rounded-lg">
                <p className="text-[11px] font-bold text-rose-700 mb-1">🎬 점유 장면 문장</p>
                <p className="text-sm text-gray-800 leading-relaxed">{savedCepCache.sceneSentence}</p>
              </div>
            )}

            {(savedCepCache.lifeLanguages?.length || 0) > 0 && (
              <div className="mb-2">
                <p className="text-[11px] font-bold text-rose-700 mb-1.5">📝 삶의 언어 5개 (카테고리 진입 직전 일상 표현)</p>
                <ul className="space-y-1.5">
                  {savedCepCache.lifeLanguages!.map((s, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => setTopic(s)}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg border bg-white text-gray-800 border-rose-200 hover:bg-rose-100 hover:border-rose-400 transition-colors"
                        title="클릭하면 주제 입력란에 자동 입력"
                      >
                        <span className="text-rose-500 mr-1.5">▸</span>
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(savedCepCache.clusters?.length || 0) > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {savedCepCache.clusters!.map((c, i) => (
                  <span key={i} className="text-[11px] bg-rose-100 text-rose-800 px-2 py-1 rounded-full border border-rose-200">
                    🧩 {c.clusterName}
                  </span>
                ))}
              </div>
            )}

            <p className="mt-3 text-[11px] text-rose-600">
              💡 삶의 언어를 클릭하면 주제 입력란에 자동 입력됩니다. 장면 문장은 콘텐츠 생성 시 자동 적용됩니다.
            </p>
          </section>
        )}

        {/* 히어로 */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white px-6 sm:px-10 py-8 flex items-center gap-6">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
              <circle cx="50" cy="50" r="80" stroke="white" strokeWidth="0.5" />
              <circle cx="350" cy="100" r="120" stroke="white" strokeWidth="0.5" />
            </svg>
          </div>
          <img src="/images/logo-geoaio.png" alt="GEOAIO" className="relative z-10 h-16 rounded-lg shadow-lg hidden sm:block" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-1">콘텐츠 생성</h2>
            <p className="text-sm text-white/80">GEO/AIO에 최적화된 고품질 콘텐츠를 자동 생성합니다</p>
          </div>
        </div>

        {/* 카테고리 선택 + 입력 폼 */}
        {(
          <>
            {/* 히어로 스텝 가이드 */}
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-4 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-50/40 via-indigo-50/40 to-purple-50/40 pointer-events-none" />
              <div className="relative flex items-center justify-center gap-0">
                {/* 1단계 */}
                <div className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300 ${showBusinessInfo ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-200 scale-105' : 'bg-teal-50 text-teal-700 border border-teal-200'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${showBusinessInfo ? 'bg-white/20 text-white' : 'bg-teal-200 text-teal-700'}`}>1</div>
                  <div className="text-left">
                    <p className={`text-xs font-bold ${showBusinessInfo ? 'text-white' : 'text-teal-500'}`}>STEP 1</p>
                    <p className="text-sm font-semibold whitespace-nowrap">비즈니스 정보 입력</p>
                  </div>
                  <svg className={`w-4 h-4 shrink-0 ${showBusinessInfo ? 'text-white' : 'text-teal-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>

                {/* 화살표 커넥터 */}
                <div className="flex items-center px-3">
                  <div className="w-12 h-0.5 bg-gradient-to-r from-teal-300 to-indigo-300" />
                  <svg className="w-5 h-5 text-indigo-400 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>

                {/* 2단계 */}
                <div className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300 ${selectedCategory ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-200 scale-105' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${selectedCategory ? 'bg-white/20 text-white' : 'bg-indigo-200 text-indigo-700'}`}>2</div>
                  <div className="text-left">
                    <p className={`text-xs font-bold ${selectedCategory ? 'text-white' : 'text-indigo-500'}`}>STEP 2</p>
                    <p className="text-sm font-semibold whitespace-nowrap">콘텐츠 유형 선택</p>
                  </div>
                  <svg className={`w-4 h-4 shrink-0 ${selectedCategory ? 'text-white' : 'text-indigo-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </div>

                {/* 화살표 커넥터 */}
                <div className="flex items-center px-3">
                  <div className="w-12 h-0.5 bg-gradient-to-r from-indigo-300 to-purple-300" />
                  <svg className="w-5 h-5 text-purple-400 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>

                {/* 3단계 */}
                <div className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300 ${isGenerating ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-200 scale-105 animate-pulse' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isGenerating ? 'bg-white/20 text-white' : 'bg-purple-200 text-purple-700'}`}>3</div>
                  <div className="text-left">
                    <p className={`text-xs font-bold ${isGenerating ? 'text-white' : 'text-purple-500'}`}>STEP 3</p>
                    <p className="text-sm font-semibold whitespace-nowrap">콘텐츠 생성</p>
                  </div>
                  <svg className={`w-4 h-4 shrink-0 ${isGenerating ? 'text-white' : 'text-purple-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 비즈니스 정보 입력 (접이식) */}
            <div className="bg-white rounded-2xl shadow-sm border border-teal-200 overflow-hidden">
              <button
                onClick={() => setShowBusinessInfo(!showBusinessInfo)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-teal-50 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      비즈니스 정보 입력
                      {bizSaved && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 animate-pulse">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          자동 저장됨
                        </span>
                      )}
                      {!bizSaved && businessInfo.companyName && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          저장된 정보 있음
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-gray-500">회사, 제품, 타겟 고객 정보를 입력하면 더 정확한 콘텐츠를 생성합니다</p>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showBusinessInfo ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showBusinessInfo && (
                <div className="px-4 pb-4 space-y-4 border-t border-teal-100 bg-gradient-to-b from-teal-50/30 to-white">
                  {/* 프로필 저장/불러오기 */}
                  <div className="pt-4 flex items-center justify-center gap-3 relative">
                    {/* 저장 정보 가져오기 */}
                    <div className="relative" ref={profileListRef}>
                      <button
                        type="button"
                        onClick={() => setShowProfileList(!showProfileList)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 border hover:shadow-lg hover:scale-105 ${
                          showProfileList
                            ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-indigo-300 shadow-md'
                            : 'bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        저장 정보 가져오기
                        {savedProfiles.length > 0 && (
                          <span className={`ml-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${showProfileList ? 'bg-white/30 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                            {savedProfiles.length}
                          </span>
                        )}
                      </button>

                      {/* 프로필 모달 */}
                      {showProfileList && (
                        <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center p-4" onClick={() => setShowProfileList(false)}>
                          <div ref={profileListRef} onClick={e => e.stopPropagation()} className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-indigo-200 overflow-hidden">
                            {/* 헤더 */}
                            <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-100 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-indigo-800">저장된 비즈니스 프로필</p>
                                  <p className="text-[10px] text-indigo-500">{savedProfiles.length}개 프로필 저장됨</p>
                                </div>
                              </div>
                              <button type="button" onClick={() => setShowProfileList(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>

                            {/* 본문 */}
                            {savedProfiles.length === 0 ? (
                              <div className="px-6 py-12 text-center">
                                <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <p className="text-sm font-medium text-gray-400">저장된 프로필이 없습니다</p>
                                <p className="text-xs text-gray-300 mt-1">&quot;현재 정보 저장&quot; 버튼으로 비즈니스 정보를 저장하세요</p>
                              </div>
                            ) : (
                              <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
                                {savedProfiles.map((profile) => (
                                  <div
                                    key={profile.id}
                                    className="px-6 py-4 hover:bg-indigo-50/50 transition-all duration-150 cursor-pointer group"
                                    onClick={() => loadProfile(profile)}
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      {/* 왼쪽: 프로필 정보 */}
                                      <div className="flex items-start gap-4 min-w-0 flex-1">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shrink-0 shadow-sm">
                                          <span className="text-white text-lg font-bold">{profile.name.charAt(0)}</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2 mb-1.5">
                                            <p className="text-sm font-bold text-gray-900">{profile.name}</p>
                                            {profile.data.brandName && (
                                              <span className="text-[10px] font-medium text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">{profile.data.brandName}</span>
                                            )}
                                            <span className="text-[10px] text-gray-400">{profile.savedAt}</span>
                                          </div>
                                          {/* 상세 정보 그리드 */}
                                          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                                            {profile.data.industry && (
                                              <p className="text-xs text-gray-500"><span className="font-medium text-gray-600">산업:</span> {profile.data.industry === '기타' ? profile.data.customIndustry : profile.data.industry}</p>
                                            )}
                                            {profile.data.mainProduct && (
                                              <p className="text-xs text-gray-500"><span className="font-medium text-gray-600">제품:</span> {profile.data.mainProduct}</p>
                                            )}
                                            {profile.data.targetAudience && (
                                              <p className="text-xs text-gray-500"><span className="font-medium text-gray-600">타겟:</span> {profile.data.targetAudience}</p>
                                            )}
                                            {profile.data.location && (
                                              <p className="text-xs text-gray-500"><span className="font-medium text-gray-600">위치:</span> {profile.data.location}</p>
                                            )}
                                          </div>
                                          {profile.data.strengths && profile.data.strengths.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                              {profile.data.strengths.map((s: string, si: number) => (
                                                <span key={si} className="text-[10px] font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">{s}</span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* 오른쪽: 액션 */}
                                      <div className="flex items-center gap-2 shrink-0 pt-1">
                                        <span className="text-xs text-indigo-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200">선택</span>
                                        <button
                                          type="button"
                                          onClick={(e) => handleDeleteProfile(profile.id, e)}
                                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 현재 정보 저장 */}
                    <button
                      type="button"
                      onClick={saveAsProfile}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 border bg-white text-teal-700 border-teal-300 hover:bg-teal-50 hover:shadow-lg hover:scale-105"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      현재 정보 저장
                    </button>

                    {/* 저장 완료 메시지 */}
                    {profileSaveMsg && (
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 whitespace-nowrap animate-pulse">
                        {profileSaveMsg}
                      </span>
                    )}
                  </div>

                  {/* 회사 정보 */}
                  <div className="pt-5 bg-white/80 rounded-xl p-4 border border-teal-100 shadow-sm">
                    <h3 className="text-sm font-semibold text-teal-800 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg text-center text-xs leading-6 font-bold text-white shadow-sm">1</span>
                      회사 정보
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input type="text" value={businessInfo.companyName} onChange={e => updateBiz('companyName', e.target.value)} placeholder="회사명 (예: ○○주식회사)" className="px-4 py-2.5 bg-teal-50/50 border border-teal-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent placeholder-teal-400/60" />
                      <input type="text" value={businessInfo.location} onChange={e => updateBiz('location', e.target.value)} placeholder="지역/위치 (예: 서울 강남구)" className="px-4 py-2.5 bg-teal-50/50 border border-teal-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent placeholder-teal-400/60" />
                    </div>
                    <input type="text" value={businessInfo.website} onChange={e => updateBiz('website', e.target.value)} placeholder="웹사이트/SNS (예: www.example.com)" className="mt-3 w-full px-4 py-2.5 bg-teal-50/50 border border-teal-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent placeholder-teal-400/60" />
                  </div>

                  {/* 브랜드 정보 */}
                  <div className="bg-white/80 rounded-xl p-4 border border-cyan-100 shadow-sm">
                    <h3 className="text-sm font-semibold text-cyan-800 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg text-center text-xs leading-6 font-bold text-white shadow-sm">✦</span>
                      브랜드 정보
                    </h3>
                    <input type="text" value={businessInfo.brandName} onChange={e => updateBiz('brandName', e.target.value)} placeholder="브랜드명 (예: 브랜드 이름, 서비스명)" className="w-full px-4 py-2.5 bg-cyan-50/50 border border-cyan-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent placeholder-cyan-400/60" />
                  </div>

                  {/* 산업 분야 */}
                  <div className="bg-white/80 rounded-xl p-4 border border-amber-100 shadow-sm">
                    <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg text-center text-xs leading-6 font-bold text-white shadow-sm">2</span>
                      🏭 산업 분야 선택
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                      {industries.map(ind => {
                        const emoji = ind.label.split(' ')[0];
                        const text = ind.label.split(' ').slice(1).join(' ');
                        return (
                          <button
                            key={ind.value}
                            type="button"
                            onClick={() => updateBiz('industry', ind.value)}
                            className={`flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-xl border transition-all duration-200 hover:shadow-md hover:scale-105 ${
                              businessInfo.industry === ind.value
                                ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white border-amber-300 shadow-md'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-amber-400 hover:bg-amber-50/50'
                            }`}
                          >
                            <span className="text-2xl">{emoji}</span>
                            <span className="text-[11px] font-semibold leading-tight text-center">{text}</span>
                          </button>
                        );
                      })}
                    </div>
                    {businessInfo.industry === '기타' && (
                      <input type="text" value={businessInfo.customIndustry} onChange={e => updateBiz('customIndustry', e.target.value)} placeholder="산업 분야를 직접 입력" className="mt-3 w-full px-4 py-2.5 bg-amber-50/50 border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent placeholder-amber-400/60" />
                    )}
                  </div>

                  {/* 제품/서비스 정보 */}
                  <div className="bg-white/80 rounded-xl p-4 border border-sky-100 shadow-sm">
                    <h3 className="text-sm font-semibold text-sky-800 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg text-center text-xs leading-6 font-bold text-white shadow-sm">3</span>
                      제품/서비스 정보
                    </h3>
                    <input type="text" value={businessInfo.mainProduct} onChange={e => updateBiz('mainProduct', e.target.value)} placeholder="주요 제품/서비스 (예: 프리미엄 커피, 영어 회화 수업)" className="w-full px-4 py-2.5 bg-sky-50/50 border border-sky-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent placeholder-sky-400/60" />
                    <textarea value={businessInfo.productDescription} onChange={e => updateBiz('productDescription', e.target.value)} placeholder="제품/서비스 상세 설명 (특징, 장점, 차별점)" rows={2} className="mt-3 w-full px-4 py-2.5 bg-sky-50/50 border border-sky-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent resize-none placeholder-sky-400/60" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      <input type="text" value={businessInfo.priceRange} onChange={e => updateBiz('priceRange', e.target.value)} placeholder="가격대 (예: 5,000원~15,000원)" className="px-4 py-2.5 bg-sky-50/50 border border-sky-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent placeholder-sky-400/60" />
                      <input type="text" value={businessInfo.mainBenefit} onChange={e => updateBiz('mainBenefit', e.target.value)} placeholder="주요 혜택 (예: 30% 할인, 무료 배송)" className="px-4 py-2.5 bg-sky-50/50 border border-sky-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent placeholder-sky-400/60" />
                    </div>
                  </div>

                  {/* 타겟 고객 */}
                  <div className="bg-white/80 rounded-xl p-4 border border-violet-100 shadow-sm">
                    <h3 className="text-sm font-semibold text-violet-800 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg text-center text-xs leading-6 font-bold text-white shadow-sm">4</span>
                      타겟 고객
                    </h3>
                    <input type="text" value={businessInfo.targetAudience} onChange={e => updateBiz('targetAudience', e.target.value)} placeholder="주요 타겟 고객층 (예: 20-30대 직장인)" className="w-full px-4 py-2.5 bg-violet-50/50 border border-violet-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent placeholder-violet-400/60" />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {['10대 청소년', '20대 대학생', '20-30대 직장인', '30-40대 주부', '40-50대 중년층', '시니어'].map(t => (
                        <button key={t} type="button" onClick={() => updateBiz('targetAudience', businessInfo.targetAudience ? `${businessInfo.targetAudience}, ${t}` : t)}
                          className="px-2.5 py-1 text-xs bg-violet-50 text-violet-600 rounded-lg border border-violet-200 hover:bg-violet-100 hover:border-violet-400 hover:scale-105 transition-all duration-200"
                        >{t}</button>
                      ))}
                    </div>
                    <textarea value={businessInfo.customerNeeds} onChange={e => updateBiz('customerNeeds', e.target.value)} placeholder="고객의 주요 고민/니즈" rows={2} className="mt-3 w-full px-4 py-2.5 bg-violet-50/50 border border-violet-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none placeholder-violet-400/60" />
                  </div>

                  {/* 강점 및 차별점 */}
                  <div className="bg-white/80 rounded-xl p-4 border border-rose-100 shadow-sm">
                    <h3 className="text-sm font-semibold text-rose-800 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg text-center text-xs leading-6 font-bold text-white shadow-sm">5</span>
                      강점 및 차별점
                    </h3>
                    {businessInfo.strengths.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {businessInfo.strengths.map((s, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs rounded-full shadow-sm">
                            {s}
                            <button type="button" onClick={() => removeStrength(i)} className="hover:text-rose-200 transition-colors">x</button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input type="text" value={businessInfo.newStrength} onChange={e => updateBiz('newStrength', e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addStrength())} placeholder="강점 입력 (최대 5개)" className="flex-1 px-4 py-2.5 bg-rose-50/50 border border-rose-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent placeholder-rose-400/60" />
                      <button type="button" onClick={addStrength} className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-medium rounded-xl hover:from-rose-600 hover:to-pink-700 hover:shadow-md hover:scale-105 transition-all duration-200 border border-rose-300 shadow-sm">추가</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {['합리적인 가격', '전문가 상담', '풍부한 경험', '빠른 서비스', '고품질', '친절한 응대'].map(s => (
                        <button key={s} type="button" onClick={() => { if (businessInfo.strengths.length < 5 && !businessInfo.strengths.includes(s)) setBusinessInfo(prev => { const next = { ...prev, strengths: [...prev.strengths, s] }; autoSave(next); return next; }); }}
                          className="px-2.5 py-1 text-xs bg-rose-50 text-rose-600 rounded-lg border border-rose-200 hover:bg-rose-100 hover:border-rose-400 hover:scale-105 transition-all duration-200"
                        >{s}</button>
                      ))}
                    </div>
                    <textarea value={businessInfo.uniquePoint} onChange={e => updateBiz('uniquePoint', e.target.value)} placeholder="경쟁사 대비 차별점" rows={2} className="mt-3 w-full px-4 py-2.5 bg-rose-50/50 border border-rose-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent resize-none placeholder-rose-400/60" />
                  </div>

                  {/* 하단 현재 정보 저장 버튼 */}
                  <div className="flex justify-center relative">
                    <button
                      type="button"
                      onClick={saveAsProfile}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 border bg-white text-teal-700 border-teal-300 hover:bg-teal-50 hover:shadow-lg hover:scale-105"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      현재 정보 저장
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 선택된 프로젝트 표시 */}
            {selectedProject ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-pink-50 border border-pink-200 rounded-xl">
                <div className="w-7 h-7 bg-pink-500 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#FF69B4] font-bold">선택된 프로젝트</p>
                  <p className="text-[15px] font-semibold text-pink-900 truncate">{selectedProject.name}</p>
                </div>
                <Link href="/user-dashboard" className="text-xs text-pink-500 hover:text-pink-700 hover:underline shrink-0">변경</Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="w-7 h-7 bg-amber-400 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-amber-600 font-bold">프로젝트 미선택</p>
                  <p className="text-[13px] text-amber-800">프로젝트를 선택하면 맞춤 콘텐츠를 생성할 수 있습니다</p>
                </div>
                <Link href="/user-dashboard" className="shrink-0 px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-all">
                  프로젝트 선택/추가
                </Link>
              </div>
            )}

            {/* 카테고리 선택 */}
            <div className="bg-white rounded-xl shadow-sm border border-indigo-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">콘텐츠 유형 선택</h2>
              <p className="text-sm text-gray-500 mb-3">생성할 콘텐츠의 유형을 선택하세요</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        // 카테고리 카드 클릭 시 항상 리셋 (같은 카테고리 다시 클릭해도 새 시작 보장)
                        // 추천 주제 리셋
                        setTopicSuggestions([]);
                        setUsedTopics([]);
                        setSavedTopicsCache(null);
                        setTopic('');
                        setTargetKeyword('');
                        setSelectedSubKeyword('');
                        // CEP 위저드 결과 리셋
                        setCepClusters([]);
                        setCepLifeLanguages([]);
                        setCepSelectedCluster(null);
                        setSceneSentence('');
                        setCepTask('');
                        setCepHooks([]);
                        setCepCandidates([]);
                        setCepSeed('');
                        setSavedCepCache(null);
                        setCepAutoStatus('idle');
                        // localStorage cache 모두 삭제
                        try {
                          localStorage.removeItem(SUGGEST_CACHE_KEY);
                          localStorage.removeItem(CEP_CACHE_KEY);
                        } catch {}
                        console.log(`[reset] "${cat.label}" 카드 클릭 — CEP·추천 주제 모두 리셋`);
                        setSelectedCategory(cat.id);
                      }}
                      className={`relative p-3 rounded-xl text-left transition-all duration-200 border ${
                        isSelected
                          ? `bg-gradient-to-br ${cat.color} text-white shadow-lg`
                          : `${cat.bgIdle} hover:shadow-md`
                      }`}
                    >
                      <svg
                        className={`w-6 h-6 mb-2 ${isSelected ? 'text-white' : 'text-gray-500'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cat.icon} />
                      </svg>
                      <p className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {cat.label}
                      </p>
                      <p className={`text-xs mt-0.5 ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                        {cat.description}
                      </p>
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI API 선택 섹션 - 카테고리 선택과 무관하게 항상 표시 */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">🤖 AI 선택</span>
                <span className="text-xs font-bold text-emerald-600">{availableApis.length > 0 ? `${availableApis.length}개 활성` : '자동 선택'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedApi('gemini')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedApi === 'gemini'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  🌐 Gemini
                </button>
                <button
                  disabled
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed opacity-50"
                  title="Claude는 현재 사용 불가"
                >
                  🧠 Claude
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                💡 Gemini로 생성합니다. 실패 시 Claude로 자동 재시도됩니다.
              </p>
            </div>

            {/* CEP(Category Entry Point) 발굴 위저드 */}
            {selectedCategory && (
              <div
                className={`bg-gradient-to-br from-purple-50 via-indigo-50 to-violet-50 rounded-xl shadow-sm border border-purple-200 p-5 transition-all duration-300 ${
                  cepAutoStatus === 'searching' || cepAutoStatus === 'translating'
                    ? 'ring-2 ring-purple-400 ring-offset-2 shadow-lg'
                    : cepAutoStatus === 'done'
                    ? 'ring-2 ring-emerald-300 ring-offset-2'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCepOpen(o => {
                      const next = !o;
                      if (next) safeTrack('cep_wizard_open', { industry: businessInfo.industry || null });
                      return next;
                    })}
                    className="flex-1 flex items-center justify-between text-left"
                  >
                    <div>
                      <h2 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
                        🎯 CEP 장면 발굴
                        <span className="text-xs font-normal px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">선택</span>
                      </h2>
                      <p className="text-xs text-purple-700/80 mt-1">
                        Category Entry Point — 시드 키워드에서 &lsquo;장면 문장&rsquo;을 만들어 콘텐츠 점유 포인트를 강화합니다
                      </p>
                    </div>
                    <svg
                      className={`w-5 h-5 text-purple-600 transition-transform ${cepOpen ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {/* 자동 도출 배지 + 토글 (분대 Oscar) */}
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {sceneSentence && cepAutoStatus === 'done' && (
                      <span className="text-sm px-2.5 py-1 bg-purple-200 text-purple-800 rounded-full font-bold shadow-sm">
                        ✨ 자동 도출 완료
                      </span>
                    )}
                    {cepAutoStatus === 'searching' && (
                      <span className="text-sm px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold animate-pulse">🔍 클러스터 분석 중...</span>
                    )}
                    {cepAutoStatus === 'translating' && (
                      <span className="text-sm px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold animate-pulse">🎬 장면 번역 중...</span>
                    )}
                    {cepAutoStatus === 'failed' && (
                      <span className="text-sm px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full font-semibold">⚠️ 자동 도출 실패 — 수동 사용</span>
                    )}
                    <label className="flex items-center gap-1 text-xs text-purple-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={cepAutoMode}
                        onChange={(e) => setCepAutoMode(e.target.checked)}
                        className="w-3 h-3"
                      />
                      자동
                    </label>
                  </div>
                </div>

                {cepOpen && (
                  <div className="mt-4 space-y-4">
                    {/* 자동 모드 안내 박스 (분대 Quebec) */}
                    {cepAutoMode && !sceneSentence && cepAutoStatus === 'idle' && (
                      <div className="px-3 py-2 bg-purple-100 border border-purple-200 rounded-lg text-xs text-purple-800">
                        ✨ <strong>자동 모드</strong> — 아래 주제 입력란에 글자를 쓰면 1초 후 자동으로 장면을 도출합니다. 시드 키워드를 직접 입력할 필요 없습니다.
                      </div>
                    )}
                    {/* 1) 시드 키워드 입력 + 클러스터 발견 */}
                    <div>
                      <label className="block text-sm font-medium text-purple-900 mb-1.5">시드 키워드</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={cepSeed}
                          onChange={(e) => setCepSeed(e.target.value)}
                          placeholder="예: 임플란트, 홈트레이닝, AI 마케팅"
                          className="flex-1 px-3 py-2.5 border border-purple-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-400"
                        />
                        <button
                          type="button"
                          onClick={handleCepClusterSearch}
                          disabled={cepLoading === 'cluster' || !cepSeed.trim()}
                          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                          {cepLoading === 'cluster' ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                              수집 중...
                            </>
                          ) : '클러스터 발견'}
                        </button>
                      </div>
                    </div>

                    {/* 에러 */}
                    {cepError && (
                      <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {cepError}
                      </div>
                    )}

                    {/* 2) 삶의 언어 칩 */}
                    {cepLifeLanguages.length > 0 && (
                      <div>
                        <label className="block text-xs font-semibold text-purple-800 mb-1.5">💬 삶의 언어 (클릭하면 주제에 추가)</label>
                        <div className="flex flex-wrap gap-1.5">
                          {cepLifeLanguages.map((lang, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setTopic(t => t ? t + ' / ' + lang : lang)}
                              className="px-2.5 py-1 text-xs bg-white border border-purple-300 text-purple-700 rounded-full hover:bg-purple-100 transition-colors"
                            >
                              + {lang}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3) 클러스터 카드 리스트 */}
                    {cepClusters.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-purple-800">🧩 클러스터 ({cepClusters.length}개)</label>
                          <button
                            type="button"
                            onClick={handleCepScore}
                            disabled={cepLoading === 'score'}
                            className="text-xs px-3 py-1.5 bg-indigo-100 text-indigo-700 border border-indigo-300 rounded-lg hover:bg-indigo-200 disabled:opacity-50 flex items-center gap-1"
                          >
                            {cepLoading === 'score' ? (
                              <>
                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                평가 중...
                              </>
                            ) : '⚖ 후보 평가'}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {cepClusters.map((c, idx) => {
                            const selected = cepSelectedCluster === idx;
                            return (
                              <div
                                key={idx}
                                className={`rounded-lg border p-3 transition-all ${
                                  selected
                                    ? 'bg-purple-600 border-purple-700 text-white shadow-md'
                                    : 'bg-white border-purple-200 hover:border-purple-400'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <h3 className={`text-sm font-bold ${selected ? 'text-white' : 'text-purple-900'}`}>
                                    {c.clusterName}
                                  </h3>
                                  <button
                                    type="button"
                                    onClick={() => handleCepTranslateScene(idx)}
                                    disabled={cepLoading === 'scene'}
                                    className={`text-xs px-2 py-1 rounded-md whitespace-nowrap font-semibold transition-colors ${
                                      selected
                                        ? 'bg-white text-purple-700 hover:bg-purple-50'
                                        : 'bg-purple-600 text-white hover:bg-purple-700'
                                    } disabled:opacity-50`}
                                  >
                                    {cepLoading === 'scene' && cepSelectedCluster === idx ? '번역 중…' : '장면 번역'}
                                  </button>
                                </div>

                                {/* keywords chips */}
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {(c.keywords || []).slice(0, 8).map((kw, ki) => (
                                    <span
                                      key={ki}
                                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                                        selected ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-700'
                                      }`}
                                    >
                                      {kw}
                                    </span>
                                  ))}
                                </div>

                                {/* searchPath */}
                                {c.searchPath && c.searchPath.length > 0 && (
                                  <div className={`text-[11px] mb-1.5 ${selected ? 'text-purple-100' : 'text-gray-600'}`}>
                                    {c.searchPath.map((s, si) => (
                                      <span key={si}>
                                        {si > 0 && <span className="mx-1">→</span>}
                                        <span className={selected ? 'underline' : 'underline decoration-purple-300'}>{s}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* intent */}
                                {c.intent && (
                                  <p className={`text-xs italic ${selected ? 'text-purple-50' : 'text-gray-500'}`}>
                                    “{c.intent}”
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 4) 후보 평가 점수표 */}
                    {cepCandidates.length > 0 && (
                      <div className="bg-white rounded-lg border border-indigo-200 p-3">
                        <h4 className="text-xs font-semibold text-indigo-800 mb-2">📊 후보 점수 (시장적합 / 브랜드적합 / 입증가능 / 합계)</h4>
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-indigo-600 border-b border-indigo-100 pb-1">
                            <div className="col-span-4">CEP 키워드</div>
                            <div className="col-span-1 text-center">시장</div>
                            <div className="col-span-1 text-center">브랜드</div>
                            <div className="col-span-1 text-center">입증</div>
                            <div className="col-span-1 text-center">합계</div>
                            <div className="col-span-4">추천</div>
                          </div>
                          {cepCandidates.map((cd, i) => (
                            <div key={i} className="grid grid-cols-12 gap-2 text-xs items-center py-1 border-b border-gray-50 last:border-0">
                              <div className="col-span-4 font-medium text-gray-800 truncate">{cd.cepKeyword}</div>
                              <div className="col-span-1 text-center text-purple-700">{cd.score?.marketFit ?? '-'}</div>
                              <div className="col-span-1 text-center text-purple-700">{cd.score?.brandFit ?? '-'}</div>
                              <div className="col-span-1 text-center text-purple-700">{cd.score?.provability ?? '-'}</div>
                              <div className="col-span-1 text-center font-bold text-indigo-700">{cd.score?.total ?? '-'}</div>
                              <div className="col-span-4 text-[11px] text-gray-600 truncate" title={cd.recommendation || ''}>
                                {cd.recommendation || '-'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 5) 장면 문장 / 작업 / 콘텐츠 후크 */}
                    <div className="bg-white rounded-lg border border-purple-200 p-3 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-purple-800 mb-1">🎬 장면 문장 (sceneSentence)</label>
                        <textarea
                          value={sceneSentence}
                          onChange={(e) => setSceneSentence(e.target.value)}
                          placeholder="예: 30대 직장인이 점심시간에 잇몸 통증으로 검색하는 순간"
                          rows={2}
                          className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-purple-800 mb-1">✅ 작업 (cepTask)</label>
                        <input
                          type="text"
                          value={cepTask}
                          onChange={(e) => setCepTask(e.target.value)}
                          placeholder="예: 통증을 빠르게 진단하고 가까운 치과 찾기"
                          className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-400"
                        />
                      </div>
                      {cepHooks.length > 0 && (
                        <div>
                          <label className="block text-xs font-semibold text-purple-800 mb-1">🪝 콘텐츠 후크</label>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 space-y-1">
                            {cepHooks.map((h, i) => (
                              <div key={i} className="text-xs text-gray-700 flex gap-1.5">
                                <span className="text-purple-500">·</span>
                                <span>{h}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 입력 폼 */}
            {selectedCategory && (
              <div className="bg-white rounded-xl shadow-sm border border-sky-200 p-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">콘텐츠 정보 입력</h2>
                <p className="text-sm text-gray-500 mb-3">
                  {categories.find(c => c.id === selectedCategory)?.label} 생성을 위한 정보를 입력하세요
                </p>

                <div className="space-y-3">
                  {/* 주제 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        주제 <span className="text-red-500">*</span>
                      </label>
                      {selectedCategory && (
                        <div className="flex flex-wrap gap-1.5 justify-end items-center">
                          {loadingSubKeywords && (
                            <span className="text-xs text-blue-500 flex items-center gap-1">
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                              분야 로딩 중...
                            </span>
                          )}
                          {(dynamicSubKeywords.length > 0 ? dynamicSubKeywords : subKeywordsByCategory[selectedCategory] || []).map((kw) => (
                            <button
                              key={kw}
                              onClick={() => setSelectedSubKeyword(selectedSubKeyword === kw ? '' : kw)}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all ${
                                selectedSubKeyword === kw
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {kw}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedSubKeyword && (
                      <p className="text-xs text-blue-600 mb-2 font-medium">
                        📌 선택됨: <strong>{selectedSubKeyword}</strong> (이것을 기반으로 주제가 추천됩니다)
                      </p>
                    )}
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      onBlur={(e) => { if (e.target.value.trim()) fetchKeywordSuggestions(e.target.value.trim()); }}
                      placeholder="예: 2024년 AI 마케팅 트렌드, 홈트레이닝 초보자 가이드"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-gray-400"
                    />
                    {/* AI 주제 추천 버튼 */}
                    <button
                      type="button"
                      onClick={() => {
                        if (showTopicDropdown) {
                          setShowTopicDropdown(false);
                        } else {
                          setShowTopicDropdown(true);
                          const currentTopic = topic.trim();
                          if (selectedCategory && !loadingTopics) {
                            // 주제가 입력된 경우: 항상 새로 추천 (입력 기반), 빈칸인 경우: 기존 방식
                            if (currentTopic || topicSuggestions.length === 0) {
                              fetchTopicSuggestions(selectedCategory, currentTopic || undefined);
                            }
                          }
                        }
                      }}
                      className={`mt-1.5 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        showTopicDropdown
                          ? selectedApi === 'claude'
                            ? 'bg-slate-600 text-white border-slate-600'
                            : 'bg-blue-600 text-white border-blue-600'
                          : selectedApi === 'claude'
                            ? 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                            : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {loadingTopics
                        ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                      }
                      {loadingTopics
                        ? 'AI 주제 생성 중...'
                        : showTopicDropdown
                          ? '주제 추천 닫기'
                          : `✨ ${selectedApi === 'claude' ? '🧠 Claude' : '🌐 Gemini'}로 주제 추천받기`
                      }
                    </button>

                    {/* 추천 주제 패널 (일반 흐름, absolute 아님) */}
                    {showTopicDropdown && (
                      <div className="mt-1 bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden">
                        {loadingTopics ? (
                          <div className="p-3 space-y-2">
                            {[1,2,3,4,5].map(i => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
                            <p className="text-xs text-center text-gray-400">AI가 주제를 생성하는 중...</p>
                          </div>
                        ) : topicFetchError ? (
                          <div className="p-3 text-center space-y-2">
                            <p className="text-xs text-red-500">{topicFetchError}</p>
                            <button type="button" onClick={() => selectedCategory && fetchTopicSuggestions(selectedCategory, topic.trim() || undefined)}
                              className="text-xs text-blue-500 hover:underline">다시 시도</button>
                          </div>
                        ) : topicSuggestions.length === 0 ? (
                          <div className="p-3 text-center space-y-2">
                            <p className="text-xs text-gray-400">AI가 주제를 불러오고 있습니다...</p>
                          </div>
                        ) : (
                          <ul className="py-1">
                            <li className={`px-3 py-1.5 text-xs font-semibold border-b flex items-center justify-between ${
                              selectedApi === 'claude'
                                ? 'text-slate-600 bg-slate-50 border-slate-100'
                                : 'text-blue-500 bg-blue-50 border-blue-100'
                            }`}>
                              <span>
                                ✨ {selectedApi === 'claude' ? '🧠 Claude' : '🌐 Gemini'} 추천 주제
                                {topicSuggestions.length > 0 && (
                                  <span className="ml-1 font-normal text-[11px] text-emerald-600">
                                    ({usedTopics.length}/{topicSuggestions.length} 사용)
                                  </span>
                                )}
                                <span className="ml-1 font-normal text-gray-400">— 클릭하면 입력됩니다</span>
                              </span>
                              <button type="button" onClick={() => selectedCategory && fetchTopicSuggestions(selectedCategory, topic.trim() || undefined)}
                                className={`transition-colors text-base ${
                                  selectedApi === 'claude'
                                    ? 'text-slate-400 hover:text-slate-600'
                                    : 'text-blue-400 hover:text-blue-600'
                                }`} title="새로 추천">↺</button>
                            </li>
                            {topicSuggestions.map((s, i) => {
                              const isUsed = usedTopics.includes(s);
                              return (
                                <li key={i}>
                                  <button
                                    type="button"
                                    onClick={() => handleTopicSuggestionClick(s)}
                                    className={`w-full text-left px-3 py-2.5 text-sm transition-colors border-b border-gray-50 last:border-0 ${
                                      isUsed
                                        ? 'bg-rose-50/40 text-gray-500 hover:bg-rose-50 hover:text-rose-700'
                                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                                    }`}
                                    title={isUsed ? '이미 이 주제로 콘텐츠를 생성한 적이 있어요. 다시 사용해도 됩니다.' : undefined}
                                  >
                                    {isUsed && <span className="text-rose-600 mr-1.5 font-bold">✓</span>}
                                    <span className={isUsed ? 'line-through decoration-rose-500 decoration-2' : ''}>{s}</span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 타겟 키워드 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">타겟 키워드 (선택)</label>

                    {/* 선택된 키워드 칩 + 입력창 */}
                    <div className={`flex flex-wrap gap-1.5 px-3 py-2 border border-gray-200 rounded-xl bg-white focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-transparent min-h-[48px] items-center ${loadingKeywords ? 'bg-gray-50' : ''}`}>
                      {loadingKeywords && (
                        <span className="text-xs text-indigo-500 flex items-center gap-1">
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                          키워드 추천 중...
                        </span>
                      )}
                      {selectedKeywords.map((kw, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 text-white text-xs rounded-full">
                          {kw}
                          <button type="button"
                            onClick={() => { setSelectedKeywords(p => { const n = p.filter(k => k !== kw); setTargetKeyword(n.join(', ')); return n; }); }}
                            className="hover:text-indigo-200 ml-0.5 leading-none font-bold">×</button>
                        </span>
                      ))}
                      <input
                        type="text"
                        value={customKeyword}
                        onChange={(e) => setCustomKeyword(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomKeyword(); } }}
                        placeholder={selectedKeywords.length === 0 && !loadingKeywords ? '키워드 직접 입력 후 Enter' : ''}
                        className="flex-1 min-w-[120px] text-sm outline-none bg-transparent placeholder-gray-400 py-1"
                      />
                    </div>

                    {/* AI 추천 키워드 */}
                    {keywordSuggestions.length > 0 && !loadingKeywords && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="text-xs text-gray-400 self-center">추천:</span>
                        {keywordSuggestions.map((kw, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => toggleKeyword(kw)}
                            className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                              selectedKeywords.includes(kw)
                                ? 'bg-indigo-100 text-indigo-600 border-indigo-300 line-through opacity-50'
                                : 'bg-gray-50 text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'
                            }`}
                          >
                            + {kw}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 톤/스타일 - 10가지 모두 자동 생성 */}
                  {(() => {
                    const TONE_STYLES = [
                      { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700', dot: 'bg-indigo-400' },
                      { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', dot: 'bg-emerald-400' },
                      { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-700', dot: 'bg-rose-400' },
                      { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', dot: 'bg-amber-400' },
                      { bg: 'bg-violet-50', border: 'border-violet-300', text: 'text-violet-700', dot: 'bg-violet-400' },
                      { bg: 'bg-sky-50', border: 'border-sky-300', text: 'text-sky-700', dot: 'bg-sky-400' },
                      { bg: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-700', dot: 'bg-teal-400' },
                      { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', dot: 'bg-orange-400' },
                      { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-700', dot: 'bg-cyan-400' },
                      { bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-700', dot: 'bg-pink-400' },
                    ];
                    return (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          톤/스타일
                          <span className="text-xs text-indigo-500 font-normal ml-1.5">(10가지 버전 동시 생성)</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {toneOptions.map((opt, i) => {
                            const s = TONE_STYLES[i % TONE_STYLES.length];
                            return (
                              <span key={opt.value}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border ${s.bg} ${s.border} ${s.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                {opt.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 추가 요구사항 + 참조 파일 업로드 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">참조 자료 & 추가 요구사항 (선택)</label>
                    <p className="text-xs text-gray-400 mb-2">입력된 텍스트와 업로드된 파일의 정보를 기반으로 콘텐츠를 생성합니다 (RAG 방식)</p>
                    <textarea
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      placeholder="콘텐츠에 반영할 정보를 입력하세요...&#10;예: 제품 스펙, 통계 데이터, 전문 용어, 인용할 내용, 특별 요구사항 등"
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-gray-400 resize-none"
                    />
                    {/* 파일 업로드 (클릭 + 드래그 앤 드롭) */}
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`mt-3 relative rounded-xl border border-dashed transition-all duration-200 ${
                        dragOver
                          ? 'border-indigo-500 bg-indigo-100 scale-[1.01] shadow-lg'
                          : 'border-indigo-300 bg-indigo-50 hover:border-indigo-400 hover:bg-indigo-100'
                      }`}
                    >
                      <label className="flex flex-col items-center gap-2 px-4 py-5 cursor-pointer">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          dragOver ? 'bg-indigo-500 text-white scale-110' : 'bg-indigo-200 text-indigo-600'
                        }`}>
                          {fileUploading ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-indigo-700">
                            {fileUploading ? '파일 처리 중...' : dragOver ? '여기에 놓으세요!' : '클릭하여 파일 선택 또는 드래그 앤 드롭'}
                          </p>
                          <p className="text-xs text-indigo-400 mt-1">PDF, DOCX, PPTX, 이미지(JPG/PNG), TXT, CSV 등 | 최대 20MB/파일, {referenceFiles.length}/{MAX_FILE_COUNT}개</p>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept=".txt,.md,.csv,.json,.html,.xml,.log,.pdf,.docx,.pptx,.jpg,.jpeg,.png,.gif,.webp,.bmp"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {/* 업로드된 파일 목록 */}
                    {referenceFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {referenceFiles.map((file, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-200">
                            <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-xs font-medium text-indigo-700 flex-1 truncate">{file.name}</span>
                            <span className="text-[10px] text-indigo-400">{(file.content.length / 1000).toFixed(1)}K자</span>
                            <button
                              onClick={() => removeFile(i)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* 파일 업로드 에러 메시지 */}
                    {fileErrors.length > 0 && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-1.5 mb-1">
                          <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span className="text-xs font-semibold text-red-700">업로드 실패한 파일</span>
                          <button onClick={() => setFileErrors([])} className="ml-auto text-red-400 hover:text-red-600 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        {fileErrors.map((err, i) => (
                          <p key={i} className="text-xs text-red-600 ml-5.5">{err}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 생성 버튼 */}
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !topic.trim()}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed border border-sky-300 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {toneProgress > 0 ? `콘텐츠 생성 중... ${toneProgress}/10` : '10가지 톤 콘텐츠 생성 중...'}
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        GEO/AIO 최적화 콘텐츠 생성
                      </>
                    )}
                  </button>

                  {/* ── 상시 API 키 설정 카드 ── */}
                  <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    {/* 헤더 */}
                    <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-blue-500 to-indigo-600">
                      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-bold text-sm">API 키 설정</p>
                        <p className="text-blue-100 text-xs">Google Gemini API 키를 등록하세요</p>
                      </div>
                      {inlineHasKey && (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-400 text-white shrink-0">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          등록됨
                        </span>
                      )}
                    </div>

                    {/* 본문 */}
                    <div className="px-5 py-4 space-y-3 bg-white">
                      {/* 안내 박스 */}
                      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                        <p className="text-xs font-bold text-blue-800 mb-1">Gemini API 키란?</p>
                        <p className="text-xs text-blue-700 leading-relaxed">
                          Google AI Studio에서 무료로 발급받을 수 있는 키입니다. 등록하면 AI 주제 추천, 키워드 제안, 콘텐츠 생성 기능을 사용할 수 있습니다.
                        </p>
                      </div>

                      {/* 입력 */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          API 키 입력
                          {inlineHasKey && <span className="text-gray-400 font-normal ml-1">(새 키 입력 시 기존 키 교체)</span>}
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type={inlineKeyVisible ? 'text' : 'password'}
                              value={inlineKey}
                              onChange={e => { setInlineKey(e.target.value); setInlineStatus(null); }}
                              onKeyDown={e => e.key === 'Enter' && handleSaveInlineKey(false)}
                              placeholder={inlineHasKey ? '새 키를 입력하면 기존 키가 교체됩니다' : 'AIza... 로 시작하는 Gemini API 키'}
                              className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-gray-300 font-mono bg-gray-50"
                            />
                            <button type="button" onClick={() => setInlineKeyVisible(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              {inlineKeyVisible
                                ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              }
                            </button>
                          </div>
                          <button
                            onClick={() => handleSaveInlineKey(false)}
                            disabled={inlineSaving || !inlineKey.trim()}
                            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            {inlineSaving ? '저장 중...' : '저장'}
                          </button>
                        </div>
                      </div>

                      {/* 상태 메시지 */}
                      {inlineStatus && (
                        <p className={`text-xs font-medium ${inlineStatus.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {inlineStatus.type === 'success' ? '✓ ' : '✗ '}{inlineStatus.msg}
                        </p>
                      )}

                      {/* 하단 링크 행 */}
                      <div className="flex items-center justify-between pt-1">
                        {inlineHasKey ? (
                          <button onClick={handleDeleteInlineKey}
                            className="text-xs text-red-500 hover:text-red-700 hover:underline transition-all">
                            등록된 키 삭제
                          </button>
                        ) : <span />}
                        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline transition-all">
                          키 무료 발급받기
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* ── /상시 API 키 설정 카드 ── */}

                </div>
              </div>
            )}

            {/* 에러 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-red-700">{error}</p>
                  {error.includes('소진했습니다') && (
                    <Link href="/pricing" className="inline-block mt-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 underline">
                      요금제 확인하기 &rarr;
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* API 키 에러 복구 패널 */}
            {showKeyRecovery && (
              <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden shadow-md">
                {/* 헤더 */}
                <div className="flex items-center gap-3 px-5 py-3.5 bg-amber-500">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">API 키를 재입력하고 바로 재시도하세요</p>
                    <p className="text-xs text-amber-100">새 키를 저장하면 이 페이지를 벗어나지 않고 즉시 생성을 재시작합니다</p>
                  </div>
                  <button onClick={() => setShowKeyRecovery(false)} className="w-6 h-6 flex items-center justify-center rounded-md bg-white/15 hover:bg-white/30 text-white transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {/* 본문 */}
                <div className="px-5 py-4 space-y-3">
                  {/* 안내 링크 */}
                  <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-100 border border-amber-200 rounded-lg px-3 py-2">
                    <svg className="w-4 h-4 shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>API 키가 없으신가요?</span>
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                      className="font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2">
                      Google AI Studio에서 무료 발급 →
                    </a>
                  </div>

                  {/* 입력 */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={recoveryKeyVisible ? 'text' : 'password'}
                        value={recoveryKey}
                        onChange={e => { setRecoveryKey(e.target.value); setRecoverySaved(false); }}
                        onKeyDown={e => e.key === 'Enter' && handleSaveRecoveryKey(false)}
                        placeholder="AIza... 로 시작하는 Gemini API 키 입력"
                        className="w-full pl-4 pr-10 py-2.5 border-2 border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent font-mono bg-white placeholder-gray-400"
                      />
                      <button type="button" onClick={() => setRecoveryKeyVisible(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {recoveryKeyVisible
                          ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                          : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        }
                      </button>
                    </div>
                    {/* 저장만 */}
                    <button
                      onClick={() => handleSaveRecoveryKey(false)}
                      disabled={recoverySaving || !recoveryKey.trim()}
                      className="px-4 py-2.5 bg-white border-2 border-amber-300 text-amber-700 text-sm font-semibold rounded-xl hover:bg-amber-50 transition-all disabled:opacity-40 whitespace-nowrap"
                    >
                      {recoverySaved ? '✓ 저장됨' : '저장'}
                    </button>
                    {/* 저장 후 바로 재시도 */}
                    <button
                      onClick={() => handleSaveRecoveryKey(true)}
                      disabled={recoverySaving || !recoveryKey.trim()}
                      className="px-4 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-all disabled:opacity-40 whitespace-nowrap flex items-center gap-1.5 shadow-md"
                    >
                      {recoverySaving ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      )}
                      저장 후 재시도
                    </button>
                  </div>

                  {recoverySaved && !recoverySaving && (
                    <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      키가 저장되었습니다. 생성 버튼을 눌러 다시 시도하세요.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 로딩 애니메이션 */}
            {isGenerating && (
              <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-3 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI가 콘텐츠를 생성하고 있습니다</h3>
                <p className="text-sm text-gray-500">GEO/AIO에 최적화된 고품질 콘텐츠를 작성 중입니다...</p>
              </div>
            )}

            {/* 초기 안내 (카테고리 미선택 시) */}
            {!selectedCategory && !isGenerating && (
              <div className="bg-white rounded-xl shadow-sm border border-violet-200 p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">콘텐츠 유형을 선택하세요</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  위에서 원하는 콘텐츠 유형을 선택하면 GEO/AIO에 최적화된
                  고품질 콘텐츠를 AI가 자동으로 생성합니다.
                </p>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 max-w-lg mx-auto">
                  {[
                    { label: 'AIO 최적화', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
                    { label: 'E-E-A-T 내장', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
                    { label: 'FAQ 자동생성', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
                    { label: 'SEO 친화적', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
                  ].map((feature) => (
                    <div key={feature.label} className={`${feature.bg} rounded-xl px-3 py-2.5 border ${feature.border}`}>
                      <p className={`text-xs font-semibold ${feature.text}`}>{feature.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Claude API 키 설정 섹션 - 페이지 하단 */}
        <div className="mt-12 max-w-2xl mx-auto bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900">🔐 Claude API 키 설정</h3>
              <p className="text-sm text-slate-600 mt-1">
                생성 실패 시 Claude API 키를 등록하여 추가 AI 모델을 사용하세요
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Claude API 키 입력 */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Anthropic Claude API 키
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="password"
                    id="claudeKeyInput"
                    placeholder="sk-ant-... (Claude API 키)"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent font-mono bg-white placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                      input.type = input.type === 'password' ? 'text' : 'password';
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
                <a
                  href="https://console.anthropic.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-slate-600 to-slate-700 border border-slate-700 rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all whitespace-nowrap"
                >
                  발급받기
                </a>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                ℹ️ <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-700">Anthropic Console</a>에서 API 키를 발급받은 후 등록하세요
              </p>
            </div>

            {/* 저장 및 삭제 버튼 */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  const keyInput = document.getElementById('claudeKeyInput') as HTMLInputElement;
                  if (keyInput?.value.trim()) {
                    localStorage.setItem('ai_claude_key', keyInput.value.trim());
                    alert('✅ Claude API 키가 저장되었습니다');
                    keyInput.value = '';
                  } else {
                    alert('❌ API 키를 입력해주세요');
                  }
                }}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-all"
              >
                💾 저장
              </button>
              <button
                onClick={() => {
                  if (confirm('저장된 Claude API 키를 삭제하시겠습니까?')) {
                    localStorage.removeItem('ai_claude_key');
                    alert('✅ Claude API 키가 삭제되었습니다');
                  }
                }}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-all"
              >
                🗑️ 삭제
              </button>
              <button
                onClick={() => {
                  const storedKey = localStorage.getItem('ai_claude_key');
                  if (storedKey) {
                    alert('✅ Claude API 키가 저장되어 있습니다');
                  } else {
                    alert('❌ 저장된 Claude API 키가 없습니다');
                  }
                }}
                className="ml-auto px-5 py-2.5 bg-slate-500 hover:bg-slate-600 text-white text-sm font-semibold rounded-xl transition-all"
              >
                ✓ 상태 확인
              </button>
            </div>
          </div>

          {/* 안내 박스 */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 leading-relaxed">
              💡 <strong>Claude API 사용:</strong> 생성 과정에서 Gemini 또는 다른 API가 실패할 경우 저장된 Claude API 키를 사용하여 자동으로 재시도합니다.
            </p>
          </div>
        </div>

      </main>

      <Footer />

    </div>
  );
}
