import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAccount, useReadContract } from 'wagmi'
import { AlertCircle } from 'lucide-react'
import { useCreditScore } from '../hooks/useCreditScore'
import { useLoan } from '../hooks/useLoan'
import { LENDING_POOL_ABI } from '../contracts/abis'
import { CONTRACT_ADDRESSES, addressesConfigured } from '../config/contracts'
import CreditPassport from '../components/CreditPassport'
import BorrowConfigurator from '../components/BorrowConfigurator'
import ActiveLoan from '../components/ActiveLoan'
import OracleStatus from '../components/OracleStatus'

export default function Dashboard({ toast }) {
  const { address, isConnected } = useAccount()
  const { score, scoreNumber, refetch: refetchScore, isLoading: scoreLoading } = useCreditScore()
  const { loan, deadline, isOverdue, isLiquidatable, refetch: refetchLoan, hasActiveLoan, isLoading: loanLoading } = useLoan()

  // Read collateral requirement
  const { data: collateralReq, refetch: refetchCollateral } = useReadContract({
    address: CONTRACT_ADDRESSES.lendingPool,
    abi: LENDING_POOL_ABI,
    functionName: 'getCollateralRequirement',
    args: [address],
    query: { enabled: !!address && !!CONTRACT_ADDRESSES.lendingPool },
  })

  function handleBorrowSuccess() {
    refetchLoan()
    refetchScore()
  }

  function handleRepaySuccess() {
    refetchLoan()
    refetchScore()
    refetchCollateral()
  }

  // Redirect if not connected
  useEffect(() => {
    if (!isConnected) {
      window.location.href = '/'
    }
  }, [isConnected])

  if (!addressesConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#08090a' }}>
        <div
          className="max-w-lg w-full rounded-2xl p-8 text-center"
          style={{
            background: 'rgba(248,113,113,0.05)',
            border: '1px solid rgba(248,113,113,0.15)',
          }}
        >
          <AlertCircle size={32} color="#F87171" className="mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">Contract Addresses Not Configured</h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            Copy <code className="px-2 py-1 rounded bg-black/30 font-mono text-xs">.env.example</code> to{' '}
            <code className="px-2 py-1 rounded bg-black/30 font-mono text-xs">.env</code> and fill in deployed contract addresses.
          </p>
          <div className="text-left bg-black/30 rounded-lg p-4 font-mono text-xs text-text-muted">
            VITE_LENDING_POOL_ADDRESS=0x...<br />
            VITE_REPUTATION_SCORE_ADDRESS=0x...<br />
            VITE_MOCK_DAI_ADDRESS=0x...
          </div>
        </div>
      </div>
    )
  }

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08090a' }}>
        <div className="text-text-muted">Redirecting...</div>
      </div>
    )
  }

  const isLoading = scoreLoading || loanLoading

  return (
    <div className="min-h-screen" style={{ background: '#08090a' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-3xl font-bold text-text-primary mb-2">Dashboard</h1>
          <p className="text-text-secondary">Manage your credit profile and active positions.</p>
        </motion.div>

        {/* Liquidation warning */}
        {isLiquidatable && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-xl p-5 flex items-start gap-3"
            style={{
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.2)',
            }}
          >
            <AlertCircle size={20} color="#F87171" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div className="font-semibold text-sm mb-1" style={{ color: '#F87171' }}>
                POSITION AT RISK
              </div>
              <div className="text-xs text-text-secondary leading-relaxed">
                Your loan is {isOverdue ? 'overdue' : 'undercollateralized'} and can be liquidated by anyone.
                {isOverdue
                  ? ' Your credit score will reset to 0 upon liquidation.'
                  : ' Add collateral or repay immediately to avoid liquidation.'}
              </div>
            </div>
          </motion.div>
        )}

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column: Credit Passport */}
          <div id="passport" className="lg:col-span-2">
            <CreditPassport
              score={score}
              collateralReq={collateralReq}
              loan={loan}
              isLoading={isLoading}
            />
          </div>

          {/* Right column: Oracle + actions */}
          <div className="space-y-6">
            <OracleStatus />

            {hasActiveLoan ? (
              <ActiveLoan
                loan={loan}
                deadline={deadline}
                isOverdue={isOverdue}
                isLiquidatable={isLiquidatable}
                onRepaid={handleRepaySuccess}
                toast={toast}
              />
            ) : (
              <div id="borrow">
                <BorrowConfigurator onSuccess={handleBorrowSuccess} toast={toast} />
              </div>
            )}
          </div>
        </div>

        {/* Product story */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div
            className="inline-block rounded-xl px-6 py-3"
            style={{
              background: 'rgba(91,141,239,0.04)',
              border: '1px solid rgba(91,141,239,0.1)',
            }}
          >
            <div className="text-xs uppercase tracking-[0.25em] text-text-muted mb-2">The Protocol Story</div>
            <div className="text-lg font-medium" style={{ color: '#5B8DEF' }}>
              REPAYMENT → REPUTATION → BETTER TERMS
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
