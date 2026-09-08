import { useReadContract } from 'wagmi'
import { useAccount } from 'wagmi'
import { REPUTATION_SCORE_ABI } from '../contracts/abis'
import { CONTRACT_ADDRESSES } from '../config/contracts'

/**
 * Read the on-chain credit score for the connected wallet.
 * Automatically refetches when the account changes.
 */
export function useCreditScore() {
  const { address } = useAccount()

  const {
    data: score,
    isLoading,
    isError,
    refetch,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.reputationScore,
    abi: REPUTATION_SCORE_ABI,
    functionName: 'getScore',
    args: [address],
    query: {
      enabled: !!address && !!CONTRACT_ADDRESSES.reputationScore,
      staleTime: 10_000,
    },
  })

  return {
    score: score ?? 0n,
    scoreNumber: score != null ? Number(score) : 0,
    isLoading,
    isError,
    refetch,
  }
}
