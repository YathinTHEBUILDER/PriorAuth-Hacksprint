import React from 'react';

interface CompletenessMeterProps {
  score: number;
  isConfigured?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const CompletenessMeter: React.FC<CompletenessMeterProps> = ({
  score,
  isConfigured = true,
  size = 'md',
  showLabel = true,
}) => {
  if (!isConfigured) {
    return (
      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
        Requirements not configured
      </span>
    );
  }

  const roundedScore = Math.min(100, Math.max(0, Math.round(score)));

  let colorClass = 'bg-rose-500';
  let textColor = 'text-rose-700';
  let bgClass = 'bg-rose-100';

  if (roundedScore >= 80) {
    colorClass = 'bg-emerald-500';
    textColor = 'text-emerald-700';
    bgClass = 'bg-emerald-100';
  } else if (roundedScore >= 50) {
    colorClass = 'bg-amber-500';
    textColor = 'text-amber-700';
    bgClass = 'bg-amber-100';
  }

  const barHeight = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }[size];

  return (
    <div className="w-full flex flex-col gap-1">
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-600">Completeness</span>
          <span className={`font-bold ${textColor}`}>{roundedScore}%</span>
        </div>
      )}
      <div className={`w-full ${bgClass} rounded-full overflow-hidden ${barHeight}`}>
        <div
          className={`${colorClass} ${barHeight} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${roundedScore}%` }}
        />
      </div>
    </div>
  );
};
