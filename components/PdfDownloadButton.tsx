'use client';

import { useState } from 'react';

declare global {
  interface Window {
    html2canvas?: (el: HTMLElement, opts?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
    jspdf?: { jsPDF: new (opts: Record<string, unknown>) => unknown };
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Script load failed: ' + src));
    document.head.appendChild(s);
  });
}

export default function PdfDownloadButton({
  targetSelector = 'article',
  filename = 'proposal',
  className,
}: {
  targetSelector?: string;
  filename?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    const target = document.querySelector(targetSelector) as HTMLElement | null;
    if (!target) {
      alert('캡쳐 대상을 찾을 수 없습니다.');
      return;
    }
    setLoading(true);
    // 캡쳐 직전: PDF 버튼 자기 자신 숨김 (article 안에 위치할 수 있음)
    const hideEls = Array.from(document.querySelectorAll<HTMLElement>('[data-pdf-hide]'));
    const restore: Array<() => void> = [];
    hideEls.forEach(el => {
      const prev = el.style.visibility;
      el.style.visibility = 'hidden';
      restore.push(() => { el.style.visibility = prev; });
    });
    try {
      // 외부 이미지 CORS 사전 처리
      document.querySelectorAll('img').forEach(img => {
        img.crossOrigin = 'anonymous';
      });

      await Promise.all([
        // html2canvas-pro: oklch/oklab 색공간 지원 fork (Tailwind v4 호환)
        loadScript('https://cdn.jsdelivr.net/npm/html2canvas-pro@1.5.10/dist/html2canvas-pro.min.js'),
        loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'),
      ]);

      // 폰트·이미지 로딩 여유 + document.fonts.ready
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      await new Promise(r => setTimeout(r, 400));

      // 캡쳐 전: target 안의 모든 <a href> 위치·URL 수집 (PDF 클릭 가능 영역용)
      const targetRect = target.getBoundingClientRect();
      const anchors = Array.from(target.querySelectorAll<HTMLAnchorElement>('a[href]'))
        .map(a => {
          const r = a.getBoundingClientRect();
          let href = a.href;
          // 내부 링크는 절대 URL로 변환
          if (a.getAttribute('href')?.startsWith('/')) {
            href = window.location.origin + a.getAttribute('href');
          }
          return {
            href,
            // target 기준 상대 좌표 (px)
            x: r.left - targetRect.left,
            y: r.top - targetRect.top,
            w: r.width,
            h: r.height,
          };
        })
        .filter(a => a.href && a.w > 0 && a.h > 0);

      const canvas = await window.html2canvas!(target, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        windowHeight: target.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      // 화면 px → PDF mm 변환비율
      const pxToMm = imgWidth / target.offsetWidth;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const JsPDF = (window.jspdf as any).jsPDF;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdf: any = new JsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageHeight = pdf.internal.pageSize.getHeight();

      // 페이지 단위로 이미지 분할 + 각 페이지에 해당 영역의 anchor만 link 영역 추가
      const totalPages = Math.max(1, Math.ceil(imgHeight / pageHeight));
      for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        if (pageIdx > 0) pdf.addPage();
        const yOffset = -pageIdx * pageHeight; // 이미지 전체를 위로 밀어 그 페이지 부분만 보이게
        pdf.addImage(imgData, 'PNG', 0, yOffset, imgWidth, imgHeight);

        // 해당 페이지에 위치한 anchor에 대해 link 추가
        const pageStartMm = pageIdx * pageHeight;
        const pageEndMm = pageStartMm + pageHeight;
        anchors.forEach(a => {
          const linkY = a.y * pxToMm;
          const linkH = a.h * pxToMm;
          // 링크가 이 페이지와 겹치는지 확인
          if (linkY + linkH < pageStartMm || linkY > pageEndMm) return;
          // 페이지 내부 좌표로 변환
          const pageY = Math.max(0, linkY - pageStartMm);
          const visibleH = Math.min(linkY + linkH, pageEndMm) - Math.max(linkY, pageStartMm);
          pdf.link(a.x * pxToMm, pageY, a.w * pxToMm, visibleH, { url: a.href });
        });
      }

      const safeName = filename.replace(/[^a-zA-Z0-9가-힣\-_ ]/g, '');
      pdf.save(`${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('[PdfDownloadButton]', err);
      alert('PDF 생성에 실패했습니다: ' + (err as Error).message);
    } finally {
      restore.forEach(fn => fn());
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      data-pdf-hide
      className={className ?? 'inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 rounded-lg font-bold text-sm hover:shadow-[0_8px_24px_-4px_rgba(251,191,36,0.6)] hover:scale-[1.02] transition-all ring-1 ring-amber-300 disabled:opacity-60 disabled:cursor-wait'}
      aria-label="PDF로 저장"
    >
      {loading ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          처리 중...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
          </svg>
          PDF로 저장
        </>
      )}
    </button>
  );
}
