'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ApiKeyPanel from '@/components/ApiKeyPanel';
import type { ContentCategory, GenerateResponse } from '@/lib/types';
import { addRevision, generateId } from '@/lib/history';
import { stripProjectLinks } from '@/lib/inject-project-links';
import { uploadImage, getGenerateResult, saveGenerateResult, saveBlogPost, saveBlogPostsBatch, getBlogCategories, type GenerateResultData, type BlogCategory } from '@/lib/supabase-storage';
import { useUser } from '@/lib/user-context';
import CategorySelector, { type CategoryChoiceValue } from '@/components/CategorySelector';
import { CATEGORY_CHOICE_KEY, autoMatchCategory, PUBLISH_OPTIONS_KEY, DEFAULT_PUBLISH_OPTIONS, type PublishOptions, readAutopilotRun, writeAutopilotRun, clearAutopilotRun } from '@/lib/category-match';

const categories: { id: ContentCategory; label: string }[] = [
  { id: 'blog', label: '블로그 포스트' },
  { id: 'product', label: '제품 설명' },
  { id: 'faq', label: 'FAQ 페이지' },
  { id: 'howto', label: 'How-to 가이드' },
  { id: 'landing', label: '랜딩 페이지' },
  { id: 'technical', label: '기술 문서' },
  { id: 'social', label: '소셜 미디어' },
  { id: 'email', label: '이메일 마케팅' },
];

interface StoredResult {
  result: GenerateResponse;
  category: ContentCategory;
  topic: string;
  targetKeyword: string;
  tone: string;
  historyId: string;
}

