import { motion } from 'framer-motion'
import { TIERS, getTierForScore } from '../config/contracts'
import { CheckCircle, Lock, TrendingUp } from 'lucide-react'

export default function CreditTiers({ currentScore = 0 }) {
  const currentTier = getTierForScore(currentScore)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-text-muted font-medium mb-1">
            Credit Tier Progression
          </div>
          <div className="text-sm text-text-secondary">
            Build reputation to unlock better borrowing terms
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {TIERS.map((tier, i) => {
          const isActive = currentTier.label === tier.label
          const isPast = currentScore > tier.maxScore
          const isLocked = currentScore < tier.minScore
          const isNext = !isActive && !isPast && i === TIERS.findIndex(t => currentScore < t.minScore)

          return (
            <motion.div
              key={tier.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="relative rounded-xl p-4 transition-all"
              style={{
                background: isActive
                  ? `linear-gradient(135deg, rgba(${hexToRgb(tier.color)},0.12), rgba(${hexToRgb(tier.color)},0.06))`
                  : isPast
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(255,255,255,0.02)',
                border: isActive
                  ? `1.5px solid rgba(${hexToRgb(tier.color)},0.4)`
                  : isPast
                    ? '1px solid rgba(52,211,153,0.2)'
                    : '1px solid rgba(255,255,255,0.05)',
                boxShadow: isActive ? `0 4px 24px rgba(${hexToRgb(tier.color)},0.15)` : 'none',
              }}
            >
              {/* Active tier glow pulse */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{ boxShadow: `0 0 24px rgba(${hexToRgb(tier.color)},0.2)` }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              )}

              <div className="relative">
                {/* Header with score threshold */}
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="text-xs font-mono font-semibold"
                    style={{
                      color: isActive || isPast ? tier.color : isNext ? '#8C9BAB' : '#4A5568'
                    }}
                  >
                    {tier.minScore === 75 ? '75+' : tier.minScore}
                  </div>

                  {/* Status icon */}
                  <div>
                    {isPast ? (
                      <CheckCircle size={14} color="#34D399" />
                    ) : isLocked ? (
                      <Lock size={12} color="#4A5568" />
                    ) : isNext ? (
                      <TrendingUp size={12} color="#5B8DEF" />
                    ) : null}
                  </div>
                </div>

                {/* Tier name */}
                <div
                  className="text-sm font-bold tracking-wide mb-3 uppercase"
                  style={{
                    color: isActive
                      ? tier.color
                      : isPast
                        ? '#8C9BAB'
                        : isNext
                          ? '#8C9BAB'
                          : '#4A5568'
                  }}
                >
                  {tier.label}
                </div>

                {/* Collateral requirement - hero metric */}
                <div className="mb-2">
                  <div
                    className="text-3xl font-bold tabular-nums leading-none"
                    style={{
                      color: isActive
                        ? '#F0F4F8'
                        : isPast
                          ? '#8C9BAB'
                          : isNext
                            ? '#8C9BAB'
                            : '#2D3748'
                    }}
                  >
                    {tier.collateral}%
                  </div>
                  <div
                    className="text-[10px] uppercase tracking-wider mt-1"
                    style={{
                      color: isActive ? '#8C9BAB' : isNext ? '#4A5568' : '#2D3748'
                    }}
                  >
                    collateral
                  </div>
                </div>

                {/* Status label */}
                {isActive && (
                  <div
                    className="mt-3 pt-3 border-t text-[10px] uppercase tracking-[0.15em] font-bold"
                    style={{
                      borderColor: `rgba(${hexToRgb(tier.color)},0.2)`,
                      color: tier.color,
                    }}
                  >
                    ▸ Current Tier
                  </div>
                )}

                {isPast && (
                  <div className="mt-3 pt-3 border-t border-green-500/10 text-[10px] uppercase tracking-wider text-green-400 font-medium">
                    ✓ Achieved
                  </div>
                )}

                {isNext && (
                  <div className="mt-3 pt-3 border-t border-blue-500/10 text-[10px] uppercase tracking-wider text-blue-400 font-medium">
                    → Next Tier
                  </div>
                )}

                {isLocked && !isNext && (
                  <div className="mt-3 pt-3 border-t border-white/5 text-[10px] uppercase tracking-wider text-text-muted/40">
                    Locked
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Progress indicator */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="text-text-muted">Progress to next tier</span>
          <span className="text-text-secondary font-medium">
            {currentScore < 100 ? `${currentScore % 25}/25` : 'Max tier reached'}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #5B8DEF, #8B5CF6)' }}
            initial={{ width: 0 }}
            animate={{ width: `${((currentScore % 25) / 25) * 100}%` }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>
    </div>
  )
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
