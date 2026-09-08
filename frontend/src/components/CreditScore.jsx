import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

/**
 * Animated number counter that counts from `from` to `to` over `duration` ms.
 */
export default function CreditScore({ score, prevScore = null, animate = true }) {
  const [displayValue, setDisplayValue] = useState(prevScore ?? score)
  const rafRef = useRef(null)
  const startRef = useRef(null)

  const from = prevScore ?? score
  const to = score

  useEffect(() => {
    if (!animate || from === to) {
      setDisplayValue(to)
      return
    }

    const DURATION = 1400
    cancelAnimationFrame(rafRef.current)
    startRef.current = null

    function step(timestamp) {
      if (!startRef.current) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / DURATION, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(from + (to - from) * eased)
      setDisplayValue(current)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      }
    }

    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [from, to, animate])

  const pct = (displayValue / 100) * 100

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Score ring */}
      <div className="relative">
        <svg width="160" height="160" viewBox="0 0 160 160" className="rotate-[-90deg]">
          {/* Track */}
          <circle
            cx="80" cy="80" r="68"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="6"
          />
          {/* Progress arc */}
          <motion.circle
            cx="80" cy="80" r="68"
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 68}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 68 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 68 * (1 - pct / 100) }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5B8DEF" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={displayValue}
            className="text-5xl font-bold tracking-tight"
            style={{ color: '#F0F4F8', fontVariantNumeric: 'tabular-nums' }}
          >
            {displayValue}
          </motion.span>
          <span className="text-xs text-text-muted uppercase tracking-[0.2em] mt-1">/ 100</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-text-muted mb-2 uppercase tracking-wider">
          <span>0</span>
          <span>Score</span>
          <span>100</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #5B8DEF, #8B5CF6)',
              boxShadow: '0 0 8px rgba(91,141,239,0.5)',
            }}
            initial={{ width: `${(from / 100) * 100}%` }}
            animate={{ width: `${(score / 100) * 100}%` }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>
    </div>
  )
}
