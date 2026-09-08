import { useReadContracts } from 'wagmi'
import { useAccount } from 'wagmi'
import { LENDING_POOL_ABI } from '../contracts/abis'
import { CONTRACT_ADDRESSES } from '../config/contracts'

/**
 * Read all loan-related state for the connected wallet in a single multicall.
 */
export function useLoan() {
  const { address } = useAccount()

  const lendingPoolContract = {
    address: CONTRACT_ADDRESSES.lendingPool,
    abi: LENDING_POOL_ABI,
  }

  const { data, isLoading, isError, refetch } = useReadContracts({
    contracts: [
      { ...lendingPoolContract, functionName: 'getLoan', args: [address] },
      { ...lendingPoolContract, functionName: 'getRepaymentDeadline', args: [address] },
      { ...lendingPoolContract, functionName: 'isOverdue', args: [address] },
      { ...lendingPoolContract, functionName: 'isLiquidatable', args: [address] },
    ],
    query: {
      enabled: !!address && !!CONTRACT_ADDRESSES.lendingPool,
      staleTime: 10_000,
    },
  })

  const loan = data?.[0]?.result ?? null
  const deadline = data?.[1]?.result ?? null
  const isOverdue = data?.[2]?.result ?? false
  const isLiquidatable = data?.[3]?.result ?? false

  const hasActiveLoan = loan != null && loan.borrowedAmount > 0n

  return {
    loan: hasActiveLoan ? loan : null,
    deadline,
    isOverdue,
    isLiquidatable,
    hasActiveLoan,
    isLoading,
    isError,
    refetch,
  }
}