export default function GenerateResultPage() {
  const { selectedProject } = useUser();
  const router = useRouter();
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory | null>(null);
  const [topic, setTopic] = useState('');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [tone, setTone] = useState('');
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showEditInput, setShowEditInput] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const [showFinalContent, setShowFinalContent] = useState(false);
  const [finalContentHtml, setFinalContentHtml] = useState('');
  const [copiedFinal, setCopiedFinal] = useState(false);
  const finalContentRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // SNS 변환
  const [snsChannel, setSnsChannel] = useState<string | null>(null);
  const [snsResult, setSnsResult] = useState<string | null>(null);
  const [snsLoading, setSnsLoading] = useState(false);
  const [snsCopied, setSnsCopied] = useState(false);

  // A/B 버전
  const [abVersions, setAbVersions] = useState<(GenerateResponse & { toneName?: string })[]>([]);
  const [activeAbTab, setActiveAbTab] = useState(0);
  const [selectedVersions, setSelectedVersions] = useState<Set<number>>(new Set([0]));

  // E-E-A-T 자동 변환
  const [eeatConverting, setEeatConverting] = useState(false);
  const [eeatProgress, setEeatProgress] = useState(0); // 0~10
  const [eeatDone, setEeatDone] = useState(false);
  const [eeatFailed, setEeatFailed] = useState<Set<number>>(new Set()); // 검증 실패한 톤 인덱스

  // E-E-A-T 단일 톤 완성 (현재 보고 있는 톤만)
  const [eeatCompletingSingle, setEeatCompletingSingle] = useState(false);
  const [eeatCompleteSingleStatus, setEeatCompleteSingleStatus] = useState<string>('');

  // ⭐ E-E-A-T 자동 일괄 변환 (10개 톤 모두 자동 완성)
  const [eeatAutoMode, setEeatAutoMode] = useState(true);
  const [eeatAutoStatus, setEeatAutoStatus] = useState<Record<number, 'idle' | 'processing' | 'done' | 'failed'>>({});
  const [eeatAutoStarted, setEeatAutoStarted] = useState(false);

  // 🚀 논스톱 자동 발행 — 순차 처리 (한국어 발행 → 영어 번역·발행 → 중국어 번역·발행 → 일본어 번역·발행 → 팝업)
  // 순차 처리로 API 과부하·rate limit 회피.
  type AutoPilotPhase = 'idle' | 'publishing-ko' | 'translating-en' | 'publishing-en' | 'translating-zh' | 'publishing-zh' | 'translating-ja' | 'publishing-ja' | 'done';
  const [autoPilotPhase, setAutoPilotPhase] = useState<AutoPilotPhase>('idle');
  const [autoPilotProgress, setAutoPilotProgress] = useState<{ ko: number; en: number; zh: number; ja: number }>({ ko: 0, en: 0, zh: 0, ja: 0 });
  const [autoPilotResult, setAutoPilotResult] = useState<{ ko: number; en: number; zh: number; ja: number; total: number; category: string } | null>(null);

  // ⭐ 언어 탭 (한국어 기본, 영/중/일 번역은 클릭 시 1회 번역 + 캐시)
  type Lang = 'ko' | 'en' | 'zh' | 'ja';
  const VALID_LANGS: Lang[] = ['ko', 'en', 'zh', 'ja'];
  // URL ?lang=en 우선, 없으면 ko
  const initialLang: Lang = (() => {
    if (typeof window === 'undefined') return 'ko';
    const p = new URLSearchParams(window.location.search).get('lang');
    return (p && VALID_LANGS.includes(p as Lang)) ? (p as Lang) : 'ko';
  })();
  const [activeLang, setActiveLang] = useState<Lang>(initialLang);
  const [translatedVersions, setTranslatedVersions] = useState<Record<Lang, Record<number, { title: string; content: string }>>>(() => {
    // 새로고침 시 sessionStorage에서 복원
    if (typeof window === 'undefined') return { ko: {}, en: {}, zh: {}, ja: {} };
    try {
      const id = new URLSearchParams(window.location.search).get('id');
      if (id) {
        const saved = sessionStorage.getItem(`gr_trans_${id}`);
        if (saved) return JSON.parse(saved);
      }
    } catch {}
    return { ko: {}, en: {}, zh: {}, ja: {} };
  });
  // 번역 실패한 톤 인덱스 (언어별). 폴백으로 한국어 보여주는 경우 ⚠️ 표시용.
  const [translationFailed, setTranslationFailed] = useState<Record<Lang, Set<number>>>({
    ko: new Set(), en: new Set(), zh: new Set(), ja: new Set(),
  });
  const [translatingLang, setTranslatingLang] = useState<Lang | null>(null);
  const [translateProgress, setTranslateProgress] = useState(0);
  // 비동기 콜백에서 최신 활성 톤·언어 참조용
  const activeAbTabRef = useRef(0);
  const activeLangRef = useRef<Lang>(initialLang);
  useEffect(() => { activeAbTabRef.current = activeAbTab; }, [activeAbTab]);
  useEffect(() => { activeLangRef.current = activeLang; }, [activeLang]);

  // 자동 발행에서 stale closure 회피용 — 최신 번역 캐시 참조
  const translatedVersionsRef = useRef(translatedVersions);
  useEffect(() => { translatedVersionsRef.current = translatedVersions; }, [translatedVersions]);

  // 활성 언어 변경 시 URL ?lang= 동기화 (새로고침해도 유지)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (activeLang === 'ko') url.searchParams.delete('lang');
    else url.searchParams.set('lang', activeLang);
    window.history.replaceState({}, '', url.toString());
  }, [activeLang]);

  // 톤이 모두 로드되면 전체 자동 선택 — 한국어는 즉시 15/15, 비한국어는 번역 완료된 톤이
  // translateOne 안에서 추가 선택돼 결국 모든 번역이 끝나면 전체 선택 상태가 됨.
  // length만 의존해 사용자의 수동 선택/해제 후 재선택 덮어쓰기 방지.
  const initialSelectedAppliedRef = useRef(false);
  useEffect(() => {
    if (initialSelectedAppliedRef.current) return;
    if (abVersions.length === 0) return;
    setSelectedVersions(new Set(abVersions.map((_, i) => i)));
    initialSelectedAppliedRef.current = true;
  }, [abVersions.length]);

  // ⭐ Autopilot 자동 발행 트리거 — abVersions 로드 완료 후 1회만 실행
  // (사용자가 generate에서 "🚀 자동 발행 시작" 버튼으로 시작했을 때만 동작)
  const autopilotTriggeredRef = useRef(false);
  useEffect(() => {
    if (autopilotTriggeredRef.current) return;
    if (abVersions.length === 0) return;
    const run = readAutopilotRun();
    if (!run.isRunning) return;
    autopilotTriggeredRef.current = true;
    console.log(`[autopilot] result 페이지 — ${run.currentRepeat}/${run.totalRepeats}회차 자동 발행 시작`);
    // 콘텐츠 안정화 대기 (1.5초) 후 자동 발행 호출
    const timer = setTimeout(() => { runAutoPilotPublish(); }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abVersions.length]);

  // 새로고침 시 URL ?lang=en 등 비한국어이면 자동 번역 시작 (cache 부족할 때만)
  // abVersions가 로드된 후에 1회만 트리거
  const autoTranslateTriggeredRef = useRef(false);
  useEffect(() => {
    if (autoTranslateTriggeredRef.current) return;
    if (activeLang === 'ko') return;
    if (!abVersions || abVersions.length === 0) return;
    const cached = Object.keys(translatedVersions[activeLang] || {}).length;
    if (cached >= abVersions.length) return; // 이미 모두 캐시됨
    autoTranslateTriggeredRef.current = true;
    startTranslation(activeLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abVersions, activeLang]);

  // 번역 캐시 → sessionStorage 저장 (새로고침해도 유지)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) return;
    try {
      sessionStorage.setItem(`gr_trans_${id}`, JSON.stringify(translatedVersions));
    } catch {}
  }, [translatedVersions]);

  // ⭐ result는 derived: 어떤 곳에서 setResult가 호출되든 마지막에 정확한 값으로 동기화.
  //    result 자체를 deps에 포함 → EEAT가 setResult(한국어) 호출해도 재실행되어 번역 콘텐츠 복구.
  //    무한 루프 방지: 현재 result가 이미 desired와 같으면 setResult 스킵.
  useEffect(() => {
    if (!abVersions || abVersions.length === 0) return;
    const v = abVersions[activeAbTab];
    if (!v) return;
    let desiredTitle: string = v.title || '';
    let desiredContent: string = v.content || '';
    if (activeLang !== 'ko') {
      const trans = translatedVersions[activeLang]?.[activeAbTab];
      if (trans) {
        desiredTitle = trans.title;
        desiredContent = trans.content;
      }
    }
    if (result?.title === desiredTitle && result?.content === desiredContent) return;
    setResult({ ...v, title: desiredTitle, content: desiredContent });
  }, [result, activeAbTab, activeLang, abVersions, translatedVersions]);

  // 블로그 게시
  const [showBlogPublish, setShowBlogPublish] = useState(false);
  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('blog_categories');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  // 초기값 빈 문자열 — 사용자가 모달에서 명시 선택해야만 채워짐.
  // 자동 발행은 프로젝트 기반 매칭으로 별도 결정 (선택 없이 'geo-aio' 폴백 방지).
  const [selectedBlogCategory, setSelectedBlogCategory] = useState('');
  // generate 페이지에서 사용자가 결정한 자동/수동 선택 (sessionStorage로 전달)
  const [categoryChoice, setCategoryChoice] = useState<CategoryChoiceValue>(() => {
    if (typeof window === 'undefined') return { mode: 'auto', manualSlug: '' };
    try {
      const raw = sessionStorage.getItem(CATEGORY_CHOICE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { mode: 'auto', manualSlug: '' };
  });
  // categoryChoice 변경 시 sessionStorage 동기화 (이 페이지에서도 변경 가능)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { sessionStorage.setItem(CATEGORY_CHOICE_KEY, JSON.stringify(categoryChoice)); } catch {}
  }, [categoryChoice]);
  const [blogTag, setBlogTag] = useState('');
  const [blogSummary, setBlogSummary] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');

  // SNS 배포
  const [snsDistribute, setSnsDistribute] = useState(false);
  const [snsChannels, setSnsChannels] = useState<Set<string>>(new Set());
  const [makeWebhookUrl, setMakeWebhookUrl] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('make_webhook_url') || '';
  });
  const [distributeResult, setDistributeResult] = useState<string | null>(null);

  // 카테고리 변경 시 localStorage에 저장
  useEffect(() => {
    if (blogCategories.length > 0) {
      localStorage.setItem('blog_categories', JSON.stringify(blogCategories));
    }
  }, [blogCategories]);

  // Supabase 또는 localStorage에서 결과 데이터 로드
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
      router.push('/generate');
      return;
    }
    // session_ ID면 sessionStorage에서 로드, 아니면 Supabase에서 로드
    const loadData = async () => {
      let data: import('@/lib/supabase-storage').GenerateResultData | null = null;
      if (id.startsWith('session_')) {
        try {
          const raw = sessionStorage.getItem(`gr_${id}`);
          if (raw) data = JSON.parse(raw);
        } catch {}
      } else {
        data = await getGenerateResult(id);
      }
      return data;
    };

    loadData().then(data => {
      if (!data) {
        router.push('/generate');
        return;
      }

      // content가 JSON 문자열로 이중 저장된 경우 정규화
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalizeResult = (r: any): any => {
        if (!r) return r;
        const content = r.content || '';
        if (typeof content !== 'string' || !content.trim().startsWith('{')) return r;

        // 1순위: 정상 JSON 파싱
        try {
          const parsed = JSON.parse(content);
          if (parsed.content) return { ...r, ...parsed };
        } catch {}

        // 2순위: 개행 포함 / 잘린 JSON — "content" 값 직접 추출
        try {
          const contentKeyIdx = content.indexOf('"content"');
          if (contentKeyIdx !== -1) {
            const afterKey = content.slice(contentKeyIdx + 9);
            const openQuote = afterKey.indexOf('"');
            if (openQuote !== -1) {
              const rawSlice = afterKey.slice(openQuote + 1);
              const endMarkers = ['","hashtags"','", "hashtags"','","metadata"','", "metadata"','","toneName"','", "toneName"'];
              let rawContent = rawSlice;
              for (const marker of endMarkers) {
                const idx = rawSlice.indexOf(marker);
                if (idx !== -1) { rawContent = rawSlice.slice(0, idx); break; }
              }
              const decoded = rawContent
                .replace(/\\n/g, '\n').replace(/\\t/g, '\t')
                .replace(/\\"/g, '"').replace(/\\\\/g, '\\')
                .replace(/"?\s*\}?\s*$/, '').trim();
              // title 추출
              let title = r.title;
              const titleKeyIdx = content.indexOf('"title"');
              if (titleKeyIdx !== -1) {
                const afterTitle = content.slice(titleKeyIdx + 7);
                const tq = afterTitle.indexOf('"');
                if (tq !== -1) {
                  const titleRaw = afterTitle.slice(tq + 1);
                  const endTq = titleRaw.indexOf('"');
                  if (endTq !== -1) title = titleRaw.slice(0, endTq).replace(/\\"/g, '"');
                }
              }
              if (decoded.length > 30) return { ...r, title, content: decoded };
            }
          }
        } catch {}

        return r;
      };

      const normalized = normalizeResult(data.result);
      setResult(normalized);
      setSelectedCategory(data.category);
      setTopic(data.topic);
      setTargetKeyword(data.targetKeyword);
      setTone(data.tone);
      setCurrentHistoryId(data.historyId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const versions = (data.result as any)?.abVersions || [];
      const normalizedVersions = versions.length > 0 ? versions.map(normalizeResult) : [];
      if (normalizedVersions.length > 0) {
        setAbVersions(normalizedVersions);
        // 각 톤별로 개별 검증 → 미완성만 선택적으로 처리
        startEeatConversion(normalizedVersions, data.tone);
      }
    });
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── E-E-A-T 검증 (컴포넌트 스코프에서 재사용) ──
  // ── 톤 탭 클릭: 활성 언어에 맞춰 결과 표시 ──
  const handleToneTabClick = (i: number) => {
    setActiveAbTab(i);
    if (activeLang === 'ko') {
      setResult(abVersions[i] || null);
      return;
    }
    const trans = translatedVersions[activeLang]?.[i];
    if (trans && abVersions[i]) {
      setResult({ ...abVersions[i], title: trans.title, content: trans.content });
    } else {
      setResult(abVersions[i] || null); // 아직 번역 전 — 한국어로 표시
    }
  };

  // ── 언어 탭 클릭: 캐시 있으면 즉시 표시, 없으면 일괄 번역 ──
  const handleLangClick = (lang: Lang) => {
    setActiveLang(lang);
    const idx = activeAbTab;
    if (lang === 'ko') {
      setResult(abVersions[idx] || null);
      return;
    }
    // 캐시 있으면 표시
    const trans = translatedVersions[lang]?.[idx];
    if (trans && abVersions[idx]) {
      setResult({ ...abVersions[idx], title: trans.title, content: trans.content });
    }
    // 캐시 부족하면 번역 시작 (이미 진행 중이면 무시)
    const cached = Object.keys(translatedVersions[lang] || {}).length;
    if (cached < abVersions.length && translatingLang !== lang) {
      startTranslation(lang);
    }
  };

  // 병렬 번역 (concurrency 3) — 3개 동시 처리. 재시도 로직으로 실패 복구.
  const startTranslation = async (lang: Lang) => {
    if (lang === 'ko') return;
    if (abVersions.length === 0) return;
    setTranslatingLang(lang);
    setTranslateProgress(0);

    const versions = abVersions;
    const concurrency = 3;
    let nextIdx = 0;
    const inFlight: Promise<void>[] = [];

    const translateOne = async (idx: number) => {
      const v = versions[idx];
      // 이미 캐시된 슬롯은 건너뜀
      if (translatedVersions[lang]?.[idx]) {
        setTranslateProgress(prev => prev + 1);
        return;
      }

      const attemptOnce = async (): Promise<{ title: string; content: string } | null> => {
        try {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: v.title,
              content: v.content,
              targetLang: lang,
            }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          const content = data.content || '';
          // 비어 있거나 너무 짧은 응답은 실패로 간주 (재시도 대상)
          if (!content || content.length < 100) return null;
          return { title: data.title || v.title || '', content };
        } catch (e) {
          console.error(`[translate] 톤 ${idx + 1} 호출 오류:`, e);
          return null;
        }
      };

      // 최대 3회 시도, 백오프 1s → 2s → 4s
      let entry: { title: string; content: string } | null = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        entry = await attemptOnce();
        if (entry) {
          if (attempt > 1) console.log(`[translate] 톤 ${idx + 1} ${attempt}회 시도 후 성공`);
          break;
        }
        if (attempt < 3) {
          const delay = 1000 * Math.pow(2, attempt - 1);
          console.log(`[translate] 톤 ${idx + 1} ${attempt}회 실패 — ${delay}ms 후 재시도`);
          await new Promise(r => setTimeout(r, delay));
        }
      }

      if (entry) {
        setTranslatedVersions(prev => ({
          ...prev,
          [lang]: { ...(prev[lang] || {}), [idx]: entry! },
        }));
        // 번역 성공 시 해당 톤 자동 선택 — 15개 모두 끝나면 전체 선택 상태가 됨
        setSelectedVersions(prev => {
          if (prev.has(idx)) return prev;
          const next = new Set(prev);
          next.add(idx);
          return next;
        });
        // 이전에 실패로 마크됐다면 해제
        setTranslationFailed(prev => {
          if (!prev[lang]?.has(idx)) return prev;
          const next = new Set(prev[lang]);
          next.delete(idx);
          return { ...prev, [lang]: next };
        });
      } else {
        console.error(`[translate] 톤 ${idx + 1} 3회 시도 모두 실패 — ⚠ 마크하고 한국어 원문 표시`);
        // 캐시에 저장하지 X — derived useEffect가 한국어 원문으로 폴백.
        // 실패 set에만 추가 → 톤 탭에 ⚠️ 뱃지로 표시.
        setTranslationFailed(prev => ({
          ...prev,
          [lang]: new Set([...(prev[lang] || []), idx]),
        }));
      }
      setTranslateProgress(prev => prev + 1);
    };

    while (nextIdx < versions.length || inFlight.length > 0) {
      while (inFlight.length < concurrency && nextIdx < versions.length) {
        const i = nextIdx++;
        const p = translateOne(i).finally(() => {
          const k = inFlight.indexOf(p);
          if (k !== -1) inFlight.splice(k, 1);
        });
        inFlight.push(p);
      }
      if (inFlight.length > 0) {
        await Promise.race(inFlight);
      }
    }

    setTranslatingLang(null);
  };

  const validateEeatComplete = (content: string): { ok: boolean; reason?: string } => {
    if (!content) return { ok: false, reason: '콘텐츠 비어있음' };
    if (content.length < 1100) return { ok: false, reason: `분량 부족 (${content.length}자)` };
    const h2Matches = content.match(/^## /gm) || [];
    if (h2Matches.length < 5) return { ok: false, reason: `H2 부족 (${h2Matches.length}개)` };
    if (!/##\s*FAQ|##\s*자주\s*묻는|##\s*질문/i.test(content)) return { ok: false, reason: 'FAQ 없음' };
    if (!/\|.+\|.+\|\s*\n\s*\|[\s\-:|]+\|/.test(content)) return { ok: false, reason: '비교표 없음' };
    if (!/##\s*결론|##\s*마치며|##\s*마무리|##\s*요약/i.test(content)) return { ok: false, reason: '결론 없음' };
    const lastBlock = content.slice(-300);
    const hashtagLineMatches = lastBlock.match(/(?:^|\n)\s*(#[\w가-힣]+(?:\s+#[\w가-힣]+){2,})/);
    const lines = content.trim().split('\n');
    const lastNonEmptyLines = lines.filter(l => l.trim().length > 0).slice(-5);
    const hashtagLineExists = lastNonEmptyLines.some(line => {
      const tags = line.match(/#[\w가-힣]+/g) || [];
      return tags.length >= 5;
    });
    if (!hashtagLineMatches && !hashtagLineExists) return { ok: false, reason: '해시태그 라인 없음 (5개+)' };
    const lastChar = content.trim().slice(-1);
    if (/^[ㄱ-ㅎㅏ-ㅣ]$/.test(lastChar)) return { ok: false, reason: '한글 자음 잘림' };
    const lastLine = lastNonEmptyLines[lastNonEmptyLines.length - 1] || '';
    const endsWithHashtag = /#[\w가-힣]+\s*$/.test(lastLine);
    const endsWithSentence = /[.!?다요죠"】\]\)]\s*$/.test(lastLine);
    const endsWithPipe = lastLine.trim().endsWith('|');
    if (!endsWithHashtag && !endsWithSentence && !endsWithPipe) {
      return { ok: false, reason: `마지막 줄 미완성` };
    }
    return { ok: true };
  };

  // 이어쓰기 API 호출
  const requestContinue = async (
    v: GenerateResponse & { toneName?: string; toneValue?: string },
    previousContent: string,
  ): Promise<string | null> => {
    try {
      const res = await fetch('/api/convert-eeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: previousContent,
          previousContent,
          continuation: true,
          tone: v.toneValue || tone,
          // ⭐ Phase 2: 이어쓰기에도 series 메타 전달 → angle 유지 (카탈로그 회귀 방지)
          seriesRole: (v as { seriesRole?: string }).seriesRole,
          seriesIntent: (v as { seriesIntent?: string }).seriesIntent,
          seriesAngle: (v as { seriesAngle?: string }).seriesAngle,
          seriesPillarCatalog: (v as { seriesPillarCatalog?: string[] }).seriesPillarCatalog,
          homepage_url: selectedProject?.homepage_url || undefined,
          blog_url: selectedProject?.blog_url || undefined,
          company_name: selectedProject?.company_name || undefined,
        }),
      });
      if (!res.ok && res.status !== 422) return null;
      const data = await res.json();
      return data.content || data.partialContent || null;
    } catch {
      return null;
    }
  };

  // ⭐ regenerate API 호출 — generate 단계 빈응답(< 200자) 회복용 처음부터 새로 작성
  const requestRegenerate = async (
    v: GenerateResponse & { toneName?: string; toneValue?: string },
  ): Promise<string | null> => {
    try {
      const res = await fetch('/api/convert-eeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regenerate: true,
          topic,
          title: v.title,
          tone: v.toneValue || tone,
          seriesRole: (v as { seriesRole?: string }).seriesRole,
          seriesIntent: (v as { seriesIntent?: string }).seriesIntent,
          seriesAngle: (v as { seriesAngle?: string }).seriesAngle,
          seriesPillarCatalog: (v as { seriesPillarCatalog?: string[] }).seriesPillarCatalog,
          businessInfo: selectedProject ? {
            company_name: selectedProject.company_name,
            representative: (selectedProject as { representative?: string }).representative,
            region: (selectedProject as { region?: string }).region,
          } : undefined,
          homepage_url: selectedProject?.homepage_url || undefined,
          blog_url: selectedProject?.blog_url || undefined,
          company_name: selectedProject?.company_name || undefined,
        }),
      });
      if (!res.ok && res.status !== 422) return null;
      const data = await res.json();
      return data.content || data.partialContent || null;
    } catch {
      return null;
    }
  };

  // 두 콘텐츠 자연스럽게 결합
  // ⚠️ 합치기 전 orig에서 광고 블록과 trailing 해시태그를 제거.
  //    이 단계 없이 단순 이어붙이면 광고 블록이 본문 중간에 끼고 이어쓰기마다 누적됨.
  //    (이어쓰기 4회 = 광고 4번 + FAQ/결론 중복 사고 발생).
  const mergeMd = (orig: string, cont: string): string => {
    const o = stripProjectLinks(orig).trim();
    const c = cont.trim();
    const sep = c.startsWith('#') || c.startsWith('|') ? '\n\n' : '\n';
    return o + sep + c;
  };

  // 현재 보고 있는 톤이 완성됐는지 체크 (버튼 활성/비활성 결정용)
  const isCurrentToneComplete = (): boolean => {
    const v = abVersions[activeAbTab];
    if (!v) return false;
    return validateEeatComplete(v.content || '').ok;
  };

  // ⭐ 현재 보고 있는 톤만 E-E-A-T 완성 (단일 톤)
  const handleCompleteEeatSingle = async () => {
    if (!result || eeatCompletingSingle) return;
    const idx = activeAbTab;
    const v = abVersions[idx];
    if (!v) return;

    // 이미 완성된 경우 — 버튼이 비활성화 상태이지만 안전장치
    const initialCheck = validateEeatComplete(v.content || '');
    if (initialCheck.ok) {
      setEeatCompleteSingleStatus('이미 완성된 콘텐츠입니다 ✓');
      setTimeout(() => setEeatCompleteSingleStatus(''), 2000);
      return;
    }

    setEeatCompletingSingle(true);
    setEeatCompleteSingleStatus('검증 중...');

    try {
      let currentContent = v.content || '';

      // ⭐ 200자 미만(generate 단계 빈응답): 이어쓰기 불가 → 처음부터 새로 작성
      if (currentContent.length < 200) {
        setEeatCompleteSingleStatus(`콘텐츠가 너무 짧음 (${currentContent.length}자) — 처음부터 새로 작성 중...`);
        const regenerated = await requestRegenerate(v);
        if (regenerated && regenerated.length >= 200) {
          currentContent = regenerated;
          setEeatCompleteSingleStatus(`✓ 새 글 생성 (${regenerated.length}자) — 검증 중...`);
        } else {
          setEeatCompleteSingleStatus(`처음부터 쓰기도 실패 — 현재 상태 유지`);
          setTimeout(() => {
            setEeatCompleteSingleStatus('');
            setEeatCompletingSingle(false);
          }, 3000);
          return;
        }
      }

      // 최대 5회 이어쓰기로 완결 시도
      let completed = false;
      let finalAbVersions = abVersions;
      for (let attempt = 1; attempt <= 5; attempt++) {
        setEeatCompleteSingleStatus(`이어쓰기 ${attempt}/5 (현재 ${currentContent.length}자)`);
        const continued = await requestContinue(v, currentContent);
        if (!continued) continue;

        currentContent = mergeMd(currentContent, continued);
        const check = validateEeatComplete(currentContent);

        // 즉시 화면에 반영 (누적된 콘텐츠 표시)
        const updatedV = { ...v, content: currentContent };
        const newAbVersions = [...abVersions];
        newAbVersions[idx] = updatedV;
        finalAbVersions = newAbVersions;
        setAbVersions(newAbVersions);
        setResult(updatedV);

        if (check.ok) {
          setEeatCompleteSingleStatus(`✅ 완성 (${currentContent.length}자, ${attempt}회) — 새로고침 중...`);
          completed = true;

          // 실패 마크 제거
          setEeatFailed(prev => {
            const next = new Set(prev);
            next.delete(idx);
            return next;
          });

          // sessionStorage에 저장
          try {
            const params = new URLSearchParams(window.location.search);
            const sid = params.get('id');
            if (sid && sid.startsWith('session_')) {
              const raw = sessionStorage.getItem(`gr_${sid}`);
              if (raw) {
                const stored = JSON.parse(raw);
                stored.result = { ...stored.result, abVersions: newAbVersions };
                sessionStorage.setItem(`gr_${sid}`, JSON.stringify(stored));
              }
            }
          } catch {}
          break;
        }
      }

      if (completed) {
        // ⭐ 완성 성공 시 1.5초 후 자동 새로고침
        await new Promise(resolve => setTimeout(resolve, 1500));
        window.location.reload();
        return;
      } else {
        setEeatCompleteSingleStatus(`5회 이어쓰기 후에도 미완성 — 현재 누적 분량 유지 (${currentContent.length}자)`);
      }
    } catch (e) {
      console.error('[E-E-A-T 단일 완성] 오류:', e);
      setEeatCompleteSingleStatus('오류 발생');
    }

    setTimeout(() => {
      setEeatCompleteSingleStatus('');
      setEeatCompletingSingle(false);
    }, 4000);
  };

  // ⭐ E-E-A-T 자동 일괄 변환 — result 로드 직후 미완성 톤 모두 자동 완성
  useEffect(() => {
    if (!eeatAutoMode) return;
    if (eeatAutoStarted) return;
    if (!result || !abVersions || abVersions.length === 0) return;

    // 미완성 톤 인덱스 추출
    const incompleteIdx = abVersions
      .map((v, i) => ({ v, i }))
      .filter(({ v }) => v && !validateEeatComplete(v.content || '').ok)
      .map(({ i }) => i);

    if (incompleteIdx.length === 0) return; // 이미 모두 완성

    setEeatAutoStarted(true);

    // 초기 상태 — 미완성 톤은 idle, 완성된 톤은 done 으로 표시
    setEeatAutoStatus(() => {
      const init: Record<number, 'idle' | 'processing' | 'done' | 'failed'> = {};
      abVersions.forEach((v, i) => {
        init[i] = validateEeatComplete(v?.content || '').ok ? 'done' : 'idle';
      });
      return init;
    });

    const PARALLEL = 5;
    const queue = [...incompleteIdx];

    const processOne = async (idx: number) => {
      setEeatAutoStatus(prev => ({ ...prev, [idx]: 'processing' }));
      const v = abVersions[idx];
      if (!v) {
        setEeatAutoStatus(prev => ({ ...prev, [idx]: 'failed' }));
        return;
      }
      let currentContent = v.content || '';
      // ⭐ 200자 미만(generate 빈응답): 처음부터 새로 작성으로 복구
      if (currentContent.length < 200) {
        console.log(`[E-E-A-T 자동] 톤 ${idx + 1} 너무 짧음(${currentContent.length}자) — regenerate 시도`);
        const regenerated = await requestRegenerate(v);
        if (regenerated && regenerated.length >= 200) {
          console.log(`[E-E-A-T 자동] 톤 ${idx + 1} ✓ regenerate 성공 (${regenerated.length}자)`);
          currentContent = regenerated;
          // 즉시 화면 반영
          setAbVersions(prev => {
            const next = [...prev];
            if (next[idx]) next[idx] = { ...next[idx], content: currentContent };
            return next;
          });
        } else {
          console.warn(`[E-E-A-T 자동] 톤 ${idx + 1} regenerate 실패 — failed 처리`);
          setEeatAutoStatus(prev => ({ ...prev, [idx]: 'failed' }));
          return;
        }
      }
      // 자동 모드 EEAT 이어쓰기 최대 5회 (Paid Tier 안정 한도, ⚠️ 수동필요 배지 최소화)
      for (let attempt = 1; attempt <= 5; attempt++) {
        const continued = await requestContinue(v, currentContent);
        if (!continued) continue;
        currentContent = mergeMd(currentContent, continued);
        // 부분 진행도 화면에 즉시 반영
        setAbVersions(prev => {
          const next = [...prev];
          if (next[idx]) next[idx] = { ...next[idx], content: currentContent };
          return next;
        });
        const check = validateEeatComplete(currentContent);
        if (check.ok) {
          setEeatAutoStatus(prev => ({ ...prev, [idx]: 'done' }));
          setEeatFailed(prev => {
            const n = new Set(prev);
            n.delete(idx);
            return n;
          });
          return;
        }
      }
      setEeatAutoStatus(prev => ({ ...prev, [idx]: 'failed' }));
    };

    const runner = async () => {
      while (queue.length > 0) {
        const idx = queue.shift();
        if (idx === undefined) break;
        await processOne(idx);
      }
    };
    Promise.all(Array.from({ length: PARALLEL }, () => runner()))
      .then(() => {
        // 모두 끝났을 때 현재 표시 중인 탭과 result 동기화
        setAbVersions(prev => {
          const v = prev[activeAbTab];
          if (v) setResult(v);
          return prev;
        });
      })
      .catch((e) => console.error('[eeatAuto] runner error:', e));
  }, [result, abVersions, eeatAutoMode, eeatAutoStarted, activeAbTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // E-E-A-T 자동 변환 함수
  const startEeatConversion = async (
    versions: (GenerateResponse & { toneName?: string })[],
    currentTone: string,
  ) => {
    if (versions.length === 0) return;
    setEeatConverting(true);
    setEeatProgress(0);
    setEeatDone(false);

    const converted: (GenerateResponse & { toneName?: string })[] = [...versions];

    // ── 엄격한 완성도 검증 (모두 통과해야 함) ──
    const validateComplete = (content: string): { ok: boolean; reason?: string } => {
      if (!content) return { ok: false, reason: '콘텐츠 비어있음' };

      // 1. 분량 (최소 1,600자 — 80%로 축소)
      if (content.length < 1100) return { ok: false, reason: `분량 부족 (${content.length}자)` };

      // 2. H2 섹션 5개 이상
      const h2Matches = content.match(/^## /gm) || [];
      if (h2Matches.length < 5) return { ok: false, reason: `H2 부족 (${h2Matches.length}개)` };

      // 3. FAQ 섹션 명시적 존재
      const hasFaqSection = /##\s*FAQ|##\s*자주\s*묻는|##\s*질문/i.test(content);
      if (!hasFaqSection) return { ok: false, reason: 'FAQ 없음' };

      // 4. 마크다운 비교표 존재 (헤더 + 구분선)
      const hasTable = /\|.+\|.+\|\s*\n\s*\|[\s\-:|]+\|/.test(content);
      if (!hasTable) return { ok: false, reason: '비교표 없음' };

      // 5. 결론 섹션 존재
      const hasConclusion = /##\s*결론|##\s*마치며|##\s*마무리|##\s*요약/i.test(content);
      if (!hasConclusion) return { ok: false, reason: '결론 없음' };

      // 6. ⭐ 해시태그 엄격 검증 — 마지막 200자 + 줄 단위 체크
      const lastBlock = content.slice(-300);
      // 줄 단위로 #태그가 연속 등장하는 패턴 찾기 (해시태그 라인)
      const hashtagLineMatches = lastBlock.match(/(?:^|\n)\s*(#[\w가-힣]+(?:\s+#[\w가-힣]+){2,})/);
      // 또는 마지막 줄 자체가 # 으로 시작하면서 5개 이상
      const lines = content.trim().split('\n');
      const lastNonEmptyLines = lines.filter(l => l.trim().length > 0).slice(-5);
      const hashtagLineExists = lastNonEmptyLines.some(line => {
        const tags = line.match(/#[\w가-힣]+/g) || [];
        return tags.length >= 5; // 한 줄에 5개 이상의 해시태그
      });
      if (!hashtagLineMatches && !hashtagLineExists) {
        return { ok: false, reason: '해시태그 라인 없음 (최소 5개)' };
      }

      // 7. 한글 음절 잘림 검증
      const lastChar = content.trim().slice(-1);
      if (/^[ㄱ-ㅎㅏ-ㅣ]$/.test(lastChar)) return { ok: false, reason: '한글 자음 잘림' };

      // 8. ⭐ 마지막 줄이 미완성 문장이 아닌지 검증
      // 콘텐츠가 '#' 또는 '.' '다' '요' 등 정상 종결로 끝나야 함
      const lastLine = lastNonEmptyLines[lastNonEmptyLines.length - 1] || '';
      const endsWithHashtag = /#[\w가-힣]+\s*$/.test(lastLine);
      const endsWithSentence = /[.!?다요죠"】\]\)]\s*$/.test(lastLine);
      const endsWithPipe = lastLine.trim().endsWith('|'); // 표 끝
      if (!endsWithHashtag && !endsWithSentence && !endsWithPipe) {
        return { ok: false, reason: `마지막 줄 미완성 (${lastLine.slice(-30)})` };
      }

      return { ok: true };
    };

    // 변환 1회 시도 — 잘림 감지 + 부분 콘텐츠 반환
    const tryConvert = async (v: GenerateResponse & { toneName?: string }) => {
      const res = await fetch('/api/convert-eeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: v.content,
          title: v.title,
          tone: (v as { toneValue?: string }).toneValue || currentTone,
          // ⭐ Phase 2: 재구성 단계에도 series 메타 전달 → angle 유지
          seriesRole: (v as { seriesRole?: string }).seriesRole,
          seriesIntent: (v as { seriesIntent?: string }).seriesIntent,
          seriesAngle: (v as { seriesAngle?: string }).seriesAngle,
          seriesPillarCatalog: (v as { seriesPillarCatalog?: string[] }).seriesPillarCatalog,
          homepage_url: selectedProject?.homepage_url || undefined,
          blog_url: selectedProject?.blog_url || undefined,
          company_name: selectedProject?.company_name || undefined,
        }),
      });
      // 422 = 잘림 감지 → 부분 콘텐츠 반환 (이어쓰기에 활용)
      if (res.status === 422) {
        const data = await res.json();
        console.log('[E-E-A-T] 서버에서 잘림 감지 (422), 이어쓰기 모드로 전환');
        return { ...v, content: data.partialContent || '', title: v.title, _truncated: true };
      }
      if (!res.ok) return null;
      const data = await res.json();
      return {
        ...v,
        title: data.title || v.title,
        content: data.content || v.content,
        _truncated: false,
      };
    };

    // ⭐ 이어쓰기: 잘린 콘텐츠를 자동으로 마무리
    const continueContent = async (
      v: GenerateResponse & { toneName?: string },
      previousContent: string,
    ): Promise<string | null> => {
      try {
        console.log(`[E-E-A-T] 이어쓰기 요청 (${v.toneName})`);
        const res = await fetch('/api/convert-eeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: previousContent, // 이어쓰기 모드에선 content가 의미 없지만 필수
            previousContent,
            continuation: true,
            tone: (v as { toneValue?: string }).toneValue || currentTone,
            // ⭐ Phase 2: 이어쓰기에도 series 메타 전달 → 자동 보강 단계에서 카탈로그 회귀 방지
            seriesRole: (v as { seriesRole?: string }).seriesRole,
            seriesIntent: (v as { seriesIntent?: string }).seriesIntent,
            seriesAngle: (v as { seriesAngle?: string }).seriesAngle,
            seriesPillarCatalog: (v as { seriesPillarCatalog?: string[] }).seriesPillarCatalog,
            homepage_url: selectedProject?.homepage_url || undefined,
            blog_url: selectedProject?.blog_url || undefined,
            company_name: selectedProject?.company_name || undefined,
          }),
        });
        if (!res.ok && res.status !== 422) return null;
        const data = await res.json();
        const continued = data.content || data.partialContent || '';
        if (!continued) return null;
        console.log(`[E-E-A-T] 이어쓰기 완료 (${continued.length}자 추가)`);
        return continued;
      } catch (e) {
        console.log(`[E-E-A-T] 이어쓰기 실패:`, e);
        return null;
      }
    };

    // 두 콘텐츠를 자연스럽게 결합
    const mergeContent = (original: string, continued: string): string => {
      const orig = original.trim();
      const cont = continued.trim();
      // 이어쓰기 결과가 #로 시작하면 새 섹션 → 그대로 결합
      // 그렇지 않으면 줄바꿈 후 결합
      const sep = cont.startsWith('#') || cont.startsWith('|') ? '\n\n' : '\n';
      return orig + sep + cont;
    };

    // ── 개별 톤별 처리: 완성된 것은 유지, 미완성은 이어쓰기로만 보완 (재생성 절대 X) ──
    const failedSet = new Set<number>();
    for (let i = 0; i < versions.length; i++) {
      const v = versions[i];
      const originalContent = v.content || '';

      // ⭐ 1단계: 기존 콘텐츠가 이미 100% 완성되어 있는지 검증
      const initialCheck = validateComplete(originalContent);
      if (initialCheck.ok) {
        console.log(`[E-E-A-T] 톤 ${i + 1}(${v.toneName}) ✅ 이미 완성 — 그대로 유지`);
        setEeatProgress(i + 1);
        setAbVersions([...converted]);
        if (i === 0) setResult(converted[0]);
        continue;
      }

      // ⭐ 2단계: 미완성 — 기존 내용 그대로 두고 이어쓰기로만 완결 (재변환 절대 안 함)
      console.log(`[E-E-A-T] 톤 ${i + 1}(${v.toneName}) ❌ 미완성: ${initialCheck.reason} → 이어쓰기 시작`);
      let currentContent = originalContent;
      let isComplete = false;

      // ⭐ generate 단계 빈응답(< 200자) — 이어쓰기 불가 → 처음부터 새로 작성으로 복구
      if (currentContent.length < 200) {
        console.log(`[E-E-A-T] 톤 ${i + 1} 콘텐츠 너무 짧음(${currentContent.length}자) — 처음부터 새로 작성 시도`);
        const regenerated = await requestRegenerate(v);
        if (regenerated && regenerated.length >= 200) {
          console.log(`[E-E-A-T] 톤 ${i + 1} ✓ regenerate 성공 (${regenerated.length}자) — 이어쓰기 루프 진입`);
          currentContent = regenerated;
        } else {
          console.warn(`[E-E-A-T] 톤 ${i + 1} regenerate 실패 — 이어쓰기 루프 건너뜀`);
        }
      }

      // 최대 5회 이어쓰기 시도 (각 시도마다 누적)
      for (let attempt = 1; attempt <= 5; attempt++) {
        // regenerate 후에도 200자 미만이면 이어쓰기 불가 — 패스
        if (currentContent.length < 200) {
          console.log(`[E-E-A-T] 톤 ${i + 1} regenerate 후에도 짧음(${currentContent.length}자) — 이어쓰기 불가`);
          break;
        }

        console.log(`[E-E-A-T] 톤 ${i + 1} 이어쓰기 ${attempt}/5 (현재 ${currentContent.length}자)`);
        const continued = await continueContent(v, currentContent);
        if (!continued) {
          console.log(`[E-E-A-T] 톤 ${i + 1} 이어쓰기 ${attempt} 실패`);
          continue;
        }

        currentContent = mergeContent(currentContent, continued);
        const validation = validateComplete(currentContent);
        if (validation.ok) {
          console.log(`[E-E-A-T] 톤 ${i + 1} ✅ 이어쓰기로 완성 (${currentContent.length}자, ${attempt}회)`);
          isComplete = true;
          break;
        }
        console.log(`[E-E-A-T] 톤 ${i + 1} 이어쓰기 ${attempt}회 후 여전히: ${validation.reason}`);
      }

      // 이어쓰기로 늘어난 콘텐츠를 항상 저장 (완성/미완성 관계없이)
      if (currentContent.length > originalContent.length) {
        converted[i] = { ...v, content: currentContent };
      }

      if (!isComplete) {
        console.warn(`[E-E-A-T] 톤 ${i + 1}(${v.toneName}) 5회 이어쓰기 후에도 미완성 — 현재까지 누적된 내용 유지`);
        failedSet.add(i);
        setEeatFailed(new Set(failedSet));
      }

      setEeatProgress(i + 1);
      setAbVersions([...converted]);
      if (i === 0) setResult(converted[0]);
    }

    setEeatConverting(false);
    setEeatDone(true);
    setResult(converted[0]);

    // 변환 완료된 결과를 sessionStorage에 저장 (재변환 방지)
    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id && id.startsWith('session_')) {
        const raw = sessionStorage.getItem(`gr_${id}`);
        if (raw) {
          const data = JSON.parse(raw);
          data.result = { ...converted[0], abVersions: converted };
          sessionStorage.setItem(`gr_${id}`, JSON.stringify(data));
        }
      }
    } catch {}
  };

  const autoTag = (category: ContentCategory | null): string => {
    const tagMap: Record<string, string> = {
      blog: '블로그',
      product: '제품소개',
      faq: 'FAQ',
      howto: '가이드',
      landing: '랜딩',
      technical: '기술문서',
      social: 'SNS',
      email: '이메일',
    };
    return category ? tagMap[category] || '콘텐츠' : '콘텐츠';
  };

  const categoriesLoaded = useRef(false);

  const handleOpenBlogPublish = async () => {
    setShowBlogPublish(true);
    setPublishSuccess(false);
    // 자동 태그 설정
    if (!blogTag) {
      setBlogTag(autoTag(selectedCategory));
    }
    // 자동 요약 생성 (콘텐츠 첫 150자)
    if (result && !blogSummary) {
      const plain = result.content.replace(/[#*>\-|`]/g, '').replace(/\n+/g, ' ').trim();
      setBlogSummary(plain.slice(0, 150) + (plain.length > 150 ? '...' : ''));
    }
    // 카테고리: localStorage에 없으면 DB에서 로드
    if (!categoriesLoaded.current && blogCategories.length === 0) {
      try {
        const cats = await getBlogCategories();
        if (cats.length > 0) setBlogCategories(cats);
      } catch {
        // 로드 실패 시 기본값 유지
      }
      categoriesLoaded.current = true;
    }
  };

  const handlePublishToBlog = async () => {
    if (!result) return;
    if (!selectedBlogCategory) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    setIsPublishing(true);
    try {
      // 발행 시 활성 언어를 metadata.lang에 박아 블로그 카테고리 페이지에서 언어 탭 자동 분류 가능
      const metaWithLang: Record<string, unknown> = {
        ...((result.metadata as unknown as Record<string, unknown>) || {}),
        lang: activeLang,
      };
      const postId = await saveBlogPost({
        title: result.title,
        content: result.content,
        summary: blogSummary,
        category: selectedBlogCategory,
        tag: blogTag,
        hashtags: result.hashtags || [],
        metadata: metaWithLang,
        targetKeyword: targetKeyword,
        historyId: currentHistoryId || '',
      });
      console.log('Blog post saved:', postId);
      setPublishSuccess(true);
      setTimeout(() => {
        setShowBlogPublish(false);
        setPublishSuccess(false);
        router.push('/blog');
      }, 1500);
    } catch (err) {
      console.error('publish error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      alert('게시 실패: ' + msg);
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishSelectedToBlog = async () => {
    const selectedIdxs = Array.from(selectedVersions).sort((a, b) => a - b);
    // 활성 언어가 비한국어면 번역본을 우선 발행. 번역 없는 톤은 제외.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const versionsToPublish = selectedIdxs.map(i => {
      const v = abVersions[i];
      if (!v) return null;
      if (activeLang === 'ko') return { ...v, _idx: i };
      const trans = translatedVersions[activeLang]?.[i];
      if (!trans) return null; // 번역 없으면 skip
      return { ...v, title: trans.title, content: trans.content, _idx: i };
    }).filter(Boolean) as ((typeof abVersions[number]) & { _idx: number })[];
    if (versionsToPublish.length === 0) {
      alert(activeLang !== 'ko' ? '선택한 톤들에 번역본이 없습니다.' : '선택된 버전이 없습니다.');
      return;
    }
    setIsPublishing(true);
    try {
      const posts = versionsToPublish.map((v) => {
        const plain = v.content.replace(/[#*>\-|`]/g, '').replace(/\n+/g, ' ').trim();
        return {
          title: v.title,
          content: v.content,
          summary: plain.slice(0, 150) + (plain.length > 150 ? '...' : ''),
          category: selectedBlogCategory,
          tag: blogTag || (v as { toneName?: string }).toneName || '',
          hashtags: v.hashtags || [],
          metadata: {
            ...((v.metadata as unknown as Record<string, unknown>) || {}),
            lang: activeLang, // ⭐ 언어 태그 — 카테고리 페이지에서 언어 탭 자동 분류
          },
          targetKeyword: targetKeyword,
          historyId: currentHistoryId || '',
        };
      });
      if (posts.length === 1) {
        const id = await saveBlogPost(posts[0]);
        console.log('Blog post saved:', id);
      } else {
        const ids = await saveBlogPostsBatch(posts);
        console.log('Blog posts saved:', ids);
      }
      // SNS 배포
      if (snsDistribute && makeWebhookUrl && snsChannels.size > 0) {
        try {
          localStorage.setItem('make_webhook_url', makeWebhookUrl);
          const distRes = await fetch('/api/blog/distribute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              posts: posts.map(p => ({ title: p.title, content: p.content, summary: p.summary, hashtags: p.hashtags, category: p.category })),
              webhookUrl: makeWebhookUrl,
              channels: Array.from(snsChannels),
            }),
          });
          const distData = await distRes.json();
          setDistributeResult(`SNS 배포: ${distData.sent || 0}건 전송 완료`);
        } catch (e) {
          console.error('SNS distribute error:', e);
          setDistributeResult('SNS 배포 중 오류 발생 (블로그 게시는 완료)');
        }
      }
      setPublishSuccess(true);
      setTimeout(() => {
        setShowBlogPublish(false);
        setPublishSuccess(false);
        setDistributeResult(null);
        router.push('/blog');
      }, 2000);
    } catch (err) {
      console.error('publish error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      alert('게시 실패: ' + msg);
    } finally {
      setIsPublishing(false);
    }
  };

  const [categoryError, setCategoryError] = useState<string | null>(null);

  // 🚀 논스톱 자동 발행 — 한국어 → 영어 → 중국어 → 일본어 순차 처리 (API 과부하 회피)
  // 흐름: 한국어 발행 → 영어 번역·발행 → 중국어 번역·발행 → 일본어 번역·발행 → 팝업
  const runAutoPilotPublish = async () => {
    if (autoPilotPhase !== 'idle' && autoPilotPhase !== 'done') return;
    if (abVersions.length === 0) {
      alert('발행할 콘텐츠가 없습니다.');
      return;
    }

    // 카테고리 자동 결정 — 프로젝트 기준 매칭 + 폴백 다단계
    let cats = blogCategories;
    if (cats.length === 0) {
      try { cats = await getBlogCategories(); } catch {}
    }

    // 프로젝트 이름 다중 소스에서 수집 (selectedProject 컨텍스트 미로드 시 sessionStorage 폴백)
    let projectName = selectedProject?.name || '';
    if (!projectName && typeof window !== 'undefined') {
      // sessionStorage 'geoaio_project' (UserProvider가 사용하는 정확한 키)
      try {
        const raw = sessionStorage.getItem('geoaio_project');
        if (raw) {
          const p = JSON.parse(raw);
          projectName = p?.name || '';
        }
      } catch {}
    }
    // 그래도 없으면 user_projects에서 직접 조회 — 컨텍스트 늦게 로드되는 케이스 대비
    if (!projectName && typeof window !== 'undefined') {
      try {
        const r = await fetch('/api/user-projects', { cache: 'no-store' });
        if (r.ok) {
          const j = await r.json();
          const list = (j?.projects || []) as Array<{ name?: string; selected?: boolean }>;
          const sel = list.find(p => p.selected) || list[0];
          if (sel?.name) projectName = sel.name;
        }
      } catch {}
    }

    // ContentCategory enum (콘텐츠 형식) — 카테고리로 들어가면 안 됨. 폴백 버그 차단.
    const CONTENT_FORMAT_TYPES = new Set(['blog','product','faq','howto','landing','technical','social','email','case','video']);

    const computeCategory = (): string => {
      // 0순위: generate 페이지에서 사용자가 명시한 categoryChoice
      // - 수동 선택 + manualSlug 있으면 그대로 사용 (예: 'AI선거솔루션' 프로젝트로 작업하지만 '허태정-대전시장-후보자'로 저장)
      // - 자동 매칭이면 projectName으로부터 매칭 (아래 2순위 로직과 동일하지만 명시적 의도 표시)
      if (categoryChoice.mode === 'manual' && categoryChoice.manualSlug && !CONTENT_FORMAT_TYPES.has(categoryChoice.manualSlug)) {
        return categoryChoice.manualSlug;
      }
      if (categoryChoice.mode === 'auto' && projectName) {
        const auto = autoMatchCategory(projectName, cats);
        if (auto && !CONTENT_FORMAT_TYPES.has(auto)) return auto;
      }
      // 1순위: 사용자가 발행 모달에서 명시 선택한 카테고리
      if (selectedBlogCategory && !CONTENT_FORMAT_TYPES.has(selectedBlogCategory)) return selectedBlogCategory;
      // 2순위: 프로젝트명 기반 매칭 (categoryChoice 미설정·auto 폴백)
      if (projectName) {
        // 2-1) 프로젝트명에 카테고리 슬러그/라벨이 포함되는지 (정확 매칭 우선)
        const exact = cats.find(c => projectName.includes(c.label) || projectName.includes(c.slug));
        if (exact) return exact.slug;
        // 2-2) 프로젝트명 첫 단어가 기존 카테고리 슬러그/라벨에 포함되는지
        const firstWord = projectName.split(/[\s·_\-/]+/)[0];
        if (firstWord && firstWord.length >= 3) {
          const partial = cats.find(c => c.label.includes(firstWord) || c.slug.includes(firstWord));
          if (partial) return partial.slug;
        }
        // 2-3) 매칭 없음 — 프로젝트명 그대로 슬러그화 (공백 → '-')
        const slugified = projectName.trim().replace(/\s+/g, '-');
        if (slugified && slugified.length >= 2 && !CONTENT_FORMAT_TYPES.has(slugified)) return slugified;
      }
      // 3순위: 빈 문자열 — 도메인 카테고리(selectedCategory)로 폴백하면 60건 오저장 사고 재발
      // → 빈 값 반환 시 아래 prompt 또는 차단 동작
      return '';
    };
    let category = computeCategory();
    console.log('[autopilot] 카테고리 자동 결정:', {
      projectName,
      category,
      selectedBlogCategory,
      selectedProjectName: selectedProject?.name,
      catsCount: cats.length,
    });

    // 카테고리 결정 실패 시 사용자에게 prompt — 도메인 카테고리 자동 폴백 차단
    if (!category) {
      const userInput = window.prompt(
        '발행할 카테고리를 입력하세요.\n\n프로젝트 이름이 자동 인식되지 않았습니다.\n예: 허태정-대전시장-후보자',
        projectName || ''
      );
      if (!userInput) {
        alert('카테고리 미선택 — 자동 발행 취소');
        setAutoPilotPhase('idle');
        return;
      }
      category = userInput.trim();
    }
    // 최종 안전장치 — 콘텐츠 형식이 카테고리로 박히는 폴백 사고 차단
    if (CONTENT_FORMAT_TYPES.has(category)) {
      alert(`카테고리 "${category}"는 콘텐츠 형식 식별자입니다. 프로젝트명/카테고리명으로 다시 선택하세요.`);
      setAutoPilotPhase('idle');
      return;
    }

    setAutoPilotResult(null);
    setAutoPilotProgress({ ko: 0, en: 0, zh: 0, ja: 0 });
    const counts = { ko: 0, en: 0, zh: 0, ja: 0 };

    // 한 언어를 발행하는 헬퍼 — abVersions 또는 translatedVersionsRef.current에서 빌드
    const publishLanguage = async (lang: Lang): Promise<number> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const posts: any[] = [];
      abVersions.forEach((v, i) => {
        let title = v.title;
        let content = v.content;
        if (lang !== 'ko') {
          const trans = translatedVersionsRef.current[lang]?.[i];
          if (!trans) return; // 번역 없는 톤은 skip
          title = trans.title;
          content = trans.content;
        }
        if (!content || content.length < 200) return;
        const plain = content.replace(/[#*>\-|`]/g, '').replace(/\n+/g, ' ').trim();
        posts.push({
          title,
          content,
          summary: plain.slice(0, 150) + (plain.length > 150 ? '...' : ''),
          category,
          tag: blogTag || (v as { toneName?: string }).toneName || '',
          hashtags: v.hashtags || [],
          metadata: {
            ...((v.metadata as unknown as Record<string, unknown>) || {}),
            lang,
            seriesRole: (v as { seriesRole?: string }).seriesRole,
            seriesIntent: (v as { seriesIntent?: string }).seriesIntent,
            seriesAngle: (v as { seriesAngle?: string }).seriesAngle,
          },
          targetKeyword: targetKeyword,
          historyId: currentHistoryId || '',
        });
      });
      if (posts.length === 0) return 0;
      await saveBlogPostsBatch(posts);
      return posts.length;
    };

    // 사용자가 generate 페이지에서 선택한 번역 언어 — 선택 안 된 언어는 skip
    let publishOpts: PublishOptions = DEFAULT_PUBLISH_OPTIONS;
    try {
      const raw = sessionStorage.getItem(PUBLISH_OPTIONS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.repeatCount === 'number' && Array.isArray(parsed?.translationLangs)) {
          publishOpts = parsed;
        }
      }
    } catch {}
    const enabledLangs = new Set(publishOpts.translationLangs);
    console.log('[autopilot] 선택된 번역 언어:', Array.from(enabledLangs));

    try {
      // 1) 한국어 발행 (항상 발행)
      setAutoPilotPhase('publishing-ko');
      counts.ko = await publishLanguage('ko');
      setAutoPilotProgress(prev => ({ ...prev, ko: counts.ko }));

      // 2) 영어 — 선택된 경우만
      if (enabledLangs.has('en')) {
        setAutoPilotPhase('translating-en');
        await startTranslation('en');
        await new Promise(r => setTimeout(r, 200));
        setAutoPilotPhase('publishing-en');
        counts.en = await publishLanguage('en');
        setAutoPilotProgress(prev => ({ ...prev, en: counts.en }));
      }

      // 3) 중국어 — 선택된 경우만
      if (enabledLangs.has('zh')) {
        setAutoPilotPhase('translating-zh');
        await startTranslation('zh');
        await new Promise(r => setTimeout(r, 200));
        setAutoPilotPhase('publishing-zh');
        counts.zh = await publishLanguage('zh');
        setAutoPilotProgress(prev => ({ ...prev, zh: counts.zh }));
      }

      // 4) 일본어 — 선택된 경우만
      if (enabledLangs.has('ja')) {
        setAutoPilotPhase('translating-ja');
        await startTranslation('ja');
        await new Promise(r => setTimeout(r, 200));
        setAutoPilotPhase('publishing-ja');
        counts.ja = await publishLanguage('ja');
        setAutoPilotProgress(prev => ({ ...prev, ja: counts.ja }));
      }

      // 5) 완료
      const total = counts.ko + counts.en + counts.zh + counts.ja;
      setAutoPilotResult({ ...counts, total, category });
      setAutoPilotPhase('done');

      // 6) 자동 반복 진행 — 다음 회차로 redirect (또는 종료)
      const run = readAutopilotRun();
      if (run.isRunning) {
        const newPublishedTotal = run.publishedTotal + total;
        if (run.currentRepeat < run.totalRepeats) {
          // 다음 회차 — generate 페이지로 redirect (?autoNext=true)
          writeAutopilotRun({ ...run, currentRepeat: run.currentRepeat + 1, publishedTotal: newPublishedTotal });
          console.log(`[autopilot] ${run.currentRepeat}/${run.totalRepeats}회차 완료 (${total}편 발행). 다음 회차로 이동…`);
          setTimeout(() => { router.push('/generate?autoNext=true'); }, 2500);
        } else {
          // 모든 회차 완료
          writeAutopilotRun({ ...run, isRunning: false, publishedTotal: newPublishedTotal });
          console.log(`[autopilot] 🏁 전체 ${run.totalRepeats}회차 완료. 누적 ${newPublishedTotal}편 발행.`);
          // sessionStorage는 그대로 두고 isRunning만 false (사용자가 결과 확인 후 클리어)
          setTimeout(() => clearAutopilotRun(), 5000);
        }
      }
    } catch (err) {
      console.error('autopilot publish error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(`자동 발행 실패 (단계: ${autoPilotPhase}): ${msg}\n현재까지 발행된 편: 한 ${counts.ko} · 영 ${counts.en} · 중 ${counts.zh} · 일 ${counts.ja}`);
      setAutoPilotPhase('idle');
    }
  };

  const labelToSlug = (label: string) => {
    return label.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9가-힣\-]/g, '') || `cat-${Date.now()}`;
  };

  const handleAddCategory = () => {
    const label = newCategoryLabel.trim();
    if (!label) {
      setCategoryError('카테고리 이름을 입력하세요.');
      return;
    }
    const slug = labelToSlug(label);
    if (blogCategories.find(c => c.slug === slug)) {
      setCategoryError('이미 존재하는 카테고리입니다.');
      return;
    }
    setCategoryError(null);
    const extraColors = ['from-rose-500 to-pink-600','from-cyan-500 to-blue-600','from-lime-500 to-green-600','from-fuchsia-500 to-purple-600','from-orange-500 to-red-600'];
    const newCat: BlogCategory = {
      id: `custom-${Date.now()}`,
      slug,
      label,
      description: '',
      color: extraColors[blogCategories.length % extraColors.length],
      icon: 'document',
      sortOrder: blogCategories.length,
    };
    setBlogCategories(prev => [...prev, newCat]);
    setSelectedBlogCategory(slug);
    setShowNewCategory(false);
    setNewCategoryLabel('');
  };

  const handleDeleteCategory = (_catId: string, catSlug: string) => {
    if (!confirm('이 카테고리를 삭제하시겠습니까?')) return;
    setBlogCategories(prev => {
      const updated = prev.filter(c => c.slug !== catSlug);
      if (selectedBlogCategory === catSlug && updated.length > 0) {
        setSelectedBlogCategory(updated[0].slug);
      }
      return updated;
    });
  };

  const handleSnsConvert = async (channel: string) => {
    if (!result?.content) return;
    setSnsChannel(channel);
    setSnsLoading(true);
    setSnsResult(null);
    try {
      const res = await fetch('/api/convert-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: result.content, channel, title: result.title }),
      });
      if (!res.ok) throw new Error('변환 실패');
      const data = await res.json();
      setSnsResult(data.result);
    } catch {
      setSnsResult('변환 중 오류가 발생했습니다.');
    } finally {
      setSnsLoading(false);
    }
  };

  const handleCopySns = async () => {
    if (!snsResult) return;
    await navigator.clipboard.writeText(snsResult);
    setSnsCopied(true);
    setTimeout(() => setSnsCopied(false), 2000);
  };

  const handleCopyTitle = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.title);
    setCopiedTitle(true);
    setTimeout(() => setCopiedTitle(false), 2000);
  };

  const handleCopy = async () => {
    if (!contentRef.current) return;
    try {
      const htmlBlob = new Blob([contentRef.current.innerHTML], { type: 'text/html' });
      const textBlob = new Blob([contentRef.current.innerText], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob,
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (contentRef.current) {
        await navigator.clipboard.writeText(contentRef.current.innerText);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyAsImage = async () => {
    if (!contentRef.current) return;
    setIsCapturing(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2000);
      } catch {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `content-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2000);
      }
    } catch (err) {
      console.error('Image capture error:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedCategory || !result || !editNotes.trim()) return;
    setIsRegenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          topic: topic.trim(),
          targetKeyword: targetKeyword.trim() || undefined,
          tone,
          additionalNotes: `기존 생성된 콘텐츠를 아래 수정 요청에 따라 다시 작성해주세요.\n\n[수정/추가 요청]\n${editNotes.trim()}\n\n[기존 콘텐츠]\n${result.content}`,
          homepage_url: selectedProject?.homepage_url || undefined,
          blog_url: selectedProject?.blog_url || undefined,
          company_name: selectedProject?.company_name || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '콘텐츠 재생성에 실패했습니다.');
      }

      const data = await response.json();
      setResult(data);
      // Supabase에 업데이트
      const params = new URLSearchParams(window.location.search);
      const resultId = params.get('id');
      if (resultId) {
        await saveGenerateResult({
          result: data,
          category: selectedCategory!,
          topic,
          targetKeyword,
          tone,
          historyId: currentHistoryId || '',
        });
      }
      // 수정 이력 저장
      if (currentHistoryId) {
        const now = new Date();
        await addRevision(currentHistoryId, {
          id: generateId(),
          date: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
          editNotes: editNotes.trim(),
          result: data,
        });
      }
      setEditNotes('');
      setShowEditInput(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleGenerateImages = async () => {
    if (!result) return;
    setIsGeneratingImages(true);
    setImageError(null);
    try {
      const geminiKey = (await (await import('@/lib/supabase-storage')).getApiKey('gemini')) || '';
      const response = await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: result.content, title: result.title, geminiApiKey: geminiKey }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '이미지 생성에 실패했습니다.');
      }
      const data = await response.json();
      if (currentHistoryId && data.images) {
        const uploadedUrls = await Promise.all(
          data.images.map((img: string) => uploadImage(currentHistoryId, img, result.title))
        );
        setGeneratedImages(uploadedUrls);
      } else {
        setGeneratedImages(data.images);
      }
    } catch (err) {
      setImageError(err instanceof Error ? err.message : '이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const parseTable = (block: string): string => {
    const lines = block.trim().split('\n').filter(l => l.trim().startsWith('|'));
    if (lines.length < 2) return '';
    const parseCells = (line: string) =>
      line.split('|').slice(1, -1).map(c => c.trim());
    const headers = parseCells(lines[0]);
    const startIdx = /^[\s|:-]+$/.test(lines[1]) ? 2 : 1;
    const rows = lines.slice(startIdx).map(parseCells);
    // 헤드 글씨는 진한 빨강(#dc2626) — 보라 그라데이션 배경이 복사 시 사라져도
    // 흰 배경에서도 잘 보이게 보장 (사용자가 외부 에디터로 붙여넣을 때 가독성 확보)
    const thStyle = 'padding:10px 16px;text-align:left;font-weight:700;font-size:0.85em;color:#dc2626;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:1px solid #818cf8;white-space:nowrap;text-shadow:0 1px 2px rgba(255,255,255,0.5)';
    const tdBaseStyle = 'padding:10px 16px;font-size:0.85em;border:1px solid #e5e7eb;color:#374151';
    let html = '<table style="width:100%;border-collapse:collapse;margin:20px 0;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">';
    html += '<thead><tr>' + headers.map(h => `<th style="${thStyle}">${h.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</th>`).join('') + '</tr></thead>';
    html += '<tbody>';
    rows.forEach((row, i) => {
      const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
      html += '<tr>' + row.map(cell => `<td style="${tdBaseStyle};background:${bg}">${cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</td>`).join('') + '</tr>';
    });
    html += '</tbody></table>';
    return html;
  };

  const markdownToHtml = (text: string) => {
    const paragraphs = text.split(/\n\n+/);
    let h2Index = 0;
    const sectionColors = [
      { bg: '#eef2ff', border: '#818cf8', accent: '#4f46e5' },
      { bg: '#ecfdf5', border: '#6ee7b7', accent: '#059669' },
      { bg: '#fef3c7', border: '#fbbf24', accent: '#d97706' },
      { bg: '#fce7f3', border: '#f9a8d4', accent: '#db2777' },
      { bg: '#e0e7ff', border: '#a5b4fc', accent: '#4338ca' },
      { bg: '#f0fdf4', border: '#86efac', accent: '#16a34a' },
    ];
    return paragraphs.map(para => {
      const lines = para.trim().split('\n');
      if (lines.length >= 2 && lines[0].trim().startsWith('|') && lines[1].trim().startsWith('|')) {
        return parseTable(para);
      }
      let html = para;
      // H2 with colored accent bar
      html = html.replace(/^## (.*$)/gm, (_match, title) => {
        const color = sectionColors[h2Index % sectionColors.length];
        h2Index++;
        return `<div style="margin:28px 0 12px;padding:10px 16px;background:${color.bg};border-left:4px solid ${color.border};border-radius:0 10px 10px 0"><h2 style="font-size:1.1em;font-weight:700;color:${color.accent};margin:0">${title}</h2></div>`;
      });
      // H3 with subtle style
      html = html
        .replace(/^### (.*$)/gm, '<h3 style="font-size:1.05em;font-weight:700;color:#374151;margin:24px 0 8px;padding-left:12px;border-left:3px solid #c7d2fe">$1</h3>')
        .replace(/^# (.*$)/gm, '<h1 style="font-size:1.5em;font-weight:800;background:linear-gradient(135deg,#4f46e5,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:32px 0 16px">$1</h1>')
        // 마크다운 링크 [text](url) → <a> (이미지 ![]() 패턴은 제외)
        .replace(/(^|[^!])\[([^\]]+)\]\(([^)\s]+)\)/g, '$1<a href="$3" target="_blank" rel="noopener noreferrer" style="color:#4f46e5;text-decoration:underline;font-weight:500;word-break:break-all">$2</a>')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#1e293b">$1</strong>')
        .replace(/^\- (.*$)/gm, '<li style="margin-left:20px;list-style:none;margin-bottom:6px;padding-left:8px;position:relative"><span style="position:absolute;left:-14px;color:#6366f1;font-weight:bold">&#8226;</span>$1</li>')
        .replace(/^\d+\. (.*$)/gm, '<li style="margin-left:20px;list-style:decimal;margin-bottom:6px;padding-left:4px;color:#374151">$1</li>')
        .replace(/^> (.*$)/gm, '<blockquote style="border-left:4px solid #818cf8;padding:12px 20px;margin:16px 0;background:linear-gradient(135deg,#eef2ff,#e0e7ff);border-radius:0 12px 12px 0;color:#374151;font-style:italic">$1</blockquote>');
      const trimmed = html.trim();
      const isBlock = /^<(h[1-6]|li|blockquote|ul|ol|figure|div|table)/.test(trimmed);
      if (isBlock) return html;
      html = html.replace(/\n/g, '<br>');
      return `<p style="margin-bottom:1em;line-height:1.9;color:#374151">${html}</p>`;
    }).join('');
  };

  const handleApplyImages = () => {
    if (!result || generatedImages.length === 0) return;

    const lines = result.content.split('\n');
    const headingIndices: number[] = [];
    lines.forEach((line, i) => {
      if (/^#{1,3}\s/.test(line)) headingIndices.push(i);
    });

    let insertPositions: number[];
    if (headingIndices.length >= 4) {
      const mid = Math.floor(headingIndices.length / 2);
      insertPositions = [
        headingIndices[1],
        headingIndices[mid],
        headingIndices[headingIndices.length - 1],
      ];
    } else {
      const step = Math.floor(lines.length / (generatedImages.length + 1));
      insertPositions = generatedImages.map((_, i) => step * (i + 1));
    }

    insertPositions = [...new Set(insertPositions)].sort((a, b) => a - b);

    const imageLabels = ['핵심 요약 인포그래픽', '프로세스 인포그래픽', '데이터 인포그래픽'];
    const imageTags = generatedImages.map((img, i) =>
      `\n<figure style="text-align:center;margin:32px 0"><img src="${img}" alt="${imageLabels[i] || `인포그래픽 ${i+1}`}" style="width:100%;max-width:720px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1)" /><figcaption style="font-size:0.85em;color:#6b7280;margin-top:8px">${imageLabels[i] || `인포그래픽 ${i+1}`}</figcaption></figure>\n`
    );

    const resultLines: string[] = [];
    let imgIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      if (imgIdx < insertPositions.length && i === insertPositions[imgIdx]) {
        resultLines.push(imageTags[imgIdx] || '');
        imgIdx++;
      }
      resultLines.push(lines[i]);
    }
    while (imgIdx < imageTags.length) {
      resultLines.push(imageTags[imgIdx]);
      imgIdx++;
    }

    const mergedContent = resultLines.join('\n');
    const html = markdownToHtml(mergedContent);

    let fullHtml = `<h1 style="font-size:1.8em;font-weight:bold;color:#1a1a1a;margin-bottom:16px">${result.title}</h1>\n${html}`;
    if (result.hashtags && result.hashtags.length > 0) {
      const tags = result.hashtags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ');
      fullHtml += `\n<p style="margin-top:24px;color:#6366f1;font-size:0.9em">${tags}</p>`;
    }

    setFinalContentHtml(fullHtml);
    setShowFinalContent(true);
  };

  const handleCopyFinalContent = async () => {
    if (!finalContentRef.current) return;
    try {
      const htmlBlob = new Blob([finalContentRef.current.innerHTML], { type: 'text/html' });
      const textBlob = new Blob([finalContentRef.current.innerText], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob,
        }),
      ]);
      setCopiedFinal(true);
      setTimeout(() => setCopiedFinal(false), 2000);
    } catch {
      await navigator.clipboard.writeText(finalContentRef.current.innerText);
      setCopiedFinal(true);
      setTimeout(() => setCopiedFinal(false), 2000);
    }
  };

  const handleReset = () => {
    router.push('/generate');
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 relative">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
          <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        showApiKeyButton
        onToggleApiKey={() => setShowApiKeyInput(!showApiKeyInput)}
        apiKeyOpen={showApiKeyInput}
      />
      <ApiKeyPanel visible={showApiKeyInput} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* 에러 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* E-E-A-T 자동 변환 진행 바 (1개씩 순차) */}
        {eeatConverting && (
          <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-4">
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-5 h-5 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-indigo-700">
                  E-E-A-T 검증·보완 중: <span className="text-indigo-900">{abVersions[eeatProgress]?.toneName || '...'}</span>
                  <span className="text-xs text-indigo-400 ml-2">({eeatProgress}/{abVersions.length})</span>
                </p>
                <p className="text-xs text-indigo-400 mt-0.5">이미 완성된 톤은 그대로 유지 · 미완성만 이어쓰기로 보완</p>
              </div>
              <span className="text-sm font-bold text-indigo-600">{Math.round((eeatProgress / Math.max(abVersions.length, 1)) * 100)}%</span>
            </div>
            <div className="w-full bg-indigo-100 rounded-full h-2 mb-3">
              <div
                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-colors duration-500"
                style={{ width: `${(eeatProgress / Math.max(abVersions.length, 1)) * 100}%` }}
              />
            </div>
            {/* 톤별 상태 표시 */}
            <div className="flex flex-wrap gap-1.5">
              {abVersions.map((v, i) => {
                const isDone = i < eeatProgress;
                const isActive = i === eeatProgress;
                const isFailed = eeatFailed.has(i);
                return (
                  <span
                    key={i}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      isFailed
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : isDone
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isActive
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300 animate-pulse'
                        : 'bg-gray-50 text-gray-400 border-gray-200'
                    }`}
                  >
                    {isFailed ? '⚠ ' : isDone ? '✓ ' : isActive ? '◌ ' : ''}{v.toneName || `톤 ${i + 1}`}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        {eeatDone && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium text-emerald-700">E-E-A-T 7단계 변환 완료 — 10개 톤 모두 구조화됐습니다</p>
          </div>
        )}

        {/* 블로그 게시 버튼 — 최상단 (언어 탭 위) */}
        <div className="bg-white rounded-xl shadow-sm border border-rose-200 overflow-hidden">
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 px-5 py-2 border-b border-rose-200">
            <h3 className="text-sm font-bold text-rose-800 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
              블로그 자동 게시
            </h3>
          </div>
          <div className="p-4">
            <p className="text-xs text-gray-500 mb-3">생성된 콘텐츠를 블로그 페이지에 바로 게시합니다. 카테고리를 선택하면 해당 탭에 자동으로 분류됩니다.</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleOpenBlogPublish}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors duration-200 border bg-gradient-to-r from-rose-500 to-pink-500 text-white border-rose-300 hover:from-rose-600 hover:to-pink-600 hover:shadow-lg hover:scale-105 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                블로그에 게시하기
              </button>
              <button
                onClick={() => {
                  // localStorage가 어떤 이유로 사라져도 URL로 추천 주제 복원 보장 (붙박이)
                  let url = '/generate';
                  try {
                    const cached = localStorage.getItem('cep:suggestedTopics');
                    if (cached) {
                      const b64 = btoa(unescape(encodeURIComponent(cached)));
                      url = `/generate?cep_topics_b64=${b64}`;
                    }
                  } catch {}
                  router.push(url);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors duration-200 border bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-purple-300 hover:from-purple-600 hover:to-indigo-600 hover:shadow-lg hover:scale-105 shadow-sm"
                title="추천 주제 페이지로 돌아가서 다른 주제 선택"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                📝 다른 주제로 또 생성
              </button>
            </div>
          </div>
        </div>

        {/* 언어 탭 — 한국어 기본, 영/중/일 클릭 시 1회 번역 + 캐시 */}
        {abVersions.length > 0 && (() => {
          const LANGS: { key: Lang; label: string; sub: string }[] = [
            { key: 'ko', label: '한국어', sub: 'KO' },
            { key: 'en', label: 'English', sub: 'EN' },
            { key: 'zh', label: '中文', sub: 'ZH' },
            { key: 'ja', label: '日本語', sub: 'JA' },
          ];
          const cachedCount = (l: Lang) => Object.keys(translatedVersions[l] || {}).length;
          return (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-gradient-to-r from-emerald-700 to-teal-800 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-200 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <p className="text-sm font-bold text-white">출력 언어</p>
                {translatingLang && (
                  <span className="ml-3 text-[11px] text-emerald-100">
                    번역 중 ({translateProgress}/{abVersions.length})
                  </span>
                )}
                <span className="ml-auto px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/15 text-emerald-100 border border-white/20">
                  {LANGS.find(l => l.key === activeLang)?.label || '한국어'}
                </span>
              </div>
              <div className="p-3 grid grid-cols-4 gap-2">
                {LANGS.map(l => {
                  const isActive = activeLang === l.key;
                  const isLoading = translatingLang === l.key;
                  const cached = l.key === 'ko' ? abVersions.length : cachedCount(l.key);
                  return (
                    <button
                      key={l.key}
                      onClick={() => handleLangClick(l.key)}
                      disabled={isLoading}
                      className={`relative flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                      } disabled:opacity-60 disabled:cursor-wait`}
                    >
                      <span>{l.label}</span>
                      <span className={`text-[10px] ${isActive ? 'text-emerald-100' : 'text-emerald-500'}`}>
                        {l.key === 'ko'
                          ? '원본'
                          : cached === abVersions.length
                          ? '✓ 번역됨'
                          : isLoading
                          ? `번역 중... ${translateProgress}/${abVersions.length}`
                          : cached > 0
                          ? `${cached}/${abVersions.length} 번역됨`
                          : '클릭 시 번역'}
                      </span>
                      {isLoading && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* 톤 버전 탭 */}
        {abVersions.length > 1 && (() => {
          const TONE_COLORS = [
            { idle: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100', active: 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-200', dot: 'bg-indigo-400' },
            { idle: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100', active: 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-200', dot: 'bg-emerald-400' },
            { idle: 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100', active: 'bg-rose-600 border-rose-600 text-white shadow-rose-200', dot: 'bg-rose-400' },
            { idle: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100', active: 'bg-amber-500 border-amber-500 text-white shadow-amber-200', dot: 'bg-amber-400' },
            { idle: 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100', active: 'bg-violet-600 border-violet-600 text-white shadow-violet-200', dot: 'bg-violet-400' },
            { idle: 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100', active: 'bg-sky-600 border-sky-600 text-white shadow-sky-200', dot: 'bg-sky-400' },
            { idle: 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100', active: 'bg-teal-600 border-teal-600 text-white shadow-teal-200', dot: 'bg-teal-400' },
            { idle: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100', active: 'bg-orange-500 border-orange-500 text-white shadow-orange-200', dot: 'bg-orange-400' },
            { idle: 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100', active: 'bg-cyan-600 border-cyan-600 text-white shadow-cyan-200', dot: 'bg-cyan-400' },
            { idle: 'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100', active: 'bg-pink-600 border-pink-600 text-white shadow-pink-200', dot: 'bg-pink-400' },
          ];
          return (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              {/* 헤더 */}
              <div className="px-5 py-3 bg-gradient-to-r from-slate-800 to-indigo-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <p className="text-sm font-bold text-white">톤/스타일 버전 선택</p>
                <span className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (selectedVersions.size === abVersions.length) {
                        setSelectedVersions(new Set([activeAbTab]));
                      } else {
                        setSelectedVersions(new Set(abVersions.map((_, i) => i)));
                      }
                    }}
                    className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/20 text-white hover:bg-white/30 transition-colors"
                  >
                    {selectedVersions.size === abVersions.length ? '선택 해제' : '전체 선택'}
                  </button>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/15 text-indigo-200 border border-white/20">
                    {selectedVersions.size}/{abVersions.length} 선택
                  </span>
                </span>
              </div>
              {/* 탭 그리드 */}
              <div className="p-3 grid grid-cols-5 gap-2">
                {abVersions.map((v, i) => {
                  const color = TONE_COLORS[i % TONE_COLORS.length];
                  const isViewing = activeAbTab === i;
                  const isChecked = selectedVersions.has(i);
                  // 변환 완료 여부 (변환 중이면 i < eeatProgress, 변환 끝났으면 모두 가능)
                  const isReady = eeatDone || !eeatConverting || i < eeatProgress;
                  const isConverting = eeatConverting && i === eeatProgress;
                  // 1차 생성 실패 판정 — content가 너무 짧거나 fallback 메시지(생성 실패/오류)면 비활성화
                  const isFailed = !v?.content || (typeof v.content === 'string' && (v.content.length < 200 || /생성\s*(실패|오류)/.test(v.content)));
                  // ⭐ 비한국어 탭 활성 시 — 번역 성공한 톤만 클릭 가능. 실패·미번역은 비활성화.
                  const noTranslation = activeLang !== 'ko' && !translatedVersions[activeLang]?.[i];
                  const isTranslating = translatingLang === activeLang && noTranslation && !translationFailed[activeLang]?.has(i);
                  const transFailed = translationFailed[activeLang]?.has(i);
                  const isDisabled = !isReady || isFailed || noTranslation;
                  return (
                    <button
                      key={i}
                      disabled={isDisabled}
                      title={
                        isFailed ? '생성 실패 — 선택 불가'
                        : !isReady ? (isConverting ? '변환 중...' : '변환 대기 중')
                        : transFailed ? `${activeLang.toUpperCase()} 번역 실패 — 선택 불가 (한국어 원문)`
                        : isTranslating ? `${activeLang.toUpperCase()} 번역 중...`
                        : noTranslation ? `${activeLang.toUpperCase()} 번역 대기 중`
                        : undefined
                      }
                      onClick={(e) => {
                        if (isDisabled) return;
                        if (e.shiftKey || e.ctrlKey || e.metaKey) {
                          setSelectedVersions(prev => {
                            const next = new Set(prev);
                            if (next.has(i)) { if (next.size > 1) next.delete(i); }
                            else next.add(i);
                            return next;
                          });
                        } else {
                          handleToneTabClick(i);
                          setSelectedVersions(prev => {
                            const next = new Set(prev);
                            if (next.has(i)) { if (next.size > 1) next.delete(i); }
                            else next.add(i);
                            return next;
                          });
                        }
                      }}
                      className={`relative flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border-2 text-xs font-semibold transition-colors duration-200 whitespace-nowrap shadow-sm ${
                        isFailed
                          ? 'bg-rose-50 text-rose-400 border-rose-200 cursor-not-allowed opacity-50 line-through'
                          : !isReady
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                          : transFailed
                          ? 'bg-rose-50 text-rose-400 border-rose-200 cursor-not-allowed opacity-50'
                          : isTranslating
                          ? 'bg-amber-50 text-amber-500 border-amber-200 cursor-wait opacity-70'
                          : noTranslation
                          ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                          : isViewing
                          ? `${color.active} shadow-lg hover:shadow-md hover:-translate-y-0.5`
                          : isChecked
                          ? `${color.idle} ring-2 ring-emerald-400 ring-offset-1 hover:shadow-md hover:-translate-y-0.5`
                          : `${color.idle} opacity-60 hover:shadow-md hover:-translate-y-0.5`
                      }`}
                    >
                      {/* ⭐ 자동 EEAT 진행 배지 (좌상단) */}
                      {eeatAutoStatus[i] === 'processing' && (
                        <span className="absolute top-0.5 left-0.5 text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full animate-pulse font-bold leading-none">
                          ⏳ EEAT
                        </span>
                      )}
                      {eeatAutoStatus[i] === 'done' && eeatAutoStarted && (
                        <span className="absolute top-0.5 left-0.5 text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold leading-none">
                          ✅ 완성
                        </span>
                      )}
                      {eeatAutoStatus[i] === 'failed' && (
                        <span className="absolute top-0.5 left-0.5 text-[9px] px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded-full font-bold leading-none">
                          ⚠️ 수동
                        </span>
                      )}
                      {/* ⭐ 번역 상태 뱃지 (우상단, 비한국어일 때) */}
                      {activeLang !== 'ko' && (() => {
                        const hasTrans = !!translatedVersions[activeLang]?.[i];
                        const isFailedTrans = translationFailed[activeLang]?.has(i);
                        const isTranslating = translatingLang === activeLang && !hasTrans && !isFailedTrans;
                        if (hasTrans) {
                          return (
                            <span className="absolute bottom-0.5 right-0.5 text-[9px] px-1.5 py-0.5 bg-emerald-500 text-white rounded-full font-bold leading-none shadow-sm" title={`${activeLang.toUpperCase()} 번역 완료`}>
                              ✓ {activeLang.toUpperCase()}
                            </span>
                          );
                        }
                        if (isFailedTrans) {
                          return (
                            <span className="absolute bottom-0.5 right-0.5 text-[9px] px-1.5 py-0.5 bg-rose-500 text-white rounded-full font-bold leading-none shadow-sm" title={`${activeLang.toUpperCase()} 번역 실패 — 한국어 원문 표시 중`}>
                              ⚠ KO
                            </span>
                          );
                        }
                        if (isTranslating) {
                          return (
                            <span className="absolute bottom-0.5 right-0.5 text-[9px] px-1.5 py-0.5 bg-amber-500 text-white rounded-full font-bold leading-none shadow-sm animate-pulse" title="번역 중">
                              ⋯
                            </span>
                          );
                        }
                        return null;
                      })()}
                      {/* 상태 배지 */}
                      <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center shadow text-[10px] ${
                        isConverting
                          ? 'bg-indigo-500 text-white animate-pulse'
                          : !isReady
                          ? 'bg-gray-300 text-gray-500'
                          : isChecked
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        {isConverting ? '◌' : !isReady ? '⌛' : isChecked ? '✓' : ''}
                      </span>
                      {/* 번호 뱃지 */}
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        !isReady ? 'bg-gray-300 text-gray-500' : isViewing ? 'bg-white/25 text-white' : `${color.dot} text-white`
                      }`}>
                        {i + 1}
                      </span>
                      {v.toneName || `버전 ${i + 1}`}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* 블로그 아티클 — 단일 통합 카드 */}
        <article className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* 상단 그라디언트 바 */}
          <div className="h-2 bg-gradient-to-r from-indigo-500 to-violet-600" />

          {/* 액션 툴바 */}
          <div className="flex flex-wrap items-center gap-2 px-6 pt-4 pb-3 border-b border-gray-100">
            <button onClick={handleCopyTitle} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${copiedTitle ? 'bg-emerald-500 text-white border-emerald-300' : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              {copiedTitle ? '복사됨!' : '제목 복사'}
            </button>
            <button onClick={handleCopy} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${copied ? 'bg-emerald-500 text-white border-emerald-300' : 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100'}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              {copied ? '복사됨!' : '본문 복사'}
            </button>
            <button onClick={handleCopyAsImage} disabled={isCapturing} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 ${copiedImage ? 'bg-emerald-500 text-white border-emerald-300' : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {copiedImage ? '복사됨!' : isCapturing ? '캡처 중...' : '이미지 복사'}
            </button>
            <button onClick={() => setShowEditInput(!showEditInput)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${showEditInput ? 'bg-violet-500 text-white border-violet-300' : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              수정
            </button>
            {/* ⭐ E-E-A-T 완성 버튼 — 현재 톤이 완성됐으면 비활성화, 미완성이면 활성화 */}
            {(() => {
              const isComplete = isCurrentToneComplete();
              const isDisabled = eeatCompletingSingle || isComplete;
              return (
                <button
                  onClick={handleCompleteEeatSingle}
                  disabled={isDisabled}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    eeatCompletingSingle
                      ? 'bg-indigo-500 text-white border-indigo-300 cursor-wait'
                      : isComplete
                      ? 'bg-rose-50 text-rose-600 border-rose-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 border-indigo-300 hover:from-indigo-100 hover:to-violet-100 hover:shadow-sm'
                  }`}
                  title={
                    isComplete
                      ? '이 톤은 이미 100% 완성되어 추가 작업 불필요'
                      : '현재 톤의 미완성 부분을 이어쓰기로 완결합니다'
                  }
                >
                  {eeatCompletingSingle ? (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : isComplete ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  )}
                  {eeatCompletingSingle ? '완성 중...' : isComplete ? 'E-E-A-T 완성됨' : 'E-E-A-T 완성'}
                </button>
              );
            })()}
            {/* ⭐ 자동 EEAT 일괄 변환 토글 + 진행 요약 */}
            <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={eeatAutoMode}
                onChange={(e) => setEeatAutoMode(e.target.checked)}
                className="w-3.5 h-3.5 accent-purple-600"
              />
              ✨ 자동 EEAT 일괄
            </label>
            {eeatAutoStarted && (
              <span className="inline-flex items-center px-2 py-1 text-[11px] font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                {Object.values(eeatAutoStatus).filter(s => s === 'done').length}
                /
                {Object.values(eeatAutoStatus).filter(s => s !== 'idle').length || 1} 완성
                {Object.values(eeatAutoStatus).some(s => s === 'processing') && (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                )}
              </span>
            )}
            <button
              onClick={() => router.push('/generate')}
              title="추천 주제 목록을 그대로 두고 다른 주제로 콘텐츠를 또 생성합니다"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200 transition-colors ml-auto"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              📝 다른 주제로 또 생성
            </button>
            <button onClick={handleReset} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              새로 만들기
            </button>
          </div>

          {/* E-E-A-T 단일 톤 완성 진행 상태 */}
          {eeatCompleteSingleStatus && (
            <div className="mx-6 my-2 px-4 py-2.5 rounded-lg border text-xs font-medium flex items-center gap-2 bg-indigo-50 text-indigo-700 border-indigo-200">
              {eeatCompletingSingle && (
                <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              <span>{eeatCompleteSingleStatus}</span>
            </div>
          )}

          {/* 수정 입력창 */}
          {showEditInput && (
            <div className="mx-6 my-3 bg-violet-50 rounded-xl border border-violet-200 p-4">
              <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="수정하거나 추가하고 싶은 내용을 입력하세요..." rows={3} className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder-gray-400 resize-none bg-white" />
              <button onClick={handleRegenerate} disabled={isRegenerating || !editNotes.trim()} className="mt-2 w-full py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-violet-700 hover:to-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {isRegenerating ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>재생성 중...</> : '재생성'}
              </button>
            </div>
          )}

          {/* 아티클 본문 — 블로그와 동일한 레이아웃 */}
          <div className="px-6 sm:px-8 py-6">
            {/* 메타 배지 */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-100 text-indigo-700">
                {categories.find(c => c.id === selectedCategory)?.label}
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-purple-100 text-purple-700">
                {(result as GenerateResponse & { toneName?: string }).toneName || tone || '15가지 톤'}
              </span>
              <span className="text-xs text-gray-400">{result.metadata.wordCount.toLocaleString()}자 · {result.metadata.estimatedReadTime}</span>
              {topic && <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">{topic}</span>}
            </div>

            {/* 제목 */}
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 leading-tight">{result.title}</h1>

            {/* 본문 */}
            <div className="prose prose-sm max-w-none" ref={contentRef}>
              <div
                className="text-gray-800 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(result.content) }}
              />
            </div>

            {/* 해시태그 */}
            {result.hashtags && result.hashtags.length > 0 && (
              <div className="mt-8 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                {result.hashtags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-default">
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            )}

            {/* SEO 팁 */}
            {result.metadata.seoTips.length > 0 && (
              <div className="mt-6 bg-blue-50 rounded-xl p-3 border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-800 mb-1.5">GEO/AIO SEO 팁</h3>
                <ul className="space-y-1">
                  {result.metadata.seoTips.map((tip, i) => (
                    <li key={i} className="text-xs text-blue-700 flex items-start gap-1.5">
                      <span className="text-blue-400 mt-0.5">&#8226;</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </article>

        {/* AI 이미지 생성 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            {generatedImages.length === 0 ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700">AI 이미지 생성</span>
                  <span className="text-xs text-gray-400">Gemini로 콘텐츠 관련 이미지 3장을 생성합니다</span>
                </div>
                <button
                  onClick={handleGenerateImages}
                  disabled={isGeneratingImages}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors duration-200 border bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-300 hover:from-emerald-600 hover:to-teal-600 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isGeneratingImages ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      생성 중...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      이미지 3장 생성
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    AI 생성 이미지 ({generatedImages.length}장)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleApplyImages}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition-colors duration-200 border border-indigo-300 text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 hover:shadow-lg hover:scale-105 shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      본문에 삽입
                    </button>
                    <button
                      onClick={handleGenerateImages}
                      disabled={isGeneratingImages}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200 border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:shadow-md hover:scale-105 disabled:opacity-50"
                    >
                      {isGeneratingImages ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          재생성 중...
                        </>
                      ) : '다시 생성'}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {generatedImages.map((img, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-colors duration-200">
                      <img src={img} alt={`AI 생성 이미지 ${i + 1}`} className="w-full aspect-video object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                        <a
                          href={img}
                          download={`ai-image-${i + 1}.png`}
                          className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 text-gray-800 text-xs font-medium rounded-lg shadow-md hover:bg-white transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          다운로드
                        </a>
                      </div>
                      <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {i + 1}/{generatedImages.length}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {imageError && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-red-700">{imageError}</p>
              </div>
            )}
          </div>


          {/* SNS 채널별 변환 */}
          <div className="bg-white rounded-xl shadow-sm border border-teal-200 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-5 py-2 border-b border-teal-200">
              <h3 className="text-sm font-bold text-teal-800 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                SNS 채널별 변환
              </h3>
            </div>
            <div className="p-3">
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  { id: 'instagram', label: '인스타그램', icon: '📸', color: 'pink' },
                  { id: 'linkedin', label: '링크드인', icon: '💼', color: 'blue' },
                  { id: 'naver_blog', label: '네이버 블로그', icon: '📝', color: 'green' },
                  { id: 'card_news', label: '카드뉴스', icon: '🎴', color: 'purple' },
                  { id: 'summary', label: '핵심 요약', icon: '📋', color: 'amber' },
                ].map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => handleSnsConvert(ch.id)}
                    disabled={snsLoading}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors hover:shadow-md hover:scale-105 disabled:opacity-50 ${
                      snsChannel === ch.id
                        ? `bg-${ch.color}-500 text-white border-${ch.color}-300`
                        : `bg-${ch.color}-50 text-${ch.color}-700 border-${ch.color}-200 hover:bg-${ch.color}-100`
                    }`}
                  >
                    <span>{ch.icon}</span>
                    {ch.label}
                  </button>
                ))}
              </div>
              {snsLoading && (
                <div className="flex items-center gap-2 text-sm text-teal-600 py-4">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  변환 중...
                </div>
              )}
              {snsResult && !snsLoading && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-600">변환 결과</span>
                    <button
                      onClick={handleCopySns}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        snsCopied ? 'bg-emerald-500 text-white border-emerald-300' : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
                      }`}
                    >
                      {snsCopied ? '복사됨!' : '복사'}
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm text-gray-800 whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {snsResult}
                  </div>
                </div>
              )}
            </div>
          </div>

      </main>

      <Footer />

      {/* 블로그 게시 모달 */}
      {showBlogPublish && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 overflow-y-auto" onClick={() => setShowBlogPublish(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative my-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">블로그에 게시</h3>
              </div>
              <button onClick={() => setShowBlogPublish(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              {/* 제목 미리보기 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">제목</label>
                <p className="text-sm font-medium text-gray-900 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">{result?.title}</p>
              </div>

              {/* 카테고리 선택 — 자동/수동 (Q1-C/Q2-A/Q3-A) */}
              <div>
                <CategorySelector
                  projectName={selectedProject?.name || ''}
                  categories={blogCategories}
                  value={categoryChoice}
                  onChange={(next) => {
                    setCategoryChoice(next);
                    // 모달의 grid와 동기화 — 사용자 선택을 selectedBlogCategory에도 반영
                    if (next.mode === 'manual' && next.manualSlug) {
                      setSelectedBlogCategory(next.manualSlug);
                    } else if (next.mode === 'auto') {
                      const auto = autoMatchCategory(selectedProject?.name || '', blogCategories);
                      if (auto) setSelectedBlogCategory(auto);
                    }
                  }}
                  onCreateCategory={(label, slug) => {
                    const extraColors = ['from-rose-500 to-pink-600','from-cyan-500 to-blue-600','from-lime-500 to-green-600','from-fuchsia-500 to-purple-600','from-orange-500 to-red-600'];
                    setBlogCategories(prev => [
                      ...prev,
                      { id: `custom-${Date.now()}`, slug, label, description: '', color: extraColors[prev.length % extraColors.length], icon: 'document', sortOrder: prev.length },
                    ]);
                    setSelectedBlogCategory(slug);
                  }}
                  variant="compact"
                />
              </div>

              {/* 카테고리 직접 선택 (고급) — 기존 grid 보존 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">카테고리 직접 선택 (고급)</label>
                <div className="flex flex-wrap gap-2">
                  {(blogCategories.length > 0 ? blogCategories : [
                    { id: '', slug: 'geo-aio', label: 'GEO-AIO', color: 'from-indigo-500 to-violet-600' },
                    { id: '', slug: 'regenmed', label: '리젠메드컨설팅', color: 'from-emerald-500 to-teal-600' },
                    { id: '', slug: 'brewery', label: '대전맥주장 수제맥주', color: 'from-amber-500 to-orange-600' },
                    { id: '', slug: 'dental', label: '치과병원', color: 'from-sky-500 to-blue-600' },
                  ]).map((cat) => (
                    <div key={cat.slug} className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedBlogCategory(cat.slug)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                          selectedBlogCategory === cat.slug
                            ? `bg-gradient-to-r ${cat.color} text-white border-transparent shadow-md`
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {cat.label}
                      </button>
                      {(
                        <button
                          onClick={() => handleDeleteCategory(cat.id || cat.slug, cat.slug)}
                          className="w-5 h-5 bg-red-100 text-red-500 rounded-full text-[10px] font-bold flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                          title="삭제"
                        >
                          X
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setShowNewCategory(!showNewCategory)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-dashed border-gray-300 text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors"
                  >
                    + 새 카테고리
                  </button>
                </div>

                {/* 새 카테고리 추가 */}
                {showNewCategory && (
                  <div className="mt-3 p-3 bg-rose-50 rounded-lg border border-rose-200 space-y-2">
                    <input
                      value={newCategoryLabel}
                      onChange={(e) => setNewCategoryLabel(e.target.value)}
                      placeholder="카테고리 이름 (예: 피부과, 마케팅, 음식점)"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                    />
                    <button
                      onClick={() => handleAddCategory()}
                      type="button"
                      className="w-full py-2.5 text-sm font-semibold bg-rose-500 text-white rounded-lg hover:bg-rose-600 active:bg-rose-700 transition-colors cursor-pointer"
                    >
                      카테고리 추가
                    </button>
                    {categoryError && (
                      <p className="text-xs text-red-600 font-medium">{categoryError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* 태그 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">태그</label>
                <div className="flex flex-wrap gap-1.5">
                  {['가이드', '전략', '분석', '비교분석', '입문', '서비스', '소개', '마케팅', '팁', '사례'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setBlogTag(t)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                        blogTag === t
                          ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-rose-300 hover:text-rose-500'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* 요약 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">요약 (목록에 표시)</label>
                <textarea
                  value={blogSummary}
                  onChange={(e) => setBlogSummary(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                />
              </div>

              {/* SNS 동시 배포 */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="snsDistribute"
                    checked={snsDistribute}
                    onChange={(e) => setSnsDistribute(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                  />
                  <label htmlFor="snsDistribute" className="text-xs font-semibold text-gray-700 cursor-pointer">SNS 동시 배포 (Make.com 연동)</label>
                </div>
                {snsDistribute && (
                  <div className="space-y-2 pl-6">
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'linkedin', label: 'LinkedIn', color: 'blue' },
                        { id: 'facebook', label: 'Facebook', color: 'indigo' },
                        { id: 'instagram', label: 'Instagram', color: 'pink' },
                        { id: 'naver_blog', label: '네이버 블로그', color: 'green' },
                        { id: 'twitter', label: 'X (Twitter)', color: 'gray' },
                      ].map((ch) => (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => setSnsChannels(prev => {
                            const next = new Set(prev);
                            if (next.has(ch.id)) next.delete(ch.id); else next.add(ch.id);
                            return next;
                          })}
                          className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                            snsChannels.has(ch.id)
                              ? `bg-${ch.color}-500 text-white border-${ch.color}-400`
                              : `bg-white text-gray-500 border-gray-200 hover:border-${ch.color}-300`
                          }`}
                        >
                          {snsChannels.has(ch.id) ? '✓ ' : ''}{ch.label}
                        </button>
                      ))}
                    </div>
                    <input
                      value={makeWebhookUrl}
                      onChange={(e) => setMakeWebhookUrl(e.target.value)}
                      placeholder="Make.com 웹훅 URL 붙여넣기"
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
                    />
                    <p className="text-[10px] text-gray-400">Make.com에서 Webhook 시나리오를 만들고 URL을 입력하세요. 선택한 채널로 자동 배포됩니다.</p>
                  </div>
                )}
                {distributeResult && (
                  <p className="mt-2 text-xs font-medium text-emerald-600 pl-6">{distributeResult}</p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 space-y-3">
              {abVersions.length > 1 && (
                <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-sm font-semibold text-indigo-800">
                    선택된 버전: <span className="text-indigo-600">{selectedVersions.size}개</span> / {abVersions.length}개
                  </p>
                  <p className="text-xs text-indigo-500 mt-0.5">위 톤 버전에서 체크된 것만 게시됩니다</p>
                </div>
              )}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowBlogPublish(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={abVersions.length > 1 ? handlePublishSelectedToBlog : handlePublishToBlog}
                  disabled={isPublishing || publishSuccess}
                  className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl transition-colors duration-200 border shadow-sm ${
                    publishSuccess
                      ? 'bg-emerald-500 text-white border-emerald-300'
                      : selectedVersions.size > 1
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-indigo-300 hover:from-indigo-600 hover:to-purple-600 hover:shadow-lg disabled:opacity-50'
                        : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-rose-300 hover:from-rose-600 hover:to-pink-600 hover:shadow-lg disabled:opacity-50'
                  }`}
                >
                  {isPublishing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {selectedVersions.size}개 게시 중...
                    </>
                  ) : publishSuccess ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      게시 완료!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      {selectedVersions.size > 1 ? `${selectedVersions.size}개 게시` : '게시하기'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 최종 콘텐츠 모달 (이미지 + 글) */}
      {showFinalContent && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto p-3 sm:p-6">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-4">
            <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-2xl px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">최종 콘텐츠</h3>
                <span className="text-xs text-gray-400">글 + 인포그래픽 이미지</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyFinalContent}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors duration-200 border hover:shadow-md hover:scale-105 ${
                    copiedFinal
                      ? 'bg-emerald-500 text-white border-emerald-300'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-300 hover:from-indigo-600 hover:to-purple-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={copiedFinal ? 'M5 13l4 4L19 7' : 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'} />
                  </svg>
                  {copiedFinal ? '복사됨!' : '블로그에 붙여넣기용 복사'}
                </button>
                <button
                  onClick={() => setShowFinalContent(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  닫기
                </button>
              </div>
            </div>
            <div className="px-5 py-6" ref={finalContentRef}>
              <div
                className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
                style={{ lineHeight: '1.8' }}
                dangerouslySetInnerHTML={{ __html: finalContentHtml }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 🚀 논스톱 자동 발행 — 플로팅 트리거 버튼 (EEAT 완료 후 우하단 노출) */}
      {eeatDone && autoPilotPhase === 'idle' && abVersions.length > 0 && (
        <button
          onClick={runAutoPilotPublish}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 px-5 py-3 min-h-[48px] bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-bold rounded-full shadow-2xl shadow-amber-500/40 hover:shadow-amber-500/60 hover:scale-105 active:scale-95 transition-colors"
        >
          <span className="text-xl">🚀</span>
          <span className="text-sm">논스톱 자동 발행 (4개 언어)</span>
        </button>
      )}

      {/* 🚀 자동 발행 진행 중 — 풀스크린 오버레이 (순차 단계 표시) */}
      {autoPilotPhase !== 'idle' && autoPilotPhase !== 'done' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-lg w-full">
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-3 relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 animate-pulse" />
                <svg className="absolute inset-0 m-auto w-7 h-7 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">논스톱 자동 발행 중</h3>
              <p className="text-xs text-slate-600">한국어 → 영어 → 중국어 → 일본어 순차 처리 (API 과부하 회피)</p>
            </div>

            {/* 4개 언어 단계별 상태 */}
            {(() => {
              const langOrder: { lang: Lang; flag: string; label: string }[] = [
                { lang: 'ko', flag: '🇰🇷', label: '한국어' },
                { lang: 'en', flag: '🇺🇸', label: 'English' },
                { lang: 'zh', flag: '🇨🇳', label: '中文' },
                { lang: 'ja', flag: '🇯🇵', label: '日本語' },
              ];
              const phase = autoPilotPhase;
              const phaseLang = phase.split('-')[1];
              const phaseAction = phase.split('-')[0]; // 'publishing' or 'translating'

              return (
                <div className="space-y-2">
                  {langOrder.map(({ lang, flag, label }) => {
                    const count = autoPilotProgress[lang];
                    const isCurrent = phaseLang === lang;
                    const isDone = count > 0 || (phaseLang === lang && phaseAction === 'publishing' && count === 0 && false);
                    // 단계 인덱스로 완료/진행중/대기 판정
                    const phaseIdx = ['ko', 'en', 'zh', 'ja'].indexOf(phaseLang);
                    const myIdx = ['ko', 'en', 'zh', 'ja'].indexOf(lang);
                    const status = myIdx < phaseIdx ? 'done' : isCurrent ? phaseAction : 'pending';

                    return (
                      <div
                        key={lang}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                          status === 'done'
                            ? 'bg-emerald-50 border-emerald-200'
                            : status === 'translating' || status === 'publishing'
                            ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <span className="text-xl">{flag}</span>
                        <span className={`flex-1 text-sm font-bold ${status === 'pending' ? 'text-slate-400' : 'text-slate-900'}`}>
                          {label}
                        </span>
                        {status === 'done' && (
                          <span className="text-emerald-700 text-sm font-extrabold">✓ {count}편</span>
                        )}
                        {(status === 'translating' || status === 'publishing') && (
                          <span className="inline-flex items-center gap-1.5 text-amber-700 text-xs font-bold">
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            {status === 'translating' ? '번역 중' : '발행 중'}
                          </span>
                        )}
                        {status === 'pending' && (
                          <span className="text-slate-400 text-xs">대기</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <p className="text-[11px] text-slate-500 text-center mt-4">
              총 소요 시간: 약 5~10분 (콘텐츠 양에 따라)
            </p>
          </div>
        </div>
      )}

      {/* ✅ 자동 발행 완료 팝업 */}
      {autoPilotPhase === 'done' && autoPilotResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            {/* 상단 헤더 */}
            <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/25 flex items-center justify-center text-2xl">✅</div>
                <div>
                  <h3 className="text-lg font-bold">발행 완료</h3>
                  <p className="text-xs text-white/90 mt-0.5">
                    카테고리: <strong>{autoPilotResult.category}</strong>
                  </p>
                </div>
              </div>
            </div>
            {/* 본문 */}
            <div className="p-6">
              <p className="text-sm text-slate-700 mb-4 text-center">
                <strong className="text-emerald-700">{autoPilotResult.total}편</strong>이 4개 언어 카테고리에 업로드되었습니다.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">🇰🇷</div>
                  <div className="text-xs text-slate-700 font-medium">한국어</div>
                  <div className="text-xl font-extrabold text-amber-800 mt-1">{autoPilotResult.ko}편</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">🇺🇸</div>
                  <div className="text-xs text-slate-700 font-medium">English</div>
                  <div className="text-xl font-extrabold text-blue-800 mt-1">{autoPilotResult.en}편</div>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">🇨🇳</div>
                  <div className="text-xs text-slate-700 font-medium">中文</div>
                  <div className="text-xl font-extrabold text-rose-800 mt-1">{autoPilotResult.zh}편</div>
                </div>
                <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">🇯🇵</div>
                  <div className="text-xs text-slate-700 font-medium">日本語</div>
                  <div className="text-xl font-extrabold text-violet-800 mt-1">{autoPilotResult.ja}편</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setAutoPilotPhase('idle');
                  setAutoPilotResult(null);
                  router.push('/generate');
                }}
                className="w-full px-6 py-3 min-h-[48px] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:from-amber-700 active:to-orange-700 text-white font-bold rounded-xl shadow-md transition-colors"
              >
                확인 — 새 주제 선정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
