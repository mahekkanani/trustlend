import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAccount, useConnect } from 'wagmi'
import { useEffect } from 'react'
import { ArrowRight, TrendingDown, Shield, Zap } from 'lucide-react'
import BackgroundFX from '../components/BackgroundFX'

export default function Landing() {
  const { isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const navigate = useNavigate()

  useEffect(() => {
    if (isConnected) navigate('/dashboard')
  }, [isConnected, navigate])

  function handleConnect() {
    const connector = connectors[0]
    if (connector) {
      connect({ connector })
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#08090a' }}>
      <BackgroundFX />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Logo mark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
            style={{
              background: 'linear-gradient(135deg, rgba(91,141,239,0.15), rgba(139,92,246,0.1))',
              border: '1px solid rgba(91,141,239,0.2)',
            }}
          >
            <Shield size={24} color="#5B8DEF" />
          </motion.div>

          {/* Brand */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs uppercase tracking-[0.3em] text-text-muted mb-8"
          >
            TrustLend Protocol
          </motion.div>

          {/* Hero headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6"
            style={{
              background: 'linear-gradient(135deg, #F0F4F8 0%, #8C9BAB 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            YOUR REPAYMENT HISTORY
            <br />
            SHOULD LOWER
            <br />
            YOUR COLLATERAL.
          </h1>

          {/* Supporting text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed mb-12"
          >
            A reputation-powered lending protocol where responsible on-chain behavior unlocks better borrowing terms.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.button
              onClick={handleConnect}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative px-8 py-4 rounded-xl font-semibold text-sm tracking-wider uppercase overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #5B8DEF, #8B5CF6)',
                boxShadow: '0 8px 32px rgba(91,141,239,0.3)',
                color: '#fff',
              }}
            >
              <span className="relative z-10 flex items-center gap-2">
                CONNECT WALLET
                <ArrowRight size={16} />
              </span>
            </motion.button>

            <motion.a
              href="#how-it-works"
              whileHover={{ scale: 1.02 }}
              className="px-8 py-4 rounded-xl font-medium text-sm tracking-wider uppercase"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#8C9BAB',
              }}
            >
              SEE HOW IT WORKS
            </motion.a>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-px h-16 bg-gradient-to-b from-transparent via-border-DEFAULT to-transparent"
          />
        </motion.div>
      </div>

      {/* How it works section */}
      <div id="how-it-works" className="relative z-10 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-center mb-4"
            style={{ color: '#F0F4F8' }}
          >
            YOUR HISTORY HAS VALUE.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center text-text-secondary mb-16 max-w-2xl mx-auto"
          >
            Traditional DeFi treats everyone the same. TrustLend rewards responsible borrowers.
          </motion.p>

          {/* Tier progression */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-24">
            {[
              { score: '0', label: 'NEW', collateral: '150%', color: '#8C9BAB' },
              { score: '25', label: 'BASIC', collateral: '130%', color: '#5B8DEF' },
              { score: '50', label: 'TRUSTED', collateral: '115%', color: '#8B5CF6' },
              { score: '75+', label: 'ESTABLISHED', collateral: '90%', color: '#C9A84C' },
            ].map((tier, i) => (
              <motion.div
                key={tier.score}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl p-6 text-center"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="text-xs font-mono mb-2" style={{ color: tier.color }}>{tier.score}</div>
                <div className="text-sm font-semibold mb-3" style={{ color: tier.color }}>{tier.label}</div>
                <div className="text-3xl font-bold mb-1" style={{ color: '#F0F4F8' }}>{tier.collateral}</div>
                <div className="text-xs text-text-muted">collateral</div>
              </motion.div>
            ))}
          </div>

          {/* Process */}
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Borrow', text: 'Deposit ETH and borrow MockDAI.' },
              { icon: Zap, title: 'Repay responsibly', text: 'Repay within the 7-day window.' },
              { icon: TrendingDown, title: 'Unlock better terms', text: 'Higher reputation lowers collateral.' },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
                  style={{
                    background: 'rgba(91,141,239,0.08)',
                    border: '1px solid rgba(91,141,239,0.15)',
                  }}
                >
                  <step.icon size={20} color="#5B8DEF" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-text-primary">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative z-10 py-16 px-4 text-center"
      >
        <h2 className="text-2xl font-bold mb-6" style={{ color: '#F0F4F8' }}>
          Ready to build your on-chain credit?
        </h2>
        <motion.button
          onClick={handleConnect}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-8 py-4 rounded-xl font-semibold text-sm tracking-wider uppercase"
          style={{
            background: 'linear-gradient(135deg, #5B8DEF, #8B5CF6)',
            boxShadow: '0 8px 32px rgba(91,141,239,0.3)',
            color: '#fff',
          }}
        >
          CONNECT WALLET
        </motion.button>
      </motion.div>
    </div>
  )
}
