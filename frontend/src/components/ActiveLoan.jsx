import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits, maxUint256 } from 'viem'
import { Clock, AlertTriangle, CheckCircle, Loader2, ArrowRight, Zap } from 'lucide-react'
import { LENDING_POOL_ABI, MOCK_DAI_ABI, REPUTATION_SCORE_ABI } from '../contracts/abis'
import { CONTRACT_ADDRESSES } from '../config/contracts'
import { useEthPrice } from '../hooks/useEthPrice'
import { fmtEth, fmtCountdown, fmtTimestamp, fmtEthPrice } from '../utils/format'
import { calcHealthRatio, getLoanStatus } from '../utils/calculations'
import RepaymentSuccessModal from './RepaymentSuccessModal'

export default function ActiveLoan({ loan, deadline, isOverdue, isLiquidatable, onRepaid, toast }) {
  const { address } = useAccount()
  const { price: ethPrice } = useEthPrice()
  const [countdown, setCountdown] = useState(null)
  const [approveTxHash, setApproveTxHash] = useState(null)
  const [repayTxHash, setRepayTxHash] = useState(null)
  const [step, setStep] = useState('idle') // idle | checking | approving | repaying | done
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successData, setSuccessData] = useState(null)
  const scoreRef = useRef(null)
  const collateralRef = useRef(null)

  // Read user's actual collateral requirement (depends on reputation)
  const { data: collateralReq, refetch: refetchCollateral } = useReadContract({
    address: CONTRACT_ADDRESSES.lendingPool,
    abi: LENDING_POOL_ABI,
    functionName: 'getCollateralRequirement',
    args: [address],
    query: { enabled: !!address },
  })

  // Read user's credit score to capture before repayment
  const { data: creditScore, refetch: refetchScore } = useReadContract({
    address: CONTRACT_ADDRESSES.reputationScore,
    abi: REPUTATION_SCORE_ABI,
    functionName: 'getScore',
    args: [address],
    query: { enabled: !!address },
  })

  // Read current DAI allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.mockDai,
    abi: MOCK_DAI_ABI,
    functionName: 'allowance',
    args: [address, CONTRACT_ADDRESSES.lendingPool],
    query: { enabled: !!address && !!loan },
  })

  // Read DAI balance
  const { data: daiBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.mockDai,
    abi: MOCK_DAI_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: !!address && !!loan },
  })

  const { writeContractAsync } = useWriteContract()

  // Track approve tx
  const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({ hash: approveTxHash })
  // Track repay tx
  const { isSuccess: repayConfirmed, data: repayReceipt } = useWaitForTransactionReceipt({ hash: repayTxHash })

  // Capture score and collateral before repayment starts
  useEffect(() => {
    if (step === 'repaying' && creditScore != null && collateralReq != null) {
      scoreRef.current = Number(creditScore)
      collateralRef.current = Number(collateralReq)
    }
  }, [step, creditScore, collateralReq])

  // After approve confirmed, trigger repay
  useEffect(() => {
    if (approveConfirmed && step === 'approving') {
      refetchAllowance()
      toast?.({ type: 'info', title: 'Approval confirmed', message: 'Now submitting repayment...' })
      executeRepay()
    }
  }, [approveConfirmed])

  useEffect(() => {
    if (repayConfirmed) {
      setStep('done')

      // Wait briefly for blockchain state to update, then show modal
      setTimeout(async () => {
        // Refetch to get new score and collateral
        const newScoreResult = await refetchScore()
        const newCollateralResult = await refetchCollateral()

        const oldScore = scoreRef.current ?? 0
        const oldCollateral = collateralRef.current ?? 150
        const finalNewScore = newScoreResult.data != null ? Number(newScoreResult.data) : oldScore + 25
        const finalNewCollateral = newCollateralResult.data != null ? Number(newCollateralResult.data) : oldCollateral

        setSuccessData({
          oldScore,
          newScore: finalNewScore,
          oldCollateral,
          newCollateral: finalNewCollateral,
          borrowAmount: loan?.borrowedAmount,
        })
        setShowSuccessModal(true)

        onRepaid?.()
      }, 1500)
    }
  }, [repayConfirmed])

  // Countdown timer - updates every second for premium feel
  useEffect(() => {
    if (!deadline) return
    const update = () => setCountdown(fmtCountdown(deadline))
    update()
    const interval = setInterval(update, 1000) // Update every second
    return () => clearInterval(interval)
  }, [deadline])

  if (!loan || loan.borrowedAmount === 0n) return null

  const borrowedAmount = loan.borrowedAmount
  const collateralAmount = loan.collateralAmount
  const loanTimestamp = loan.timestamp

  // Use actual collateral requirement (depends on user's reputation score)
  const collateralPct = collateralReq != null ? Number(collateralReq) : 150

  const healthRatio = ethPrice
    ? calcHealthRatio(collateralAmount, borrowedAmount, collateralPct, ethPrice)
    : null
  const status = getLoanStatus(healthRatio, isOverdue)

  const borrowedNum = parseFloat(formatUnits(borrowedAmount, 18))
  const collateralEthStr = fmtEth(collateralAmount, 5)
  const collateralUSD = ethPrice
    ? (parseFloat(formatUnits(collateralAmount, 18)) * parseFloat(formatUnits(ethPrice, 18))).toFixed(2)
    : null

  const hasSufficientBalance = daiBalance != null && daiBalance >= borrowedAmount
  const hasSufficientAllowance = allowance != null && allowance >= borrowedAmount

  async function handleRepay() {
    if (!address || !loan) return
    setStep('checking')

    try {
      if (!hasSufficientAllowance) {
        setStep('approving')
        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.mockDai,
          abi: MOCK_DAI_ABI,
          functionName: 'approve',
          args: [CONTRACT_ADDRESSES.lendingPool, maxUint256],
        })
        setApproveTxHash(hash)
        toast?.({ type: 'info', title: 'Approval needed', message: 'Approving DAI spend...' })
      } else {
        await executeRepay()
      }
    } catch (err) {
      setStep('idle')
      const msg = err?.shortMessage ?? err?.message ?? 'Transaction failed'
      toast?.({ type: 'error', title: 'Error', message: msg })
    }
  }

  async function executeRepay() {
    try {
      setStep('repaying')
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.lendingPool,
        abi: LENDING_POOL_ABI,
        functionName: 'repay',
        args: [],
      })
      setRepayTxHash(hash)
      toast?.({ type: 'info', title: 'Repayment submitted', message: 'Waiting for confirmation...' })
    } catch (err) {
      setStep('idle')
      const msg = err?.shortMessage ?? err?.message ?? 'Repay failed'
      toast?.({ type: 'error', title: 'Repay failed', message: msg })
    }
  }

  const isPending = step === 'approving' || step === 'repaying' || step === 'checking'

  function handleModalClose() {
    setShowSuccessModal(false)
    setStep('idle')
  }

  return (
    <>
      <RepaymentSuccessModal
        isOpen={showSuccessModal}
        onClose={handleModalClose}
        oldScore={successData?.oldScore}
        newScore={successData?.newScore}
        oldCollateral={successData?.oldCollateral}
        newCollateral={successData?.newCollateral}
        borrowAmount={successData?.borrowAmount}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0c1018 0%, #0e1220 100%)',
          border: isOverdue
            ? '1px solid rgba(248,113,113,0.25)'
            : '1px solid rgba(251,191,36,0.15)',
          boxShadow: isOverdue
            ? '0 0 30px rgba(248,113,113,0.05)'
            : '0 0 30px rgba(251,191,36,0.03)',
        }}
      >
      {/* Status header strip */}
      <div
        className="px-6 py-3 flex items-center justify-between"
        style={{
          background: isOverdue ? 'rgba(248,113,113,0.06)' : 'rgba(251,191,36,0.04)',
          borderBottom: isOverdue ? '1px solid rgba(248,113,113,0.1)' : '1px solid rgba(251,191,36,0.08)',
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="relative flex h-2 w-2"
          >
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
              style={{ background: status.color }}
            />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: status.color }} />
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: status.color }}>
            ACTIVE LOAN — {status.label}
          </span>
        </div>

        {isOverdue && (
          <div className="flex items-center gap-1.5" style={{ color: '#F87171' }}>
            <AlertTriangle size={14} />
            <span className="text-xs uppercase tracking-wider">At risk of liquidation</span>
          </div>
        )}
      </div>

      <div className="p-6 sm:p-8">
        {/* Loan figures */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <LoanStat label="Borrowed" value={`$${borrowedNum.toLocaleString()}`} sub="DAI" />
          <LoanStat label="Collateral" value={collateralEthStr} sub={collateralUSD ? `≈ $${Number(collateralUSD).toLocaleString()}` : ''} />
          <LoanStat label="Health" value={healthRatio != null ? `${(healthRatio * 100).toFixed(0)}%` : '—'} sub="collateral ratio" color={status.color} />
        </div>

        {/* Timeline */}
        <div
          className="rounded-xl p-4 mb-6"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-text-muted mb-1.5">Opened</div>
              <div className="text-sm text-text-secondary">{loanTimestamp ? fmtTimestamp(loanTimestamp) : '—'}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-text-muted mb-1.5">Deadline</div>
              <div className="text-sm" style={{ color: isOverdue ? '#F87171' : '#F0F4F8' }}>
                {deadline ? fmtTimestamp(deadline) : '—'}
              </div>
            </div>
          </div>

          {/* Countdown */}
          {countdown && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={13} color={isOverdue ? '#F87171' : '#FBBF24'} />
                <span className="text-xs uppercase tracking-wider text-text-muted">
                  {isOverdue ? 'Overdue by' : 'Time Remaining'}
                </span>
              </div>
              <div
                className="text-2xl font-bold font-mono tracking-wider tabular-nums"
                style={{ color: isOverdue ? '#F87171' : '#F0F4F8' }}
              >
                {countdown.label}
              </div>
            </div>
          )}
        </div>

        {/* Repayment info */}
        <div
          className="flex items-center gap-3 rounded-xl p-4 mb-5"
          style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.12)' }}
        >
          <CheckCircle size={16} color="#34D399" style={{ flexShrink: 0 }} />
          <div className="text-xs text-text-secondary leading-relaxed">
            Repaying on time increases your credit score by <strong className="text-text-primary">+25</strong> and returns your ETH collateral.
          </div>
        </div>

        {/* Balance warnings */}
        {!hasSufficientBalance && daiBalance != null && (
          <div
            className="flex items-start gap-2 rounded-lg p-3 mb-4 text-xs"
            style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', color: '#F87171' }}
          >
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Insufficient DAI balance. You need {borrowedNum.toFixed(2)} DAI to repay.
              Your balance: {parseFloat(formatUnits(daiBalance, 18)).toFixed(2)} DAI.
            </span>
          </div>
        )}

        {/* Approve + Repay flow indicator */}
        <AnimatePresence mode="wait">
          {!hasSufficientAllowance && step === 'idle' && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-xs text-text-muted text-center mb-3"
            >
              Step 1: Approve DAI → Step 2: Repay loan
            </motion.div>
          )}
        </AnimatePresence>

        {/* Repay button */}
        <motion.button
          disabled={!hasSufficientBalance || isPending || step === 'done'}
          onClick={handleRepay}
          whileHover={hasSufficientBalance && !isPending ? { scale: 1.01 } : {}}
          whileTap={hasSufficientBalance && !isPending ? { scale: 0.99 } : {}}
          className="w-full py-4 rounded-xl font-semibold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all"
          style={{
            background: step === 'done'
              ? 'rgba(52,211,153,0.15)'
              : hasSufficientBalance && !isPending
                ? 'linear-gradient(135deg, #34D399, #059669)'
                : 'rgba(255,255,255,0.05)',
            color: step === 'done'
              ? '#34D399'
              : hasSufficientBalance && !isPending
                ? '#fff'
                : '#4A5568',
            cursor: !hasSufficientBalance || isPending ? 'not-allowed' : 'pointer',
            boxShadow: hasSufficientBalance && !isPending && step !== 'done'
              ? '0 4px 20px rgba(52,211,153,0.2)'
              : 'none',
          }}
        >
          {step === 'done' ? (
            <><CheckCircle size={16} /> Repayment Complete</>
          ) : isPending ? (
            <><Loader2 size={16} className="animate-spin" />
              {step === 'approving' ? 'Approving DAI...' : 'Repaying...'}
            </>
          ) : (
            <>Repay Loan <ArrowRight size={16} /></>
          )}
        </motion.button>
      </div>
    </motion.div>
    </>
  )
}

function LoanStat({ label, value, sub, color }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-text-muted mb-1">{label}</div>
      <div
        className="text-xl font-bold tabular-nums"
        style={{ color: color ?? '#F0F4F8' }}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-text-muted mt-0.5">{sub}</div>}
    </div>
  )
}
