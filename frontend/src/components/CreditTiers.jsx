import { motion } from 'framer-motion'
import { TIERS, getTierForScore } from '../config/contracts'
import { CheckCircle } from 'lucide-react'

export default function CreditTiers({ currentScore = 0 }) {
  const currentTier = getTierForScore(currentScore)

  return (
    <div className="w-full">
      <div className="text-xs uppercase tracking-[0.2em] text-text-muted mb-4">Credit Tiers</div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TIERS.map((tier, i) => {
          const isActive = currentTier.label === tier.label
          const isPast = currentScore > tier.maxScore

          return (
            <motion.div
              key={tier.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative rounded-xl p-4 transition-all"
              style={{
                background: isActive
                  ? `rgba(${hexToRgb(tier.color)},0.08)`
                  : 'rgba(255,255,255,0.02)',
                border: isActive
                  ? `1px solid rgba(${hexToRgb(tier.color)},0.3)`
                  : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{ boxShadow: `0 0 20px rgba(${hexToRgb(tier.color)},0.12)` }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              )}

              {/* Score threshold */}
              <div
                className="text-xs font-mono mb-1"
                style={{ color: isActive ? tier.color : '#4A5568' }}
              >
                {tier.minScore === 75 ? '75+' : tier.minScore}
              </div>

              {/* Tier name */}
              <div
                className="text-sm font-semibold tracking-wide mb-2"
                style={{ color: isActive ? tier.color : isPast ? '#8C9BAB' : '#4A5568' }}
              >
                {tier.label}
              </div>

              {/* Collateral */}
              <div
                className="text-xl font-bold tabular-nums"
                style={{ color: isActive ? '#F0F4F8' : isPast ? '#8C9BAB' : '#2D3748' }}
              >
                {tier.collateral}%
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: isActive ? '#8C9BAB' : '#2D3748' }}
              >
                collateral
              </div>

              {/* Active / done indicator */}
              {isActive && (
                <div
                  className="absolute top-3 right-3 text-xs uppercase tracking-wider font-medium"
                  style={{ color: tier.color }}
                >
                  ▸ Current
                </div>
              )}
              {isPast && (
                <div className="absolute top-3 right-3">
                  <CheckCircle size={14} color="#34D399" />
                </div>
              )}
            </motion.div>
          )
        })}
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
