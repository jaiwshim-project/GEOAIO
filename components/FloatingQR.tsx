'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function FloatingQR() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {expanded && (
        <div className="mb-2 bg-white rounded-2xl shadow-2xl border border-indigo-200 p-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-indigo-700">QR 코드로 접속하기</span>
            <button
              onClick={() => setExpanded(false)}
              className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <Image
            src="/qr-code.png"
            alt="GEOAIO QR Code"
            width={160}
            height={160}
            className="rounded-lg"
          />
        </div>
      )}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors duration-300 hover:scale-110 hover:shadow-xl ${
          expanded
            ? 'bg-gray-200 text-gray-600'
            : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
        }`}
        title="QR 코드"
      >
        {expanded ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        )}
      </button>
    </div>
  );
}
