'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { HistoryItem } from '@/lib/types';
import { getHistoryAsync, updateHistoryContent } from '@/lib/history';

export default function DashboardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [item, setItem] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [revisionId, setRevisionId] = useState<string | null>(null);
  const [copiedBlog, setCopiedBlog] = useState(false);
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [savedMessage, setSavedMessage] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [findCount, setFindCount] = useState(0);
  const [currentFindIndex, setCurrentFindIndex] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // URL query에서 revision 파라미터 확인
    const searchParams = new URLSearchParams(window.location.search);
    const rev = searchParams.get('revision');
    if (rev) setRevisionId(rev);

    getHistoryAsync().then(history => {
      const found = history.find(h => h.id === id);
      if (!found) {
        router.push('/dashboard');
        return;
      }
      setItem(found);
      setLoading(false);
    });
  }, [id, router]);

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

  const renderContent = (content: string) => {
    const paragraphs = content.split(/\n\n+/);
    let h2Index = 0;
    const sectionColors = [
      { bg: '#eef2ff', border: '#818cf8', accent: '#4f46e5' },
      { bg: '#ecfdf5', border: '#6ee7b7', accent: '#059669' },
      { bg: '#fef3c7', border: '#fbbf24', accent: '#d97706' },
      { bg: '#fce7f3', border: '#f9a8d4', accent: '#db2777' },
      { bg: '#e0e7ff', border: '#a5b4fc', accent: '#4338ca' },
      { bg: '#f0fdf4', border: '#86efac', accent: '#16a34a' },
      { bg: '#fff7ed', border: '#fdba74', accent: '#ea580c' },
      { bg: '#fdf2f8', border: '#f9a8d4', accent: '#be185d' },
    ];
    return paragraphs.map(para => {
      const lines = para.trim().split('\n');
      if (lines.length >= 2 && lines[0].trim().startsWith('|') && lines[1].trim().startsWith('|')) {
        return parseTable(para);
      }
      let html = para;
      html = html.replace(/^## (.*$)/gm, (_match: string, title: string) => {
        const color = sectionColors[h2Index % sectionColors.length];
        h2Index++;
        return `<div style="margin:36px 0 16px;padding:12px 20px;background:${color.bg};border-left:4px solid ${color.border};border-radius:0 12px 12px 0"><h2 style="font-size:1.2em;font-weight:700;color:${color.accent};margin:0">${title}</h2></div>`;
      });
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

  const handleCopyBlog = async () => {
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
      setCopiedBlog(true);
      setTimeout(() => setCopiedBlog(false), 2000);
    } catch {
      await navigator.clipboard.writeText(contentRef.current.innerText);
      setCopiedBlog(true);
      setTimeout(() => setCopiedBlog(false), 2000);
    }
  };

  const handleCopyTitle = async () => {
    if (!item) return;
    const isGen = item.type === 'generation';
    const title = isGen
      ? (revisionId
          ? item.revisions?.find(r => r.id === revisionId)?.result.title || item.title
          : item.generateResult?.title || item.title)
      : item.title;
    await navigator.clipboard.writeText(title);
    setCopiedTitle(true);
    setTimeout(() => setCopiedTitle(false), 2000);
  };

  const handleCopyContent = async () => {
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
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    } catch {
      await navigator.clipboard.writeText(contentRef.current.innerText);
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
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
        // 클립보드 이미지 복사 미지원 시 다운로드
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

  const insertMarkdown = (prefix: string, suffix: string = '', placeholder: string = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = editContent.slice(start, end);
    const insert = selected || placeholder;
    const newText = editContent.slice(0, start) + prefix + insert + suffix + editContent.slice(end);
    setEditContent(newText);
    setTimeout(() => {
      ta.focus();
      const cursorPos = selected ? start + prefix.length + selected.length + suffix.length : start + prefix.length;
      const selectEnd = selected ? cursorPos : cursorPos + placeholder.length;
      ta.setSelectionRange(cursorPos, selectEnd);
    }, 0);
  };

  const insertLinePrefix = (prefix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = editContent.lastIndexOf('\n', start - 1) + 1;
    const newText = editContent.slice(0, lineStart) + prefix + editContent.slice(lineStart);
    setEditContent(newText);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  const handleFind = (search: string) => {
    setFindText(search);
    if (!search) { setFindCount(0); setCurrentFindIndex(0); return; }
    const matches = editContent.split(search).length - 1;
    setFindCount(matches);
    setCurrentFindIndex(matches > 0 ? 1 : 0);
    // 첫 번째 매치로 이동
    if (matches > 0) {
      const ta = textareaRef.current;
      if (ta) {
        const idx = editContent.indexOf(search);
        if (idx >= 0) {
          ta.focus();
          ta.setSelectionRange(idx, idx + search.length);
        }
      }
    }
  };

  const handleFindNext = () => {
    if (!findText || findCount === 0) return;
    const ta = textareaRef.current;
    if (!ta) return;
    const startFrom = ta.selectionEnd || 0;
    let idx = editContent.indexOf(findText, startFrom);
    if (idx < 0) idx = editContent.indexOf(findText); // 처음부터 순환
    if (idx >= 0) {
      ta.focus();
      ta.setSelectionRange(idx, idx + findText.length);
      setCurrentFindIndex(prev => prev >= findCount ? 1 : prev + 1);
    }
  };

  const handleFindPrev = () => {
    if (!findText || findCount === 0) return;
    const ta = textareaRef.current;
    if (!ta) return;
    const startFrom = ta.selectionStart - 1;
    let idx = editContent.lastIndexOf(findText, startFrom > 0 ? startFrom : undefined);
    if (idx < 0) idx = editContent.lastIndexOf(findText); // 끝에서 순환
    if (idx >= 0) {
      ta.focus();
      ta.setSelectionRange(idx, idx + findText.length);
      setCurrentFindIndex(prev => prev <= 1 ? findCount : prev - 1);
    }
  };

  const handleReplaceOne = () => {
    if (!findText || findCount === 0) return;
    const ta = textareaRef.current;
    if (!ta) return;
    const selStart = ta.selectionStart;
    const selEnd = ta.selectionEnd;
    // 현재 선택이 findText와 일치하면 바꾸기
    if (editContent.slice(selStart, selEnd) === findText) {
      const newText = editContent.slice(0, selStart) + replaceText + editContent.slice(selEnd);
      setEditContent(newText);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(selStart + replaceText.length, selStart + replaceText.length);
        // 갱신
        const remaining = newText.split(findText).length - 1;
        setFindCount(remaining);
        setCurrentFindIndex(remaining > 0 ? Math.min(currentFindIndex, remaining) : 0);
        // 자동으로 다음 찾기
        if (remaining > 0) {
          const nextIdx = newText.indexOf(findText, selStart + replaceText.length);
          const idx = nextIdx >= 0 ? nextIdx : newText.indexOf(findText);
          if (idx >= 0) ta.setSelectionRange(idx, idx + findText.length);
        }
      }, 0);
    } else {
      // 선택이 안 맞으면 다음 매치 찾기
      handleFindNext();
    }
  };

  const handleReplaceAll = () => {
    if (!findText) return;
    const newText = editContent.split(findText).join(replaceText);
    setEditContent(newText);
    setFindCount(0);
    setCurrentFindIndex(0);
    const ta = textareaRef.current;
    if (ta) setTimeout(() => ta.focus(), 0);
  };

  const handleStartEdit = () => {
    const isGen = item?.type === 'generation';
    const currentContent = isGen
      ? (revisionId
          ? item?.revisions?.find(r => r.id === revisionId)?.result.content
          : item?.generateResult?.content)
      : item?.originalContent;
    setEditContent(currentContent || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!item) return;
    // item의 content를 업데이트
    if (item.type === 'generation' && item.generateResult) {
      if (revisionId) {
        const rev = item.revisions?.find(r => r.id === revisionId);
        if (rev) rev.result.content = editContent;
      } else {
        item.generateResult.content = editContent;
      }
    } else {
      item.originalContent = editContent;
    }
    setItem({ ...item });
    await updateHistoryContent(item.id, editContent);
    setIsEditing(false);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  if (loading || !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 relative">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
          <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  const isGeneration = item.type === 'generation';
  const content = isGeneration
    ? (revisionId
        ? item.revisions?.find(r => r.id === revisionId)?.result.content
        : item.generateResult?.content)
    : item.originalContent;

  const hashtags = isGeneration
    ? (revisionId
        ? item.revisions?.find(r => r.id === revisionId)?.result.hashtags
        : item.generateResult?.hashtags)
    : undefined;

  const handleRevisionChange = (rev: string | null) => {
    setRevisionId(rev);
    const url = rev ? `/dashboard/${id}?revision=${rev}` : `/dashboard/${id}`;
    window.history.replaceState(null, '', url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* 뒤로가기 */}
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-indigo-300 hover:shadow-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          목록으로 돌아가기
        </button>

        {/* 헤더 정보 */}
        <div className="bg-white rounded-xl shadow-sm border border-indigo-200 p-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{item.title}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-500">{item.date}</span>
                {item.category && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200">
                    {item.category}
                  </span>
                )}
                {revisionId && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200">
                    수정본
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* 블로그 붙여넣기 복사 */}
              <button
                onClick={handleCopyBlog}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors duration-200 border hover:shadow-md hover:scale-[1.03] ${
                  copiedBlog
                    ? 'bg-emerald-500 text-white border-emerald-300'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-300 hover:from-indigo-600 hover:to-purple-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={copiedBlog ? 'M5 13l4 4L19 7' : 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'} />
                </svg>
                {copiedBlog ? '복사됨!' : '블로그 붙여넣기용 복사'}
              </button>
              {/* 제목 복사 */}
              <button
                onClick={handleCopyTitle}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors duration-200 border hover:shadow-md hover:scale-[1.03] ${
                  copiedTitle
                    ? 'bg-emerald-500 text-white border-emerald-300'
                    : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={copiedTitle ? 'M5 13l4 4L19 7' : 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'} />
                </svg>
                {copiedTitle ? '복사됨!' : '제목 복사'}
              </button>
              {/* 본문 복사 */}
              <button
                onClick={handleCopyContent}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors duration-200 border hover:shadow-md hover:scale-[1.03] ${
                  copiedContent
                    ? 'bg-emerald-500 text-white border-emerald-300'
                    : 'border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={copiedContent ? 'M5 13l4 4L19 7' : 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'} />
                </svg>
                {copiedContent ? '복사됨!' : '본문 복사'}
              </button>
              {/* 이미지로 복사 */}
              <button
                onClick={handleCopyAsImage}
                disabled={isCapturing}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors duration-200 border hover:shadow-md hover:scale-[1.03] disabled:opacity-50 ${
                  copiedImage
                    ? 'bg-emerald-500 text-white border-emerald-300'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {isCapturing ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={copiedImage ? 'M5 13l4 4L19 7' : 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'} />
                  </svg>
                )}
                {copiedImage ? '복사됨!' : isCapturing ? '캡처 중...' : '이미지로 복사'}
              </button>
              {/* 본문 수정 */}
              <button
                onClick={isEditing ? handleSaveEdit : handleStartEdit}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors duration-200 border hover:shadow-md hover:scale-[1.03] ${
                  savedMessage
                    ? 'bg-emerald-500 text-white border-emerald-300'
                    : isEditing
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-emerald-300 hover:from-emerald-600 hover:to-green-700'
                    : 'border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={savedMessage ? 'M5 13l4 4L19 7' : 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'} />
                </svg>
                {savedMessage ? '저장됨!' : isEditing ? '저장하기' : '본문 수정'}
              </button>
              {isEditing && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors duration-200 border border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:shadow-md hover:scale-[1.03]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  취소
                </button>
              )}
              {/* 수정 이력 선택 */}
              {isGeneration && item.revisions && item.revisions.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRevisionChange(null)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors hover:shadow-md ${
                      !revisionId ? 'bg-indigo-600 text-white border-indigo-300' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    원본
                  </button>
                  {item.revisions.map((rev, i) => (
                    <button
                      key={rev.id}
                      onClick={() => handleRevisionChange(rev.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors hover:shadow-md ${
                        revisionId === rev.id ? 'bg-violet-600 text-white border-violet-300' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-300'
                      }`}
                    >
                      수정 #{i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 분석 결과 점수 (분석인 경우) */}
        {!isGeneration && item.analysisResult && (
          <div className="bg-white rounded-xl shadow-sm border border-sky-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">분석 점수</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-2xl font-bold text-blue-600">{item.analysisResult.overallScore}</p>
                <p className="text-xs text-gray-500 mt-1">종합 점수</p>
              </div>
              <div className="text-center p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                <p className="text-2xl font-bold text-indigo-600">{item.analysisResult.aio.total}</p>
                <p className="text-xs text-gray-500 mt-1">AIO 점수</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-xl border border-purple-200">
                <p className="text-2xl font-bold text-purple-600">{item.analysisResult.geo.total}</p>
                <p className="text-xs text-gray-500 mt-1">GEO 점수</p>
              </div>
            </div>
          </div>
        )}

        {/* 콘텐츠 */}
        <div className="bg-white rounded-xl shadow-sm border border-indigo-200 p-5">
          {isEditing ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="text-sm font-semibold text-violet-700">본문 수정 모드</span>
                <span className="text-xs text-gray-400">마크다운 형식으로 편집하세요</span>
              </div>
              {/* 편집 도구 바 */}
              <div className="sticky top-0 z-20 bg-pink-50 border border-violet-200 rounded-t-xl px-3 py-2 shadow-sm">
                <div className="flex items-center gap-1 flex-wrap">
                  <button type="button" onClick={() => insertMarkdown('**', '**', '굵은 텍스트')} className="px-2.5 py-1.5 text-xs font-bold text-gray-700 bg-white hover:bg-violet-100 hover:text-violet-700 rounded-lg transition-colors border border-pink-200" title="굵게">B</button>
                  <button type="button" onClick={() => insertMarkdown('*', '*', '기울임 텍스트')} className="px-2.5 py-1.5 text-xs italic text-gray-700 bg-white hover:bg-violet-100 hover:text-violet-700 rounded-lg transition-colors border border-pink-200" title="기울임">I</button>
                  <button type="button" onClick={() => insertMarkdown('~~', '~~', '취소선 텍스트')} className="px-2.5 py-1.5 text-xs line-through text-gray-700 bg-white hover:bg-violet-100 hover:text-violet-700 rounded-lg transition-colors border border-pink-200" title="취소선">S</button>
                  <div className="w-px h-6 bg-pink-300 mx-1" />
                  <button type="button" onClick={() => insertLinePrefix('# ')} className="px-2.5 py-1.5 text-xs font-bold text-gray-700 bg-white hover:bg-indigo-100 hover:text-indigo-700 rounded-lg transition-colors border border-pink-200" title="제목 1">H1</button>
                  <button type="button" onClick={() => insertLinePrefix('## ')} className="px-2.5 py-1.5 text-xs font-bold text-gray-700 bg-white hover:bg-indigo-100 hover:text-indigo-700 rounded-lg transition-colors border border-pink-200" title="제목 2">H2</button>
                  <button type="button" onClick={() => insertLinePrefix('### ')} className="px-2.5 py-1.5 text-xs font-bold text-gray-700 bg-white hover:bg-indigo-100 hover:text-indigo-700 rounded-lg transition-colors border border-pink-200" title="제목 3">H3</button>
                  <div className="w-px h-6 bg-pink-300 mx-1" />
                  <button type="button" onClick={() => insertLinePrefix('- ')} className="px-2.5 py-1.5 text-xs text-gray-700 bg-white hover:bg-sky-100 hover:text-sky-700 rounded-lg transition-colors flex items-center gap-1 border border-pink-200" title="목록">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    목록
                  </button>
                  <button type="button" onClick={() => insertLinePrefix('1. ')} className="px-2.5 py-1.5 text-xs text-gray-700 bg-white hover:bg-sky-100 hover:text-sky-700 rounded-lg transition-colors flex items-center gap-1 border border-pink-200" title="번호 목록">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                    번호
                  </button>
                  <div className="w-px h-6 bg-pink-300 mx-1" />
                  <button type="button" onClick={() => insertLinePrefix('> ')} className="px-2.5 py-1.5 text-xs text-gray-700 bg-white hover:bg-amber-100 hover:text-amber-700 rounded-lg transition-colors border border-pink-200" title="인용문">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  </button>
                  <button type="button" onClick={() => insertMarkdown('\n| 항목 | 내용 |\n| --- | --- |\n| ', ' | 값 |\n')} className="px-2.5 py-1.5 text-xs text-gray-700 bg-white hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-colors border border-pink-200" title="표">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M14 3v18" /></svg>
                  </button>
                  <button type="button" onClick={() => insertMarkdown('\n---\n')} className="px-2.5 py-1.5 text-xs text-gray-700 bg-white hover:bg-gray-200 rounded-lg transition-colors border border-pink-200" title="구분선">―</button>
                  <button type="button" onClick={() => insertMarkdown('[', '](url)', '링크 텍스트')} className="px-2.5 py-1.5 text-xs text-gray-700 bg-white hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors border border-pink-200" title="링크">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  </button>
                  <button type="button" onClick={() => insertMarkdown('`', '`', '코드')} className="px-2.5 py-1.5 text-xs font-mono text-gray-700 bg-white hover:bg-gray-200 rounded-lg transition-colors border border-pink-200" title="인라인 코드">{'{}'}</button>
                  <button type="button" onClick={() => insertLinePrefix('- [ ] ')} className="px-2.5 py-1.5 text-xs text-gray-700 bg-white hover:bg-teal-100 hover:text-teal-700 rounded-lg transition-colors border border-pink-200 flex items-center gap-1" title="체크박스">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>
                  <div className="w-px h-6 bg-pink-300 mx-1" />
                  <button
                    type="button"
                    onClick={() => { setShowFindReplace(!showFindReplace); if (!showFindReplace) setFindText(''); setReplaceText(''); setFindCount(0); setCurrentFindIndex(0); }}
                    className={`px-2.5 py-1.5 text-xs text-gray-700 rounded-lg transition-colors flex items-center gap-1 border ${showFindReplace ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-white hover:bg-rose-100 hover:text-rose-700 border-pink-200'}`}
                    title="찾기/바꾸기"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    찾기/바꾸기
                  </button>
                </div>
                {/* 찾기/바꾸기 패널 */}
                {showFindReplace && (
                  <div className="mt-2 pt-2 border-t border-pink-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-gray-600 w-12 shrink-0">찾기</label>
                      <input
                        type="text"
                        value={findText}
                        onChange={(e) => handleFind(e.target.value)}
                        placeholder="찾을 텍스트..."
                        className="flex-1 px-3 py-1.5 text-xs border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent bg-white"
                      />
                      <button type="button" onClick={handleFindPrev} disabled={findCount === 0} className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30" title="이전">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                      </button>
                      <button type="button" onClick={handleFindNext} disabled={findCount === 0} className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30" title="다음">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      <span className="text-[10px] text-gray-400 w-16 text-right shrink-0">
                        {findText ? `${currentFindIndex}/${findCount}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-gray-600 w-12 shrink-0">바꾸기</label>
                      <input
                        type="text"
                        value={replaceText}
                        onChange={(e) => setReplaceText(e.target.value)}
                        placeholder="바꿀 텍스트..."
                        className="flex-1 px-3 py-1.5 text-xs border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent bg-white"
                      />
                      <button type="button" onClick={handleReplaceOne} disabled={findCount === 0} className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors disabled:opacity-30" title="하나 바꾸기">
                        바꾸기
                      </button>
                      <button type="button" onClick={handleReplaceAll} disabled={findCount === 0} className="px-3 py-1.5 text-xs font-medium text-white bg-rose-500 hover:bg-rose-600 border border-rose-400 rounded-lg transition-colors disabled:opacity-30" title="모두 바꾸기">
                        모두 바꾸기
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[500px] px-4 py-3 border border-t-0 border-violet-200 rounded-b-xl text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-y bg-gray-50"
              />
            </div>
          ) : (
            <div ref={contentRef}>
              <div
                className="prose prose-sm max-w-none text-sm text-gray-800 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderContent(content || '') }}
              />
              {hashtags && hashtags.length > 0 && (
                <div className="mt-5 pt-3 flex flex-wrap gap-2">
                  {hashtags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-200">
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
