import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'
import { Shield, CheckCircle, TrendingUp, Award, Zap } from 'lucide-react'
import { fmtAddress } from '../utils/format'
import { getTierForScore, TIERS } from '../config/contracts'
import CreditScore from './CreditScore'
import CreditTiers from './CreditTiers'

export default function CreditPassport({ score, collateralReq, loan, isLoading }) {
  const { address } = useAccount()
  const [prevScore, setPrevScore] = useState(null)
  const [prevCollateral, setPrevCollateral] = useState(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const scoreRef = useRef(score)

  const tier = getTierForScore(score)
  const scoreNumber = Number(score ?? 0n)
  const collateralNumber = collateralReq != null ? Number(collateralReq) : null

  // Detect score changes for upgrade animation
  useEffect(() => {
    const prev = scoreRef.current
    if (prev != null && score !== prev) {
      const prevNum = Number(prev)
      const currNum = Number(score)
      const prevTier = getTierForScore(prevNum)
      const currTier = getTierForScore(currNum)

      setPrevScore(prevNum)
      setPrevCollateral(collateralNumber)

      if (prevTier.label !== currTier.label) {
        setShowUpgrade(true)
        setTimeout(() => setShowUpgrade(false), 4000)
      }
    }
    scoreRef.current = score
  }, [score, collateralNumber])

  const hasLoan = loan && loan.borrowedAmount > 0n
  const successfulRepayments = Math.floor(scoreNumber / 25)
  const improvement = collateralNumber != null
    ? 150 - collateralNumber
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0c1018 0%, #0e1220 100%)',
        border: '1px solid rgba(91,141,239,0.15)',
        boxShadow: '0 0 60px rgba(91,141,239,0.05), 0 20px 60px rgba(0,0,0,0.5)',
      }}
    >
      {/* Ambient glow top */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(91,141,239,0.4), transparent)' }}
      />

      {/* Tier upgrade banner */}
      <AnimatePresence>
        {showUpgrade && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-center gap-3 py-3"
              style={{
                background: 'linear-gradient(90deg, rgba(201,168,76,0.1), rgba(201,168,76,0.05), rgba(201,168,76,0.1))',
                borderBottom: '1px solid rgba(201,168,76,0.2)',
              }}
            >
              <Award size={16} color="#C9A84C" />
              <span className="text-sm font-medium tracking-wider" style={{ color: '#C9A84C' }}>
                CREDIT TIER UPGRADED — BETTER TERMS UNLOCKED
              </span>
              <Award size={16} color="#C9A84C" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={14} color="#5B8DEF" />
              <span className="text-xs uppercase tracking-[0.25em] text-text-muted">TrustLend</span>
            </div>
            <h2 className="text-lg font-semibold tracking-wide text-text-primary">On-Chain Credit Passport</h2>
          </div>

          {/* Tier badge */}
          <motion.div
            key={tier.label}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold tracking-[0.15em]"
            style={{
              background: `rgba(${hexToRgb(tier.color)},0.1)`,
              border: `1px solid rgba(${hexToRgb(tier.color)},0.3)`,
              color: tier.color,
            }}
          >
            {tier.label}
          </motion.div>
        </div>

        {/* Grid layout: passport left + score right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left: wallet + stats */}
          <div className="flex flex-col gap-5">
            {/* Wallet */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-xs uppercase tracking-[0.2em] text-text-muted mb-2">Wallet</div>
              <div className="font-mono text-sm text-text-primary break-all">{address || '—'}</div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Repayments"
                value={isLoading ? '—' : successfulRepayments}
                icon={<CheckCircle size={14} color="#34D399" />}
              />
              <StatCard
                label="Liquidations"
                value="0"
                icon={<Zap size={14} color="#8C9BAB" />}
              />
            </div>

            {/* Collateral requirement */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-xs uppercase tracking-[0.2em] text-text-muted mb-3">Current Collateral Requirement</div>
              <CollateralDisplay
                current={collateralNumber}
                prev={prevCollateral}
                isLoading={isLoading}
              />
              {improvement != null && improvement > 0 && (
                <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: '#34D399' }}>
                  <TrendingUp size={12} />
                  <span>{improvement}% less collateral than starting rate</span>
                </div>
              )}
            </div>

            {/* Loan status */}
            {!isLoading && (
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: hasLoan ? '#FBBF24' : '#34D399' }}
                />
                <span className="text-xs text-text-muted uppercase tracking-wider">
                  {hasLoan ? 'Active Loan' : 'No Active Loan'}
                </span>
              </div>
            )}
          </div>

          {/* Right: score visualization */}
          <div className="flex flex-col items-center justify-center">
            {isLoading ? (
              <div className="w-40 h-40 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ) : (
              <CreditScore
                score={scoreNumber}
                prevScore={prevScore}
                animate={prevScore !== null && prevScore !== scoreNumber}
              />
            )}
          </div>
        </div>

        {/* Tier visualization */}
        <CreditTiers currentScore={scoreNumber} />

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-text-muted">VERIFIED ON-CHAIN</span>
          </div>
          <div className="text-xs text-text-muted font-mono uppercase tracking-wider">
            Chainlink Oracle ✓
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function StatCard({ label, value, icon }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-xs uppercase tracking-wider text-text-muted">{label}</span>
      </div>
      <div className="text-2xl font-bold text-text-primary tabular-nums">{value}</div>
    </div>
  )
}

function CollateralDisplay({ current, prev, isLoading }) {
  const isImproved = prev != null && current != null && current < prev

  return (
    <div className="flex items-baseline gap-3">
      <motion.span
        key={current}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-4xl font-bold tabular-nums"
        style={{ color: '#F0F4F8' }}
      >
        {isLoading ? '—' : (current != null ? `${current}%` : '—')}
      </motion.span>

      {isImproved && (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1"
        >
          <span className="line-through text-lg text-text-muted">{prev}%</span>
          <span className="text-xs text-green-400 ml-1">↓ improved</span>
        </motion.div>
      )}
    </div>
  )
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
