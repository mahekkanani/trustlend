import { motion, AnimatePresence } from 'framer-motion'
import { Award, TrendingUp, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatEther } from 'viem'
import { fmtNumber } from '../utils/format'

/**
 * Premium success modal shown after successful repayment.
 * Displays score increase, tier upgrade, and capital efficiency gains.
 */
export default function RepaymentSuccessModal({
  isOpen,
  onClose,
  oldScore,
  newScore,
  oldCollateral,
  newCollateral,
  borrowAmount, // Optional: to show savings calculation
}) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShowContent(true), 300)
    } else {
      setShowContent(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const scoreDelta = newScore - oldScore
  const collateralDelta = oldCollateral - newCollateral
  const tierUpgraded = scoreDelta >= 25 && (oldScore % 25 === 0 || newScore % 25 === 0)

  // Calculate capital efficiency improvement if borrow amount provided
  let savingsUSD = null
  if (borrowAmount && oldCollateral && newCollateral) {
    const borrowNum = parseFloat(formatEther(borrowAmount))
    const oldRequired = (borrowNum * oldCollateral) / 100
    const newRequired = (borrowNum * newCollateral) / 100
    savingsUSD = oldRequired - newRequired
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.8)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-lg w-full rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0a0d14 0%, #0d1018 50%, #0e1220 100%)',
            border: '1px solid rgba(91,141,239,0.3)',
            boxShadow: '0 0 80px rgba(91,141,239,0.2)',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg transition-colors hover:bg-white/5 z-10"
            style={{ color: '#8C9BAB' }}
          >
            <X size={18} />
          </button>

          {/* Success header */}
          <div className="p-8 pb-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', damping: 15 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{
                background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(52,211,153,0.1))',
                border: '2px solid rgba(52,211,153,0.4)',
              }}
            >
              <Award size={28} color="#34D399" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-text-primary mb-2"
            >
              {tierUpgraded ? 'Credit Tier Upgraded' : 'Repayment Confirmed'}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-text-secondary"
            >
              Your on-chain reputation has improved
            </motion.p>
          </div>

          {/* Metrics */}
          {showContent && (
            <div className="px-8 pb-8 space-y-6">
              {/* Score transition */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-xl p-5"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="text-xs uppercase tracking-[0.2em] text-text-muted mb-3 font-medium">
                  Credit Score
                </div>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-3xl font-bold text-text-muted">{oldScore}</span>
                  <TrendingUp size={20} color="#34D399" />
                  <span className="text-3xl font-bold" style={{ color: '#34D399' }}>
                    {newScore}
                  </span>
                  <div
                    className="ml-2 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: 'rgba(52,211,153,0.15)',
                      color: '#34D399',
                    }}
                  >
                    +{scoreDelta}
                  </div>
                </div>
              </motion.div>

              {/* Collateral improvement */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="rounded-xl p-5"
                style={{
                  background: 'linear-gradient(135deg, rgba(91,141,239,0.08), rgba(139,92,246,0.04))',
                  border: '1px solid rgba(91,141,239,0.15)',
                }}
              >
                <div className="text-xs uppercase tracking-[0.2em] text-text-muted mb-3 font-medium">
                  Collateral Requirement
                </div>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-3xl font-bold text-text-muted">{oldCollateral}%</span>
                  <TrendingUp size={20} color="#5B8DEF" className="rotate-180" />
                  <span className="text-3xl font-bold" style={{ color: '#5B8DEF' }}>
                    {newCollateral}%
                  </span>
                  <div
                    className="ml-2 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: 'rgba(91,141,239,0.15)',
                      color: '#5B8DEF',
                    }}
                  >
                    -{collateralDelta}%
                  </div>
                </div>
              </motion.div>

              {/* Capital efficiency impact */}
              {savingsUSD && savingsUSD > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="rounded-xl p-5 text-center"
                  style={{
                    background: 'rgba(201,168,76,0.08)',
                    border: '1px solid rgba(201,168,76,0.2)',
                  }}
                >
                  <div className="text-xs uppercase tracking-[0.2em] text-text-muted mb-2 font-medium">
                    Capital Efficiency Gain
                  </div>
                  <div className="text-2xl font-bold" style={{ color: '#C9A84C' }}>
                    ${fmtNumber(savingsUSD, 2)} saved
                  </div>
                  <div className="text-xs text-text-secondary mt-1">
                    on your next ${fmtNumber(parseFloat(formatEther(borrowAmount)), 0)} loan
                  </div>
                </motion.div>
              )}

              {/* Message */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center"
              >
                <p className="text-sm text-text-secondary leading-relaxed">
                  Your repayment history reduced collateral requirements from{' '}
                  <span className="font-semibold text-text-primary">{oldCollateral}%</span> to{' '}
                  <span className="font-semibold text-text-primary">{newCollateral}%</span>.
                  {tierUpgraded && ' You unlocked better borrowing terms.'}
                </p>
              </motion.div>

              {/* CTA */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                onClick={onClose}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: 'linear-gradient(135deg, #5B8DEF, #8B5CF6)',
                  color: '#fff',
                }}
              >
                Continue
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
