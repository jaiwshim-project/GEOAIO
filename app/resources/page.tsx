'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TesterModal, { TesterFloatingButton } from '@/components/TesterModal';

const tabs = [
  { id: 'geo-playbook', label: 'GEO Playbook', pdf: '/geo-playbook.pdf' },
  { id: 'aio-geo-guide', label: 'GEOAIO', pdf: '/aio-geo-optimizer-guide.pdf' },
];

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [showTesterModal, setShowTesterModal] = useState(false);
  const active = tabs.find(t => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white px-6 sm:px-10 py-8 mb-6 flex items-center gap-6">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
              <circle cx="50" cy="50" r="80" stroke="white" strokeWidth="0.5" />
              <circle cx="350" cy="100" r="120" stroke="white" strokeWidth="0.5" />
            </svg>
          </div>
          <img src="/images/logo-geoaio.png" alt="GEOAIO" className="relative z-10 h-16 rounded-lg shadow-lg hidden sm:block" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-1">자료실</h2>
            <p className="text-sm text-white/80">GEO/AIO 최적화에 도움이 되는 자료를 확인하세요</p>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* PDF 뷰어 (스크롤 가능) */}
        <div className="bg-white rounded-xl border border-indigo-200 shadow-md overflow-hidden">
          <div className="w-full" style={{ height: '85vh' }}>
            <iframe
              key={active.id}
              src={`${active.pdf}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
              className="w-full h-full border-0"
              title={active.label}
            />
          </div>
          <div className="p-3 bg-gray-50 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700">{active.label}</p>
          </div>
        </div>
      </main>
      <Footer />

      <TesterFloatingButton onClick={() => setShowTesterModal(true)} />
      <TesterModal show={showTesterModal} onClose={() => setShowTesterModal(false)} />
    </div>
  );
}
