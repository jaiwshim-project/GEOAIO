'use client';

import { useState, useCallback } from 'react';

interface Props {
  title: string;
  url: string; // 전체 URL (예: https://www.geo-aio.com/blog/...)
  description?: string;
}

interface KakaoSDK {
  isInitialized?: () => boolean;
  init?: (key: string) => void;
  Share?: {
    sendDefault: (params: {
      objectType: string;
      content: {
        title: string;
        description: string;
        imageUrl: string;
        link: { mobileWebUrl: string; webUrl: string };
      };
    }) => void;
  };
}

declare global {
  interface Window {
    Kakao?: KakaoSDK;
  }
}

export default function BlogShareButtons({ title, url, description }: Props) {
  const [copied, setCopied] = useState(false);
  const summary = (description || title).slice(0, 200);

  const openCenteredPopup = useCallback((shareUrl: string, name: string) => {
    const w = 600;
    const h = 480;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    window.open(
      shareUrl,
      name,
      `width=${w},height=${h},left=${left},top=${top},toolbar=0,menubar=0,location=0,status=0`
    );
  }, []);

  const shareFacebook = useCallback(() => {
    openCenteredPopup(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      'fb-share'
    );
  }, [url, openCenteredPopup]);

  const shareLinkedIn = useCallback(() => {
    openCenteredPopup(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      'li-share'
    );
  }, [url, openCenteredPopup]);

  const shareKakao = useCallback(async () => {
    // 1) Kakao SDK가 로드되어 있고 초기화돼 있으면 정식 공유
    const k = window.Kakao;
    if (k?.isInitialized?.() && k.Share?.sendDefault) {
      try {
        k.Share.sendDefault({
          objectType: 'feed',
          content: {
            title,
            description: summary,
            imageUrl: `${url}/opengraph-image`,
            link: { mobileWebUrl: url, webUrl: url },
          },
        });
        return;
      } catch {
        // 폴백으로 진행
      }
    }
    // 2) 폴백: 클립보드에 링크 복사 (사용자가 카카오톡에 붙여넣기)
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 3) 마지막 폴백: prompt로 노출
      window.prompt('링크를 복사하세요 (Ctrl+C / Cmd+C):', url);
    }
  }, [title, summary, url]);

  return (
    <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-gray-200">
      <span className="text-xs font-semibold text-gray-700 mr-1">공유</span>

      <button
        onClick={shareFacebook}
        aria-label="Facebook으로 공유"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1877F2] hover:bg-[#0e6ce8] rounded-full transition-colors shadow-sm"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z" />
        </svg>
        Facebook
      </button>

      <button
        onClick={shareLinkedIn}
        aria-label="LinkedIn으로 공유"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#0954a0] rounded-full transition-colors shadow-sm"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
        LinkedIn
      </button>

      <button
        onClick={shareKakao}
        aria-label="카카오톡으로 공유"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#181600] bg-[#FEE500] hover:bg-[#fcd900] rounded-full transition-colors shadow-sm"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3C6.477 3 2 6.51 2 10.84c0 2.78 1.86 5.22 4.66 6.61-.21.74-.76 2.83-.87 3.27-.13.55.2.55.42.4.17-.12 2.7-1.84 3.79-2.58.66.09 1.34.14 2 .14 5.523 0 10-3.51 10-7.84S17.523 3 12 3z" />
        </svg>
        {copied ? '링크 복사됨' : '카카오톡'}
      </button>
    </div>
  );
}
