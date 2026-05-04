'use client';

interface ScoreCardProps {
  title: string;
  score: number;
  description?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

const colorMap = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', ring: 'stroke-blue-500', track: 'stroke-blue-100', hoverBorder: 'hover:border-blue-400' },
  green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', ring: 'stroke-emerald-500', track: 'stroke-emerald-100', hoverBorder: 'hover:border-emerald-400' },
  purple: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-600', ring: 'stroke-violet-500', track: 'stroke-violet-100', hoverBorder: 'hover:border-violet-400' },
  orange: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', ring: 'stroke-amber-500', track: 'stroke-amber-100', hoverBorder: 'hover:border-amber-400' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', ring: 'stroke-red-500', track: 'stroke-red-100', hoverBorder: 'hover:border-red-400' },
};

function getScoreLabel(score: number): string {
  if (score >= 80) return '우수';
  if (score >= 60) return '양호';
  if (score >= 40) return '보통';
  return '개선 필요';
}

export default function ScoreCard({ title, score, description, icon, color }: ScoreCardProps) {
  const colors = colorMap[color];
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`${colors.bg} rounded-xl p-4 flex items-center gap-3 border ${colors.border} ${colors.hoverBorder} hover:shadow-md transition-colors duration-200`}>
      <div className="relative w-20 h-20 flex-shrink-0">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8" className={colors.track} />
          <circle
            cx="50" cy="50" r="40" fill="none" strokeWidth="8"
            className={colors.ring}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${colors.text}`}>{score}</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={colors.text}>{icon}</span>
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        </div>
        <p className={`text-xs font-semibold ${colors.text} mb-0.5`}>{getScoreLabel(score)}</p>
        {description && <p className="text-xs text-gray-500 truncate">{description}</p>}
      </div>
    </div>
  );
}
