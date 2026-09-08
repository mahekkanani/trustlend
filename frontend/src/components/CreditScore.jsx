import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

/**
 * Premium animated credit score ring with smooth counting animation.
 * Inspired by institutional fintech dashboards.
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

    const DURATION = 1600 // Slightly longer for premium feel
    cancelAnimationFrame(rafRef.current)
    startRef.current = null

    function step(timestamp) {
      if (!startRef.current) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / DURATION, 1)

      // Custom easing: ease-out-expo for satisfying deceleration
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
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
  const circumference = 2 * Math.PI * 72 // r=72

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Score ring - larger and more prominent */}
      <div className="relative">
        <svg width="200" height="200" viewBox="0 0 200 200" className="rotate-[-90deg]">
          {/* Outer glow ring */}
          <circle
            cx="100" cy="100" r="76"
            fill="none"
            stroke="rgba(91,141,239,0.08)"
            strokeWidth="8"
            filter="blur(4px)"
          />

          {/* Background track */}
          <circle
            cx="100" cy="100" r="72"
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="8"
          />

          {/* Progress arc with gradient */}
          <motion.circle
            cx="100" cy="100" r="72"
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - pct / 100) }}
            transition={{
              duration: 1.6,
              ease: [0.16, 1, 0.3, 1] // Custom bezier for premium feel
            }}
            style={{
              filter: 'drop-shadow(0 0 8px rgba(91,141,239,0.4))',
            }}
          />

          {/* Inner subtle ring */}
          <circle
            cx="100" cy="100" r="62"
            fill="none"
            stroke="rgba(255,255,255,0.02)"
            strokeWidth="1"
          />

          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5B8DEF" />
              <stop offset="50%" stopColor="#7B7CF6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center value with enhanced typography */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            key={displayValue}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-center"
          >
            <span
              className="text-6xl font-bold tracking-tight block"
              style={{
                background: 'linear-gradient(135deg, #F0F4F8 0%, #8C9BAB 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {displayValue}
            </span>
            <span className="text-xs text-text-muted/60 uppercase tracking-[0.25em] mt-1 block font-medium">
              / 100
            </span>
          </motion.div>
        </div>

        {/* Ambient glow effect */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(91,141,239,0.05) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Progress bar with milestones */}
      <div className="w-full max-w-sm">
        <div className="flex justify-between text-[10px] text-text-muted mb-3 uppercase tracking-[0.25em] font-medium">
          <span>0</span>
          <span>Credit Score</span>
          <span>100</span>
        </div>

        {/* Track */}
        <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {/* Milestone markers */}
          {[25, 50, 75].map(milestone => (
            <div
              key={milestone}
              className="absolute top-0 bottom-0 w-px"
              style={{
                left: `${milestone}%`,
                background: 'rgba(255,255,255,0.1)',
              }}
            />
          ))}

          {/* Progress fill */}
          <motion.div
            className="h-full rounded-full relative overflow-hidden"
            style={{
              background: 'linear-gradient(90deg, #5B8DEF, #7B7CF6, #8B5CF6)',
              boxShadow: '0 0 12px rgba(91,141,239,0.5)',
            }}
            initial={{ width: `${(from / 100) * 100}%` }}
            animate={{ width: `${(score / 100) * 100}%` }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
            />
          </motion.div>
        </div>

        {/* Score tier labels */}
        <div className="flex justify-between mt-2 text-[9px] text-text-muted/50 uppercase tracking-wider">
          <span>New</span>
          <span>Basic</span>
          <span>Trusted</span>
          <span>Elite</span>
        </div>
      </div>
    </div>
  )
}
