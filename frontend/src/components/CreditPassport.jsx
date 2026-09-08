import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useReadContract } from 'wagmi'
import { Shield, CheckCircle, TrendingUp, Award, Copy, Check } from 'lucide-react'
import { getTierForScore } from '../config/contracts'
import { REPUTATION_SCORE_ABI, LENDING_POOL_ABI } from '../contracts/abis'
import { CONTRACT_ADDRESSES } from '../config/contracts'
import CreditScore from './CreditScore'
import CreditTiers from './CreditTiers'

export default function CreditPassport({ score, collateralReq, loan, isLoading }) {
  const { address } = useAccount()
  const [prevScore, setPrevScore] = useState(null)
  const [prevCollateral, setPrevCollateral] = useState(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [copied, setCopied] = useState(false)
  const scoreRef = useRef(score)

  const tier = getTierForScore(score)
  const scoreNumber = Number(score ?? 0n)
  const collateralNumber = collateralReq != null ? Number(collateralReq) : null

  // Current reputation streak (score/25) - not lifetime repayments
  // Liquidation resets score to 0, so this represents current streak only
  const currentStreak = Math.floor(scoreNumber / 25)

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
        setTimeout(() => setShowUpgrade(false), 5000)
      }
    }
    scoreRef.current = score
  }, [score, collateralNumber])

  const hasLoan = loan && loan.borrowedAmount > 0n
  const improvement = collateralNumber != null ? 150 - collateralNumber : null

  function copyAddress() {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function formatAddress(addr) {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a0d14 0%, #0d1018 50%, #0e1220 100%)',
        border: '1px solid rgba(91,141,239,0.2)',
        boxShadow: '0 0 80px rgba(91,141,239,0.08), 0 20px 60px rgba(0,0,0,0.6)',
      }}
    >
      {/* Animated top border glow */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <motion.div
          className="h-full"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(91,141,239,0.6), transparent)',
          }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Tier upgrade celebration banner */}
      <AnimatePresence>
        {showUpgrade && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <motion.div
              className="flex items-center justify-center gap-3 py-4"
              style={{
                background: 'linear-gradient(90deg, rgba(201,168,76,0.12), rgba(201,168,76,0.06), rgba(201,168,76,0.12))',
                borderBottom: '1px solid rgba(201,168,76,0.25)',
              }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Award size={18} color="#C9A84C" />
              <span className="text-sm font-semibold tracking-[0.15em] uppercase" style={{ color: '#C9A84C' }}>
                Credit Tier Upgraded — Better Terms Unlocked
              </span>
              <Award size={18} color="#C9A84C" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-8 sm:p-10">
        {/* Premium Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(91,141,239,0.15), rgba(139,92,246,0.1))',
                  border: '1px solid rgba(91,141,239,0.3)',
                }}
              >
                <Shield size={16} color="#5B8DEF" />
              </div>
              <span className="text-xs uppercase tracking-[0.3em] font-medium text-text-muted">TrustLend</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary mb-1">
              On-Chain Credit Passport
            </h2>
            <p className="text-xs text-text-muted">Verified decentralized credit profile</p>
          </div>

          {/* Tier badge - larger and more prominent */}
          <motion.div
            key={tier.label}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="px-4 py-2 rounded-xl text-sm font-bold tracking-[0.12em]"
            style={{
              background: `linear-gradient(135deg, rgba(${hexToRgb(tier.color)},0.15), rgba(${hexToRgb(tier.color)},0.08))`,
              border: `1.5px solid rgba(${hexToRgb(tier.color)},0.4)`,
              color: tier.color,
              boxShadow: `0 4px 16px rgba(${hexToRgb(tier.color)},0.15)`,
            }}
          >
            {tier.label}
          </motion.div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-10">
          {/* Left column: Identity & Stats - 2 cols */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Wallet address with copy */}
            <div
              className="rounded-xl p-5 relative overflow-hidden group"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: 'rgba(91,141,239,0.03)' }}
              />
              <div className="relative">
                <div className="text-[10px] uppercase tracking-[0.25em] text-text-muted mb-2 font-medium">
                  Wallet Address
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="font-mono text-base text-text-primary">
                    {formatAddress(address)}
                  </div>
                  <motion.button
                    onClick={copyAddress}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg transition-colors hover:bg-white/5"
                    style={{ color: copied ? '#34D399' : '#5B8DEF' }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </motion.button>
                </div>
                {copied && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-green-400 mt-1"
                  >
                    Copied!
                  </motion.div>
                )}
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 gap-4">
              <StatCard
                label="Current Streak"
                value={isLoading ? '—' : currentStreak}
                icon={<CheckCircle size={16} color="#34D399" />}
                subtitle="Consecutive on-time repayments"
              />
            </div>

            {/* Collateral improvement showcase */}
            <div
              className="rounded-xl p-5"
              style={{
                background: 'linear-gradient(135deg, rgba(91,141,239,0.04), rgba(139,92,246,0.02))',
                border: '1px solid rgba(91,141,239,0.12)',
              }}
            >
              <div className="text-[10px] uppercase tracking-[0.25em] text-text-muted mb-4 font-medium">
                Current Borrowing Terms
              </div>

              <CollateralDisplay
                current={collateralNumber}
                prev={prevCollateral}
                isLoading={isLoading}
              />

              {improvement != null && improvement > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-xs"
                  style={{ color: '#34D399' }}
                >
                  <TrendingUp size={13} />
                  <span className="font-medium">
                    {improvement}% improvement from initial tier
                  </span>
                </motion.div>
              )}
            </div>

            {/* Status indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                </div>
                <span className="text-xs text-text-muted uppercase tracking-wider font-medium">
                  {hasLoan ? 'Active Position' : 'Available to Borrow'}
                </span>
              </div>
              <span className="text-[10px] text-text-muted uppercase tracking-wider">
                Chainlink Verified ✓
              </span>
            </div>
          </div>

          {/* Right column: Score visualization - 3 cols */}
          <div className="lg:col-span-3 flex flex-col items-center justify-center">
            {isLoading ? (
              <div className="w-48 h-48 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ) : (
              <div className="w-full max-w-md">
                <CreditScore
                  score={scoreNumber}
                  prevScore={prevScore}
                  animate={prevScore !== null && prevScore !== scoreNumber}
                />
              </div>
            )}
          </div>
        </div>

        {/* Tier visualization */}
        <div className="mb-8">
          <CreditTiers currentScore={scoreNumber} />
        </div>

        {/* Footer verification */}
        <div className="pt-6 border-t border-white/5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-text-muted uppercase tracking-wide">On-Chain Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-text-muted uppercase tracking-wide">Chainlink Oracle</span>
              </div>
            </div>
            <div className="text-text-muted/50 font-mono">
              Chain ID: {import.meta.env.VITE_CHAIN_ID || '31337'}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function StatCard({ label, value, icon, subtitle }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-xl p-4"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">{label}</span>
      </div>
      <div className="text-3xl font-bold text-text-primary tabular-nums mb-1">{value}</div>
      {subtitle && <div className="text-xs text-text-muted">{subtitle}</div>}
    </motion.div>
  )
}

function CollateralDisplay({ current, prev, isLoading }) {
  const isImproved = prev != null && current != null && current < prev

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-4">
        <motion.span
          key={current}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl font-bold tabular-nums"
          style={{
            background: 'linear-gradient(135deg, #F0F4F8, #5B8DEF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {isLoading ? '—' : (current != null ? `${current}%` : '—')}
        </motion.span>

        {isImproved && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <span className="line-through text-xl text-text-muted/50 font-mono">{prev}%</span>
            <span className="text-xs text-green-400 font-medium">improved</span>
          </motion.div>
        )}
      </div>
      <div className="text-sm text-text-muted">Collateral Requirement</div>
    </div>
  )
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
