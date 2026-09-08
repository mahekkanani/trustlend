import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { Minus, Plus, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { LENDING_POOL_ABI } from '../contracts/abis'
import { CONTRACT_ADDRESSES } from '../config/contracts'
import { useEthPrice } from '../hooks/useEthPrice'
import { useCreditScore } from '../hooks/useCreditScore'
import { fmtEthPrice, fmtEth, fmtNumber } from '../utils/format'
import { calcRequiredEth } from '../utils/calculations'

export default function BorrowConfigurator({ onSuccess, toast }) {
  const { address } = useAccount()
  const { price: ethPrice, isLoading: priceLoading } = useEthPrice()
  const { scoreNumber, refetch: refetchScore } = useCreditScore()
  const [borrowInput, setBorrowInput] = useState('')
  const [txHash, setTxHash] = useState(null)

  // Read collateral requirement for user
  const { data: collateralReq } = useReadContract({
    address: CONTRACT_ADDRESSES.lendingPool,
    abi: LENDING_POOL_ABI,
    functionName: 'getCollateralRequirement',
    args: [address],
    query: { enabled: !!address && !!CONTRACT_ADDRESSES.lendingPool },
  })

  // Read pool liquidity
  const { data: poolBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.lendingPool,
    abi: LENDING_POOL_ABI,
    functionName: 'availableEth',
    query: { enabled: !!CONTRACT_ADDRESSES.lendingPool },
  })

  const { writeContractAsync, isPending: isWritePending } = useWriteContract()

  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  useEffect(() => {
    if (isTxSuccess) {
      onSuccess?.()
      refetchScore()
      toast?.({ type: 'success', title: 'Loan opened', message: 'Your DAI has been sent. Repay within 7 days to build reputation.' })
      setBorrowInput('')
      setTxHash(null)
    }
  }, [isTxSuccess, onSuccess, refetchScore, toast])

  // Calculations
  const borrowAmountNum = parseFloat(borrowInput) || 0
  const borrowAmountWei = borrowAmountNum > 0 ? parseEther(String(borrowAmountNum)) : 0n
  const collateralPct = collateralReq != null ? Number(collateralReq) : 150
  const requiredEthWei = ethPrice && borrowAmountWei > 0n
    ? calcRequiredEth(borrowAmountWei, collateralPct, ethPrice)
    : 0n

  const requiredEthNum = parseFloat(formatEther(requiredEthWei))
  const ethPriceNum = ethPrice ? parseFloat(formatEther(ethPrice)) : 0
  const collateralValueUSD = requiredEthNum * ethPriceNum

  const isValid = borrowAmountNum > 0 && requiredEthWei > 0n
  const isPending = isWritePending || isTxConfirming

  async function handleBorrow() {
    if (!isValid || !address) return

    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.lendingPool,
        abi: LENDING_POOL_ABI,
        functionName: 'borrow',
        args: [borrowAmountWei],
        value: requiredEthWei,
      })
      setTxHash(hash)
      toast?.({ type: 'info', title: 'Transaction submitted', message: 'Waiting for confirmation...' })
    } catch (err) {
      const msg = err?.shortMessage ?? err?.message ?? 'Transaction failed'
      toast?.({ type: 'error', title: 'Transaction failed', message: msg })
    }
  }

  function adjustAmount(delta) {
    const current = parseFloat(borrowInput) || 0
    const next = Math.max(0, current + delta)
    setBorrowInput(next === 0 ? '' : String(next))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0c1018 0%, #0e1220 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="text-xs uppercase tracking-[0.2em] text-text-muted mb-1">New Position</div>
          <h3 className="text-lg font-semibold text-text-primary">Borrow Configurator</h3>
        </div>

        {/* Borrow amount input */}
        <div className="mb-6">
          <div className="text-xs uppercase tracking-[0.15em] text-text-muted mb-3">Borrow Amount</div>
          <div
            className="flex items-center rounded-xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <button
              onClick={() => adjustAmount(-100)}
              className="p-4 text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
            >
              <Minus size={16} />
            </button>
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-lg font-light">$</span>
              <input
                type="number"
                value={borrowInput}
                onChange={e => setBorrowInput(e.target.value)}
                placeholder="0.00"
                min="0"
                step="100"
                className="w-full bg-transparent text-2xl font-bold text-text-primary text-center py-4 outline-none tabular-nums"
                style={{ paddingLeft: '2rem', paddingRight: '2rem' }}
              />
            </div>
            <button
              onClick={() => adjustAmount(100)}
              className="p-4 text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="text-center text-xs text-text-muted mt-2 uppercase tracking-wider">DAI (USD-Pegged)</div>
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2 mb-6">
          {[100, 500, 1000, 5000].map(amt => (
            <button
              key={amt}
              onClick={() => setBorrowInput(String(amt))}
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-all hover:bg-white/8"
              style={{
                background: borrowAmountNum === amt ? 'rgba(91,141,239,0.15)' : 'rgba(255,255,255,0.04)',
                border: borrowAmountNum === amt ? '1px solid rgba(91,141,239,0.3)' : '1px solid rgba(255,255,255,0.06)',
                color: borrowAmountNum === amt ? '#5B8DEF' : '#8C9BAB',
              }}
            >
              ${amt.toLocaleString()}
            </button>
          ))}
        </div>

        {/* Calculation summary */}
        <div
          className="rounded-xl overflow-hidden mb-6"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <SummaryRow
            label="ETH Price"
            value={priceLoading ? '—' : fmtEthPrice(ethPrice)}
            sub="Chainlink Oracle"
            highlight={false}
          />
          <SummaryRow
            label="Credit Score"
            value={scoreNumber}
            sub="/ 100"
            highlight={false}
          />
          <SummaryRow
            label="Collateral Requirement"
            value={`${collateralPct}%`}
            sub={scoreNumber >= 75 ? 'Best tier' : 'Improve score for better terms'}
            highlight={false}
          />
          <SummaryRow
            label="Required ETH Collateral"
            value={borrowAmountNum > 0 ? fmtEth(requiredEthWei, 5) : '—'}
            sub={borrowAmountNum > 0 ? `≈ $${fmtNumber(collateralValueUSD)}` : null}
            highlight={true}
          />
          <SummaryRow
            label="Loan Duration"
            value="7 Days"
            sub="Repay on time to build score"
            highlight={false}
            noBorder
          />
        </div>

        {/* Score improvement hint */}
        {scoreNumber < 75 && (
          <div
            className="flex items-start gap-3 rounded-xl p-4 mb-6"
            style={{ background: 'rgba(91,141,239,0.05)', border: '1px solid rgba(91,141,239,0.1)' }}
          >
            <AlertCircle size={16} color="#5B8DEF" style={{ flexShrink: 0, marginTop: 2 }} />
            <div className="text-xs text-text-secondary leading-relaxed">
              Repay on time to earn +25 score. Higher score → lower collateral requirement.
              {scoreNumber === 0 && ' Next repayment unlocks 130% collateral tier.'}
              {scoreNumber === 25 && ' Next repayment unlocks 115% collateral tier.'}
              {scoreNumber === 50 && ' Next repayment unlocks the 90% best tier.'}
            </div>
          </div>
        )}

        {/* Borrow button */}
        <motion.button
          disabled={!isValid || isPending || !address}
          onClick={handleBorrow}
          whileHover={isValid && !isPending ? { scale: 1.01 } : {}}
          whileTap={isValid && !isPending ? { scale: 0.99 } : {}}
          className="w-full py-4 rounded-xl font-semibold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all"
          style={{
            background: isValid && !isPending
              ? 'linear-gradient(135deg, #5B8DEF, #8B5CF6)'
              : 'rgba(255,255,255,0.05)',
            color: isValid && !isPending ? '#fff' : '#4A5568',
            cursor: !isValid || isPending || !address ? 'not-allowed' : 'pointer',
            boxShadow: isValid && !isPending ? '0 4px 20px rgba(91,141,239,0.3)' : 'none',
          }}
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {isTxConfirming ? 'Confirming...' : 'Sign in Wallet...'}
            </>
          ) : (
            <>
              Borrow DAI
              <ArrowRight size={16} />
            </>
          )}
        </motion.button>

        {!address && (
          <p className="text-center text-xs text-text-muted mt-3">Connect wallet to borrow</p>
        )}
      </div>
    </motion.div>
  )
}

function SummaryRow({ label, value, sub, highlight, noBorder }) {
  return (
    <div
      className="flex items-center justify-between px-5 py-3.5"
      style={{
        borderBottom: noBorder ? 'none' : '1px solid rgba(255,255,255,0.04)',
        background: highlight ? 'rgba(91,141,239,0.04)' : 'transparent',
      }}
    >
      <div>
        <div className="text-xs uppercase tracking-wider text-text-muted">{label}</div>
        {sub && <div className="text-xs text-text-muted/60 mt-0.5">{sub}</div>}
      </div>
      <div
        className="text-sm font-semibold tabular-nums"
        style={{ color: highlight ? '#5B8DEF' : '#F0F4F8' }}
      >
        {value}
      </div>
    </div>
  )
}
