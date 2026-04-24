'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ApiKeyPanel from '@/components/ApiKeyPanel';
import type { ContentCategory, GenerateResponse } from '@/lib/types';
import { addRevision, generateId } from '@/lib/history';
import { uploadImage, getGenerateResult, saveGenerateResult, saveBlogPost, saveBlogPostsBatch, getBlogCategories, type GenerateResultData, type BlogCategory } from '@/lib/supabase-storage';

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

  // 블로그 게시
  const [showBlogPublish, setShowBlogPublish] = useState(false);
  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('blog_categories');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [selectedBlogCategory, setSelectedBlogCategory] = useState('geo-aio');
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
        // E-E-A-T 자동 변환 시작
        startEeatConversion(normalizedVersions, data.tone);
      }
    });
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

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

    for (let i = 0; i < versions.length; i++) {
      const v = versions[i];
      try {
        const res = await fetch('/api/convert-eeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: v.content,
            title: v.title,
            tone: (v as { toneName?: string; toneValue?: string }).toneValue || currentTone,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          converted[i] = { ...v, title: data.title || v.title, content: data.content || v.content };
        }
      } catch {
        // 실패 시 원본 유지
      }
      setEeatProgress(i + 1);
      // 변환된 버전 즉시 반영
      setAbVersions([...converted]);
      if (i === 0) setResult(converted[0]); // 첫 번째 완료 시 바로 표시
    }

    setEeatConverting(false);
    setEeatDone(true);
    setResult(converted[0]);
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
    setIsPublishing(true);
    try {
      const postId = await saveBlogPost({
        title: result.title,
        content: result.content,
        summary: blogSummary,
        category: selectedBlogCategory,
        tag: blogTag,
        hashtags: result.hashtags || [],
        metadata: result.metadata as unknown as Record<string, unknown>,
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
    const versionsToPublish = selectedIdxs.map(i => abVersions[i]).filter(Boolean);
    if (versionsToPublish.length === 0) return;
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
          metadata: v.metadata as unknown as Record<string, unknown>,
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
    const thStyle = 'padding:10px 16px;text-align:left;font-weight:600;font-size:0.85em;color:#ffffff;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:1px solid #818cf8;white-space:nowrap';
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

        {/* E-E-A-T 자동 변환 진행 바 */}
        {eeatConverting && (
          <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-4">
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-5 h-5 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-indigo-700">E-E-A-T 7단계 구조 변환 중... ({eeatProgress}/{abVersions.length})</p>
                <p className="text-xs text-indigo-400 mt-0.5">FAQ · 비교표 · H2 섹션을 자동으로 추가하고 있습니다</p>
              </div>
              <span className="text-sm font-bold text-indigo-600">{Math.round((eeatProgress / Math.max(abVersions.length, 1)) * 100)}%</span>
            </div>
            <div className="w-full bg-indigo-100 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(eeatProgress / Math.max(abVersions.length, 1)) * 100}%` }}
              />
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
                  return (
                    <button
                      key={i}
                      onClick={(e) => {
                        if (e.shiftKey || e.ctrlKey || e.metaKey) {
                          // Shift/Ctrl 클릭: 체크 토글만
                          setSelectedVersions(prev => {
                            const next = new Set(prev);
                            if (next.has(i)) { if (next.size > 1) next.delete(i); }
                            else next.add(i);
                            return next;
                          });
                        } else {
                          // 일반 클릭: 미리보기 전환 + 체크 토글
                          setActiveAbTab(i);
                          setResult(v);
                          setSelectedVersions(prev => {
                            const next = new Set(prev);
                            if (next.has(i)) { if (next.size > 1) next.delete(i); }
                            else next.add(i);
                            return next;
                          });
                        }
                      }}
                      className={`relative flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all duration-200 whitespace-nowrap shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                        isViewing ? `${color.active} shadow-lg` : isChecked ? `${color.idle} ring-2 ring-emerald-400 ring-offset-1` : `${color.idle} opacity-60`
                      }`}
                    >
                      {/* 체크 표시 */}
                      <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center shadow text-[10px] ${
                        isChecked ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'
                      }`}>
                        {isChecked ? '✓' : ''}
                      </span>
                      {/* 번호 뱃지 */}
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isViewing ? 'bg-white/25 text-white' : `${color.dot} text-white`
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
            <button onClick={handleCopyTitle} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${copiedTitle ? 'bg-emerald-500 text-white border-emerald-300' : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              {copiedTitle ? '복사됨!' : '제목 복사'}
            </button>
            <button onClick={handleCopy} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${copied ? 'bg-emerald-500 text-white border-emerald-300' : 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100'}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              {copied ? '복사됨!' : '본문 복사'}
            </button>
            <button onClick={handleCopyAsImage} disabled={isCapturing} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all disabled:opacity-50 ${copiedImage ? 'bg-emerald-500 text-white border-emerald-300' : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {copiedImage ? '복사됨!' : isCapturing ? '캡처 중...' : '이미지 복사'}
            </button>
            <button onClick={() => setShowEditInput(!showEditInput)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${showEditInput ? 'bg-violet-500 text-white border-violet-300' : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              수정
            </button>
            <button onClick={handleReset} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100 transition-all ml-auto">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              새로 만들기
            </button>
          </div>

          {/* 수정 입력창 */}
          {showEditInput && (
            <div className="mx-6 my-3 bg-violet-50 rounded-xl border border-violet-200 p-4">
              <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="수정하거나 추가하고 싶은 내용을 입력하세요..." rows={3} className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder-gray-400 resize-none bg-white" />
              <button onClick={handleRegenerate} disabled={isRegenerating || !editNotes.trim()} className="mt-2 w-full py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
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
                {(result as GenerateResponse & { toneName?: string }).toneName || tone || '10가지 톤'}
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
                  <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-all cursor-default">
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
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 border bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-300 hover:from-emerald-600 hover:to-teal-600 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 border border-indigo-300 text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 hover:shadow-lg hover:scale-105 shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      본문에 삽입
                    </button>
                    <button
                      onClick={handleGenerateImages}
                      disabled={isGeneratingImages}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:shadow-md hover:scale-105 disabled:opacity-50"
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
                    <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200">
                      <img src={img} alt={`AI 생성 이미지 ${i + 1}`} className="w-full aspect-video object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                        <a
                          href={img}
                          download={`ai-image-${i + 1}.png`}
                          className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 text-gray-800 text-xs font-medium rounded-lg shadow-md hover:bg-white transition-all"
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
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all hover:shadow-md hover:scale-105 disabled:opacity-50 ${
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
                      className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
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

        {/* 블로그 게시 버튼 */}
        <div className="bg-white rounded-xl shadow-sm border border-rose-200 overflow-hidden">
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 px-5 py-2 border-b border-rose-200">
            <h3 className="text-sm font-bold text-rose-800 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
              블로그 자동 게시
            </h3>
          </div>
          <div className="p-4">
            <p className="text-xs text-gray-500 mb-3">생성된 콘텐츠를 블로그 페이지에 바로 게시합니다. 카테고리를 선택하면 해당 탭에 자동으로 분류됩니다.</p>
            <button
              onClick={handleOpenBlogPublish}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 border bg-gradient-to-r from-rose-500 to-pink-500 text-white border-rose-300 hover:from-rose-600 hover:to-pink-600 hover:shadow-lg hover:scale-105 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              블로그에 게시하기
            </button>
          </div>
        </div>

      </main>

      <Footer />

      {/* 블로그 게시 모달 */}
      {showBlogPublish && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setShowBlogPublish(false)}>
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

              {/* 카테고리 선택 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">카테고리 선택</label>
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
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
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
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-dashed border-gray-300 text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-all"
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
                      className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all ${
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
                          className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all ${
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
                  className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl transition-all duration-200 border shadow-sm ${
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
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-3 sm:p-6">
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
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 border hover:shadow-md hover:scale-105 ${
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
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
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
    </div>
  );
}
