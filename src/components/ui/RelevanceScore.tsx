interface RelevanceScoreProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { w: 'w-10 h-10', svg: 'w-10 h-10', r: 15, sw: 2.5, text: 'text-[10px]' },
  md: { w: 'w-12 h-12', svg: 'w-12 h-12', r: 18, sw: 3, text: 'text-xs' },
  lg: { w: 'w-14 h-14', svg: 'w-14 h-14', r: 21, sw: 3.5, text: 'text-sm' },
}

export function RelevanceScore({ score, size = 'md' }: RelevanceScoreProps) {
  const s = sizes[size]
  const circumference = 2 * Math.PI * s.r
  const offset = circumference - (score / 100) * circumference
  const viewBox = `0 0 ${(s.r + s.sw) * 2} ${(s.r + s.sw) * 2}`
  const center = s.r + s.sw

  const colour = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444'
  const bgColour = score >= 75 ? 'rgba(34,197,94,0.08)' : score >= 50 ? 'rgba(234,179,8,0.08)' : 'rgba(239,68,68,0.08)'

  return (
    <div className={`relative inline-flex items-center justify-center ${s.w} shrink-0`} style={{ background: bgColour, borderRadius: '50%' }}>
      <svg className={`${s.svg} -rotate-90`} viewBox={viewBox}>
        <circle
          cx={center}
          cy={center}
          r={s.r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={s.sw}
          opacity="0.4"
        />
        <circle
          cx={center}
          cy={center}
          r={s.r}
          fill="none"
          stroke={colour}
          strokeWidth={s.sw}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className={`absolute ${s.text} font-heading font-bold`} style={{ color: colour }}>
        {score}
      </span>
    </div>
  )
}
