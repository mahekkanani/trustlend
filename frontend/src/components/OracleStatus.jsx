import { motion } from 'framer-motion'
import { useEthPrice } from '../hooks/useEthPrice'
import { fmtEthPrice } from '../utils/format'
import { Database, RefreshCw } from 'lucide-react'

export default function OracleStatus() {
  const { price, isLoading, isError, isStale, onChainUpdatedAtSecs, isRefetching, refetch } = useEthPrice()

  // secsAgo is derived from the on-chain Chainlink updatedAt (seconds), not
  // from wagmi's JS cache timestamp (milliseconds), so the unit is correct.
  const secsAgo = onChainUpdatedAtSecs
    ? Math.floor(Date.now() / 1000) - onChainUpdatedAtSecs
    : null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="rounded-xl p-5"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-text-muted mb-1">ETH / USD</div>
          <div className="flex items-baseline gap-2">
            {isLoading ? (
              <div className="h-8 w-28 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
            ) : isError ? (
              <span className="text-2xl font-bold" style={{ color: '#F87171' }}>Oracle Error</span>
            ) : (
              <motion.span
                key={price?.toString()}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-text-primary tabular-nums"
              >
                {fmtEthPrice(price)}
              </motion.span>
            )}
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="p-1.5 rounded-lg transition-colors hover:bg-white/5 text-text-muted hover:text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh price"
        >
          <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Source row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Database size={12} color="#5B8DEF" />
          <span className="text-xs text-text-muted uppercase tracking-wider">Chainlink Oracle</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            {!isError && !isStale && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
            )}
            <span
              className="relative inline-flex rounded-full h-1.5 w-1.5"
              style={{ background: isError || isStale ? '#F87171' : '#34D399' }}
            />
          </span>
          <span className="text-xs text-text-muted uppercase tracking-wider">
            {isError ? 'ERROR' : isStale ? 'STALE' : 'LIVE'}
          </span>
        </div>

        {secsAgo != null && (
          <span className="text-xs text-text-muted">
            Updated {secsAgo < 5 ? 'just now' : `${secsAgo}s ago`}
          </span>
        )}
      </div>
    </motion.div>
  )
}
