'use client';

interface BlogIndexNumberProps {
  number: number;
}

export default function BlogIndexNumber({ number }: BlogIndexNumberProps) {
  // Server-side: 빈 div (공간만 차지)
  // Client-side: 숫자 표시
  return (
    <div
      className="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-md"
      suppressHydrationWarning
    >
      {typeof window !== 'undefined' ? number : ' '}
    </div>
  );
}
