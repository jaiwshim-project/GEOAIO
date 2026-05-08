'use client';

import Link from 'next/link';

type TabId = 'indexing' | 'ai-citations';

interface Props {
  siteId: string;
  active: TabId;
}

const TABS: { id: TabId; label: string; icon: string; href: (id: string) => string }[] = [
  { id: 'indexing',     label: 'Google 색인', icon: '📊', href: id => `/dashboard/indexing/${id}` },
  { id: 'ai-citations', label: 'AI 인용',     icon: '🤖', href: id => `/dashboard/ai-citations/${id}` },
];

export default function SiteTabs({ siteId, active }: Props) {
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
      {TABS.map(tab => {
        const isActive = tab.id === active;
        return isActive ? (
          <span
            key={tab.id}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-white text-gray-900 shadow-sm"
          >
            <span>{tab.icon}</span>
            {tab.label}
          </span>
        ) : (
          <Link
            key={tab.id}
            href={tab.href(siteId)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-gray-500 hover:text-gray-800 hover:bg-white/60 transition-colors"
          >
            <span>{tab.icon}</span>
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
