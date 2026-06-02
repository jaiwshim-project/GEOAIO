'use client';

import { useEffect, useState } from 'react';

interface BlogPostIndexProps {
  index: number;
}

export default function BlogPostIndex({ index }: BlogPostIndexProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-md">
      {index}
    </div>
  );
}
